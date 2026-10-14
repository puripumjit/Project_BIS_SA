import React, { useState, useEffect } from 'react';
import { API_URL } from '../config';

const PAGE_SIZE = 10;
const LAW_URL = 'https://www.sso.go.th';

const fmt = (n) =>
  Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

const selectClass =
  'w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500';

const EMPTY = {
  rate: 0.05,
  wage_cap: 0,
  wage_floor: 0,
  departments: [],
  types: [],
  items: [],
  grand_total: 0,
};

function StatCard({ icon, label, value, unit }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-6 py-5 flex items-center gap-5">
      <div className="w-14 h-14 rounded-full bg-blue-100 text-[#1E3A8A] flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div>
        <div className="text-sm font-bold text-[#1E3A8A]">{label}</div>
        <div className="text-3xl font-bold text-slate-900 leading-tight">
          {value}
          <span className="text-base font-bold ml-1.5">{unit}</span>
        </div>
      </div>
    </div>
  );
}

const PeopleIcon = () => (
  <svg className="w-7 h-7 fill-current" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
  </svg>
);
const MoneyIcon = () => (
  <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 7a2 2 0 012-2h12v4M3 7v10a2 2 0 002 2h14a1 1 0 001-1v-3M3 7h16a1 1 0 011 1v3M16 14h5v-3h-5a1.5 1.5 0 000 3z" />
  </svg>
);

export default function PayrollSocialSecurity() {
  const [data, setData] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // draft = ค่าที่เลือกใน dropdown, applied = ค่าที่กดค้นหาแล้ว
  const [draft, setDraft] = useState({ department: '', type: '' });
  const [applied, setApplied] = useState({ department: '', type: '' });
  const [page, setPage] = useState(1);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (applied.department) params.set('department', applied.department);
    if (applied.type) params.set('employment_type', applied.type);
    const qs = params.toString() ? `?${params.toString()}` : '';

    fetch(`${API_URL}/social-security${qs}`)
      .then((res) => {
        if (!res.ok) throw new Error(`โหลดข้อมูลไม่สำเร็จ (รหัสสถานะ: ${res.status})`);
        return res.json();
      })
      .then((d) => {
        setData({ ...EMPTY, ...d, items: Array.isArray(d.items) ? d.items : [] });
        setLoading(false);
      })
      .catch((err) => {
        console.error('Fetch Error:', err);
        setError(err.message);
        setLoading(false);
      });
  }, [applied]);

  const handleSearch = () => {
    setPage(1);
    setApplied(draft);
  };

  const pct = `${Math.round(data.rate * 1000) / 10}%`;

  const pageCount = Math.max(1, Math.ceil(data.items.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const start = (safePage - 1) * PAGE_SIZE;
  const pageItems = data.items.slice(start, start + PAGE_SIZE);

  return (
    <div className="w-full text-slate-800">
      <h1 className="text-xl font-bold text-[#1E3A8A] mb-4">ข้อมูลประกันสังคม</h1>

      {/* การ์ดสรุป */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
        <StatCard icon={<PeopleIcon />} label="พนักงานทั้งหมด" value={data.items.length} unit="คน" />
        <StatCard
          icon={<MoneyIcon />}
          label="เงินสมทบรวม (นายจ้าง + ลูกจ้าง)"
          value={fmt(data.grand_total)}
          unit="บาท"
        />
      </div>

      {/* ตัวกรอง */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-4 items-end mb-5 max-w-3xl">
        <div>
          <label className="block text-xs font-bold text-[#1E3A8A] mb-1.5">แผนก</label>
          <select
            value={draft.department}
            onChange={(e) => setDraft((f) => ({ ...f, department: e.target.value }))}
            className={selectClass}
          >
            <option value="">ทั้งหมด</option>
            {data.departments.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-[#1E3A8A] mb-1.5">ประเภทพนักงาน</label>
          <select
            value={draft.type}
            onChange={(e) => setDraft((f) => ({ ...f, type: e.target.value }))}
            className={selectClass}
          >
            <option value="">ทั้งหมด</option>
            {data.types.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={handleSearch}
          className="bg-[#2563EB] hover:bg-blue-700 text-white text-sm font-semibold px-8 py-2.5 rounded-lg shadow-sm"
        >
          ค้นหา
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
          เกิดข้อผิดพลาด: {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_16rem] gap-5 items-start">
        {/* ตาราง */}
        <div>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead className="bg-[#E5E7EB] text-slate-800 font-bold">
                  <tr>
                    <th className="py-3 px-3 text-center">ลำดับ</th>
                    <th className="py-3 px-3 text-center">รหัสพนักงาน</th>
                    <th className="py-3 px-3 text-left">ชื่อ-นามสกุล</th>
                    <th className="py-3 px-3 text-right">ฐานค่าจ้าง</th>
                    <th className="py-3 px-3 text-right">เงินสมทบ ({pct})</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan="5" className="py-8 text-center text-slate-400">กำลังโหลดข้อมูล...</td>
                    </tr>
                  ) : pageItems.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="py-8 text-center text-slate-400">ไม่พบข้อมูลพนักงาน</td>
                    </tr>
                  ) : (
                    pageItems.map((item, idx) => (
                      <tr key={item.id} className="hover:bg-slate-50/70">
                        <td className="py-3 px-3 text-center">{start + idx + 1}</td>
                        <td className="py-3 px-3 text-center font-medium">{item.employee_code}</td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          {`${item.prefix || ''}${item.first_name} ${item.last_name}`}
                        </td>
                        <td className="py-3 px-3 text-right">{fmt(item.wage_base)}</td>
                        <td className="py-3 px-3 text-right font-medium">{fmt(item.contribution)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {data.items.length > PAGE_SIZE && (
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
              <span className="px-2 text-slate-600">
                {safePage} / {pageCount}
              </span>
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

        {/* ข้อมูลอัตรา */}
        <aside className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <h2 className="text-sm font-bold text-slate-900 mb-4">ข้อมูลอัตรา</h2>

          <div className="mb-4">
            <div className="text-xs font-bold text-[#1E3A8A]">อัตราเงินสมทบ</div>
            <div className="text-xs text-slate-600 mt-0.5">{pct} ของค่าจ้าง</div>
          </div>
          <div className="mb-4">
            <div className="text-xs font-bold text-[#1E3A8A]">เพดานค่าจ้าง</div>
            <div className="text-xs text-slate-600 mt-0.5">{fmt(data.wage_cap)} บาท</div>
          </div>
          <div className="mb-5">
            <div className="text-xs font-bold text-[#1E3A8A]">ค่าจ้างขั้นต่ำที่ใช้คำนวณ</div>
            <div className="text-xs text-slate-600 mt-0.5">{fmt(data.wage_floor)} บาท</div>
          </div>

          <a
            href={LAW_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-center text-xs font-semibold text-[#2563EB] border border-blue-300 hover:bg-blue-50 rounded-lg px-3 py-2"
          >
            ดูรายละเอียดกฎหมาย
          </a>
        </aside>
      </div>
    </div>
  );
}
