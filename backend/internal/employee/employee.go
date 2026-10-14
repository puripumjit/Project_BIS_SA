package employee

import (
	"database/sql"
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/lib/pq"
)

const (
	typePermanent = "ประจำ"
	typeFreelance = "ฟรีแลนซ์"

	defaultSmallRate = 800.0
	defaultLargeRate = 1000.0
)

// Model
type Employee struct {
	ID             int       `json:"id"`
	EmployeeCode   string    `json:"employee_code"`
	Prefix         string    `json:"prefix"`
	FirstName      string    `json:"first_name"`
	LastName       string    `json:"last_name"`
	Department     string    `json:"department"`
	Position       string    `json:"position"`
	EmploymentType string    `json:"employment_type"` // 'ประจำ' หรือ 'ฟรีแลนซ์'
	BaseSalary     float64   `json:"base_salary"`
	HourlyOTRate   float64   `json:"hourly_ot_rate"`
	BankName       string    `json:"bank_name"`
	BankAccountNo  string    `json:"bank_account_no"`
	Status         string    `json:"status"` // ประจำ: ACTIVE | RESIGNED, ฟรีแลนซ์: ACTIVE | FINISHED | CANCELLED
	Phone          string    `json:"phone"`
	Email          string    `json:"email"`
	Address        string    `json:"address"`
	StartDate      string    `json:"start_date"` // YYYY-MM-DD
	CreatedAt      time.Time `json:"created_at"`

	// เฉพาะฟรีแลนซ์ (งานรับเหมาเป็นตู้)
	WorkType      string  `json:"work_type"`      // SMALL | LARGE | BOTH
	SmallQty      int     `json:"small_qty"`      // จำนวนตู้เล็ก
	LargeQty      int     `json:"large_qty"`      // จำนวนตู้ใหญ่
	SmallRate     float64 `json:"small_rate"`     // บาท/ตู้เล็ก
	LargeRate     float64 `json:"large_rate"`     // บาท/ตู้ใหญ่
	PaymentStatus string  `json:"payment_status"` // PAID | UNPAID
}

type Handler struct {
	db *sql.DB
}

func NewHandler(db *sql.DB) *Handler {
	// เพิ่มคอลัมน์ที่ฟอร์มพนักงาน/ฟรีแลนซ์ต้องใช้ (ถ้ายังไม่มี)
	alters := []string{
		`ALTER TABLE employees ADD COLUMN IF NOT EXISTS phone VARCHAR(20)`,
		`ALTER TABLE employees ADD COLUMN IF NOT EXISTS email VARCHAR(100)`,
		`ALTER TABLE employees ADD COLUMN IF NOT EXISTS address TEXT`,
		`ALTER TABLE employees ADD COLUMN IF NOT EXISTS start_date DATE`,
		`ALTER TABLE employees ADD COLUMN IF NOT EXISTS work_type VARCHAR(10)`,
		`ALTER TABLE employees ADD COLUMN IF NOT EXISTS small_qty INT DEFAULT 0`,
		`ALTER TABLE employees ADD COLUMN IF NOT EXISTS large_qty INT DEFAULT 0`,
		`ALTER TABLE employees ADD COLUMN IF NOT EXISTS small_rate DECIMAL(10, 2) DEFAULT 800`,
		`ALTER TABLE employees ADD COLUMN IF NOT EXISTS large_rate DECIMAL(10, 2) DEFAULT 1000`,
		`ALTER TABLE employees ADD COLUMN IF NOT EXISTS payment_status VARCHAR(10) DEFAULT 'UNPAID'`,
	}
	for _, q := range alters {
		if _, err := db.Exec(q); err != nil {
			log.Printf("เพิ่มคอลัมน์ employees ไม่สำเร็จ: %v", err)
		}
	}
	return &Handler{db: db}
}

