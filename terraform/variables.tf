variable "aws_region" {
  description = "AWS region to deploy all resources"
  type        = string
  default     = "us-east-1"
}

variable "ec2_instance_type" {
  description = "EC2 instance type (t3.small = 2 vCPU / 2 GB RAM)"
  type        = string
  default     = "t3.small"
}

variable "rds_instance_class" {
  description = "RDS instance class (db.t3.micro is the cheapest)"
  type        = string
  default     = "db.t3.micro"
}

variable "ssh_public_key" {
  description = "Contents of your local ~/.ssh/id_rsa.pub — used to SSH into EC2"
  type        = string
  sensitive   = true
}

variable "auth_db_password" {
  description = "Password for the auth RDS instance (set in terraform.tfvars)"
  type        = string
  sensitive   = true
}

variable "bean_db_password" {
  description = "Password for the beanbalance RDS instance (set in terraform.tfvars)"
  type        = string
  sensitive   = true
}
