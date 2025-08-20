output "eks_cluster_id" {
  value = aws_eks_cluster.my_cluster.id
}

output "eks_cluster_endpoint" {
  value = aws_eks_cluster.my_cluster.endpoint
}

output "eks_cluster_ca_cert" {
  value = aws_eks_cluster.my_cluster.certificate_authority[0].data
}
