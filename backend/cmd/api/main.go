package main

import (
	"database/sql"
	"fmt"
	"log"
	"net/http"
	"os"

	_ "github.com/lib/pq"
	"backend/internal/employee"
	"backend/internal/payroll"
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

	// ใส่ต่อจาก if err = db.Ping(); err != nil { ... }
	createTableQuery := `
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

	if _, err := db.Exec(createTableQuery); err != nil {
		log.Fatalf("สร้าง Table employees ล้มเหลว: %v", err)
	}

	// 3. สร้าง Handler ของแต่ละโมดูล
	empHandler := employee.NewHandler(db)
	payHandler := payroll.NewHandler(db)

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

	// Routes สำหรับ Payroll
	mux.HandleFunc("POST /payroll", payHandler.CreatePayroll)

	// 5. เริ่มต้น Server
	addr := fmt.Sprintf(":%s", port)
	log.Printf("Server กำลังทำงานที่ http://localhost%s\n", addr)
	if err := http.ListenAndServe(addr, mux); err != nil {
		log.Fatalf("Server หยุดทำงานเนื่องจากเกิดข้อผิดพลาด: %v", err)
	}
}