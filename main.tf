provider "aws" {
  region = "ap-south-1"
}

module "eks" {
  source       = "./modules/eks"
  cluster_name = "my-cluster"
  subnet_ids = [
      "subnet-0c462540bb7448343",
      "subnet-0bf5b6b668cc7c0c8",
      "subnet-07b827e38ed786107",
    ]
}

data "aws_eks_cluster_auth" "eks_auth" {
  name = module.eks.eks_cluster_id
}

module "k8s" {
  source                  = "./modules/k8s"
  # images in a registry (push your Dockerfiles first)
  image_api_gateway      = "public.ecr.aws/i7x3m4y4/sumit-repo:api-gateway"
  image_document_service = "public.ecr.aws/i7x3m4y4/sumit-repo:document-service"
  image_auth_service     = "public.ecr.aws/i7x3m4y4/sumit-repo:auth-service"
  image_frontend         = "public.ecr.aws/i7x3m4y4/sumit-repo:frontend"
  eks_cluster_endpoint    = module.eks.eks_cluster_endpoint
  eks_cluster_ca_cert     = module.eks.eks_cluster_ca_cert
  eks_cluster_auth_token  = data.aws_eks_cluster_auth.eks_auth.token
   
}
