import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Eye, EyeOff, LogIn } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // โค้ดตรวจสอบการเข้าสู่ระบบ
    console.log({ username, password, rememberMe });
    // เมื่อเข้าสู่ระบบสำเร็จ ให้ redirect ไปหน้าแรก
    navigate('/');
  };

  return (
    <div className="min-h-screen w-full bg-white flex items-center justify-center p-4">
      {/* การ์ดฟอร์มเข้าสู่ระบบ */}
      <div className="w-full max-w-md bg-white border border-slate-100 rounded-3xl p-8 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.08)]">
        {/* ส่วนหัว: โลโก้และชื่อระบบ */}
        <div className="flex flex-col items-center mb-8">
          {/* สัญลักษณ์ไอคอนคล้ายภาพต้นฉบับ */}
          <div className="w-16 h-12 flex items-center justify-center mb-3">
            <svg
              viewBox="0 0 64 36"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full h-full"
            >
              <path
                d="M18 6C11.3726 6 6 11.3726 6 18C6 24.6274 11.3726 30 18 30C23.085 30 27.4398 26.8398 29.1716 22.3431L34.8284 13.6569C36.5602 9.16016 40.915 6 46 6C52.6274 6 58 11.3726 58 18C58 24.6274 52.6274 30 46 30"
                stroke="url(#gradient-payroll)"
                strokeWidth="7"
                strokeLinecap="round"
              />
              <defs>
                <linearGradient
                  id="gradient-payroll"
                  x1="6"
                  y1="18"
                  x2="58"
                  y2="18"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop stopColor="#22C55E" />
                  <stop offset="1" stopColor="#0EA5E9" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
            Payroll System
          </h1>
          <h2 className="text-xl font-bold text-slate-700 mt-3">เข้าสู่ระบบ</h2>
          <p className="text-sm text-slate-400 mt-1">
            กรุณากรอกข้อมูลเพื่อเข้าสู่ระบบ
          </p>
        </div>

        {/* ฟอร์มกรอกข้อมูล */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* ช่องชื่อผู้ใช้ */}
          <div>
            <div className="relative flex items-center">
              <span className="absolute left-4 text-slate-400">
                <User className="w-5 h-5" />
              </span>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="ชื่อผู้ใช้ (Username)"
                className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-700 text-sm placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
              />
            </div>
          </div>

          {/* ช่องรหัสผ่าน */}
          <div>
            <div className="relative flex items-center">
              <span className="absolute left-4 text-slate-400">
                <Lock className="w-5 h-5" />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="รหัสผ่าน (Password)"
                className="w-full pl-12 pr-12 py-3 bg-white border border-slate-200 rounded-xl text-slate-700 text-sm placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 text-slate-400 hover:text-slate-600 cursor-pointer focus:outline-none"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* จดจำการเข้าสู่ระบบ & ลืมรหัสผ่าน */}
          <div className="flex items-center justify-between text-xs pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none text-slate-600">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
              />
              <span>จดจำการเข้าสู่ระบบ</span>
            </label>

            <a
              href="#forgot-password"
              className="text-blue-600 hover:text-blue-700 hover:underline font-medium"
            >
              ลืมรหัสผ่าน?
            </a>
          </div>

          {/* ปุ่มเข้าสู่ระบบ */}
          <button
            type="submit"
            className="w-full mt-3 py-3 px-4 bg-[#1877F2] hover:bg-blue-600 active:scale-[0.99] text-white font-medium text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            <span>เข้าสู่ระบบ</span>
          </button>
        </form>
      </div>
    </div>
  );
}