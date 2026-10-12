import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Home,
  Users,
  Clock,
  Calendar,
  Calculator,
  FileBarChart,
  Settings,
  LogOut,
  ChevronDown,
  Layers
} from 'lucide-react';

export default function Sidebar() {
  // ควบคุม Dropdown
  const [isEmployeeOpen, setIsEmployeeOpen] = useState(true);
  const [isPayrollOpen, setIsPayrollOpen] = useState(false);

  const navItemClass = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
      isActive
        ? 'bg-[#1877F2] text-white shadow-md'
        : 'text-slate-300 hover:text-white hover:bg-white/10'
    }`;

  const subNavItemClass = ({ isActive }) =>
    `flex items-center gap-2 py-2 text-xs font-normal transition-colors ${
      isActive ? 'text-sky-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
    }`;

  return (
    <aside className="w-64 bg-[#072461] min-h-screen text-white flex flex-col justify-between p-4 select-none shrink-0 shadow-xl">
      {/* ส่วนบน: โลโก้และเมนู */}
      <div className="space-y-6">
        {/* โลโก้ */}
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-9 h-9 rounded-full bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-sky-400 shadow-inner">
            <Layers className="w-5 h-5" />
          </div>
          <span className="font-bold text-lg tracking-wide text-white">Payroll System</span>
        </div>

        {/* เมนู */}
        <nav className="space-y-1">
          {/* หน้าหลัก */}
          <NavLink to="/" end className={navItemClass}>
            <Home className="w-5 h-5" />
            <span>หน้าหลัก</span>
          </NavLink>

          {/* ข้อมูลพนักงาน (Dropdown) */}
          <div>
            <button
              onClick={() => setIsEmployeeOpen(!isEmployeeOpen)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5" />
                <span>ข้อมูลพนักงาน</span>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                  isEmployeeOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {isEmployeeOpen && (
              <div className="pl-11 pr-2 py-1 space-y-1">
                <NavLink to="/employees/permanent" className={subNavItemClass}>
                  <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70"></span>
                  พนักงานประจำ
                </NavLink>
                <NavLink to="/employees/freelance" className={subNavItemClass}>
                  <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70"></span>
                  Freelance
                </NavLink>
              </div>
            )}
          </div>

          {/* บันทึกการเข้างาน */}
          <NavLink to="/attendance" className={navItemClass}>
            <Clock className="w-5 h-5" />
            <span>บันทึกการเข้างาน</span>
          </NavLink>

          {/* การลา */}
          <NavLink to="/leaves" className={navItemClass}>
            <Calendar className="w-5 h-5" />
            <span>การลา</span>
          </NavLink>

          {/* การคำนวณเงินเดือน (Dropdown) */}
          <div>
            <button
              onClick={() => setIsPayrollOpen(!isPayrollOpen)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <Calculator className="w-5 h-5" />
                <span>การคำนวณเงินเดือน</span>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                  isPayrollOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {isPayrollOpen && (
              <div className="pl-11 pr-2 py-1 space-y-1">
                <NavLink to="/payroll/calculate" className={subNavItemClass}>
                  <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70"></span>
                  คำนวณเงินเดือน
                </NavLink>
                <NavLink to="/payroll/tax" className={subNavItemClass}>
                  <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70"></span>
                  ภาษี
                </NavLink>
                <NavLink to="/payroll/social-security" className={subNavItemClass}>
                  <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70"></span>
                  ประกันสังคม
                </NavLink>
                <NavLink to="/payroll/deductions" className={subNavItemClass}>
                  <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70"></span>
                  รายการหักอื่น ๆ
                </NavLink>
              </div>
            )}
          </div>

          {/* รายงาน */}
          <NavLink to="/reports" className={navItemClass}>
            <FileBarChart className="w-5 h-5" />
            <span>รายงาน</span>
          </NavLink>

          {/* การตั้งค่า */}
          <NavLink to="/settings" className={navItemClass}>
            <Settings className="w-5 h-5" />
            <span>การตั้งค่า</span>
          </NavLink>
        </nav>
      </div>

      {/* ส่วนล่าง: โปรไฟล์ */}
      <div className="pt-4 border-t border-blue-900/40 flex items-center justify-between px-2">
        <div className="flex items-center gap-3">
          <img
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face"
            alt="User avatar"
            className="w-10 h-10 rounded-full object-cover border-2 border-sky-400/40"
          />
          <div className="text-left leading-tight">
            <p className="text-sm font-semibold text-white">HR Admin</p>
            <p className="text-[11px] text-slate-400">ผู้ดูแลระบบ</p>
          </div>
        </div>

        <button
          title="ออกจากระบบ"
          onClick={() => alert('Logout')}
          className="p-2 text-slate-400 hover:text-red-400 hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </aside>
  );
}