package employee

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"time"
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
	EmploymentType string    `json:"employment_type"`
	BaseSalary     float64   `json:"base_salary"`
	HourlyOTRate   float64   `json:"hourly_ot_rate"`
	BankName       string    `json:"bank_name"`
	BankAccountNo  string    `json:"bank_account_no"`
	Status         string    `json:"status"`
	CreatedAt      time.Time `json:"created_at"`
}

// Controller / Service รวมกับ DB
type Handler struct {
	db *sql.DB
}

func NewHandler(db *sql.DB) *Handler {
	return &Handler{db: db}
}

// Handler: POST /employees
func (h *Handler) CreateEmployee(w http.ResponseWriter, r *http.Request) {
	var emp Employee
	if err := json.NewDecoder(r.Body).Decode(&emp); err != nil {
		http.Error(w, "JSON ไม่ถูกต้อง", http.StatusBadRequest)
		return
	}

	if emp.Prefix == "" { emp.Prefix = "นาย" }
	if emp.BankName == "" { emp.BankName = "กสิกรไทย" }
	if emp.Status == "" { emp.Status = "ACTIVE" }

	query := `
		INSERT INTO employees (
			employee_code, prefix, first_name, last_name, department, 
			position, employment_type, base_salary, hourly_ot_rate, 
			bank_name, bank_account_no, status
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
		RETURNING id, created_at
	`
	err := h.db.QueryRow(query,
		emp.EmployeeCode, emp.Prefix, emp.FirstName, emp.LastName,
		emp.Department, emp.Position, emp.EmploymentType, emp.BaseSalary,
		emp.HourlyOTRate, emp.BankName, emp.BankAccountNo, emp.Status,
	).Scan(&emp.ID, &emp.CreatedAt)

	if err != nil {
		http.Error(w, "บันทึกข้อมูลพนักงานล้มเหลว: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(emp)
}

// Handler: GET /employees
func (h *Handler) GetEmployees(w http.ResponseWriter, r *http.Request) {
	rows, err := h.db.Query("SELECT id, employee_code, first_name, last_name, department, position, base_salary FROM employees")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var employees []Employee
	for rows.Next() {
		var e Employee
		if err := rows.Scan(&e.ID, &e.EmployeeCode, &e.FirstName, &e.LastName, &e.Department, &e.Position, &e.BaseSalary); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		employees = append(employees, e)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(employees)
}