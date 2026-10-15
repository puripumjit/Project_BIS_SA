package payroll

import (
	"database/sql"
	"encoding/json"
	"math"
	"net/http"
	"strconv"
	"strings"
	"time"
)

type Handler struct {
	db *sql.DB
}

func NewHandler(db *sql.DB) *Handler {
	return &Handler{db: db}
}

// ---------- Models ----------

// แถวเงินเดือน 1 รายการ (join กับข้อมูลพนักงาน + คำนวณยอดรวมให้แล้ว)
type PayrollRow struct {
	ID             int    `json:"id"`
	EmployeeID     int    `json:"employee_id"`
	EmployeeCode   string `json:"employee_code"`
	Prefix         string `json:"prefix"`
	FirstName      string `json:"first_name"`
	LastName       string `json:"last_name"`
	Department     string `json:"department"`
	Position       string `json:"position"`
	EmploymentType string `json:"employment_type"`
	Period         string `json:"period"`

	BaseSalary     float64 `json:"base_salary"`
	OTHours        float64 `json:"ot_hours"`
	OTAmount       float64 `json:"ot_amount"`
	SmallPanelQty  int     `json:"small_panel_qty"`
	SmallPanelRate float64 `json:"small_panel_rate"`
	LargePanelQty  int     `json:"large_panel_qty"`
	LargePanelRate float64 `json:"large_panel_rate"`
	PanelIncome    float64 `json:"panel_income"` // ค่าตู้ฟรีแลนซ์ = เล็ก*เรท + ใหญ่*เรท
	OtherIncome    float64 `json:"other_income"`

	LateAbsenceDeduction float64 `json:"late_absence_deduction"`
	TaxAmount            float64 `json:"tax_amount"`
	SocialSecurity       float64 `json:"social_security"`
	OtherDeduction       float64 `json:"other_deduction"`
	ExtraDeduction       float64 `json:"extra_deduction"` // รวมจากตาราง payroll_deductions

	GrossIncome    float64   `json:"gross_income"`
	TotalDeduction float64   `json:"total_deduction"`
	NetPay         float64   `json:"net_pay"`
	Status         string    `json:"status"`
	CreatedAt      time.Time `json:"created_at"`
}

type DeductionRow struct {
	Type   string  `json:"deduction_type"`
	Amount float64 `json:"amount"`
	Note   string  `json:"note"`
}

// ---------- Helpers ----------

func respondJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(v)
}

func round2(v float64) float64 {
	return math.Round(v*100) / 100
}

func validStatus(s string) bool {
	return s == "DRAFT" || s == "APPROVED" || s == "PAID"
}

// ดึง id จาก path เช่น /payroll/5 หรือ /payroll/5/status (ไม่ผูกกับเวอร์ชัน Go หรือ prefix ของ API)
func payrollIDFromPath(path string) (int, bool) {
	parts := strings.Split(strings.Trim(path, "/"), "/")
	for i, p := range parts {
		  if (p == "payroll" || p == "payrolltax") && i+1 < len(parts) {
			id, err := strconv.Atoi(parts[i+1])
			return id, err == nil && id > 0
		}
	}
	return 0, false
}

const rowSelect = `
	SELECT p.id, p.employee_id, e.employee_code, COALESCE(e.prefix, ''),
	       e.first_name, e.last_name, e.department, e.position, e.employment_type,
	       p.period, e.base_salary, p.ot_hours, p.ot_amount,
	       p.small_panel_qty, p.small_panel_rate, p.large_panel_qty, p.large_panel_rate,
	       p.other_income, p.late_absence_deduction, p.tax_amount,
	       p.social_security, p.other_deduction,
	       COALESCE(d.total, 0), p.status, p.created_at
	FROM payroll_items p
	JOIN employees e ON e.id = p.employee_id
	LEFT JOIN (
		SELECT employee_id, period, SUM(amount) AS total
		FROM payroll_deductions
		GROUP BY employee_id, period
	) d ON d.employee_id = p.employee_id AND d.period = p.period
`

type scanner interface {
	Scan(dest ...any) error
}

