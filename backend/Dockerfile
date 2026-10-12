# Stage 1: Build binary
FROM golang:alpine AS builder

WORKDIR /app

# ก็อปปี้ไฟล์ dependency และดาวน์โหลดก่อน
COPY go.mod go.sum ./
RUN go mod download

# ก็อปปี้ซอร์สโค้ดทั้งหมดแล้ว build
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o /server cmd/api/main.go

# Stage 2: รัน Binary บน Alpine เล็กๆ
FROM alpine:latest

WORKDIR /app
COPY --from=builder /server .

EXPOSE 8080

CMD ["./server"]