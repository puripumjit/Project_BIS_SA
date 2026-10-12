package payroll

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"time"
)

// Model
type PayrollItem struct {
	ID                   int       `json:"id"`
	EmployeeCode         string    `json:"employee_code"`
	Period               string    `json:"period"`
	OTHours              float64   `json:"ot_hours"`
	OTAmount             float64   `json:"ot_amount"`
	OtherIncome          float64   `json:"other_income"`
	LateAbsenceDeduction float64   `json:"late_absence_deduction"`
	TaxAmount            float64   `json:"tax_amount"`
	SocialSecurity       float64   `json:"social_security"`
	OtherDeduction       float64   `json:"other_deduction"`
	Status               string    `json:"status"`
	CreatedAt            time.Time `json:"created_at"`
}

type Handler struct {
	db *sql.DB
}

func NewHandler(db *sql.DB) *Handler {
	return &Handler{db: db}
}

// Handler: POST /payroll
func (h *Handler) CreatePayroll(w http.ResponseWriter, r *http.Request) {
	var item PayrollItem
	if err := json.NewDecoder(r.Body).Decode(&item); err != nil {
		http.Error(w, "JSON ไม่ถูกต้อง", http.StatusBadRequest)
		return
	}

	// ค้นหา hourly_ot_rate ของพนักงานเพื่อคำนวณ
	var hourlyRate float64
	err := h.db.QueryRow("SELECT hourly_ot_rate FROM employees WHERE employee_code = $1", item.EmployeeCode).Scan(&hourlyRate)
	if err != nil {
		http.Error(w, "ไม่พบรหัสพนักงานนี้", http.StatusNotFound)
		return
	}

	if item.OTHours > 0 && item.OTAmount == 0 {
		item.OTAmount = item.OTHours * hourlyRate
	}
	if item.Status == "" {
		item.Status = "CALCULATED"
	}

	query := `
		INSERT INTO payroll_items (
			employee_code, period, ot_hours, ot_amount, other_income,
			late_absence_deduction, tax_amount, social_security, 
			other_deduction, status
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
		RETURNING id, created_at
	`
	err = h.db.QueryRow(query,
		item.EmployeeCode, item.Period, item.OTHours, item.OTAmount,
		item.OtherIncome, item.LateAbsenceDeduction, item.TaxAmount,
		item.SocialSecurity, item.OtherDeduction, item.Status,
	).Scan(&item.ID, &item.CreatedAt)

	if err != nil {
		http.Error(w, "บันทึก Payroll ล้มเหลว: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(item)
}