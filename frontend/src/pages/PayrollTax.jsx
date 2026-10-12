import React from 'react';

export default function PayrollTax() {
  // ข้อมูลจำลองตามรูปภาพ
  const taxData = [
    {
      no: 1,
      id: 'EMP001',
      name: 'นายสมชาย ใจดี',
      income: '360,000',
      allowance: '60,000',
      taxBase: '300,000',
      taxAmount: '875',
      status: 'คำนวณแล้ว',
    },
    {
      no: 2,
      id: 'EMP002',
      name: 'นางสาวกนกวรรณ ศรีสุข',
      income: '320,000',
      allowance: '60,000',
      taxBase: '260,000',
      taxAmount: '765',
      status: 'คำนวณแล้ว',
    },
    {
      no: 3,
      id: 'EMP003',
      name: 'นายธีรภัทร คงศรี',
      income: '480,000',
      allowance: '60,000',
      taxBase: '420,000',
      taxAmount: '1,540',
      status: 'คำนวณแล้ว',
    },
    {
      no: 4,
      id: 'EMP004',
      name: 'นางสาวธิดา ศรีสวัสดิ์',
      income: '260,000',
      allowance: '60,000',
      taxBase: '200,000',
      taxAmount: '620',
      status: 'คำนวณแล้ว',
    },
    {
      no: 5,
      id: 'EMP005',
      name: 'นายธนกร แสงดาว',
      income: '220,000',
      allowance: '60,000',
      taxBase: '160,000',
      taxAmount: '510',
      status: 'คำนวณแล้ว',
    },
  ];

  return (
    <div className="w-full text-slate-800 space-y-6">
      {/* หัวข้อหน้า */}
      <h1 className="text-2xl font-bold text-slate-900">
        ข้อมูลภาษีเงินได้บุคคลธรรมดา
      </h1>

      {/* แถบการ์ดสรุป 3 กล่องด้านบน */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* พนักงานทั้งหมด */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <svg className="w-7 h-7 fill-current" viewBox="0 0 24 24">
              <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
            </svg>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-600">พนักงานทั้งหมด</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-0.5">
              35 <span className="text-lg font-bold">คน</span>
            </p>
          </div>
        </div>

        {/* ยอดภาษีรวม */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <svg className="w-7 h-7 fill-current" viewBox="0 0 24 24">
              <path d="M11 2v20c-5.07-.5-9-4.79-9-10s3.93-9.5 9-10zm2.03 0v8.99H22c-.47-4.74-4.24-8.52-8.97-8.99zm0 11.01V22c4.74-.47 8.5-4.25 8.97-8.99h-8.97z"/>
            </svg>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-600">ยอดภาษีรวม</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-0.5">
              42,350 <span className="text-lg font-bold">บาท</span>
            </p>
          </div>
        </div>

        {/* ค่าใช้จ่าย/ลดหย่อนรวม */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <svg className="w-7 h-7 fill-current" viewBox="0 0 24 24">
              <path d="M19 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.89-2-2-2zm-7 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm6 12H6v-1c0-2 4-3.1 6-3.1s6 1.1 6 3.1v1z"/>
            </svg>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-600">ค่าใช้จ่าย/ลดหย่อนรวม</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-0.5">
              320,000 <span className="text-lg font-bold">บาท</span>
            </p>
          </div>
        </div>
      </div>

      {/* ตัวกรองค้นหา */}
      <div className="flex flex-wrap items-end gap-4">
        <div className="w-48">
          <label className="block text-xs font-bold text-slate-700 mb-1.5">แผนก</label>
          <div className="relative">
            <select className="w-full bg-white border border-slate-200 text-slate-700 py-2.5 px-3.5 pr-8 rounded-xl appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs font-medium cursor-pointer shadow-sm">
              <option>ทั้งหมด</option>
              <option>ฝ่ายบัญชี</option>
              <option>ฝ่ายการเงิน</option>
              <option>ฝ่ายบุคคล</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-blue-600">
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
                <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="w-48">
          <label className="block text-xs font-bold text-slate-700 mb-1.5">ประเภทพนักงาน</label>
          <div className="relative">
            <select className="w-full bg-white border border-slate-200 text-slate-700 py-2.5 px-3.5 pr-8 rounded-xl appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs font-medium cursor-pointer shadow-sm">
              <option>ทั้งหมด</option>
              <option>พนักงานประจำ</option>
              <option>พนักงานฟรีแลนซ์</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-blue-600">
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
                <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
              </svg>
            </div>
          </div>
        </div>

        <button className="flex items-center gap-1.5 bg-[#2563EB] hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-sm transition-all active:scale-95 cursor-pointer">
          <svg className="w-3.5 h-3.5 fill-none stroke-current" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
          </svg>
          <span>ค้นหา</span>
        </button>
      </div>

      {/* ส่วนเนื้อหาหลัก: ตาราง (ซ้าย) + ข้อมูลเพิ่มเติม/ส่งออก (ขวา) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ตารางแสดงข้อมูลภาษี */}
        <div className="lg:col-span-9 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#E5E7EB] text-slate-800 font-bold border-b border-slate-300">
                  <th className="py-3.5 px-3 text-center">ลำดับ</th>
                  <th className="py-3.5 px-3 text-center">รหัสพนักงาน</th>
                  <th className="py-3.5 px-4">ชื่อ-นามสกุล</th>
                  <th className="py-3.5 px-3 text-center">เงินได้ทั้งสิ้น</th>
                  <th className="py-3.5 px-3 text-center">ค่าลดหย่อน</th>
                  <th className="py-3.5 px-3 text-center">ฐานภาษี</th>
                  <th className="py-3.5 px-3 text-center">ภาษีที่ต้องเสีย</th>
                  <th className="py-3.5 px-3 text-center">สถานะ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {taxData.map((item) => (
                  <tr key={item.no} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-3 text-center text-slate-600 font-medium">{item.no}</td>
                    <td className="py-3.5 px-3 text-center text-slate-900 font-medium">{item.id}</td>
                    <td className="py-3.5 px-4 font-medium text-slate-800 whitespace-nowrap">{item.name}</td>
                    <td className="py-3.5 px-3 text-center font-medium text-slate-700">{item.income}</td>
                    <td className="py-3.5 px-3 text-center font-medium text-slate-700">{item.allowance}</td>
                    <td className="py-3.5 px-3 text-center font-medium text-slate-700">{item.taxBase}</td>
                    <td className="py-3.5 px-3 text-center font-bold text-slate-800">{item.taxAmount}</td>
                    <td className="py-3.5 px-3 text-center whitespace-nowrap">
                      <span className="inline-block px-3 py-0.5 rounded-md text-[11px] font-semibold bg-[#22C55E] text-white">
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* กล่องข้อมูลเพิ่มเติมและปุ่มส่งออก Excel ทางขวา */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
            <h3 className="font-bold text-sm text-slate-900">ข้อมูลเพิ่มเติม</h3>
            <div className="space-y-1.5 text-xs text-slate-600">
              <p className="flex justify-between">
                <span>อัตราภาษี :</span>
                <span className="font-semibold text-slate-800">ตามขั้นบันได</span>
              </p>
              <p className="flex justify-between">
                <span>ค่าลดหย่อน :</span>
                <span className="font-semibold text-slate-800">60,000 บาท/ปี</span>
              </p>
            </div>
            <button className="w-full mt-2 py-2 px-3 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer">
              ดูรายละเอียดอัตราภาษี
            </button>
          </div>

          <button className="w-full flex items-center justify-center gap-2 bg-[#2563EB] hover:bg-blue-700 text-white py-3 px-4 rounded-2xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all active:scale-95 cursor-pointer">
            <svg className="w-4 h-4 fill-none stroke-current" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span>ส่งออก Excel</span>
          </button>
        </div>

      </div>

      {/* แถบการแบ่งหน้าแบบเดียวกับหน้าการลา */}
      <div className="flex items-center justify-between pt-2 text-xs text-slate-600">
        <span className="font-bold text-slate-800">หน้า 1 จาก 5 หน้า</span>
        <div className="flex items-center gap-1 select-none">
          <button className="px-2.5 py-1 rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 font-bold cursor-pointer">&lt;</button>
          <button className="px-3 py-1 rounded bg-[#2563EB] text-white font-bold cursor-pointer">1</button>
          <button className="px-3 py-1 rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold cursor-pointer">2</button>
          <button className="px-3 py-1 rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold cursor-pointer">3</button>
          <button className="px-3 py-1 rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold cursor-pointer">4</button>
          <button className="px-3 py-1 rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold cursor-pointer">5</button>
          <button className="px-2.5 py-1 rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 font-bold cursor-pointer">&gt;</button>
        </div>
      </div>
    </div>
  );
}   