import React, { useState, useEffect, useMemo } from 'react';
import { CalendarDays, Plane, X, Clock, Users, Search } from 'lucide-react';
import { API_URL } from '../config';

const THAI_MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
];

const monthLabel = (key) => {
  const [y, m] = key.split('-').map(Number);
  return `${THAI_MONTHS[m - 1] || m} ${y + 543}`;
};

const pad = (n) => String(n).padStart(2, '0');

const currentMonthKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
};

const prevMonthKey = (key) => {
  const [y, m] = key.split('-').map(Number);
  const d = new Date(y, m - 2, 1);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
};

// "2026-09-08" -> "08/09/2569"
const toThaiDate = (dateStr) => {
  const [y, m, d] = (dateStr || '').slice(0, 10).split('-').map(Number);
  if (!y || !m || !d) return '-';
  return `${pad(d)}/${pad(m)}/${y + 543}`;
};

const formatDays = (n) => (Number.isInteger(n) ? `${n}` : n.toFixed(1));

// ประเภทรายการ: kind ใช้จัดกลุ่มเป็น ลา / ขาด / สาย
const EVENT_TYPES = {
  SICK: { label: 'ลาป่วย', kind: 'leave', badge: 'bg-rose-50 text-rose-500' },
  PERSONAL: { label: 'ลากิจ', kind: 'leave', badge: 'bg-emerald-50 text-emerald-600' },
  VACATION: { label: 'ลาพักร้อน', kind: 'leave', badge: 'bg-sky-100 text-sky-600' },
  OTHER: { label: 'ลาอื่น ๆ', kind: 'leave', badge: 'bg-slate-100 text-slate-600' },
  LATE: { label: 'สาย', kind: 'late', badge: 'bg-amber-50 text-amber-600' },
  ABSENT: { label: 'ขาดงาน', kind: 'absent', badge: 'bg-violet-50 text-violet-600' },
};

const COLORS = { leave: '#3B82F6', absent: '#F43F5E', late: '#F59E0B' };

const countKind = (list, kind) => list.filter((e) => EVENT_TYPES[e.typeKey].kind === kind).length;

// % เปลี่ยนแปลงเทียบเดือนก่อน (null = เดือนก่อนไม่มีรายการ เทียบเป็น % ไม่ได้)
const pctChange = (cur, prev) => (prev === 0 ? null : Math.round(((cur - prev) / prev) * 100));

const CARD = 'bg-white rounded-2xl border border-slate-200 shadow-sm';

/* ---------- การ์ดสถิติด้านบน ---------- */
function StatCard({ icon, iconBg, iconColor, cardBg = 'bg-white', label, value, unit, cur, prev, upIsGood }) {
  let deltaEl = null;
  if (cur !== undefined) {
    const p = pctChange(cur, prev);
    if (p === null) {
      deltaEl = <span className="text-slate-500">เดือนก่อนไม่มีรายการ</span>;
    } else if (p === 0) {
      deltaEl = <span className="text-slate-500">เท่าเดิม จากเดือนก่อน</span>;
    } else {
      const up = p > 0;
      const good = up === upIsGood;
      deltaEl = (
        <>
          <span className={`font-bold ${good ? 'text-emerald-600' : 'text-red-500'}`}>
            {up ? '↑' : '↓'} {Math.abs(p)}%
          </span>{' '}
          <span className="text-slate-500">จากเดือนก่อน</span>
        </>
      );
    }
  }

  return (
    <div className={`${CARD} ${cardBg} px-5 py-5 flex items-center gap-4`}>
      <div className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 ${iconBg} ${iconColor}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-sm font-semibold text-slate-700">{label}</div>
        <div className="text-3xl font-bold text-[#1E3A8A] leading-tight">{value}</div>
        <div className="text-xs mt-0.5">{deltaEl || <span className="text-slate-500">{unit}</span>}</div>
      </div>
    </div>
  );
}

