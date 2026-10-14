import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  fetchTaxDetail, updateTax, calcTax, fmt, fullName, formatPeriod,
  FORM_KEYS, STATUS_LABEL,
} from './PayrollTax';

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
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const periodParam = searchParams.get('period') || '';
  const navigate = useNavigate();

  const [emp, setEmp] = useState(null);
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchTaxDetail(id, periodParam)
      .then((data) => {
        if (cancelled) return;
        setEmp(data);
        setForm(Object.fromEntries(FORM_KEYS.map((k) => [k, String(data[k] ?? 0)])));
      })
      .catch((e) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [id, periodParam]);

  const set = (key) => (v) => setForm((f) => ({ ...f, [key]: v }));

  const calc = useMemo(() => (form ? calcTax(form) : null), [form]);
  const totalWithheld = emp && form ? (emp.ytd_withheld || 0) + (Number(form.withheld_paid) || 0) : 0;
  const balance = calc ? calc.tax - totalWithheld : 0;
  const hasNegative = form && FORM_KEYS.some((k) => Number(form[k]) < 0);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const payload = Object.fromEntries(FORM_KEYS.map((k) => [k, Number(form[k]) || 0]));
      await updateTax(id, emp.period, payload);
      navigate('/payroll/tax');
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
        <Link to="/payroll/tax" className="text-sm text-blue-600">← กลับไปหน้ารายการภาษี</Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <Link to="/payroll/tax" className="text-sm text-slate-500 hover:text-blue-600">← กลับไปหน้ารายการภาษี</Link>
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
                {emp.first_name.charAt(0)}
              </div>
              <div className="flex-1 min-w-[220px]">
                <div className="font-bold text-slate-800">{emp.employee_code}</div>
                <div className="font-bold text-slate-800">{fullName(emp)}</div>
                <div className="text-xs text-slate-500 mt-1">แผนก : {emp.department} | ตำแหน่ง : {emp.position}</div>
                <div className="text-xs text-slate-500">ประเภท : {emp.employment_type}</div>
              </div>
              <div className="text-sm">
                <div className="text-xs text-slate-500">สถานะภาษี</div>
                <span className={`inline-block mt-1 rounded-full px-3 py-0.5 text-xs font-medium ${emp.status === 'PENDING' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
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
            </div>
            <p className="mt-3 rounded-lg bg-blue-50 px-4 py-2 text-xs text-slate-600">
              ค่าที่แก้ไขในหน้านี้ใช้เพื่อคำนวณภาษีเท่านั้น ไม่เปลี่ยนเงินเดือนพื้นฐานในข้อมูลพนักงาน
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
              สามารถตรวจสอบวงเงินค่าลดหย่อนสูงสุดได้ตามกฎหมาย หรือสอบถามจากฝ่ายบัญชี
            </p>
          </Card>
        </div>

        <div className="xl:w-96 shrink-0 space-y-5">
          <Card title="3. ภาษีที่หัก ณ ที่จ่ายแล้ว">
            <label className="block text-xs text-slate-500 mb-1">จำนวนเงิน (บาท)</label>
            <MoneyInput className="w-full" value={form.withheld_paid} onChange={set('withheld_paid')} />
            <p className="mt-3 rounded-lg bg-blue-50 px-3 py-2 text-xs text-slate-600">
              กรณีมีการหักภาษี ณ ที่จ่ายไว้แล้ว เช่น การจ่ายโบนัส หรือรายได้พิเศษ สามารถระบุจำนวนเงินได้ที่นี่
              (ภาษีที่หักจากเงินเดือนในระบบจะรวมให้อัตโนมัติ)
            </p>
          </Card>

          <Card title="สรุปการคำนวณภาษี (หลังแก้ไข)">
            <div className="rounded-lg bg-slate-50 py-1">
              <Row label="รายได้รวมที่ใช้คำนวณภาษี (ทั้งปี)" value={fmt(calc.annual)} strong />
              <Row label="ค่าใช้จ่าย (50% ไม่เกิน 100,000)" value={fmt(calc.expense)} />
              <Row label="ค่าลดหย่อนทั้งหมด" value={fmt(calc.allowance)} strong />
              <Row label="เงินได้สุทธิ" value={fmt(calc.net)} />
              <Row label="ภาษีที่ต้องเสีย" value={fmt(calc.tax)} />
              <Row label="ภาษีที่หัก ณ ที่จ่ายแล้ว" value={fmt(totalWithheld)} />
              <Row
                green
                label="ภาษีที่ต้องชำระเพิ่ม / (คืน)"
                value={balance < 0 ? `(${fmt(Math.abs(balance))})` : fmt(balance)}
              />
            </div>
            <div className="mt-4 rounded-lg bg-blue-50 px-3 py-2 text-xs text-slate-600 space-y-1">
              <div className="font-semibold text-slate-800 text-sm">หมายเหตุ</div>
              <p>• การคำนวณภาษีเป็นไปตามกฎหมายภาษีเงินได้บุคคลธรรมดา</p>
              <p>• หากมีการเปลี่ยนแปลงข้อมูล ควรกดปุ่ม "คำนวณใหม่" ที่หน้ารายการภาษี เพื่อให้ยอดภาษีอัปเดตล่าสุด</p>
            </div>
          </Card>

          <div className="flex gap-3">
            <button
              onClick={() => navigate('/payroll/tax')}
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
