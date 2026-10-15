import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../config';

// ---------------------------------------------------------------------------
// ค่าคงที่ (แก้ตรงนี้ถ้านโยบายภาษีเปลี่ยน)
// ---------------------------------------------------------------------------
const PAGE_SIZE = 10;
const MONTHS_PER_YEAR = 12;
const ALLOWANCE = 60000; // ค่าลดหย่อนต่อปี

// ขั้นบันไดภาษี (ตรงกับตารางในดีไซน์)
const TAX_BRACKETS = [
  { from: 0, to: 150000, rate: 0, label: '0 - 150,000', text: 'ยกเว้นภาษี' },
  { from: 150000, to: 300000, rate: 0.05, label: '150,001 - 300,000', text: '5%' },
  { from: 300000, to: 500000, rate: 0.1, label: '300,001 - 500,000', text: '10%' },
  { from: 500000, to: 750000, rate: 0.15, label: '500,001 - 750,000', text: '15%' },
  { from: 750000, to: 1000000, rate: 0.2, label: '750,001 - 1,000,000', text: '20%' },
  { from: 1000000, to: 2000000, rate: 0.25, label: '1,000,001 - 2,000,000', text: '25%' },
  { from: 2000000, to: Infinity, rate: 0.3, label: 'มากกว่า 2,000,000', text: '30%' },
];

// route ของหน้าดู/แก้ไข (ปรับให้ตรงกับ router ของโปรเจกต์)
const viewPath = (id) => `/payroll/tax/${id}`;
const editPath = (id) => `/payroll/tax/${id}/edit`;

// field ที่ PUT /payrolltax/{id} รับ (PayrollTaxEdit.jsx import ตัวนี้)
export const FORM_KEYS = [
  'ot_hours',
  'ot_amount',
  'small_panel_qty',
  'small_panel_rate',
  'large_panel_qty',
  'large_panel_rate',
  'other_income',
  'late_absence_deduction',
  'tax_amount',
  'social_security',
  'other_deduction',
  'status',
];

// สถานะ: backend (อังกฤษ) -> ไทย + สีป้าย
const STATUS_MAP = {
  DRAFT: { label: 'รอคำนวณ', cls: 'bg-amber-50 text-amber-600 border-amber-200' },
  APPROVED: { label: 'อนุมัติแล้ว', cls: 'bg-blue-50 text-blue-600 border-blue-200' },
  PAID: { label: 'ปกติ', cls: 'bg-green-50 text-green-600 border-green-200' },
};
const getStatus = (s) =>
  STATUS_MAP[(s || '').toUpperCase()] || {
    label: s || '-',
    cls: 'bg-slate-50 text-slate-600 border-slate-200',
  };

const THAI_MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
];

// "2026-09" -> "กันยายน 2569"
const formatPeriod = (p) => {
  const m = /^(\d{4})-(\d{2})/.exec(p || '');
  if (!m) return p || '-';
  return `${THAI_MONTHS[Number(m[2]) - 1] ?? m[2]} ${Number(m[1]) + 543}`;
};
const periodYearTH = (p) => {
  const m = /^(\d{4})/.exec(p || '');
  return m ? Number(m[1]) + 543 : '-';
};

const fmt = (n) => Number(n ?? 0).toLocaleString('th-TH', { maximumFractionDigits: 2 });

// ภาษีเงินได้รายปีตามขั้นบันได
const calcAnnualTax = (netIncome) => {
  let tax = 0;
  for (const b of TAX_BRACKETS) {
    if (netIncome > b.from) tax += (Math.min(netIncome, b.to) - b.from) * b.rate;
  }
  return Math.round(tax * 100) / 100;
};

