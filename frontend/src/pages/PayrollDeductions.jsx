import React from 'react';

export default function PayrollDeductions() {
  // ข้อมูลจำลองรายการหักอื่น ๆ
  const deductionList = [
    { no: 1, id: 'EMP001', name: 'สมชาย ใจดี', type: 'เงินกู้', amount: '1,000', note: '-' },
    { no: 2, id: 'EMP002', name: 'สมหญิง จริงใจ', type: 'กองทุนสำรองเลี้ยงชีพ', amount: '500', note: '-' },
    { no: 3, id: 'EMP003', name: 'ธนากร ศรีสุข', type: 'หักค่าชุด/ค่าใช้จ่าย', amount: '300', note: '-' },
    { no: 4, id: 'EMP004', name: 'ณัฐชา วงศ์ดี', type: 'เงินกู้', amount: '1,000', note: '-' },
    { no: 5, id: 'EMP005', name: 'ปรางทิพย์ อินทร์นิล', type: 'หักค่าเสียหาย', amount: '700', note: '-' },
  ];

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
          {/* รอบเงินเดือน */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">รอบเงินเดือน</label>
            <div className="relative">
              <select className="w-full bg-white border border-slate-200 text-slate-700 py-2.5 px-3.5 pr-8 rounded-xl appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs font-medium cursor-pointer shadow-sm">
                <option>ตุลาคม 2569</option>
                <option>กันยายน 2569</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-blue-600">
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                </svg>
              </div>
            </div>
          </div>

          {/* แผนก */}
          <div>
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

          {/* ประเภทพนักงาน */}
          <div>
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
        </div>

        {/* ปุ่ม + เพิ่มรายการหัก */}
        <button className="flex items-center justify-center gap-1.5 bg-[#2563EB] hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-sm transition-all active:scale-95 cursor-pointer whitespace-nowrap">
          <span>+</span>
          <span>เพิ่มรายการหัก</span>
        </button>
      </div>

      {/* การ์ดสรุป 2 ใบ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* รายการหักทั้งหมด */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center text-xl shrink-0">
            <svg className="w-6 h-6 fill-none stroke-current" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">รายการหักทั้งหมด</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-0.5">
              45 <span className="text-base font-bold">รายการ</span>
            </p>
          </div>
        </div>

        {/* จำนวนเงินรวม */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-xl shrink-0">
            <svg className="w-6 h-6 fill-none stroke-current" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">จำนวนเงินรวม</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-0.5">
              96,500 <span className="text-base font-bold">บาท</span>
            </p>
          </div>
        </div>
      </div>

      {/* ตารางรายละเอียดรายการหัก */}
      <div>
        <h2 className="text-base font-bold text-slate-900 mb-3">
          รายละเอียดรายการหัก
        </h2>

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
                {deductionList.map((row) => (
                  <tr key={row.no} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 text-center text-slate-600 font-medium">{row.no}</td>
                    <td className="py-3.5 px-4 text-center text-slate-900 font-medium">{row.id}</td>
                    <td className="py-3.5 px-6 font-medium text-slate-800 whitespace-nowrap">{row.name}</td>
                    <td className="py-3.5 px-4 text-center text-slate-700 font-medium">{row.type}</td>
                    <td className="py-3.5 px-4 text-center font-bold text-slate-800">{row.amount}</td>
                    <td className="py-3.5 px-4 text-center text-slate-500">{row.note}</td>
                  </tr>
                ))}
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
            <li>สามารถเพิ่ม/แก้ไขรายการหักได้ที่ปุ่ม &quot;เพิ่มรายการหัก&quot;</li>
            <li>รายการหักบางประเภทสามารถตั้งค่าเป็นเงินตัดอัตโนมัติได้ที่เมนู ตั้งค่าระบบ</li>
          </ul>
        </div>
      </div>
    </div>
  );
}