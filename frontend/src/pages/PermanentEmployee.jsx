import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../config';

export default function PermanentEmployee() {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchEmployees = () => {
    setLoading(true);
    setError(null);

    fetch(`${API_URL}/employees`)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`เชื่อมต่อไม่สำเร็จ (รหัสสถานะ: ${res.status})`);
        }
        return res.json();
      })
      .then((data) => {
        const rawList = Array.isArray(data) ? data : [];
        // เอาเฉพาะพนักงานประจำ
        const cleaned = rawList.filter((item) => item.employment_type === 'ประจำ');

        setEmployees(cleaned);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Fetch Error:', err);
        setError(err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  return (
    <div className="w-full text-slate-800">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="text-[#1E3A8A]">
            <svg className="w-8 h-8 fill-current" viewBox="0 0 24 24">
              <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">พนักงานประจำ</h1>
        </div>

        <button
          type="button"
          onClick={() => navigate('/employees/permanent/new')}
          className="flex items-center gap-1.5 bg-[#3B82F6] hover:bg-blue-600 text-white px-5 py-2 rounded-xl text-sm font-semibold shadow-sm transition-all active:scale-95"
        >
          <span>+</span>
          <span>เพิ่มพนักงาน</span>
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center justify-between">
          <span>เกิดข้อผิดพลาด: {error}</span>
          <button onClick={fetchEmployees} className="underline font-semibold hover:text-red-900">
            ลองใหม่
          </button>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#E5E7EB] text-slate-800 font-bold border-b border-slate-300">
                <th className="py-3.5 px-4 text-center">รหัสพนักงาน</th>
                <th className="py-3.5 px-4">ชื่อ-นามสกุล</th>
                <th className="py-3.5 px-4 text-center">ตำแหน่ง</th>
                <th className="py-3.5 px-4 text-center">แผนก</th>
                <th className="py-3.5 px-4 text-center">เงินเดือน(บาท)</th>
                <th className="py-3.5 px-4 text-center">ค่าล่วงเวลา(บาท)</th>
                <th className="py-3.5 px-4 text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-500">
                    กำลังโหลดข้อมูลพนักงานจากฐานข้อมูล...
                  </td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-400">
                    ไม่พบข้อมูลพนักงานประจำในระบบ
                  </td>
                </tr>
              ) : (
                employees.map((item, index) => {
                  const fullName = [item.prefix, item.first_name, item.last_name]
                    .filter(Boolean)
                    .join(' ') || '-';

                  return (
                    <tr key={item.id || item.employee_code || index} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 text-center font-medium text-slate-900">
                        {item.employee_code || item.id}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-800 whitespace-nowrap">
                        {fullName}
                      </td>
                      <td className="py-3.5 px-4 text-center text-slate-600">
                        {item.position || '-'}
                      </td>
                      <td className="py-3.5 px-4 text-center text-slate-600">
                        {item.department || '-'}
                      </td>
                      <td className="py-3.5 px-4 text-center font-medium text-slate-700">
                        {typeof item.base_salary === 'number'
                          ? item.base_salary.toLocaleString()
                          : (item.base_salary || '-')}
                      </td>
                      <td className="py-3.5 px-4 text-center font-medium text-slate-700">
                        {typeof item.hourly_ot_rate === 'number'
                          ? item.hourly_ot_rate.toLocaleString()
                          : (item.hourly_ot_rate || '0')}
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => navigate(`/employees/permanent/${item.id}/edit`)}
                            className="inline-flex items-center gap-1 bg-[#3B82F6] hover:bg-blue-600 text-white px-2.5 py-1 rounded-md text-[11px] font-medium shadow-sm transition-all active:scale-95"
                          >
                            แก้ไข
                          </button>
                          <button
                            type="button"
                            onClick={() => navigate(`/employees/permanent/delete?select=${item.id}`)}
                            className="inline-flex items-center gap-1 bg-[#DC2626] hover:bg-red-700 text-white px-2.5 py-1 rounded-md text-[11px] font-medium shadow-sm transition-all active:scale-95"
                          >
                            ลบ
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
