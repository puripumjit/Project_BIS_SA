import React, { useState } from 'react';

export default function Leaves() {
  // Mock data รายการขอลาตามรูปภาพ
  const leaveData = [
    {
      id: 'EMP001',
      name: 'นายสมชาย ใจดี',
      department: 'ฝ่ายบัญชี',
      leaveType: 'ลาป่วย',
      dateRange: '07/09/2569',
      duration: '1 วัน',
      reason: 'ท้องเสีย',
      status: 'รออนุมัติ',
      actionType: 'approve', // แสดงปุ่ม "ดูรายละเอียด / อนุมัติ"
    },
    {
      id: 'EMP002',
      name: 'นางสาวสุภาวดี แสงทอง',
      department: 'ฝ่ายการเงิน',
      leaveType: 'ลากิจ',
      dateRange: '07/09/2569',
      duration: 'ครึ่งวัน',
      reason: 'ทำธุระส่วนตัว',
      status: 'อนุมัติแล้ว',
      actionType: 'manage', // แสดงปุ่ม "จัดการ"
    },
    {
      id: 'EMP003',
      name: 'นางสมร สมดี',
      department: 'ฝ่ายบุคคล',
      leaveType: 'ลาพักร้อน',
      dateRange: '07/09/2569 - 08/08/2569',
      duration: '2 วัน',
      reason: 'ธุระทางบ้าน',
      status: 'ไม่อนุมัติ',
      actionType: 'manage',
    },
  ];

  // กำหนดสีของ Badge สถานะ
  const getStatusBadge = (status) => {
    switch (status) {
      case 'รออนุมัติ':
        return 'bg-[#F59E0B] text-white';
      case 'อนุมัติแล้ว':
        return 'bg-[#22C55E] text-white';
      case 'ไม่อนุมัติ':
        return 'bg-[#EF4444] text-white';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="w-full text-slate-800">
      {/* หัวข้อหน้า */}
      <h1 className="text-2xl font-bold text-slate-900 mb-6">
        การลา
      </h1>

      {/* การ์ดสรุปสถิติ 3 ใบ */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        {/* รออนุมัติ */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-3 h-3 rounded-full bg-[#F59E0B]"></span>
            <span className="font-bold text-slate-800 text-base">รออนุมัติ</span>
          </div>
          <div className="text-3xl font-extrabold text-slate-900">
            1 <span className="text-xl font-bold">คน</span>
          </div>
        </div>

        {/* อนุมัติแล้ว */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-3 h-3 rounded-full bg-[#22C55E]"></span>
            <span className="font-bold text-slate-800 text-base">อนุมัติแล้ว</span>
          </div>
          <div className="text-3xl font-extrabold text-slate-900">
            2 <span className="text-xl font-bold">คน</span>
          </div>
        </div>

        {/* ไม่อนุมัติ */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-3 h-3 rounded-full bg-[#EF4444]"></span>
            <span className="font-bold text-slate-800 text-base">ไม่อนุมัติ</span>
          </div>
          <div className="text-3xl font-extrabold text-slate-900">
            0 <span className="text-xl font-bold">คน</span>
          </div>
        </div>
      </div>

      {/* แถบตัวกรองและช่องค้นหา */}
      <div className="flex flex-col md:flex-row items-end justify-between gap-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full md:w-3/4">
          {/* วัน/เดือน/ปี */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              วัน/เดือน/ปี
            </label>
            <div className="relative">
              <select className="w-full bg-white border border-slate-200 text-slate-700 py-2.5 px-3.5 pr-8 rounded-xl appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs font-medium cursor-pointer shadow-sm">
                <option>17/09/2569</option>
                <option>18/09/2569</option>
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
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              แผนก
            </label>
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

          {/* ประเภทการลา */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              ประเภทการลา
            </label>
            <div className="relative">
              <select className="w-full bg-white border border-slate-200 text-slate-700 py-2.5 px-3.5 pr-8 rounded-xl appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs font-medium cursor-pointer shadow-sm">
                <option>ทั้งหมด</option>
                <option>ลาป่วย</option>
                <option>ลากิจ</option>
                <option>ลาพักร้อน</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-blue-600">
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* ช่องค้นหาพนักงาน */}
        <div className="w-full md:w-64">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="ค้นหาชื่อพนักงาน,รหัสพนักงาน.."
              className="w-full bg-[#E5E7EB]/70 border-none text-slate-700 py-2 pl-9 pr-3.5 rounded-xl placeholder-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* ตารางรายการขอลา */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#E5E7EB] text-slate-800 font-bold border-b border-slate-300">
                <th className="py-3.5 px-4 text-center">รหัสพนักงาน</th>
                <th className="py-3.5 px-4">ชื่อ-นามสกุล</th>
                <th className="py-3.5 px-4 text-center">แผนก</th>
                <th className="py-3.5 px-4 text-center">ประเภทการลา</th>
                <th className="py-3.5 px-4 text-center">วันที่เริ่มลา - สิ้นสุด</th>
                <th className="py-3.5 px-4 text-center">จำนวนวันที่ลา</th>
                <th className="py-3.5 px-4 text-center">เหตุผล / หลักฐาน</th>
                <th className="py-3.5 px-4 text-center">สถานะ</th>
                <th className="py-3.5 px-4 text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {leaveData.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4 text-center font-medium text-slate-900">{item.id}</td>
                  <td className="py-3.5 px-4 font-medium text-slate-800 whitespace-nowrap">{item.name}</td>
                  <td className="py-3.5 px-4 text-center text-slate-600">{item.department}</td>
                  <td className="py-3.5 px-4 text-center text-slate-700">{item.leaveType}</td>
                  <td className="py-3.5 px-4 text-center text-slate-600">{item.dateRange}</td>
                  <td className="py-3.5 px-4 text-center text-slate-700">{item.duration}</td>
                  <td className="py-3.5 px-4 text-center text-slate-700">{item.reason}</td>
                  
                  {/* Badge สถานะ */}
                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                    <span className={`inline-block px-3 py-0.5 rounded-md text-[11px] font-semibold ${getStatusBadge(item.status)}`}>
                      {item.status}
                    </span>
                  </td>

                  {/* ปุ่มจัดการ */}
                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                    {item.actionType === 'approve' ? (
                      <button className="bg-[#4F46E5] hover:bg-indigo-600 text-white px-3 py-1 rounded-lg text-[11px] font-medium shadow-sm transition-all active:scale-95">
                        ดูรายละเอียด/อนุมัติ
                      </button>
                    ) : (
                      <button className="bg-[#3B82F6] hover:bg-blue-600 text-white px-4 py-1 rounded-lg text-[11px] font-medium shadow-sm transition-all active:scale-95">
                        จัดการ
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* แถบการแบ่งหน้า (Pagination) */}
      <div className="flex items-center justify-between mt-5 text-xs text-slate-600">
        <span className="font-bold text-slate-800">หน้า 1 จาก 5 หน้า</span>
        <div className="flex items-center gap-1 select-none">
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
  );
}