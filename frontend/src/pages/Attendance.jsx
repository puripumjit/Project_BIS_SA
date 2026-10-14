import React, { useState, useEffect, useMemo } from 'react';
import { API_URL } from '../config';

const MONTH_NAMES = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
];

// แปลงสถานะจาก backend (อังกฤษ) เป็นไทยที่หน้าจอใช้
const STATUS_MAP = {
  NORMAL: 'ปกติ',
  LATE: 'สาย',
  ABSENT: 'ขาด/ไม่ลงเวลา',
  LEAVE: 'ลา',
  SICK_LEAVE: 'ลาป่วย',
  PERSONAL_LEAVE: 'ลากิจ',
};
const toThaiStatus = (s) => STATUS_MAP[(s || '').toUpperCase()] || s || '-';

// "2026-09-15" -> "กันยายน 2569"
const toThaiMonth = (dateStr) => {
  const [y, m] = (dateStr || '').slice(0, 7).split('-').map(Number);
  if (!y || !m) return '-';
  return `${MONTH_NAMES[m - 1]} ${y + 543}`;
};

const SHORT_MONTHS = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.',
];

// "2026-09-01" -> "1 ก.ย. 2569"
const toThaiDate = (dateStr) => {
  const [y, m, d] = (dateStr || '').slice(0, 10).split('-').map(Number);
  if (!y || !m || !d) return '-';
  return `${d} ${SHORT_MONTHS[m - 1]} ${y + 543}`;
};

// "08:03:00" -> "08:03"
const toHHMM = (t) => (t ? t.slice(0, 5) : '-');

