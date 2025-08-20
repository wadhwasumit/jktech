provider "kubernetes" {
  host                   = var.eks_cluster_endpoint
  token                  = var.eks_cluster_auth_token
  cluster_ca_certificate = base64decode(var.eks_cluster_ca_cert)
}

############################
# Consul (Dev agent)
############################
resource "kubernetes_deployment" "consul" {
  metadata {
    name = "consul"
  }

  spec {
    replicas = 1

    selector {
      match_labels = {
        app = "consul"
      }
    }

    template {
      metadata {
        labels = {
          app = "consul"
        }
      }

      spec {
        container {
          name  = "consul"
          image = var.image_consul
          args  = ["agent", "-dev", "-client=0.0.0.0", "-bind=0.0.0.0"]

          env {
            name  = "CONSUL_BIND_INTERFACE"
            value = "eth0"
          }

          port {
            container_port = 8500
          }

          readiness_probe {
            tcp_socket {
              port = 8500
            }
            initial_delay_seconds = 5
            period_seconds        = 5
          }

          resources {
            requests = {
              cpu    = "50m"
              memory = "128Mi"
            }
            limits = {
              cpu    = "500m"
              memory = "512Mi"
            }
          }
        }
      }
    }
  }
}

resource "kubernetes_service" "consul" {
  metadata {
    name = "consul"
  }

  spec {
    selector = {
      app = "consul"
    }

    port {
      name        = "http"
      port        = 8500
      target_port = 8500
    }

    type = "LoadBalancer" # change to ClusterIP if you don't need external UI
  }
}

############################
# Postgres (StatefulSet)
############################

resource "kubernetes_stateful_set" "postgres" {
  metadata {
    name = "postgres"
  }

  spec {
    service_name = "postgres"
    replicas     = 1

    selector {
      match_labels = {
        app = "postgres"
      }
    }

    template {
      metadata {
        labels = {
          app = "postgres"
        }
      }

      spec {
        container {
          name  = "postgres"
          image = var.image_postgres

          env {
            name  = "POSTGRES_USER"
            value = var.pg_user
          }
          env {
            name  = "POSTGRES_DB"
            value = var.pg_db
          }
          env {
            name = "POSTGRES_PASSWORD"
            value = var.pg_password
          }
          env {
            name  = "PGDATA"
            value = "/var/lib/postgresql/data/pgdata"
          }

          port {
            container_port = 5432
          }

          readiness_probe {
            exec {
              command = ["sh", "-lc", "pg_isready -U ${var.pg_user} -d ${var.pg_db}"]
            }
            initial_delay_seconds = 10
            period_seconds        = 10
            failure_threshold     = 10
          }

          volume_mount {
            name       = "pgdata"
            mount_path = "/var/lib/postgresql/data"
          }

          resources {
            requests = {
              cpu    = "100m"
              memory = "256Mi"
            }
            limits = {
              cpu    = "1"
              memory = "1Gi"
            }
          }
        }
         # EPHEMERAL storage for Postgres (no persistence)
        volume {
          name = "pgdata"
          empty_dir {}
        }
      }
    }    
  }
}

resource "kubernetes_service" "postgres" {
  metadata {
    name = "postgres"
  }

  spec {
    selector = {
      app = "postgres"
    }

    port {
      name        = "db"
      port        = 5432
      target_port = 5432
    }

    type = "ClusterIP"
  }
}



############################
# Document Service
############################


resource "kubernetes_deployment" "document_service" {
  metadata {
    name = "document-service"
  }

  spec {
    replicas = 1

    selector {
      match_labels = {
        app = "document-service"
      }
    }

    template {
      metadata {
        labels = {
          app = "document-service"
        }
      }

      spec {
        init_container {
          name    = "wait-for-postgres"
          image   = "busybox:1.36"
          command = ["/bin/sh","-c"]
          args    = ["until nc -z postgres 5432; do echo waiting for postgres; sleep 2; done"]
        }

        init_container {
          name    = "wait-for-consul"
          image   = "busybox:1.36"
          command = ["/bin/sh","-c"]
          args    = ["until nc -z consul 8500; do echo waiting for consul; sleep 2; done"]
        }
        container {
          name  = "document-service"
          image = var.image_document_service
          image_pull_policy = "Always"
          env {
            name  = "NODE_ENV"
            value = var.env_node_env
          }
          env {
            name  = "CONSUL_HOST"
            value = var.consul_host
          }
          env {
            name  = "CONSUL_PORT"
            value = tostring(var.consul_port)
          }

          port {
            container_port = 3006
          }
          port {
            container_port = 4001
          }

          readiness_probe {
            http_get {
              path = "/health"
              port = 3006
            }
            initial_delay_seconds = 10
            period_seconds        = 10
            failure_threshold     = 10
          }

          volume_mount {
            name       = "uploads"
            mount_path = "/app/uploads"
          }

          resources {
            requests = {
              cpu    = "100m"
              memory = "256Mi"
            }
            limits = {
              cpu    = "1"
              memory = "1Gi"
            }
          }
        }

        volume {
          name = "uploads"
          empty_dir {}
        }
      }
    }
  }
}

resource "kubernetes_service" "document_service" {
  metadata {
    name = "document-service"
  }

  spec {
    selector = {
      app = "document-service"
    }

    port {
      name        = "http"
      port        = 3006
      target_port = 3006
    }
    port {
      name        = "tcp"
      port        = 4001
      target_port = 4001
    }

    type = "ClusterIP"
  }
}

