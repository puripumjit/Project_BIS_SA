import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { API_URL } from '../config';

const THAI_MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
];

const periodLabel = (p) => {
  const [y, m] = String(p).split('-');
  return `${THAI_MONTHS[Number(m) - 1] || m} ${Number(y) + 543}`;
};

const fmt = (n) =>
  Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// วันที่จ่ายเงิน = วันสิ้นเดือนของงวด
const payDateLabel = (period) => {
  const [y, m] = String(period).split('-').map(Number);
  if (!y || !m) return '';
  const d = new Date(y, m, 0);
  return `${d.getDate()} ${THAI_MONTHS[d.getMonth()]} ${d.getFullYear() + 543}`;
};

// สไตล์ตอนพิมพ์/บันทึกเป็น PDF: แสดงเฉพาะสลิป ซ่อนเมนู/ปุ่มอื่นทั้งหมด
const PRINT_CSS = `
@media print {
  @page { size: A4; margin: 12mm; }
  body * { visibility: hidden !important; }
  #payroll-slip, #payroll-slip * { visibility: visible !important; }
  #payroll-slip {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
  }
  html, body { background: #fff !important; }
  #payroll-slip * {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
}
`;

const Info = ({ label, value }) => (
  <div className="flex gap-3 text-sm py-1">
    <span className="w-28 shrink-0 text-slate-500">{label}</span>
    <span className="font-medium text-slate-800">{value || '-'}</span>
  </div>
);

