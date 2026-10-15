import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../config';

const DETAIL_PATH = '/payroll/calculate';
const SLIP_PATH = '/payroll/slip';
const PAGE_SIZE = 10;

const THAI_MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
];

// '2026-09' -> 'กันยายน 2569'
const periodLabel = (p) => {
  const [y, m] = String(p).split('-');
  return `${THAI_MONTHS[Number(m) - 1] || m} ${Number(y) + 543}`;
};

const fmt = (n) =>
  Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

const selectClass =
  'w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500';

function StatCard({ icon, label, value, unit }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-6 py-5 flex items-center gap-5">
      <div className="text-[#1E3A8A] shrink-0">{icon}</div>
      <div>
        <div className="text-sm font-bold text-[#1E3A8A]">{label}</div>
        <div className="text-2xl font-bold text-[#1E3A8A] leading-tight">
          {value}
          {unit && <span className="text-base font-bold ml-1.5">{unit}</span>}
        </div>
      </div>
    </div>
  );
}

const PeopleIcon = () => (
  <svg className="w-12 h-12 fill-current" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
  </svg>
);
const WalletIcon = () => (
  <svg className="w-12 h-12" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 7a2 2 0 012-2h12v4M3 7v10a2 2 0 002 2h14a1 1 0 001-1v-3M3 7h16a1 1 0 011 1v3M16 14h5v-3h-5a1.5 1.5 0 000 3z" />
  </svg>
);
const PieIcon = () => (
  <svg className="w-12 h-12" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v9h9a9 9 0 11-9-9zM15 3.5A9 9 0 0120.5 9H15V3.5z" />
  </svg>
);

