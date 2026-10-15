import React, { useState, useEffect, useMemo } from 'react';
import { ClipboardCheck, Check, Clock, Plane, X, Search, Pencil } from 'lucide-react';
import { API_URL } from '../config';

// เวลาเริ่มงานมาตรฐาน และเวลาผ่อนผัน (นาที) — ปรับตามนโยบายบริษัท
// เช่น เข้า 07:00 = ปกติ, เข้า 08:20 = สาย (เกิน 08:00 ไป 20 นาที)
const WORK_START = '08:00';
const GRACE_MINUTES = 0;

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

// สำหรับ <input type="time"> ต้องเป็น "HH:MM" หรือ ''
const toTimeInput = (t) => (t ? String(t).slice(0, 5) : '');

const toMinutes = (t) => {
  const [h, m] = String(t).slice(0, 5).split(':').map(Number);
  return h * 60 + m;
};

/**
 * สถานะจากเวลาเข้า: เกิน (เวลาเริ่มงาน + ผ่อนผัน) = LATE, ไม่เกิน = NORMAL
 * คืน lateMinutes ด้วยเพื่อแสดงผล
 */
const statusFromCheckIn = (checkIn) => {
  if (!checkIn) return { status: null, lateMinutes: 0 };
  const diff = toMinutes(checkIn) - toMinutes(WORK_START);
  return diff > GRACE_MINUTES
    ? { status: 'LATE', lateMinutes: diff }
    : { status: 'NORMAL', lateMinutes: 0 };
};

// สถานะที่ให้เปลี่ยนอัตโนมัติตามเวลาเข้าได้ (ลา/ขาด ต้องเลือกเอง ไม่ให้เวลาไปทับ)
const isAutoStatus = (s) => !s || s === 'NORMAL' || s === 'LATE';

const STATUS_OPTIONS = Object.entries(STATUS_MAP).map(([value, label]) => ({ value, label }));

const CARD = 'bg-white rounded-2xl border border-slate-200 shadow-sm';

const selectCls =
  'w-full bg-white border border-slate-200 text-slate-700 py-2.5 px-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer';

const inputCls =
  'w-full bg-white border border-slate-200 text-slate-700 py-2.5 px-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';

// ป้ายสถานะ (โทนอ่อน เหมือนหน้าการลา)
const getStatusBadge = (status) => {
  switch (status) {
    case 'ปกติ':
      return 'bg-emerald-50 text-emerald-600';
    case 'สาย':
      return 'bg-amber-50 text-amber-600';
    case 'ลา':
    case 'ลากิจ':
    case 'ลาป่วย':
      return 'bg-sky-100 text-sky-600';
    case 'ขาด/ไม่ลงเวลา':
    case 'ขาด':
      return 'bg-rose-50 text-rose-500';
    default:
      return 'bg-slate-100 text-slate-600';
  }
};

/* ---------- การ์ดสถิติด้านบน ---------- */
function StatCard({ icon, iconBg, iconColor, cardBg = 'bg-white', label, value }) {
  return (
    <div className={`${CARD} ${cardBg} px-5 py-5 flex items-center gap-4`}>
      <div className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 ${iconBg} ${iconColor}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-sm font-semibold text-slate-700">{label}</div>
        <div className="text-3xl font-bold text-[#1E3A8A] leading-tight">
          {value} <span className="text-lg font-semibold">คน</span>
        </div>
      </div>
    </div>
  );
}