export default function Attendance() {
  const [attendances, setAttendances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedMonth, setSelectedMonth] = useState('2026-09');
  const [selectedDept, setSelectedDept] = useState('ทั้งหมด');
  const [selectedStatus, setSelectedStatus] = useState('ทั้งหมด');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchAttendances = () => {
    setLoading(true);
    setError(null);

    const getJson = (path) =>
      fetch(`${API_URL}${path}`).then((res) => {
        if (!res.ok) throw new Error(`เชื่อมต่อ ${path} ไม่สำเร็จ (รหัสสถานะ: ${res.status})`);
        return res.json();
      });

    Promise.all([getJson('/attendance'), getJson('/employees')])
      .then(([attData, empData]) => {
        const empById = {};
        (Array.isArray(empData) ? empData : []).forEach((e) => {
          empById[e.id] = e;
        });

        const mapped = (Array.isArray(attData) ? attData : []).map((a) => {
          const emp = empById[a.employee_id] || {};
          return {
            id: a.id,
            employee_code: emp.employee_code || `ID ${a.employee_id}`,
            name: emp.first_name
              ? `${emp.prefix || ''}${emp.first_name} ${emp.last_name}`
              : '-',
            department: emp.department || '-',
            work_date: toThaiDate(a.work_date),
            month_key: (a.work_date || '').slice(0, 7), // "2026-09" ใช้กรองเดือน
            check_in_time: toHHMM(a.check_in),
            check_out_time: toHHMM(a.check_out),
            work_hours: a.work_hours,
            ot_hours: a.ot_hours,
            status: toThaiStatus(a.status),
          };
        });

        setAttendances(mapped);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Fetch Error:', err);
        setError(err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchAttendances();
  }, []);

  // คำนวณตัวเลขสถิติ 4 กล่องด้านบน (ตามเดือนที่เลือก)
  const stats = useMemo(() => {
    const inMonth = attendances.filter((i) => i.month_key === selectedMonth);
    return {
      normal: inMonth.filter((i) => i.status === 'ปกติ').length,
      late: inMonth.filter((i) => i.status === 'สาย').length,
      leave: inMonth.filter((i) => (i.status || '').includes('ลา')).length,
      absent: inMonth.filter((i) => i.status === 'ขาด/ไม่ลงเวลา' || i.status === 'ขาด').length,
    };
  }, [attendances, selectedMonth]);

  // ระบบกรองและค้นหาข้อมูล
  const filteredData = useMemo(() => {
    return attendances.filter((item) => {
      if (item.month_key !== selectedMonth) return false;
      if (selectedDept !== 'ทั้งหมด' && item.department !== selectedDept) return false;
      if (selectedStatus !== 'ทั้งหมด' && item.status !== selectedStatus) return false;
      if (searchTerm.trim() !== '') {
        const keyword = searchTerm.toLowerCase();
        return (
          (item.employee_code || '').toLowerCase().includes(keyword) ||
          (item.name || '').toLowerCase().includes(keyword)
        );
      }
      return true;
    });
  }, [attendances, selectedMonth, selectedDept, selectedStatus, searchTerm]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'ปกติ':
        return 'bg-[#22C55E] text-white';
      case 'สาย':
        return 'bg-[#F59E0B] text-white';
      case 'ลา':
      case 'ลากิจ':
      case 'ลาป่วย':
        return 'bg-[#06B6D4] text-white';
      case 'ขาด/ไม่ลงเวลา':
      case 'ขาด':
        return 'bg-[#EF4444] text-white';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="w-full text-slate-800">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">บันทึกการเข้าทำงาน</h1>

      {/* สรุปสถิติ 4 ใบ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-3 h-3 rounded-full bg-[#22C55E]"></span>
            <span className="font-bold text-slate-800 text-base">มาปกติ</span>
          </div>
          <div className="text-3xl font-extrabold text-slate-900">
            {stats.normal} <span className="text-xl font-bold">คน</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-3 h-3 rounded-full bg-[#F59E0B]"></span>
            <span className="font-bold text-slate-800 text-base">มาสาย</span>
          </div>
          <div className="text-3xl font-extrabold text-slate-900">
            {stats.late} <span className="text-xl font-bold">คน</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-3 h-3 rounded-full bg-[#06B6D4]"></span>
            <span className="font-bold text-slate-800 text-base">ลา</span>
          </div>
          <div className="text-3xl font-extrabold text-slate-900">
            {stats.leave} <span className="text-xl font-bold">คน</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-3 h-3 rounded-full bg-[#EF4444]"></span>
            <span className="font-bold text-slate-800 text-base">ขาด/ไม่ลงเวลา</span>
          </div>
          <div className="text-3xl font-extrabold text-slate-900">
            {stats.absent} <span className="text-xl font-bold">คน</span>
          </div>
        </div>
      </div>

      {/* กล่องแจ้งเตือน Error */}
      {error && (
        <div className="mb-4 p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 flex items-center justify-between text-xs">
          <span>เกิดข้อผิดพลาด: {error}</span>
          <button onClick={fetchAttendances} className="underline hover:text-red-800 font-semibold">
            ลองใหม่
          </button>
        </div>
      )}

      {/* ตัวกรองและค้นหา */}
      <div className="flex flex-col md:flex-row items-end justify-between gap-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full md:w-3/4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">รอบเงินเดือน</label>
            <div className="relative">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full bg-white border border-slate-200 text-slate-700 py-2.5 px-3.5 pr-8 rounded-xl appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs font-medium cursor-pointer shadow-sm"
              >
                <option value="2026-10">ตุลาคม 2569</option>
                <option value="2026-09">กันยายน 2569</option>
                <option value="2026-08">สิงหาคม 2569</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">แผนก</label>
            <div className="relative">
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="w-full bg-white border border-slate-200 text-slate-700 py-2.5 px-3.5 pr-8 rounded-xl appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs font-medium cursor-pointer shadow-sm"
              >
                <option value="ทั้งหมด">ทั้งหมด</option>
                <option value="ฝ่ายวิศวกรรมและการออกแบบ">ฝ่ายวิศวกรรมและการออกแบบ</option>
                <option value="ฝ่ายการผลิตและประกอบ">ฝ่ายการผลิตและประกอบ</option>
                <option value="ฝ่ายประกันคุณภาพ (QA/QC)">ฝ่ายประกันคุณภาพ (QA/QC)</option>
                <option value="ฝ่ายขายและพัฒนาธุรกิจ">ฝ่ายขายและพัฒนาธุรกิจ</option>
                <option value="ฝ่ายจัดซื้อและสโตร์">ฝ่ายจัดซื้อและสโตร์</option>
                <option value="ฝ่ายบัญชีและการเงิน">ฝ่ายบัญชีและการเงิน</option>
                <option value="ฝ่ายบริหารงานบุคคล (HR)">ฝ่ายบริหารงานบุคคล (HR)</option>
                <option value="ฝ่ายบริการและติดตั้ง">ฝ่ายบริการและติดตั้ง</option>
                <option value="ฝ่ายจัดส่งและโลจิสติกส์">ฝ่ายจัดส่งและโลจิสติกส์</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">สถานะ</label>
            <div className="relative">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full bg-white border border-slate-200 text-slate-700 py-2.5 px-3.5 pr-8 rounded-xl appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs font-medium cursor-pointer shadow-sm"
              >
                <option value="ทั้งหมด">ทั้งหมด</option>
                <option value="ปกติ">ปกติ</option>
                <option value="สาย">สาย</option>
                <option value="ลา">ลา</option>
                <option value="ลาป่วย">ลาป่วย</option>
                <option value="ลากิจ">ลากิจ</option>
                <option value="ขาด/ไม่ลงเวลา">ขาด/ไม่ลงเวลา</option>
              </select>
            </div>
          </div>
        </div>

        <div className="w-full md:w-64">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ค้นหาชื่อพนักงาน,รหัสพนักงาน.."
            className="w-full bg-[#E5E7EB]/70 border-none text-slate-700 py-2 px-3.5 rounded-xl placeholder-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
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
                <th className="py-3.5 px-4 text-center">วันที่</th>
                <th className="py-3.5 px-4 text-center">เวลาเข้า</th>
                <th className="py-3.5 px-4 text-center">เวลาออก</th>
                <th className="py-3.5 px-4 text-center">ชั่วโมงทำงาน</th>
                <th className="py-3.5 px-4 text-center">OT (ชม.)</th>
                <th className="py-3.5 px-4 text-center">สถานะ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="9" className="py-8 text-center text-slate-400">กำลังโหลดข้อมูล...</td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-8 text-center text-slate-400">ไม่พบข้อมูล</td>
                </tr>
              ) : (
                filteredData.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 text-center font-medium text-slate-900">{item.employee_code}</td>
                    <td className="py-3 px-4 font-medium text-slate-800 whitespace-nowrap">{item.name}</td>
                    <td className="py-3 px-4 text-center text-slate-600">{item.department}</td>
                    <td className="py-3 px-4 text-center text-slate-600">{item.work_date}</td>
                    <td className="py-3 px-4 text-center text-slate-700">{item.check_in_time}</td>
                    <td className="py-3 px-4 text-center text-slate-700">{item.check_out_time}</td>
                    <td className="py-3 px-4 text-center text-slate-700 font-medium">{item.work_hours}</td>
                    <td className="py-3 px-4 text-center text-slate-700 font-medium">{item.ot_hours}</td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <span className={`inline-block px-2.5 py-0.5 rounded-md text-[11px] font-semibold ${getStatusBadge(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
