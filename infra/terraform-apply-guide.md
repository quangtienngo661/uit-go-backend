```bash
cd infra
terraform init

# Basic apply with required variables
terraform apply \
  -var="supabase_url=YOUR_URL" \
  -var="supabase_key=YOUR_KEY" \
  -var="supabase_jwt_secret=YOUR_SECRET" \
  -var="rabbitmq_mgmt_url=https://b-XXXX.mq.ap-southeast-1.amazonaws.com" \
  -var="rabbitmq_password=<same-as-broker-user-if-needed>"

# Full apply with notification service (Firebase + Email)
terraform apply \
  -var="supabase_url=YOUR_URL" \
  -var="supabase_key=YOUR_KEY" \
  -var="supabase_jwt_secret=YOUR_SECRET" \
  -var="rabbitmq_mgmt_url=https://b-XXXX.mq.ap-southeast-1.amazonaws.com" \
  -var="rabbitmq_password=YOUR_PASSWORD" \
  -var="firebase_project_id=YOUR_PROJECT_ID" \
  -var="firebase_client_email=YOUR_CLIENT_EMAIL" \
  -var="firebase_private_key=YOUR_PRIVATE_KEY" \
  -var="mail_user=your-email@gmail.com" \
  -var="mail_pass=YOUR_APP_PASSWORD"

# With FinOps budget alerts
terraform apply \
  -var="supabase_url=YOUR_URL" \
  -var="supabase_key=YOUR_KEY" \
  -var="supabase_jwt_secret=YOUR_SECRET" \
  -var="rabbitmq_mgmt_url=https://b-XXXX.mq.ap-southeast-1.amazonaws.com" \
  -var="rabbitmq_password=YOUR_PASSWORD" \
  -var="budget_alert_emails=[\"team@example.com\",\"lead@example.com\"]" \
  -var="finops_team_email=finops@example.com"
```
