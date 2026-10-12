import React from 'react';

export default function PayrollCalculate() {
  // ข้อมูลจำลองตามตารางในรูปภาพ
  const payrollData = [
    {
      no: 1,
      id: 'EMP001',
      name: 'นายสมชาย ใจดี',
      department: 'ฝ่ายบัญชี',
      role: 'นักบัญชี',
      type: 'ประจำ',
      salary: '25,000',
      ot: '1,562.50',
      otherIncome: '0',
      leaveLate: '2',
      tax: '162.50',
      socialSecurity: '750',
      otherDeduct: '0',
    },
    {
      no: 2,
      id: 'EMP002',
      name: 'นางสาวสุภาวดี แสงทอง',
      department: 'ฝ่ายการเงิน',
      role: 'เจ้าหน้าที่การเงิน',
      type: 'ประจำ',
      salary: '22,000',
      ot: '1,100.00',
      otherIncome: '1,500',
      leaveLate: '1',
      tax: '0',
      socialSecurity: '750',
      otherDeduct: '0',
    },
    {
      no: 3,
      id: 'EMP003',
      name: 'นางสมร สมดี',
      department: 'ฝ่ายบุคคล',
      role: 'เจ้าหน้าที่ HR',
      type: 'ประจำ',
      salary: '20,000',
      ot: '1,500.00',
      otherIncome: '0',
      leaveLate: '2',
      tax: '0',
      socialSecurity: '750',
      otherDeduct: '0',
    },
    {
      no: 4,
      id: 'EMP004',
      name: 'นายธนกร พร้อมเพียง',
      department: 'ฝ่ายการตลาด',
      role: 'หน้าที่การตลาด',
      type: 'ประจำ',
      salary: '18,000',
      ot: '1,687.50',
      otherIncome: '0',
      leaveLate: '2',
      tax: '0',
      socialSecurity: '750',
      otherDeduct: '0',
    },
    {
      no: 5,
      id: 'EMP005',
      name: 'นางสาวกนกวรรณ ศรีสุข',
      department: 'ฝ่ายการขาย',
      role: 'เจ้าหน้าที่การขาย',
      type: 'ประจำ',
      salary: '17,000',
      ot: '1,062.50',
      otherIncome: '3,000',
      leaveLate: '2',
      tax: '0',
      socialSecurity: '750',
      otherDeduct: '0',
    },
    {
      no: 6,
      id: 'EMP006',
      name: 'นายวรชัย รัตนกุล',
      department: 'ฝ่ายซ่อมบำรุง',
      role: 'ช่างเทคนิค',
      type: 'ประจำ',
      salary: '19,000',
      ot: '2,375.00',
      otherIncome: '0',
      leaveLate: '2',
      tax: '0',
      socialSecurity: '750',
      otherDeduct: '0',
    },
    {
      no: 7,
      id: 'EMP007',
      name: 'นางสมใจ ยินดี',
      department: 'ฝ่ายบริการลูกค้า',
      role: 'พนักงานต้อนรับ',
      type: 'ประจำ',
      salary: '15,000',
      ot: '468.75',
      otherIncome: '0',
      leaveLate: '2',
      tax: '0',
      socialSecurity: '750',
      otherDeduct: '0',
    },
  ];

  return (
    <div className="w-full text-slate-800 space-y-6">
      {/* หัวข้อหน้า */}
      <h1 className="text-2xl font-bold text-slate-900">
        การคำนวณเงินเดือน
      </h1>

      {/* แถบตัวกรองด้านบน */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* รอบเงินเดือน */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">รอบเงินเดือน</label>
            <div className="relative">
              <select className="w-full bg-white border border-slate-200 text-slate-700 py-2 px-3 pr-8 rounded-xl appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs font-medium cursor-pointer shadow-sm">
                <option>กันยายน 2569</option>
                <option>สิงหาคม 2569</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-blue-600">
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
              <select className="w-full bg-white border border-slate-200 text-slate-700 py-2 px-3 pr-8 rounded-xl appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs font-medium cursor-pointer shadow-sm">
                <option>ทั้งหมด</option>
                <option>ฝ่ายบัญชี</option>
                <option>ฝ่ายการเงิน</option>
                <option>ฝ่ายบุคคล</option>
                <option>ฝ่ายการตลาด</option>
                <option>ฝ่ายการขาย</option>
                <option>ฝ่ายซ่อมบำรุง</option>
                <option>ฝ่ายบริการลูกค้า</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-blue-600">
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
              <select className="w-full bg-white border border-slate-200 text-slate-700 py-2 px-3 pr-8 rounded-xl appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs font-medium cursor-pointer shadow-sm">
                <option>ทั้งหมด</option>
                <option>พนักงานประจำ</option>
                <option>พนักงานฟรีแลนซ์</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-blue-600">
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                </svg>
              </div>
            </div>
          </div>

          {/* ช่องค้นหาพนักงาน */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">&nbsp;</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="ค้นหาชื่อพนักงาน,รหัสพนักงาน.."
                className="w-full bg-white border border-slate-200 text-slate-700 py-2 pl-8 pr-7 rounded-xl text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
              />
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* แถบการ์ดสรุป 3 กล่อง */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* พนักงานทั้งหมด */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-900 flex items-center justify-center shrink-0">
            <svg className="w-9 h-9 fill-current" viewBox="0 0 24 24">
              <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
            </svg>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-700">พนักงานทั้งหมด</p>
            <p className="text-3xl font-extrabold text-blue-900 mt-1">
              35 <span className="text-2xl font-bold">คน</span>
            </p>
          </div>
        </div>

        {/* เงินเดือนสุทธิ */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-900 flex items-center justify-center shrink-0">
            <svg className="w-9 h-9 fill-current" viewBox="0 0 24 24">
              <path d="M21 18v1c0 1.1-.9 2-2 2H5c-1.11 0-2-.9-2-2V5c0-1.1.89-2 2-2h14c1.1 0 2 .9 2 2v1h-9c-1.11 0-2 .9-2 2v8c0 1.1.89 2 2 2h9zm-9-2h10V8H12v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
            </svg>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-700">เงินเดือนสุทธิ</p>
            <p className="text-3xl font-extrabold text-blue-900 mt-1">ไม่บอก</p>
          </div>
        </div>

        {/* รายการหักรวม */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-900 flex items-center justify-center shrink-0">
            <svg className="w-9 h-9 fill-current" viewBox="0 0 24 24">
              <path d="M11 2v20c-5.07-.5-9-4.79-9-10s3.93-9.5 9-10zm2.03 0v8.99H22c-.47-4.74-4.24-8.52-8.97-8.99zm0 11.01V22c4.74-.47 8.5-4.25 8.97-8.99h-8.97z"/>
            </svg>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-700">รายการหักรวม</p>
            <p className="text-3xl font-extrabold text-blue-900 mt-1">ไม่บอก</p>
          </div>
        </div>
      </div>

      {/* ตารางรายการคำนวณเงินเดือน */}
      <div>
        <h2 className="text-lg font-bold text-blue-950 mb-3">
          รายการคำนวณเงินเดือน
        </h2>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#E5E7EB] text-slate-800 font-bold border-b border-slate-300">
                  <th className="py-3 px-3 text-center">ลำดับ</th>
                  <th className="py-3 px-3 text-center">รหัสพนักงาน</th>
                  <th className="py-3 px-3">ชื่อ-นามสกุล</th>
                  <th className="py-3 px-3 text-center">แผนก</th>
                  <th className="py-3 px-3 text-center">ตำแหน่ง</th>
                  <th className="py-3 px-3 text-center">ประเภท</th>
                  <th className="py-3 px-3 text-center">เงินเดือน</th>
                  <th className="py-3 px-3 text-center">OT</th>
                  <th className="py-3 px-3 text-center">รายได้อื่นๆ</th>
                  <th className="py-3 px-3 text-center">ลา/สาย</th>
                  <th className="py-3 px-3 text-center">ภาษี</th>
                  <th className="py-3 px-3 text-center">ประกันสังคม</th>
                  <th className="py-3 px-3 text-center">หักอื่นๆ</th>
                  <th className="py-3 px-3 text-center">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payrollData.map((row) => (
                  <tr key={row.no} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-3 text-center text-slate-600 font-medium">{row.no}</td>
                    <td className="py-3 px-3 text-center text-slate-900 font-medium">{row.id}</td>
                    <td className="py-3 px-3 font-medium text-slate-800 whitespace-nowrap">{row.name}</td>
                    <td className="py-3 px-3 text-center text-slate-600">{row.department}</td>
                    <td className="py-3 px-3 text-center text-slate-600 whitespace-nowrap">{row.role}</td>
                    <td className="py-3 px-3 text-center text-slate-600">{row.type}</td>
                    <td className="py-3 px-3 text-center text-slate-800 font-medium">{row.salary}</td>
                    <td className="py-3 px-3 text-center text-slate-800 font-medium">{row.ot}</td>
                    <td className="py-3 px-3 text-center text-slate-800 font-medium">{row.otherIncome}</td>
                    <td className="py-3 px-3 text-center text-slate-800 font-medium">{row.leaveLate}</td>
                    <td className="py-3 px-3 text-center text-slate-800 font-medium">{row.tax}</td>
                    <td className="py-3 px-3 text-center text-slate-800 font-medium">{row.socialSecurity}</td>
                    <td className="py-3 px-3 text-center text-slate-800 font-medium">{row.otherDeduct}</td>
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <button className="text-blue-700 hover:text-blue-900 font-semibold hover:underline cursor-pointer">
                        ดูรายละเอียด
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* การแบ่งหน้า Pagination */}
        <div className="flex justify-end mt-4 text-xs select-none">
          <div className="flex items-center gap-1">
            <button className="px-2.5 py-1 rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 font-bold">&lt;</button>
            <button className="px-3 py-1 rounded bg-[#2563EB] text-white font-bold">1</button>
            <button className="px-3 py-1 rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold">2</button>
            <button className="px-3 py-1 rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold">3</button>
            <button className="px-3 py-1 rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold">4</button>
            <button className="px-3 py-1 rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold">5</button>
            <button className="px-2.5 py-1 rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 font-bold">&gt;</button>
          </div>
        </div>
      </div>
    </div>
  );
}