// ตรวจและเติมค่า default ให้ข้อมูลพนักงาน/ฟรีแลนซ์ คืนข้อความ error ถ้าข้อมูลไม่ถูกต้อง
func normalize(e *Employee) string {
	e.EmployeeCode = strings.TrimSpace(e.EmployeeCode)
	e.Prefix = strings.TrimSpace(e.Prefix)
	e.FirstName = strings.TrimSpace(e.FirstName)
	e.LastName = strings.TrimSpace(e.LastName)
	e.Department = strings.TrimSpace(e.Department)
	e.Position = strings.TrimSpace(e.Position)
	e.BankAccountNo = strings.TrimSpace(e.BankAccountNo)
	e.Phone = strings.TrimSpace(e.Phone)
	e.Email = strings.TrimSpace(e.Email)
	e.Address = strings.TrimSpace(e.Address)
	e.StartDate = strings.TrimSpace(e.StartDate)

	if e.EmploymentType == "" {
		e.EmploymentType = typePermanent
	}
	if e.EmploymentType != typePermanent && e.EmploymentType != typeFreelance {
		return "employment_type ต้องเป็น ประจำ หรือ ฟรีแลนซ์"
	}
	isFreelance := e.EmploymentType == typeFreelance

	if e.EmployeeCode == "" || e.FirstName == "" || e.LastName == "" {
		return "กรุณาระบุรหัส ชื่อ และนามสกุล"
	}
	if e.BaseSalary < 0 || e.HourlyOTRate < 0 {
		return "เงินเดือนและค่าล่วงเวลาต้องไม่ติดลบ"
	}
	if e.StartDate != "" {
		if _, err := time.Parse("2006-01-02", e.StartDate); err != nil {
			return "รูปแบบวันที่เริ่มงานต้องเป็น YYYY-MM-DD"
		}
	}

	if e.Prefix == "" {
		e.Prefix = "นาย"
	}
	if e.BankName == "" {
		e.BankName = "กสิกรไทย"
	}
	if e.Status == "" {
		e.Status = "ACTIVE"
	}

	if isFreelance {
		// ตารางบังคับให้มีแผนก/ตำแหน่ง ฟรีแลนซ์จึงใช้ค่าคงที่
		if e.Department == "" {
			e.Department = typeFreelance
		}
		if e.Position == "" {
			e.Position = typeFreelance
		}
		if e.Status != "ACTIVE" && e.Status != "FINISHED" && e.Status != "CANCELLED" {
			return "status ของฟรีแลนซ์ต้องเป็น ACTIVE, FINISHED หรือ CANCELLED"
		}

		if e.WorkType == "" {
			e.WorkType = "BOTH"
		}
		if e.WorkType != "SMALL" && e.WorkType != "LARGE" && e.WorkType != "BOTH" {
			return "work_type ต้องเป็น SMALL, LARGE หรือ BOTH"
		}
		if e.SmallQty < 0 || e.LargeQty < 0 {
			return "จำนวนตู้ต้องไม่ติดลบ"
		}
		if e.SmallRate <= 0 {
			e.SmallRate = defaultSmallRate
		}
		if e.LargeRate <= 0 {
			e.LargeRate = defaultLargeRate
		}
		// ประเภทงานที่ไม่ได้ทำ ไม่ควรมีจำนวนตู้
		if e.WorkType == "SMALL" {
			e.LargeQty = 0
		}
		if e.WorkType == "LARGE" {
			e.SmallQty = 0
		}
		if e.PaymentStatus == "" {
			e.PaymentStatus = "UNPAID"
		}
		if e.PaymentStatus != "PAID" && e.PaymentStatus != "UNPAID" {
			return "payment_status ต้องเป็น PAID หรือ UNPAID"
		}
		return ""
	}

	// พนักงานประจำ
	if e.Department == "" || e.Position == "" {
		return "กรุณาระบุแผนกและตำแหน่ง"
	}
	if e.Status != "ACTIVE" && e.Status != "RESIGNED" {
		return "status ต้องเป็น ACTIVE หรือ RESIGNED"
	}
	if e.PaymentStatus == "" {
		e.PaymentStatus = "UNPAID"
	}
	// คำนวณ hourly_ot_rate อัตโนมัติ หากไม่ได้ส่งมา
	// สูตรทั่วไป: (ฐานเงินเดือน / 30 / 8) * 1.5
	if e.HourlyOTRate == 0 && e.BaseSalary > 0 {
		e.HourlyOTRate = (e.BaseSalary / 240.0) * 1.5
	}
	return ""
}

// แปลง error ของฐานข้อมูลเป็นข้อความที่ผู้ใช้เข้าใจ
func writeDBError(w http.ResponseWriter, err error, fallback string) {
	var pqErr *pq.Error
	if errors.As(err, &pqErr) {
		switch pqErr.Code {
		case "23505":
			http.Error(w, "รหัสนี้มีอยู่ในระบบแล้ว", http.StatusConflict)
			return
		case "23503":
			http.Error(w, "ดำเนินการไม่ได้ เพราะมีข้อมูลอื่นอ้างอิงรายการนี้อยู่", http.StatusConflict)
			return
		}
	}
	log.Printf("%s: %v", fallback, err)
	http.Error(w, fallback, http.StatusInternalServerError)
}

