const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// ตั้งค่าการเชื่อมต่อ PostgreSQL / Supabase
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'payroll_db',
  password: process.env.DB_PASSWORD || 'your_password',
  port: process.env.DB_PORT || 5432,
});

// =================================================================
// 1. API หน้าข้อมูลพนักงาน (รองรับตัวกรองประเภท: 'ประจำ' หรือ 'ฟรีแลนซ์')
// =================================================================
app.get('/api/employees', async (req, res) => {
  try {
    const { type, search } = req.query;
    let query = `
      SELECT 
        id,
        employee_code,
        prefix,
        first_name,
        last_name,
        prefix || ' ' || first_name || ' ' || last_name AS name,
        department,
        position,
        employment_type,
        base_salary,
        hourly_ot_rate,
        bank_name,
        bank_account_no,
        status
      FROM employees
      WHERE 1=1
    `;
    let values = [];

    // กรองประเภทพนักงาน ('ประจำ' หรือ 'ฟรีแลนซ์')
    if (type) {
      values.push(type);
      query += ` AND employment_type = $${values.length}`;
    }

    // กรองจากคำค้นหา (ชื่อ นามสกุล หรือ รหัสพนักงาน)
    if (search) {
      values.push(`%${search}%`);
      query += ` AND (first_name ILIKE $${values.length} OR last_name ILIKE $${values.length} OR employee_code ILIKE $${values.length})`;
    }

    query += ' ORDER BY employee_code ASC';

    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database Server Error' });
  }
});

// API เพิ่มข้อมูลพนักงานใหม่
app.post('/api/employees', async (req, res) => {
  const { employee_code, prefix, first_name, last_name, department, position, employment_type, base_salary, bank_name, bank_account_no } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO employees (employee_code, prefix, first_name, last_name, department, position, employment_type, base_salary, bank_name, bank_account_no)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [employee_code, prefix, first_name, last_name, department, position, employment_type, base_salary, bank_name, bank_account_no]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API แก้ไขข้อมูลพนักงาน
app.put('/api/employees/:id', async (req, res) => {
  const { id } = req.params;
  const { prefix, first_name, last_name, department, position, employment_type, base_salary, bank_name, bank_account_no, status } = req.body;
  try {
    const result = await pool.query(
      `UPDATE employees 
       SET prefix=$1, first_name=$2, last_name=$3, department=$4, position=$5, employment_type=$6, base_salary=$7, bank_name=$8, bank_account_no=$9, status=$10 
       WHERE id=$11 RETURNING *`,
      [prefix, first_name, last_name, department, position, employment_type, base_salary, bank_name, bank_account_no, status, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API ลบพนักงาน
app.delete('/api/employees/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM employees WHERE id = $1', [id]);
    res.json({ message: 'ลบข้อมูลพนักงานเรียบร้อยแล้ว' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// =================================================================
// 2. API หน้าคำนวณเงินเดือน (ตรงตามบาร์ตาราง: ลำดับ, รหัส, ชื่อ, แผนก, ตำแหน่ง, ประเภท, เงินเดือน, OT, รายได้อื่น, ลา/สาย, ภาษี, ประกันสังคม, หักอื่น)
// =================================================================
app.get('/api/payroll/calculate', async (req, res) => {
  try {
    const { period, department, employment_type, search } = req.query;
    
    // หากไม่ได้ส่งงวดเดือนมา ให้กำหนดเป็นงวดปัจจุบัน
    const selectedPeriod = period || '2026-09';

    let query = `
      SELECT 
        ROW_NUMBER() OVER (ORDER BY e.employee_code ASC) AS index_no,
        e.employee_code,
        e.prefix || ' ' || e.first_name || ' ' || e.last_name AS name,
        e.department,
        e.position,
        e.employment_type AS type,
        e.base_salary,
        COALESCE(p.ot_amount, 0) AS ot,
        COALESCE(p.other_income, 0) AS other_income,
        COALESCE(p.late_absence_deduction, 0) AS late_absence,
        COALESCE(p.tax_amount, 0) AS tax,
        COALESCE(p.social_security, 0) AS social_security,
        COALESCE(p.other_deduction, 0) AS other_deduction,
        -- คำนวณเงินเดือนสุทธิ
        (e.base_salary + COALESCE(p.ot_amount, 0) + COALESCE(p.other_income, 0) 
         - COALESCE(p.late_absence_deduction, 0) - COALESCE(p.tax_amount, 0) 
         - COALESCE(p.social_security, 0) - COALESCE(p.other_deduction, 0)) AS net_salary
      FROM employees e
      LEFT JOIN payroll_items p ON e.employee_code = p.employee_code AND p.period = $1
      WHERE e.status = 'ACTIVE'
    `;

    let values = [selectedPeriod];

    // ตัวกรองแผนก
    if (department && department !== 'ทั้งหมด') {
      values.push(department);
      query += ` AND e.department = $${values.length}`;
    }

    // ตัวกรองประเภทพนักงาน
    if (employment_type && employment_type !== 'ทั้งหมด') {
      values.push(employment_type);
      query += ` AND e.employment_type = $${values.length}`;
    }

    // ตัวกรองค้นหา
    if (search) {
      values.push(`%${search}%`);
      query += ` AND (e.first_name ILIKE $${values.length} OR e.last_name ILIKE $${values.length} OR e.employee_code ILIKE $${values.length})`;
    }

    query += ' ORDER BY e.employee_code ASC';

    const result = await pool.query(query, values);

    // คำนวณยอดรวมสำหรับการ์ดสรุปผลด้านบน
    const totalEmployees = result.rows.length;
    const totalNetSalary = result.rows.reduce((sum, item) => sum + parseFloat(item.net_salary), 0);
    const totalDeductions = result.rows.reduce((sum, item) => sum + parseFloat(item.late_absence) + parseFloat(item.tax) + parseFloat(item.social_security) + parseFloat(item.other_deduction), 0);

    res.json({
      summary: {
        total_employees: totalEmployees,
        total_net_salary: totalNetSalary,
        total_deductions: totalDeductions
      },
      data: result.rows
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database Server Error' });
  }
});

// เริ่มต้นรันเซิร์ฟเวอร์
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend Server running on http://localhost:${PORT}`);
});