const SlipTable = ({ rows, totalLabel, total, tone }) => {
  const isGreen = tone === 'green';
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-slate-100 text-slate-700">
          <tr>
            <th className="py-2 px-3 text-left">รายการ</th>
            <th className="py-2 px-3 text-center">จำนวน</th>
            <th className="py-2 px-3 text-right">จำนวนเงิน (บาท)</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((r, i) => (
            <tr key={i}>
              <td className="py-2.5 px-3">
                {r.label}
                {r.note && <div className="text-xs text-slate-400">{r.note}</div>}
              </td>
              <td className="py-2.5 px-3 text-center text-slate-600">{r.qty ?? '-'}</td>
              <td className="py-2.5 px-3 text-right">{fmt(r.amount)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div
        className={`flex justify-between px-4 py-3 font-bold ${
          isGreen ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
        }`}
      >
        <span>{totalLabel}</span>
        <span>{fmt(total)}</span>
      </div>
    </div>
  );
};

export default function PayrollSlip() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [slip, setSlip] = useState(null);
  const [emp, setEmp] = useState(null); // ข้อมูลพนักงานจาก /employees (ธนาคาร/เลขบัญชี)
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setEmp(null);
    fetch(`${API_URL}/payroll/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error(`โหลดข้อมูลไม่สำเร็จ (รหัสสถานะ: ${res.status})`);
        return res.json();
      })
      .then((d) => {
        setSlip(d);
        setLoading(false);
        // ดึงข้อมูลธนาคารจาก /employees (ถ้าพังก็แค่ไม่แสดงธนาคาร)
        return fetch(`${API_URL}/employees`)
          .then((r) => (r.ok ? r.json() : []))
          .then((list) => {
            const found = (Array.isArray(list) ? list : []).find((e) => e.id === d.employee_id);
            setEmp(found || null);
          })
          .catch(() => setEmp(null));
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [id]);

  // ส่งออกเป็น PDF: เปิดหน้าต่างพิมพ์ แล้วเลือก "บันทึกเป็น PDF"
  // ตั้งชื่อเอกสารชั่วคราวเพื่อให้ชื่อไฟล์ PDF ที่บันทึกมีความหมาย
  const handleExportPdf = () => {
    const prevTitle = document.title;
    document.title = `สลิปเงินเดือน_${slip.employee_code || slip.employee_id}_${slip.period}`;
    const restore = () => {
      document.title = prevTitle;
      window.removeEventListener('afterprint', restore);
    };
    window.addEventListener('afterprint', restore);
    window.print();
  };

  if (loading) return <div className="py-10 text-center text-slate-400">กำลังโหลดข้อมูล...</div>;
  if (error)
    return (
      <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">
        เกิดข้อผิดพลาด: {error}
      </div>
    );
  if (!slip) return null;

  const earnings = [
    { label: 'เงินเดือนพื้นฐาน', qty: 1, amount: slip.base_salary },
    {
      label: 'ค่าล่วงเวลา (OT)',
      qty: slip.ot_hours > 0 ? `${slip.ot_hours} ชม.` : '-',
      amount: slip.ot_amount,
    },
  ];
  if (slip.small_panel_qty > 0 || slip.large_panel_qty > 0) {
    earnings.push({
      label: 'ค่าตู้ (ฟรีแลนซ์)',
      qty: slip.small_panel_qty + slip.large_panel_qty,
      note: `เล็ก ${slip.small_panel_qty} × ${slip.small_panel_rate} / ใหญ่ ${slip.large_panel_qty} × ${slip.large_panel_rate}`,
      amount: slip.panel_income,
    });
  }
  earnings.push({ label: 'รายได้อื่นๆ', qty: '-', amount: slip.other_income });

  const deductions = [
    { label: 'ประกันสังคม', qty: 1, amount: slip.social_security },
    { label: 'ภาษีเงินได้', qty: 1, amount: slip.tax_amount },
    { label: 'หักลา/สาย/ขาดงาน', qty: '-', amount: slip.late_absence_deduction },
    { label: 'หักอื่น ๆ', qty: '-', amount: slip.other_deduction },
    ...(slip.deductions || []).map((d) => ({
      label: d.deduction_type,
      note: d.note,
      qty: '-',
      amount: d.amount,
    })),
  ];

  const fullName = `${slip.prefix || ''}${slip.first_name} ${slip.last_name}`;

  return (
    <div className="w-full max-w-4xl mx-auto text-slate-800">
      <style>{PRINT_CSS}</style>

      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="px-4 py-2 text-sm rounded-lg border border-slate-300 bg-white hover:bg-slate-50"
        >
          ← กลับ
        </button>

        <button
          type="button"
          onClick={handleExportPdf}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-[#3B82F6] hover:bg-blue-600 text-white shadow-sm transition-all active:scale-95"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v11m0 0l-4-4m4 4l4-4M4 20h16" />
          </svg>
          ส่งออก PDF
        </button>
      </div>

      <div id="payroll-slip" className="space-y-4">
        {/* หัวสลิป */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-[#000000]">สลิปเงินเดือน</h1>
            <div className="text-slate-400 tracking-widest">PAYROLL SLIP</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-500">รอบการจ่ายเงินเดือน</div>
            <div className="text-2xl font-bold text-[#1E3A8A]">{periodLabel(slip.period)}</div>
            <div className="text-xs text-slate-500 mt-1">
              วันที่จ่ายเงิน : {payDateLabel(slip.period) || '-'}
            </div>
          </div>
        </div>

        {/* ข้อมูลพนักงาน */}
        <div className="bg-blue-50/60 rounded-2xl border border-blue-100 p-5 flex flex-col md:flex-row gap-6">
          <div className="w-20 h-20 shrink-0 rounded-full bg-blue-200 text-[#1E3A8A] text-3xl font-bold flex items-center justify-center self-center">
            {(slip.first_name || '?').charAt(0)}
          </div>
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-x-8">
            <div>
              <Info label="รหัสพนักงาน" value={slip.employee_code} />
              <Info label="ชื่อ - นามสกุล" value={fullName} />
              <Info label="ตำแหน่ง" value={slip.position} />
              <Info label="แผนก" value={slip.department} />
            </div>
            <div>
              <Info label="ประเภทพนักงาน" value={slip.employment_type} />
              <Info label="เลขที่บัญชี" value={emp?.bank_account_no} />
              <Info label="ธนาคาร" value={emp?.bank_name} />
            </div>
          </div>
        </div>

        {/* รายรับ / รายการหัก */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-green-200 bg-green-50/40 p-4">
            <h2 className="font-bold text-green-700 mb-3">
              รายการรับ <span className="text-xs font-normal">(Earnings)</span>
            </h2>
            <SlipTable rows={earnings} totalLabel="รวมรายได้ทั้งหมด" total={slip.gross_income} tone="green" />
          </div>
          <div className="rounded-2xl border border-red-200 bg-red-50/40 p-4">
            <h2 className="font-bold text-red-600 mb-3">
              รายการหัก <span className="text-xs font-normal">(Deductions)</span>
            </h2>
            <SlipTable rows={deductions} totalLabel="รวมหักทั้งหมด" total={slip.total_deduction} tone="red" />
          </div>
        </div>

        {/* เงินเดือนสุทธิ */}
        <div className="bg-blue-50 rounded-2xl border border-blue-100 px-6 py-5 flex justify-between items-center">
          <div>
            <div className="text-xl font-bold text-[#1E3A8A]">เงินเดือนสุทธิ</div>
            <div className="text-xs text-slate-500 tracking-widest">NET SALARY</div>
          </div>
          <div className="text-3xl font-bold text-[#1E3A8A]">
            {fmt(slip.net_pay)} <span className="text-xl">บาท</span>
          </div>
        </div>
      </div>
    </div>
  );
}
