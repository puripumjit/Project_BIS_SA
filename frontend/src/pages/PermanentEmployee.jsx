import React from 'react';

export default function PermanentEmployee() {
  // ข้อมูลจำลองตามตารางในรูปภาพ
  const employees = [
    { id: 'EMP001', name: 'นายสมชาย ใจดี', role: 'นักบัญชี', department: 'ฝ่ายบัญชี', salary: '25,000', otRate: '150' },
    { id: 'EMP002', name: 'นางสาวสุภาวดี แสงทอง', role: 'เจ้าหน้าที่การเงิน', department: 'ฝ่ายการเงิน', salary: '22,000', otRate: '120' },
    { id: 'EMP003', name: 'นางสมร สมดี', role: 'พนักงานหญิง', department: 'ฝ่ายบุคคล', salary: '20,000', otRate: '100' },
    { id: 'EMP004', name: 'นายธนกร พร้อมเพียง', role: 'พนักงานชาย', department: 'ฝ่ายการตลาด', salary: '18,000', otRate: '80' },
    { id: 'EMP005', name: 'นางสาวกนกวรรณ ศรีสุข', role: 'พนักงานหญิง', department: 'ฝ่ายการขาย', salary: '17,000', otRate: '70' },
    { id: 'EMP006', name: 'นายวรชัย รัตนกุล', role: 'ช่างเทคนิค', department: 'ฝ่ายซ่อมบำรุง', salary: '19,000', otRate: '90' },
    { id: 'EMP007', name: 'นางสมใจ ยินดี', role: 'พนักงานต้อนรับ', department: 'ฝ่ายบริการลูกค้า', salary: '15,000', otRate: '50' },
    { id: 'EMP008', name: 'นางสาวสมศรี ใจร้าย', role: 'ช่างเทคนิค', department: 'ฝ่ายซ่อมบำรุง', salary: '19,000', otRate: '90' },
    { id: 'EMP009', name: 'นายสมยศ ใจดำ', role: 'ขนส่ง', department: 'ฝ่ายจัดส่งสินค้า', salary: '15,000', otRate: '50' },
    { id: 'EMP010', name: 'นางสาวสุภาวดี แช่มจิตร', role: 'ขนส่ง', department: 'ฝ่ายจัดส่งสินค้า', salary: '15,000', otRate: '50' },
  ];

  return (
    <div className="w-full text-slate-800">
      {/* ส่วนหัว: ไอคอน + ชื่อหน้า และ ปุ่มเพิ่มพนักงาน */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          {/* ไอคอนกลุ่มคนสีน้ำเงิน */}
          <div className="text-[#1E3A8A]">
            <svg className="w-8 h-8 fill-current" viewBox="0 0 24 24">
              <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            พนักงานประจำ
          </h1>
        </div>

        {/* ปุ่ม + เพิ่มพนักงาน */}
        <button className="flex items-center gap-1.5 bg-[#3B82F6] hover:bg-blue-600 text-white px-5 py-2 rounded-xl text-sm font-semibold shadow-sm transition-all active:scale-95">
          <span>+</span>
          <span>เพิ่มพนักงาน</span>
        </button>
      </div>

      {/* ตารางข้อมูลพนักงาน */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#E5E7EB] text-slate-800 font-bold border-b border-slate-300">
                <th className="py-3.5 px-4 text-center">รหัสพนักงาน</th>
                <th className="py-3.5 px-4">ชื่อ-นามสกุล</th>
                <th className="py-3.5 px-4 text-center">ตำแหน่ง</th>
                <th className="py-3.5 px-4 text-center">แผนก</th>
                <th className="py-3.5 px-4 text-center">เงินเดือน(บาท)</th>
                <th className="py-3.5 px-4 text-center">ค่าล่วงเวลา(บาท)</th>
                <th className="py-3.5 px-4 text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {employees.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4 text-center font-medium text-slate-900">{item.id}</td>
                  <td className="py-3.5 px-4 font-medium text-slate-800 whitespace-nowrap">{item.name}</td>
                  <td className="py-3.5 px-4 text-center text-slate-600">{item.role}</td>
                  <td className="py-3.5 px-4 text-center text-slate-600">{item.department}</td>
                  <td className="py-3.5 px-4 text-center font-medium text-slate-700">{item.salary}</td>
                  <td className="py-3.5 px-4 text-center font-medium text-slate-700">{item.otRate}</td>
                  
                  {/* ปุ่มจัดการ (แก้ไข & ลบ) */}
                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                    <div className="inline-flex items-center gap-2">
                      {/* ปุ่มแก้ไข */}
                      <button className="inline-flex items-center gap-1 bg-[#3B82F6] hover:bg-blue-600 text-white px-2.5 py-1 rounded-md text-[11px] font-medium shadow-sm transition-all active:scale-95">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                        แก้ไข
                      </button>

                      {/* ปุ่มลบ */}
                      <button className="inline-flex items-center gap-1 bg-[#DC2626] hover:bg-red-700 text-white px-2.5 py-1 rounded-md text-[11px] font-medium shadow-sm transition-all active:scale-95">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        ลบ
                      </button>
                    </div>
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