// ---------------------------------------------------------------------------
// ไอคอน
// ---------------------------------------------------------------------------
const Icon = ({ d, className = 'w-5 h-5', fill = false }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill={fill ? 'currentColor' : 'none'}
    stroke={fill ? 'none' : 'currentColor'}
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d={d} />
  </svg>
);
const ICONS = {
  users: 'M17 20v-2a4 4 0 00-4-4H7a4 4 0 00-4 4v2M10 10a4 4 0 100-8 4 4 0 000 8zM21 20v-2a4 4 0 00-3-3.87M16 2.13a4 4 0 010 7.75',
  coins: 'M12 6c4.4 0 8-1.3 8-3s-3.6-3-8-3-8 1.3-8 3 3.6 3 8 3zM4 3v6c0 1.7 3.6 3 8 3s8-1.3 8-3V3M4 9v6c0 1.7 3.6 3 8 3s8-1.3 8-3V9M4 15v4c0 1.7 3.6 3 8 3s8-1.3 8-3v-4',
  receipt: 'M5 3h14v18l-3-2-2 2-2-2-2 2-2-2-3 2V3zM9 8h6M9 12h6',
  percent: 'M19 5L5 19M7.5 9a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM16.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z',
  search: 'M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z',
  eye: 'M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12zM12 15a3 3 0 100-6 3 3 0 000 6z',
  edit: 'M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4L16.5 3.5z',
  refresh: 'M21 12a9 9 0 01-15.5 6.2L3 16M3 12a9 9 0 0115.5-6.2L21 8M21 3v5h-5M3 21v-5h5',
  info: 'M12 16v-4M12 8h.01M22 12a10 10 0 11-20 0 10 10 0 0120 0z',
  bulb: 'M9 18h6M10 22h4M12 2a7 7 0 00-4 12.7c.6.5 1 1.3 1 2.1V17h6v-.2c0-.8.4-1.6 1-2.1A7 7 0 0012 2z',
  gear: 'M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 01-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 010-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 014 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 010 4h-.1a1.7 1.7 0 00-1.5 1z',
  chevron: 'M9 18l6-6-6-6',
  down: 'M6 9l6 6 6-6',
  file: 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zM14 2v6h6M9 13h6M9 17h6',
};

// ---------------------------------------------------------------------------
// ชิ้นส่วนย่อย
// ---------------------------------------------------------------------------
function SelectField({ label, value, onChange, options }) {
  return (
    <label className="block flex-1 min-w-[150px] px-4 py-3">
      <span className="block text-[11px] font-semibold text-slate-500 mb-1.5">{label}</span>
      <span className="relative block">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none bg-white border border-slate-200 rounded-lg py-2 pl-3 pr-8 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <Icon
          d={ICONS.down}
          className="w-3.5 h-3.5 text-slate-500 pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2"
        />
      </span>
    </label>
  );
}

