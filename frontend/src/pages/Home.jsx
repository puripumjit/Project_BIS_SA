import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../config';

const USER_NAME = 'HR Admin';

// ปรับ path ให้ตรงกับ route ของโปรเจกต์
const PATHS = {
  calculate: '/payroll/calculate',
  addEmployee: '/employees/permanent/new',
  attendance: '/attendance',
};

const THAI_MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
];
const THAI_SHORT = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

const periodLabel = (p) => {
  const [y, m] = String(p).split('-');
  return `${THAI_MONTHS[Number(m) - 1] || m} ${Number(y) + 543}`;
};

// วันกำหนดจ่าย = วันสิ้นเดือนของงวด (2026-09 -> 30 กันยายน 2569)
const payDateLabel = (p) => {
  const [y, m] = String(p).split('-').map(Number);
  if (!y || !m) return '-';
  const d = new Date(y, m, 0);
  return `${d.getDate()} ${THAI_MONTHS[d.getMonth()]} ${d.getFullYear() + 543}`;
};

// "2026-09-15" -> "15 ก.ย. 2569"
const toThaiDate = (dateStr) => {
  const [y, m, d] = (dateStr || '').slice(0, 10).split('-').map(Number);
  if (!y || !m || !d) return '-';
  return `${d} ${THAI_SHORT[m - 1]} ${y + 543}`;
};

