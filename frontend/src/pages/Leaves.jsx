import React, { useState, useEffect, useMemo } from 'react';
import { API_URL } from '../config';

// ประเภทการลา: backend (อังกฤษ) -> ไทย
const LEAVE_TYPE_MAP = {
  SICK: 'ลาป่วย',
  PERSONAL: 'ลากิจ',
  VACATION: 'ลาพักร้อน',
  OTHER: 'อื่น ๆ',
};

// สิทธิ์การลาต่อปี (วัน) — แก้ตัวเลขตามนโยบายบริษัทได้ที่นี่
// ประเภทที่ไม่ได้กำหนดไว้ (OTHER) จะแสดงเฉพาะจำนวนวันที่ใช้ไปแล้ว
const LEAVE_QUOTA = {
  SICK: 30,
  PERSONAL: 6,
  VACATION: 10,
};

// สถานะใบลา: backend (อังกฤษ) -> ไทย
const STATUS_MAP = {
  PENDING: 'รออนุมัติ',
  APPROVED: 'อนุมัติแล้ว',
  REJECTED: 'ไม่อนุมัติ',
};

const toThaiLeaveType = (t) => LEAVE_TYPE_MAP[(t || '').toUpperCase()] || t || '-';
const toThaiStatus = (s) => STATUS_MAP[(s || '').toUpperCase()] || s || '-';

