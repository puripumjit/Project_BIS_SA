
package attendance

import (
	"database/sql"
	"encoding/json"
	"net/http"
)

type Attendance struct {
	ID        int     `json:"id"`
	EmployeeID int    `json:"employee_id"`
	WorkDate  string  `json:"work_date"`
	CheckIn   string  `json:"check_in"`
	CheckOut  string  `json:"check_out"`
	WorkHours float64 `json:"work_hours"`
	OTHours   float64 `json:"ot_hours"`
	Status    string  `json:"status"`
}

type Handler struct {
	db *sql.DB
}

func NewHandler(db *sql.DB) *Handler {
	return &Handler{db: db}
}

// POST /attendance
func (h *Handler) CreateAttendance(w http.ResponseWriter, r *http.Request) {
	var a Attendance
	if err := json.NewDecoder(r.Body).Decode(&a); err != nil {
		http.Error(w, "JSON ไม่ถูกต้อง", http.StatusBadRequest)
		return
	}

	if a.WorkDate == "" || a.EmployeeID <= 0 {
		http.Error(w, "กรุณาระบุ employee_id และ work_date", http.StatusBadRequest)
		return
	}

	if a.Status == "" {
		a.Status = "NORMAL"
	}

	var id int
	err := h.db.QueryRow(`
		INSERT INTO attendance (
			employee_id, work_date, check_in, check_out,
			work_hours, ot_hours, status
		)
		VALUES (
			$1, $2::date, NULLIF($3, '')::time,
			NULLIF($4, '')::time, $5, $6, $7
		)
		RETURNING id
	`, a.EmployeeID, a.WorkDate, a.CheckIn, a.CheckOut,
		a.WorkHours, a.OTHours, a.Status).Scan(&id)

	if err != nil {
		http.Error(w, "บันทึกเวลาเข้างานไม่สำเร็จ", http.StatusBadRequest)
		return
	}

	a.ID = id
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(a)
}

// GET /attendance
func (h *Handler) GetAttendance(w http.ResponseWriter, r *http.Request) {
	rows, err := h.db.Query(`
		SELECT id, employee_id, work_date::text,
			COALESCE(to_char(check_in, 'HH24:MI:SS'), ''),
			COALESCE(to_char(check_out, 'HH24:MI:SS'), ''),
			work_hours, ot_hours, status
		FROM attendance
		ORDER BY work_date DESC, id DESC
	`)
	if err != nil {
		http.Error(w, "อ่านข้อมูลเข้างานไม่สำเร็จ", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	items := []Attendance{}
	for rows.Next() {
		var a Attendance
		if err := rows.Scan(
			&a.ID, &a.EmployeeID, &a.WorkDate,
			&a.CheckIn, &a.CheckOut, &a.WorkHours,
			&a.OTHours, &a.Status,
		); err != nil {
			http.Error(w, "อ่านข้อมูลไม่สำเร็จ", http.StatusInternalServerError)
			return
		}
		items = append(items, a)
	}

	if err := rows.Err(); err != nil {
		http.Error(w, "อ่านข้อมูลไม่สำเร็จ", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(items)
}
