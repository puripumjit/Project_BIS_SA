import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { API_URL } from '../config';

const LIST_PATH = '/employees/permanent';

const PREFIXES = ['นาย', 'นาง', 'นางสาว'];

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

const EMPTY_FORM = {
  employee_code: '',
  prefix: 'นาย',
  first_name: '',
  last_name: '',
  position: '',
  department: '',
  employment_type: 'ประจำ', // หน้านี้ใช้กับพนักงานประจำ ไม่แสดงในฟอร์ม
  phone: '',
  email: '',
  start_date: '',
  address: '',
  status: 'ACTIVE',
  base_salary: '',
  hourly_ot_rate: '',
  bank_name: 'กสิกรไทย',
  bank_account_no: '',
};

const inputClass =
  'w-full bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500';

// อยู่นอก component เพื่อไม่ให้ช่องกรอกถูกสร้างใหม่ทุกครั้งที่พิมพ์
function Field({ label, required, children, htmlFor, className = '' }) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="block text-sm text-slate-700 mb-1.5">
        {label}
        {required && '*'}
      </label>
      {children}
    </div>
  );
}

export default function EmployeeForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [form, setForm] = useState(EMPTY_FORM);
  const [positions, setPositions] = useState([]); // ตำแหน่งที่มีอยู่ในข้อมูลพนักงานประจำ
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  // โหลดข้อมูลพนักงานทั้งหมด: ใช้สร้างรายการตำแหน่ง และ (โหมดแก้ไข) ใส่ข้อมูลลงฟอร์ม
  useEffect(() => {
    setLoading(true);
    fetch(`${API_URL}/employees`)
      .then((res) => {
        if (!res.ok) throw new Error(`โหลดข้อมูลไม่สำเร็จ (รหัสสถานะ: ${res.status})`);
        return res.json();
      })
      .then((data) => {
        const list = Array.isArray(data) ? data : [];

        const uniquePositions = Array.from(
          new Set(
            list
              .filter((e) => e.employment_type === 'ประจำ')
              .map((e) => (e.position || '').trim())
              .filter(Boolean)
          )
        ).sort((a, b) => a.localeCompare(b, 'th'));
        setPositions(uniquePositions);

        if (isEdit) {
          const emp = list.find((e) => String(e.id) === String(id));
          if (!emp) throw new Error('ไม่พบพนักงานที่ต้องการแก้ไข');
          setForm({
            employee_code: emp.employee_code || '',
            prefix: emp.prefix || 'นาย',
            first_name: emp.first_name || '',
            last_name: emp.last_name || '',
            position: emp.position || '',
            department: emp.department || '',
            employment_type: emp.employment_type || 'ประจำ',
            phone: emp.phone || '',
            email: emp.email || '',
            start_date: (emp.start_date || '').slice(0, 10),
            address: emp.address || '',
            status: emp.status === 'ACTIVE' ? 'ACTIVE' : 'RESIGNED',
            base_salary: emp.base_salary ?? '',
            hourly_ot_rate: emp.hourly_ot_rate ?? '',
            bank_name: emp.bank_name || 'กสิกรไทย',
            bank_account_no: emp.bank_account_no || '',
          });
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Load Error:', err);
        setError(err.message);
        setLoading(false);
      });
  }, [id, isEdit]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      ...form,
      base_salary: Number(form.base_salary) || 0,
      hourly_ot_rate: Number(form.hourly_ot_rate) || 0,
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

  // ถ้าค่าเดิมของพนักงานไม่อยู่ในรายการ ให้เพิ่มเป็นตัวเลือกด้วย จะได้ไม่หายไปตอนแก้ไข
  const departmentOptions = useMemo(
    () =>
      form.department && !DEPARTMENTS.includes(form.department)
        ? [form.department, ...DEPARTMENTS]
        : DEPARTMENTS,
    [form.department]
  );

  const positionOptions = useMemo(
    () =>
      form.position && !positions.includes(form.position)
        ? [form.position, ...positions]
        : positions,
    [form.position, positions]
  );

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
            {isEdit ? 'แก้ไขข้อมูลพนักงาน' : 'เพิ่มข้อมูลพนักงาน'}
          </h1>
          <p className="text-xs text-slate-600">
            {isEdit ? 'แก้ไขข้อมูลพนักงานให้ครบถ้วน' : 'กรอกข้อมูลพนักงานให้ครบถ้วน'}
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 max-w-5xl"
      >
        <h2 className="text-lg font-bold text-slate-900 pb-2 mb-6 border-b border-slate-200 w-fit pr-24">
          ข้อมูลพนักงาน
        </h2>

        {error && (
          <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs">
            {error}
          </div>
        )}

        {loading ? (
          <div className="py-10 text-center text-slate-400 text-sm">กำลังโหลดข้อมูล...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-5">
            <Field label="รหัสพนักงาน" required htmlFor="employee_code">
              <input
                id="employee_code"
                required
                value={form.employee_code}
                onChange={set('employee_code')}
                placeholder="EMP011"
                className={inputClass}
              />
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
                {positionOptions.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </Field>

            <Field label="ชื่อ-นามสกุล" required htmlFor="first_name" className="md:col-span-2">
              <div className="grid grid-cols-[6.5rem_1fr_1fr] gap-2">
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

            <Field label="แผนก" required htmlFor="department">
              <select
                id="department"
                required
                value={form.department}
                onChange={set('department')}
                className={inputClass}
              >
                <option value="">เลือกแผนก</option>
                {departmentOptions.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </Field>

            <Field label="เบอร์โทรศัพท์" required htmlFor="phone">
              <input
                id="phone"
                required
                type="tel"
                value={form.phone}
                onChange={set('phone')}
                placeholder="082-777-8888"
                className={inputClass}
              />
            </Field>

            <Field label="อีเมล" htmlFor="email">
              <input
                id="email"
                type="email"
                value={form.email}
                onChange={set('email')}
                placeholder="smile77@gmail.com"
                className={inputClass}
              />
            </Field>

            <Field label="วันที่เริ่มทำงาน" required htmlFor="start_date">
              <input
                id="start_date"
                required
                type="date"
                value={form.start_date}
                onChange={set('start_date')}
                className={inputClass}
              />
            </Field>

            <Field label="เงินเดือน (บาท)" required htmlFor="base_salary">
              <input
                id="base_salary"
                required
                type="number"
                min="0"
                step="0.01"
                value={form.base_salary}
                onChange={set('base_salary')}
                placeholder="25000"
                className={inputClass}
              />
            </Field>

            <Field label="ค่าล่วงเวลา (บาท/ชม.)" htmlFor="hourly_ot_rate">
              <input
                id="hourly_ot_rate"
                type="number"
                min="0"
                step="0.01"
                value={form.hourly_ot_rate}
                onChange={set('hourly_ot_rate')}
                placeholder="เว้นว่างให้ระบบคำนวณจากเงินเดือน"
                className={inputClass}
              />
            </Field>

            <Field label="ธนาคาร" htmlFor="bank_name">
              <input
                id="bank_name"
                value={form.bank_name}
                onChange={set('bank_name')}
                placeholder="กสิกรไทย"
                className={inputClass}
              />
            </Field>

            <Field label="เลขที่บัญชี" htmlFor="bank_account_no">
              <input
                id="bank_account_no"
                value={form.bank_account_no}
                onChange={set('bank_account_no')}
                placeholder="123-4-56789-0"
                className={inputClass}
              />
            </Field>

            <Field label="ที่อยู่" htmlFor="address">
              <textarea
                id="address"
                rows={4}
                value={form.address}
                onChange={set('address')}
                placeholder="123/4 หมู่ 8 ต.ตัวอย่าง อ.เมือง จ.ชลบุรี 45555"
                className={`${inputClass} resize-none`}
              />
            </Field>

            <div className="flex flex-col justify-between">
              <fieldset>
                <legend className="block text-sm text-slate-700 mb-2">สถานะ*</legend>
                <div className="flex items-center gap-6 text-sm text-slate-800">
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      value="ACTIVE"
                      checked={form.status === 'ACTIVE'}
                      onChange={set('status')}
                      className="accent-[#1E3A8A]"
                    />
                    ทำงานอยู่
                  </label>
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      value="RESIGNED"
                      checked={form.status === 'RESIGNED'}
                      onChange={set('status')}
                      className="accent-[#1E3A8A]"
                    />
                    ลาออก/พ้นสภาพ
                  </label>
                </div>
              </fieldset>

              <div className="flex justify-end gap-3 mt-6">
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
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
    