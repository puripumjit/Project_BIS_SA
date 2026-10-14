package payroll_deduction

import (
	"database/sql"
	"encoding/json"
	"errors"
	"log"
	"net/http"

	"github.com/lib/pq"
)

type Handler struct {
	db *sql.DB
}

func NewHandler(db *sql.DB) *Handler {
	return &Handler{db: db}
}

type PayrollDeduction struct {
	ID             int     `json:"id"`
	EmployeeID     int     `json:"employee_id"`
	EmployeeCode   string  `json:"employee_code,omitempty"`
	Prefix         string  `json:"prefix,omitempty"`
	FirstName      string  `json:"first_name,omitempty"`
	LastName       string  `json:"last_name,omitempty"`
	Department     string  `json:"department,omitempty"`
	EmploymentType string  `json:"employment_type,omitempty"`
	Period         string  `json:"period"`
	DeductionType  string  `json:"deduction_type"`
	Amount         float64 `json:"amount"`
	Note           string  `json:"note"`
	CreatedAt      string  `json:"created_at"`
}

type createDeductionRequest struct {
	EmployeeID    int     `json:"employee_id"`
	Period        string  `json:"period"`
	DeductionType string  `json:"deduction_type"`
	Amount        float64 `json:"amount"`
	Note          string  `json:"note"`
}

var validTypes = map[string]bool{
	"LOAN":           true,
	"PROVIDENT_FUND": true,
	"UNIFORM":        true,
	"DAMAGE":         true,
	"OTHER":          true,
}

// GET /payroll-deductions?period=2026-10
func (h *Handler) GetDeductions(w http.ResponseWriter, r *http.Request) {
	period := r.URL.Query().Get("period") // ว่าง = ทุกงวด

	rows, err := h.db.Query(`
		SELECT d.id, d.employee_id,
			COALESCE(e.employee_code, ''), COALESCE(e.prefix, ''),
			COALESCE(e.first_name, ''), COALESCE(e.last_name, ''),
			COALESCE(e.department, ''), COALESCE(e.employment_type, ''),
			d.period, d.deduction_type, d.amount,
			COALESCE(d.note, ''), d.created_at
		FROM payroll_deductions d
		JOIN employees e ON e.id = d.employee_id
		WHERE ($1::text = '' OR d.period = $1::text)
			ORDER BY e.employee_code ASC, d.id ASC
	`, period)
	if err != nil {
		log.Printf("GetDeductions query error: %v", err)
		http.Error(w, "อ่านรายการหักเงินเดือนไม่สำเร็จ", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	items := []PayrollDeduction{}
	for rows.Next() {
		var d PayrollDeduction
		if err := rows.Scan(
			&d.ID, &d.EmployeeID,
			&d.EmployeeCode, &d.Prefix, &d.FirstName, &d.LastName,
			&d.Department, &d.EmploymentType,
			&d.Period, &d.DeductionType, &d.Amount, &d.Note, &d.CreatedAt,
		); err != nil {
			log.Printf("GetDeductions scan error: %v", err)
			http.Error(w, "อ่านข้อมูลไม่สำเร็จ", http.StatusInternalServerError)
			return
		}
		items = append(items, d)
	}
	if err := rows.Err(); err != nil {
		log.Printf("GetDeductions rows error: %v", err)
		http.Error(w, "อ่านข้อมูลไม่สำเร็จ", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(items)
}

// POST /payroll-deductions
func (h *Handler) CreateDeduction(w http.ResponseWriter, r *http.Request) {
	var in createDeductionRequest
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		http.Error(w, "รูปแบบข้อมูลไม่ถูกต้อง", http.StatusBadRequest)
		return
	}
	if in.EmployeeID <= 0 {
		http.Error(w, "กรุณาเลือกพนักงาน", http.StatusBadRequest)
		return
	}
	if !validTypes[in.DeductionType] {
		http.Error(w, "ประเภทการหักไม่ถูกต้อง", http.StatusBadRequest)
		return
	}
	if in.Amount <= 0 {
		http.Error(w, "จำนวนเงินต้องมากกว่า 0", http.StatusBadRequest)
		return
	}

	tx, err := h.db.BeginTx(r.Context(), nil)
	if err != nil {
		log.Printf("CreateDeduction begin error: %v", err)
		http.Error(w, "เริ่มบันทึกไม่สำเร็จ", http.StatusInternalServerError)
		return
	}
	defer tx.Rollback()

	// สร้างแถวเงินเดือนของงวดนี้ถ้ายังไม่มี (จำเป็นเพราะ FK ของ payroll_deductions)
	if _, err := tx.Exec(`
		INSERT INTO payroll_items (employee_id, period)
		VALUES ($1, $2)
		ON CONFLICT (employee_id, period) DO NOTHING`,
		in.EmployeeID, in.Period); err != nil {
		log.Printf("CreateDeduction payroll_items error: %v", err)
		var pqErr *pq.Error
		if errors.As(err, &pqErr) && (pqErr.Code == "23503" || pqErr.Code == "23514") {
			http.Error(w, "ไม่พบพนักงานหรือรอบเงินเดือนไม่ถูกต้อง", http.StatusBadRequest)
			return
		}
		http.Error(w, "บันทึกไม่สำเร็จ", http.StatusInternalServerError)
		return
	}

	var id int
	if err := tx.QueryRow(`
		INSERT INTO payroll_deductions (employee_id, period, deduction_type, amount, note)
		VALUES ($1, $2, $3, $4, $5) RETURNING id`,
		in.EmployeeID, in.Period, in.DeductionType, in.Amount, in.Note).Scan(&id); err != nil {
		log.Printf("CreateDeduction insert error: %v", err)
		http.Error(w, "บันทึกไม่สำเร็จ", http.StatusInternalServerError)
		return
	}

	if err := tx.Commit(); err != nil {
		log.Printf("CreateDeduction commit error: %v", err)
		http.Error(w, "บันทึกไม่สำเร็จ", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]int{"id": id})
}