output "ec2_public_ip" {
  description = "Set your domain's DNS A record to this IP, and put it in EC2_HOST GitHub secret"
  value       = aws_eip.app.public_ip
}

output "auth_db_endpoint" {
  description = "Copy this into AUTH_DB_HOST in your EC2 .env file"
  value       = aws_db_instance.auth.address
}

output "bean_db_endpoint" {
  description = "Copy this into BEAN_DB_HOST in your EC2 .env file"
  value       = aws_db_instance.beanbalance.address
}
