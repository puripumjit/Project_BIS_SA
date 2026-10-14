import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../config';

const fmt = (n) => Number(n || 0).toLocaleString('th-TH');

const THAI_MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
];

// '2026-10' -> 'ตุลาคม 2569'
const formatPeriod = (p) => {
  const m = /^(\d{4})-(\d{2})$/.exec(p || '');
  return m ? `${THAI_MONTHS[Number(m[2]) - 1]} ${Number(m[1]) + 543}` : '-';
};

const STATUS = {
  pending: { text: 'รออนุมัติ', cls: 'pd-badge-wait' },
  paid: { text: 'จ่ายแล้ว', cls: 'pd-badge-paid' },
};

const QUICK_MENU = [
  { icon: '👤', label: 'เพิ่มพนักงาน', path: '/employees/new', bg: '#eaf1ff' },
  { icon: '🗓️', label: 'บันทึกเวลา / OT', path: '/attendance', bg: '#e6f8f1' },
  { icon: '📅', label: 'จัดการลา', path: '/leaves', bg: '#f0ecff' },
  { icon: '🧮', label: 'คำนวณเงินเดือน', path: '/payroll/calculate', bg: '#fff1e6' },
  { icon: '📄', label: 'สร้างสลิปเงินเดือน', path: '/payslips', bg: '#e4f8fb' },
  { icon: '📊', label: 'ดูรายงาน', path: '/reports', bg: '#ffecf0' },
];

