import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { API_URL } from '../config';

const LIST_PATH = '/employees/freelance';

function TrashIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 002 2h6a2 2 0 002-2l1-12M9 7V4h6v3" />
    </svg>
  );
}

// ยอดรวม = จำนวนตู้เล็ก × อัตรา + จำนวนตู้ใหญ่ × อัตรา
const calcTotal = (e) =>
  (Number(e.small_qty) || 0) * (Number(e.small_rate) || 800) +
  (Number(e.large_qty) || 0) * (Number(e.large_rate) || 1000);

// สถานะที่แสดงในตาราง: ยกเลิกงาน > จ่ายแล้ว > รอจ่าย
const getPayBadge = (e) => {
  if (e.status === 'CANCELLED') {
    return { label: 'ยกเลิก', cls: 'bg-red-100 text-red-600 border-red-300' };
  }
  if (e.payment_status === 'PAID') {
    return { label: 'จ่ายแล้ว', cls: 'bg-green-100 text-green-700 border-green-300' };
  }
  return { label: 'รอจ่าย', cls: 'bg-yellow-100 text-yellow-700 border-yellow-300' };
};

const showQty = (n) => (Number(n) > 0 ? n : '-');

export default function FreelanceDelete() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [freelancers, setFreelancers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selected, setSelected] = useState(new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  const fetchFreelancers = () => {
    setLoading(true);
    setError(null);
    return fetch(`${API_URL}/employees`)
      .then((res) => {
        if (!res.ok) throw new Error(`เชื่อมต่อไม่สำเร็จ (รหัสสถานะ: ${res.status})`);
        return res.json();
      })
      .then((data) => {
        const list = (Array.isArray(data) ? data : []).filter((e) => e.employment_type === 'ฟรีแลนซ์');
        setFreelancers(list);
        setLoading(false);
        return list;
      })
      .catch((err) => {
        console.error('Fetch Error:', err);
        setError(err.message);
        setLoading(false);
        return [];
      });
  };

  useEffect(() => {
    fetchFreelancers().then((list) => {
      // ติ๊กเลือกรายการที่กดปุ่มลบมาจากหน้ารายการ (?select=ID)
      const pre = searchParams.get('select');
      if (pre && list.some((e) => String(e.id) === pre)) {
        setSelected(new Set([Number(pre)]));
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggle = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const allChecked = freelancers.length > 0 && selected.size === freelancers.length;
  const toggleAll = () => {
    setSelected(allChecked ? new Set() : new Set(freelancers.map((e) => e.id)));
  };

  // ปุ่มลบรายแถว: เลือกเฉพาะรายการนั้นแล้วเปิดหน้าต่างยืนยันทันที
  const deleteOne = (id) => {
    setSelected(new Set([id]));
    setDeleteError(null);
    setConfirmOpen(true);
  };

  const closeConfirm = () => {
    if (deleting) return;
    setConfirmOpen(false);
    setDeleteError(null);
  };

  const confirmDelete = async () => {
    setDeleting(true);
    setDeleteError(null);

    const ids = Array.from(selected);
    const results = await Promise.all(
      ids.map(async (id) => {
        try {
          const res = await fetch(`${API_URL}/employees/${id}`, { method: 'DELETE' });
          if (!res.ok) {
            const msg = (await res.text()).trim();
            return { id, ok: false, msg: msg || `รหัสสถานะ ${res.status}` };
          }
          return { id, ok: true };
        } catch (err) {
          return { id, ok: false, msg: err.message };
        }
      })
    );

    const failed = results.filter((r) => !r.ok);
    setDeleting(false);

    if (failed.length === 0) {
      navigate(LIST_PATH);
      return;
    }

    // ลบสำเร็จบางรายการ: โหลดรายการใหม่ แล้วคงการเลือกไว้เฉพาะรายการที่ลบไม่สำเร็จ
    const codeById = {};
    freelancers.forEach((e) => {
      codeById[e.id] = e.employee_code;
    });
    setDeleteError(failed.map((f) => `${codeById[f.id] || f.id}: ${f.msg}`).join('\n'));
    setSelected(new Set(failed.map((f) => f.id)));
    fetchFreelancers();
  };

  const selectedCount = selected.size;

  return (
    <div className="w-full text-slate-800 pb-28">
      <div className="flex items-center gap-3 mb-6">
        <div className="text-[#1E3A8A]">
          <TrashIcon className="w-9 h-9" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 leading-tight">ลบข้อมูลฟรีแลนซ์</h1>
          <p className="text-xs text-slate-600">กรุณาตรวจสอบข้อมูลก่อนทำการลบ</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center justify-between">
          <span>เกิดข้อผิดพลาด: {error}</span>
          <button onClick={fetchFreelancers} className="underline font-semibold hover:text-red-900">
            ลองใหม่
          </button>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-[#E5E7EB] text-slate-800 font-bold">
              <tr>
                <th rowSpan="2" className="py-3 px-4 w-10 align-middle">
                  <input
                    type="checkbox"
                    aria-label="เลือกทั้งหมด"
                    checked={allChecked}
                    onChange={toggleAll}
                    className="w-4 h-4 accent-[#DC2626] cursor-pointer"
                  />
                </th>
                <th rowSpan="2" className="py-3 px-4 align-middle">รหัสฟรีแลนซ์</th>
                <th rowSpan="2" className="py-3 px-4 align-middle">ชื่อ-นามสกุล</th>
                <th rowSpan="2" className="py-3 px-4 text-center align-middle">เบอร์โทรศัพท์</th>
                <th colSpan="2" className="pt-3 pb-1 px-4 text-center">อัตราตามชิ้นงาน/รอบ</th>
                <th rowSpan="2" className="py-3 px-4 text-center align-middle">ยอดรวม(บาท)</th>
                <th rowSpan="2" className="py-3 px-4 text-center align-middle">สถานะ</th>
                <th rowSpan="2" className="py-3 px-4 text-center align-middle">จัดการ</th>
              </tr>
              <tr className="border-b border-slate-300">
                <th className="pb-3 px-4 text-center">ตู้เล็ก</th>
                <th className="pb-3 px-4 text-center">ตู้ใหญ่</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="9" className="py-8 text-center text-slate-400">กำลังโหลดข้อมูล...</td>
                </tr>
              ) : freelancers.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-8 text-center text-slate-400">ไม่พบข้อมูลฟรีแลนซ์ในระบบ</td>
                </tr>
              ) : (
                freelancers.map((item) => {
                  const fullName = [item.prefix, item.first_name, item.last_name].filter(Boolean).join('') || '-';
                  const checked = selected.has(item.id);
                  const badge = getPayBadge(item);
                  return (
                    <tr
                      key={item.id}
                      className={`transition-colors ${checked ? 'bg-red-50/60' : 'hover:bg-slate-50/70'}`}
                    >
                      <td className="py-3 px-4">
                        <input
                          type="checkbox"
                          aria-label={`เลือก ${item.employee_code}`}
                          checked={checked}
                          onChange={() => toggle(item.id)}
                          className="w-4 h-4 accent-[#DC2626] cursor-pointer"
                        />
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-900">{item.employee_code}</td>
                      <td className="py-3 px-4 font-medium text-slate-800 whitespace-nowrap">{fullName}</td>
                      <td className="py-3 px-4 text-center text-slate-600 whitespace-nowrap">{item.phone || '-'}</td>
                      <td className="py-3 px-4 text-center text-slate-700">{showQty(item.small_qty)}</td>
                      <td className="py-3 px-4 text-center text-slate-700">{showQty(item.large_qty)}</td>
                      <td className="py-3 px-4 text-center font-medium text-slate-700">
                        {calcTotal(item).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-md border text-[11px] font-semibold ${badge.cls}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => deleteOne(item.id)}
                          className="inline-flex items-center gap-1 bg-[#DC2626] hover:bg-red-700 text-white px-3 py-1 rounded-md text-[11px] font-medium shadow-sm transition-colors"
                        >
                          <TrashIcon className="w-3 h-3" />
                          ลบ
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* แถบยืนยันด้านล่าง (แสดงเมื่อมีรายการที่เลือก) */}
      {selectedCount > 0 && !confirmOpen && (
        <div className="sticky bottom-0 mt-6 flex justify-end">
          <div className="w-full max-w-2xl bg-red-100 border border-red-400 rounded-xl px-5 py-4 flex items-center justify-between gap-4 shadow-md">
            <div className="flex items-center gap-3 text-red-600">
              <TrashIcon className="w-6 h-6 shrink-0" />
              <div>
                <div className="text-sm font-bold">
                  ยืนยันการลบข้อมูลฟรีแลนซ์ ({selectedCount} คน)
                </div>
                <div className="text-[11px]">เมื่อทำการลบแล้ว จะไม่สามารถกู้คืนข้อมูลได้</div>
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                type="button"
                onClick={() => navigate(LIST_PATH)}
                className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 text-xs font-semibold px-4 py-2 rounded-md shadow-sm"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={() => {
                  setDeleteError(null);
                  setConfirmOpen(true);
                }}
                className="bg-[#B91C1C] hover:bg-[#991B1B] text-white text-xs font-semibold px-4 py-2 rounded-md shadow-sm"
              >
                ลบข้อมูล
              </button>
            </div>
          </div>
        </div>
      )}

      {/* หน้าต่างยืนยันการลบ */}
      {confirmOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={closeConfirm}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-modal-title"
            className="bg-red-100 border border-red-500 rounded-xl shadow-xl w-full max-w-sm p-6 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-center text-red-600 mb-3">
              <TrashIcon className="w-12 h-12" />
            </div>
            <h2 id="delete-modal-title" className="text-sm font-bold text-red-700">
              ยืนยันการลบข้อมูลฟรีแลนซ์หรือไม่ ?
            </h2>
            <p className="text-xs text-red-700 mt-1">
              จะลบ {selectedCount} คน และไม่สามารถกู้คืนได้
            </p>

            {deleteError && (
              <div className="mt-3 p-2.5 rounded-lg bg-white border border-red-300 text-red-600 text-[11px] text-left whitespace-pre-line">
                ลบไม่สำเร็จ:{'\n'}
                {deleteError}
              </div>
            )}

            <div className="flex justify-center gap-3 mt-5">
              <button
                type="button"
                onClick={closeConfirm}
                disabled={deleting}
                className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 text-xs font-semibold px-5 py-2 rounded-md shadow-sm"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={deleting}
                className="bg-[#B91C1C] hover:bg-[#991B1B] disabled:opacity-60 text-white text-xs font-semibold px-5 py-2 rounded-md shadow-sm"
              >
                {deleting ? 'กำลังลบ...' : 'ลบข้อมูล'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
