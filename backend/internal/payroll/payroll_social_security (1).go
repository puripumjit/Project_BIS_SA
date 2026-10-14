package payroll

import (
	"fmt"
	"math"
	"net/http"
)

// ---------- ค่าคงที่ประกันสังคม (ม.33) ----------
// เปลี่ยนที่นี่ที่เดียว หน้าเว็บจะอ่านค่าจาก API ไปแสดงเอง
const (
	ssRate      = 0.05    // อัตราเงินสมทบฝั่งละ 5%
	ssWageCap   = 15000.0 // เพดานค่าจ้างที่ใช้คำนวณ (ตามแบบหน้าจอและข้อมูลตัวอย่าง = 750 บาท/เดือน)
	ssWageFloor = 1650.0  // ค่าจ้างขั้นต่ำที่ใช้คำนวณ
)

// พนักงานที่อยู่ในระบบประกันสังคม: พนักงานที่ยังทำงานอยู่ และไม่ใช่ฟรีแลนซ์
const ssCoveredWhere = `status = 'ACTIVE' AND employment_type <> 'ฟรีแลนซ์'`

type SocialSecurityRow struct {
	ID             int     `json:"id"`
	EmployeeCode   string  `json:"employee_code"`
	Prefix         string  `json:"prefix"`
	FirstName      string  `json:"first_name"`
	LastName       string  `json:"last_name"`
	Department     string  `json:"department"`
	EmploymentType string  `json:"employment_type"`
	Salary         float64 `json:"salary"`       // เงินเดือนจริง
	WageBase       float64 `json:"wage_base"`    // ฐานค่าจ้างหลังใช้เพดาน/ขั้นต่ำ
	Contribution   float64 `json:"contribution"` // เงินสมทบฝั่งลูกจ้าง
}

func ssWageBase(salary float64) float64 {
	if salary <= 0 {
		return 0
	}
	return math.Min(math.Max(salary, ssWageFloor), ssWageCap)
}

// รายการค่าไม่ซ้ำสำหรับ dropdown (column เป็นค่าคงที่ในโค้ดเท่านั้น ไม่รับจากผู้ใช้)
func (h *Handler) ssDistinct(column string) ([]string, error) {
	rows, err := h.db.Query(`SELECT DISTINCT ` + column + ` FROM employees WHERE ` + ssCoveredWhere + ` ORDER BY 1`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	values := []string{}
	for rows.Next() {
		var v string
		if err := rows.Scan(&v); err != nil {
			return nil, err
		}
		values = append(values, v)
	}
	return values, rows.Err()
}

// GET /social-security?department=...&employment_type=...
func (h *Handler) GetSocialSecurity(w http.ResponseWriter, r *http.Request) {
	query := `
		SELECT id, employee_code, COALESCE(prefix, ''), first_name, last_name,
		       department, employment_type, base_salary
		FROM employees
		WHERE ` + ssCoveredWhere
	args := []any{}

	if d := r.URL.Query().Get("department"); d != "" {
		args = append(args, d)
		query += fmt.Sprintf(" AND department = $%d", len(args))
	}
	if t := r.URL.Query().Get("employment_type"); t != "" {
		args = append(args, t)
		query += fmt.Sprintf(" AND employment_type = $%d", len(args))
	}
	query += " ORDER BY id"

	rows, err := h.db.Query(query, args...)
	if err != nil {
		http.Error(w, "โหลดข้อมูลประกันสังคมล้มเหลว: "+err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	items := []SocialSecurityRow{}
	employeeTotal := 0.0
	for rows.Next() {
		var it SocialSecurityRow
		if err := rows.Scan(
			&it.ID, &it.EmployeeCode, &it.Prefix, &it.FirstName, &it.LastName,
			&it.Department, &it.EmploymentType, &it.Salary,
		); err != nil {
			http.Error(w, "อ่านข้อมูลประกันสังคมล้มเหลว: "+err.Error(), http.StatusInternalServerError)
			return
		}
		it.WageBase = ssWageBase(it.Salary)
		it.Contribution = math.Round(it.WageBase * ssRate) // ปัดเป็นบาท
		employeeTotal += it.Contribution
		items = append(items, it)
	}
	if err := rows.Err(); err != nil {
		http.Error(w, "อ่านข้อมูลประกันสังคมล้มเหลว: "+err.Error(), http.StatusInternalServerError)
		return
	}

	departments, err := h.ssDistinct("department")
	if err != nil {
		http.Error(w, "โหลดรายการแผนกล้มเหลว: "+err.Error(), http.StatusInternalServerError)
		return
	}
	types, err := h.ssDistinct("employment_type")
	if err != nil {
		http.Error(w, "โหลดรายการประเภทพนักงานล้มเหลว: "+err.Error(), http.StatusInternalServerError)
		return
	}

	respondJSON(w, http.StatusOK, map[string]any{
		"rate":           ssRate,
		"wage_cap":       ssWageCap,
		"wage_floor":     ssWageFloor,
		"departments":    departments,
		"types":          types,
		"items":          items,
		"employee_total": employeeTotal,
		"employer_total": employeeTotal, // นายจ้างสมทบเท่ากับลูกจ้าง
		"grand_total":    employeeTotal * 2,
	})
}
