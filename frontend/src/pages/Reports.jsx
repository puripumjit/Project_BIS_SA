import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../config';

const SHORT_MONTHS = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.',
];

// ใส่วันที่ เช่น '2026-09-01' เพื่อทดสอบกับข้อมูลตัวอย่าง
// ปล่อย null เพื่อใช้วันที่ปัจจุบันตามเวลาไทย
const SHOW_DATE = '2026-09-01';

// endpoint ของ payroll
// ไม่ใส่ period = backend ส่งงวดล่าสุดที่มีข้อมูลให้ ถ้าต้องการงวดเจาะจง ใช้ '/payroll?period=2026-09'
const PAYROLL_PATH = '/payroll';

// ชื่อฟิลด์ตาม json tag ของ PayrollRow ใน Go
const PAYROLL_FIELDS = {
  net: 'net_pay',
  deduction: 'total_deduction',
  tax: 'tax_amount',
  socialSecurity: 'social_security',
};

// '2026-09' -> 'ก.ย. 69'
const periodToLabel = (period) => {
  const m = /^(\d{4})-(\d{2})$/.exec(period || '');
  if (!m) return period || '';
  const month = Number(m[2]);
  if (month < 1 || month > 12) return period;
  return `${SHORT_MONTHS[month - 1]} ${String((Number(m[1]) + 543) % 100).padStart(2, '0')}`;
};

const getBangkokToday = () =>
  new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' });

// งวดล่าสุด = เดือนก่อนหน้าของวันนี้ เช่น "ก.ย. 69"
const getLastPeriodLabel = (todayStr) => {
  let [y, m] = todayStr.split('-').map(Number);
  m -= 1;
  if (m === 0) {
    m = 12;
    y -= 1;
  }
  return `${SHORT_MONTHS[m - 1]} ${String((y + 543) % 100).padStart(2, '0')}`;
};

const toHHMM = (t) => (t ? t.slice(0, 5) : '-');

// escape ข้อความก่อนใส่ลง HTML ของรายงาน
const esc = (s) =>
  String(s ?? '').replace(/[&<>"]/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
  }[c]));

const ICON = {
  people:
    'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
  doc:
    'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  tax:
    'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
  bank:
    'M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z',
  download:
    'M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3',
};

function Icon({ path, className = 'w-6 h-6' }) {
  return (
    <svg
      className={`${className} stroke-current`}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth="2"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d={path} />
    </svg>
  );
}

