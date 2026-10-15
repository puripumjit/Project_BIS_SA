import React, { useState } from 'react';
import { Bell, ChevronDown } from 'lucide-react';

export default function Header() {
  // รายการรอบเงินเดือนครบทั้ง 12 เดือน
  const payPeriods = [
    'มกราคม 2569',
    'กุมภาพันธ์ 2569',
    'มีนาคม 2569',
    'เมษายน 2569',
    'พฤษภาคม 2569',
    'มิถุนายน 2569',
    'กรกฎาคม 2569',
    'สิงหาคม 2569',
    'กันยายน 2569',
    'ตุลาคม 2569',
    'พฤศจิกายน 2569',
    'ธันวาคม 2569',
  ];

  // สเตทสำหรับเดือนที่เลือก (ค่าเริ่มต้น: ตุลาคม 2569 ตามแบบ[cite: 1])
  const [selectedPeriod, setSelectedPeriod] = useState('กันยายน 2569');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <header className="h-16 bg-white border-b border-slate-100 px-8 flex items-center justify-end gap-6 shrink-0">
      {/* 1. ปุ่มกระดิ่งแจ้งเตือน */}
      <button
        type="button"
        className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
        aria-label="การแจ้งเตือน"
      >
        <Bell className="w-5 h-5" />
        {/* จุดสีแดงแจ้งเตือนเตือน[cite: 1] */}
        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white"></span>
      </button>

      {/* 2. Dropdown เลือกรอบเงินเดือน (ครอบคลุมครบ 12 เดือน) */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center gap-3 py-1.5 px-3 rounded-lg border border-slate-200 hover:border-slate-300 bg-white shadow-xs transition-colors cursor-pointer"
        >
          <div className="text-right leading-tight">
            <span className="block text-[11px] text-slate-400 font-medium">
              รอบเงินเดือน
            </span>
            <span className="block text-xs font-bold text-slate-800">
              {selectedPeriod}
            </span>
          </div>
          <ChevronDown
            className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
              isDropdownOpen ? 'rotate-180' : ''
            }`}
          />
        </button>

        {/* เมนูรายการทั้ง 12 เดือน */}
        {isDropdownOpen && (
          <>
            {/* Backdrop คลิกด้านนอกเพื่อปิด Dropdown */}
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsDropdownOpen(false)}
            />

            <div className="absolute right-0 mt-2 w-44 bg-white border border-slate-100 rounded-xl shadow-lg py-1 z-20 max-h-60 overflow-y-auto">
              {payPeriods.map((period) => (
                <button
                  key={period}
                  type="button"
                  onClick={() => {
                    setSelectedPeriod(period);
                    setIsDropdownOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-xs transition-colors cursor-pointer flex items-center justify-between ${
                    selectedPeriod === period
                      ? 'bg-blue-50 text-blue-600 font-semibold'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span>{period}</span>
                  {selectedPeriod === period && (
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                  )}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </header>
  );
}