import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

/* =====================================================================
   API + ตัวช่วย (รวมไว้ในไฟล์นี้ ไม่ต้อง import จาก ./PayrollTax)
   - โหลด  : GET /payroll/{id}     (id = field "id" ของแถวในหน้ารายการภาษี)
   - บันทึก : PUT /payrolltax/{id}  (backend เก็บ ot_amount, other_income, tax_amount)
   ===================================================================== */
const API_BASE = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8080';
const LIST_PATH = '/payroll/tax';

async function request(path, options = {}) {
  const token = localStorage.getItem('token'); // ไม่มี token ก็ไม่ส่ง header
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  });
  if (!res.ok) {
    const text = (await res.text().catch(() => '')).trim(); // backend ตอบ error เป็นข้อความธรรมดา
    throw new Error(text || `เกิดข้อผิดพลาด (${res.status})`);
  }
  return res.json();
}

// ค่าลดหย่อน backend ยังไม่มีที่เก็บ → ใช้คำนวณประมาณการบนหน้าจอเท่านั้น
const DEFAULT_ALLOWANCES = {
  personal_allowance: 60000,
  spouse_allowance: 0,
  child_allowance: 0,
  disabled_allowance: 0,
  life_insurance: 0,
  provident_fund: 0,
  home_loan_interest: 0,
  education_expense: 0,
  donation: 0,
};
const ALLOWANCE_KEYS = Object.keys(DEFAULT_ALLOWANCES);
const FORM_KEYS = ['salary', 'ot_amount', 'other_income', ...ALLOWANCE_KEYS, 'withheld_paid'];

const STATUS_LABEL = { DRAFT: 'รอคำนวณ', APPROVED: 'อนุมัติแล้ว', PAID: 'จ่ายแล้ว' };

async function fetchTaxDetail(id) {
  const row = await request(`/payroll/${encodeURIComponent(id)}`);
  return {
    ...row,
    salary: row.base_salary ?? 0,
    withheld_paid: row.tax_amount ?? 0, // ภาษีที่หักไว้ในงวดนี้
    ...DEFAULT_ALLOWANCES,
  };
}

// บันทึกเฉพาะ field ที่ backend รองรับ
function updateTax(id, payload) {
  return request(`/payrolltax/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify({
      ot_amount: payload.ot_amount,
      other_income: payload.other_income,
      tax_amount: payload.withheld_paid,
    }),
  });
}

const MONTHS_PER_YEAR = 12;
const BRACKETS = [
  [150000, 0],
  [150000, 0.05],
  [200000, 0.1],
  [250000, 0.15],
  [250000, 0.2],
  [1000000, 0.25],
  [3000000, 0.3],
  [Infinity, 0.35],
];

const num = (v) => {
  const n = parseFloat(v);
  return Number.isFinite(n) && n > 0 ? n : 0;
};

function calcTax(form, extraMonthlyIncome = 0) {
  const monthly = num(form.salary) + num(form.ot_amount) + num(form.other_income) + num(extraMonthlyIncome);
  const annual = monthly * MONTHS_PER_YEAR;
  const expense = Math.min(annual * 0.5, 100000);
  const allowance = ALLOWANCE_KEYS.reduce((s, k) => s + num(form[k]), 0);
  const net = Math.max(annual - expense - allowance, 0);

  let remaining = net;
  let tax = 0;
  for (const [width, rate] of BRACKETS) {
    if (remaining <= 0) break;
    const part = Math.min(remaining, width);
    tax += part * rate;
    remaining -= part;
  }
  return { annual, expense, allowance, net, tax };
}

const fmt = (n) =>
  Number(n).toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

const fullName = (e) => `${e.prefix || ''}${e.first_name || ''} ${e.last_name || ''}`.trim();

// "2026-09" -> "กันยายน 2569"
const formatPeriod = (p) => {
  const [y, m] = String(p || '').split('-').map(Number);
  if (!y || !m) return p || '-';
  return new Date(y, m - 1, 1).toLocaleDateString('th-TH', { month: 'long', year: 'numeric' });
};

/* =====================================================================
   UI
   ===================================================================== */
const INCOME_ROWS = [
  ['salary', 'เงินเดือน (ตามสัญญาจ้าง)'],
  ['ot_amount', 'ค่าล่วงเวลา (OT)'],
  ['other_income', 'รายได้อื่น ๆ ที่ต้องนำมาคำนวณภาษี'],
];
const PERSONAL_ROWS = [
  ['personal_allowance', 'ค่าลดหย่อนส่วนตัว'],
  ['spouse_allowance', 'ค่าลดหย่อนคู่สมรส'],
  ['child_allowance', 'ค่าลดหย่อนบุตร (คนละ 30,000 บาท)'],
  ['disabled_allowance', 'ค่าลดหย่อนผู้พิการ'],
];
const OTHER_ROWS = [
  ['life_insurance', 'ประกันชีวิต'],
  ['provident_fund', 'กองทุนสำรองเลี้ยงชีพ'],
  ['home_loan_interest', 'ดอกเบี้ยเงินกู้ (บ้าน)'],
  ['education_expense', 'ค่าใช้จ่ายในการศึกษา'],
  ['donation', 'บริจาค'],
];

function MoneyInput({ value, onChange, className = '' }) {
  return (
    <input
      type="number"
      min="0"
      step="any"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onFocus={(e) => e.target.select()}
      className={`h-9 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
    />
  );
}