export default function Reports() {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [attendances, setAttendances] = useState([]);
  const [payroll, setPayroll] = useState([]);
  const [payrollPeriod, setPayrollPeriod] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const realToday = getBangkokToday();
  const viewDate = SHOW_DATE || realToday;
  const fallbackPeriodLabel = getLastPeriodLabel(realToday);
  // ใช้งวดที่ backend ส่งมา (งวดล่าสุดที่มีข้อมูล) เพื่อให้ตรงกับตัวเลขในการ์ด
  const periodLabel = payrollPeriod
    ? periodToLabel(payrollPeriod)
    : fallbackPeriodLabel;

  const fetchData = () => {
    setLoading(true);
    setError(null);

    const getJson = (path) =>
      fetch(`${API_URL}${path}`).then((res) => {
        if (!res.ok) {
          throw new Error(
            `เชื่อมต่อ ${path} ไม่สำเร็จ (รหัสสถานะ: ${res.status})`
          );
        }
        return res.json();
      });

    // ถ้า payroll โหลดไม่สำเร็จ ให้การ์ดยอดเงินแสดง ----- ต่อไป
    // โดยไม่ทำให้ส่วนพนักงานและการเข้างานพังไปด้วย
    const getPayroll = () =>
      getJson(PAYROLL_PATH).catch((err) => {
        console.error('Payroll Fetch Error:', err);
        return { period: '', items: [] };
      });

    Promise.all([getJson('/employees'), getJson('/attendance'), getPayroll()])
      .then(([empData, attData, payData]) => {
        setEmployees(Array.isArray(empData) ? empData : []);
        setAttendances(Array.isArray(attData) ? attData : []);
        setPayroll(Array.isArray(payData?.items) ? payData.items : []);
        setPayrollPeriod(payData?.period || '');
        setLoading(false);
      })
      .catch((err) => {
        console.error('Fetch Error:', err);
        setError(err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchData();
  }, []);

  const dash = useMemo(() => {
    const active = employees.filter(
      (e) => (e.status || 'ACTIVE').toUpperCase() === 'ACTIVE'
    );
    const empById = Object.fromEntries(active.map((e) => [e.id, e]));

    const permanent = active.filter(
      (e) => e.employment_type === 'ประจำ'
    ).length;
    const freelance = active.filter(
      (e) => e.employment_type === 'ฟรีแลนซ์'
    ).length;

    const todayRows = attendances.filter(
      (a) =>
        (a.work_date || '').slice(0, 10) === viewDate &&
        empById[a.employee_id]
    );

    const countBy = (status) =>
      todayRows.filter(
        (a) => (a.status || '').toUpperCase() === status
      ).length;

    const late = countBy('LATE');
    const leave = countBy('LEAVE');
    const absent = countBy('ABSENT');

    // สถานะอื่นที่ไม่ใช่ LATE, LEAVE หรือ ABSENT จะถูกนับเป็นมาทำงานปกติ
    const present = todayRows.filter((a) => {
      const status = (a.status || '').toUpperCase();
      return status !== 'LATE' && status !== 'LEAVE' && status !== 'ABSENT';
    }).length;

    const lateRows = todayRows
      .filter((a) => (a.status || '').toUpperCase() === 'LATE')
      .map((a) => {
        const e = empById[a.employee_id];
        return {
          id: a.id,
          employee_code: e.employee_code,
          name: `${e.prefix || ''}${e.first_name} ${e.last_name}`,
          department: e.department || '-',
          time: toHHMM(a.check_in),
        };
      })
      .sort((a, b) => b.time.localeCompare(a.time));

    return {
      permanent,
      freelance,
      total: permanent + freelance,
      present,
      late,
      leave,
      absent,
      attendanceTotal: todayRows.length,
      lateRows,
    };
  }, [employees, attendances, viewDate]);

  // ยอดรวมจาก payroll
  const totals = useMemo(() => {
    const sum = (key) =>
      payroll.reduce((acc, p) => acc + Number(p[key] || 0), 0);

    return {
      net: sum(PAYROLL_FIELDS.net),
      deduction: sum(PAYROLL_FIELDS.deduction),
      tax: sum(PAYROLL_FIELDS.tax),
      socialSecurity: sum(PAYROLL_FIELDS.socialSecurity),
    };
  }, [payroll]);

  const hasPayroll = !loading && payroll.length > 0;

  // วงกลมแสดงสถานะการเข้างานวันนี้ แยก 4 สี
  const attendanceStats = [
    { label: 'มาทำงานปกติ', color: '#22C55E', value: dash.present },
    { label: 'มาสาย', color: '#F59E0B', value: dash.late },
    { label: 'ลา', color: '#06B6D4', value: dash.leave },
    { label: 'ขาดงาน', color: '#EF4444', value: dash.absent },
  ];

  let offset = 0;
  const arcs = attendanceStats.map((s) => {
    const pct =
      dash.attendanceTotal > 0
        ? (s.value / dash.attendanceTotal) * 100
        : 0;
    const arc = { ...s, pct, offset };
    offset += pct;
    return arc;
  });

  // value = null จะแสดง -----
  const summaryCards = [
    {
      label: 'เงินเดือนรวมสุทธิ',
      value: hasPayroll ? totals.net : null,
      icon: ICON.people,
      tone: 'bg-blue-50 text-blue-600',
    },
    {
      label: 'รายการหักรวม',
      value: hasPayroll ? totals.deduction : null,
      icon: ICON.doc,
      tone: 'bg-slate-100 text-slate-600',
    },
    {
      label: 'ภาษีหัก ณ ที่จ่าย',
      value: hasPayroll ? totals.tax : null,
      icon: ICON.tax,
      tone: 'bg-purple-50 text-purple-600',
    },
    {
      label: 'ประกันสังคม',
      value: hasPayroll ? totals.socialSecurity : null,
      icon: ICON.bank,
      tone: 'bg-emerald-50 text-emerald-600',
    },
  ];

  const formatBaht = (v) =>
    v == null
      ? '-----'
      : Number(v).toLocaleString('th-TH', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });

  /* ---------- ออกรายงาน PDF (เปิดหน้าต่างพิมพ์ แล้วเลือก "บันทึกเป็น PDF") ---------- */
  const handleExportPdf = () => {
    if (!hasPayroll) {
      alert('ยังไม่มีข้อมูลเงินเดือนให้ออกรายงาน');
      return;
    }
    const w = window.open('', '_blank');
    if (!w) {
      alert('เบราว์เซอร์บล็อกหน้าต่างใหม่ กรุณาอนุญาต pop-up แล้วลองอีกครั้ง');
      return;
    }

    // ยอดก่อนหัก = สุทธิ + รายการหัก (ใน API ไม่มีฟิลด์เงินเดือนก่อนหัก)
    const gross = totals.net + totals.deduction;
    const empById = Object.fromEntries(employees.map((e) => [e.id, e]));
    const printedAt = new Date().toLocaleString('th-TH', {
      timeZone: 'Asia/Bangkok',
    });

    const rows = payroll
      .map((p, i) => {
        const e = empById[p.employee_id] || {};
        const name = e.first_name
          ? `${e.prefix || ''}${e.first_name} ${e.last_name}`
          : '-';
        const rowGross =
          Number(p[PAYROLL_FIELDS.net] || 0) +
          Number(p[PAYROLL_FIELDS.deduction] || 0);
        return `<tr>
          <td class="c">${i + 1}</td>
          <td>${esc(e.employee_code || p.employee_id || '-')}</td>
          <td>${esc(name)}</td>
          <td class="r">${formatBaht(rowGross)}</td>
          <td class="r">${formatBaht(p[PAYROLL_FIELDS.tax])}</td>
          <td class="r">${formatBaht(p[PAYROLL_FIELDS.socialSecurity])}</td>
          <td class="r">${formatBaht(p[PAYROLL_FIELDS.deduction])}</td>
          <td class="r b">${formatBaht(p[PAYROLL_FIELDS.net])}</td>
        </tr>`;
      })
      .join('');

    w.document.write(`<!doctype html><html lang="th"><head><meta charset="utf-8">
    <title>รายงานสรุปเงินเดือน ${esc(periodLabel)}</title>
    <style>
      @page { size: A4; margin: 16mm; }
      body { font-family: 'Sarabun','Tahoma',sans-serif; color:#0f172a; font-size:12px; }
      h1 { font-size:20px; margin:0 0 2px; color:#1E3A8A; }
      .sub { color:#64748b; margin-bottom:16px; }
      h2 { font-size:14px; margin:18px 0 8px; color:#1E3A8A; }
      .grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
      .card { border:1px solid #cbd5e1; border-radius:8px; padding:10px 12px; }
      .card .l { color:#64748b; font-size:11px; }
      .card .v { font-size:16px; font-weight:700; margin-top:2px; }
      .net .v { color:#15803d; }
      table { width:100%; border-collapse:collapse; }
      th { background:#e5e7eb; padding:6px; text-align:left; }
      td { padding:5px 6px; border-bottom:1px solid #e2e8f0; }
      tfoot td { font-weight:700; border-top:2px solid #94a3b8; background:#f8fafc; }
      .c { text-align:center; } .r { text-align:right; } .b { font-weight:700; }
      tr { page-break-inside: avoid; }
      .foot { margin-top:16px; color:#94a3b8; font-size:10px; text-align:right; }
    </style></head><body>
      <h1>รายงานสรุปเงินเดือน</h1>
      <div class="sub">งวด ${esc(periodLabel)} · พนักงาน ${dash.total} คน
        (ประจำ ${dash.permanent} / ฟรีแลนซ์ ${dash.freelance})</div>

      <h2>สรุปรายจ่าย</h2>
      <div class="grid">
        <div class="card"><div class="l">ค่าใช้จ่ายเงินเดือนรวม (ก่อนหัก)</div><div class="v">${formatBaht(gross)} บาท</div></div>
        <div class="card net"><div class="l">จ่ายพนักงานจริง (สุทธิ)</div><div class="v">${formatBaht(totals.net)} บาท</div></div>
        <div class="card"><div class="l">ภาษีหัก ณ ที่จ่าย</div><div class="v">${formatBaht(totals.tax)} บาท</div></div>
        <div class="card"><div class="l">ประกันสังคม</div><div class="v">${formatBaht(totals.socialSecurity)} บาท</div></div>
        <div class="card"><div class="l">รายการหักรวมทั้งหมด</div><div class="v">${formatBaht(totals.deduction)} บาท</div></div>
      </div>

      <h2>รายละเอียดรายคน</h2>
      <table>
        <thead><tr>
          <th class="c">#</th><th>รหัส</th><th>ชื่อ-นามสกุล</th>
          <th class="r">ก่อนหัก</th><th class="r">ภาษี</th><th class="r">ปกส.</th>
          <th class="r">หักรวม</th><th class="r">สุทธิ</th>
        </tr></thead>
        <tbody>${rows}</tbody>
        <tfoot><tr>
          <td colspan="3">รวม</td>
          <td class="r">${formatBaht(gross)}</td>
          <td class="r">${formatBaht(totals.tax)}</td>
          <td class="r">${formatBaht(totals.socialSecurity)}</td>
          <td class="r">${formatBaht(totals.deduction)}</td>
          <td class="r">${formatBaht(totals.net)}</td>
        </tr></tfoot>
      </table>
      <div class="foot">พิมพ์เมื่อ ${esc(printedAt)}</div>
    </body></html>`);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 400); // รอให้เรนเดอร์ก่อน แล้วเลือก "บันทึกเป็น PDF"
  };

  const recentReports = [
    { title: `รายงานสรุปเงินเดือนรวม - ${periodLabel}`, to: '/payroll/calculate' },
    { title: `รายงานภาษี - ${periodLabel}`, to: '/payroll/tax' },
    {
      title: `รายงานประกันสังคม - ${periodLabel}`,
      to: '/payroll/social-security',
    },
    { title: 'ประวัติการลาพนักงาน', to: '/leaves' },
  ];

  const num = (v) => (loading ? '-' : v);

  return (
    <div className="w-full text-slate-800 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-slate-900">แดชบอร์ดภาพรวม</h1>
        <button
          type="button"
          onClick={handleExportPdf}
          disabled={!hasPayroll}
          className="inline-flex items-center gap-2 bg-[#2563EB] hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold px-5 py-2.5 rounded-xl cursor-pointer"
        >
          <Icon path={ICON.download} className="w-4 h-4" />
          ดาวน์โหลดรายงาน PDF
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 flex items-center justify-between text-xs">
          <span>เกิดข้อผิดพลาด: {error}</span>
          <button
            onClick={fetchData}
            className="underline hover:text-red-800 font-semibold"
          >
            ลองใหม่
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((c) => (
          <div
            key={c.label}
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4"
          >
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${c.tone}`}
            >
              <Icon path={c.icon} />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500">{c.label}</p>
              <p className="text-base font-bold text-slate-900 mt-0.5">
                {formatBaht(c.value)} บาท
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <h2 className="text-base font-bold text-slate-900 mb-4">
            สถานะการเข้างานวันนี้
          </h2>

          <div className="flex flex-col sm:flex-row items-center justify-around gap-6 py-2">
            <div className="relative w-44 h-44 flex items-center justify-center shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <circle
                  cx="18"
                  cy="18"
                  r="14"
                  fill="none"
                  stroke="#E2E8F0"
                  strokeWidth="5"
                />
                {arcs.map((a) =>
                  a.pct > 0 ? (
                    <circle
                      key={a.label}
                      cx="18"
                      cy="18"
                      r="14"
                      fill="none"
                      stroke={a.color}
                      strokeWidth="5"
                      pathLength="100"
                      strokeDasharray={`${a.pct} ${100 - a.pct}`}
                      strokeDashoffset={-a.offset}
                    />
                  ) : null
                )}
              </svg>
            </div>

            <div className="space-y-3.5 w-full sm:w-auto text-xs">
              {arcs.map((a) => (
                <div
                  key={a.label}
                  className="flex items-center justify-between sm:justify-start gap-8"
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-3.5 h-3.5 rounded-full shrink-0"
                      style={{ backgroundColor: a.color }}
                    />
                    <span className="font-semibold text-slate-700">
                      {a.label}
                    </span>
                  </div>
                  <span className="font-bold text-slate-900 text-sm">
                    {num(a.value)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="text-right text-xs font-semibold text-slate-600 mt-4 border-t border-slate-100 pt-3">
            รายการเข้างานวันนี้{' '}
            <span className="font-bold text-slate-900 text-sm">
              {num(dash.attendanceTotal)}
            </span>{' '}
            รายการ
          </div>
        </div>

        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <h2 className="text-base font-bold text-slate-900 mb-4">รายงานล่าสุด</h2>
          <div className="space-y-4">
            {recentReports.map((r) => (
              <button
                key={r.title}
                onClick={() => navigate(r.to)}
                className="w-full text-left flex items-center gap-3.5 p-2 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer group"
              >
                <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-600 flex items-center justify-center shrink-0 transition-colors">
                  <Icon path={ICON.doc} className="w-5 h-5" />
                </div>
                <span className="text-xs font-medium text-slate-700 group-hover:text-blue-600 transition-colors">
                  {r.title}
                </span>
              </button>
            ))}
          </div>
          <div className="mt-4 pt-2 text-right">
            <button
              onClick={() => navigate('/reports')}
              className="text-xs text-blue-600 hover:underline font-semibold cursor-pointer"
            >
              ดูรายงานทั้งหมด &rarr;
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-5 pb-3">
          <h2 className="text-base font-bold text-slate-900">
            พนักงานมาสายวันนี้
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#E5E7EB] text-slate-800 font-bold border-b border-slate-300">
                <th className="py-3.5 px-4 text-center">รหัสพนักงาน</th>
                <th className="py-3.5 px-4">ชื่อ - นามสกุล</th>
                <th className="py-3.5 px-4 text-center">แผนก</th>
                <th className="py-3.5 px-4 text-center">เวลามาถึง</th>
                <th className="py-3.5 px-4 text-center">สถานะ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-slate-400">
                    กำลังโหลดข้อมูล...
                  </td>
                </tr>
              ) : dash.lateRows.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-slate-400">
                    ไม่มีพนักงานมาสายในวันนี้
                  </td>
                </tr>
              ) : (
                dash.lateRows.map((row) => (
                  <tr
                    key={row.id}
                    className="hover:bg-slate-50/70 transition-colors"
                  >
                    <td className="py-3.5 px-4 text-center font-medium text-slate-900">
                      {row.employee_code}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-800 whitespace-nowrap">
                      {row.name}
                    </td>
                    <td className="py-3.5 px-4 text-center text-slate-600">
                      {row.department}
                    </td>
                    <td className="py-3.5 px-4 text-center font-medium text-slate-700">
                      {row.time} น.
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <span className="inline-block px-3 py-0.5 rounded-md text-[11px] font-semibold bg-[#F59E0B] text-white">
                        มาสาย
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
