import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

// ===== ส่วน API และฟังก์ชันช่วยเหลือ (เดิมอยู่ใน tax.js) =====
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

async function request(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const text = (await res.text()).trim();
    throw new Error(text || `เกิดข้อผิดพลาด (HTTP ${res.status})`);
  }
  return res.json();
}

const q = (period) => (period ? `?period=${encodeURIComponent(period)}` : '');

export const fetchTaxList = (period) => request(`/tax${q(period)}`);
export const fetchTaxDetail = (employeeId, period) => request(`/tax/${employeeId}${q(period)}`);
export const updateTax = (employeeId, period, body) =>
  request(`/tax/${employeeId}${q(period)}`, { method: 'PUT', body: JSON.stringify(body) });
export const recalculateTax = (period) =>
  request('/tax/calculate', { method: 'POST', body: JSON.stringify({ period }) });

// ---------- Helpers ----------

const THAI_MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
];

// "2026-09" -> "กันยายน 2569"
export function formatPeriod(period) {
  if (!period) return '-';
  const [y, m] = period.split('-').map(Number);
  return `${THAI_MONTHS[m - 1]} ${y + 543}`;
}

export const fmt = (n) =>
  (Number(n) || 0).toLocaleString('th-TH', { maximumFractionDigits: 2 });

export const fullName = (r) => `${r.prefix || ''}${r.first_name} ${r.last_name}`;

export const STATUS_LABEL = { NORMAL: 'ปกติ', PENDING: 'รอคำนวณ' };

export const INCOME_KEYS = ['salary', 'ot_amount', 'other_income'];
export const ALLOWANCE_KEYS = [
  'personal_allowance', 'spouse_allowance', 'child_allowance', 'disabled_allowance',
  'life_insurance', 'provident_fund', 'home_loan_interest', 'education_expense', 'donation',
];
export const FORM_KEYS = [...INCOME_KEYS, ...ALLOWANCE_KEYS, 'withheld_paid'];

// ต้องตรงกับ taxBrackets ใน backend/internal/payroll/tax.go
export const TAX_BRACKETS = [
  { upper: 150000, rate: 0 },
  { upper: 300000, rate: 0.05 },
  { upper: 500000, rate: 0.1 },
  { upper: 750000, rate: 0.15 },
  { upper: 1000000, rate: 0.2 },
  { upper: 2000000, rate: 0.25 },
  { upper: Infinity, rate: 0.3 },
];

export function bracketLabel(i) {
  const lower = i === 0 ? 0 : TAX_BRACKETS[i - 1].upper + 1;
  const { upper } = TAX_BRACKETS[i];
  return upper === Infinity ? `มากกว่า ${fmt(lower - 1)}` : `${fmt(lower)} - ${fmt(upper)}`;
}

// สูตรเดียวกับ backend (ใช้แสดงผลสรุปแบบ live ขณะกรอกฟอร์ม; ค่าจริงคำนวณที่ backend)
export function calcTax(f) {
  const n = (v) => Math.max(0, Number(v) || 0);
  const annual = (n(f.salary) + n(f.ot_amount) + n(f.other_income)) * 12;
  const expense = Math.min(annual * 0.5, 100000);
  const allowance = ALLOWANCE_KEYS.reduce((s, k) => s + n(f[k]), 0);
  const net = Math.max(0, annual - expense - allowance);
  let tax = 0;
  let lower = 0;
  for (const b of TAX_BRACKETS) {
    if (net <= lower) break;
    tax += (Math.min(net, b.upper) - lower) * b.rate;
    lower = b.upper;
  }
  return { annual, expense, allowance, net, tax: Math.round(tax * 100) / 100 };
}

// ===== จบส่วน API และฟังก์ชันช่วยเหลือ =====

const PAGE_SIZE = 10;

function Select({ label, value, onChange, children }) {
  return (
    <div className="flex-1 min-w-[160px]">
      <label className="block text-xs text-slate-500 mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {children}
      </select>
    </div>
  );
}

function StatCard({ label, value, unit, tone }) {
  const tones = {
    blue: 'bg-blue-50 border-blue-100',
    green: 'bg-emerald-50 border-emerald-100',
    purple: 'bg-violet-50 border-violet-100',
    orange: 'bg-orange-50 border-orange-100',
  };
  return (
    <div className={`rounded-xl border p-4 ${tones[tone]}`}>
      <div className="text-sm text-slate-600">{label}</div>
      <div className="mt-1 text-2xl font-bold text-slate-800">
        {value} <span className="text-base font-semibold">{unit}</span>
      </div>
    </div>
  );
}

