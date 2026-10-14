package payroll

import (
	"database/sql"
	"encoding/json"
	"math"
	"net/http"
	"regexp"
	"strconv"
	"time"
)

var periodRe = regexp.MustCompile(`^\d{4}-(0[1-9]|1[0-2])$`)

// ---------- Models ----------

// ข้อมูลนำเข้าสำหรับคำนวณภาษี (ใช้ทั้งรับ body ของ PUT และฝังใน TaxRow)
// salary / ot_amount / other_income เป็นยอดต่อเดือน
type TaxInput struct {
	Salary      float64 `json:"salary"`
	OTAmount    float64 `json:"ot_amount"`
	OtherIncome float64 `json:"other_income"`

	PersonalAllowance float64 `json:"personal_allowance"`
	SpouseAllowance   float64 `json:"spouse_allowance"`
	ChildAllowance    float64 `json:"child_allowance"`
	DisabledAllowance float64 `json:"disabled_allowance"`
	LifeInsurance     float64 `json:"life_insurance"`
	ProvidentFund     float64 `json:"provident_fund"`
	HomeLoanInterest  float64 `json:"home_loan_interest"`
	EducationExpense  float64 `json:"education_expense"`
	Donation          float64 `json:"donation"`

	WithheldPaid float64 `json:"withheld_paid"` // ภาษีที่หัก ณ ที่จ่ายแล้ว (จากแหล่งอื่น)
}

func (t TaxInput) allowances() []float64 {
	return []float64{
		t.PersonalAllowance, t.SpouseAllowance, t.ChildAllowance, t.DisabledAllowance,
		t.LifeInsurance, t.ProvidentFund, t.HomeLoanInterest, t.EducationExpense, t.Donation,
	}
}

func (t TaxInput) hasNegative() bool {
	all := append(t.allowances(), t.Salary, t.OTAmount, t.OtherIncome, t.WithheldPaid)
	for _, v := range all {
		if v < 0 {
			return true
		}
	}
	return false
}

type TaxRow struct {
	EmployeeID     int    `json:"employee_id"`
	EmployeeCode   string `json:"employee_code"`
	Prefix         string `json:"prefix"`
	FirstName      string `json:"first_name"`
	LastName       string `json:"last_name"`
	Department     string `json:"department"`
	Position       string `json:"position"`
	EmploymentType string `json:"employment_type"`
	Period         string `json:"period"`
	Status         string `json:"status"` // NORMAL | PENDING (แก้ไขแล้วรอคำนวณใหม่)

	TaxInput

	AnnualIncome     float64 `json:"annual_income"`
	ExpenseDeduction float64 `json:"expense_deduction"`
	TotalAllowance   float64 `json:"total_allowance"`
	NetIncome        float64 `json:"net_income"`
	TaxDue           float64 `json:"tax_due"`
	YTDWithheld      float64 `json:"ytd_withheld"`   // ภาษีที่หักจาก payroll_items ตั้งแต่ ม.ค. ถึงงวดที่เลือก
	TotalWithheld    float64 `json:"total_withheld"` // withheld_paid + ytd_withheld
	TaxBalance       float64 `json:"tax_balance"`    // ต้องชำระเพิ่ม (+) / ขอคืน (-)
}

// ---------- Calculation ----------

// อัตราภาษีเงินได้บุคคลธรรมดา (ตรงกับตารางในหน้า UI)
var taxBrackets = []struct{ Upper, Rate float64 }{
	{150000, 0},
	{300000, 0.05},
	{500000, 0.10},
	{750000, 0.15},
	{1000000, 0.20},
	{2000000, 0.25},
	{math.MaxFloat64, 0.30},
}

func progressiveTax(net float64) float64 {
	var tax, lower float64
	for _, b := range taxBrackets {
		if net <= lower {
			break
		}
		tax += (math.Min(net, b.Upper) - lower) * b.Rate
		lower = b.Upper
	}
	return round2(tax)
}

func (r *TaxRow) compute() {
	r.AnnualIncome = round2((r.Salary + r.OTAmount + r.OtherIncome) * 12)
	r.ExpenseDeduction = round2(math.Min(r.AnnualIncome*0.5, 100000)) // ค่าใช้จ่าย 50% ไม่เกิน 100,000
	var allow float64
	for _, v := range r.allowances() {
		allow += v
	}
	r.TotalAllowance = round2(allow)
	r.NetIncome = round2(math.Max(0, r.AnnualIncome-r.ExpenseDeduction-r.TotalAllowance))
	r.TaxDue = progressiveTax(r.NetIncome)
	r.TotalWithheld = round2(r.WithheldPaid + r.YTDWithheld)
	r.TaxBalance = round2(r.TaxDue - r.TotalWithheld)
}

