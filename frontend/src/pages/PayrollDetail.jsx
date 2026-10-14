import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { API_URL } from '../config';

const LIST_PATH = '/payroll/calculate';

const TABS = [
  { key: 'summary', label: 'สรุปยอด' },
  { key: 'income', label: 'รายได้' },
  { key: 'deductions', label: 'รายการหัก' },
  { key: 'tax', label: 'ภาษี' },
  { key: 'social', label: 'ประกันสังคม' },
  { key: 'notes', label: 'หมายเหตุ' },
];

const DEDUCTION_LABELS = {
  LOAN: 'เงินกู้',
  PROVIDENT_FUND: 'กองทุนสำรองเลี้ยงชีพ',
  UNIFORM: 'ค่าชุดทำงาน',
  DAMAGE: 'ค่าเสียหายอุปกรณ์',
  OTHER: 'อื่น ๆ',
};

const STATUS_BADGE = {
  DRAFT: { label: 'คำนวณแล้ว', cls: 'bg-green-100 text-green-700 border-green-300' },
  APPROVED: { label: 'อนุมัติแล้ว', cls: 'bg-blue-100 text-blue-700 border-blue-300' },
  PAID: { label: 'จ่ายแล้ว', cls: 'bg-slate-100 text-slate-600 border-slate-300' },
};

const THAI_MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
];

const periodLabel = (p) => {
  const [y, m] = String(p).split('-');
  return `${THAI_MONTHS[Number(m) - 1] || m} ${Number(y) + 543}`;
};

const fmt = (n) =>
  Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

const fmtDateTime = (iso) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' });
};

function Row({ label, value, hint }) {
  return (
    <div className="flex items-center justify-between py-2 text-sm border-b border-slate-100 last:border-0">
      <span className="text-slate-600">
        {label}
        {hint && <span className="text-xs text-slate-400 ml-2">{hint}</span>}
      </span>
      <span className="font-medium text-slate-800">{fmt(value)}</span>
    </div>
  );
}

function TotalRow({ label, value, tone }) {
  const cls = tone === 'red' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700';
  return (
    <div className={`flex items-center justify-between px-4 py-3 rounded-lg mt-3 text-sm font-bold ${cls}`}>
      <span>{label}</span>
      <span>{fmt(value)}</span>
    </div>
  );
}

function Panel({ title, tone, children }) {
  const head = tone === 'red' ? 'text-red-600' : 'text-green-700';
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <h3 className={`text-sm font-bold mb-2 ${head}`}>{title}</h3>
      {children}
    </div>
  );
}