function StatCard({ icon, tone, label, children }) {
  const tones = {
    blue: 'bg-blue-50/70 border-blue-100 text-blue-600 bg-blue-100',
    green: 'bg-green-50/70 border-green-100',
    violet: 'bg-violet-50/70 border-violet-100',
    orange: 'bg-orange-50/70 border-orange-100',
  };
  const bubble = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    violet: 'bg-violet-100 text-violet-600',
    orange: 'bg-orange-100 text-orange-500',
  };
  return (
    <div className={`flex items-center gap-3 rounded-xl border p-4 ${tones[tone].split(' ').slice(0, 2).join(' ')}`}>
      <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${bubble[tone]}`}>
        <Icon d={icon} className="w-6 h-6" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold text-slate-600">{label}</p>
        <p className="text-2xl font-extrabold text-slate-900 leading-tight mt-0.5 truncate">{children}</p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// หน้าหลัก
// ---------------------------------------------------------------------------
export default function PayrollTax() {
  const navigate = useNavigate();

  const [taxList, setTaxList] = useState([]);
  const [periods, setPeriods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [period, setPeriod] = useState(''); // '' = งวดล่าสุด (backend เลือกให้)
  const [department, setDepartment] = useState('all');
  const [empType, setEmpType] = useState('all');
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  // รายการงวดสำหรับ dropdown (GET /payroll คืน { period, periods, items })
  useEffect(() => {
    fetch(`${API_URL}/payroll`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(res.status))))
      .then((data) => setPeriods(Array.isArray(data?.periods) ? data.periods : []))
      .catch((err) => console.error('Fetch periods error:', err));
  }, []);

  // ข้อมูลภาษี: GET /payrolltax?period=...
  const fetchTaxData = useCallback(() => {
    setLoading(true);
    setError(null);

    const qs = period ? `?period=${encodeURIComponent(period)}` : '';
    fetch(`${API_URL}/payrolltax${qs}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`เชื่อมต่อไม่สำเร็จ (รหัสสถานะ: ${res.status})`);
        }
        return res.json();
      })
      .then((data) => {
        setTaxList(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Fetch Error:', err);
        setError(err.message);
        setLoading(false);
      });
  }, [period]);

  useEffect(() => {
    fetchTaxData();
  }, [fetchTaxData]);

  // เติมค่าประมาณการรายปีให้แต่ละแถว
  const rows = useMemo(
    () =>
      taxList.map((r) => {
        const annualIncome = Number(r.income ?? r.gross_income ?? 0) * MONTHS_PER_YEAR;
        const taxDue = calcAnnualTax(Math.max(0, annualIncome - ALLOWANCE));
        return { ...r, annualIncome, taxDue, taxWithheld: Number(r.tax_amount ?? 0) };
      }),
    [taxList]
  );

  // ตัวเลือก dropdown สร้างจากข้อมูลจริง
  const departmentOptions = useMemo(
    () => [
      { value: 'all', label: 'ทั้งหมด' },
      ...[...new Set(rows.map((r) => r.department).filter(Boolean))].map((d) => ({ value: d, label: d })),
    ],
    [rows]
  );
  const typeOptions = useMemo(
    () => [
      { value: 'all', label: 'ทั้งหมด' },
      ...[...new Set(rows.map((r) => r.employment_type).filter(Boolean))].map((t) => ({ value: t, label: t })),
    ],
    [rows]
  );
  const statusOptions = [
    { value: 'all', label: 'ทั้งหมด' },
    ...Object.entries(STATUS_MAP).map(([value, s]) => ({ value, label: s.label })),
  ];
  const periodOptions = useMemo(() => {
    const list = periods.length ? periods : [...new Set(rows.map((r) => r.period).filter(Boolean))];
    return list.map((p) => ({ value: p, label: formatPeriod(p) }));
  }, [periods, rows]);

  const currentPeriod = period || periods[0] || rows[0]?.period || '';

  // กรองด้วย dropdown (ใช้กับการ์ดสรุป) แล้วค่อยกรองด้วยช่องค้นหา (ใช้กับตาราง)
  const filtered = useMemo(
    () =>
      rows.filter(
        (r) =>
          (department === 'all' || r.department === department) &&
          (empType === 'all' || r.employment_type === empType) &&
          (status === 'all' || (r.status || '').toUpperCase() === status)
      ),
    [rows, department, empType, status]
  );

  const shown = useMemo(() => {
    const k = search.trim().toLowerCase();
    if (!k) return filtered;
    return filtered.filter(
      (r) => (r.name || '').toLowerCase().includes(k) || (r.employee_code || '').toLowerCase().includes(k)
    );
  }, [filtered, search]);

  const summary = useMemo(() => {
    const totalIncome = filtered.reduce((s, r) => s + r.annualIncome, 0);
    const totalDue = filtered.reduce((s, r) => s + r.taxDue, 0);
    return {
      employees: filtered.length,
      income: totalIncome,
      withheld: filtered.reduce((s, r) => s + r.taxWithheld, 0),
      avgRate: totalIncome > 0 ? (totalDue / totalIncome) * 100 : 0,
    };
  }, [filtered]);

  // แบ่งหน้า
  const totalPages = Math.max(1, Math.ceil(shown.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const startIdx = (safePage - 1) * PAGE_SIZE;
  const pageRows = shown.slice(startIdx, startIdx + PAGE_SIZE);

  const pageNumbers = useMemo(() => {
    const first = Math.max(1, Math.min(safePage - 2, totalPages - 4));
    const last = Math.min(totalPages, first + 4);
    return Array.from({ length: last - first + 1 }, (_, i) => first + i);
  }, [safePage, totalPages]);

  const resetPage = (fn) => (v) => {
    fn(v);
    setPage(1);
  };

  return (
    <div className="w-full text-slate-800 space-y-5">
      {/* หัวข้อหน้า */}
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
          <Icon d={ICONS.file} className="w-7 h-7" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">ภาษี</h1>
          <p className="text-sm text-slate-600">จัดการข้อมูลภาษี คำนวณภาษีที่เกี่ยวข้อง และตรวจสอบยอดหัก</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_340px] gap-5 items-start">
        {/* ---------------- คอลัมน์ซ้าย ---------------- */}
        <div className="space-y-4 min-w-0">
          {/* แท็บ (เหลือแท็บเดียว) */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm px-4">
            <div className="flex gap-8">
              <span className="py-3.5 text-sm font-bold border-b-2 -mb-px border-blue-600 text-blue-600">
                ข้อมูลภาษี
              </span>
            </div>
          </div>

          {/* ตัวกรอง + การ์ดสรุป */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex flex-wrap divide-x divide-slate-100 border-b border-slate-100">
              <SelectField
                label="รอบเงินเดือน"
                value={currentPeriod}
                onChange={resetPage(setPeriod)}
                options={periodOptions.length ? periodOptions : [{ value: '', label: '-' }]}
              />
              <SelectField label="แผนก" value={department} onChange={resetPage(setDepartment)} options={departmentOptions} />
              <SelectField label="ประเภทพนักงาน" value={empType} onChange={resetPage(setEmpType)} options={typeOptions} />
              <SelectField label="สถานะ" value={status} onChange={resetPage(setStatus)} options={statusOptions} />
            </div>

            <div className="flex justify-end px-4 pt-3">
              <button
                onClick={fetchTaxData}
                disabled={loading}
                className="flex items-center gap-1.5 bg-[#2563EB] hover:bg-blue-700 disabled:opacity-60 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-sm transition-all active:scale-95 cursor-pointer"
              >
                <Icon d={ICONS.refresh} className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>คำนวณภาษีใหม่</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-4">
              <StatCard icon={ICONS.users} tone="blue" label="จำนวนพนักงานที่ต้องเสียภาษี">
                <span className="text-md">{fmt(summary.employees)}</span> <span className="text-base font-bold text-md">คน</span>
              </StatCard>

              <StatCard icon={ICONS.receipt} tone="violet" label="ภาษีที่หักรวม">
                <span className="text-md">{fmt(summary.withheld)}</span> <span className="text-base font-bold text-md">บาท</span>
              </StatCard>
              <StatCard icon={ICONS.percent} tone="orange" label="อัตราภาษีเฉลี่ย">
                <span className="text-md">{summary.avgRate.toFixed(1)}%</span>
              </StatCard>
            </div>
          </div>

          {/* ตารางรายการภาษีรายบุคคล */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <h2 className="text-base font-bold text-slate-900">รายการภาษีรายบุคคล</h2>
              <div className="relative w-full sm:w-72">
                <Icon
                  d={ICONS.search}
                  className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"
                />
                <input
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  placeholder="ค้นหาชื่อพนักงาน, รหัสพนักงาน..."
                  className="w-full border border-slate-200 rounded-lg py-2 pl-9 pr-3 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="overflow-x-auto rounded-lg border border-slate-100">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-800 font-bold">
                    <th className="py-3 px-3 text-center">ลำดับ</th>
                    <th className="py-3 px-3">รหัสพนักงาน</th>
                    <th className="py-3 px-3">ชื่อ-นามสกุล</th>
                    <th className="py-3 px-3 text-right">
                      เงินได้ทั้งสิ้น
                      <br />
                      <span className="font-medium text-slate-500">(ประมาณการ/ปี)</span>
                    </th>
                    <th className="py-3 px-3 text-right">
                      ภาษีที่ต้องเสีย
                      <br />
                      <span className="font-medium text-slate-500">(ประมาณการ/ปี)</span>
                    </th>
                    <th className="py-3 px-3 text-right">
                      ภาษีที่หักแล้ว
                      <br />
                      <span className="font-medium text-slate-500">(งวดนี้)</span>
                    </th>
                    <th className="py-3 px-3 text-center">สถานะ</th>
                    <th className="py-3 px-3 text-center">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading && (
                    <tr>
                      <td colSpan={8} className="py-10 text-center text-slate-500">
                        กำลังโหลด...
                      </td>
                    </tr>
                  )}
                  {!loading && error && (
                    <tr>
                      <td colSpan={8} className="py-10 text-center text-red-500">
                        {error}{' '}
                        <button onClick={fetchTaxData} className="underline cursor-pointer">
                          ลองใหม่
                        </button>
                      </td>
                    </tr>
                  )}
                  {!loading && !error && pageRows.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-10 text-center text-slate-500">
                        ไม่พบข้อมูล
                      </td>
                    </tr> 
                  )}
                  {!loading &&
                    !error &&
                    pageRows.map((r, i) => {
                      const st = getStatus(r.status);
                      return (
                        <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-3 text-center text-slate-600">{startIdx + i + 1}</td>
                          <td className="py-3 px-3 font-medium text-slate-900">{r.employee_code}</td>
                          <td className="py-3 px-3 font-medium text-slate-800 whitespace-nowrap">{r.name}</td>
                          <td className="py-3 px-3 text-right text-slate-700">{fmt(r.annualIncome)}</td>
                          <td className="py-3 px-3 text-right text-slate-700">{fmt(r.taxDue)}</td>
                          <td className="py-3 px-3 text-right font-semibold text-slate-800">{fmt(r.taxWithheld)}</td>
                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            <span
                              className={`inline-block px-3 py-0.5 rounded-full border text-[11px] font-semibold ${st.cls}`}
                            >
                              {st.label}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => navigate(editPath(r.id))}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 text-blue-600 font-semibold hover:bg-blue-50 cursor-pointer"
                              >
                                <Icon d={ICONS.edit} className="w-3.5 h-3.5" />
                                แก้ไข
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>

            {/* แบ่งหน้า */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 text-xs text-slate-500">
              <span>
                {shown.length === 0
                  ? 'แสดง 0 รายการ'
                  : `แสดง ${startIdx + 1}-${startIdx + pageRows.length} จาก ${fmt(shown.length)} รายการ`}
              </span>
              <div className="flex items-center gap-1 select-none">
                <button
                  disabled={safePage === 1}
                  onClick={() => setPage(safePage - 1)}
                  className="px-2.5 py-1 rounded border border-slate-200 bg-white hover:bg-slate-50 font-bold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  &lt;
                </button>
                {pageNumbers.map((n) => (
                  <button
                    key={n}
                    onClick={() => setPage(n)}
                    className={`px-3 py-1 rounded font-bold cursor-pointer ${
                      n === safePage
                        ? 'bg-[#2563EB] text-white'
                        : 'border border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    {n}
                  </button>
                ))}
                <button
                  disabled={safePage === totalPages}
                  onClick={() => setPage(safePage + 1)}
                  className="px-2.5 py-1 rounded border border-slate-200 bg-white hover:bg-slate-50 font-bold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  &gt;
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ---------------- คอลัมน์ขวา ---------------- */}
        <aside className="space-y-4">
          {/* รายละเอียดการคำนวณภาษี */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5">
            <h3 className="flex items-center gap-2 font-bold text-sm text-slate-900 mb-3">
              <Icon d={ICONS.info} className="w-5 h-5 text-blue-600" />
              รายละเอียดการคำนวณภาษี
            </h3>
            <div className="rounded-xl bg-slate-50 border border-slate-100 p-4 space-y-3 text-xs">
              <div>
                <p className="text-slate-500">รอบเงินเดือน</p>
                <p className="font-bold text-slate-900 text-sm">{formatPeriod(currentPeriod)}</p>
              </div>
              <div>
                <p className="text-slate-500">ระยะเวลาประเมินภาษี</p>
                <p className="font-semibold text-slate-800">ม.ค. - ธ.ค. {periodYearTH(currentPeriod)}</p>
              </div>
              <div>
                <p className="text-slate-500">วิธีการคำนวณ</p>
                <p className="font-semibold text-slate-800">ตามหลักเกณฑ์กรมสรรพากร</p>
              </div>
            </div>
          </div>

          {/* อัตราภาษี */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5">
            <h3 className="font-bold text-sm text-slate-900 mb-3">อัตราภาษีเงินได้บุคคลธรรมดา</h3>
            <div className="rounded-lg border border-slate-100 overflow-hidden text-xs">
              <div className="grid grid-cols-2 bg-slate-100 font-bold text-slate-800 px-3 py-2">
                <span>เงินได้สุทธิ (บาท)</span>
                <span>อัตราภาษี</span>
              </div>
              {TAX_BRACKETS.map((b) => (
                <div key={b.label} className="grid grid-cols-2 px-3 py-2 border-t border-slate-100 text-slate-700">
                  <span>{b.label}</span>
                  <span>{b.text}</span>
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-xl bg-blue-50 border border-blue-100 p-3.5">
              <p className="flex items-center gap-1.5 text-xs font-bold text-slate-900 mb-1.5">
                <Icon d={ICONS.bulb} className="w-4 h-4 text-blue-600" />
                หมายเหตุ
              </p>
              <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-600">
                <li>ภาษีที่ต้องเสียประมาณการจากเงินได้งวดนี้ x {MONTHS_PER_YEAR} หักค่าลดหย่อน {fmt(ALLOWANCE)} บาท</li>
                <li>ภาษีที่หักแล้วคือยอดที่บันทึกไว้ในรอบเงินเดือนนี้</li>
                <li>ควรตรวจสอบข้อมูลก่อนยืนยันการคำนวณ</li>
              </ul>
            </div>
          </div>

          {/* ตั้งค่า */}
          <button
            type="button"
            className="w-full flex items-center gap-3 text-left bg-blue-50/70 border border-blue-100 rounded-2xl p-4 hover:bg-blue-50 transition-colors cursor-pointer"
          >
            <div className="w-10 h-10 rounded-full bg-white border border-blue-100 text-blue-600 flex items-center justify-center shrink-0">
              <Icon d={ICONS.gear} className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-900">ตั้งค่าข้อมูลภาษี</p>
              <p className="text-[11px] text-slate-500">กำหนดค่าใช้จ่าย ลดหย่อน และเงื่อนไขอื่น ๆ</p>
            </div>
            <Icon d={ICONS.chevron} className="w-4 h-4 text-slate-400 shrink-0" />
          </button>
        </aside>
      </div>
    </div>
  );
}
