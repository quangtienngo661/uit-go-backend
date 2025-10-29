```bash
cd infra
terraform init
terraform apply \
  -var="supabase_url=YOUR_URL" \
  -var="supabase_key=YOUR_KEY" \
  -var="supabase_jwt_secret=YOUR_SECRET" \
  -var="rabbitmq_mgmt_url=https://b-XXXX.mq.ap-southeast-1.amazonaws.com" \
  -var="rabbitmq_password=<same-as-broker-user-if-needed>"
```
