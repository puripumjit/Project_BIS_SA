import React from 'react';

export default function Homepage() {
  // ข้อมูลจำลองสำหรับ Timeline
  const timelineSteps = [
    { title: 'คำนวณเวลา', status: 'completed' },
    { title: 'ตรวจสอบ\nขาดลาสาย', status: 'completed' },
    { title: 'คำนวณภาษี', subtitle: '(สถานะปัจจุบัน)', status: 'current' },
    { title: 'รออนุมัติ', status: 'upcoming' },
    { title: 'โอนเงิน', status: 'upcoming' },
  ];

  // ข้อมูลจำลองพนักงานที่ลา / สาย / ขาดงาน
  const attendanceIssues = [
    { id: 1, name: 'นางสาววิภาวี อินทร์กุล', dept: 'IT', type: 'พนักงานประจำ', status: 'ลา', date: '24 ต.ค. 2569' },
    { id: 2, name: 'นายธนภัทร ศรีสุข', dept: 'Marketing', type: 'ประจำ', status: 'สาย', date: '24 ต.ค. 2569' },
    { id: 3, name: 'นางสาวกนกวรรณ วงศ์สวัสดิ์', dept: 'Finance', type: 'Freelance', status: 'ขาดงาน', date: '24 ต.ค. 2569' },
    { id: 4, name: 'นายภูริภัทร แสงดี', dept: 'Sales', type: 'พนักงานประจำ', status: 'ลา', date: '23 ต.ค. 2569' },
  ];

  // ข้อมูลการแจ้งเตือนล่าสุด
  const notifications = [
    { title: 'พนักงานลาป่วยวันนี้', count: '3 รายการ', time: '09:32', iconBg: 'bg-red-500' },
    { title: 'พนักงานมาสาย', count: '5 รายการ', time: '08:45', iconBg: 'bg-amber-500' },
    { title: 'รออนุมัติการลา', count: '2 รายการ', time: '08:20', iconBg: 'bg-blue-600' },
    { title: 'คำนวณเงินเดือนเสร็จสิ้น', desc: 'รอบเดือน ตุลาคม 2569', time: '07:50', iconBg: 'bg-emerald-500' },
  ];

  return (
    <div className="w-full space-y-6 text-slate-800">
      {/* 1. แถบต้อนรับสีฟ้าด้านบน (ไม่เอารูปคนและข้อความขวา) */}
      <div className="bg-gradient-to-r from-[#EBF3FF] via-[#F0F5FD] to-[#F8FAFF] border border-blue-100 rounded-3xl p-6 md:p-8 shadow-sm">
        <h1 className="text-2xl md:text-3xl font-extrabold text-[#1E3A8A]">
          HELLO HR Admin
        </h1>
        <p className="text-slate-700 font-semibold mt-1">
          ยินดีต้อนรับสู่ระบบคำนวณเงินเดือน (Payroll System)
        </p>
        <p className="text-xs text-slate-500 mt-0.5">
          จัดการข้อมูลพนักงาน การเข้างาน การลา และคำนวณเงินเดือนอย่างครบวงจร
        </p>
      </div>

      {/* 2. การ์ดสถิติ 5 ใบ */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* พนักงานทั้งหมด */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
              👥
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">พนักงานทั้งหมด</p>
              <p className="text-xl font-black text-slate-900">128 <span className="text-xs font-normal">คน</span></p>
            </div>
          </div>
          <span className="text-[10px] text-emerald-600 font-medium mt-2">▲ 5 คน จากเดือนที่แล้ว</span>
        </div>

        {/* พนักงานประจำ */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold text-lg shadow-sm">
              👨‍💼
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">พนักงานประจำ</p>
              <p className="text-xl font-black text-slate-900">98 <span className="text-xs font-normal">คน</span></p>
            </div>
          </div>
          <span className="text-[10px] text-emerald-600 font-medium mt-2">▲ 3 คน จากเดือนที่แล้ว</span>
        </div>

        {/* Freelance */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500 text-white flex items-center justify-center font-bold text-lg shadow-sm">
              💻
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Freelance</p>
              <p className="text-xl font-black text-slate-900">30 <span className="text-xs font-normal">คน</span></p>
            </div>
          </div>
          <span className="text-[10px] text-emerald-600 font-medium mt-2">▲ 2 คน จากเดือนที่แล้ว</span>
        </div>

        {/* เงินเดือนรวม (Gross) */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500 text-white flex items-center justify-center font-bold text-lg shadow-sm">
              💰
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">เงินเดือนรวม (Gross)</p>
              <p className="text-lg font-black text-slate-900">2,856,430 <span className="text-[10px] font-normal">บาท</span></p>
            </div>
          </div>
          <span className="text-[10px] text-emerald-600 font-medium mt-2">▲ 6.2% จากเดือนที่แล้ว</span>
        </div>

        {/* เงินเดือนสุทธิ (Net) */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500 text-white flex items-center justify-center font-bold text-lg shadow-sm">
              💵
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">เงินเดือนสุทธิ (Net)</p>
              <p className="text-lg font-black text-slate-900">2,163,220 <span className="text-[10px] font-normal">บาท</span></p>
            </div>
          </div>
          <span className="text-[10px] text-emerald-600 font-medium mt-2">▲ 6.8% จากเดือนที่แล้ว</span>
        </div>
      </div>

      {/* 3. เนื้อหาหลัก 2 คอลัมน์ (ซ้าย: Timeline + Table / ขวา: แจ้งเตือน + จ่ายเงินเดือน + Actions) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* คอลัมน์ซ้าย (2 ส่วน) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* แทนที่กราฟเดิมด้วย Timeline ตามรูป */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">
              สถานะและขั้นตอนรอบเงินเดือน
            </h2>
            <p className="text-sm text-slate-600 font-medium mt-0.5 mb-10">
              (Payroll Status Timeline)
            </p>

            {/* Stepper Timeline bar */}
            <div className="relative flex items-start justify-between max-w-xl mx-auto px-4 pb-2">
              {/* เส้นเชื่อมพื้นหลัง */}
              <div className="absolute top-[13px] left-8 right-8 h-1 bg-slate-200 -z-0">
                {/* แถบสีของเส้นที่เสร็จแล้ว */}
                <div className="h-full bg-[#1E3A8A] w-1/2"></div>
              </div>

              {timelineSteps.map((step, idx) => (
                <div key={idx} className="flex flex-col items-center relative z-10 text-center">
                  {/* จุดวงกลมสถานะ */}
                  {step.status === 'completed' && (
                    <div className="w-7 h-7 rounded-full bg-[#1E3A8A] border-2 border-[#1E3A8A] flex items-center justify-center shadow-sm" />
                  )}
                  {step.status === 'current' && (
                    <div className="w-7 h-7 rounded-full bg-white border-4 border-[#1E3A8A] flex items-center justify-center shadow-md ring-2 ring-blue-100">
                      <div className="w-2.5 h-2.5 bg-[#1E3A8A] rounded-full" />
                    </div>
                  )}
                  {step.status === 'upcoming' && (
                    <div className="w-7 h-7 rounded-full bg-slate-200 border-2 border-white shadow-sm" />
                  )}

                  {/* ข้อความกำกับแต่ละ Step */}
                  <div className="mt-3">
                    <p className={`text-xs font-bold whitespace-pre-line leading-tight ${
                      step.status === 'upcoming' ? 'text-slate-400' : 'text-slate-900'
                    }`}>
                      {step.title}
                    </p>
                    {step.subtitle && (
                      <span className="text-[10px] text-slate-400 font-normal block mt-0.5">
                        {step.subtitle}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ตารางพนักงานที่มีการลา / สาย / ขาดงาน */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base text-slate-800">
                พนักงานที่มีการลา / สาย / ขาดงาน (วันนี้)
              </h3>
              <button className="text-xs text-blue-600 hover:underline font-semibold">ดูทั้งหมด</button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-blue-50/50 text-slate-600 border-b border-slate-100">
                    <th className="py-2.5 px-3 font-semibold text-center">ลำดับ</th>
                    <th className="py-2.5 px-3 font-semibold">รหัส/ชื่อพนักงาน</th>
                    <th className="py-2.5 px-3 font-semibold text-center">แผนก</th>
                    <th className="py-2.5 px-3 font-semibold text-center">ประเภท</th>
                    <th className="py-2.5 px-3 font-semibold text-center">สถานะ</th>
                    <th className="py-2.5 px-3 font-semibold text-center">วันที่</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {attendanceIssues.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50/60">
                      <td className="py-2.5 px-3 text-center text-slate-400">{row.id}</td>
                      <td className="py-2.5 px-3 font-medium text-slate-800">{row.name}</td>
                      <td className="py-2.5 px-3 text-center text-slate-600">{row.dept}</td>
                      <td className="py-2.5 px-3 text-center text-slate-500">{row.type}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          row.status === 'ลา' ? 'bg-sky-100 text-sky-700' :
                          row.status === 'สาย' ? 'bg-amber-100 text-amber-700' :
                          'bg-red-100 text-red-600'
                        }`}>
                          {row.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center text-slate-500">{row.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* คอลัมน์ขวา (1 ส่วน) */}
        <div className="space-y-6">
          
          {/* การแจ้งเตือนล่าสุด */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base text-slate-800">การแจ้งเตือนล่าสุด</h3>
              <button className="text-xs text-blue-600 hover:underline font-semibold">ดูทั้งหมด</button>
            </div>
            <div className="space-y-3.5">
              {notifications.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-xl transition-colors">
                  <div className="flex items-center gap-3">
                    <span className={`w-7 h-7 rounded-full ${item.iconBg} flex items-center justify-center text-white text-xs font-bold`}>
                      ✓
                    </span>
                    <div>
                      <p className="text-xs font-bold text-slate-800">{item.title}</p>
                      <p className="text-[11px] text-slate-500">{item.count || item.desc}</p>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400">เวลา {item.time}</span>
                </div>
              ))}
            </div>
          </div>

          {/* กำหนดจ่ายเงินเดือน */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl">
                  📅
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-semibold">กำหนดจ่ายเงินเดือน</p>
                  <p className="text-base font-extrabold text-slate-900">30 ตุลาคม 2569</p>
                </div>
              </div>
              <button className="text-xs text-blue-600 bg-blue-50 px-3 py-1.5 rounded-xl font-bold hover:bg-blue-100 transition-colors">
                ดูรายละเอียด
              </button>
            </div>
          </div>

          {/* Quick Actions Button */}
          <div className="grid grid-cols-3 gap-2">
            <button className="p-3 bg-white border border-slate-200 rounded-2xl text-center hover:bg-slate-50 shadow-sm flex flex-col items-center gap-1 active:scale-95 transition-all">
              <span className="text-blue-600 text-lg">🧮</span>
              <span className="text-[11px] font-bold text-slate-700">คำนวณเงินเดือน</span>
            </button>
            <button className="p-3 bg-white border border-slate-200 rounded-2xl text-center hover:bg-slate-50 shadow-sm flex flex-col items-center gap-1 active:scale-95 transition-all">
              <span className="text-emerald-600 text-lg">👤+</span>
              <span className="text-[11px] font-bold text-slate-700">เพิ่มพนักงาน</span>
            </button>
            <button className="p-3 bg-white border border-slate-200 rounded-2xl text-center hover:bg-slate-50 shadow-sm flex flex-col items-center gap-1 active:scale-95 transition-all">
              <span className="text-purple-600 text-lg">📝</span>
              <span className="text-[11px] font-bold text-slate-700">บันทึกการลา</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}