/* ---------- กราฟแท่ง (SVG ไม่ต้องใช้ library) ---------- */
function BarChart({ data }) {
  const W = 620, H = 230, L = 62, B = 30, T = 10;
  const rawMax = Math.max(1, ...data.flatMap((d) => [d.income, d.deduction]));
  const mag = Math.pow(10, Math.floor(Math.log10(rawMax / 4)));
  const step = Math.ceil(rawMax / 4 / mag) * mag;
  const max = step * 4;
  const ticks = [0, 1, 2, 3, 4].map((i) => i * step);
  const y = (v) => T + (H - T - B) * (1 - v / max);
  const slot = (W - L) / Math.max(data.length, 1);
  const bw = Math.min(26, slot / 4);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="pd-chart">
      {ticks.map((t) => (
        <g key={t}>
          <line x1={L} x2={W} y1={y(t)} y2={y(t)} stroke="#eef0f4" />
          <text x={L - 8} y={y(t) + 4} textAnchor="end" fontSize="11" fill="#6b7280">
            {fmt(t)}
          </text>
        </g>
      ))}
      {data.map((d, i) => {
        const cx = L + slot * i + slot / 2;
        return (
          <g key={d.label}>
            <rect x={cx - bw - 2} y={y(d.income)} width={bw} height={y(0) - y(d.income)} rx="3" fill="#3b78e7" />
            <rect x={cx + 2} y={y(d.deduction)} width={bw} height={y(0) - y(d.deduction)} rx="3" fill="#f0527a" />
            <text x={cx} y={H - 8} textAnchor="middle" fontSize="11" fill="#4b5563">
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/* ---------- กราฟโดนัท ---------- */
function Donut({ income, deduction, net }) {
  const total = income + deduction || 1;
  const r = 80, c = 2 * Math.PI * r;
  const incLen = (income / total) * c;
  return (
    <svg viewBox="0 0 200 200" className="pd-donut">
      <circle cx="100" cy="100" r={r} fill="none" stroke="#f0527a" strokeWidth="26" />
      <circle
        cx="100" cy="100" r={r} fill="none" stroke="#3b78e7" strokeWidth="26"
        strokeDasharray={`${incLen} ${c - incLen}`} transform="rotate(-90 100 100)"
      />
      <text x="100" y="92" textAnchor="middle" fontSize="12" fill="#4b5563">รวมทั้งหมด</text>
      <text x="100" y="114" textAnchor="middle" fontSize="19" fontWeight="600" fill="#111827">{fmt(net)}</text>
      <text x="100" y="132" textAnchor="middle" fontSize="12" fill="#4b5563">บาท</text>
    </svg>
  );
}

export default function PayrollDashboard() {
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`${API_URL}/payroll/dashboard`)
      .then(async (res) => {
        if (!res.ok) {
          const msg = (await res.text()).trim();
          throw new Error(msg || `โหลดข้อมูลไม่สำเร็จ (รหัสสถานะ: ${res.status})`);
        }
        return res.json();
      })
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Load Error:', err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="pd-state">กำลังโหลดข้อมูล...</div>;
  if (error) return <div className="pd-state pd-error">เกิดข้อผิดพลาด: {error}</div>;
  if (!data) return null;

  /*
    รูปแบบ JSON ที่คาดหวังจาก GET /payroll/dashboard
    {
      period: "2026-10",
      totalEmployees: 48,
      totalSalary: 1245600,   // สุทธิ = รายได้รวม - รายการหัก
      totalOT: 86400,
      totalPanel: 45000,
      totalIncome: 1325600,
      totalDeduction: 80000,
      chart: [{ label: "OT", income: 86400, deduction: 0 }, ...],
      recent: [{ period: "2026-10", employees: 48, total: 1245600, status: "pending" | "paid" }, ...]
    }
  */
  const todayText = new Date().toLocaleDateString('th-TH', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
  const income = data.totalIncome ?? 0;
  const deduction = data.totalDeduction ?? 0;
  const pct = (v) => (((v / (income + deduction || 1)) * 100) || 0).toFixed(1);

  const stats = [
    { icon: '👥', label: 'จำนวนพนักงานทั้งหมด', value: fmt(data.totalEmployees), unit: 'คน', color: '#1f2a44', bg: '#e3edff', border: '#d6e3fb', link: '/employees' },
    { icon: '💵', label: 'เงินเดือนรวม (เดือนนี้)', value: fmt(data.totalSalary), unit: 'บาท', color: '#0f8a5f', bg: '#d9f4e8', border: '#c8ecdb', tint: '#f1fbf6', link: '/payroll' },
    { icon: '⏱️', label: 'ค่า OT รวม (เดือนนี้)', value: fmt(data.totalOT), unit: 'บาท', color: '#1f2a44', bg: '#ece8ff', border: '#e0daf8', link: '/attendance' },
    { icon: '📦', label: 'ค่าชิ้นงานรวม (เดือนนี้)', value: fmt(data.totalPanel), unit: 'บาท', color: '#f08a00', bg: '#ffecd1', border: '#fbdcae', link: '/payroll' },
  ];

  return (
    <div className="pd-root">
      <style>{css}</style>

      {/* Welcome + วันที่ */}
      <div className="pd-top">
        <div className="pd-welcome">
          <div>
            <h2>สวัสดีค่ะ</h2>
            <p className="pd-lg">ยินดีต้อนรับสู่ระบบบริหารจัดการเงินเดือน</p>
            <p className="pd-sm">จัดการข้อมูลพนักงาน คำนวณเงินเดือน และดูรายงานได้อย่างง่ายดาย</p>
          </div>
        </div>
        <div className="pd-card pd-date">
          <div className="pd-date-icon">📅</div>
          <div>
            <div className="pd-sm">วันนี้</div>
            <div className="pd-date-val">{todayText}</div>
            <div className="pd-sm pd-mt">รอบการจ่ายเงินเดือน : {formatPeriod(data.period)}</div>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="pd-stats">
        {stats.map((s) => (
          <div key={s.label} className="pd-card pd-stat" style={{ borderColor: s.border, background: s.tint }}>
            <div className="pd-stat-icon" style={{ background: s.bg }}>{s.icon}</div>
            <div>
              <div className="pd-sm">{s.label}</div>
              <div className="pd-stat-val" style={{ color: s.color }}>
                {s.value} <span>{s.unit}</span>
              </div>
              <button className="pd-link" style={{ color: s.color === '#1f2a44' ? '#2f6fe0' : s.color }} onClick={() => navigate(s.link)}>
                ดูรายละเอียด →
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="pd-charts">
        <div className="pd-card">
          <div className="pd-card-head">
            <h3>สรุปค่าใช้จ่ายเงินเดือน</h3>
            <div className="pd-legend">
              <span><i style={{ background: '#3b78e7' }} />รายได้</span>
              <span><i style={{ background: '#f0527a' }} />รายการหัก</span>
            </div>
          </div>
          <BarChart data={data.chart || []} />
        </div>

        <div className="pd-card">
          <h3>สัดส่วนรายได้ - รายการหัก</h3>
          <div className="pd-donut-wrap">
            <Donut income={income} deduction={deduction} net={data.totalSalary} />
            <ul className="pd-donut-list">
              <li>
                <span><i style={{ background: '#3b78e7' }} />รายได้รวม</span>
                <b>{fmt(income)} บาท</b>
                <em>({pct(income)}%)</em>
              </li>
              <li>
                <span><i style={{ background: '#f0527a' }} />รายการหักรวม</span>
                <b>{fmt(deduction)} บาท</b>
                <em>({pct(deduction)}%)</em>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Recent + Quick menu */}
      <div className="pd-bottom">
        <div className="pd-card">
          <div className="pd-card-head">
            <h3>รายการจ่ายเงินเดือนล่าสุด</h3>
            <button className="pd-link" onClick={() => navigate('/payroll')}>ดูทั้งหมด →</button>
          </div>
          <div className="pd-table-wrap">
            <table className="pd-table">
              <thead>
                <tr>
                  <th>ลำดับ</th><th>เดือน/ปี</th><th>จำนวนพนักงาน</th>
                  <th>เงินเดือนรวม</th><th>สถานะ</th><th>จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {(data.recent || []).length === 0 && (
                  <tr><td colSpan="6" className="pd-empty">ยังไม่มีรายการจ่ายเงินเดือน</td></tr>
                )}
                {(data.recent || []).map((r, i) => {
                  const st = STATUS[r.status] || { text: r.status, cls: '' };
                  return (
                    <tr key={r.period}>
                      <td>{i + 1}</td>
                      <td>{formatPeriod(r.period)}</td>
                      <td>{r.employees}</td>
                      <td>{fmt(r.total)} บาท</td>
                      <td><span className={`pd-badge ${st.cls}`}>{st.text}</span></td>
                      <td>
                        <button className="pd-outline" onClick={() => navigate(`/payroll?period=${r.period}`)}>ดูรายละเอียด</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="pd-card">
          <h3>เมนูด่วน</h3>
          <div className="pd-quick">
            {QUICK_MENU.map((m) => (
              <button key={m.label} className="pd-quick-item" style={{ background: m.bg }} onClick={() => navigate(m.path)}>
                <span className="pd-quick-icon">{m.icon}</span>
                {m.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const css = `
.pd-root{--ink:#111827;--muted:#6b7280;--line:#e8ecf3;font-family:'Noto Sans Thai','Sarabun',system-ui,sans-serif;color:var(--ink);padding:24px;background:#f5f7fb;display:flex;flex-direction:column;gap:20px}
.pd-root *{box-sizing:border-box}
.pd-root h2{margin:0 0 6px;font-size:26px}
.pd-root h3{margin:0 0 14px;font-size:17px}
.pd-card{background:#fff;border:1px solid var(--line);border-radius:12px;padding:20px}
.pd-sm{font-size:13px;color:var(--muted)}
.pd-lg{font-size:19px;margin:0 0 8px;color:#374151}
.pd-mt{margin-top:10px}
.pd-state{padding:48px;text-align:center;color:var(--muted)}
.pd-error{color:#d92d4f}

.pd-top{display:grid;grid-template-columns:1fr 372px;gap:20px}
.pd-welcome{background:linear-gradient(90deg,#eaf1ff,#f4f8ff);border:1px solid #dfe8fa;border-radius:12px;padding:24px 28px;display:flex;justify-content:space-between;align-items:center}
.pd-welcome img{height:130px}
.pd-date{display:flex;gap:16px;align-items:flex-start}
.pd-date-icon{width:42px;height:42px;border-radius:10px;background:#e3edff;display:grid;place-items:center;font-size:20px}
.pd-date-val{font-size:20px;font-weight:600;margin-top:4px}

.pd-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:20px}
.pd-stat{display:flex;gap:16px;align-items:center}
.pd-stat-icon{width:62px;height:62px;border-radius:14px;display:grid;place-items:center;font-size:28px;flex-shrink:0}
.pd-stat-val{font-size:30px;font-weight:700;line-height:1.3}
.pd-stat-val span{font-size:16px;font-weight:600}

.pd-link{background:none;border:0;padding:0;cursor:pointer;font:inherit;font-size:13px;color:#2f6fe0}
.pd-link:hover{text-decoration:underline}

.pd-charts{display:grid;grid-template-columns:1.55fr 1fr;gap:20px}
.pd-card-head{display:flex;justify-content:space-between;align-items:center}
.pd-legend{display:flex;gap:16px;font-size:12px;color:#4b5563}
.pd-legend i,.pd-donut-list i{display:inline-block;width:9px;height:9px;border-radius:50%;margin-right:6px}
.pd-chart{width:100%;height:auto}
.pd-donut-wrap{display:flex;align-items:center;gap:24px;flex-wrap:wrap}
.pd-donut{width:200px;height:200px;flex-shrink:0}
.pd-donut-list{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:22px;flex:1;min-width:180px}
.pd-donut-list li{display:grid;grid-template-columns:1fr auto;font-size:13px;row-gap:4px}
.pd-donut-list em{font-style:normal;color:var(--muted);text-align:right}
.pd-donut-list b{font-weight:500}

.pd-bottom{display:grid;grid-template-columns:1.9fr 1fr;gap:20px}
.pd-table-wrap{overflow-x:auto;border:1px solid var(--line);border-radius:8px}
.pd-table{width:100%;border-collapse:collapse;font-size:13px;white-space:nowrap}
.pd-table th{background:#f7f9fc;text-align:left;font-weight:500;color:#374151}
.pd-table th,.pd-table td{padding:10px 14px;border-bottom:1px solid var(--line)}
.pd-table tr:last-child td{border-bottom:0}
.pd-empty{text-align:center;color:var(--muted)}
.pd-badge{display:inline-block;padding:2px 10px;border-radius:999px;font-size:12px}
.pd-badge-wait{background:#fff0c9;color:#b7791f}
.pd-badge-paid{background:#d9f4e8;color:#0f8a5f}
.pd-outline{background:#fff;border:1px solid #3b78e7;color:#2f6fe0;border-radius:6px;padding:3px 14px;font:inherit;font-size:12px;cursor:pointer}
.pd-outline:hover{background:#eaf1ff}

.pd-quick{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
.pd-quick-item{border:0;border-radius:10px;padding:16px 6px;font:inherit;font-size:12px;color:var(--ink);cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:10px}
.pd-quick-item:hover{filter:brightness(.97)}
.pd-quick-icon{width:42px;height:42px;border-radius:10px;background:#fff;display:grid;place-items:center;font-size:21px}

@media (max-width:1200px){.pd-stats{grid-template-columns:repeat(2,1fr)}.pd-charts,.pd-bottom,.pd-top{grid-template-columns:1fr}}
@media (max-width:600px){.pd-root{padding:12px}.pd-stats{grid-template-columns:1fr}.pd-welcome img{display:none}}
`;
