import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { API_URL } from '../config';

const TYPE_LABELS = {
  LOAN: 'เงินกู้',
  PROVIDENT_FUND: 'กองทุนสำรองเลี้ยงชีพ',
  UNIFORM: 'หักค่าชุด/ค่าใช้จ่าย',
  DAMAGE: 'หักค่าเสียหาย',
  OTHER: 'อื่น ๆ',
};

// value ต้องตรงกับที่เก็บใน DB (employees.employment_type)
const EMPLOYMENT_TYPES = [
  { value: 'ประจำ', label: 'พนักงานประจำ' },
  { value: 'ฟรีแลนซ์', label: 'ฟรีแลนซ์' },
];

const THAI_MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
];

const periodLabel = (p) => {
  const [y, m] = String(p).split('-');
  return `${THAI_MONTHS[Number(m) - 1] || m} ${Number(y) + 543}`;
};

// รอบเงินเดือนย้อนหลัง 12 เดือน (เดือนปัจจุบันอยู่บนสุด)
const buildPeriodOptions = () => {
  const now = new Date();
  return Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    return { value, label: periodLabel(value) };
  });
};

const fmt = (n) =>
  Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

const empName = (e) => `${e.prefix || ''}${e.first_name || ''} ${e.last_name || ''}`.trim();

const readError = async (res, fallback) => {
  const msg = (await res.text()).trim();
  return msg || `${fallback} (รหัสสถานะ: ${res.status})`;
};

const fieldCls =
  'w-full bg-white border border-slate-200 text-slate-700 py-2.5 px-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs font-medium shadow-sm';

