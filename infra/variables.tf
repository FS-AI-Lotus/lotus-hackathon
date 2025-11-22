variable "railway_token" {
  description = "Railway API token with project access"
  type        = string
  sensitive   = true
}

variable "railway_project_id" {
  description = "Railway project ID that hosts coordinator + microservices"
  type        = string
  default     = "8632d9e3-3e0f-4fe2-8271-b12306d776ba"
}

variable "railway_environment_id" {
  description = "Railway environment ID for all services"
  type        = string
  default     = "9290683b-f743-469c-9c05-6a439e73ba4a"
}

