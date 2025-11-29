# Phụ lục Demo Module E – Automation & FinOps

## 1) CI/CD – Self-Service Deploy

- Pipeline `Self-Service Deploy` trên GitHub Actions.
- Có input chọn service + environment.
- Pipeline chạy được init/plan/apply của Terraform.
- Không cần dùng CLI hay AWS credential cá nhân.

(→ Chứng minh quy trình tự phục vụ cho dev mới.)

---

## 2) Hạ tầng Terraform đã tạo

- ECS Cluster và các ECS Service đã được provision.
- Các service có `desired_count = 0` để tránh bị tính phí Fargate.
- Cloud Map tạo namespace `<project>.local` để service discovery nội bộ.
- Log Group của từng service đã được tạo.

(→ Mặc dù không chạy task do free tier, nhưng hạ tầng vẫn hoàn chỉnh.)

---

## 3) FinOps: Giám sát & kiểm soát chi phí

- Budget đặt 500 USD, có cảnh báo ở mức 80% và 100%.
- Có Anomaly Detection để giám sát chi phí bất thường.
- Dashboard CloudWatch đã dựng sẵn (ECS CPU/Mem, error logs…).
- Các tài nguyên đều được gán tag `Project`, `Env`, `Service`.

(→ Cho thấy có hệ thống quản trị chi phí đúng chuẩn FinOps.)

---

## 4) Tối ưu chi phí (những gì em đã làm)

- Tắt ALB trong môi trường dev (tiết kiệm 18–25 USD/tháng).
- Không bật RDS/Redis/MQ cho dev để tránh phí cố định.
- Ưu tiên chạy Fargate Spot (rẻ hơn 30–70%).
- Giữ log CloudWatch trong 7 ngày để giảm phí lưu trữ.

(→ Giải thích rõ trade-off: public được thì tốn tiền, RDS ổn định nhưng đắt, Spot rẻ nhưng có thể bị reclaim…)

---

## 5) Cost Explorer

- Nhóm chi phí theo tag để xem phần nào tốn tiền nhất.
- Chi phí thấp vì:
  - Không có ALB và RDS.
  - Task Fargate không chạy.
  - NAT + log retention tối giản.

(→ Chứng minh hiểu và áp dụng thực tế tối ưu chi phí cho cloud.)

---

## Ghi chú cuối

Dù AWS không cho chạy Fargate task ở free tier, toàn bộ logic triển khai – hạ tầng – giám sát – và tối ưu chi phí đều đã được thiết lập đầy đủ.  
Khi có quota, chỉ cần tăng `desired_count` là service chạy được ngay.
