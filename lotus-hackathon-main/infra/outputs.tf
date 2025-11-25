output "service_ids" {
  description = "Service IDs for Coordinator + microservices"
  value       = module.services.service_ids
}

output "service_names" {
  description = "Service names for Coordinator + microservices"
  value       = module.services.service_names
}

output "project_id" {
  description = "Railway project ID"
  value       = var.railway_project_id
}

output "environment_id" {
  description = "Railway environment ID"
  value       = var.railway_environment_id
}

