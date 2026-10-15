import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { API_URL } from '../config';

const LIST_PATH = '/employees/freelance';

const PREFIXES = ['นาย', 'นาง', 'นางสาว'];

const WORK_TYPES = [
  { value: 'BOTH', label: 'ตู้เล็ก/ตู้ใหญ่' },
  { value: 'SMALL', label: 'ตู้เล็ก' },
  { value: 'LARGE', label: 'ตู้ใหญ่' },
];

const STATUSES = [
  { value: 'ACTIVE', label: 'ทำงานอยู่' },
  { value: 'FINISHED', label: 'สิ้นสุดงาน' },
  { value: 'CANCELLED', label: 'ยกเลิกงาน' },
];

// แผนกและตำแหน่ง (ชุดเดียวกับฟอร์มพนักงาน)
const DEPARTMENTS = [
  'ฝ่ายวิศวกรรมและการออกแบบ',
  'ฝ่ายการผลิตและประกอบ',
  'ฝ่ายประกันคุณภาพ (QA/QC)',
  'ฝ่ายขายและพัฒนาธุรกิจ',
  'ฝ่ายจัดซื้อและสโตร์',
  'ฝ่ายบัญชีและการเงิน',
  'ฝ่ายบริหารงานบุคคล (HR)',
  'ฝ่ายบริการและติดตั้ง',
  'ฝ่ายจัดส่งและโลจิสติกส์',
];

const POSITIONS = [
  'เจ้าหน้าที่คลังสินค้าและอุปกรณ์ไฟฟ้า',
  'เจ้าหน้าที่จัดซื้ออุปกรณ์ไฟฟ้า',
  'เจ้าหน้าที่ HR & จป.วิชาชีพ',
  'เจ้าหน้าที่ QC ตรวจสอบตู้ไฟ',
  'ช่างเดินสายไฟตู้สวิตช์บอร์ด (Wiring)',
  'ช่างประกอบโครงตู้และบัสบาร์',
  'ผู้จัดการฝ่ายบัญชีโรงงาน',
  'พนักงานขับรถขนส่งตู้ไฟฟ้า',
  'วิศวกรทดสอบระบบไฟฟ้า',
  'วิศวกรออกแบบ 2D & Single Line',
  'หัวหน้าทีมติดตั้งและ Commissioning',
  'หัวหน้าแผนกประกอบตู้คอนโทรล',
  'หัวหน้าวิศวกรออกแบบตู้ MDB',
  'Sales Executive',
  'Senior Sales Engineer',
];

// ธนาคาร (ตามข้อมูลใน Database.sql)
const BANKS = ['กสิกรไทย', 'ไทยพาณิชย์', 'กรุงเทพ', 'กรุงไทย', 'กรุงศรี'];

const DEFAULT_SMALL_RATE = 800;
const DEFAULT_LARGE_RATE = 1000;

const CODE_PREFIX = 'FR';
const CODE_DIGITS = 3; // ใช้เมื่อยังไม่มีรหัสเดิมให้อ้างอิง

// หารหัสที่เลขท้ายมากที่สุดของฟรีแลนซ์ แล้วบวก 1
// (รองรับรูปแบบ FR005, FR-005, fr005 ฯลฯ และใช้คำนำหน้า/จำนวนหลักตามของเดิม)
const getNextCode = (list) => {
  const freelancers = (Array.isArray(list) ? list : []).filter(
    (e) => e.employment_type === 'ฟรีแลนซ์'
  );

  let max = 0;
  let prefix = CODE_PREFIX;
  let digits = CODE_DIGITS;

  freelancers.forEach((e) => {
    const code = String(e.employee_code || '').trim();
    const m = /^(.*?)(\d+)$/.exec(code);
    if (!m) return;
    const num = parseInt(m[2], 10);
    if (num >= max) {
      max = num;
      prefix = m[1];
      digits = m[2].length;
    }
  });

  return `${prefix}${String(max + 1).padStart(digits, '0')}`;
};

const EMPTY_FORM = {
  employee_code: '',
  prefix: 'นาย',
  first_name: '',
  last_name: '',
  phone: '',
  email: '',
  department: '',
  position: '',
  bank_name: 'กสิกรไทย',
  bank_account_no: '',
  work_type: 'BOTH',
  small_qty: '',
  large_qty: '',
  status: 'ACTIVE',
};

const inputClass =
  'w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-400';

// อยู่นอก component เพื่อไม่ให้ช่องกรอกถูกสร้างใหม่ทุกครั้งที่พิมพ์
function Field({ label, required, children, htmlFor }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="block text-sm text-slate-700 mb-1.5">
        {label}
        {required && '*'}
      </label>
      {children}
    </div>
  );
}