// ---------- Schema & queries ----------

// เรียกครั้งเดียวตอนเริ่มระบบ (ดู main.go)
func (h *Handler) InitTaxSchema() error {
	_, err := h.db.Exec(`
	CREATE TABLE IF NOT EXISTS tax_profiles (
		employee_id        INT PRIMARY KEY REFERENCES employees(id) ON DELETE CASCADE,
		salary             DECIMAL(12,2),
		ot_amount          DECIMAL(12,2),
		other_income       DECIMAL(12,2),
		personal_allowance DECIMAL(12,2) NOT NULL DEFAULT 60000,
		spouse_allowance   DECIMAL(12,2) NOT NULL DEFAULT 0,
		child_allowance    DECIMAL(12,2) NOT NULL DEFAULT 0,
		disabled_allowance DECIMAL(12,2) NOT NULL DEFAULT 0,
		life_insurance     DECIMAL(12,2) NOT NULL DEFAULT 0,
		provident_fund     DECIMAL(12,2) NOT NULL DEFAULT 0,
		home_loan_interest DECIMAL(12,2) NOT NULL DEFAULT 0,
		education_expense  DECIMAL(12,2) NOT NULL DEFAULT 0,
		donation           DECIMAL(12,2) NOT NULL DEFAULT 0,
		withheld_paid      DECIMAL(12,2) NOT NULL DEFAULT 0,
		status             VARCHAR(20)   NOT NULL DEFAULT 'NORMAL',
		updated_at         TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
	)`)
	return err
}

// salary/ot/other เป็น NULL = ยังไม่เคยแก้ → ใช้ค่าจากพนักงาน + งวดเงินเดือนนั้น
const taxSelect = `
	SELECT e.id, e.employee_code, COALESCE(e.prefix, ''), e.first_name, e.last_name,
	       e.department, e.position, e.employment_type, e.base_salary,
	       tp.salary, tp.ot_amount, tp.other_income,
	       COALESCE(tp.personal_allowance, 60000), COALESCE(tp.spouse_allowance, 0),
	       COALESCE(tp.child_allowance, 0), COALESCE(tp.disabled_allowance, 0),
	       COALESCE(tp.life_insurance, 0), COALESCE(tp.provident_fund, 0),
	       COALESCE(tp.home_loan_interest, 0), COALESCE(tp.education_expense, 0),
	       COALESCE(tp.donation, 0), COALESCE(tp.withheld_paid, 0),
	       COALESCE(tp.status, 'NORMAL'),
	       COALESCE(p.ot_amount, 0), COALESCE(p.other_income, 0),
	       COALESCE((SELECT SUM(y.tax_amount) FROM payroll_items y
	                 WHERE y.employee_id = e.id
	                   AND LEFT(y.period, 4) = LEFT($1::text, 4)
	                   AND y.period <= $1::text), 0)
	FROM employees e
	LEFT JOIN tax_profiles tp ON tp.employee_id = e.id
	LEFT JOIN payroll_items p ON p.employee_id = e.id AND p.period = $1::text
	WHERE e.status = 'ACTIVE' AND ($2::int = 0 OR e.id = $2::int)
	ORDER BY e.id`

func orDefault(n sql.NullFloat64, def float64) float64 {
	if n.Valid {
		return n.Float64
	}
	return def
}

