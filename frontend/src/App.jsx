import React from 'react';
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import Sidebar from './components/sidebar';
import Header from './components/header';
import Login from './pages/login';
import Homepage from './pages/Homepage';
import PermanentEmployee from './pages/PermanentEmployee';
import EmployeeForm from './pages/EmployeeForm';
import EmployeeDelete from './pages/EmployeeDelete';
import Freelance from './pages/Freelance';
import FreelanceForm from './pages/FreelanceForm';
import FreelanceDelete from './pages/FreelanceDelete';
import Attendance from './pages/Attendance';
import Leaves from './pages/Leaves';
import PayrollCalculate from './pages/PayrollCalculate';
import PayrollTax from './pages/PayrollTax';
import PayrollTaxEdit from './pages/PayrollTaxEdit';  
import PayrollSocialSecurity from './pages/PayrollSocialSecurity';
import PayrollDeductions from './pages/PayrollDeductions';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import PayrollDetail from './pages/PayrollDetail';

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
          <Route index element={<Homepage />} />

          {/* พนักงานประจำ: รายการ / เพิ่ม / แก้ไข / ลบ */}
          <Route path="employees/permanent" element={<PermanentEmployee />} />
          <Route path="employees/permanent/new" element={<EmployeeForm />} />
          <Route path="employees/permanent/:id/edit" element={<EmployeeForm />} />
          <Route path="employees/permanent/delete" element={<EmployeeDelete />} />

          {/* ฟรีแลนซ์: รายการ / เพิ่ม / แก้ไข / ลบ */}
          <Route path="employees/freelance" element={<Freelance />} />
          <Route path="employees/freelance/new" element={<FreelanceForm />} />
          <Route path="employees/freelance/:id/edit" element={<FreelanceForm />} />
          <Route path="employees/freelance/delete" element={<FreelanceDelete />} />

          {/* หน้าบันทึกการเข้าทำงาน */}
          <Route path="/attendance" element={<Attendance />} />

          <Route path="leaves" element={<Leaves />} />
          <Route path="payroll/calculate" element={<PayrollCalculate />} />
          <Route path="/payroll/calculate/:id" element={<PayrollDetail />} />
          <Route path="payroll/tax" element={<PayrollTax />} />  
          <Route path="/payroll/tax/:id/edit" element={<PayrollTaxEdit />} />
          <Route path="/payroll/social-security" element={<PayrollSocialSecurity />} />
          <Route path="payroll/deductions" element={<PayrollDeductions />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
