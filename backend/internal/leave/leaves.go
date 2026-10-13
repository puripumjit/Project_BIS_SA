
package leave

import (
	"database/sql"
	"encoding/json"
	"net/http"
)

type Leave struct {
	ID         int     `json:"id"`
	EmployeeID int     `json:"employee_id"`
	LeaveType  string  `json:"leave_type"`
	StartDate  string  `json:"start_date"`
	EndDate    string  `json:"end_date"`
	Days       float64 `json:"days"`
	Reason     string  `json:"reason"`
	Status     string  `json:"status"`
	ApprovedBy *int    `json:"approved_by,omitempty"`
}

type Handler struct {
	db *sql.DB
}

func NewHandler(db *sql.DB) *Handler {
	return &Handler{db: db}
}

// POST /leaves
func (h *Handler) CreateLeave(w http.ResponseWriter, r *http.Request) {
	var l Leave
	if err := json.NewDecoder(r.Body).Decode(&l); err != nil {
		http.Error(w, "JSON ไม่ถูกต้อง", http.StatusBadRequest)
		return
	}

	if l.EmployeeID <= 0 || l.StartDate == "" ||
		l.EndDate == "" || l.Days <= 0 {
		http.Error(w, "กรุณากรอกข้อมูลการลาให้ครบ", http.StatusBadRequest)
		return
	}

	if l.LeaveType == "" {
		l.LeaveType = "OTHER"
	}
	if l.Status == "" {
		l.Status = "PENDING"
	}

	var id int
	err := h.db.QueryRow(`
		INSERT INTO leaves (
			employee_id, leave_type, start_date,
			end_date, days, reason, status, approved_by
		)
		VALUES ($1, $2, $3::date, $4::date, $5, $6, $7, $8)
		RETURNING id
	`, l.EmployeeID, l.LeaveType, l.StartDate,
		l.EndDate, l.Days, l.Reason, l.Status, l.ApprovedBy).
		Scan(&id)

	if err != nil {
		http.Error(w, "บันทึกข้อมูลการลาไม่สำเร็จ", http.StatusBadRequest)
		return
	}

	l.ID = id
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(l)
}

// GET /leaves
func (h *Handler) GetLeaves(w http.ResponseWriter, r *http.Request) {
	rows, err := h.db.Query(`
		SELECT id, employee_id, leave_type,
			start_date::text, end_date::text,
			days, COALESCE(reason, ''), status, approved_by
		FROM leaves
		ORDER BY start_date DESC, id DESC
	`)
	if err != nil {
		http.Error(w, "อ่านข้อมูลการลาไม่สำเร็จ", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	items := []Leave{}
	for rows.Next() {
		var l Leave
		var approvedBy sql.NullInt64

		if err := rows.Scan(
			&l.ID, &l.EmployeeID, &l.LeaveType,
			&l.StartDate, &l.EndDate, &l.Days,
			&l.Reason, &l.Status, &approvedBy,
		); err != nil {
			http.Error(w, "อ่านข้อมูลไม่สำเร็จ", http.StatusInternalServerError)
			return
		}

		if approvedBy.Valid {
			id := int(approvedBy.Int64)
			l.ApprovedBy = &id
		}
		items = append(items, l)
	}

	if err := rows.Err(); err != nil {
		http.Error(w, "อ่านข้อมูลไม่สำเร็จ", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(items)
}