func scanRow(s scanner) (PayrollRow, error) {
	var r PayrollRow
	err := s.Scan(
		&r.ID, &r.EmployeeID, &r.EmployeeCode, &r.Prefix,
		&r.FirstName, &r.LastName, &r.Department, &r.Position, &r.EmploymentType,
		&r.Period, &r.BaseSalary, &r.OTHours, &r.OTAmount,
		&r.SmallPanelQty, &r.SmallPanelRate, &r.LargePanelQty, &r.LargePanelRate,
		&r.OtherIncome, &r.LateAbsenceDeduction, &r.TaxAmount,
		&r.SocialSecurity, &r.OtherDeduction,
		&r.ExtraDeduction, &r.Status, &r.CreatedAt,
	)
	if err != nil {
		return r, err
	}
	r.PanelIncome = round2(float64(r.SmallPanelQty)*r.SmallPanelRate + float64(r.LargePanelQty)*r.LargePanelRate)
	r.GrossIncome = round2(r.BaseSalary + r.OTAmount + r.PanelIncome + r.OtherIncome)
	r.TotalDeduction = round2(r.LateAbsenceDeduction + r.TaxAmount + r.SocialSecurity + r.OtherDeduction + r.ExtraDeduction)
	r.NetPay = round2(r.GrossIncome - r.TotalDeduction)
	return r, nil
}

func (h *Handler) listPeriods() ([]string, error) {
	rows, err := h.db.Query(`SELECT DISTINCT period FROM payroll_items ORDER BY period DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	periods := []string{}
	for rows.Next() {
		var p string
		if err := rows.Scan(&p); err != nil {
			return nil, err
		}
		periods = append(periods, p)
	}
	return periods, rows.Err()
}

// ---------- Handlers ----------

// GET /payroll?period=2026-09  (ไม่ใส่ period = งวดล่าสุด)
func (h *Handler) GetPayrollSummary(w http.ResponseWriter, r *http.Request) {
	periods, err := h.listPeriods()
	if err != nil {
		http.Error(w, "โหลดงวดเงินเดือนล้มเหลว: "+err.Error(), http.StatusInternalServerError)
		return
	}

	period := r.URL.Query().Get("period")
	if period == "" && len(periods) > 0 {
		period = periods[0]
	}

	items := []PayrollRow{}
	if period != "" {
		rows, err := h.db.Query(rowSelect+` WHERE p.period = $1 ORDER BY e.id`, period)
		if err != nil {
			http.Error(w, "โหลดข้อมูลเงินเดือนล้มเหลว: "+err.Error(), http.StatusInternalServerError)
			return
		}
		defer rows.Close()

		for rows.Next() {
			item, err := scanRow(rows)
			if err != nil {
				http.Error(w, "อ่านข้อมูลเงินเดือนล้มเหลว: "+err.Error(), http.StatusInternalServerError)
				return
			}
			items = append(items, item)
		}
		if err := rows.Err(); err != nil {
			http.Error(w, "อ่านข้อมูลเงินเดือนล้มเหลว: "+err.Error(), http.StatusInternalServerError)
			return
		}
	}

	respondJSON(w, http.StatusOK, map[string]any{
		"period":  period,
		"periods": periods,
		"items":   items,
	})
}

// GET /payroll/{id}
func (h *Handler) GetPayrollDetail(w http.ResponseWriter, r *http.Request) {
	id, ok := payrollIDFromPath(r.URL.Path)
	if !ok {
		http.Error(w, "id ไม่ถูกต้อง", http.StatusBadRequest)
		return
	}

	row, err := scanRow(h.db.QueryRow(rowSelect+` WHERE p.id = $1`, id))
	if err == sql.ErrNoRows {
		http.Error(w, "ไม่พบรายการเงินเดือน", http.StatusNotFound)
		return
	}
	if err != nil {
		http.Error(w, "โหลดข้อมูลล้มเหลว: "+err.Error(), http.StatusInternalServerError)
		return
	}

	deductions := []DeductionRow{}
	drows, err := h.db.Query(`
		SELECT deduction_type, amount, COALESCE(note, '')
		FROM payroll_deductions
		WHERE employee_id = $1 AND period = $2
		ORDER BY id`, row.EmployeeID, row.Period)
	if err != nil {
		http.Error(w, "โหลดรายการหักล้มเหลว: "+err.Error(), http.StatusInternalServerError)
		return
	}
	defer drows.Close()

	for drows.Next() {
		var d DeductionRow
		if err := drows.Scan(&d.Type, &d.Amount, &d.Note); err != nil {
			http.Error(w, "อ่านรายการหักล้มเหลว: "+err.Error(), http.StatusInternalServerError)
			return
		}
		deductions = append(deductions, d)
	}

	respondJSON(w, http.StatusOK, struct {
		PayrollRow
		Deductions []DeductionRow `json:"deductions"`
	}{row, deductions})
}

// PUT /payroll/{id}/status   body: {"status": "APPROVED"}
func (h *Handler) UpdatePayrollStatus(w http.ResponseWriter, r *http.Request) {
	id, ok := payrollIDFromPath(r.URL.Path)
	if !ok {
		http.Error(w, "id ไม่ถูกต้อง", http.StatusBadRequest)
		return
	}

	var body struct {
		Status string `json:"status"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "JSON ไม่ถูกต้อง", http.StatusBadRequest)
		return
	}
	if !validStatus(body.Status) {
		http.Error(w, "สถานะต้องเป็น DRAFT, APPROVED หรือ PAID", http.StatusBadRequest)
		return
	}

	res, err := h.db.Exec(`UPDATE payroll_items SET status = $1 WHERE id = $2`, body.Status, id)
	if err != nil {
		http.Error(w, "อัปเดตสถานะล้มเหลว: "+err.Error(), http.StatusInternalServerError)
		return
	}
	if n, _ := res.RowsAffected(); n == 0 {
		http.Error(w, "ไม่พบรายการเงินเดือน", http.StatusNotFound)
		return
	}

	respondJSON(w, http.StatusOK, map[string]any{"id": id, "status": body.Status})
}

