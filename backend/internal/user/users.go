
package user

import (
	"database/sql"
	"encoding/json"
	"net/http"

	"golang.org/x/crypto/bcrypt"
)

type User struct {
	ID        int    `json:"id"`
	Username  string `json:"username"`
	FullName  string `json:"full_name"`
	Role      string `json:"role"`
	Status    string `json:"status"`
	CreatedAt string `json:"created_at"`
}

type Handler struct {
	db *sql.DB
}

func NewHandler(db *sql.DB) *Handler {
	return &Handler{db: db}
}

// POST /users
func (h *Handler) CreateUser(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Username string `json:"username"`
		Password string `json:"password"`
		FullName string `json:"full_name"`
		Role     string `json:"role"`
		Status   string `json:"status"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "JSON ไม่ถูกต้อง", http.StatusBadRequest)
		return
	}

	if req.Username == "" || req.Password == "" || req.FullName == "" {
		http.Error(w, "กรุณากรอก username, password และ full_name", http.StatusBadRequest)
		return
	}

	if req.Role == "" {
		req.Role = "HR"
	}
	if req.Status == "" {
		req.Status = "ACTIVE"
	}

	if req.Role != "ADMIN" && req.Role != "HR" {
		http.Error(w, "role ต้องเป็น ADMIN หรือ HR", http.StatusBadRequest)
		return
	}

	if req.Status != "ACTIVE" && req.Status != "INACTIVE" {
		http.Error(w, "status ไม่ถูกต้อง", http.StatusBadRequest)
		return
	}

	hash, err := bcrypt.GenerateFromPassword(
		[]byte(req.Password), bcrypt.DefaultCost,
	)
	if err != nil {
		http.Error(w, "เข้ารหัสรหัสผ่านไม่สำเร็จ", http.StatusInternalServerError)
		return
	}

	var u User
	err = h.db.QueryRow(`
		INSERT INTO users (username, password_hash, full_name, role, status)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id, username, full_name, role, status, created_at
	`, req.Username, string(hash), req.FullName, req.Role, req.Status).
		Scan(&u.ID, &u.Username, &u.FullName, &u.Role, &u.Status, &u.CreatedAt)

	if err != nil {
		http.Error(w, "สร้างผู้ใช้ไม่สำเร็จ", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(u)
}

// GET /users
func (h *Handler) GetUsers(w http.ResponseWriter, r *http.Request) {
	rows, err := h.db.Query(`
		SELECT id, username, full_name, role, status, created_at
		FROM users ORDER BY id
	`)
	if err != nil {
		http.Error(w, "อ่านข้อมูลผู้ใช้ไม่สำเร็จ", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	users := []User{}
	for rows.Next() {
		var u User
		if err := rows.Scan(
			&u.ID, &u.Username, &u.FullName,
			&u.Role, &u.Status, &u.CreatedAt,
		); err != nil {
			http.Error(w, "อ่านข้อมูลไม่สำเร็จ", http.StatusInternalServerError)
			return
		}
		users = append(users, u)
	}

	if err := rows.Err(); err != nil {
		http.Error(w, "อ่านข้อมูลไม่สำเร็จ", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(users)
}
