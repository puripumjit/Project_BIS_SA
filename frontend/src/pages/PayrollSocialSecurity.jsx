import React from 'react';

export default function PayrollSocialSecurity() {
  // ข้อมูลจำลองตารางประกันสังคม
  const socialSecurityList = [
    { no: 1, id: 'EMP001', name: 'สมชาย ใจดี', baseSalary: '30,000', empDeduct: '1,500', compDeduct: '1,500' },
    { no: 2, id: 'EMP002', name: 'สมหญิง จริงใจ', baseSalary: '25,000', empDeduct: '1,250', compDeduct: '1,250' },
    { no: 3, id: 'EMP003', name: 'ธนากร ศรีสุข', baseSalary: '15,000', empDeduct: '750', compDeduct: '750' },
    { no: 4, id: 'EMP004', name: 'ณัฐชา วงศ์ดี', baseSalary: '28,000', empDeduct: '1,400', compDeduct: '1,000' },
    { no: 5, id: 'EMP005', name: 'ปรางทิพย์ อินทร์นิล', baseSalary: '18,000', empDeduct: '900', compDeduct: '900' },
  ];

  return (
    <div className="w-full text-slate-800 space-y-6">
      {/* หัวข้อหน้า */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">ประกันสังคม</h1>
        <p className="text-xs text-slate-500 mt-1">รายละเอียดการคำนวณเงินสมทบประกันสังคม</p>
      </div>

      {/* การ์ดสรุป 4 กล่องด้านบน */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* ผู้ประกันตน */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl shrink-0">
            <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">ผู้ประกันตน</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-0.5">
              98 <span className="text-base font-bold">คน</span>
            </p>
          </div>
        </div>

        {/* เงินสมทบพนักงาน */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl shrink-0">
            <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
              <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/>
            </svg>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">เงินสมทบพนักงาน</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-0.5">
              140,760 <span className="text-base font-bold">บาท</span>
            </p>
          </div>
        </div>

        {/* เงินสมทบนายจ้าง */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-xl shrink-0">
            <svg className="w-6 h-6 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">เงินสมทบนายจ้าง</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-0.5">
              140,760 <span className="text-base font-bold">บาท</span>
            </p>
          </div>
        </div>

        {/* รวมเงินสมทบ */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center text-xl shrink-0">
            <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm6 12H6v-1c0-2 4-3.1 6-3.1s6 1.1 6 3.1v1z"/>
            </svg>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">รวมเงินสมทบ</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-0.5">
              281,520 <span className="text-base font-bold">บาท</span>
            </p>
          </div>
        </div>
      </div>

      {/* ตารางรายละเอียดประกันสังคม */}
      <div>
        <h2 className="text-base font-bold text-slate-900 mb-3">
          รายละเอียดประกันสังคม
        </h2>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#E5E7EB] text-slate-800 font-bold border-b border-slate-300">
                  <th className="py-3.5 px-4 text-center">ลำดับ</th>
                  <th className="py-3.5 px-4 text-center">รหัสพนักงาน</th>
                  <th className="py-3.5 px-6">ชื่อ-สกุล</th>
                  <th className="py-3.5 px-4 text-center">ฐานคำนวณ</th>
                  <th className="py-3.5 px-4 text-center">พนักงาน (5%)</th>
                  <th className="py-3.5 px-4 text-center">นายจ้าง (5%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {socialSecurityList.map((row) => (
                  <tr key={row.no} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 text-center text-slate-600 font-medium">{row.no}</td>
                    <td className="py-3.5 px-4 text-center text-slate-900 font-medium">{row.id}</td>
                    <td className="py-3.5 px-6 font-medium text-slate-800 whitespace-nowrap">{row.name}</td>
                    <td className="py-3.5 px-4 text-center font-medium text-slate-700">{row.baseSalary}</td>
                    <td className="py-3.5 px-4 text-center font-semibold text-slate-800">{row.empDeduct}</td>
                    <td className="py-3.5 px-4 text-center font-semibold text-slate-800">{row.compDeduct}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* กล่องหมายเหตุสีฟ้า */}
      <div className="bg-blue-50/70 border border-blue-200/80 rounded-2xl p-4 flex items-start gap-3 text-xs text-blue-900">
        <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5">
          i
        </div>
        <div className="space-y-1">
          <p className="font-bold">หมายเหตุ</p>
          <ul className="list-disc list-inside space-y-0.5 text-blue-800">
            <li>เงินสมทบคำนวณจากฐานค่าจ้างตามกฎหมาย (สูงสุด 15,000 บาท)</li>
            <li>สามารถตั้งค่าอัตราและฐานคำนวณได้ที่เมนู ตั้งค่าระบบ</li>
          </ul>
        </div>
      </div>
    </div>
  );
}