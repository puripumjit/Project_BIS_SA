import React from 'react';

export default function Freelance() {
  // ข้อมูลจำลองตามตารางฟรีแลนซ์ในภาพ
  const freelanceData = [
    {
      id: 'FR001',
      name: 'นายปกรณ์ ศรีสวัสดิ์',
      phone: '089-245-7813',
      smallCabinet: '5',
      largeCabinet: '2',
      totalAmount: '6,000',
      status: 'จ่ายแล้ว',
    },
    {
      id: 'FR002',
      name: 'นางสาวชลธิชา วัฒนกุล',
      phone: '092-555-1555',
      smallCabinet: '4',
      largeCabinet: '-',
      totalAmount: '3,200',
      status: 'รอจ่าย',
    },
    {
      id: 'FR003',
      name: 'นายพัด มีสุข',
      phone: '099-123-4578',
      smallCabinet: '-',
      largeCabinet: '6',
      totalAmount: '6,000',
      status: 'จ่ายแล้ว',
    },
    {
      id: 'FR004',
      name: 'นางสาวธารใส อัยยะ',
      phone: '083-681-7410',
      smallCabinet: '2',
      largeCabinet: '1',
      totalAmount: '2,600',
      status: 'ยกเลิก',
    },
    {
      id: 'FR005',
      name: 'นายมงคล เพรียกพร้ำ',
      phone: '091-765-8431',
      smallCabinet: '5',
      largeCabinet: '-',
      totalAmount: '4,000',
      status: 'จ่ายแล้ว',
    },
    {
      id: 'FR006',
      name: 'นายวรเมธ จันทร์เพ็ญ',
      phone: '062-888-4745',
      smallCabinet: '3',
      largeCabinet: '-',
      totalAmount: '2,400',
      status: 'จ่ายแล้ว',
    },
    {
      id: 'FR007',
      name: 'นางสาวศิกานต์ รักษา',
      phone: '081-687-2225',
      smallCabinet: '-',
      largeCabinet: '4',
      totalAmount: '4,000',
      status: 'รอจ่าย',
    },
  ];

  // กำหนดสไตล์ของ Badge สถานะตามแบบใน UI
  const getStatusBadge = (status) => {
    switch (status) {
      case 'จ่ายแล้ว':
        return 'bg-emerald-50 text-emerald-600 border border-emerald-300';
      case 'รอจ่าย':
        return 'bg-amber-50 text-amber-500 border border-amber-300';
      case 'ยกเลิก':
        return 'bg-red-50 text-red-500 border border-red-300';
      default:
        return 'bg-slate-50 text-slate-600 border border-slate-200';
    }
  };

  return (
    <div className="w-full text-slate-800">
      {/* ส่วนหัว: ไอคอน + ชื่อหน้า และปุ่ม + เพิ่มฟรีแลนซ์ */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          {/* ไอคอนฟรีแลนซ์ / ผู้ใช้งาน */}
          <div className="text-[#1E3A8A]">
            <svg className="w-8 h-8 fill-current" viewBox="0 0 24 24">
              <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            ฟรีแลนซ์
          </h1>
        </div>

        {/* ปุ่ม + เพิ่มฟรีแลนซ์ */}
        <button className="flex items-center gap-1.5 bg-[#3B82F6] hover:bg-blue-600 text-white px-5 py-2 rounded-xl text-sm font-semibold shadow-sm transition-all active:scale-95">
          <span>+</span>
          <span>เพิ่มฟรีแลนซ์</span>
        </button>
      </div>

      {/* ตารางข้อมูลฟรีแลนซ์ */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              {/* แถวหัวตารางหลัก */}
              <tr className="bg-[#E5E7EB] text-slate-800 font-bold border-b border-slate-300">
                <th rowSpan="2" className="py-3 px-4 text-center align-middle border-r border-slate-300/50">
                  รหัสฟรีแลนซ์
                </th>
                <th rowSpan="2" className="py-3 px-4 align-middle border-r border-slate-300/50">
                  ชื่อ-นามสกุล
                </th>
                <th rowSpan="2" className="py-3 px-4 text-center align-middle border-r border-slate-300/50">
                  เบอร์โทรศัพท์
                </th>
                <th colSpan="2" className="py-2 px-4 text-center border-b border-r border-slate-300/70">
                  อัตราตามชิ้นงาน/รอบ
                </th>
                <th rowSpan="2" className="py-3 px-4 text-center align-middle border-r border-slate-300/50">
                  ยอดรวม(บาท)
                </th>
                <th rowSpan="2" className="py-3 px-4 text-center align-middle border-r border-slate-300/50">
                  สถานะ
                </th>
                <th rowSpan="2" className="py-3 px-4 text-center align-middle">
                  จัดการ
                </th>
              </tr>
              {/* แถวหัวตารางย่อยสำหรับ ตู้เล็ก / ตู้ใหญ่ */}
              <tr className="bg-[#E5E7EB] text-slate-700 font-semibold border-b border-slate-300">
                <th className="py-1.5 px-3 text-center border-r border-slate-300/50">ตู้เล็ก</th>
                <th className="py-1.5 px-3 text-center border-r border-slate-300/50">ตู้ใหญ่</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {freelanceData.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4 text-center font-medium text-slate-900">{item.id}</td>
                  <td className="py-3.5 px-4 font-medium text-slate-800 whitespace-nowrap">{item.name}</td>
                  <td className="py-3.5 px-4 text-center text-slate-600 font-medium">{item.phone}</td>
                  <td className="py-3.5 px-4 text-center text-slate-700 font-medium">{item.smallCabinet}</td>
                  <td className="py-3.5 px-4 text-center text-slate-700 font-medium">{item.largeCabinet}</td>
                  <td className="py-3.5 px-4 text-center font-bold text-slate-800">{item.totalAmount}</td>
                  
                  {/* Badge สถานะ */}
                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                    <span className={`inline-block px-3 py-0.5 rounded-full text-[11px] font-medium ${getStatusBadge(item.status)}`}>
                      {item.status}
                    </span>
                  </td>

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