// Handler: POST /employees
func (h *Handler) CreateEmployee(w http.ResponseWriter, r *http.Request) {
	var emp Employee
	if err := json.NewDecoder(r.Body).Decode(&emp); err != nil {
		http.Error(w, "JSON ไม่ถูกต้อง: "+err.Error(), http.StatusBadRequest)
		return
	}
	if msg := normalize(&emp); msg != "" {
		http.Error(w, msg, http.StatusBadRequest)
		return
	}

	query := `
		INSERT INTO employees (
			employee_code, prefix, first_name, last_name, department,
			position, employment_type, base_salary, hourly_ot_rate,
			bank_name, bank_account_no, status,
			phone, email, address, start_date,
			work_type, small_qty, large_qty, small_rate, large_rate, payment_status
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12,
			$13, $14, $15, NULLIF($16::text, '')::date,
			NULLIF($17::text, ''), $18, $19, $20, $21, $22)
		RETURNING id, created_at
	`
	err := h.db.QueryRow(query,
		emp.EmployeeCode, emp.Prefix, emp.FirstName, emp.LastName,
		emp.Department, emp.Position, emp.EmploymentType, emp.BaseSalary,
		emp.HourlyOTRate, emp.BankName, emp.BankAccountNo, emp.Status,
		emp.Phone, emp.Email, emp.Address, emp.StartDate,
		emp.WorkType, emp.SmallQty, emp.LargeQty, emp.SmallRate, emp.LargeRate, emp.PaymentStatus,
	).Scan(&emp.ID, &emp.CreatedAt)
	if err != nil {
		writeDBError(w, err, "บันทึกข้อมูลล้มเหลว")
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(emp)
}

// Handler: GET /employees (ดึงข้อมูลครบทุกคอลัมน์)
func (h *Handler) GetEmployees(w http.ResponseWriter, r *http.Request) {
	query := `
		SELECT
			id, employee_code, prefix, first_name, last_name,
			department, position, employment_type, base_salary,
			hourly_ot_rate, bank_name, bank_account_no, status,
			COALESCE(phone, ''), COALESCE(email, ''), COALESCE(address, ''),
			COALESCE(start_date::text, ''),
			created_at,
			COALESCE(work_type, ''), COALESCE(small_qty, 0), COALESCE(large_qty, 0),
			COALESCE(small_rate, 800), COALESCE(large_rate, 1000),
			COALESCE(payment_status, 'UNPAID')
		FROM employees
		ORDER BY id ASC
	`
	rows, err := h.db.Query(query)
	if err != nil {
		http.Error(w, "ดึงข้อมูลล้มเหลว: "+err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	employees := make([]Employee, 0)
	for rows.Next() {
		var e Employee
		err := rows.Scan(
			&e.ID, &e.EmployeeCode, &e.Prefix, &e.FirstName, &e.LastName,
			&e.Department, &e.Position, &e.EmploymentType, &e.BaseSalary,
			&e.HourlyOTRate, &e.BankName, &e.BankAccountNo, &e.Status,
			&e.Phone, &e.Email, &e.Address, &e.StartDate,
			&e.CreatedAt,
			&e.WorkType, &e.SmallQty, &e.LargeQty,
			&e.SmallRate, &e.LargeRate,
			&e.PaymentStatus,
		)
		if err != nil {
			http.Error(w, "แปลงข้อมูลล้มเหลว: "+err.Error(), http.StatusInternalServerError)
			return
		}
		employees = append(employees, e)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(employees)
}

// Handler: PUT /employees/{id}  (แก้ไขข้อมูล)
func (h *Handler) UpdateEmployee(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(r.PathValue("id"))
	if err != nil || id <= 0 {
		http.Error(w, "id ไม่ถูกต้อง", http.StatusBadRequest)
		return
	}

	var emp Employee
	if err := json.NewDecoder(r.Body).Decode(&emp); err != nil {
		http.Error(w, "JSON ไม่ถูกต้อง: "+err.Error(), http.StatusBadRequest)
		return
	}
	if msg := normalize(&emp); msg != "" {
		http.Error(w, msg, http.StatusBadRequest)
		return
	}

	res, err := h.db.Exec(`
		UPDATE employees SET
			employee_code = $1, prefix = $2, first_name = $3, last_name = $4,
			department = $5, position = $6, employment_type = $7,
			base_salary = $8, hourly_ot_rate = $9, bank_name = $10,
			bank_account_no = $11, status = $12,
			phone = $13, email = $14, address = $15,
			start_date = NULLIF($16::text, '')::date,
			work_type = NULLIF($17::text, ''), small_qty = $18, large_qty = $19,
			small_rate = $20, large_rate = $21, payment_status = $22
		WHERE id = $23
	`,
		emp.EmployeeCode, emp.Prefix, emp.FirstName, emp.LastName,
		emp.Department, emp.Position, emp.EmploymentType,
		emp.BaseSalary, emp.HourlyOTRate, emp.BankName,
		emp.BankAccountNo, emp.Status,
		emp.Phone, emp.Email, emp.Address, emp.StartDate,
		emp.WorkType, emp.SmallQty, emp.LargeQty,
		emp.SmallRate, emp.LargeRate, emp.PaymentStatus,
		id,
	)
	if err != nil {
		writeDBError(w, err, "แก้ไขข้อมูลล้มเหลว")
		return
	}
	if n, _ := res.RowsAffected(); n == 0 {
		http.Error(w, "ไม่พบรายการนี้", http.StatusNotFound)
		return
	}

	emp.ID = id
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(emp)
}

// Handler: DELETE /employees/{id}
// หมายเหตุ: ตารางที่ตั้ง ON DELETE CASCADE (เช่น attendance) จะถูกลบข้อมูลของรายการนี้ไปด้วย
func (h *Handler) DeleteEmployee(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(r.PathValue("id"))
	if err != nil || id <= 0 {
		http.Error(w, "id ไม่ถูกต้อง", http.StatusBadRequest)
		return
	}

	res, err := h.db.Exec(`DELETE FROM employees WHERE id = $1`, id)
	if err != nil {
		writeDBError(w, err, "ลบข้อมูลล้มเหลว")
		return
	}
	if n, _ := res.RowsAffected(); n == 0 {
		http.Error(w, "ไม่พบรายการนี้", http.StatusNotFound)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