export default function PayrollDetail() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState('summary');

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`${API_URL}/payroll/${id}`)
      .then(async (res) => {
        if (!res.ok) {
          const msg = (await res.text()).trim();
          throw new Error(msg || `โหลดข้อมูลไม่สำเร็จ (รหัสสถานะ: ${res.status})`);
        }
        return res.json();
      })
      .then((d) => {
        setItem(d);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Load Error:', err);
        setError(err.message);
        setLoading(false);
      });
  }, [id]);

  // ปุ่มบันทึก: ยืนยันรายการเงินเดือน (DRAFT -> APPROVED)
  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/payroll/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'APPROVED' }),
      });
      if (!res.ok) {
        const msg = (await res.text()).trim();
        throw new Error(msg || `บันทึกไม่สำเร็จ (รหัสสถานะ: ${res.status})`);
      }
      navigate(LIST_PATH);
    } catch (err) {
      console.error('Save Error:', err);
      setError(err.message);
      setSaving(false);
    }
  };

  const goBack = () => navigate(LIST_PATH);

  const header = (
    <div className="flex items-center gap-3 mb-5">
      <button
        type="button"
        onClick={goBack}
        aria-label="กลับ"
        className="w-9 h-9 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700"
      >
        ←
      </button>
      <h1 className="text-xl font-bold text-[#1E3A8A]">รายละเอียดเงินเดือน</h1>
    </div>
  );

  if (loading) {
    return (
      <div className="w-full">
        {header}
        <div className="py-10 text-center text-slate-400 text-sm">กำลังโหลดข้อมูล...</div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="w-full">
        {header}
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
          {error || 'ไม่พบรายการเงินเดือน'}
        </div>
      </div>
    );
  }

  const fullName = `${item.prefix || ''}${item.first_name} ${item.last_name}`;
  const badge = STATUS_BADGE[item.status] || STATUS_BADGE.DRAFT;
  const isFreelance = item.employment_type === 'ฟรีแลนซ์';
  const otherDeductions = item.other_deduction + item.extra_deduction;
  const taxPercent = item.gross_income > 0 ? (item.tax_amount / item.gross_income) * 100 : 0;
  const methodText = isFreelance ? 'คิดตามชิ้นงาน (ตู้เล็ก/ตู้ใหญ่)' : 'เงินเดือนประจำ + OT';

  const incomePanel = (
    <Panel title="รายได้" tone="green">
      <Row label="เงินเดือนพื้นฐาน" value={item.base_salary} />
      <Row label="ค่าล่วงเวลา (OT)" value={item.ot_amount} />
      {item.panel_income > 0 && <Row label="ค่าตู้ (ฟรีแลนซ์)" value={item.panel_income} />}
      <Row label="รายได้อื่น" value={item.other_income} />
      <TotalRow label="รวมรายได้" value={item.gross_income} tone="green" />
    </Panel>
  );

  const deductionPanel = (
    <Panel title="รายการหัก" tone="red">
      <Row label="ภาษี" value={item.tax_amount} />
      <Row label="ประกันสังคม" value={item.social_security} />
      <Row label="ลา/สาย" value={item.late_absence_deduction} />
      <Row label="รายการหักอื่น ๆ" value={otherDeductions} />
      <TotalRow label="รวมรายการหัก" value={item.total_deduction} tone="red" />
    </Panel>
  );

  const tabContent = {
    summary: (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {incomePanel}
          {deductionPanel}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl border border-green-200 bg-green-50/60 p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-green-600 text-white flex items-center justify-center text-xl font-bold">
              ฿
            </div>
            <div>
              <div className="text-xs font-bold text-slate-700">เงินเดือนสุทธิ</div>
              <div className="text-2xl font-bold text-green-700">{fmt(item.net_pay)} บาท</div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-slate-800">บันทึกการคำนวณ</h3>
              <span className={`px-2.5 py-0.5 rounded-md border text-[11px] font-semibold ${badge.cls}`}>
                {badge.label}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 text-sm border-b border-slate-100">
              <span className="text-slate-600">วิธีการคำนวณ</span>
              <span className="font-medium text-slate-800">{methodText}</span>
            </div>
            <div className="flex items-center justify-between py-2 text-sm">
              <span className="text-slate-600">วันที่คำนวณ</span>
              <span className="font-medium text-slate-800">{fmtDateTime(item.created_at)}</span>
            </div>
          </div>
        </div>
      </div>
    ),

    income: (
      <Panel title="รายได้" tone="green">
        <Row label="เงินเดือนพื้นฐาน" value={item.base_salary} />
        <Row label="ค่าล่วงเวลา (OT)" value={item.ot_amount} hint={`${fmt(item.ot_hours)} ชั่วโมง`} />
        {item.small_panel_qty > 0 && (
          <Row
            label="ค่าตู้เล็ก"
            value={item.small_panel_qty * item.small_panel_rate}
            hint={`${item.small_panel_qty} ตู้ × ${fmt(item.small_panel_rate)}`}
          />
        )}
        {item.large_panel_qty > 0 && (
          <Row
            label="ค่าตู้ใหญ่"
            value={item.large_panel_qty * item.large_panel_rate}
            hint={`${item.large_panel_qty} ตู้ × ${fmt(item.large_panel_rate)}`}
          />
        )}
        <Row label="รายได้อื่น" value={item.other_income} />
        <TotalRow label="รวมรายได้" value={item.gross_income} tone="green" />
      </Panel>
    ),

    deductions: (
      <Panel title="รายการหัก" tone="red">
        <Row label="ภาษี" value={item.tax_amount} />
        <Row label="ประกันสังคม" value={item.social_security} />
        <Row label="ลา/สาย" value={item.late_absence_deduction} />
        <Row label="หักอื่น ๆ (ในรายการเงินเดือน)" value={item.other_deduction} />
        {(item.deductions || []).map((d, i) => (
          <Row key={i} label={DEDUCTION_LABELS[d.deduction_type] || d.deduction_type} value={d.amount} />
        ))}
        <TotalRow label="รวมรายการหัก" value={item.total_deduction} tone="red" />
      </Panel>
    ),

    tax: (
      <Panel title="ภาษี" tone="red">
        <Row label="ภาษีที่หัก" value={item.tax_amount} />
        <Row label="รายได้รวม" value={item.gross_income} />
        <div className="text-xs text-slate-500 pt-2">
          คิดเป็น {taxPercent.toLocaleString('en-US', { maximumFractionDigits: 2 })}% ของรายได้รวม
        </div>
      </Panel>
    ),

    social: (
      <Panel title="ประกันสังคม" tone="red">
        <Row label="ประกันสังคมที่หัก" value={item.social_security} />
      </Panel>
    ),

    notes: (
      <Panel title="หมายเหตุ" tone="green">
        {(item.deductions || []).filter((d) => d.note).length === 0 ? (
          <div className="text-sm text-slate-400 py-2">ไม่มีหมายเหตุ</div>
        ) : (
          (item.deductions || [])
            .filter((d) => d.note)
            .map((d, i) => (
              <div key={i} className="py-2 text-sm border-b border-slate-100 last:border-0">
                <span className="font-medium text-slate-800">
                  {DEDUCTION_LABELS[d.deduction_type] || d.deduction_type}:
                </span>{' '}
                <span className="text-slate-600">{d.note}</span>
              </div>
            ))
        )}
      </Panel>
    ),
  };

  return (
    <div className="w-full text-slate-800">
      {header}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 max-w-5xl">
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs">
            {error}
          </div>
        )}

        {/* ข้อมูลพนักงาน */}
        <div className="flex items-center gap-4 pb-4">
          <div className="w-14 h-14 rounded-full bg-blue-100 text-[#1E3A8A] flex items-center justify-center text-lg font-bold shrink-0">
            {item.first_name.slice(0, 1)}
          </div>
          <div className="flex-1">
            <div className="text-xs text-slate-500">
              {item.employee_code} · งวด {periodLabel(item.period)}
            </div>
            <div className="text-lg font-bold text-slate-900 leading-tight">{fullName}</div>
            <div className="text-xs text-slate-600 mt-0.5">
              แผนก: {item.department} · ตำแหน่ง: {item.position} · ประเภท: {item.employment_type}
            </div>
          </div>
        </div>

        {/* แท็บ */}
        <div className="flex flex-wrap gap-1 border-b border-slate-200 mb-5">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`px-4 py-2 text-sm font-semibold -mb-px border-b-2 ${
                tab === t.key
                  ? 'border-[#1E3A8A] text-[#1E3A8A]'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tabContent[tab]}

        <div className="flex justify-end gap-3 mt-8">
          <button
            type="button"
            onClick={goBack}
            disabled={saving}
            className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 text-sm font-semibold px-6 py-2.5 rounded-lg shadow-sm"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || item.status !== 'DRAFT'}
            className="bg-[#1E3A8A] hover:bg-[#1a3277] disabled:opacity-50 text-white text-sm font-semibold px-6 py-2.5 rounded-lg shadow-sm"
          >
            {saving ? 'กำลังบันทึก...' : 'บันทึก'}
          </button>
        </div>
      </div>
    </div>
  );
}
