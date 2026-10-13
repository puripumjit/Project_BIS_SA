
package payroll_deduction

import (
	"database/sql"
	"encoding/json"
	"net/http"
)

type PayrollDeduction struct {
	ID            int     `json:"id"`
	EmployeeID    int     `json:"employee_id"`
	Period        string  `json:"period"`
	DeductionType string  `json:"deduction_type"`
	Amount        float64 `json:"amount"`
	Note          string  `json:"note"`
	CreatedAt     string  `json:"created_at"`
}

type Handler struct {
	db *sql.DB
}

func NewHandler(db *sql.DB) *Handler {
	return &Handler{db: db}
}

// POST /payroll-deductions
func (h *Handler) CreateDeduction(w http.ResponseWriter, r *http.Request) {
	var d PayrollDeduction
	if err := json.NewDecoder(r.Body).Decode(&d); err != nil {
		http.Error(w, "JSON ไม่ถูกต้อง", http.StatusBadRequest)
		return
	}

	if d.EmployeeID <= 0 || d.Period == "" ||
		d.DeductionType == "" || d.Amount <= 0 {
		http.Error(w, "กรุณากรอกข้อมูลรายการหักให้ครบ", http.StatusBadRequest)
		return
	}

	var id int
	var createdAt string

	err := h.db.QueryRow(`
		INSERT INTO payroll_deductions (
			employee_id, period, deduction_type, amount, note
		)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id, created_at
	`, d.EmployeeID, d.Period, d.DeductionType,
		d.Amount, d.Note).Scan(&id, &createdAt)

	if err != nil {
		http.Error(w, "บันทึกรายการหักเงินเดือนไม่สำเร็จ", http.StatusBadRequest)
		return
	}

	d.ID = id
	d.CreatedAt = createdAt

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(d)
}

// GET /payroll-deductions
func (h *Handler) GetDeductions(w http.ResponseWriter, r *http.Request) {
	rows, err := h.db.Query(`
		SELECT id, employee_id, period, deduction_type,
			amount, COALESCE(note, ''), created_at
		FROM payroll_deductions
		ORDER BY period DESC, id DESC
	`)
	if err != nil {
		http.Error(w, "อ่านรายการหักเงินเดือนไม่สำเร็จ", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	items := []PayrollDeduction{}
	for rows.Next() {
		var d PayrollDeduction
		if err := rows.Scan(
			&d.ID, &d.EmployeeID, &d.Period,
			&d.DeductionType, &d.Amount,
			&d.Note, &d.CreatedAt,
		); err != nil {
			http.Error(w, "อ่านข้อมูลไม่สำเร็จ", http.StatusInternalServerError)
			return
		}
		items = append(items, d)
	}

	if err := rows.Err(); err != nil {
		http.Error(w, "อ่านข้อมูลไม่สำเร็จ", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(items)
}