// employeeID = 0 → ทุกคน
func (h *Handler) loadTaxRows(period string, employeeID int) ([]TaxRow, error) {
	rows, err := h.db.Query(taxSelect, period, employeeID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := []TaxRow{}
	for rows.Next() {
		var r TaxRow
		var base, payOT, payOther float64
		var spSalary, spOT, spOther sql.NullFloat64
		if err := rows.Scan(
			&r.EmployeeID, &r.EmployeeCode, &r.Prefix, &r.FirstName, &r.LastName,
			&r.Department, &r.Position, &r.EmploymentType, &base,
			&spSalary, &spOT, &spOther,
			&r.PersonalAllowance, &r.SpouseAllowance, &r.ChildAllowance, &r.DisabledAllowance,
			&r.LifeInsurance, &r.ProvidentFund, &r.HomeLoanInterest, &r.EducationExpense,
			&r.Donation, &r.WithheldPaid, &r.Status,
			&payOT, &payOther, &r.YTDWithheld,
		); err != nil {
			return nil, err
		}
		r.Period = period
		r.Salary = orDefault(spSalary, base)
		r.OTAmount = orDefault(spOT, payOT)
		r.OtherIncome = orDefault(spOther, payOther)
		r.compute()
		items = append(items, r)
	}
	return items, rows.Err()
}

func (h *Handler) resolveTaxPeriod(r *http.Request) (string, []string, error) {
	periods, err := h.listPeriods()
	if err != nil {
		return "", nil, err
	}
	p := r.URL.Query().Get("period")
	if p == "" {
		if len(periods) > 0 {
			p = periods[0]
		} else {
			p = time.Now().Format("2006-01")
		}
	}
	return p, periods, nil
}

// ---------- Handlers ----------

// GET /tax?period=2026-09
func (h *Handler) GetTaxList(w http.ResponseWriter, r *http.Request) {
	period, periods, err := h.resolveTaxPeriod(r)
	if err != nil {
		http.Error(w, "โหลดงวดเงินเดือนล้มเหลว: "+err.Error(), http.StatusInternalServerError)
		return
	}
	if !periodRe.MatchString(period) {
		http.Error(w, "รูปแบบงวดไม่ถูกต้อง (ต้องเป็น YYYY-MM)", http.StatusBadRequest)
		return
	}
	items, err := h.loadTaxRows(period, 0)
	if err != nil {
		http.Error(w, "โหลดข้อมูลภาษีล้มเหลว: "+err.Error(), http.StatusInternalServerError)
		return
	}
	respondJSON(w, http.StatusOK, map[string]any{
		"period":  period,
		"periods": periods,
		"items":   items,
	})
}

// GET /tax/{id}?period=2026-09   (id = employee_id)
func (h *Handler) GetTaxDetail(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(r.PathValue("id"))
	if err != nil || id <= 0 {
		http.Error(w, "id ไม่ถูกต้อง", http.StatusBadRequest)
		return
	}
	period, _, err := h.resolveTaxPeriod(r)
	if err != nil {
		http.Error(w, "โหลดงวดเงินเดือนล้มเหลว: "+err.Error(), http.StatusInternalServerError)
		return
	}
	if !periodRe.MatchString(period) {
		http.Error(w, "รูปแบบงวดไม่ถูกต้อง (ต้องเป็น YYYY-MM)", http.StatusBadRequest)
		return
	}
	items, err := h.loadTaxRows(period, id)
	if err != nil {
		http.Error(w, "โหลดข้อมูลภาษีล้มเหลว: "+err.Error(), http.StatusInternalServerError)
		return
	}
	if len(items) == 0 {
		http.Error(w, "ไม่พบพนักงาน", http.StatusNotFound)
		return
	}
	respondJSON(w, http.StatusOK, items[0])
}

// PUT /tax/{id}?period=2026-09   body: TaxInput
// บันทึกแล้วสถานะเป็น PENDING จนกว่าจะกด "คำนวณภาษีใหม่"
func (h *Handler) UpdateTaxProfile(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(r.PathValue("id"))
	if err != nil || id <= 0 {
		http.Error(w, "id ไม่ถูกต้อง", http.StatusBadRequest)
		return
	}
	period, _, err := h.resolveTaxPeriod(r)
	if err != nil {
		http.Error(w, "โหลดงวดเงินเดือนล้มเหลว: "+err.Error(), http.StatusInternalServerError)
		return
	}
	if !periodRe.MatchString(period) {
		http.Error(w, "รูปแบบงวดไม่ถูกต้อง (ต้องเป็น YYYY-MM)", http.StatusBadRequest)
		return
	}

	var in TaxInput
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		http.Error(w, "JSON ไม่ถูกต้อง", http.StatusBadRequest)
		return
	}
	if in.hasNegative() {
		http.Error(w, "จำนวนเงินต้องไม่ติดลบ", http.StatusBadRequest)
		return
	}

	var exists bool
	if err := h.db.QueryRow(`SELECT EXISTS(SELECT 1 FROM employees WHERE id = $1)`, id).Scan(&exists); err != nil {
		http.Error(w, "ตรวจสอบพนักงานล้มเหลว: "+err.Error(), http.StatusInternalServerError)
		return
	}
	if !exists {
		http.Error(w, "ไม่พบพนักงาน", http.StatusNotFound)
		return
	}

	_, err = h.db.Exec(`
		INSERT INTO tax_profiles (
			employee_id, salary, ot_amount, other_income,
			personal_allowance, spouse_allowance, child_allowance, disabled_allowance,
			life_insurance, provident_fund, home_loan_interest, education_expense,
			donation, withheld_paid, status, updated_at
		) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,'PENDING',NOW())
		ON CONFLICT (employee_id) DO UPDATE SET
			salary = EXCLUDED.salary, ot_amount = EXCLUDED.ot_amount, other_income = EXCLUDED.other_income,
			personal_allowance = EXCLUDED.personal_allowance, spouse_allowance = EXCLUDED.spouse_allowance,
			child_allowance = EXCLUDED.child_allowance, disabled_allowance = EXCLUDED.disabled_allowance,
			life_insurance = EXCLUDED.life_insurance, provident_fund = EXCLUDED.provident_fund,
			home_loan_interest = EXCLUDED.home_loan_interest, education_expense = EXCLUDED.education_expense,
			donation = EXCLUDED.donation, withheld_paid = EXCLUDED.withheld_paid,
			status = 'PENDING', updated_at = NOW()`,
		id, in.Salary, in.OTAmount, in.OtherIncome,
		in.PersonalAllowance, in.SpouseAllowance, in.ChildAllowance, in.DisabledAllowance,
		in.LifeInsurance, in.ProvidentFund, in.HomeLoanInterest, in.EducationExpense,
		in.Donation, in.WithheldPaid,
	)
	if err != nil {
		http.Error(w, "บันทึกข้อมูลภาษีล้มเหลว: "+err.Error(), http.StatusInternalServerError)
		return
	}

	items, err := h.loadTaxRows(period, id)
	if err != nil || len(items) == 0 {
		http.Error(w, "บันทึกสำเร็จแต่โหลดข้อมูลกลับล้มเหลว", http.StatusInternalServerError)
		return
	}
	respondJSON(w, http.StatusOK, items[0])
}

