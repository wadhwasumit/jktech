# -----------------------------
# Images
# -----------------------------
variable "image_api_gateway" {
  type = string
}

variable "image_document_service" {
  type = string
}

variable "image_auth_service" {
  type = string
}

variable "image_frontend" {
  type = string
}

variable "image_consul" {
  type    = string
  default = "hashicorp/consul:1.14.0"
}

variable "image_postgres" {
  type    = string
  default = "postgres:16"
}

variable "image_pgadmin" {
  type    = string
  default = "dpage/pgadmin4:latest"
}

# -----------------------------
# App Environment
# -----------------------------
variable "env_node_env" {
  type    = string
  default = "development"
}

variable "consul_host" {
  type    = string
  default = "consul"
}

variable "consul_port" {
  type    = number
  default = 8500
}

variable "API_URL" {
  type    = string
  default = "/api"
}

variable "GOOGLE_CLIENT_ID" {
  type    = string
  default = "your client id"
}

variable "GOOGLE_CLIENT_SECRET" {
  type    = string
  default = "your client secret"
}



variable "JWT_SECRET" {
  type    = string
  default = "123456"
}

variable "JWT_EXPIRES_IN" {
  type    = string
  default = "1h"
}

variable "DATABASE_URL" {
  type    = string
  default = "postgresql://postgres:postgres@postgres:5432/auth_db?schema=public"
}

# -----------------------------
# Postgres
# -----------------------------
variable "pg_user" {
  type    = string
  default = "postgres"
}

variable "pg_password" {
  type    = string
  default = "postgres"
}

variable "pg_db" {
  type    = string
  default = "auth_db"
}

variable "pg_storage_size" {
  type    = string
  default = "10Gi"
}

# -----------------------------
# pgAdmin
# -----------------------------
variable "pgadmin_email" {
  type    = string
  default = "admin@example.com"
}

variable "pgadmin_password" {
  type    = string
  default = "admin"
}

# -----------------------------
# Storage (Uploads)
# -----------------------------
variable "uploads_storage_size" {
  type    = string
  default = "5Gi"
}

# -----------------------------
# EKS Cluster Config
# -----------------------------
variable "eks_cluster_endpoint" {
  type = string
}

variable "eks_cluster_ca_cert" {
  type = string
}

variable "eks_cluster_auth_token" {
  type = string
}