############################
# Auth Service
############################
resource "kubernetes_deployment" "auth_service" {
  metadata {
    name = "auth-service"
  }

  spec {
    replicas = 1

    selector {
      match_labels = {
        app = "auth-service"
      }
    }

    template {
      metadata {
        labels = {
          app = "auth-service"
        }
      }

      spec {
        init_container {
          name    = "wait-for-postgres"
          image   = "busybox:1.36"
          command = ["/bin/sh","-c"]
          args    = ["until nc -z postgres 5432; do echo waiting for postgres; sleep 2; done"]
        }

        # run prisma migrate deploy with retries
        

        init_container {
          name    = "wait-for-consul"
          image   = "busybox:1.36"
          command = ["/bin/sh","-c"]
          args    = ["until nc -z consul 8500; do echo waiting for consul; sleep 2; done"]
        }
        
        container {
          name  = "auth-service"
          image = var.image_auth_service
          image_pull_policy = "Always"
          env {
            name  = "NODE_ENV"
            value = var.env_node_env
          }
          env {
            name  = "CONSUL_HOST"
            value = var.consul_host
          }
          env {
            name  = "CONSUL_PORT"
            value = tostring(var.consul_port)
          }
          env {
            name  = "JWT_SECRET"
            value = var.JWT_SECRET
          }
          env {
            name  = "JWT_EXPIRES_IN"
            value = tostring(var.JWT_EXPIRES_IN)
          }
          env {
            name  = "GOOGLE_CLIENT_ID"
            value = var.GOOGLE_CLIENT_ID
          }

          env {
            name  = "GOOGLE_CLIENT_SECRET"
            value = var.GOOGLE_CLIENT_SECRET
          }
          
          
          port {
            container_port = 3003
          }
          port {
            container_port = 3004
          }

          readiness_probe {
            http_get {
              path = "/health"
              port = 3003
            }
            initial_delay_seconds = 10
            period_seconds        = 10
            failure_threshold     = 10
          }

          resources {
            requests = {
              cpu    = "50m"
              memory = "128Mi"
            }
            limits = {
              cpu    = "500m"
              memory = "512Mi"
            }
          }
        }
      }
    }
  }
}

resource "kubernetes_service" "auth_service" {
  metadata {
    name = "auth-service"
  }

  spec {
    selector = {
      app = "auth-service"
    }

    port {
      name        = "http"
      port        = 3003
      target_port = 3003
    }
    port {
      name        = "tcp"
      port        = 3004
      target_port = 3004
    }

    type = "ClusterIP"
  }
}

############################
# API Gateway
############################
resource "kubernetes_deployment" "api_gateway" {
  metadata {
    name = "api-gateway"
  }

  spec {
    replicas = 1

    selector {
      match_labels = {
        app = "api-gateway"
      }
    }

    template {
      metadata {
        labels = {
          app = "api-gateway"
        }
      }

      spec {
        
        
        container {
          name  = "api-gateway"
          image = var.image_api_gateway
          image_pull_policy = "Always"
          env {
            name  = "NODE_ENV"
            value = var.env_node_env
          }
          env {
            name  = "CONSUL_HOST"
            value = var.consul_host
          }
          env {
            name  = "CONSUL_PORT"
            value = tostring(var.consul_port)
          }
          
          env {
            name  = "JWT_SECRET"
            value = var.JWT_SECRET
          }
          env {
            name  = "JWT_EXPIRES_IN"
            value = tostring(var.JWT_EXPIRES_IN)
          }
          
          port {
            container_port = 3000
          }

          readiness_probe {
            tcp_socket { port = 3000 }
            initial_delay_seconds = 10
            period_seconds        = 10
            failure_threshold     = 10
          }

          resources {
            requests = {
              cpu    = "50m"
              memory = "128Mi"
            }
            limits = {
              cpu    = "500m"
              memory = "512Mi"
            }
          }
        }
      }
    }
  }
}

resource "kubernetes_service" "api_gateway" {
  metadata {
    name = "api-gateway"
  }

  spec {
    selector = {
      app = "api-gateway"
    }

    port {
      name        = "http"
      port        = 3000
      target_port = 3000
    }

    type = "LoadBalancer"
  }
}

############################
# Frontend (Angular/NGINX)
############################
resource "kubernetes_deployment" "frontend" {
  metadata {
    name = "frontend"
  }

  spec {
    replicas = 1

    selector {
      match_labels = {
        app = "frontend"
      }
    }

    template {
      metadata {
        labels = {
          app = "frontend"
        }
      }

      spec {
        container {
          name  = "frontend"
          image = var.image_frontend
          image_pull_policy = "Always"
          port {
            container_port = 80
          }
          env {
            name  = "API_URL"
            value = var.API_URL
          }
          env {
            name  = "GOOGLE_CLIENT_ID"
            value = var.GOOGLE_CLIENT_ID
          }
          
          
          readiness_probe {
            http_get {
              path = "/"
              port = 80
            }
            initial_delay_seconds = 10
            period_seconds        = 10
          }

          resources {
            requests = {
              cpu    = "50m"
              memory = "128Mi"
            }
            limits = {
              cpu    = "500m"
              memory = "512Mi"
            }
          }
        }
      }
    }
  }
}

resource "kubernetes_service" "frontend" {
  metadata {
    name = "frontend"
  }

  spec {
    selector = {
      app = "frontend"
    }

    port {
      name        = "http"
      port        = 4200
      target_port = 80
    }    

    type = "LoadBalancer"
  }
}