export default function PayrollTax() {
  const navigate = useNavigate();
  const [period, setPeriod] = useState('');
  const [periods, setPeriods] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [calculating, setCalculating] = useState(false);

  const [dept, setDept] = useState('');
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const load = useCallback(async (p) => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchTaxList(p);
      setPeriod(data.period);
      setPeriods(data.periods?.length ? data.periods : [data.period]);
      setItems(data.items || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load('');
  }, [load]);

  const departments = useMemo(() => [...new Set(items.map((i) => i.department))].sort(), [items]);
  const types = useMemo(() => [...new Set(items.map((i) => i.employment_type))].sort(), [items]);

  const filtered = useMemo(() => {
    const kw = search.trim().toLowerCase();
    return items.filter(
      (i) =>
        (!dept || i.department === dept) &&
        (!type || i.employment_type === type) &&
        (!status || i.status === status) &&
        (!kw || i.employee_code.toLowerCase().includes(kw) || fullName(i).toLowerCase().includes(kw)),
    );
  }, [items, dept, type, status, search]);

  useEffect(() => setPage(1), [dept, type, status, search, period]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const stats = useMemo(() => {
    const income = items.reduce((s, i) => s + i.annual_income, 0);
    const due = items.reduce((s, i) => s + i.tax_due, 0);
    const withheld = items.reduce((s, i) => s + i.total_withheld, 0);
    return {
      taxpayers: items.filter((i) => i.tax_due > 0).length,
      income,
      withheld,
      rate: income > 0 ? (due / income) * 100 : 0,
    };
  }, [items]);

  const handleRecalculate = async () => {
    if (!window.confirm(`คำนวณภาษีใหม่ของงวด ${formatPeriod(period)} ?\nภาษีในรายการเงินเดือนที่ยังเป็นฉบับร่างจะถูกอัปเดตด้วย`)) return;
    setCalculating(true);
    setError('');
    setNotice('');
    try {
      const res = await recalculateTax(period);
      setNotice(`คำนวณภาษีใหม่แล้ว ${res.employees} คน (อัปเดตรายการเงินเดือน ${res.updated_payroll_items} รายการ)`);
      await load(period);
    } catch (e) {
      setError(e.message);
    } finally {
      setCalculating(false);
    }
  };

  return (
    <div className="flex flex-col xl:flex-row gap-6">
      <div className="flex-1 min-w-0 space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">ภาษี</h1>
          <p className="text-slate-500 mt-1">จัดการข้อมูลภาษี คำนวณภาษีที่เกี่ยวข้อง และตรวจสอบยอดหัก</p>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}
        {notice && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{notice}</div>
        )}

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex flex-wrap items-end gap-3">
            <Select label="รอบเงินเดือน" value={period} onChange={(v) => load(v)}>
              {periods.map((p) => (
                <option key={p} value={p}>{formatPeriod(p)}</option>
              ))}
            </Select>
            <Select label="แผนก" value={dept} onChange={setDept}>
              <option value="">ทั้งหมด</option>
              {departments.map((d) => <option key={d} value={d}>{d}</option>)}
            </Select>
            <Select label="ประเภทพนักงาน" value={type} onChange={setType}>
              <option value="">ทั้งหมด</option>
              {types.map((t) => <option key={t} value={t}>{t}</option>)}
            </Select>
            <Select label="สถานะ" value={status} onChange={setStatus}>
              <option value="">ทั้งหมด</option>
              <option value="NORMAL">ปกติ</option>
              <option value="PENDING">รอคำนวณ</option>
            </Select>
            <button
              onClick={handleRecalculate}
              disabled={calculating || loading || !period}
              className="h-10 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {calculating ? 'กำลังคำนวณ...' : 'คำนวณภาษีใหม่'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard tone="blue" label="จำนวนพนักงานที่ต้องเสียภาษี" value={stats.taxpayers} unit="คน" />
          <StatCard tone="green" label="เงินได้รวมทั้งปี (ประมาณการ)" value={fmt(stats.income)} unit="บาท" />
          <StatCard tone="purple" label="ภาษีที่หักรวม" value={fmt(stats.withheld)} unit="บาท" />
          <StatCard tone="orange" label="อัตราภาษีเฉลี่ย" value={`${stats.rate.toFixed(2)}%`} unit="" />
        </div>

        <div className="rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between gap-4 p-4">
            <h2 className="text-lg font-bold text-slate-800">รายการภาษีรายบุคคล</h2>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหาชื่อพนักงาน, รหัสพนักงาน..."
              className="h-10 w-72 rounded-lg border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">ลำดับ</th>
                  <th className="px-4 py-3 text-left font-semibold">รหัสพนักงาน</th>
                  <th className="px-4 py-3 text-left font-semibold">ชื่อ-นามสกุล</th>
                  <th className="px-4 py-3 text-right font-semibold">เงินได้ทั้งปี<br /><span className="font-normal text-xs">(ประมาณการ)</span></th>
                  <th className="px-4 py-3 text-right font-semibold">ภาษีที่ต้องเสีย</th>
                  <th className="px-4 py-3 text-right font-semibold">ภาษีที่หักแล้ว</th>
                  <th className="px-4 py-3 text-center font-semibold">สถานะ</th>
                  <th className="px-4 py-3 text-center font-semibold">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr><td colSpan={8} className="px-4 py-10 text-center text-slate-400">กำลังโหลดข้อมูล...</td></tr>
                )}
                {!loading && pageItems.length === 0 && (
                  <tr><td colSpan={8} className="px-4 py-10 text-center text-slate-400">ไม่พบข้อมูลที่ตรงกับเงื่อนไข</td></tr>
                )}
                {!loading && pageItems.map((r, idx) => (
                  <tr key={r.employee_id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3">{(page - 1) * PAGE_SIZE + idx + 1}</td>
                    <td className="px-4 py-3">{r.employee_code}</td>
                    <td className="px-4 py-3">{fullName(r)}</td>
                    <td className="px-4 py-3 text-right">{fmt(r.annual_income)}</td>
                    <td className="px-4 py-3 text-right">{fmt(r.tax_due)}</td>
                    <td className="px-4 py-3 text-right">{fmt(r.total_withheld)}</td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-block rounded-full px-3 py-0.5 text-xs font-medium ${
                          r.status === 'PENDING' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {STATUS_LABEL[r.status] || r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => navigate(`/payroll/tax/${r.employee_id}/edit?period=${period}`)}
                        className="rounded-md border border-blue-200 px-3 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50"
                      >
                        แก้ไข
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between p-4 text-sm text-slate-500">
            <span>
              แสดง {filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, filtered.length)} จาก {filtered.length} รายการ
            </span>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="h-8 w-8 rounded-md hover:bg-slate-100 disabled:opacity-40">‹</button>
              {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  onClick={() => setPage(n)}
                  className={`h-8 w-8 rounded-md ${n === page ? 'bg-blue-600 text-white' : 'hover:bg-slate-100'}`}
                >
                  {n}
                </button>
              ))}
              <button onClick={() => setPage((p) => Math.min(pageCount, p + 1))} disabled={page === pageCount} className="h-8 w-8 rounded-md hover:bg-slate-100 disabled:opacity-40">›</button>
            </div>
          </div>
        </div>
      </div>

      <aside className="xl:w-80 shrink-0 space-y-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="font-bold text-slate-800 mb-3">รายละเอียดการคำนวณภาษี</h3>
          <div className="rounded-lg border border-slate-100 bg-slate-50 p-3 space-y-3 text-sm">
            <div>
              <div className="text-xs text-slate-500">รอบเงินเดือน</div>
              <div className="font-semibold text-slate-800">{formatPeriod(period)}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500">ระยะเวลาประเมินภาษี</div>
              <div className="font-semibold text-slate-800">
                ม.ค. - ธ.ค. {period ? Number(period.slice(0, 4)) + 543 : '-'}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500">วิธีการคำนวณ</div>
              <div className="font-semibold text-slate-800">ตามหลักเกณฑ์สรรพากร</div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="font-bold text-slate-800 mb-3">อัตราภาษีเงินได้บุคคลธรรมดา</h3>
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-3 py-2 text-left font-semibold">เงินได้สุทธิ (บาท)</th>
                <th className="px-3 py-2 text-right font-semibold">อัตราภาษี</th>
              </tr>
            </thead>
            <tbody>
              {TAX_BRACKETS.map((b, i) => (
                <tr key={i} className="border-t border-slate-100">
                  <td className="px-3 py-2">{bracketLabel(i)}</td>
                  <td className="px-3 py-2 text-right">{b.rate === 0 ? 'ยกเว้นภาษี' : `${b.rate * 100}%`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-xs text-slate-600 space-y-1">
          <div className="font-semibold text-slate-800 text-sm">หมายเหตุ</div>
          <p>• ภาษีที่แสดงเป็นการประมาณการจากข้อมูลเงินได้ทั้งปี (รายได้ต่อเดือน × 12)</p>
          <p>• หลังแก้ไขข้อมูลภาษี สถานะจะเป็น "รอคำนวณ" จนกว่าจะกด "คำนวณภาษีใหม่"</p>
        </div>

        <Link
          to="/settings"
          className="block rounded-xl border border-slate-200 bg-white p-4 hover:bg-slate-50"
        >
          <div className="font-semibold text-blue-700">ตั้งค่าข้อมูลภาษี</div>
          <div className="text-xs text-slate-500">กำหนดค่าใช้จ่าย ลดหย่อน และเงื่อนไขต่าง ๆ</div>
        </Link>
      </aside>
    </div>
  );
}
