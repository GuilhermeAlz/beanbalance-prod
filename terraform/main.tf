terraform {
  required_version = ">= 1.6"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Uncomment this block after S3 bucket is created for state storage.
  # Until then, state is kept locally in terraform.tfstate.
  #
  # backend "s3" {
  #   bucket = "your-terraform-state-bucket"
  #   key    = "beanbalance/terraform.tfstate"
  #   region = "us-east-1"
  # }
}

provider "aws" {
  region = var.aws_region
}

# Data sources — use the account's default VPC to keep things simple


data "aws_vpc" "default" {
  default = true
}

data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
}

# Latest Ubuntu 24.04 LTS AMI (official Canonical images)
data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"]

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd-gp3/ubuntu-noble-24.04-amd64-server-*"]
  }
}

# Security groups

resource "aws_security_group" "ec2" {
  name        = "beanbalance-ec2"
  description = "Allow HTTP, HTTPS, and SSH inbound"
  vpc_id      = data.aws_vpc.default.id

  ingress {
    description = "SSH"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "beanbalance-ec2" }
}

resource "aws_security_group" "rds" {
  name        = "beanbalance-rds"
  description = "Allow PostgreSQL only from the EC2 instance"
  vpc_id      = data.aws_vpc.default.id

  ingress {
    description     = "PostgreSQL from EC2"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.ec2.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "beanbalance-rds" }
}

# EC2 instance

resource "aws_key_pair" "deployer" {
  key_name   = "beanbalance-deployer"
  public_key = var.ssh_public_key
}

resource "aws_instance" "app" {
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = var.ec2_instance_type
  key_name               = aws_key_pair.deployer.key_name
  vpc_security_group_ids = [aws_security_group.ec2.id]

  # Bootstraps Docker and Docker Compose on first boot
  user_data = <<-EOF
    #!/bin/bash
    apt-get update -y
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
      -o /etc/apt/keyrings/docker.asc
    chmod a+r /etc/apt/keyrings/docker.asc
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] \
      https://download.docker.com/linux/ubuntu \
      $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
      | tee /etc/apt/sources.list.d/docker.list > /dev/null
    apt-get update -y
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin git certbot
    systemctl enable docker
    systemctl start docker
    usermod -aG docker ubuntu
  EOF

  tags = { Name = "beanbalance-app" }
}

# Static public IP — this is what you point your DNS A record to
resource "aws_eip" "app" {
  instance = aws_instance.app.id
  domain   = "vpc"
  tags     = { Name = "beanbalance-app" }
}

# RDS — two separate PostgreSQL instances, one per service

resource "aws_db_subnet_group" "main" {
  name       = "beanbalance-db-subnets"
  subnet_ids = data.aws_subnets.default.ids
  tags       = { Name = "beanbalance-db-subnets" }
}

resource "aws_db_instance" "auth" {
  identifier             = "beanbalance-auth-db"
  engine                 = "postgres"
  engine_version         = "17"
  instance_class         = var.rds_instance_class
  allocated_storage      = 20
  db_name                = "auth_db"
  username               = "postgres"
  password               = var.auth_db_password
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  publicly_accessible    = false
  skip_final_snapshot    = true
  deletion_protection    = false

  tags = { Name = "beanbalance-auth-db" }
}

resource "aws_db_instance" "beanbalance" {
  identifier             = "beanbalance-bean-db"
  engine                 = "postgres"
  engine_version         = "17"
  instance_class         = var.rds_instance_class
  allocated_storage      = 20
  db_name                = "beanbalance"
  username               = "beanbalance"
  password               = var.bean_db_password
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  publicly_accessible    = false
  skip_final_snapshot    = true
  deletion_protection    = false

  tags = { Name = "beanbalance-bean-db" }
}