function SelectField({ label, value, onChange, children }) {
  return (
    <div>
      <label className="block text-xs font-bold text-slate-700 mb-1.5">{label}</label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`${fieldCls} pr-8 appearance-none cursor-pointer`}
        >
          {children}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-blue-600">
          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
            <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function AddDeductionModal({ employees, periods, defaultPeriod, onClose, onSaved }) {
  const [form, setForm] = useState({
    employee_id: '',
    deduction_type: 'LOAN',
    amount: '',
    note: '',
    period: defaultPeriod,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  // แสดงเฉพาะพนักงานที่ยังทำงานอยู่ (ถ้า API ไม่ส่ง status มา จะแสดงทุกคน)
  const activeEmployees = useMemo(
    () => employees.filter((e) => !e.status || e.status === 'ACTIVE'),
    [employees]
  );

  const handleSubmit = async () => {
    if (!form.employee_id) return setError('กรุณาเลือกพนักงาน');
    if (!(Number(form.amount) > 0)) return setError('กรุณากรอกจำนวนเงินมากกว่า 0');

    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/payroll-deductions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee_id: Number(form.employee_id),
          period: form.period,
          deduction_type: form.deduction_type,
          amount: Number(form.amount),
          note: form.note.trim(),
        }),
      });
      if (!res.ok) throw new Error(await readError(res, 'บันทึกไม่สำเร็จ'));
      onSaved(form.period);
    } catch (err) {
      console.error('Add Deduction Error:', err);
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6">
        <h2 className="text-base font-bold text-slate-900 mb-4">เพิ่มรายการหัก</h2>

        {error && (
          <div className="mb-3 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs">
            {error}
          </div>
        )}

        <div className="space-y-3">
          <SelectField
            label="พนักงาน"
            value={form.employee_id}
            onChange={(v) => setForm((f) => ({ ...f, employee_id: v }))}
          >
            <option value="">เลือกพนักงาน</option>
            {activeEmployees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.employee_code} - {empName(e)}
              </option>
            ))}
          </SelectField>

          <SelectField
            label="ประเภทการหัก"
            value={form.deduction_type}
            onChange={(v) => setForm((f) => ({ ...f, deduction_type: v }))}
          >
            {Object.entries(TYPE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </SelectField>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">จำนวนเงิน (บาท)</label>
              <input type="number" min="0" step="0.01" value={form.amount} onChange={set('amount')} className={fieldCls} />
            </div>
            <SelectField
              label="รอบเงินเดือน"
              value={form.period}
              onChange={(v) => setForm((f) => ({ ...f, period: v }))}
            >
              {periods.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </SelectField>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">หมายเหตุ</label>
            <textarea rows={2} value={form.note} onChange={set('note')} className={fieldCls} />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 text-xs font-bold px-5 py-2.5 rounded-xl cursor-pointer"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="bg-[#2563EB] hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold px-5 py-2.5 rounded-xl cursor-pointer"
          >
            {saving ? 'กำลังบันทึก...' : 'บันทึก'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PayrollDeductions() {
  const periods = useMemo(buildPeriodOptions, []);

  const [period, setPeriod] = useState('2026-09');
  const [department, setDepartment] = useState('ทั้งหมด');
  const [employmentType, setEmploymentType] = useState('ทั้งหมด');

  const [rows, setRows] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAdd, setShowAdd] = useState(false);

  // รายชื่อพนักงาน (ใช้ใน dropdown ของฟอร์มเพิ่ม และสร้างตัวเลือกแผนก)
  useEffect(() => {
    fetch(`${API_URL}/employees`)
      .then(async (res) => {
        if (!res.ok) throw new Error(await readError(res, 'โหลดรายชื่อพนักงานไม่สำเร็จ'));
        return res.json();
      })
      .then((data) => setEmployees(Array.isArray(data) ? data : []))
      .catch((err) => {
        console.error('Load Employees Error:', err);
        setError(err.message);
      });
  }, []);

  const load = useCallback(async (p, signal) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/payroll-deductions?period=${encodeURIComponent(p)}`, { signal });
      if (!res.ok) throw new Error(await readError(res, 'โหลดรายการหักไม่สำเร็จ'));
      const data = await res.json();
      setRows(Array.isArray(data) ? data : []);
      setLoading(false);
    } catch (err) {
      if (err.name === 'AbortError') return;
      console.error('Load Error:', err);
      setError(err.message);
      setRows([]);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    load(period, controller.signal);
    return () => controller.abort();
  }, [period, load]);

  const departments = useMemo(
    () => [...new Set(employees.map((e) => e.department).filter(Boolean))],
    [employees]
  );

  const filtered = useMemo(
    () =>
      rows.filter((r) => {
        if (department !== 'ทั้งหมด' && r.department !== department) return false;
        if (employmentType !== 'ทั้งหมด' && r.employment_type !== employmentType) return false;
        return true;
      }),
    [rows, department, employmentType]
  );

  const totalAmount = useMemo(() => filtered.reduce((sum, r) => sum + Number(r.amount || 0), 0), [filtered]);

  const handleSaved = (savedPeriod) => {
    setShowAdd(false);
    if (savedPeriod === period) {
      load(period);
    } else {
      setPeriod(savedPeriod); // สลับไปดูรอบที่เพิ่งบันทึก
    }
  };

  return (
    <div className="w-full text-slate-800 space-y-6">
      {/* หัวข้อหน้า */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">รายการหักอื่น ๆ</h1>
        <p className="text-xs text-slate-500 mt-1">จัดการรายการหักค่าต่าง ๆ นอกเหนือจากภาษีและประกันสังคม</p>
      </div>

      {/* แถบตัวกรองและปุ่ม + เพิ่มรายการหัก */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full md:w-3/4">
          <SelectField label="รอบเงินเดือน" value={period} onChange={setPeriod}>
            {periods.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </SelectField>

          <SelectField label="แผนก" value={department} onChange={setDepartment}>
            <option value="ทั้งหมด">ทั้งหมด</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </SelectField>

          <SelectField label="ประเภทพนักงาน" value={employmentType} onChange={setEmploymentType}>
            <option value="ทั้งหมด">ทั้งหมด</option>
            {EMPLOYMENT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </SelectField>
        </div>

        <button
          type="button"
          onClick={() => setShowAdd(true)}
          className="flex items-center justify-center gap-1.5 bg-[#2563EB] hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-sm transition-all active:scale-95 cursor-pointer whitespace-nowrap"
        >
          <span>+</span>
          <span>เพิ่มรายการหัก</span>
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs flex items-center justify-between">
          <span>{error}</span>
          <button type="button" onClick={() => load(period)} className="font-bold underline cursor-pointer">
            ลองใหม่
          </button>
        </div>
      )}

      {/* การ์ดสรุป 2 ใบ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center text-xl shrink-0">
            <svg className="w-6 h-6 fill-none stroke-current" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">รายการหักทั้งหมด</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-0.5">
              {filtered.length} <span className="text-base font-bold">รายการ</span>
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-xl shrink-0">
            <svg className="w-6 h-6 fill-none stroke-current" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">จำนวนเงินรวม</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-0.5">
              {fmt(totalAmount)} <span className="text-base font-bold">บาท</span>
            </p>
          </div>
        </div>
      </div>

      {/* ตารางรายละเอียดรายการหัก */}
      <div>
        <h2 className="text-base font-bold text-slate-900 mb-3">รายละเอียดรายการหัก</h2>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#E5E7EB] text-slate-800 font-bold border-b border-slate-300">
                  <th className="py-3.5 px-4 text-center">ลำดับ</th>
                  <th className="py-3.5 px-4 text-center">รหัสพนักงาน</th>
                  <th className="py-3.5 px-6">ชื่อ-สกุล</th>
                  <th className="py-3.5 px-4 text-center">ประเภทการหัก</th>
                  <th className="py-3.5 px-4 text-center">จำนวนเงิน</th>
                  <th className="py-3.5 px-4 text-center">หมายเหตุ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-slate-400">
                      กำลังโหลดข้อมูล...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-slate-400">
                      ไม่มีรายการหักในรอบนี้ กด &quot;เพิ่มรายการหัก&quot; เพื่อเริ่มต้น
                    </td>
                  </tr>
                ) : (
                  filtered.map((row, i) => (
                    <tr key={row.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 text-center text-slate-600 font-medium">{i + 1}</td>
                      <td className="py-3.5 px-4 text-center text-slate-900 font-medium">{row.employee_code}</td>
                      <td className="py-3.5 px-6 font-medium text-slate-800 whitespace-nowrap">{empName(row)}</td>
                      <td className="py-3.5 px-4 text-center text-slate-700 font-medium">
                        {TYPE_LABELS[row.deduction_type] || row.deduction_type}
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-slate-800">{fmt(row.amount)}</td>
                      <td className="py-3.5 px-4 text-center text-slate-500">{row.note || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* กล่องหมายเหตุ */}
      <div className="bg-blue-50/70 border border-blue-200/80 rounded-2xl p-4 flex items-start gap-3 text-xs text-blue-900">
        <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5">
          i
        </div>
        <div className="space-y-1">
          <p className="font-bold">หมายเหตุ</p>
          <ul className="list-disc list-inside space-y-0.5 text-blue-800">
            <li>สามารถเพิ่มรายการหักได้ที่ปุ่ม &quot;เพิ่มรายการหัก&quot;</li>
            <li>รายการหักบางประเภทสามารถตั้งค่าเป็นเงินตัดอัตโนมัติได้ที่เมนู ตั้งค่าระบบ</li>
          </ul>
        </div>
      </div>

      {showAdd && (
        <AddDeductionModal
          employees={employees}
          periods={periods}
          defaultPeriod={period}
          onClose={() => setShowAdd(false)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}