output "service_url" {
  value = kubernetes_service.frontend.status.0.load_balancer.0.ingress.0.hostname
}