// POST /payroll
// แก้จากเดิม: ตาราง payroll_items ใช้ employee_id (ไม่มีคอลัมน์ employee_code)
// และสถานะต้องเป็น DRAFT/APPROVED/PAID (เดิมใช้ CALCULATED ซึ่งผิด CHECK constraint)
func (h *Handler) CreatePayroll(w http.ResponseWriter, r *http.Request) {
	var req struct {
		EmployeeCode         string  `json:"employee_code"`
		Period               string  `json:"period"`
		OTHours              float64 `json:"ot_hours"`
		OTAmount             float64 `json:"ot_amount"`
		SmallPanelQty        int     `json:"small_panel_qty"`
		SmallPanelRate       float64 `json:"small_panel_rate"`
		LargePanelQty        int     `json:"large_panel_qty"`
		LargePanelRate       float64 `json:"large_panel_rate"`
		OtherIncome          float64 `json:"other_income"`
		LateAbsenceDeduction float64 `json:"late_absence_deduction"`
		TaxAmount            float64 `json:"tax_amount"`
		SocialSecurity       float64 `json:"social_security"`
		OtherDeduction       float64 `json:"other_deduction"`
		Status               string  `json:"status"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "JSON ไม่ถูกต้อง", http.StatusBadRequest)
		return
	}

	var employeeID int
	var hourlyRate float64
	err := h.db.QueryRow(
		"SELECT id, hourly_ot_rate FROM employees WHERE employee_code = $1",
		req.EmployeeCode,
	).Scan(&employeeID, &hourlyRate)
	if err != nil {
		http.Error(w, "ไม่พบรหัสพนักงานนี้", http.StatusNotFound)
		return
	}

	if req.OTHours > 0 && req.OTAmount == 0 {
		req.OTAmount = round2(req.OTHours * hourlyRate)
	}
	if req.Status == "" {
		req.Status = "DRAFT"
	}
	if !validStatus(req.Status) {
		http.Error(w, "สถานะต้องเป็น DRAFT, APPROVED หรือ PAID", http.StatusBadRequest)
		return
	}

	var newID int
	err = h.db.QueryRow(`
		INSERT INTO payroll_items (
			employee_id, period, ot_hours, ot_amount,
			small_panel_qty, small_panel_rate, large_panel_qty, large_panel_rate,
			other_income, late_absence_deduction, tax_amount, social_security,
			other_deduction, status
		) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
		RETURNING id`,
		employeeID, req.Period, req.OTHours, req.OTAmount,
		req.SmallPanelQty, req.SmallPanelRate, req.LargePanelQty, req.LargePanelRate,
		req.OtherIncome, req.LateAbsenceDeduction, req.TaxAmount, req.SocialSecurity,
		req.OtherDeduction, req.Status,
	).Scan(&newID)
	if err != nil {
		if strings.Contains(err.Error(), "uq_payroll_employee_period") {
			http.Error(w, "มีรายการเงินเดือนของพนักงานนี้ในงวดนี้แล้ว", http.StatusConflict)
			return
		}
		http.Error(w, "บันทึก Payroll ล้มเหลว: "+err.Error(), http.StatusInternalServerError)
		return
	}

	row, err := scanRow(h.db.QueryRow(rowSelect+` WHERE p.id = $1`, newID))
	if err != nil {
		http.Error(w, "บันทึกสำเร็จแต่โหลดข้อมูลกลับล้มเหลว: "+err.Error(), http.StatusInternalServerError)
		return
	}
	respondJSON(w, http.StatusCreated, row)
}

// ---------- Payroll Tax ----------

// แถวสำหรับหน้าภาษี = PayrollRow + ฟิลด์ที่หน้าเว็บใช้แสดง
type PayrollTaxItem struct {
	PayrollRow
	Name   string  `json:"name"`
	Income float64 `json:"income"` // เงินได้ทั้งสิ้น = gross_income
}

// GET /payrolltax?period=2026-09&department=...&employment_type=...
// ไม่ใส่ period = งวดล่าสุด  ตอบเป็น array ตรง ๆ
func (h *Handler) GetPayrollTaxList(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()

	period := q.Get("period")
	if period == "" {
		periods, err := h.listPeriods()
		if err != nil {
			http.Error(w, "โหลดงวดเงินเดือนล้มเหลว: "+err.Error(), http.StatusInternalServerError)
			return
		}
		if len(periods) > 0 {
			period = periods[0]
		}
	}

	items := []PayrollTaxItem{}
	if period == "" {
		respondJSON(w, http.StatusOK, items)
		return
	}

	query := rowSelect + ` WHERE p.period = $1`
	args := []any{period}
	if v := q.Get("department"); v != "" {
		args = append(args, v)
		query += ` AND e.department = $` + strconv.Itoa(len(args))
	}
	if v := q.Get("employment_type"); v != "" {
		args = append(args, v)
		query += ` AND e.employment_type = $` + strconv.Itoa(len(args))
	}
	query += ` ORDER BY e.id`

	rows, err := h.db.Query(query, args...)
	if err != nil {
		http.Error(w, "โหลดข้อมูลภาษีล้มเหลว: "+err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	for rows.Next() {
		row, err := scanRow(rows)
		if err != nil {
			http.Error(w, "อ่านข้อมูลภาษีล้มเหลว: "+err.Error(), http.StatusInternalServerError)
			return
		}
		items = append(items, PayrollTaxItem{
			PayrollRow: row,
			Name:       strings.TrimSpace(row.Prefix + row.FirstName + " " + row.LastName),
			Income:     row.GrossIncome,
		})
	}
	if err := rows.Err(); err != nil {
		http.Error(w, "อ่านข้อมูลภาษีล้มเหลว: "+err.Error(), http.StatusInternalServerError)
		return
	}
	respondJSON(w, http.StatusOK, items)
}

// PUT /payrolltax/{id}
// ส่งเฉพาะ field ที่ต้องการแก้ (ไม่ส่ง = คงค่าเดิม)
// ไม่ให้แก้ period เพราะ payroll_deductions ผูกกับ employee_id + period
// ไม่มี base_salary เพราะเก็บอยู่ใน employees
func (h *Handler) UpdatePayrollTax(w http.ResponseWriter, r *http.Request) {
	id, ok := payrollIDFromPath(r.URL.Path)
	if !ok {
		http.Error(w, "id ไม่ถูกต้อง", http.StatusBadRequest)
		return
	}

	var req struct {
		OTHours              *float64 `json:"ot_hours"`
		OTAmount             *float64 `json:"ot_amount"`
		SmallPanelQty        *int     `json:"small_panel_qty"`
		SmallPanelRate       *float64 `json:"small_panel_rate"`
		LargePanelQty        *int     `json:"large_panel_qty"`
		LargePanelRate       *float64 `json:"large_panel_rate"`
		OtherIncome          *float64 `json:"other_income"`
		LateAbsenceDeduction *float64 `json:"late_absence_deduction"`
		TaxAmount            *float64 `json:"tax_amount"`
		SocialSecurity       *float64 `json:"social_security"`
		OtherDeduction       *float64 `json:"other_deduction"`
		Status               *string  `json:"status"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "JSON ไม่ถูกต้อง", http.StatusBadRequest)
		return
	}

	row, err := scanRow(h.db.QueryRow(rowSelect+` WHERE p.id = $1`, id))
	if err == sql.ErrNoRows {
		http.Error(w, "ไม่พบรายการเงินเดือน", http.StatusNotFound)
		return
	}
	if err != nil {
		http.Error(w, "โหลดข้อมูลล้มเหลว: "+err.Error(), http.StatusInternalServerError)
		return
	}

	setF := func(dst, src *float64) {
		if src != nil {
			*dst = round2(*src)
		}
	}
	setF(&row.OTHours, req.OTHours)
	setF(&row.OTAmount, req.OTAmount)
	setF(&row.SmallPanelRate, req.SmallPanelRate)
	setF(&row.LargePanelRate, req.LargePanelRate)
	setF(&row.OtherIncome, req.OtherIncome)
	setF(&row.LateAbsenceDeduction, req.LateAbsenceDeduction)
	setF(&row.TaxAmount, req.TaxAmount)
	setF(&row.SocialSecurity, req.SocialSecurity)
	setF(&row.OtherDeduction, req.OtherDeduction)
	if req.SmallPanelQty != nil {
		row.SmallPanelQty = *req.SmallPanelQty
	}
	if req.LargePanelQty != nil {
		row.LargePanelQty = *req.LargePanelQty
	}
	if req.Status != nil {
		s := strings.ToUpper(strings.TrimSpace(*req.Status))
		if !validStatus(s) {
			http.Error(w, "สถานะต้องเป็น DRAFT, APPROVED หรือ PAID", http.StatusBadRequest)
			return
		}
		row.Status = s
	}

	if row.SmallPanelQty < 0 || row.LargePanelQty < 0 {
		http.Error(w, "จำนวนต้องไม่ติดลบ", http.StatusBadRequest)
		return
	}
	for _, v := range []float64{
		row.OTHours, row.OTAmount, row.SmallPanelRate, row.LargePanelRate,
		row.OtherIncome, row.LateAbsenceDeduction, row.TaxAmount,
		row.SocialSecurity, row.OtherDeduction,
	} {
		if v < 0 {
			http.Error(w, "จำนวนเงินต้องไม่ติดลบ", http.StatusBadRequest)
			return
		}
	}

	_, err = h.db.Exec(`
		UPDATE payroll_items SET
			ot_hours = $1, ot_amount = $2,
			small_panel_qty = $3, small_panel_rate = $4,
			large_panel_qty = $5, large_panel_rate = $6,
			other_income = $7, late_absence_deduction = $8, tax_amount = $9,
			social_security = $10, other_deduction = $11, status = $12
		WHERE id = $13`,
		row.OTHours, row.OTAmount,
		row.SmallPanelQty, row.SmallPanelRate,
		row.LargePanelQty, row.LargePanelRate,
		row.OtherIncome, row.LateAbsenceDeduction, row.TaxAmount,
		row.SocialSecurity, row.OtherDeduction, row.Status, id,
	)
	if err != nil {
		http.Error(w, "อัปเดตข้อมูลล้มเหลว: "+err.Error(), http.StatusInternalServerError)
		return
	}

	updated, err := scanRow(h.db.QueryRow(rowSelect+` WHERE p.id = $1`, id))
	if err != nil {
		http.Error(w, "บันทึกสำเร็จแต่โหลดข้อมูลกลับล้มเหลว: "+err.Error(), http.StatusInternalServerError)
		return
	}
	respondJSON(w, http.StatusOK, updated)
}