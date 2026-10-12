import React from 'react';
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import Sidebar from './components/sidebar';
import Header from './components/header';
import Login from './pages/login'; // <-- นำเข้าหน้า Login

// หน้าตัวอย่างจำลอง
function DashboardHome() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800">ยินดีต้อนรับสู่ Payroll System</h1>
      <p className="text-slate-500 mt-1">เนื้อหาหน้า Dashboard หลัก</p>
    </div>
  );
}

function PagePlaceholder({ title }) {
  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800">{title}</h1>
      <p className="text-slate-500 mt-1">กำลังอยู่ในระหว่างการพัฒนา</p>
    </div>
  );
}

// Layout หลักสำหรับหน้าที่มี Sidebar และ Header
function MainLayout() {
  return (
    <div className="flex w-screen h-screen overflow-hidden bg-[#F4F7FC]">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header />
        <main className="flex-1 p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        
        {/* หน้า Login แยกเดี่ยว (พื้นหลังขาวล้วน ไม่มีแถบ Sidebar/Header) */}
        <Route path="/login" element={<Login />} />

        {/* หน้าหลักภายในระบบ */}
        <Route path="/" element={<MainLayout />}>
          <Route index element={<DashboardHome />} />
          <Route path="employees/permanent" element={<PagePlaceholder title="ข้อมูลพนักงาน - พนักงานประจำ" />} />
          <Route path="employees/freelance" element={<PagePlaceholder title="ข้อมูลพนักงาน - Freelance" />} />
          <Route path="attendance" element={<PagePlaceholder title="บันทึกการเข้างาน" />} />
          <Route path="leaves" element={<PagePlaceholder title="การลา" />} />
          <Route path="payroll/calculate" element={<PagePlaceholder title="คำนวณเงินเดือน" />} />
          <Route path="payroll/tax" element={<PagePlaceholder title="ภาษี" />} />
          <Route path="payroll/social-security" element={<PagePlaceholder title="ประกันสังคม" />} />
          <Route path="payroll/deductions" element={<PagePlaceholder title="รายการหักอื่น ๆ" />} />
          <Route path="reports" element={<PagePlaceholder title="รายงาน" />} />
          <Route path="settings" element={<PagePlaceholder title="การตั้งค่า" />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}