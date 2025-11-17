terraform {
  required_providers {
    railway = {
      source  = "terraform-community-providers/railway"
      version = "~> 0.4.0"
    }
  }
}

variable "railway_project_id" {
  type        = string
  description = "Railway project ID"
}

variable "railway_environment_id" {
  type        = string
  description = "Railway environment ID"
}

variable "services" {
  description = "Map of service definitions"
  type = map(object({
    name                = string
    env                 = optional(map(string), {})
    repository          = optional(string)
    source_repo_branch  = optional(string)
    source_image        = optional(string)
  }))
}

resource "railway_service" "app" {
  for_each = var.services

  project_id = var.railway_project_id
  name       = each.value.name

  source_repo = try(each.value.repository, null)
  source_repo_branch = each.value.repository == null ? null : coalesce(try(each.value.source_repo_branch, null), "main")

  source_image = try(each.value.source_image, null)
}

resource "railway_variable" "service_env" {
  for_each = {
    for pair in flatten([
      for service_key, service in var.services : [
        for env_key, env_value in service.env : {
          key          = "${service_key}_${env_key}"
          service_key  = service_key
          service_id   = railway_service.app[service_key].id
          name         = env_key
          value        = env_value
        }
      ]
    ]) : pair.key => pair
  }

  service_id     = each.value.service_id
  environment_id = var.railway_environment_id
  name           = each.value.name
  value          = each.value.value
}

output "service_ids" {
  description = "Service IDs for all deployed services"
  value = {
    for _, svc in railway_service.app :
    svc.name => svc.id
  }
}

output "service_names" {
  description = "Service names for all deployed services"
  value = {
    for _, svc in railway_service.app :
    svc.name => svc.name
  }
}