// POST /tax/calculate   body: {"period": "2026-09"}
// - ล้างสถานะ PENDING ทั้งหมด
// - อัปเดต tax_amount (ภาษีต่อเดือน = ภาษีทั้งปี / 12) ของ payroll_items งวดนั้นที่ยังเป็น DRAFT
func (h *Handler) CalculateTax(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Period string `json:"period"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil || !periodRe.MatchString(body.Period) {
		http.Error(w, "ต้องระบุงวดในรูปแบบ YYYY-MM", http.StatusBadRequest)
		return
	}

	items, err := h.loadTaxRows(body.Period, 0)
	if err != nil {
		http.Error(w, "โหลดข้อมูลภาษีล้มเหลว: "+err.Error(), http.StatusInternalServerError)
		return
	}

	tx, err := h.db.Begin()
	if err != nil {
		http.Error(w, "เริ่มธุรกรรมล้มเหลว: "+err.Error(), http.StatusInternalServerError)
		return
	}
	defer tx.Rollback()

	updated := 0
	for _, it := range items {
		res, err := tx.Exec(`
			UPDATE payroll_items SET tax_amount = $1
			WHERE employee_id = $2 AND period = $3 AND status = 'DRAFT'`,
			round2(it.TaxDue/12), it.EmployeeID, body.Period)
		if err != nil {
			http.Error(w, "อัปเดตภาษีในเงินเดือนล้มเหลว: "+err.Error(), http.StatusInternalServerError)
			return
		}
		n, _ := res.RowsAffected()
		updated += int(n)
	}
	if _, err := tx.Exec(`UPDATE tax_profiles SET status = 'NORMAL' WHERE status = 'PENDING'`); err != nil {
		http.Error(w, "อัปเดตสถานะล้มเหลว: "+err.Error(), http.StatusInternalServerError)
		return
	}
	if err := tx.Commit(); err != nil {
		http.Error(w, "บันทึกธุรกรรมล้มเหลว: "+err.Error(), http.StatusInternalServerError)
		return
	}

	respondJSON(w, http.StatusOK, map[string]any{
		"period":                body.Period,
		"employees":             len(items),
		"updated_payroll_items": updated,
	})
}
