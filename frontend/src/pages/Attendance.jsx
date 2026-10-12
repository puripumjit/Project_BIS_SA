  import React, { useState } from 'react';

  export default function Attendance() {
    const attendanceData = [
      {
        id: 'EMP001',
        name: 'นายสมชาย ใจดี',
        department: 'ฝ่ายบัญชี',
        date: '07/09/2569',
        checkIn: '08:20 น.',
        checkOut: '18.36 น.',
        workHours: '9 ชม.',
        ot: '1 ชม.',
        status: 'ปกติ',
      },
      {
        id: 'EMP002',
        name: 'นางสาวสุภาวดี แสงทอง',
        department: 'ฝ่ายการเงิน',
        date: '07/09/2569',
        checkIn: '08:24 น.',
        checkOut: '19.30 น.',
        workHours: '10 ชม.',
        ot: '2 ชม.',
        status: 'ปกติ',
      },
      {
        id: 'EMP003',
        name: 'นางสมร สมดี',
        department: 'ฝ่ายบุคคล',
        date: '07/09/2569',
        checkIn: '08:37 น.',
        checkOut: '08:24 น.',
        workHours: '7 ชม. 23 น.',
        ot: '-',
        status: 'สาย',
      },
      {
        id: 'EMP004',
        name: 'นายธนกร พร้อมเพียง',
        department: 'ฝ่ายการตลาด',
        date: '07/09/2569',
        checkIn: '-',
        checkOut: '-',
        workHours: '-',
        ot: '-',
        status: 'ลากิจ',
      },
      {
        id: 'EMP005',
        name: 'นางสาวกนกวรรณ ศรีสุข',
        department: 'ฝ่ายการขาย',
        date: '07/09/2569',
        checkIn: '-',
        checkOut: '-',
        workHours: '-',
        ot: '-',
        status: 'ขาด/ไม่ลงเวลา',
      },
      {
        id: 'EMP006',
        name: 'นายวรชัย รัตนกุล',
        department: 'ฝ่ายซ่อมบำรุง',
        date: '07/09/2569',
        checkIn: '08:27 น.',
        checkOut: '17:40 น.',
        workHours: '8 ชม.',
        ot: '-',
        status: 'ปกติ',
      },
      {
        id: 'EMP007',
        name: 'นางสมใจ ยินดี',
        department: 'ฝ่ายบริการลูกค้า',
        date: '07/09/2569',
        checkIn: '-',
        checkOut: '-',
        workHours: '-',
        ot: '-',
        status: 'ขาด/ไม่ลงเวลา',
      },
    ];

    const getStatusBadge = (status) => {
      switch (status) {
        case 'ปกติ':
          return 'bg-[#22C55E] text-white';
        case 'สาย':
          return 'bg-[#F59E0B] text-white';
        case 'ลากิจ':
          return 'bg-[#06B6D4] text-white';
        case 'ขาด/ไม่ลงเวลา':
          return 'bg-[#EF4444] text-white';
        default:
          return 'bg-gray-100 text-gray-700';
      }
    };

    return (
      <div className="w-full text-slate-800">
        <h1 className="text-2xl font-bold text-slate-900 mb-6">
          บันทึกการเข้าทำงาน
        </h1>

        {/* สรุปสถิติ 4 ใบ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-3 h-3 rounded-full bg-[#22C55E]"></span>
              <span className="font-bold text-slate-800 text-base">มาปกติ</span>
            </div>
            <div className="text-3xl font-extrabold text-slate-900">
              35 <span className="text-xl font-bold">คน</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-3 h-3 rounded-full bg-[#F59E0B]"></span>
              <span className="font-bold text-slate-800 text-base">มาสาย</span>
            </div>
            <div className="text-3xl font-extrabold text-slate-900">
              2 <span className="text-xl font-bold">คน</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-3 h-3 rounded-full bg-[#06B6D4]"></span>
              <span className="font-bold text-slate-800 text-base">ลา</span>
            </div>
            <div className="text-3xl font-extrabold text-slate-900">
              1 <span className="text-xl font-bold">คน</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-3 h-3 rounded-full bg-[#EF4444]"></span>
              <span className="font-bold text-slate-800 text-base">ขาด/ไม่ลงเวลา</span>
            </div>
            <div className="text-3xl font-extrabold text-slate-900">
              0 <span className="text-xl font-bold">คน</span>
            </div>
          </div>
        </div>

        {/* ตัวกรองและค้นหา */}
        <div className="flex flex-col md:flex-row items-end justify-between gap-4 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full md:w-3/4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                รอบเงินเดือน
              </label>
              <div className="relative">
                <select className="w-full bg-white border border-slate-200 text-slate-700 py-2.5 px-3.5 pr-8 rounded-xl appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs font-medium cursor-pointer shadow-sm">
                  <option>กันยายน 2569</option>
                  <option>สิงหาคม 2569</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-blue-600">
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                  </svg>
                </div>
              </div>
            </div>

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
                  <option>ฝ่ายการตลาด</option>
                  <option>ฝ่ายการขาย</option>
                  <option>ฝ่ายซ่อมบำรุง</option>
                  <option>ฝ่ายบริการลูกค้า</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-blue-600">
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                  </svg>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                สถานะ
              </label>
              <div className="relative">
                <select className="w-full bg-white border border-slate-200 text-slate-700 py-2.5 px-3.5 pr-8 rounded-xl appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs font-medium cursor-pointer shadow-sm">
                  <option>ทั้งหมด</option>
                  <option>ปกติ</option>
                  <option>สาย</option>
                  <option>ลากิจ</option>
                  <option>ขาด/ไม่ลงเวลา</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-blue-600">
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

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

        {/* ตารางแสดงผล */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#E5E7EB] text-slate-800 font-bold border-b border-slate-300">
                  <th className="py-3.5 px-4 text-center">รหัสพนักงาน</th>
                  <th className="py-3.5 px-4">ชื่อ-นามสกุล</th>
                  <th className="py-3.5 px-4 text-center">แผนก</th>
                  <th className="py-3.5 px-4 text-center">วันที่/เดือน/ปี</th>
                  <th className="py-3.5 px-4 text-center">เวลาเข้า</th>
                  <th className="py-3.5 px-4 text-center">เวลาออก</th>
                  <th className="py-3.5 px-4 text-center">ชั่วโมงการทำงาน</th>
                  <th className="py-3.5 px-4 text-center">OT</th>
                  <th className="py-3.5 px-4 text-center">สถานะ</th>
                  <th className="py-3.5 px-4 text-center">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {attendanceData.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 text-center font-medium text-slate-900">{item.id}</td>
                    <td className="py-3 px-4 font-medium text-slate-800 whitespace-nowrap">{item.name}</td>
                    <td className="py-3 px-4 text-center text-slate-600">{item.department}</td>
                    <td className="py-3 px-4 text-center text-slate-600">{item.date}</td>
                    <td className="py-3 px-4 text-center text-slate-700">{item.checkIn}</td>
                    <td className="py-3 px-4 text-center text-slate-700">{item.checkOut}</td>
                    <td className="py-3 px-4 text-center text-slate-700 font-medium">{item.workHours}</td>
                    <td className="py-3 px-4 text-center text-slate-700 font-medium">{item.ot}</td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <span className={`inline-block px-2.5 py-0.5 rounded-md text-[11px] font-semibold ${getStatusBadge(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button className="inline-flex items-center gap-1 bg-[#3B82F6] hover:bg-blue-600 text-white px-2.5 py-1 rounded-lg text-[11px] font-medium shadow-sm transition-all active:scale-95">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                        แก้ไข
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
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