function Card({ title, children }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5">
      {title && <h2 className="text-lg font-bold text-slate-800 mb-4">{title}</h2>}
      {children}
    </section>
  );
}

function Row({ label, value, strong, green }) {
  return (
    <div className={`flex items-center justify-between px-3 py-2.5 text-sm ${green ? 'rounded-md bg-emerald-50 text-emerald-700 font-semibold' : ''}`}>
      <span className={strong ? 'font-semibold text-slate-800' : 'text-slate-600'}>{label}</span>
      <span className="tabular-nums">{value} <span className="ml-1 text-slate-500 font-normal">บาท</span></span>
    </div>
  );
}

export default function PayrollTaxEdit() {
  const params = useParams();
  const id = params.id ?? Object.values(params)[0];
  const navigate = useNavigate();

  const [emp, setEmp] = useState(null);
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    if (!id) {
      setError('ไม่พบรหัสรายการใน URL');
      setLoading(false);
      return undefined;
    }
    setLoading(true);
    fetchTaxDetail(id)
      .then((data) => {
        if (cancelled) return;
        setEmp(data);
        setForm(Object.fromEntries(FORM_KEYS.map((k) => [k, String(data[k] ?? 0)])));
      })
      .catch((e) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [id]);

  const set = (key) => (v) => setForm((f) => ({ ...f, [key]: v }));

  const calc = useMemo(() => (form ? calcTax(form, emp?.panel_income) : null), [form, emp]);
  // ภาษีที่หักไว้งวดนี้ × 12 = ประมาณการทั้งปี
  const totalWithheld = form ? num(form.withheld_paid) * MONTHS_PER_YEAR : 0;
  const balance = calc ? calc.tax - totalWithheld : 0;
  const hasNegative = form && FORM_KEYS.some((k) => Number(form[k]) < 0);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const payload = Object.fromEntries(FORM_KEYS.map((k) => [k, Number(form[k]) || 0]));
      await updateTax(id, payload);
      navigate(LIST_PATH);
    } catch (e) {
      setError(e.message);
      setSaving(false);
    }
  };

  if (loading) return <div className="py-20 text-center text-slate-400">กำลังโหลดข้อมูล...</div>;
  if (!emp || !form) {
    return (
      <div className="space-y-3">
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error || 'ไม่พบข้อมูล'}</div>
        <Link to={LIST_PATH} className="text-sm text-blue-600">← กลับไปหน้ารายการภาษี</Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <Link to={LIST_PATH} className="text-sm text-slate-500 hover:text-blue-600">← กลับไปหน้ารายการภาษี</Link>
          <h1 className="mt-2 text-2xl font-bold text-slate-800">แก้ไขข้อมูลภาษี</h1>
          <p className="text-slate-500 mt-1">ปรับปรุงข้อมูลภาษีและค่าลดหย่อนของพนักงาน เพื่อใช้ในการคำนวณภาษีเงินได้ · รอบ {formatPeriod(emp.period)}</p>
        </div>
        <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-slate-600 lg:max-w-md">
          การแก้ไขข้อมูลภาษีจะมีผลกับการคำนวณในรอบเดือนถัดไป หลังจากกดบันทึกและคำนวณใหม่
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="flex flex-col xl:flex-row gap-5">
        <div className="flex-1 min-w-0 space-y-5">
          <Card title="ข้อมูลพนักงาน">
            <div className="flex flex-wrap items-center gap-6">
              <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center text-2xl font-bold text-blue-600">
                {(emp.first_name || '?').charAt(0)}
              </div>
              <div className="flex-1 min-w-[220px]">
                <div className="font-bold text-slate-800">{emp.employee_code}</div>
                <div className="font-bold text-slate-800">{fullName(emp)}</div>
                <div className="text-xs text-slate-500 mt-1">แผนก : {emp.department} | ตำแหน่ง : {emp.position}</div>
                <div className="text-xs text-slate-500">ประเภท : {emp.employment_type}</div>
              </div>
              <div className="text-sm">
                <div className="text-xs text-slate-500">สถานะ</div>
                <span className={`inline-block mt-1 rounded-full px-3 py-0.5 text-xs font-medium ${emp.status === 'DRAFT' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                  {STATUS_LABEL[emp.status] || emp.status}
                </span>
              </div>
            </div>
          </Card>

          <Card title="1. รายได้ที่ใช้ในการคำนวณภาษี (ต่อเดือน)">
            <div className="rounded-lg border border-slate-100">
              <div className="flex bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-600">
                <span className="flex-1">รายการ</span>
                <span className="w-56">จำนวนเงิน (บาท)</span>
              </div>
              {INCOME_ROWS.map(([key, label]) => (
                <div key={key} className="flex items-center border-t border-slate-100 px-4 py-2 text-sm text-slate-700">
                  <span className="flex-1">{label}</span>
                  <MoneyInput className="w-56" value={form[key]} onChange={set(key)} />
                </div>
              ))}
              {num(emp.panel_income) > 0 && (
                <div className="flex items-center border-t border-slate-100 px-4 py-2 text-sm text-slate-700">
                  <span className="flex-1">ค่าตู้ (ฟรีแลนซ์)</span>
                  <span className="w-56 px-3 text-slate-500 tabular-nums">{fmt(emp.panel_income)}</span>
                </div>
              )}
            </div>
            <p className="mt-3 rounded-lg bg-blue-50 px-4 py-2 text-xs text-slate-600">
              ค่าล่วงเวลาและรายได้อื่นจะถูกบันทึกลงรายการเงินเดือนของงวดนี้ ส่วนเงินเดือนพื้นฐานใช้คำนวณบนหน้าจอเท่านั้น
              ไม่เปลี่ยนค่าในข้อมูลพนักงาน
            </p>
          </Card>

          <Card title="2. ค่าลดหย่อนภาษี">
            <div className="grid md:grid-cols-2 gap-x-8 gap-y-3">
              <div className="space-y-3">
                <div className="text-sm font-semibold text-slate-800">ค่าลดหย่อนส่วนตัว</div>
                {PERSONAL_ROWS.map(([key, label]) => (
                  <div key={key} className="flex items-center justify-between gap-2 text-sm text-slate-700">
                    <span>{label}</span>
                    <span className="flex items-center gap-2">
                      <MoneyInput className="w-28" value={form[key]} onChange={set(key)} />
                      <span className="text-xs text-slate-500">บาท</span>
                    </span>
                  </div>
                ))}
              </div>
              <div className="space-y-3">
                <div className="text-sm font-semibold text-slate-800">ค่าลดหย่อนอื่น ๆ</div>
                {OTHER_ROWS.map(([key, label]) => (
                  <div key={key} className="flex items-center justify-between gap-2 text-sm text-slate-700">
                    <span>{label}</span>
                    <span className="flex items-center gap-2">
                      <MoneyInput className="w-28" value={form[key]} onChange={set(key)} />
                      <span className="text-xs text-slate-500">บาท</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <p className="mt-4 rounded-lg bg-blue-50 px-4 py-2 text-xs text-slate-600">
              ค่าลดหย่อนใช้คำนวณประมาณการภาษีบนหน้าจอเท่านั้น ยังไม่ถูกบันทึกลงระบบ
            </p>
          </Card>
        </div>

        <div className="xl:w-96 shrink-0 space-y-5">
          <Card title="3. ภาษีที่หัก ณ ที่จ่ายแล้ว">
            <label className="block text-xs text-slate-500 mb-1">จำนวนเงิน งวดนี้ (บาท)</label>
            <MoneyInput className="w-full" value={form.withheld_paid} onChange={set('withheld_paid')} />
            <p className="mt-3 rounded-lg bg-blue-50 px-3 py-2 text-xs text-slate-600">
              ภาษีที่หักไว้ในงวดนี้ จะถูกบันทึกลงรายการเงินเดือน และใช้ประมาณการยอดทั้งปีในช่องสรุป (× 12)
            </p>
          </Card>

          <Card title="สรุปการคำนวณภาษี (หลังแก้ไข)">
            <div className="rounded-lg bg-slate-50 py-1">
              <Row label="รายได้รวมที่ใช้คำนวณภาษี (ทั้งปี)" value={fmt(calc.annual)} strong />
              <Row label="ค่าใช้จ่าย (50% ไม่เกิน 100,000)" value={fmt(calc.expense)} />
              <Row label="ค่าลดหย่อนทั้งหมด" value={fmt(calc.allowance)} strong />
              <Row label="เงินได้สุทธิ" value={fmt(calc.net)} />
              <Row label="ภาษีที่ต้องเสีย" value={fmt(calc.tax)} />
              <Row label="ภาษีที่หัก ณ ที่จ่ายแล้ว (ทั้งปี)" value={fmt(totalWithheld)} />
              <Row
                green
                label="ภาษีที่ต้องชำระเพิ่ม / (คืน)"
                value={balance < 0 ? `(${fmt(Math.abs(balance))})` : fmt(balance)}
              />
            </div>
            <div className="mt-4 rounded-lg bg-blue-50 px-3 py-2 text-xs text-slate-600 space-y-1">
              <div className="font-semibold text-slate-800 text-sm">หมายเหตุ</div>
              <p>• การคำนวณภาษีเป็นไปตามกฎหมายภาษีเงินได้บุคคลธรรมดา</p>
              <p>• ยอดทั้งปีเป็นประมาณการ โดยนำรายได้และภาษีที่หักของงวดนี้ × 12</p>
            </div>
          </Card>

          <div className="flex gap-3">
            <button
              onClick={() => navigate(LIST_PATH)}
              disabled={saving}
              className="flex-1 h-11 rounded-lg border border-blue-300 bg-white font-semibold text-blue-600 hover:bg-blue-50 disabled:opacity-50"
            >
              ยกเลิก
            </button>
            <button
              onClick={handleSave}
              disabled={saving || hasNegative}
              className="flex-1 h-11 rounded-lg bg-blue-600 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