// "2026-09-08" -> "08/09/2569"
const toThaiDate = (dateStr) => {
  const [y, m, d] = (dateStr || '').slice(0, 10).split('-').map(Number);
  if (!y || !m || !d) return '-';
  return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y + 543}`;
};

// ช่วงวันที่: วันเดียวแสดงวันเดียว, หลายวันแสดง "เริ่ม - สิ้นสุด"
const toDateRange = (start, end) => {
  const s = toThaiDate(start);
  const e = toThaiDate(end);
  return s === e ? s : `${s} - ${e}`;
};

const formatDays = (n) => (Number.isInteger(n) ? `${n}` : n.toFixed(1));

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

const getStatusDot = (status) => {
  switch (status) {
    case 'รออนุมัติ':
      return 'bg-[#F59E0B]';
    case 'อนุมัติแล้ว':
      return 'bg-[#22C55E]';
    case 'ไม่อนุมัติ':
      return 'bg-[#EF4444]';
    default:
      return 'bg-gray-300';
  }
};

export default function Leaves() {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedMonth, setSelectedMonth] = useState('2026-09');
  const [selectedDept, setSelectedDept] = useState('ทั้งหมด');
  const [selectedType, setSelectedType] = useState('ทั้งหมด');
  const [searchTerm, setSearchTerm] = useState('');

  // ป๊อปอัปจัดการคำขอลา
  const [activeLeave, setActiveLeave] = useState(null);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState(null);

  const fetchLeaves = () => {
    setLoading(true);
    setError(null);

    const getJson = (path) =>
      fetch(`${API_URL}${path}`).then((res) => {
        if (!res.ok) throw new Error(`เชื่อมต่อ ${path} ไม่สำเร็จ (รหัสสถานะ: ${res.status})`);
        return res.json();
      });

    return Promise.all([getJson('/leaves'), getJson('/employees')])
      .then(([leaveData, empData]) => {
        const empById = {};
        (Array.isArray(empData) ? empData : []).forEach((e) => {
          empById[e.id] = e;
        });

        const mapped = (Array.isArray(leaveData) ? leaveData : []).map((l) => {
          const emp = empById[l.employee_id] || {};
          return {
            id: l.id,
            employee_id: l.employee_id,
            employee_code: emp.employee_code || `ID ${l.employee_id}`,
            name: emp.first_name
              ? `${emp.prefix || ''}${emp.first_name} ${emp.last_name}`
              : '-',
            department: emp.department || '-',
            type_code: (l.leave_type || '').toUpperCase(),
            leave_type: toThaiLeaveType(l.leave_type),
            start_raw: (l.start_date || '').slice(0, 10),
            end_raw: (l.end_date || '').slice(0, 10),
            date_range: toDateRange(l.start_date, l.end_date),
            month_key: (l.start_date || '').slice(0, 7), // กรองตามเดือนที่เริ่มลา
            days: Number(l.days) || 0,
            reason: l.reason || '-',
            status: toThaiStatus(l.status),
            approval_note: l.approval_note || '',
          };
        });

        setLeaves(mapped);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Fetch Error:', err);
        setError(err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  // สถิติ 3 กล่องด้านบน (นับเป็นจำนวนพนักงานที่ไม่ซ้ำกัน ตามเดือนที่เลือก)
  const stats = useMemo(() => {
    const inMonth = leaves.filter((i) => i.month_key === selectedMonth);
    const countPeople = (status) =>
      new Set(inMonth.filter((i) => i.status === status).map((i) => i.employee_id)).size;
    return {
      pending: countPeople('รออนุมัติ'),
      approved: countPeople('อนุมัติแล้ว'),
      rejected: countPeople('ไม่อนุมัติ'),
    };
  }, [leaves, selectedMonth]);

  // กรองและค้นหา
  const filteredData = useMemo(() => {
    return leaves.filter((item) => {
      if (item.month_key !== selectedMonth) return false;
      if (selectedDept !== 'ทั้งหมด' && item.department !== selectedDept) return false;
      if (selectedType !== 'ทั้งหมด' && item.leave_type !== selectedType) return false;
      if (searchTerm.trim() !== '') {
        const keyword = searchTerm.toLowerCase();
        return (
          (item.employee_code || '').toLowerCase().includes(keyword) ||
          (item.name || '').toLowerCase().includes(keyword)
        );
      }
      return true;
    });
  }, [leaves, selectedMonth, selectedDept, selectedType, searchTerm]);

  // สิทธิ์การลาคงเหลือของใบลาที่เปิดอยู่ (นับเฉพาะที่อนุมัติแล้ว ประเภทเดียวกัน ปีเดียวกัน)
  const balance = useMemo(() => {
    if (!activeLeave) return null;
    const year = activeLeave.start_raw.slice(0, 4);
    const used = leaves
      .filter(
        (i) =>
          i.id !== activeLeave.id &&
          i.employee_id === activeLeave.employee_id &&
          i.type_code === activeLeave.type_code &&
          i.status === 'อนุมัติแล้ว' &&
          i.start_raw.slice(0, 4) === year
      )
      .reduce((sum, i) => sum + i.days, 0);
    const quota = LEAVE_QUOTA[activeLeave.type_code];
    return { used, quota, remaining: quota != null ? quota - used : null };
  }, [leaves, activeLeave]);

  const openModal = (item) => {
    setActiveLeave(item);
    setNote(item.approval_note || '');
    setModalError(null);
  };

  const closeModal = () => {
    if (saving) return;
    setActiveLeave(null);
    setNote('');
    setModalError(null);
  };

  // กด Esc เพื่อปิดป๊อปอัป
  useEffect(() => {
    if (!activeLeave) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') closeModal();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const submitDecision = async (status) => {
    if (!activeLeave) return;
    setSaving(true);
    setModalError(null);
    try {
      const res = await fetch(`${API_URL}/leaves/${activeLeave.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, note }),
      });
      if (!res.ok) {
        const msg = (await res.text()).trim();
        throw new Error(msg || `บันทึกไม่สำเร็จ (รหัสสถานะ: ${res.status})`);
      }
      await fetchLeaves();
      setSaving(false);
      setActiveLeave(null);
      setNote('');
    } catch (err) {
      console.error('Update Error:', err);
      setModalError(err.message);
      setSaving(false);
    }
  };

  const selectClass =
    'w-full bg-white border border-slate-200 text-slate-700 py-2.5 px-3.5 pr-8 rounded-xl appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs font-medium cursor-pointer shadow-sm';

  const isPending = activeLeave?.status === 'รออนุมัติ';

  return (
    <div className="w-full text-slate-800">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">การลา</h1>

      {/* สรุปสถิติ 3 ใบ */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-3 h-3 rounded-full bg-[#F59E0B]"></span>
            <span className="font-bold text-slate-800 text-base">รออนุมัติ</span>
          </div>
          <div className="text-3xl font-extrabold text-slate-900">
            {stats.pending} <span className="text-xl font-bold">คน</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-3 h-3 rounded-full bg-[#22C55E]"></span>
            <span className="font-bold text-slate-800 text-base">อนุมัติแล้ว</span>
          </div>
          <div className="text-3xl font-extrabold text-slate-900">
            {stats.approved} <span className="text-xl font-bold">คน</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-3 h-3 rounded-full bg-[#EF4444]"></span>
            <span className="font-bold text-slate-800 text-base">ไม่อนุมัติ</span>
          </div>
          <div className="text-3xl font-extrabold text-slate-900">
            {stats.rejected} <span className="text-xl font-bold">คน</span>
          </div>
        </div>
      </div>

      {/* กล่องแจ้งเตือน Error */}
      {error && (
        <div className="mb-4 p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 flex items-center justify-between text-xs">
          <span>เกิดข้อผิดพลาด: {error}</span>
          <button onClick={fetchLeaves} className="underline hover:text-red-800 font-semibold">
            ลองใหม่
          </button>
        </div>
      )}

      {/* ตัวกรองและค้นหา */}
      <div className="flex flex-col md:flex-row items-end justify-between gap-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full md:w-3/4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">รอบเงินเดือน</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className={selectClass}
            >
              <option value="2026-10">ตุลาคม 2569</option>
              <option value="2026-09">กันยายน 2569</option>
              <option value="2026-08">สิงหาคม 2569</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">แผนก</label>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className={selectClass}
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

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">ประเภทการลา</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className={selectClass}
            >
              <option value="ทั้งหมด">ทั้งหมด</option>
              <option value="ลาป่วย">ลาป่วย</option>
              <option value="ลากิจ">ลากิจ</option>
              <option value="ลาพักร้อน">ลาพักร้อน</option>
              <option value="อื่น ๆ">อื่น ๆ</option>
            </select>
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
                <th className="py-3.5 px-4 text-center">ประเภทการลา</th>
                <th className="py-3.5 px-4 text-center">วันที่เริ่มลา - สิ้นสุด</th>
                <th className="py-3.5 px-4 text-center">จำนวนวันที่ลา</th>
                <th className="py-3.5 px-4">เหตุผล / หลักฐาน</th>
                <th className="py-3.5 px-4 text-center">สถานะ</th>
                <th className="py-3.5 px-4 text-center">จัดการ</th>
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
                    <td className="py-3 px-4 text-center text-slate-700">{item.leave_type}</td>
                    <td className="py-3 px-4 text-center text-slate-700 whitespace-nowrap">{item.date_range}</td>
                    <td className="py-3 px-4 text-center text-slate-700 font-medium whitespace-nowrap">
                      {formatDays(item.days)} วัน
                    </td>
                    <td className="py-3 px-4 text-slate-600">{item.reason}</td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <span className={`inline-block px-2.5 py-0.5 rounded-md text-[11px] font-semibold ${getStatusBadge(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => openModal(item)}
                        className="bg-[#5B6EF5] hover:bg-[#4A5CE0] text-white text-[11px] font-semibold px-3 py-1.5 rounded-md transition-colors"
                      >
                        {item.status === 'รออนุมัติ' ? (
                          <>
                            ดูรายละเอียด
                            <br />
                            /อนุมัติ
                          </>
                        ) : (
                          'ดูรายละเอียด'
                        )}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ป๊อปอัปจัดการคำขอลา */}
      {activeLeave && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={closeModal}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="leave-modal-title"
            className="bg-white rounded-2xl shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="leave-modal-title" className="text-xl font-bold text-slate-900">
              จัดการคำขอลา
            </h2>
            <div className="flex items-center gap-2 mt-1 mb-5 text-sm text-slate-700">
              <span>สถานะ : {activeLeave.status}</span>
              <span className={`w-3 h-3 rounded-full ${getStatusDot(activeLeave.status)}`}></span>
            </div>

            {/* ข้อมูลพนักงาน + สิทธิ์การลา */}
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 mb-4">
              <div className="sm:col-span-3 border border-slate-300 rounded-xl p-4">
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <div className="font-bold text-slate-800 mb-1">รหัสพนักงาน</div>
                    <div className="text-slate-700">{activeLeave.employee_code}</div>
                  </div>
                  <div>
                    <div className="font-bold text-slate-800 mb-1">ชื่อ-นามสกุล</div>
                    <div className="text-slate-700">{activeLeave.name}</div>
                  </div>
                  <div>
                    <div className="font-bold text-slate-800 mb-1">แผนก</div>
                    <div className="text-slate-700">{activeLeave.department}</div>
                  </div>
                </div>
              </div>

              <div className="sm:col-span-2 bg-[#DDE8E8] rounded-xl p-4 text-xs">
                <div className="font-bold text-slate-800 mb-1">
                  สิทธิ์การ{activeLeave.leave_type}คงเหลือ
                </div>
                {balance && (
                  <div className="text-slate-700">
                    ใช้ไปแล้ว {formatDays(balance.used)} วัน
                    {balance.remaining != null && (
                      <> คงเหลือ {formatDays(balance.remaining)} วัน</>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* รายละเอียดการลา */}
            <div className="border border-slate-300 rounded-xl p-4 mb-4 text-xs">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <div className="font-bold text-slate-800 mb-1">ประเภทการลา</div>
                  <div className="text-slate-700">{activeLeave.leave_type}</div>
                </div>
                <div>
                  <div className="font-bold text-slate-800 mb-1">วันที่ลา</div>
                  <div className="text-slate-700">
                    {activeLeave.date_range} ({formatDays(activeLeave.days)} วัน)
                  </div>
                </div>
              </div>
              <div>
                <div className="font-bold text-slate-800 mb-1">เหตุผลการลา</div>
                <div className="text-slate-700">{activeLeave.reason}</div>
              </div>
            </div>

            {/* หมายเหตุ */}
            <div className="mb-5">
              <label htmlFor="leave-note" className="block text-xs font-bold text-slate-800 mb-1.5">
                เหตุผล / เหตุผลเพิ่มเติม ( ถ้ามี )
              </label>
              <textarea
                id="leave-note"
                rows={4}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                disabled={!isPending || saving}
                placeholder="ใส่หมายเหตุหรือเหตุผลการปฏิเสธ..."
                className="w-full border border-slate-300 rounded-xl p-3 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-500 resize-none"
              />
            </div>

            {modalError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs">
                {modalError}
              </div>
            )}

            {/* ปุ่ม */}
            <div className="flex flex-wrap justify-end gap-3">
              {isPending && (
                <>
                  <button
                    type="button"
                    onClick={() => submitDecision('APPROVED')}
                    disabled={saving}
                    className="bg-[#16A34A] hover:bg-[#15803D] disabled:opacity-60 text-white text-xs font-semibold px-5 py-2 rounded-md transition-colors"
                  >
                    {saving ? 'กำลังบันทึก...' : 'อนุมัติการลา'}
                  </button>
                  <button
                    type="button"
                    onClick={() => submitDecision('REJECTED')}
                    disabled={saving}
                    className="bg-[#DC2626] hover:bg-[#B91C1C] disabled:opacity-60 text-white text-xs font-semibold px-5 py-2 rounded-md transition-colors"
                  >
                    ปฏิเสธ / ไม่อนุมัติ
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold px-5 py-2 rounded-md transition-colors"
              >
                {isPending ? 'ยกเลิก' : 'ปิด'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
