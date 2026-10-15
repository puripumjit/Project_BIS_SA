package main

import (
	"database/sql"
	"fmt"
	"log"
	"net/http"
	"os"

	"backend/internal/attendance"
	"backend/internal/employee"
	"backend/internal/leave"
	"backend/internal/payroll"
	"backend/internal/payroll_deduction"
	"backend/internal/user"

	_ "github.com/lib/pq"
)

func main() {
	// 1. อ่านค่า Connection String และ Port จาก Environment (ถ้าไม่มีให้ใช้ค่าเริ่มต้น)
	connStr := os.Getenv("DATABASE_URL")
	if connStr == "" {
		connStr = "postgres://postgres:password@localhost:5432/payroll_db?sslmode=disable"
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	// 2. เชื่อมต่อฐานข้อมูล
	db, err := sql.Open("postgres", connStr)
	if err != nil {
		log.Fatalf("ไม่สามารถเปิด Connection ไปยัง Database ได้: %v", err)
	}
	defer db.Close()

	// ตั้งค่า Connection Pool เบื้องต้น
	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(5)

	// ตรวจสอบสถานะการเชื่อมต่อจริง (Ping)
	if err = db.Ping(); err != nil {
		log.Fatalf("เชื่อมต่อ Database ไม่สำเร็จ: %v", err)
	}
	log.Println("เชื่อมต่อ Database สำเร็จเรียบร้อย")

	// สร้างตาราง employees
	createEmployeesQuery := `
	CREATE TABLE IF NOT EXISTS employees (
		id SERIAL PRIMARY KEY,
		employee_code VARCHAR(20) UNIQUE NOT NULL,
		prefix VARCHAR(20) DEFAULT 'นาย',
		first_name VARCHAR(100) NOT NULL,
		last_name VARCHAR(100) NOT NULL,
		department VARCHAR(100) NOT NULL,
		position VARCHAR(100) NOT NULL,
		employment_type VARCHAR(50) NOT NULL,
		base_salary DECIMAL(10, 2) NOT NULL,
		hourly_ot_rate DECIMAL(10, 2) DEFAULT 0.00,
		bank_name VARCHAR(100) DEFAULT 'กสิกรไทย',
		bank_account_no VARCHAR(50) NOT NULL,
		status VARCHAR(20) DEFAULT 'ACTIVE',
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);`

	if _, err := db.Exec(createEmployeesQuery); err != nil {
		log.Fatalf("สร้าง Table employees ล้มเหลว: %v", err)
	}

	// สร้างตาราง attendance (ต้องสร้างหลัง employees เพราะอ้างอิง employees(id))
	createAttendanceQuery := `
	CREATE TABLE IF NOT EXISTS attendance (
		id SERIAL PRIMARY KEY,
		employee_id INT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
		work_date DATE NOT NULL,
		check_in TIME,
		check_out TIME,
		work_hours DECIMAL(5, 2) DEFAULT 0,
		ot_hours DECIMAL(5, 2) DEFAULT 0,
		status VARCHAR(30) DEFAULT 'NORMAL'
	);`

	if _, err := db.Exec(createAttendanceQuery); err != nil {
		log.Fatalf("สร้าง Table attendance ล้มเหลว: %v", err)
	}

	// 3. สร้าง Handler ของแต่ละโมดูล
	empHandler := employee.NewHandler(db)
	payHandler := payroll.NewHandler(db)
	userHandler := user.NewHandler(db)
	attendanceHandler := attendance.NewHandler(db)
	leaveHandler := leave.NewHandler(db)
	deductionHandler := payroll_deduction.NewHandler(db)

	// 4. สร้าง ServeMux และลงทะเบียน Routing
	mux := http.NewServeMux()

	// Health Check Endpoint
	mux.HandleFunc("GET /health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"status":"ok"}`))
	})

	// Routes สำหรับ Employee
	mux.HandleFunc("POST /employees", empHandler.CreateEmployee)
	mux.HandleFunc("GET /employees", empHandler.GetEmployees)
	mux.HandleFunc("PUT /employees/{id}", empHandler.UpdateEmployee)
	mux.HandleFunc("DELETE /employees/{id}", empHandler.DeleteEmployee)

	// Routes สำหรับ Payroll
	mux.HandleFunc("GET /payroll", payHandler.GetPayrollSummary)
	mux.HandleFunc("GET /payroll/{id}", payHandler.GetPayrollDetail)
	mux.HandleFunc("PUT /payroll/{id}/status", payHandler.UpdatePayrollStatus)
	mux.HandleFunc("POST /payroll", payHandler.CreatePayroll)
	mux.HandleFunc("GET /social-security", payHandler.GetSocialSecurity)
	mux.HandleFunc("GET /payrolltax", payHandler.GetPayrollTaxList)
	mux.HandleFunc("PUT /payrolltax/{id}", payHandler.UpdatePayrollTax)

	// Routes สำหรับ Users
	mux.HandleFunc("POST /users", userHandler.CreateUser)
	mux.HandleFunc("GET /users", userHandler.GetUsers)

	// Routes สำหรับ Attendance
	mux.HandleFunc("POST /attendance", attendanceHandler.CreateAttendance)
	mux.HandleFunc("GET /attendance", attendanceHandler.GetAttendance)

	// Routes สำหรับ Leaves
	mux.HandleFunc("POST /leaves", leaveHandler.CreateLeave)
	mux.HandleFunc("GET /leaves", leaveHandler.GetLeaves)
	mux.HandleFunc("PATCH /leaves/{id}", leaveHandler.UpdateLeaveStatus)

	// Routes สำหรับ Payroll Deductions
	mux.HandleFunc("POST /payroll-deductions", deductionHandler.CreateDeduction)
	mux.HandleFunc("GET /payroll-deductions", deductionHandler.GetDeductions)

	// 5. เริ่มต้น Server (ครอบ mux ด้วย CORS)
	addr := fmt.Sprintf(":%s", port)
	log.Printf("Server กำลังทำงานที่ http://localhost%s\n", addr)
	if err := http.ListenAndServe(addr, withCORS(mux)); err != nil {
		log.Fatalf("Server หยุดทำงานเนื่องจากเกิดข้อผิดพลาด: %v", err)
	}
}

// withCORS อนุญาตให้ frontend (Vite ที่พอร์ต 5173) เรียก API ข้าม origin ได้
func withCORS(next http.Handler) http.Handler {
	allowed := map[string]bool{
		"http://127.0.0.1:5173": true,
		"http://localhost:5173": true,
		"http://127.0.0.1:5174": true,
		"http://localhost:5174": true,
	}

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")
		if allowed[origin] {
			w.Header().Set("Access-Control-Allow-Origin", origin)
			w.Header().Set("Vary", "Origin")
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		}

		// preflight request
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next.ServeHTTP(w, r)
	})
}