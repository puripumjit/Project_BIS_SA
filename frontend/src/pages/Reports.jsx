import React from 'react';

export default function Reports() {
  // ข้อมูลตารางพนักงานมาสายวันนี้
  const lateEmployees = [
    {
      id: 'EMP002',
      name: 'นางสาวสุภาวดี แสงทอง',
      department: 'ฝ่ายการเงิน',
      arrivalTime: '09:15 น.',
      status: 'มาสาย',
    },
    {
      id: 'EMP006',
      name: 'นายวรชัย รัตนกุล',
      department: 'ฝ่ายซ่อมบำรุง',
      arrivalTime: '08:55 น.',
      status: 'ปกติ',
    },
    {
      id: 'EMP010',
      name: 'นางสาวสุภาวดี แช่มจิตร',
      department: 'ฝ่ายจัดส่งสินค้า',
      arrivalTime: '09:20 น.',
      status: 'มาสาย',
    },
  ];

  // ข้อมูลรายงานล่าสุด
  const recentReports = [
    { title: 'รายงานสรุปเงินเดือนรวม - ก.ย. 69' },
    { title: 'รายงานภาษี - ก.ย. 69' },
    { title: 'รายงานประกันสังคม - ก.ย. 69' },
    { title: 'ประวัติการลาพนักงาน' },
  ];

  // สี Badge สถานะแบบเดียวกับหน้าบันทึกการเข้าทำงาน
  const getStatusBadge = (status) => {
    switch (status) {
      case 'ปกติ':
        return 'bg-[#22C55E] text-white';
      case 'มาสาย':
      case 'สาย':
        return 'bg-[#F59E0B] text-white';
      case 'ลา':
      case 'ลากิจ':
        return 'bg-[#06B6D4] text-white';
      case 'ขาด/ไม่ลงเวลา':
        return 'bg-[#EF4444] text-white';
      default:
        return 'bg-slate-400 text-white';
    }
  };

  return (
    <div className="w-full text-slate-800 space-y-6">
      {/* หัวข้อหน้า */}
      <h1 className="text-2xl font-bold text-slate-900">
        แดชบอร์ดภาพรวม
      </h1>

      {/* แถบการ์ดสรุป 4 กล่องด้านบน */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* เงินเดือนรวมสุทธิ */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <svg className="w-6 h-6 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">เงินเดือนรวมสุทธิ</p>
            <p className="text-base font-bold text-slate-900 mt-0.5">----- บาท</p>
          </div>
        </div>

        {/* รายการหักรวม */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
            <svg className="w-6 h-6 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">รายการหักรวม</p>
            <p className="text-base font-bold text-slate-900 mt-0.5">----- บาท</p>
          </div>
        </div>

        {/* ภาษีหัก ณ ที่จ่าย */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <svg className="w-6 h-6 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">ภาษีหัก ณ ที่จ่าย</p>
            <p className="text-base font-bold text-slate-900 mt-0.5">----- บาท</p>
          </div>
        </div>

        {/* ประกันสังคม */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <svg className="w-6 h-6 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">ประกันสังคม</p>
            <p className="text-base font-bold text-slate-900 mt-0.5">----- บาท</p>
          </div>
        </div>
      </div>

      {/* แถวกลาง: สถานะพนักงาน (Donut Chart) + รายงานล่าสุด */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* กล่องซ้าย: สถานะพนักงาน */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <h2 className="text-base font-bold text-slate-900 mb-4">
            สถานะพนักงาน
          </h2>

          <div className="flex flex-col sm:flex-row items-center justify-around gap-6 py-2">
            {/* กราฟโดนัท SVG */}
            <div className="relative w-44 h-44 flex items-center justify-center shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                {/* พนักงานประจำ (ชมพู) */}
                <circle
                  cx="18"
                  cy="18"
                  r="14"
                  fill="none"
                  stroke="#FF5A79"
                  strokeWidth="5"
                  strokeDasharray="70 100"
                  strokeDashoffset="0"
                />
                {/* พนักงานฟรีแลนซ์ (ฟ้า) */}
                <circle
                  cx="18"
                  cy="18"
                  r="14"
                  fill="none"
                  stroke="#38BDF8"
                  strokeWidth="5"
                  strokeDasharray="18 100"
                  strokeDashoffset="-70"
                />
                {/* มาสาย (ส้ม #F59E0B ตรงกับ badge มาสาย) */}
                <circle
                  cx="18"
                  cy="18"
                  r="14"
                  fill="none"
                  stroke="#F59E0B"
                  strokeWidth="5"
                  strokeDasharray="8 100"
                  strokeDashoffset="-88"
                />
                {/* ลา (ฟ้าเขียว #06B6D4 ตรงกับ badge ลา) */}
                <circle
                  cx="18"
                  cy="18"
                  r="14"
                  fill="none"
                  stroke="#06B6D4"
                  strokeWidth="5"
                  strokeDasharray="4 100"
                  strokeDashoffset="-96"
                />
              </svg>
            </div>

            {/* รายการ Legend */}
            <div className="space-y-3.5 w-full sm:w-auto text-xs">
              <div className="flex items-center justify-between sm:justify-start gap-8">
                <div className="flex items-center gap-2.5">
                  <span className="w-3.5 h-3.5 rounded-full bg-[#FF5A79]"></span>
                  <span className="font-semibold text-slate-700">พนักงานประจำ</span>
                </div>
                <span className="font-bold text-slate-900 text-sm">28</span>
              </div>

              <div className="flex items-center justify-between sm:justify-start gap-8">
                <div className="flex items-center gap-2.5">
                  <span className="w-3.5 h-3.5 rounded-full bg-[#38BDF8]"></span>
                  <span className="font-semibold text-slate-700">พนักงานฟรีแลนซ์</span>
                </div>
                <span className="font-bold text-slate-900 text-sm">7</span>
              </div>

              <div className="flex items-center justify-between sm:justify-start gap-8">
                <div className="flex items-center gap-2.5">
                  <span className="w-3.5 h-3.5 rounded-full bg-[#F59E0B]"></span>
                  <span className="font-semibold text-slate-700">มาสาย</span>
                </div>
                <span className="font-bold text-slate-900 text-sm">2</span>
              </div>

              <div className="flex items-center justify-between sm:justify-start gap-8">
                <div className="flex items-center gap-2.5">
                  <span className="w-3.5 h-3.5 rounded-full bg-[#06B6D4]"></span>
                  <span className="font-semibold text-slate-700">ลา</span>
                </div>
                <span className="font-bold text-slate-900 text-sm">1</span>
              </div>
            </div>
          </div>

          <div className="text-right text-xs font-semibold text-slate-600 mt-4 border-t border-slate-100 pt-3">
            พนักงานทั้งหมด <span className="font-bold text-slate-900 text-sm">35</span> คน
          </div>
        </div>

        {/* กล่องขวา: รายงานล่าสุด */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <h2 className="text-base font-bold text-slate-900 mb-4">
            รายงานล่าสุด
          </h2>

          <div className="space-y-4">
            {recentReports.map((report, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3.5 p-2 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer group"
              >
                <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-600 flex items-center justify-center shrink-0 transition-colors">
                  <svg className="w-5 h-5 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <span className="text-xs font-medium text-slate-700 group-hover:text-blue-600 transition-colors">
                  {report.title}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-2 text-right">
            <button className="text-xs text-blue-600 hover:underline font-semibold cursor-pointer">
              ดูรายงานทั้งหมด &rarr;
            </button>
          </div>
        </div>
      </div>

      {/* ตารางพนักงานมาสายวันนี้ (สไตล์เดียวกับหน้าบันทึกเข้างาน) */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-5 pb-3">
          <h2 className="text-base font-bold text-slate-900">
            พนักงานมาสายวันนี้
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#E5E7EB] text-slate-800 font-bold border-b border-slate-300">
                <th className="py-3.5 px-4 text-center">รหัสพนักงาน</th>
                <th className="py-3.5 px-4">ชื่อ - นามสกุล</th>
                <th className="py-3.5 px-4 text-center">แผนก</th>
                <th className="py-3.5 px-4 text-center">เวลามาถึง</th>
                <th className="py-3.5 px-4 text-center">สถานะ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {lateEmployees.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4 text-center font-medium text-slate-900">{row.id}</td>
                  <td className="py-3.5 px-4 font-medium text-slate-800 whitespace-nowrap">{row.name}</td>
                  <td className="py-3.5 px-4 text-center text-slate-600">{row.department}</td>
                  <td className="py-3.5 px-4 text-center font-medium text-slate-700">{row.arrivalTime}</td>
                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                    <span className={`inline-block px-3 py-0.5 rounded-md text-[11px] font-semibold ${getStatusBadge(row.status)}`}>
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}