const todayKey = () => {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const countType = (list, type) => list.filter((i) => i.employment_type === type).length;

const num = (v) => Number(v) || 0;
const baht = (v) =>
  num(v).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// สถานะจาก backend -> ป้ายไทย (ตรงกับหน้าบันทึกการเข้าทำงาน)
const STATUS_LABEL = {
  LATE: 'สาย',
  ABSENT: 'ขาด/ไม่ลงเวลา',
  LEAVE: 'ลา',
  SICK_LEAVE: 'ลาป่วย',
  PERSONAL_LEAVE: 'ลากิจ',
};
const LEAVE_KEYS = ['LEAVE', 'SICK_LEAVE', 'PERSONAL_LEAVE'];

const badgeClass = (key) => {
  if (key === 'LATE') return 'bg-[#F59E0B] text-white';
  if (key === 'ABSENT') return 'bg-[#EF4444] text-white';
  return 'bg-[#06B6D4] text-white'; // กลุ่มลา
};

const Icon = ({ d, className = 'w-6 h-6' }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d={d} />
  </svg>
);
const ICONS = {
  calendar: 'M8 7V3m8 4V3M4 11h16M5 5h14a1 1 0 011 1v13a1 1 0 01-1 1H5a1 1 0 01-1-1V6a1 1 0 011-1z',
  calc: 'M9 7h6M9 11h.01M12 11h.01M15 11h.01M9 15h.01M12 15h.01M15 15h.01M7 3h10a2 2 0 012 2v14a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2z',
  plus: 'M12 4v16m8-8H4',
  clock: 'M12 8v4l3 2m6-2a9 9 0 11-18 0 9 9 0 0118 0z',
  user: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM4 21v-1a6 6 0 016-6h4a6 6 0 016 6v1',
  users: 'M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-4.13a4 4 0 11-8 0 4 4 0 018 0zm6 0a3 3 0 11-6 0 3 3 0 016 0z',
  check: 'M5 13l4 4L19 7',
  wallet: 'M3 7a2 2 0 012-2h12v4M3 7v10a2 2 0 002 2h14a1 1 0 001-1v-3M3 7h16a1 1 0 011 1v3M16 14h5v-3h-5a1.5 1.5 0 000 3z',
};

const NOTI_TONE = {
  red: 'bg-red-50 text-red-500',
  amber: 'bg-amber-50 text-amber-500',
  cyan: 'bg-cyan-50 text-cyan-600',
  green: 'bg-emerald-50 text-emerald-600',
  blue: 'bg-blue-50 text-blue-600',
};

const CARD = 'bg-white rounded-2xl border border-slate-200 shadow-sm';

/* ---------- การ์ดจำนวนพนักงาน ---------- */
function StatCard({ gradient, icon, label, value, delta, loading }) {
  let deltaEl = null;
  if (loading) {
    deltaEl = <span className="text-slate-300">กำลังโหลด...</span>;
  } else if (delta === 0) {
    deltaEl = <span className="text-slate-500">เท่าเดิม จากเดือนที่แล้ว</span>;
  } else if (delta !== null && delta !== undefined) {
    const up = delta > 0;
    deltaEl = (
      <span className={up ? 'text-emerald-600' : 'text-red-500'}>
        <span className="font-bold">
          {up ? '↑' : '↓'} {Math.abs(delta)} คน
        </span>{' '}
        <span className="text-slate-500">จากเดือนที่แล้ว</span>
      </span>
    );
  }

  return (
    <div className={`${CARD} px-5 py-5 flex items-center gap-5`}>
      <div className={`w-16 h-16 rounded-2xl text-white flex items-center justify-center shrink-0 shadow-sm ${gradient}`}>
        <Icon d={icon} className="w-8 h-8" />
      </div>
      <div className="min-w-0">
        <div className="text-sm text-slate-500">{label}</div>
        <div className="text-3xl font-bold text-[#1E3A8A] leading-tight">
          {loading ? '-' : value}
          <span className="text-lg font-semibold ml-1.5">คน</span>
        </div>
        {deltaEl && <div className="text-xs mt-0.5">{deltaEl}</div>}
      </div>
    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();

  const [period, setPeriod] = useState('');
  const [items, setItems] = useState([]); // รายการเงินเดือนงวดล่าสุด
  const [prevItems, setPrevItems] = useState(null); // งวดก่อนหน้า (ถ้ามี)
  const [employees, setEmployees] = useState([]); // จาก /employees
  const [attendance, setAttendance] = useState([]); // จาก /attendance
  const [attError, setAttError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const getJson = (path) =>
    fetch(`${API_URL}${path}`).then((res) => {
      if (!res.ok) throw new Error(`เชื่อมต่อ ${path} ไม่สำเร็จ (รหัสสถานะ: ${res.status})`);
      return res.json();
    });

  const load = async () => {
    setLoading(true);
    setError(null);
    setAttError(null);

    try {
      const d = await getJson('/payroll');
      const periods = Array.isArray(d.periods) ? d.periods : [];
      setPeriod(d.period || '');
      setItems(Array.isArray(d.items) ? d.items : []);

      // งวดก่อนหน้า ใช้เทียบ "จากเดือนที่แล้ว" (ถ้าพังก็แค่ไม่แสดงส่วนต่าง)
      setPrevItems(null);
      if (periods.length > 1) {
        try {
          const d2 = await getJson(`/payroll?period=${encodeURIComponent(periods[1])}`);
          setPrevItems(Array.isArray(d2.items) ? d2.items : null);
        } catch {
          /* ignore */
        }
      }
    } catch (err) {
      console.error('Fetch Error:', err);
      setError(err.message);
    }

    // พนักงาน + การเข้างาน (แยกกัน เพื่อให้ส่วนอื่นยังแสดงได้ถ้าส่วนนี้พัง)
    try {
      const [emps, atts] = await Promise.all([getJson('/employees'), getJson('/attendance')]);
      setEmployees(Array.isArray(emps) ? emps : []);
      setAttendance(Array.isArray(atts) ? atts : []);
    } catch (err) {
      console.error('Fetch Error:', err);
      setAttError(err.message);
    }

    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  // ตัวเลขการ์ด: ใช้ /employees ถ้าได้ ไม่งั้นใช้จำนวนในงวดเงินเดือน
  const base = employees.length > 0 ? employees : items;
  const stats = {
    total: base.length,
    permanent: countType(base, 'ประจำ'),
    freelance: countType(base, 'ฟรีแลนซ์'),
  };
  // ส่วนต่างเทียบงวดก่อนหน้า (นับจากรายการเงินเดือนของทั้งสองงวด)
  const delta = (cur, prev) => (prevItems ? cur - prev : null);
  const deltas = {
    total: delta(items.length, prevItems ? prevItems.length : 0),
    permanent: delta(countType(items, 'ประจำ'), prevItems ? countType(prevItems, 'ประจำ') : 0),
    freelance: delta(countType(items, 'ฟรีแลนซ์'), prevItems ? countType(prevItems, 'ฟรีแลนซ์') : 0),
  };

  // รายการ ลา / สาย / ขาด ของ "วันนี้" ถ้าวันนี้ไม่มีข้อมูล ใช้วันล่าสุดที่มีรายการ
  const { dayRows, isToday, targetDate } = useMemo(() => {
    const empById = {};
    employees.forEach((e) => {
      empById[e.id] = e;
    });

    const abnormal = attendance
      .filter((a) => STATUS_LABEL[(a.status || '').toUpperCase()])
      .map((a) => {
        const key = (a.status || '').toUpperCase();
        const emp = empById[a.employee_id] || {};
        return {
          id: a.id,
          key,
          date: (a.work_date || '').slice(0, 10),
          code: emp.employee_code || `ID ${a.employee_id}`,
          name: emp.first_name ? `${emp.prefix || ''}${emp.first_name} ${emp.last_name}` : '-',
          department: emp.department || '-',
          type: emp.employment_type || '-',
        };
      })
      .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

    const t = todayKey();
    const target = abnormal.some((r) => r.date === t) ? t : abnormal[0]?.date || '';
    return {
      dayRows: abnormal.filter((r) => r.date === target),
      isToday: target === t,
      targetDate: target,
    };
  }, [attendance, employees]);

  const SHOW_MAX = 8;
  const shownRows = dayRows.slice(0, SHOW_MAX);

  const cntLate = dayRows.filter((r) => r.key === 'LATE').length;
  const cntAbsent = dayRows.filter((r) => r.key === 'ABSENT').length;
  const cntLeave = dayRows.filter((r) => LEAVE_KEYS.includes(r.key)).length;

  const draftCount = items.filter((i) => i.status === 'DRAFT').length;
  const approvedCount = items.filter((i) => i.status === 'APPROVED').length;

  // สรุปยอดเงินเดือนงวดล่าสุด (รายได้ / หัก / สุทธิ)
  // ใช้ค่าที่ backend (GET /payroll) คำนวณมาแล้ว: gross_income, total_deduction, net_pay
  const totals = items.reduce(
    (acc, i) => {
      acc.income += num(i.gross_income);
      acc.deduction += num(i.total_deduction);
      acc.net += num(i.net_pay);
      acc.tax += num(i.tax_amount);
      acc.sso += num(i.social_security);
      acc.lateAbsent += num(i.late_absence_deduction);
      acc.other += num(i.other_deduction) + num(i.extra_deduction);
      return acc;
    },
    { income: 0, deduction: 0, net: 0, tax: 0, sso: 0, lateAbsent: 0, other: 0 }
  );

  // การแจ้งเตือน: มาจากข้อมูลจริงทั้งหมด
  const notifications = [];
  if (cntLeave > 0)
    notifications.push({ tone: 'cyan', icon: ICONS.user, title: 'พนักงานลา', detail: `${cntLeave} รายการ` });
  if (cntLate > 0)
    notifications.push({ tone: 'amber', icon: ICONS.clock, title: 'พนักงานมาสาย', detail: `${cntLate} รายการ` });
  if (cntAbsent > 0)
    notifications.push({ tone: 'red', icon: ICONS.user, title: 'พนักงานขาดงาน / ไม่ลงเวลา', detail: `${cntAbsent} รายการ` });
  if (period) {
    if (draftCount > 0)
      notifications.push({
        tone: 'blue',
        icon: ICONS.calc,
        title: 'รอตรวจสอบและอนุมัติเงินเดือน',
        detail: `${draftCount} รายการ · รอบเดือน ${periodLabel(period)}`,
      });
    else if (approvedCount > 0)
      notifications.push({
        tone: 'blue',
        icon: ICONS.wallet,
        title: 'รอจ่ายเงินเดือน',
        detail: `${approvedCount} รายการ · รอบเดือน ${periodLabel(period)}`,
      });
    else if (items.length > 0)
      notifications.push({
        tone: 'green',
        icon: ICONS.check,
        title: 'คำนวณและจ่ายเงินเดือนเสร็จสิ้น',
        detail: `รอบเดือน ${periodLabel(period)}`,
      });
  }

  return (
    <div className="w-full text-slate-800 space-y-5">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center justify-between">
          <span>เกิดข้อผิดพลาด: {error}</span>
          <button onClick={load} className="underline font-semibold hover:text-red-900">ลองใหม่</button>
        </div>
      )}

      {/* แถบจำนวนพนักงาน */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          gradient="bg-gradient-to-br from-blue-500 to-blue-600"
          icon={ICONS.users}
          label="พนักงานทั้งหมด"
          value={stats.total}
          delta={deltas.total}
          loading={loading}
        />
        <StatCard
          gradient="bg-gradient-to-br from-emerald-400 to-emerald-600"
          icon={ICONS.users}
          label="พนักงานประจำ"
          value={stats.permanent}
          delta={deltas.permanent}
          loading={loading}
        />
        <StatCard
          gradient="bg-gradient-to-br from-violet-400 to-violet-600"
          icon={ICONS.user}
          label="Freelance"
          value={stats.freelance}
          delta={deltas.freelance}
          loading={loading}
        />
      </div>

      {/* สรุปยอดเงินเดือนงวดล่าสุด */}
      <div className={`${CARD} p-5`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-[#1E3A8A]">
            สรุปยอดเงินเดือน {period ? `รอบเดือน ${periodLabel(period)}` : ''}
          </h2>
          <button type="button" onClick={() => navigate(PATHS.calculate)} className="text-xs text-blue-600 hover:underline">
            ดูรายละเอียด
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-xl bg-emerald-50 px-4 py-4">
            <div className="text-sm text-emerald-700">ยอดจ่ายสุทธิรวม</div>
            <div className="text-2xl font-bold text-emerald-700">
              {loading ? '-' : baht(totals.net)} <span className="text-sm font-semibold">บาท</span>
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              รายได้รวม {loading ? '-' : baht(totals.income)} บาท
            </div>
          </div>

          <div className="rounded-xl bg-red-50 px-4 py-4">
            <div className="text-sm text-red-600">ยอดหักรวม</div>
            <div className="text-2xl font-bold text-red-600">
              {loading ? '-' : baht(totals.deduction)} <span className="text-sm font-semibold">บาท</span>
            </div>
            <div className="text-xs text-slate-500 mt-0.5">{items.length} รายการ</div>
          </div>

          <div className="rounded-xl bg-slate-50 px-4 py-4 text-xs space-y-1.5">
            <div className="text-sm font-semibold text-slate-700 mb-1">รายละเอียดการหัก</div>
            {[
              ['ภาษี', totals.tax],
              ['ประกันสังคม', totals.sso],
              ['สาย / ขาดงาน', totals.lateAbsent],
              ['อื่น ๆ (เงินกู้ กองทุน ฯลฯ)', totals.other],
            ].map(([label, v]) => (
              <div key={label} className="flex justify-between">
                <span className="text-slate-500">{label}</span>
                <span className="font-medium text-slate-800">{loading ? '-' : baht(v)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* พนักงานที่มีการลา / สาย / ขาดงาน */}
        <div className={`${CARD} lg:col-span-2 p-5`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-[#1E3A8A]">
              พนักงานที่มีการลา / สาย / ขาดงาน{' '}
              {isToday ? '(วันนี้)' : targetDate ? `(${toThaiDate(targetDate)})` : ''}
            </h2>
            <button type="button" onClick={() => navigate(PATHS.attendance)} className="text-xs text-blue-600 hover:underline">
              ดูทั้งหมด
            </button>
          </div>

          {attError && (
            <div className="mb-3 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
              เกิดข้อผิดพลาด: {attError}
            </div>
          )}

          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full text-xs">
              <thead className="bg-blue-50/70 text-slate-700 font-bold">
                <tr>
                  <th className="py-3 px-3 text-center w-14">ลำดับ</th>
                  <th className="py-3 px-3 text-left">รหัสพนักงาน</th>
                  <th className="py-3 px-3 text-left">ชื่อ-นามสกุล</th>
                  <th className="py-3 px-3 text-left">แผนก</th>
                  <th className="py-3 px-3 text-center">ประเภท</th>
                  <th className="py-3 px-3 text-center">สถานะ</th>
                  <th className="py-3 px-3 text-center">วันที่</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-slate-400">กำลังโหลดข้อมูล...</td>
                  </tr>
                ) : shownRows.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-slate-400">
                      ไม่มีรายการลา / สาย / ขาดงาน
                    </td>
                  </tr>
                ) : (
                  shownRows.map((r, i) => (
                    <tr key={r.id} className="hover:bg-slate-50/70">
                      <td className="py-3.5 px-3 text-center text-slate-500">{i + 1}</td>
                      <td className="py-3.5 px-3 font-medium text-slate-900 whitespace-nowrap">{r.code}</td>
                      <td className="py-3.5 px-3 whitespace-nowrap">{r.name}</td>
                      <td className="py-3.5 px-3 text-slate-600">{r.department}</td>
                      <td className="py-3.5 px-3 text-center text-slate-600">{r.type}</td>
                      <td className="py-3.5 px-3 text-center whitespace-nowrap">
                        <span className={`inline-block px-2.5 py-0.5 rounded-md text-[11px] font-semibold ${badgeClass(r.key)}`}>
                          {STATUS_LABEL[r.key]}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-center text-slate-600 whitespace-nowrap">{toThaiDate(r.date)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {dayRows.length > SHOW_MAX && (
            <div className="mt-3 text-center text-xs text-slate-500">
              แสดง {SHOW_MAX} จาก {dayRows.length} รายการ
            </div>
          )}
        </div>

        <div className="space-y-5">
          {/* การแจ้งเตือนล่าสุด */}
          <div className={`${CARD} p-5`}>
            <h2 className="font-bold text-[#1E3A8A] mb-4">การแจ้งเตือนล่าสุด</h2>
            {loading ? (
              <div className="py-6 text-center text-xs text-slate-400">กำลังโหลดข้อมูล...</div>
            ) : notifications.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">ยังไม่มีการแจ้งเตือน</div>
            ) : (
              <ul className="space-y-3.5">
                {notifications.map((n, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${NOTI_TONE[n.tone]}`}>
                      <Icon d={n.icon} className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium">{n.title}</div>
                      <div className="text-xs text-slate-500">{n.detail}</div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* กำหนดจ่ายเงินเดือน */}
          <div className={`${CARD} p-5 flex items-center gap-4`}>
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 text-white flex items-center justify-center shrink-0 shadow-sm">
              <Icon d={ICONS.calendar} className="w-7 h-7" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-[#1E3A8A]">กำหนดจ่ายเงินเดือน</div>
              <div className="text-lg font-bold text-slate-900">{period ? payDateLabel(period) : '-'}</div>
            </div>
            <button
              type="button"
              onClick={() => navigate(PATHS.calculate)}
              className="px-3 py-1.5 text-xs rounded-lg bg-blue-50 text-blue-700 font-semibold hover:bg-blue-100 shrink-0"
            >
              ดูรายละเอียด
            </button>
          </div>

          {/* ทางลัด */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'คำนวณเงินเดือน', icon: ICONS.calc, to: PATHS.calculate, cls: 'bg-blue-50 text-blue-700' },
              { label: 'เพิ่มพนักงาน', icon: ICONS.plus, to: PATHS.addEmployee, cls: 'bg-emerald-50 text-emerald-700' },
              { label: 'บันทึกการเข้างาน', icon: ICONS.clock, to: PATHS.attendance, cls: 'bg-violet-50 text-violet-700' },
            ].map((a) => (
              <button
                key={a.label}
                type="button"
                onClick={() => navigate(a.to)}
                className={`rounded-2xl border border-slate-200 shadow-sm p-3 flex flex-col items-center gap-2 text-xs font-semibold hover:shadow-md hover:-translate-y-0.5 transition ${a.cls}`}
              >
                <Icon d={a.icon} className="w-7 h-7" />
                <span className="text-center leading-tight">{a.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