/* ---------- กราฟโดนัท (ไม่มีข้อความตรงกลาง) ---------- */
function Donut({ segments }) {
  const r = 70;
  const c = 2 * Math.PI * r;
  const total = segments.reduce((s, x) => s + x.value, 0);
  let offset = 0;

  return (
    <svg viewBox="0 0 200 200" className="w-44 h-44 shrink-0 -rotate-90" role="img" aria-label="สัดส่วนการลา ขาดงาน และสาย">
      <circle cx="100" cy="100" r={r} fill="none" stroke="#E2E8F0" strokeWidth="36" />
      {total > 0 &&
        segments.map((s) => {
          const len = (s.value / total) * c;
          const el = (
            <circle
              key={s.key}
              cx="100"
              cy="100"
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth="36"
              strokeDasharray={`${len} ${c - len}`}
              strokeDashoffset={-offset}
            />
          );
          offset += len;
          return el;
        })}
    </svg>
  );
}

const selectCls =
  'w-full bg-white border border-slate-200 text-slate-700 py-2.5 px-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer';

export default function Leaves() {
  const [leaves, setLeaves] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ตัวกรอง: กรองทันทีที่พิมพ์/เลือก (ไม่ต้องกดค้นหา)
  const [filter, setFilter] = useState({ q: '', dept: 'ทั้งหมด', position: 'ทั้งหมด', type: 'ทั้งหมด' });

  const getJson = (path) =>
    fetch(`${API_URL}${path}`).then((res) => {
      if (!res.ok) throw new Error(`เชื่อมต่อ ${path} ไม่สำเร็จ (รหัสสถานะ: ${res.status})`);
      return res.json();
    });

  const load = () => {
    setLoading(true);
    setError(null);
    return Promise.all([getJson('/leaves'), getJson('/attendance'), getJson('/employees')])
      .then(([l, a, e]) => {
        setLeaves(Array.isArray(l) ? l : []);
        setAttendance(Array.isArray(a) ? a : []);
        setEmployees(Array.isArray(e) ? e : []);
      })
      .catch((err) => {
        console.error('Fetch Error:', err);
        setError(err.message);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  // รวม "ลา (อนุมัติแล้ว)" + "สาย" + "ขาดงาน" เป็นรายการเดียวกัน
  const events = useMemo(() => {
    const empById = {};
    employees.forEach((e) => {
      empById[e.id] = e;
    });
    const who = (id) => {
      const e = empById[id] || {};
      return {
        employee_id: id,
        code: e.employee_code || `ID ${id}`,
        name: e.first_name ? `${e.prefix || ''}${e.first_name} ${e.last_name}` : '-',
        department: e.department || '-',
        position: e.position || '-',
      };
    };

    const list = [];
    leaves.forEach((l) => {
      if ((l.status || '').toUpperCase() !== 'APPROVED') return;
      const t = (l.leave_type || '').toUpperCase();
      list.push({
        key: `L${l.id}`,
        ...who(l.employee_id),
        typeKey: EVENT_TYPES[t] ? t : 'OTHER',
        start: (l.start_date || '').slice(0, 10),
        end: (l.end_date || '').slice(0, 10),
        amount: `${formatDays(Number(l.days) || 0)} วัน`,
        note: l.reason || '-',
      });
    });
    attendance.forEach((a) => {
      const s = (a.status || '').toUpperCase();
      if (s !== 'LATE' && s !== 'ABSENT') return;
      const d = (a.work_date || '').slice(0, 10);
      list.push({
        key: `A${a.id}`,
        ...who(a.employee_id),
        typeKey: s,
        start: d,
        end: d,
        amount: s === 'LATE' ? '1 ครั้ง' : '1 วัน',
        note: '-',
      });
    });
    return list;
  }, [leaves, attendance, employees]);

  // เดือนที่แสดง = เดือนล่าสุดที่มีรายการ (ไม่มีรายการเลย = เดือนปัจจุบัน)
  const period = useMemo(() => {
    const latest = events.reduce((m, e) => (e.start > m ? e.start : m), '');
    return latest ? latest.slice(0, 7) : currentMonthKey();
  }, [events]);

  const monthEvents = useMemo(() => events.filter((e) => e.start.slice(0, 7) === period), [events, period]);
  const prevEvents = useMemo(() => {
    const pk = prevMonthKey(period);
    return events.filter((e) => e.start.slice(0, 7) === pk);
  }, [events, period]);

  const cnt = {
    leave: countKind(monthEvents, 'leave'),
    absent: countKind(monthEvents, 'absent'),
    late: countKind(monthEvents, 'late'),
  };
  const prevCnt = {
    leave: countKind(prevEvents, 'leave'),
    absent: countKind(prevEvents, 'absent'),
    late: countKind(prevEvents, 'late'),
  };
  const total = cnt.leave + cnt.absent + cnt.late;
  const share = (n) => (total === 0 ? '0.0' : ((n / total) * 100).toFixed(1));

  // ตัวเลือก dropdown
  const departments = useMemo(
    () => [...new Set(employees.map((e) => e.department).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'th')),
    [employees]
  );
  const positions = useMemo(
    () => [...new Set(employees.map((e) => e.position).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'th')),
    [employees]
  );

  // ตารางรายละเอียด (เฉพาะเดือนที่แสดง + ตัวกรอง)
  const rows = useMemo(() => {
    const kw = filter.q.trim().toLowerCase();
    return monthEvents
      .filter((e) => {
        if (filter.dept !== 'ทั้งหมด' && e.department !== filter.dept) return false;
        if (filter.position !== 'ทั้งหมด' && e.position !== filter.position) return false;
        if (filter.type !== 'ทั้งหมด' && EVENT_TYPES[e.typeKey].label !== filter.type) return false;
        if (kw && !e.code.toLowerCase().includes(kw) && !e.name.toLowerCase().includes(kw)) return false;
        return true;
      })
      .sort((a, b) => (a.start === b.start ? a.code.localeCompare(b.code) : a.start < b.start ? -1 : 1));
  }, [monthEvents, filter]);

  // สถิติรายแผนก (เดือนที่แสดง)
  const deptStats = useMemo(() => {
    const map = {};
    monthEvents.forEach((e) => {
      const k = EVENT_TYPES[e.typeKey].kind;
      map[e.department] = map[e.department] || { leave: 0, absent: 0, late: 0 };
      map[e.department][k] += 1;
    });
    return Object.entries(map)
      .map(([name, v]) => ({ name, ...v, sum: v.leave + v.absent + v.late }))
      .sort((a, b) => b.sum - a.sum || a.name.localeCompare(b.name, 'th'));
  }, [monthEvents]);

  return (
    <div className="w-full text-slate-800 space-y-5">
      {/* หัวข้อ */}
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-blue-50 text-[#1E3A8A] flex items-center justify-center shrink-0">
          <CalendarDays className="w-9 h-9" strokeWidth={1.6} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#00000]">สถิติการลา / ขาด / สาย</h1>
          <p className="text-sm text-slate-500">ดูข้อมูลการลา ขาดงาน และมาสายของพนักงาน พร้อมสรุปสถิติรายบุคคลและรายแผนก</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center justify-between">
          <span>เกิดข้อผิดพลาด: {error}</span>
          <button onClick={load} className="underline font-semibold hover:text-red-900">ลองใหม่</button>
        </div>
      )}

      {/* การ์ดสถิติ 4 ใบ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          icon={<Plane className="w-7 h-7" />}
          iconBg="bg-sky-100"
          iconColor="text-sky-500"
          label="จำนวนการลา (ครั้ง)"
          value={loading ? '-' : cnt.leave}
          cur={loading ? undefined : cnt.leave}
          prev={prevCnt.leave}
          upIsGood
        />
        <StatCard
          icon={<X className="w-7 h-7" strokeWidth={3} />}
          iconBg="bg-rose-100"
          iconColor="text-rose-500"
          cardBg="bg-rose-50/60"
          label="จำนวนการขาดงาน (ครั้ง)"
          value={loading ? '-' : cnt.absent}
          cur={loading ? undefined : cnt.absent}
          prev={prevCnt.absent}
          upIsGood={false}
        />
        <StatCard
          icon={<Clock className="w-7 h-7" />}
          iconBg="bg-amber-100"
          iconColor="text-amber-500"
          cardBg="bg-amber-50/60"
          label="จำนวนการมาสาย (ครั้ง)"
          value={loading ? '-' : cnt.late}
          cur={loading ? undefined : cnt.late}
          prev={prevCnt.late}
          upIsGood={false}
        />
        <StatCard
          icon={<Users className="w-7 h-7" />}
          iconBg="bg-violet-100"
          iconColor="text-violet-500"
          label="จำนวนพนักงานทั้งหมด"
          value={loading ? '-' : employees.length}
          unit="คน"
        />
      </div>

      {/* ตัวกรอง */}
      <div className={`${CARD} p-4 grid grid-cols-1 md:grid-cols-12 gap-3 items-end`}>
        <div className="md:col-span-4">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={filter.q}
              onChange={(e) => setFilter({ ...filter, q: e.target.value })}
              placeholder="ค้นหาชื่อพนักงาน / รหัสพนักงาน"
              className="w-full bg-white border border-slate-200 text-slate-700 py-2.5 pl-9 pr-3 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div className="md:col-span-3">
          <label className="block text-xs font-medium text-slate-600 mb-1">แผนก</label>
          <select value={filter.dept} onChange={(e) => setFilter({ ...filter, dept: e.target.value })} className={selectCls}>
            <option value="ทั้งหมด">ทั้งหมด</option>
            {departments.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
        <div className="md:col-span-3">
          <label className="block text-xs font-medium text-slate-600 mb-1">ตำแหน่ง</label>
          <select value={filter.position} onChange={(e) => setFilter({ ...filter, position: e.target.value })} className={selectCls}>
            <option value="ทั้งหมด">ทั้งหมด</option>
            {positions.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs font-medium text-slate-600 mb-1">ประเภท</label>
          <select value={filter.type} onChange={(e) => setFilter({ ...filter, type: e.target.value })} className={selectCls}>
            <option value="ทั้งหมด">ทั้งหมด</option>
            {Object.values(EVENT_TYPES).map((t) => (
              <option key={t.label} value={t.label}>{t.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* รายละเอียดการลา / ขาด / สาย */}
        <div className={`${CARD} xl:col-span-2 p-5`}>
          <h2 className="text-lg font-bold text-[#1E3A8A] mb-4">รายละเอียดการลา / ขาด / สาย</h2>
          <div className="overflow-auto max-h-[640px] rounded-xl border border-slate-100">
            <table className="w-full text-xs">
              <thead className="bg-blue-50/70 text-slate-700 font-bold sticky top-0">
                <tr>
                  <th className="py-3 px-3 text-left">ลำดับ</th>
                  <th className="py-3 px-3 text-left">รหัสพนักงาน</th>
                  <th className="py-3 px-3 text-left">ชื่อ - นามสกุล</th>
                  <th className="py-3 px-3 text-left">แผนก</th>
                  <th className="py-3 px-3 text-left">ตำแหน่ง</th>
                  <th className="py-3 px-3 text-center">ประเภท</th>
                  <th className="py-3 px-3 text-center">วันที่เริ่ม</th>
                  <th className="py-3 px-3 text-center">วันที่สิ้นสุด</th>
                  <th className="py-3 px-3 text-center">จำนวน</th>
                  <th className="py-3 px-3 text-left">หมายเหตุ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan="10" className="py-8 text-center text-slate-400">กำลังโหลดข้อมูล...</td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="py-8 text-center text-slate-400">ไม่พบข้อมูล</td>
                  </tr>
                ) : (
                  rows.map((r, i) => (
                    <tr key={r.key} className="hover:bg-slate-50/70">
                      <td className="py-3.5 px-3 text-slate-500">{i + 1}</td>
                      <td className="py-3.5 px-3 font-medium text-slate-900 whitespace-nowrap">{r.code}</td>
                      <td className="py-3.5 px-3 whitespace-nowrap">{r.name}</td>
                      <td className="py-3.5 px-3 text-slate-600">{r.department}</td>
                      <td className="py-3.5 px-3 text-slate-600">{r.position}</td>
                      <td className="py-3.5 px-3 text-center whitespace-nowrap">
                        <span className={`inline-block px-3 py-1 rounded-lg text-[11px] font-semibold ${EVENT_TYPES[r.typeKey].badge}`}>
                          {EVENT_TYPES[r.typeKey].label}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-center text-slate-600 whitespace-nowrap">{toThaiDate(r.start)}</td>
                      <td className="py-3.5 px-3 text-center text-slate-600 whitespace-nowrap">{toThaiDate(r.end)}</td>
                      <td className="py-3.5 px-3 text-center text-slate-700 whitespace-nowrap">{r.amount}</td>
                      <td className="py-3.5 px-3 text-slate-600">{r.note}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-5">
          {/* สรุปการลา / ขาด / สาย */}
          <div className={`${CARD} p-5`}>
            <h2 className="font-bold text-[#1E3A8A] mb-4">
              สรุปการลา / ขาด / สาย{' '}
              <span className="text-xs font-normal text-slate-500">(เดือน{monthLabel(period)})</span>
            </h2>
            <div className="flex items-center gap-5">
              <Donut
                segments={[
                  { key: 'leave', value: cnt.leave, color: COLORS.leave },
                  { key: 'absent', value: cnt.absent, color: COLORS.absent },
                  { key: 'late', value: cnt.late, color: COLORS.late },
                ]}
              />
              <ul className="flex-1 space-y-3 text-sm">
                {[
                  { key: 'leave', label: 'ลา', n: cnt.leave },
                  { key: 'absent', label: 'ขาดงาน', n: cnt.absent },
                  { key: 'late', label: 'สาย', n: cnt.late },
                ].map((s) => (
                  <li key={s.key} className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ background: COLORS[s.key] }}></span>
                    <span className="text-slate-700 w-14">{s.label}</span>
                    <span className="ml-auto text-slate-700 whitespace-nowrap">
                      {loading ? '-' : s.n} ครั้ง ({share(s.n)}%)
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* สถิติรายแผนก */}
          <div className={`${CARD} p-5`}>
            <h2 className="font-bold text-[#1E3A8A] mb-3">
              สถิติรายแผนก <span className="text-xs font-normal text-slate-500">(จำนวนครั้ง)</span>
            </h2>
            <div className="overflow-auto max-h-80 rounded-xl border border-slate-100">
              <table className="w-full text-xs">
                <thead className="bg-blue-50/70 text-slate-700 font-bold sticky top-0">
                  <tr>
                    <th className="py-2.5 px-3 text-left">แผนก</th>
                    <th className="py-2.5 px-3 text-center">
                      <span className="inline-flex items-center gap-1"><Plane className="w-3.5 h-3.5 text-sky-500" /> ลา</span>
                    </th>
                    <th className="py-2.5 px-3 text-center">
                      <span className="inline-flex items-center gap-1"><X className="w-3.5 h-3.5 text-rose-500" strokeWidth={3} /> ขาด</span>
                    </th>
                    <th className="py-2.5 px-3 text-center">
                      <span className="inline-flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-amber-500" /> สาย</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan="4" className="py-6 text-center text-slate-400">กำลังโหลดข้อมูล...</td>
                    </tr>
                  ) : deptStats.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="py-6 text-center text-slate-400">ไม่มีข้อมูล</td>
                    </tr>
                  ) : (
                    deptStats.map((d) => (
                      <tr key={d.name}>
                        <td className="py-2.5 px-3 text-slate-700">{d.name}</td>
                        <td className="py-2.5 px-3 text-center">{d.leave}</td>
                        <td className="py-2.5 px-3 text-center">{d.absent}</td>
                        <td className="py-2.5 px-3 text-center">{d.late}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
