import React, { useState, useRef } from 'react';

// วางไฟล์ wp.jpg ไว้ในโฟลเดอร์ public/ ของโปรเจกต์ (เรียกใช้ที่ /wp.jpg)
const DEFAULT_LOGO = '/wp.jpg';

const INITIAL_FORM = {
  companyName: 'บริษัท WP ELECTRIC จำกัด',
  address: 'เลขที่ 2/79 หมู่ที่ 3 ตำบลศาลายา อำเภอพุทธมณฑล จังหวัดนครปฐม 73170',
  taxId: '0105563080659',
  phone: '092-414-8990',
};

const inputClass =
  'w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition';

const labelClass = 'block text-sm font-semibold text-slate-700 mb-1.5';

export default function Settings() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [logo, setLogo] = useState(DEFAULT_LOGO);
  const [saved, setSaved] = useState({ form: INITIAL_FORM, logo: DEFAULT_LOGO });
  const [showSuccess, setShowSuccess] = useState(false);
  const fileInputRef = useRef(null);
  const timerRef = useRef(null);

  const handleChange = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setLogo(reader.result);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSave = () => {
    // TODO: เรียก API บันทึกข้อมูลที่นี่ เช่น fetch('/api/settings', { method: 'POST', body: JSON.stringify({ ...form, logo }) })
    setSaved({ form, logo });
    setShowSuccess(true);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleCancel = () => {
    setForm(saved.form);
    setLogo(saved.logo);
  };

  return (
    <div className="w-full min-h-[85vh] flex items-center justify-center">
    <div className="w-full max-w-5xl text-slate-800 space-y-6">
      {/* หัวข้อหน้า */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
          <svg className="w-6 h-6 fill-none stroke-current" viewBox="0 0 24 24" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 leading-tight">การตั้งค่า</h1>
          <p className="text-sm text-slate-500">จัดการข้อมูลและโลโก้ของบริษัท</p>
        </div>
      </div>

      {/* การ์ดข้อมูลบริษัท */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        {/* หัวการ์ด */}
        <div className="flex items-center gap-3 px-8 py-5 border-b border-slate-100">
          <span className="text-xl">🏢</span>
          <h2 className="text-lg font-bold text-slate-900">ข้อมูลบริษัท</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12">
          {/* ฝั่งโลโก้ */}
          <div className="md:col-span-4 flex flex-col items-center justify-center gap-5 p-8 bg-slate-50/70 md:border-r border-b md:border-b-0 border-slate-100">
            <div className="w-44 h-44 bg-white rounded-3xl border border-slate-200 shadow-sm flex items-center justify-center p-4 overflow-hidden">
              <img
                src={logo}
                alt="โลโก้ WP ELECTRIC"
                className="max-w-full max-h-full object-contain"
              />
            </div>

            <div className="text-center space-y-1">
              <p className="text-sm font-bold text-slate-800">โลโก้บริษัท</p>
              <p className="text-xs text-slate-500">รองรับไฟล์ภาพ JPG, PNG</p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleLogoChange}
              className="hidden"
              style={{ display: 'none' }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 bg-white border border-slate-200 hover:border-blue-500 hover:text-blue-600 text-slate-700 text-sm font-semibold px-5 py-2.5 rounded-xl shadow-sm transition active:scale-95 cursor-pointer"
            >
              <svg className="w-4 h-4 fill-none stroke-current" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M16 8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              เปลี่ยนโลโก้
            </button>
          </div>

          {/* ฝั่งฟอร์ม */}
          <div className="md:col-span-8 p-8 space-y-5">
            <div>
              <label className={labelClass}>ชื่อบริษัท</label>
              <input
                type="text"
                value={form.companyName}
                onChange={handleChange('companyName')}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>ที่อยู่</label>
              <textarea
                rows="3"
                value={form.address}
                onChange={handleChange('address')}
                className={`${inputClass} resize-none leading-relaxed`}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className={labelClass}>เลขประจำตัวผู้เสียภาษี</label>
                <input
                  type="text"
                  value={form.taxId}
                  onChange={handleChange('taxId')}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>เบอร์โทรศัพท์</label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={handleChange('phone')}
                  className={inputClass}
                />
              </div>
            </div>
          </div>
        </div>

        {/* แถบปุ่มท้ายการ์ด */}
        <div className="flex items-center justify-end gap-3 px-8 py-5 bg-slate-50/70 border-t border-slate-100">
          {showSuccess && (
            <span className="mr-auto inline-flex items-center gap-2 text-sm font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 px-3.5 py-2 rounded-xl">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.704 5.296a1 1 0 010 1.414l-7.5 7.5a1 1 0 01-1.414 0l-3.5-3.5a1 1 0 011.414-1.414L8.5 12.086l6.793-6.79a1 1 0 011.411 0z" clipRule="evenodd" />
              </svg>
              บันทึกการตั้งค่าเรียบร้อยแล้ว
            </span>
          )}
          <button
            type="button"
            onClick={handleCancel}
            className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold px-6 py-2.5 rounded-xl text-sm transition active:scale-95 cursor-pointer"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center gap-2 bg-[#2563EB] hover:bg-blue-700 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition active:scale-95 shadow-md shadow-blue-500/25 cursor-pointer"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
              <path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l6-6a1 1 0 00-1.414-1.414L11 12.586l-3.293-3.293z" />
            </svg>
            บันทึกการตั้งค่า
          </button>
        </div>
      </div>
    </div>
    </div>
  );
}