/* ---------- Modal แก้ไขการเข้าทำงานรายคน ---------- */
function EditAttendanceModal({ item, onClose, onSaved }) {
  const [form, setForm] = useState({
    check_in: toTimeInput(item.raw.check_in),
    check_out: toTimeInput(item.raw.check_out),
    work_hours: String(item.raw.work_hours ?? ''),
    ot_hours: String(item.raw.ot_hours ?? ''),
    status: (item.raw.status || 'NORMAL').toUpperCase(),
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const setField = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  // เปลี่ยนเวลาเข้า -> สถานะเปลี่ยนตามทันที (เฉพาะสถานะ ปกติ/สาย)
  const handleCheckInChange = (e) => {
    const value = e.target.value;
    setForm((f) => {
      const next = { ...f, check_in: value };
      const auto = statusFromCheckIn(value);
      if (auto.status && isAutoStatus(f.status)) next.status = auto.status;
      return next;
    });
  };

  const lateInfo = useMemo(() => statusFromCheckIn(form.check_in), [form.check_in]);
  const autoActive = isAutoStatus(form.status);

  const handleSubmit = async () => {
    if (form.work_hours !== '' && !(Number(form.work_hours) >= 0)) {
      return setError('ชั่วโมงทำงานต้องไม่ติดลบ');
    }
    if (form.ot_hours !== '' && !(Number(form.ot_hours) >= 0)) {
      return setError('ชั่วโมง OT ต้องไม่ติดลบ');
    }

    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/attendance/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee_id: item.raw.employee_id,
          work_date: item.raw.work_date,
          check_in: form.check_in ? `${form.check_in}:00` : null,
          check_out: form.check_out ? `${form.check_out}:00` : null,
          work_hours: Number(form.work_hours || 0),
          ot_hours: Number(form.ot_hours || 0),
          status: form.status,
        }),
      });
      if (!res.ok) {
        const msg = (await res.text()).trim();
        throw new Error(msg || `บันทึกไม่สำเร็จ (รหัสสถานะ: ${res.status})`);
      }
      onSaved();
    } catch (err) {
      console.error('Edit Attendance Error:', err);
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-xl p-6">
        <h2 className="text-base font-bold text-slate-900">แก้ไขการเข้าทำงาน</h2>
        <p className="text-xs text-slate-500 mt-1 mb-4">
          {item.employee_code} - {item.name} · {item.work_date}
        </p>

        {error && (
          <div className="mb-3 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs">{error}</div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">เวลาเข้า</label>
            <input type="time" value={form.check_in} onChange={handleCheckInChange} className={inputCls} />
            <p className="text-[11px] text-slate-400 mt-1">
              เริ่มงาน {WORK_START} น.{GRACE_MINUTES > 0 ? ` (ผ่อนผัน ${GRACE_MINUTES} นาที)` : ''}
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">เวลาออก</label>
            <input type="time" value={form.check_out} onChange={setField('check_out')} className={inputCls} />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">ชั่วโมงทำงาน</label>
            <input
              type="number" min="0" step="0.01"
              value={form.work_hours} onChange={setField('work_hours')} className={inputCls}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">OT (ชม.)</label>
            <input
              type="number" min="0" step="0.01"
              value={form.ot_hours} onChange={setField('ot_hours')} className={inputCls}
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-700 mb-1.5">สถานะ</label>
            <select value={form.status} onChange={setField('status')} className={selectCls}>
              {STATUS_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
            <p className="text-[11px] mt-1 text-slate-400">
              {autoActive
                ? lateInfo.status === 'LATE'
                  ? `สถานะเปลี่ยนตามเวลาเข้าอัตโนมัติ: สาย ${lateInfo.lateMinutes} นาที`
                  : 'สถานะเปลี่ยนตามเวลาเข้าอัตโนมัติ'
                : 'สถานะนี้เลือกเอง เวลาเข้าจะไม่เปลี่ยนสถานะให้'}
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 text-xs font-bold px-5 py-2.5 rounded-xl cursor-pointer"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="bg-[#2563EB] hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold px-5 py-2.5 rounded-xl cursor-pointer"
          >
            {saving ? 'กำลังบันทึก...' : 'บันทึก'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Attendance() {
  const [attendances, setAttendances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingItem, setEditingItem] = useState(null);

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
            raw: a, // ข้อมูลดิบจาก API ไว้ใช้ในฟอร์มแก้ไข
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

  const handleSaved = () => {
    setEditingItem(null);
    fetchAttendances();
  };

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

  // ระบบกรองและค้นหาข้อมูล (กรองทันทีที่พิมพ์/เลือก)
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

  return (
    <div className="w-full text-slate-800 space-y-5">
      {/* หัวข้อ */}
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-blue-50 text-[#1E3A8A] flex items-center justify-center shrink-0">
          <ClipboardCheck className="w-9 h-9" strokeWidth={1.6} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#1E3A8A]">บันทึกการเข้าทำงาน</h1>
          <p className="text-sm text-slate-500">
            ดูเวลาเข้า-ออกงาน ชั่วโมงทำงาน และ OT ของพนักงานประจำวัน ประจำเดือน{toThaiMonth(`${selectedMonth}-01`)}
          </p>
        </div>
      </div>

      {/* กล่องแจ้งเตือน Error */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center justify-between">
          <span>เกิดข้อผิดพลาด: {error}</span>
          <button onClick={fetchAttendances} className="underline font-semibold hover:text-red-900">
            ลองใหม่
          </button>
        </div>
      )}

      {/* สรุปสถิติ 4 ใบ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          icon={<Check className="w-7 h-7" strokeWidth={3} />}
          iconBg="bg-emerald-100"
          iconColor="text-emerald-500"
          label="มาปกติ"
          value={loading ? '-' : stats.normal}
        />
        <StatCard
          icon={<Clock className="w-7 h-7" />}
          iconBg="bg-amber-100"
          iconColor="text-amber-500"
          cardBg="bg-amber-50/60"
          label="มาสาย"
          value={loading ? '-' : stats.late}
        />
        <StatCard
          icon={<Plane className="w-7 h-7" />}
          iconBg="bg-sky-100"
          iconColor="text-sky-500"
          label="ลา"
          value={loading ? '-' : stats.leave}
        />
        <StatCard
          icon={<X className="w-7 h-7" strokeWidth={3} />}
          iconBg="bg-rose-100"
          iconColor="text-rose-500"
          cardBg="bg-rose-50/60"
          label="ขาด/ไม่ลงเวลา"
          value={loading ? '-' : stats.absent}
        />
      </div>

      {/* ตัวกรองและค้นหา */}
      <div className={`${CARD} p-4 grid grid-cols-1 md:grid-cols-12 gap-3 items-end`}>
        <div className="md:col-span-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ค้นหาชื่อพนักงาน / รหัสพนักงาน"
              className="w-full bg-white border border-slate-200 text-slate-700 py-2.5 pl-9 pr-3 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="md:col-span-3">
          <label className="block text-xs font-medium text-slate-600 mb-1">รอบเงินเดือน</label>
          <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className={selectCls}>
            <option value="2026-10">ตุลาคม 2569</option>
            <option value="2026-09">กันยายน 2569</option>
            <option value="2026-08">สิงหาคม 2569</option>
          </select>
        </div>

        <div className="md:col-span-3">
          <label className="block text-xs font-medium text-slate-600 mb-1">แผนก</label>
          <select value={selectedDept} onChange={(e) => setSelectedDept(e.target.value)} className={selectCls}>
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

        <div className="md:col-span-3">
          <label className="block text-xs font-medium text-slate-600 mb-1">สถานะ</label>
          <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)} className={selectCls}>
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

      {/* ตารางแสดงผล */}
      <div className={`${CARD} p-5`}>
        <h2 className="text-lg font-bold text-[#1E3A8A] mb-4">รายละเอียดการเข้าทำงาน</h2>
        <div className="overflow-auto max-h-[640px] rounded-xl border border-slate-100">
          <table className="w-full text-xs">
            <thead className="bg-blue-50/70 text-slate-700 font-bold sticky top-0">
              <tr>
                <th className="py-3 px-3 text-left">ลำดับ</th>
                <th className="py-3 px-3 text-left">รหัสพนักงาน</th>
                <th className="py-3 px-3 text-left">ชื่อ-นามสกุล</th>
                <th className="py-3 px-3 text-left">แผนก</th>
                <th className="py-3 px-3 text-center">วันที่</th>
                <th className="py-3 px-3 text-center">เวลาเข้า</th>
                <th className="py-3 px-3 text-center">เวลาออก</th>
                <th className="py-3 px-3 text-center">ชั่วโมงทำงาน</th>
                <th className="py-3 px-3 text-center">OT (ชม.)</th>
                <th className="py-3 px-3 text-center">สถานะ</th>
                <th className="py-3 px-3 text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="11" className="py-8 text-center text-slate-400">กำลังโหลดข้อมูล...</td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan="11" className="py-8 text-center text-slate-400">ไม่พบข้อมูล</td>
                </tr>
              ) : (
                filteredData.map((item, i) => (
                  <tr key={item.id} className="hover:bg-slate-50/70">
                    <td className="py-3.5 px-3 text-slate-500">{i + 1}</td>
                    <td className="py-3.5 px-3 font-medium text-slate-900 whitespace-nowrap">{item.employee_code}</td>
                    <td className="py-3.5 px-3 whitespace-nowrap">{item.name}</td>
                    <td className="py-3.5 px-3 text-slate-600">{item.department}</td>
                    <td className="py-3.5 px-3 text-center text-slate-600 whitespace-nowrap">{item.work_date}</td>
                    <td className="py-3.5 px-3 text-center text-slate-700">{item.check_in_time}</td>
                    <td className="py-3.5 px-3 text-center text-slate-700">{item.check_out_time}</td>
                    <td className="py-3.5 px-3 text-center text-slate-700 font-medium">{item.work_hours}</td>
                    <td className="py-3.5 px-3 text-center text-slate-700 font-medium">{item.ot_hours}</td>
                    <td className="py-3.5 px-3 text-center whitespace-nowrap">
                      <span className={`inline-block px-3 py-1 rounded-lg text-[11px] font-semibold ${getStatusBadge(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <button
                        type="button"
                        title="แก้ไข"
                        aria-label="แก้ไขการเข้าทำงาน"
                        onClick={() => setEditingItem(item)}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editingItem && (
        <EditAttendanceModal
          key={editingItem.id}
          item={editingItem}
          onClose={() => setEditingItem(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