export default function PayrollCalculate() {
  const navigate = useNavigate();

  // selectedPeriod = '' หมายถึงให้ backend ส่งงวดล่าสุดมา
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [data, setData] = useState({ period: '', periods: [], items: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [department, setDepartment] = useState('');
  const [type, setType] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const qs = selectedPeriod ? `?period=${encodeURIComponent(selectedPeriod)}` : '';
    fetch(`${API_URL}/payroll${qs}`)
      .then((res) => {
        if (!res.ok) throw new Error(`โหลดข้อมูลไม่สำเร็จ (รหัสสถานะ: ${res.status})`);
        return res.json();
      })
      .then((d) => {
        setData({
          period: d.period || '',
          periods: Array.isArray(d.periods) ? d.periods : [],
          items: Array.isArray(d.items) ? d.items : [],
        });
        setLoading(false);
      })
      .catch((err) => {
        console.error('Fetch Error:', err);
        setError(err.message);
        setLoading(false);
      });
  }, [selectedPeriod]);

  const departments = useMemo(
    () => [...new Set(data.items.map((i) => i.department).filter(Boolean))],
    [data.items]
  );
  const types = useMemo(
    () => [...new Set(data.items.map((i) => i.employment_type).filter(Boolean))],
    [data.items]
  );

  const filtered = useMemo(() => {
    const kw = q.trim().toLowerCase();
    return data.items.filter(
      (i) =>
        (!department || i.department === department) &&
        (!type || i.employment_type === type) &&
        (!kw || `${i.first_name} ${i.last_name} ${i.employee_code}`.toLowerCase().includes(kw))
    );
  }, [data.items, department, type, q]);

  const totalNet = filtered.reduce((s, i) => s + i.net_pay, 0);
  const totalDeduction = filtered.reduce((s, i) => s + i.total_deduction, 0);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const start = (safePage - 1) * PAGE_SIZE;
  const pageItems = filtered.slice(start, start + PAGE_SIZE);

  const pageNumbers = [];
  for (let p = Math.max(1, safePage - 2); p <= Math.min(pageCount, safePage + 2); p++) {
    pageNumbers.push(p);
  }

  const onFilter = (setter) => (e) => {
    setter(e.target.value);
    setPage(1);
  };

  return (
    <div className="w-full text-slate-800">
      <h1 className="text-xl font-bold text-[#000000] mb-4">การคำนวณเงินเดือน</h1>

      {/* ตัวกรอง */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 mb-5">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-xs font-bold text-[#1E3A8A] mb-1.5">รอบเงินเดือน</label>
            <select
              value={data.period}
              onChange={(e) => {
                setSelectedPeriod(e.target.value);
                setPage(1);
              }}
              className={selectClass}
            >
              {data.periods.length === 0 && <option value="">ไม่มีข้อมูล</option>}
              {data.periods.map((p) => (
                <option key={p} value={p}>{periodLabel(p)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-[#1E3A8A] mb-1.5">แผนก</label>
            <select value={department} onChange={onFilter(setDepartment)} className={selectClass}>
              <option value="">ทั้งหมด</option>
              {departments.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-[#1E3A8A] mb-1.5">ประเภทพนักงาน</label>
            <select value={type} onChange={onFilter(setType)} className={selectClass}>
              <option value="">ทั้งหมด</option>
              {types.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <input
              type="search"
              value={q}
              onChange={onFilter(setQ)}
              placeholder="ค้นหาชื่อพนักงาน, รหัสพนักงาน..."
              className={selectClass}
            />
          </div>
        </div>
      </div>

      {/* การ์ดสรุป */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatCard icon={<PeopleIcon />} label="พนักงานทั้งหมด" value={filtered.length} unit="คน" />
        <StatCard icon={<WalletIcon />} label="เงินเดือนสุทธิ" value={fmt(totalNet)} unit="บาท" />
        <StatCard icon={<PieIcon />} label="รายการหักรวม" value={fmt(totalDeduction)} unit="บาท" />
      </div>

      <h2 className="text-lg font-bold text-[#1E3A8A] mb-3">รายการคำนวณเงินเดือน</h2>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
          เกิดข้อผิดพลาด: {error}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead className="bg-[#E5E7EB] text-slate-800 font-bold">
              <tr>
                <th className="py-3 px-3 text-center">ลำดับ</th>
                <th className="py-3 px-3 text-center">รหัสพนักงาน</th>
                <th className="py-3 px-3 text-left">ชื่อ-นามสกุล</th>
                <th className="py-3 px-3 text-center">แผนก</th>
                <th className="py-3 px-3 text-center">ตำแหน่ง</th>
                <th className="py-3 px-3 text-center">ประเภท</th>
                <th className="py-3 px-3 text-right">เงินเดือน</th>
                <th className="py-3 px-3 text-right">OT</th>
                <th className="py-3 px-3 text-right">รายได้อื่นๆ</th>
                <th className="py-3 px-3 text-right">ลา/สาย</th>
                <th className="py-3 px-3 text-right">ภาษี</th>
                <th className="py-3 px-3 text-right">ประกันสังคม</th>
                <th className="py-3 px-3 text-right">หักอื่นๆ</th>
                <th className="py-3 px-3 text-center">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="14" className="py-8 text-center text-slate-400">กำลังโหลดข้อมูล...</td>
                </tr>
              ) : pageItems.length === 0 ? (
                <tr>
                  <td colSpan="14" className="py-8 text-center text-slate-400">ไม่พบข้อมูลเงินเดือน</td>
                </tr>
              ) : (
                pageItems.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-3 text-center">{start + idx + 1}</td>
                    <td className="py-3 px-3 text-center font-medium">{item.employee_code}</td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      {`${item.prefix || ''}${item.first_name} ${item.last_name}`}
                    </td>
                    <td className="py-3 px-3 text-center">{item.department}</td>
                    <td className="py-3 px-3 text-center">{item.position}</td>
                    <td className="py-3 px-3 text-center">{item.employment_type}</td>
                    <td className="py-3 px-3 text-right">{fmt(item.base_salary)}</td>
                    <td className="py-3 px-3 text-right">{fmt(item.ot_amount)}</td>
                    <td className="py-3 px-3 text-right">{fmt(item.other_income + item.panel_income)}</td>
                    <td className="py-3 px-3 text-right">{fmt(item.late_absence_deduction)}</td>
                    <td className="py-3 px-3 text-right">{fmt(item.tax_amount)}</td>
                    <td className="py-3 px-3 text-right">{fmt(item.social_security)}</td>
                    <td className="py-3 px-3 text-right">{fmt(item.other_deduction + item.extra_deduction)}</td>
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => navigate(`${DETAIL_PATH}/${item.id}`)}
                        className="text-[#1E3A8A] font-bold underline hover:text-blue-700"
                      >
                        ดูรายละเอียด
                      </button>
                      <button
                        type="button"
                        onClick={() => navigate(`${SLIP_PATH}/${item.id}`)}
                        className="ml-3 text-emerald-700 font-bold underline hover:text-emerald-600"
                      >
                        ดูสลิป
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* เลขหน้า */}
      {filtered.length > PAGE_SIZE && (
        <div className="flex justify-end items-center gap-1.5 mt-4 text-xs">
          <button
            type="button"
            disabled={safePage === 1}
            onClick={() => setPage(safePage - 1)}
            className="w-7 h-7 rounded border border-slate-300 bg-white disabled:opacity-40"
            aria-label="หน้าก่อนหน้า"
          >
            ‹
          </button>
          {pageNumbers.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPage(p)}
              className={`w-7 h-7 rounded border ${
                p === safePage
                  ? 'bg-blue-500 border-blue-500 text-white'
                  : 'bg-white border-slate-300 text-slate-700'
              }`}
            >
              {p}
            </button>
          ))}
          <button
            type="button"
            disabled={safePage === pageCount}
            onClick={() => setPage(safePage + 1)}
            className="w-7 h-7 rounded border border-slate-300 bg-white disabled:opacity-40"
            aria-label="หน้าถัดไป"
          >
            ›
          </button>
        </div>
      )}
    </div>
  );
}