// ช่องกรอกจำนวน พร้อมป้ายอัตราต่อตู้ด้านขวา (เช่น 800/ตู้)
function QtyField({ id, label, value, onChange, rate, disabled }) {
  return (
    <Field label={label} required={!disabled} htmlFor={id}>
      <div className="flex">
        <input
          id={id}
          type="number"
          min="0"
          step="1"
          required={!disabled}
          disabled={disabled}
          value={disabled ? 0 : value}
          onChange={onChange}
          className={`${inputClass} rounded-r-none border-r-0`}
        />
        <span className="shrink-0 flex items-center px-3 text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-r-lg whitespace-nowrap">
          {rate.toLocaleString()}/ตู้
        </span>
      </div>
    </Field>
  );
}

export default function FreelanceForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [form, setForm] = useState(EMPTY_FORM);
  // ข้อมูลเดิมจากฐานข้อมูล: ฟิลด์ที่ฟอร์มนี้ไม่ได้แก้ (เช่น ที่อยู่ บัญชีธนาคาร สถานะการจ่าย) จะถูกส่งกลับไปเหมือนเดิม
  const [original, setOriginal] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const smallRate = Number(original.small_rate) || DEFAULT_SMALL_RATE;
  const largeRate = Number(original.large_rate) || DEFAULT_LARGE_RATE;

  useEffect(() => {
    setLoading(true);
    fetch(`${API_URL}/employees`)
      .then((res) => {
        if (!res.ok) throw new Error(`โหลดข้อมูลไม่สำเร็จ (รหัสสถานะ: ${res.status})`);
        return res.json();
      })
      .then((list) => {
        // โหมดเพิ่ม: สร้างรหัสถัดไปอัตโนมัติ
        if (!isEdit) {
          setForm((f) => ({ ...f, employee_code: getNextCode(list) }));
          setLoading(false);
          return;
        }

        // โหมดแก้ไข: โหลดข้อมูลเดิม
        const emp = (Array.isArray(list) ? list : []).find((e) => String(e.id) === String(id));
        if (!emp) throw new Error('ไม่พบฟรีแลนซ์ที่ต้องการแก้ไข');
        setOriginal(emp);
        setForm({
          employee_code: emp.employee_code || '',
          prefix: emp.prefix || 'นาย',
          first_name: emp.first_name || '',
          last_name: emp.last_name || '',
          phone: emp.phone || '',
          email: emp.email || '',
          department: DEPARTMENTS.includes(emp.department) ? emp.department : '',
          position: POSITIONS.includes(emp.position) ? emp.position : '',
          bank_name: BANKS.includes(emp.bank_name) ? emp.bank_name : 'กสิกรไทย',
          bank_account_no: emp.bank_account_no || '',
          work_type: emp.work_type || 'BOTH',
          small_qty: emp.small_qty ?? 0,
          large_qty: emp.large_qty ?? 0,
          status: STATUSES.some((s) => s.value === emp.status) ? emp.status : 'ACTIVE',
        });
        setLoading(false);
      })
      .catch((err) => {
        console.error('Load Error:', err);
        setError(err.message);
        setLoading(false);
      });
  }, [id, isEdit]);

  const smallDisabled = form.work_type === 'LARGE';
  const largeDisabled = form.work_type === 'SMALL';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      ...original,
      ...form,
      employment_type: 'ฟรีแลนซ์',
      small_qty: smallDisabled ? 0 : Math.max(0, parseInt(form.small_qty, 10) || 0),
      large_qty: largeDisabled ? 0 : Math.max(0, parseInt(form.large_qty, 10) || 0),
      small_rate: smallRate,
      large_rate: largeRate,
    };

    try {
      const res = await fetch(`${API_URL}/employees${isEdit ? `/${id}` : ''}`, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const msg = (await res.text()).trim();
        throw new Error(msg || `บันทึกไม่สำเร็จ (รหัสสถานะ: ${res.status})`);
      }
      navigate(LIST_PATH);
    } catch (err) {
      console.error('Save Error:', err);
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <div className="w-full text-slate-800">
      <div className="flex items-center gap-3 mb-6">
        <div className="text-[#1E3A8A]">
          {isEdit ? (
            <svg className="w-9 h-9" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 4H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2v-5M18.5 2.5a2.1 2.1 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          ) : (
            <svg className="w-9 h-9 fill-current" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
            </svg>
          )}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 leading-tight">
            {isEdit ? 'แก้ไขข้อมูลฟรีแลนซ์' : 'เพิ่มข้อมูลฟรีแลนซ์'}
          </h1>
          <p className="text-xs text-slate-600">
            {isEdit ? 'แก้ไขข้อมูลฟรีแลนซ์ให้ครบถ้วน' : 'กรอกข้อมูลฟรีแลนซ์ให้ครบถ้วน'}
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 max-w-5xl"
      >
        <h2 className="text-lg font-bold text-slate-900 pb-2 mb-6 border-b border-slate-200 w-fit pr-24">
          ข้อมูลฟรีแลนซ์
        </h2>

        {error && (
          <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs">
            {error}
          </div>
        )}

        {loading ? (
          <div className="py-10 text-center text-slate-400 text-sm">กำลังโหลดข้อมูล...</div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-5">
              <Field label="รหัสฟรีแลนซ์" required htmlFor="employee_code">
                <input
                  id="employee_code"
                  required
                  readOnly
                  value={form.employee_code}
                  onChange={set('employee_code')}
                  placeholder="FR001"
                  className={`${inputClass} bg-slate-50 text-slate-500 cursor-not-allowed`}
                />
              </Field>

              <Field label="ประเภทการทำตู้" required htmlFor="work_type">
                <select
                  id="work_type"
                  value={form.work_type}
                  onChange={set('work_type')}
                  className={inputClass}
                >
                  {WORK_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </Field>

              <Field label="ชื่อ-นามสกุล" required htmlFor="first_name">
                <div className="grid grid-cols-[6rem_1fr_1fr] gap-2">
                  <select
                    aria-label="คำนำหน้า"
                    value={form.prefix}
                    onChange={set('prefix')}
                    className={inputClass}
                  >
                    {PREFIXES.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                  <input
                    id="first_name"
                    required
                    value={form.first_name}
                    onChange={set('first_name')}
                    placeholder="ชื่อ"
                    className={inputClass}
                  />
                  <input
                    aria-label="นามสกุล"
                    required
                    value={form.last_name}
                    onChange={set('last_name')}
                    placeholder="นามสกุล"
                    className={inputClass}
                  />
                </div>
              </Field>

              <QtyField
                id="small_qty"
                label="อัตราตู้เล็ก"
                value={form.small_qty}
                onChange={set('small_qty')}
                rate={smallRate}
                disabled={smallDisabled}
              />

              <Field label="เบอร์โทรศัพท์" required htmlFor="phone">
                <input
                  id="phone"
                  required
                  type="tel"
                  value={form.phone}
                  onChange={set('phone')}
                  placeholder="084-747-1188"
                  className={inputClass}
                />
              </Field>

              <QtyField
                id="large_qty"
                label="อัตราตู้ใหญ่"
                value={form.large_qty}
                onChange={set('large_qty')}
                rate={largeRate}
                disabled={largeDisabled}
              />

              <Field label="อีเมล" htmlFor="email">
                <input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={set('email')}
                  placeholder="yamon@gmail.com"
                  className={inputClass}
                />
              </Field>

              <fieldset>
                <legend className="block text-sm text-slate-700 mb-2">สถานะ*</legend>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-800">
                  {STATUSES.map((s) => (
                    <label key={s.value} className="inline-flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="status"
                        value={s.value}
                        checked={form.status === s.value}
                        onChange={set('status')}
                        className="accent-[#1E3A8A]"
                      />
                      {s.label}
                    </label>
                  ))}
                </div>
              </fieldset>

              <Field label="แผนก" required htmlFor="department">
                <select
                  id="department"
                  required
                  value={form.department}
                  onChange={set('department')}
                  className={inputClass}
                >
                  <option value="">เลือกแผนก</option>
                  {DEPARTMENTS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </Field>

              <Field label="ตำแหน่ง" required htmlFor="position">
                <select
                  id="position"
                  required
                  value={form.position}
                  onChange={set('position')}
                  className={inputClass}
                >
                  <option value="">เลือกตำแหน่ง</option>
                  {POSITIONS.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </Field>

              <Field label="ธนาคาร" required htmlFor="bank_name">
                <select
                  id="bank_name"
                  required
                  value={form.bank_name}
                  onChange={set('bank_name')}
                  className={inputClass}
                >
                  {BANKS.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </Field>

              <Field label="เลขบัญชี" required htmlFor="bank_account_no">
                <input
                  id="bank_account_no"
                  required
                  inputMode="numeric"
                  maxLength={50}
                  value={form.bank_account_no}
                  onChange={set('bank_account_no')}
                  placeholder="123-4-56789-0"
                  className={inputClass}
                />
              </Field>
            </div>

            <div className="flex justify-end gap-3 mt-10">
              <button
                type="button"
                onClick={() => navigate(LIST_PATH)}
                disabled={saving}
                className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 text-sm font-semibold px-6 py-2.5 rounded-lg shadow-sm transition-colors"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={saving}
                className="bg-[#5B6EF5] hover:bg-[#4A5CE0] disabled:opacity-60 text-white text-sm font-semibold px-6 py-2.5 rounded-lg shadow-sm transition-colors"
              >
                {saving ? 'กำลังบันทึก...' : isEdit ? 'บันทึกการแก้ไข' : 'บันทึกข้อมูล'}
              </button>
            </div>
          </>
        )}
      </form>
    </div>
  );
}
