import React, { useState } from 'react';

export default function Settings() {
  // สถานะแท็บเมนูด้านบน
  const [activeTab, setActiveTab] = useState('general');

  // สถานะ Toggle สวิตช์ในการแจ้งเตือน
  const [sendEmailSlip, setSendEmailSlip] = useState(true);
  const [alertLeaveLate, setAlertLeaveLate] = useState(true);
  const [alertPayrollApproval, setAlertPayrollApproval] = useState(true);

  // สถานะ Checkbox ประเภทผู้รับเงิน
  const [isPermanent, setIsPermanent] = useState(true);
  const [isFreelance, setIsFreelance] = useState(true);

  return (
    <div className="w-full text-slate-800 space-y-6">
      {/* หัวข้อหน้า */}
      <div className="flex items-center gap-3">
        <div className="text-blue-600">
          <svg className="w-8 h-8 fill-none stroke-current" viewBox="0 0 24 24" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-slate-900">การตั้งค่า</h1>
      </div>

      {/* แถบแท็บด้านบน */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-sm flex flex-wrap gap-2.5">
        <button
          onClick={() => setActiveTab('general')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
            activeTab === 'general'
              ? 'bg-[#2563EB] text-white shadow-sm'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <span>⚙️</span> การตั้งค่าทั่วไป
        </button>

        <button
          onClick={() => setActiveTab('salary-tax')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
            activeTab === 'salary-tax'
              ? 'bg-[#2563EB] text-white shadow-sm'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <span>🗂️</span> เงินเดือนและภาษี
        </button>

        <button
          onClick={() => setActiveTab('permissions')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
            activeTab === 'permissions'
              ? 'bg-[#2563EB] text-white shadow-sm'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <span>🛡️</span> สิทธิ์การเข้าถึง
        </button>

        <button
          onClick={() => setActiveTab('notifications')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
            activeTab === 'notifications'
              ? 'bg-[#2563EB] text-white shadow-sm'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <span>🔔</span> การแจ้งเตือน
        </button>
      </div>

      {/* เนื้อหาการตั้งค่าแบ่งเป็น 2 คอลัมน์ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* คอลัมน์ซ้าย (7 ส่วน) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* ข้อมูลบริษัท */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-base mb-1">
              <span className="text-blue-600 text-lg">🏢</span>
              <h2>ข้อมูลบริษัท</h2>
            </div>

            <div className="flex flex-col sm:flex-row gap-5">
              <div className="flex-1 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">ชื่อบริษัท</label>
                  <input
                    type="text"
                    defaultValue="บริษัท WP ELECTRIC จำกัด"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">ที่อยู่</label>
                  <textarea
                    rows="2"
                    defaultValue="เลขที่ 2/79 หมู่ที่ 3 ตำบลศาลายา อำเภอพุทธมณฑล จังหวัดนครปฐม 73170"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">เลขประจำตัวผู้เสียภาษี</label>
                    <input
                      type="text"
                      defaultValue="0105563080659"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">เบอร์โทรศัพท์</label>
                    <input
                      type="text"
                      defaultValue="092-414-8990"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                    />
                  </div>
                </div>
              </div>

              {/* โลโก้บริษัท */}
              <div className="flex flex-col items-center justify-start gap-3 sm:w-36 pt-5 sm:pt-0">
                <div className="w-28 h-20 border border-slate-200 rounded-xl flex items-center justify-center p-2 bg-slate-50/50 shadow-inner">
                  <div className="text-center font-black leading-tight text-slate-800">
                    <span className="text-lg tracking-tighter">⚡ WP</span>
                    <span className="block text-[8px] font-bold tracking-widest text-slate-600">ELECTRIC</span>
                  </div>
                </div>
                <button className="w-full bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-semibold py-2 px-3 rounded-xl shadow-sm transition-all active:scale-95 cursor-pointer">
                  เปลี่ยนโลโก้
                </button>
              </div>
            </div>
          </div>

          {/* ประเภทผู้รับเงิน */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-base mb-1">
              <span className="text-blue-600 text-lg">👥</span>
              <h2>ประเภทผู้รับเงิน</h2>
            </div>

            <div className="flex items-center gap-6 text-xs font-semibold text-slate-700">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPermanent}
                  onChange={(e) => setIsPermanent(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                <span>พนักงานประจำ</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isFreelance}
                  onChange={(e) => setIsFreelance(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                <span>พนักงานฟรีแลนซ์</span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">อัตราภาษีหัก ณ ที่จ่าย</label>
                <div className="relative">
                  <input
                    type="number"
                    defaultValue="3"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 pr-8 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                  />
                  <span className="absolute inset-y-0 right-3 flex items-center text-xs text-slate-500 font-bold">%</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">อัตราภาษีหักประกันสังคม</label>
                <div className="relative">
                  <input
                    type="number"
                    defaultValue="5"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 pr-8 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                  />
                  <span className="absolute inset-y-0 right-3 flex items-center text-xs text-slate-500 font-bold">%</span>
                </div>
              </div>
            </div>
          </div>

          {/* รูปแบบเอกสารและรายงาน */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-base mb-1">
              <span className="text-blue-600 text-lg">📄</span>
              <h2>รูปแบบเอกสารและรายงาน</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">รูปแบบสลิปเงินเดือน</label>
                <div className="relative">
                  <select className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 pr-8 text-xs text-slate-800 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm cursor-pointer">
                    <option>PDF</option>
                    <option>Excel</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-500">
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
                      <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">ภาษาเอกสาร</label>
                <div className="relative">
                  <select className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 pr-8 text-xs text-slate-800 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm cursor-pointer">
                    <option>ไทย</option>
                    <option>English</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-500">
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
                      <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">หัวข้อสลิปเงินเดือน</label>
                <input
                  type="text"
                  defaultValue="สลิปเงินเดือน"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                />
              </div>
            </div>
          </div>

        </div>

        {/* คอลัมน์ขวา (5 ส่วน) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* ปีงบประมาณ */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-base mb-1">
              <span className="text-blue-600 text-lg">📅</span>
              <h2>ปีงบประมาณ</h2>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">ปีงบประมาณปัจจุบัน</label>
              <div className="relative">
                <select className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 pr-8 text-xs text-slate-800 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm cursor-pointer">
                  <option>2569</option>
                  <option>2568</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-blue-600">
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                  </svg>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">รอบการจ่ายเงินเดือน</label>
              <div className="relative">
                <select className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 pr-8 text-xs text-slate-800 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm cursor-pointer">
                  <option>ทุกวันที่ 25 ของเดือน</option>
                  <option>ทุกสิ้นเดือน</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-blue-600">
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* การแจ้งเตือนและอีเมล */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-base mb-1">
              <span className="text-blue-600 text-lg">✉️</span>
              <h2>การแจ้งเตือนและอีเมล</h2>
            </div>

            <div className="space-y-3.5 pt-1">
              {/* สวิตช์ 1 */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setSendEmailSlip(!sendEmailSlip)}
                  className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 ease-in-out ${
                    sendEmailSlip ? 'bg-[#3B82F6]' : 'bg-slate-300'
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                      sendEmailSlip ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
                <span className="text-xs font-semibold text-slate-700">ส่งสลิปเงินเดือนทางอีเมลอัตโนมัติ</span>
              </div>

              {/* สวิตช์ 2 */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setAlertLeaveLate(!alertLeaveLate)}
                  className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 ease-in-out ${
                    alertLeaveLate ? 'bg-[#3B82F6]' : 'bg-slate-300'
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                      alertLeaveLate ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
                <span className="text-xs font-semibold text-slate-700">แจ้งเตือนเมื่อมีการลา/ขาดงาน</span>
              </div>

              {/* สวิตช์ 3 */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setAlertPayrollApproval(!alertPayrollApproval)}
                  className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 ease-in-out ${
                    alertPayrollApproval ? 'bg-[#3B82F6]' : 'bg-slate-300'
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                      alertPayrollApproval ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
                <span className="text-xs font-semibold text-slate-700">แจ้งเตือนการอนุมัติเงินเดือน</span>
              </div>
            </div>
          </div>

          {/* การสำรองข้อมูล */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-base mb-1">
              <span className="text-blue-600 text-lg">💾</span>
              <h2>การสำรองข้อมูล</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">ความถี่ในการสำรองข้อมูล</label>
                <div className="relative">
                  <select className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 pr-8 text-xs text-slate-800 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm cursor-pointer">
                    <option>รายวัน</option>
                    <option>รายสัปดาห์</option>
                    <option>รายเดือน</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-500">
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
                      <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">เก็บข้อมูลย้อนหลัง</label>
                <div className="relative">
                  <select className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 pr-8 text-xs text-slate-800 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm cursor-pointer">
                    <option>30 วัน</option>
                    <option>60 วัน</option>
                    <option>90 วัน</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-500">
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
                      <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* แถบแจ้งเตือนสำรองข้อมูลอัตโนมัติ */}
            <div className="bg-purple-50/60 border border-purple-200/60 text-purple-800 rounded-xl px-3.5 py-2.5 flex items-center gap-2 text-xs font-semibold">
              <svg className="w-4 h-4 text-purple-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span>ระบบจะสำรองข้อมูลอัตโนมัติทุกวัน</span>
            </div>
          </div>

        </div>

      </div>

      {/* แถบปุ่มยกเลิก และ บันทึกการตั้งค่า */}
      <div className="flex justify-end items-center gap-3 pt-2">
        <button
          type="button"
          className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold px-6 py-2.5 rounded-xl text-xs transition-all active:scale-95 shadow-sm cursor-pointer"
        >
          ยกเลิก
        </button>
        <button
          type="button"
          className="flex items-center gap-2 bg-[#2563EB] hover:bg-blue-700 text-white font-semibold px-6 py-2.5 rounded-xl text-xs transition-all active:scale-95 shadow-sm shadow-blue-500/20 cursor-pointer"
        >
          <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
            <path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l6-6a1 1 0 00-1.414-1.414L11 12.586l-3.293-3.293z" />
          </svg>
          <span>บันทึกการตั้งค่า</span>
        </button>
      </div>
    </div>
  );
}