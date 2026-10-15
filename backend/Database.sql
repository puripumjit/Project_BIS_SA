-- 0. ลบตารางเก่าทิ้งก่อน (เรียงจากตารางลูกไปตารางแม่ + CASCADE กัน FK ค้าง)
DROP TABLE IF EXISTS payroll_deductions CASCADE;
DROP TABLE IF EXISTS payroll_items CASCADE;
DROP TABLE IF EXISTS leaves CASCADE;
DROP TABLE IF EXISTS attendance CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS employees CASCADE;

-- 1. พนักงาน
CREATE TABLE employees (
    id SERIAL PRIMARY KEY,
    employee_code VARCHAR(20) UNIQUE NOT NULL,
    prefix VARCHAR(20) DEFAULT 'นาย',
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    department VARCHAR(100) NOT NULL,
    position VARCHAR(100) NOT NULL,
    employment_type VARCHAR(50) NOT NULL,
    base_salary NUMERIC(12, 2) NOT NULL CHECK (base_salary >= 0),
    hourly_ot_rate NUMERIC(10, 2) NOT NULL DEFAULT 0
        CHECK (hourly_ot_rate >= 0),
    bank_name VARCHAR(100) DEFAULT 'กสิกรไทย',
    bank_account_no VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
        CHECK (status IN ('ACTIVE', 'INACTIVE')),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. ผู้ใช้งานระบบ
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name VARCHAR(200) NOT NULL,
    role VARCHAR(20) NOT NULL
        CHECK (role IN ('ADMIN', 'HR')),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
        CHECK (status IN ('ACTIVE', 'INACTIVE')),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3. เวลาเข้างานและ OT รายวัน
CREATE TABLE attendance (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL
        REFERENCES employees(id) ON DELETE CASCADE,
    work_date DATE NOT NULL,
    check_in TIME,
    check_out TIME,
    work_hours NUMERIC(6, 2) NOT NULL DEFAULT 0
        CHECK (work_hours >= 0),
    ot_hours NUMERIC(6, 2) NOT NULL DEFAULT 0
        CHECK (ot_hours >= 0),
    status VARCHAR(20) NOT NULL DEFAULT 'NORMAL'
        CHECK (status IN ('NORMAL', 'LATE', 'LEAVE', 'ABSENT')),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (employee_id, work_date),
    CHECK (
        check_in IS NULL OR check_out IS NULL OR check_out > check_in
    )
);

-- 4. การลา
-- แก้ constraint: ห้ามมีผู้อนุมัติเฉพาะสถานะ PENDING
-- (เดิมบังคับว่าถ้าไม่ใช่ APPROVED ต้องไม่มีผู้อนุมัติ ทำให้แถว REJECTED ที่มีผู้ตัดสินใส่ไม่ได้)
CREATE TABLE leaves (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL
        REFERENCES employees(id) ON DELETE CASCADE,
    leave_type VARCHAR(20) NOT NULL
        CHECK (leave_type IN ('SICK', 'PERSONAL', 'VACATION', 'OTHER')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    days NUMERIC(6, 2) NOT NULL CHECK (days > 0),
    reason TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING'
        CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    approved_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK (end_date >= start_date),
    CHECK (
        status <> 'PENDING'
        OR (approved_by IS NULL AND approved_at IS NULL)
    )
);

-- 5. รายการเงินเดือนต่อพนักงานต่องวด
CREATE TABLE payroll_items (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL
        REFERENCES employees(id) ON DELETE RESTRICT,
    period VARCHAR(7) NOT NULL
        CHECK (period ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'),

    -- รายได้และ OT
    ot_hours NUMERIC(8, 2) NOT NULL DEFAULT 0
        CHECK (ot_hours >= 0),
    ot_amount NUMERIC(12, 2) NOT NULL DEFAULT 0
        CHECK (ot_amount >= 0),
    small_panel_qty INTEGER NOT NULL DEFAULT 0
        CHECK (small_panel_qty >= 0),
    small_panel_rate NUMERIC(12, 2) NOT NULL DEFAULT 0
        CHECK (small_panel_rate >= 0),
    large_panel_qty INTEGER NOT NULL DEFAULT 0
        CHECK (large_panel_qty >= 0),
    large_panel_rate NUMERIC(12, 2) NOT NULL DEFAULT 0
        CHECK (large_panel_rate >= 0),
    other_income NUMERIC(12, 2) NOT NULL DEFAULT 0
        CHECK (other_income >= 0),

    -- รายการหักที่ระบุโดยตรงในเงินเดือน
    late_absence_deduction NUMERIC(12, 2) NOT NULL DEFAULT 0
        CHECK (late_absence_deduction >= 0),
    tax_amount NUMERIC(12, 2) NOT NULL DEFAULT 0
        CHECK (tax_amount >= 0),
    social_security NUMERIC(12, 2) NOT NULL DEFAULT 0
        CHECK (social_security >= 0),
    other_deduction NUMERIC(12, 2) NOT NULL DEFAULT 0
        CHECK (other_deduction >= 0),

    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT'
        CHECK (status IN ('DRAFT', 'APPROVED', 'PAID')),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- พนักงานหนึ่งคนมีรายการเงินเดือนได้หนึ่งรายการต่องวด
    CONSTRAINT uq_payroll_employee_period
        UNIQUE (employee_id, period)
);

-- 6. รายการหักเงินแยกตามงวดเงินเดือน
CREATE TABLE payroll_deductions (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL,
    period VARCHAR(7) NOT NULL
        CHECK (period ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'),
    deduction_type VARCHAR(30) NOT NULL
        CHECK (
            deduction_type IN (
                'LOAN', 'PROVIDENT_FUND', 'UNIFORM', 'DAMAGE', 'OTHER'
            )
        ),
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    note TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- ต้องมี payroll_items ของพนักงานและงวดเดียวกันก่อน
    CONSTRAINT fk_deduction_payroll
        FOREIGN KEY (employee_id, period)
        REFERENCES payroll_items(employee_id, period)
        ON DELETE CASCADE
);

-- Index ช่วยค้นข้อมูลตามพนักงานและงวด
CREATE INDEX idx_attendance_employee_date
    ON attendance(employee_id, work_date);

CREATE INDEX idx_leaves_employee_dates
    ON leaves(employee_id, start_date, end_date);

CREATE INDEX idx_payroll_period
    ON payroll_items(period);

CREATE INDEX idx_deductions_employee_period
    ON payroll_deductions(employee_id, period);


-- ==================== ข้อมูลตัวอย่าง ====================

-- 7. มอกอัพข้อมูลพนักงาน (ประจำ 15 คน + ฟรีแลนซ์ช่างประกอบตู้ไฟ 5 คน)
INSERT INTO employees (employee_code, prefix, first_name, last_name, department, position, employment_type, base_salary, hourly_ot_rate, bank_name, bank_account_no)
VALUES
-- พนักงานประจำ (15 คน)
('EMP001', 'นาย', 'เกียรติศักดิ์', 'ไฟฟ้ามั่นคง', 'ฝ่ายวิศวกรรมและการออกแบบ', 'หัวหน้าวิศวกรออกแบบตู้ MDB', 'ประจำ', 42000.00, 262.50, 'กสิกรไทย', '123-4-56789-0'),
('EMP002', 'นาย', 'ณัฐวุฒิ', 'สายตระกูล', 'ฝ่ายวิศวกรรมและการออกแบบ', 'วิศวกรออกแบบ 2D & Single Line', 'ประจำ', 28000.00, 175.00, 'กสิกรไทย', '123-4-56789-1'),
('EMP003', 'นาย', 'ภานุพงศ์', 'วงษ์สว่าง', 'ฝ่ายการผลิตและประกอบ', 'หัวหน้าแผนกประกอบตู้คอนโทรล', 'ประจำ', 32000.00, 200.00, 'ไทยพาณิชย์', '987-6-54321-0'),
('EMP004', 'นาย', 'สมชาย', 'ช่างทอง', 'ฝ่ายการผลิตและประกอบ', 'ช่างเดินสายไฟตู้สวิตช์บอร์ด (Wiring)', 'ประจำ', 19000.00, 118.75, 'ไทยพาณิชย์', '987-6-54321-1'),
('EMP005', 'นาย', 'วิชัย', 'ประกอบดี', 'ฝ่ายการผลิตและประกอบ', 'ช่างประกอบโครงตู้และบัสบาร์', 'ประจำ', 18500.00, 115.62, 'กรุงไทย', '456-7-89012-0'),
('EMP006', 'นาย', 'อนุชา', 'พรานตรวจ', 'ฝ่ายประกันคุณภาพ (QA/QC)', 'เจ้าหน้าที่ QC ตรวจสอบตู้ไฟ', 'ประจำ', 22000.00, 137.50, 'กสิกรไทย', '123-4-56789-2'),
('EMP007', 'นาย', 'กิตติพงษ์', 'เนตรตรง', 'ฝ่ายประกันคุณภาพ (QA/QC)', 'วิศวกรทดสอบระบบไฟฟ้า', 'ประจำ', 30000.00, 187.50, 'กสิกรไทย', '123-4-56789-3'),
('EMP008', 'นางสาว', 'ศิริพร', 'ค้าส่งอุปกรณ์', 'ฝ่ายขายและพัฒนาธุรกิจ', 'Senior Sales Engineer', 'ประจำ', 35000.00, 218.75, 'กรุงเทพ', '321-0-98765-0'),
('EMP009', 'นาย', 'ธนกฤต', 'ยอดขายดี', 'ฝ่ายขายและพัฒนาธุรกิจ', 'Sales Executive', 'ประจำ', 22000.00, 137.50, 'กรุงเทพ', '321-0-98765-1'),
('EMP010', 'นางสาว', 'กนกวรรณ', 'สั่งของไว', 'ฝ่ายจัดซื้อและสโตร์', 'เจ้าหน้าที่จัดซื้ออุปกรณ์ไฟฟ้า', 'ประจำ', 23000.00, 143.75, 'กสิกรไทย', '123-4-56789-4'),
('EMP011', 'นาย', 'ปิยะ', 'คลังสมบูรณ์', 'ฝ่ายจัดซื้อและสโตร์', 'เจ้าหน้าที่คลังสินค้าและอุปกรณ์ไฟฟ้า', 'ประจำ', 18000.00, 112.50, 'กรุงศรี', '654-3-21098-0'),
('EMP012', 'นางสาว', 'วรรณิภา', 'ดุลบัญชี', 'ฝ่ายบัญชีและการเงิน', 'ผู้จัดการฝ่ายบัญชีโรงงาน', 'ประจำ', 38000.00, 237.50, 'กสิกรไทย', '123-4-56789-5'),
('EMP013', 'นางสาว', 'ชลธิชา', 'ช่วยงานดี', 'ฝ่ายบริหารงานบุคคล (HR)', 'เจ้าหน้าที่ HR & จป.วิชาชีพ', 'ประจำ', 25000.00, 156.25, 'กสิกรไทย', '123-4-56789-6'),
('EMP014', 'นาย', 'นพดล', 'สายตรง', 'ฝ่ายบริการและติดตั้ง', 'หัวหน้าทีมติดตั้งและ Commissioning', 'ประจำ', 27000.00, 168.75, 'ไทยพาณิชย์', '987-6-54321-2'),
('EMP015', 'นาย', 'ประเสริฐ', 'ขับปลอดภัย', 'ฝ่ายจัดส่งและโลจิสติกส์', 'พนักงานขับรถขนส่งตู้ไฟฟ้า', 'ประจำ', 16500.00, 103.12, 'กรุงไทย', '456-7-89012-1'),

-- ฟรีแลนซ์ / ช่าง Outsource ทำตู้ไฟโดยเฉพาะ (5 คน)
('FR001', 'นาย', 'สมศักดิ์', 'ช่างไฟฝีมือดี', 'ฝ่ายการผลิตและประกอบ', 'ช่างเดินสายไฟตู้ MDB (Wiring Specialist)', 'ฟรีแลนซ์', 0.00, 0.00, 'กรุงเทพ', '321-0-98765-2'),
('FR002', 'นาย', 'ชัยวัฒน์', 'บัสบาร์แม่นยำ', 'ฝ่ายการผลิตและประกอบ', 'ช่างดัดและเข้าหัวบัสบาร์ (Busbar Outsource)', 'ฟรีแลนซ์', 0.00, 0.00, 'กสิกรไทย', '123-4-56789-7'),
('FR003', 'นาย', 'ธีรยุทธ', 'ประกอบโครงตู้', 'ฝ่ายการผลิตและประกอบ', 'ช่างประกอบโครงตู้สวิตช์บอร์ด (Outsource)', 'ฟรีแลนซ์', 0.00, 0.00, 'ไทยพาณิชย์', '987-6-54321-3'),
('FR004', 'นาย', 'สัญชัย', 'ช่างเชื่อมเทคนิค', 'ฝ่ายการผลิตและประกอบ', 'ช่างเชื่อมประกอบตู้ไฟเหล็กพิเศษ (Outsource)', 'ฟรีแลนซ์', 0.00, 0.00, 'กรุงไทย', '456-7-89012-2'),
('FR005', 'นาย', 'นพรัตน์', 'สายทดสอบหน้างาน', 'ฝ่ายบริการและติดตั้ง', 'ช่างติดตั้งและเดินสายตู้ไฟหน้างาน (Outsource)', 'ฟรีแลนซ์', 0.00, 0.00, 'กสิกรไทย', '123-4-56789-8');

-- 8. ผู้ใช้ระบบ (ต้องเพิ่มก่อน leaves เพราะ leaves.approved_by อ้างอิง users.id)
INSERT INTO users (username, password_hash, full_name, role, status)
VALUES
('admin', '$2b$12$REPLACE_WITH_REAL_BCRYPT_HASH_FOR_ADMIN', 'ผู้ดูแลระบบ', 'ADMIN', 'ACTIVE'),
('hr01',  '$2b$12$REPLACE_WITH_REAL_BCRYPT_HASH_FOR_HR',    'เจ้าหน้าที่ฝ่ายบุคคล', 'HR', 'ACTIVE');

-- 9. รายการเงินเดือนงวด 2026-09
-- แก้จากเดิม: ตารางใช้คอลัมน์ employee_id (ตัวเลข 1-20 ตามลำดับ EMP001-EMP020) ไม่ใช่ employee_code
-- และใส่เรทตู้ (เล็ก 800 / ใหญ่ 1,000) ให้ฟรีแลนซ์ เพื่อให้ยอดตรงกับคอมเมนต์
INSERT INTO payroll_items
(employee_id, period, ot_hours, ot_amount, small_panel_qty, small_panel_rate, large_panel_qty, large_panel_rate, other_income, late_absence_deduction, tax_amount, social_security, other_deduction)
VALUES
-- พนักงานประจำ (15 คน)
(1,  '2026-09', 10.0, 2625.00, 0, 0, 0, 0, 0.00,     0.00, 1100.00, 750.00, 0.00),
(2,  '2026-09', 15.0, 2625.00, 0, 0, 0, 0, 0.00,     0.00,  250.00, 750.00, 0.00),
(3,  '2026-09', 20.0, 4000.00, 0, 0, 0, 0, 0.00,     0.00,  400.00, 750.00, 0.00),
(4,  '2026-09', 25.0, 2968.75, 0, 0, 0, 0, 0.00,   150.00,    0.00, 750.00, 0.00),
(5,  '2026-09', 18.0, 2081.16, 0, 0, 0, 0, 0.00,     0.00,    0.00, 750.00, 0.00),
(6,  '2026-09', 12.0, 1650.00, 0, 0, 0, 0, 0.00,     0.00,    0.00, 750.00, 0.00),
(7,  '2026-09', 10.0, 1875.00, 0, 0, 0, 0, 0.00,     0.00,  300.00, 750.00, 0.00),
(8,  '2026-09',  0.0,    0.00, 0, 0, 0, 0, 12500.00, 0.00, 1200.00, 750.00, 0.00),
(9,  '2026-09',  0.0,    0.00, 0, 0, 0, 0, 4800.00,  0.00,  120.00, 750.00, 0.00),
(10, '2026-09',  8.0, 1150.00, 0, 0, 0, 0, 0.00,     0.00,   80.00, 750.00, 0.00),
(11, '2026-09', 10.0, 1125.00, 0, 0, 0, 0, 0.00,     0.00,    0.00, 750.00, 0.00),
(12, '2026-09',  0.0,    0.00, 0, 0, 0, 0, 0.00,     0.00,  850.00, 750.00, 0.00),
(13, '2026-09',  0.0,    0.00, 0, 0, 0, 0, 0.00,     0.00,  150.00, 750.00, 0.00),
(14, '2026-09', 15.0, 2531.25, 0, 0, 0, 0, 1500.00,  0.00,  200.00, 750.00, 0.00),
(15, '2026-09', 15.0, 1546.80, 0, 0, 0, 0, 800.00,   0.00,    0.00, 750.00, 0.00),

-- ฟรีแลนซ์ (คิดตามชิ้นงาน: ตู้เล็ก 800 / ตู้ใหญ่ 1,000 + หักภาษี 3%)
(16, '2026-09', 0.0, 0.00, 15, 800.00, 20, 1000.00, 0.00, 0.00, 960.00, 0.00, 0.00), -- รวม 32,000 บาท
(17, '2026-09', 0.0, 0.00, 20, 800.00, 10, 1000.00, 0.00, 0.00, 780.00, 0.00, 0.00), -- รวม 26,000 บาท
(18, '2026-09', 0.0, 0.00, 10, 800.00, 15, 1000.00, 0.00, 0.00, 690.00, 0.00, 0.00), -- รวม 23,000 บาท
(19, '2026-09', 0.0, 0.00, 25, 800.00,  5, 1000.00, 0.00, 0.00, 750.00, 0.00, 0.00), -- รวม 25,000 บาท
(20, '2026-09', 0.0, 0.00, 12, 800.00, 18, 1000.00, 0.00, 0.00, 828.00, 0.00, 0.00); -- รวม 27,600 บาท

-- 10. ข้อมูลการเข้างานตัวอย่าง วันที่ 1 กันยายน 2026
-- employee_id 1-20 สอดคล้องกับพนักงาน EMP001-EMP020 ตามลำดับการ INSERT ด้านบน
INSERT INTO attendance
(employee_id, work_date, check_in, check_out, work_hours, ot_hours, status)
VALUES
(1,  '2026-09-01', '08:00', '17:00', 8.00, 2.00, 'NORMAL'),
(2,  '2026-09-01', '08:20', '17:00', 7.67, 0.00, 'LATE'),
(3,  '2026-09-01', '08:00', '19:00', 8.00, 2.00, 'NORMAL'),
(4,  '2026-09-01', '08:05', '17:00', 7.92, 0.00, 'NORMAL'),
(5,  '2026-09-01', '08:00', '18:00', 8.00, 1.00, 'NORMAL'),
(6,  '2026-09-01', '08:00', '17:00', 8.00, 0.00, 'NORMAL'),
(7,  '2026-09-01', '08:10', '17:00', 7.83, 0.00, 'LATE'),
(8,  '2026-09-01', '08:00', '17:00', 8.00, 0.00, 'NORMAL'),
(9,  '2026-09-01', '08:00', '17:00', 8.00, 0.00, 'NORMAL'),
(10, '2026-09-01', '08:00', '18:00', 8.00, 1.00, 'ABSENT'),
(11, '2026-09-01', '08:00', '17:00', 8.00, 0.00, 'NORMAL'),
(12, '2026-09-01', '08:00', '17:00', 8.00, 0.00, 'NORMAL'),
(13, '2026-09-01', '08:00', '17:00', 8.00, 0.00, 'NORMAL'),
(14, '2026-09-01', '08:00', '19:00', 8.00, 2.00, 'NORMAL'),
(15, '2026-09-01', '08:00', '17:00', 8.00, 0.00, 'NORMAL'),
(16, '2026-09-01', '08:00', '17:00', 8.00, 0.00, 'NORMAL'),
(17, '2026-09-01', '08:00', '17:00', 8.00, 0.00, 'NORMAL'),
(18, '2026-09-01', '08:00', '17:00', 8.00, 0.00, 'NORMAL'),
(19, '2026-09-01', '08:00', '17:00', 8.00, 0.00, 'NORMAL'),
(20, '2026-09-01', NULL, NULL, 0.00, 0.00, 'LEAVE');

-- 11. ข้อมูลการลา
INSERT INTO leaves
(employee_id, leave_type, start_date, end_date, days, reason, status, approved_by, approved_at)
VALUES
(2,  'SICK',     '2026-09-08', '2026-09-08', 1.0, 'ลาป่วย', 'APPROVED', 2, '2026-09-07 16:30:00'),
(4,  'PERSONAL', '2026-09-10', '2026-09-10', 1.0, 'ทำธุระส่วนตัว', 'APPROVED', 2, '2026-09-09 15:00:00'),
(8,  'VACATION', '2026-09-14', '2026-09-15', 2.0, 'ลาพักร้อน', 'APPROVED', 2, '2026-09-10 10:00:00'),
(11, 'SICK',     '2026-09-18', '2026-09-18', 0.5, 'ลาป่วยครึ่งวัน', 'PENDING', NULL, NULL),
(16, 'PERSONAL', '2026-09-22', '2026-09-22', 1.0, 'ติดธุระส่วนตัว', 'REJECTED', 2, '2026-09-20 13:00:00');

-- 12. รายการหักเงินเดือนเพิ่มเติม งวด 2026-09
INSERT INTO payroll_deductions
(employee_id, period, deduction_type, amount, note)
VALUES
(1,  '2026-09', 'LOAN',            2000.00, 'หักชำระเงินกู้ประจำเดือน'),
(2,  '2026-09', 'PROVIDENT_FUND',   840.00, 'เงินสะสมกองทุนสำรองเลี้ยงชีพ'),
(3,  '2026-09', 'UNIFORM',          350.00, 'ค่าชุดทำงาน'),
(4,  '2026-09', 'DAMAGE',           500.00, 'ค่าเสียหายอุปกรณ์ตามที่ตรวจสอบแล้ว'),
(5,  '2026-09', 'OTHER',            200.00, 'รายการหักอื่น ๆ'),
(8,  '2026-09', 'LOAN',            1500.00, 'หักชำระเงินกู้ประจำเดือน'),
(12, '2026-09', 'PROVIDENT_FUND',  1140.00, 'เงินสะสมกองทุนสำรองเลี้ยงชีพ'),
(14, '2026-09', 'UNIFORM',          350.00, 'ค่าชุดทำงาน');