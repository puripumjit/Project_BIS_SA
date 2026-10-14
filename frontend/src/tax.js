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
