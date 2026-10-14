package leave

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"
)

type Leave struct {
	ID           int     `json:"id"`
	EmployeeID   int     `json:"employee_id"`
	LeaveType    string  `json:"leave_type"`
	StartDate    string  `json:"start_date"`
	EndDate      string  `json:"end_date"`
	Days         float64 `json:"days"`
	Reason       string  `json:"reason"`
	Status       string  `json:"status"`
	ApprovalNote string  `json:"approval_note"`
	ApprovedBy   *int    `json:"approved_by"`
	ApprovedAt   *string `json:"approved_at"`
	CreatedAt    string  `json:"created_at"`
}

type Handler struct {
	db *sql.DB
}

func NewHandler(db *sql.DB) *Handler {
	// เพิ่มคอลัมน์เก็บหมายเหตุการอนุมัติ/ปฏิเสธ (ถ้ายังไม่มี)
	if _, err := db.Exec(`ALTER TABLE leaves ADD COLUMN IF NOT EXISTS approval_note TEXT`); err != nil {
		log.Printf("เพิ่มคอลัมน์ approval_note ไม่สำเร็จ: %v", err)
	}
	return &Handler{db: db}
}

var validLeaveTypes = map[string]bool{
	"SICK": true, "PERSONAL": true, "VACATION": true, "OTHER": true,
}

// POST /leaves  (สร้างใบลาใหม่ สถานะเริ่มต้นเป็น PENDING เสมอ)
func (h *Handler) CreateLeave(w http.ResponseWriter, r *http.Request) {
	var l Leave
	if err := json.NewDecoder(r.Body).Decode(&l); err != nil {
		http.Error(w, "JSON ไม่ถูกต้อง", http.StatusBadRequest)
		return
	}

	if l.EmployeeID <= 0 || l.StartDate == "" || l.EndDate == "" {
		http.Error(w, "กรุณาระบุ employee_id, start_date และ end_date", http.StatusBadRequest)
		return
	}

	if !validLeaveTypes[l.LeaveType] {
		http.Error(w, "leave_type ต้องเป็น SICK, PERSONAL, VACATION หรือ OTHER", http.StatusBadRequest)
		return
	}

	start, err1 := time.Parse("2006-01-02", l.StartDate)
	end, err2 := time.Parse("2006-01-02", l.EndDate)
	if err1 != nil || err2 != nil {
		http.Error(w, "รูปแบบวันที่ต้องเป็น YYYY-MM-DD", http.StatusBadRequest)
		return
	}
	if end.Before(start) {
		http.Error(w, "end_date ต้องไม่ก่อน start_date", http.StatusBadRequest)
		return
	}

	// ถ้าไม่ระบุจำนวนวัน ให้คำนวณจากช่วงวันที่ (นับรวมวันแรกและวันสุดท้าย)
	if l.Days <= 0 {
		l.Days = float64(int(end.Sub(start).Hours()/24) + 1)
	}

	l.Status = "PENDING"

	err := h.db.QueryRow(`
		INSERT INTO leaves (
			employee_id, leave_type, start_date, end_date,
			days, reason, status
		)
		VALUES ($1, $2, $3::date, $4::date, $5, $6, $7)
		RETURNING id, to_char(created_at, 'YYYY-MM-DD HH24:MI:SS')
	`, l.EmployeeID, l.LeaveType, l.StartDate, l.EndDate,
		l.Days, l.Reason, l.Status).Scan(&l.ID, &l.CreatedAt)

	if err != nil {
		log.Printf("CreateLeave error: %v", err)
		http.Error(w, "บันทึกการลาไม่สำเร็จ", http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(l)
}

// GET /leaves
func (h *Handler) GetLeaves(w http.ResponseWriter, r *http.Request) {
	rows, err := h.db.Query(`
		SELECT id, employee_id, leave_type,
			start_date::text, end_date::text,
			days, COALESCE(reason, ''), status,
			COALESCE(approval_note, ''),
			approved_by,
			to_char(approved_at, 'YYYY-MM-DD HH24:MI:SS'),
			to_char(created_at, 'YYYY-MM-DD HH24:MI:SS')
		FROM leaves
		ORDER BY start_date ASC, id ASC
	`)
	if err != nil {
		log.Printf("GetLeaves query error: %v", err)
		http.Error(w, "อ่านข้อมูลการลาไม่สำเร็จ", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	items := []Leave{}
	for rows.Next() {
		var l Leave
		var approvedBy sql.NullInt64
		var approvedAt sql.NullString

		if err := rows.Scan(
			&l.ID, &l.EmployeeID, &l.LeaveType,
			&l.StartDate, &l.EndDate,
			&l.Days, &l.Reason, &l.Status,
			&l.ApprovalNote,
			&approvedBy, &approvedAt, &l.CreatedAt,
		); err != nil {
			log.Printf("GetLeaves scan error: %v", err)
			http.Error(w, "อ่านข้อมูลไม่สำเร็จ", http.StatusInternalServerError)
			return
		}

		if approvedBy.Valid {
			v := int(approvedBy.Int64)
			l.ApprovedBy = &v
		}
		if approvedAt.Valid {
			v := approvedAt.String
			l.ApprovedAt = &v
		}

		items = append(items, l)
	}

	if err := rows.Err(); err != nil {
		log.Printf("GetLeaves rows error: %v", err)
		http.Error(w, "อ่านข้อมูลไม่สำเร็จ", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(items)
}

// PATCH /leaves/{id}  body: {"status":"APPROVED"|"REJECTED","note":"..."}
// เปลี่ยนได้เฉพาะใบลาที่ยัง PENDING
func (h *Handler) UpdateLeaveStatus(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(r.PathValue("id"))
	if err != nil || id <= 0 {
		http.Error(w, "id ไม่ถูกต้อง", http.StatusBadRequest)
		return
	}

	var body struct {
		Status string `json:"status"`
		Note   string `json:"note"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "JSON ไม่ถูกต้อง", http.StatusBadRequest)
		return
	}

	body.Status = strings.ToUpper(strings.TrimSpace(body.Status))
	if body.Status != "APPROVED" && body.Status != "REJECTED" {
		http.Error(w, "status ต้องเป็น APPROVED หรือ REJECTED", http.StatusBadRequest)
		return
	}
	note := strings.TrimSpace(body.Note)

	res, err := h.db.Exec(`
		UPDATE leaves
		SET status = $1, approval_note = $2, approved_at = NOW()
		WHERE id = $3 AND status = 'PENDING'
	`, body.Status, note, id)
	if err != nil {
		log.Printf("UpdateLeaveStatus error: %v", err)
		http.Error(w, "อัปเดตสถานะไม่สำเร็จ", http.StatusInternalServerError)
		return
	}

	if n, _ := res.RowsAffected(); n == 0 {
		var exists bool
		_ = h.db.QueryRow(`SELECT EXISTS(SELECT 1 FROM leaves WHERE id = $1)`, id).Scan(&exists)
		if !exists {
			http.Error(w, "ไม่พบใบลานี้", http.StatusNotFound)
		} else {
			http.Error(w, "ใบลานี้ถูกดำเนินการไปแล้ว", http.StatusConflict)
		}
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]any{"id": id, "status": body.Status})
}