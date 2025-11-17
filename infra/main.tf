locals {
  name_suffix       = substr(var.railway_environment_id, 0, 8)
  service_base_name = "management-reporting"

  default_services = {
    management_reporting = {
      name = "${local.service_base_name}-${local.name_suffix}"
      env = {
        PORT = "3200"
      }
    }

    content_studio = {
      name = "content-studio"
    }

    devlab = {
      name = "devlab"
    }

    assessment = {
      name = "assessment"
    }

    ai_learner = {
      name = "ai-learner"
    }

    learning_analytics = {
      name = "learning-analytics"
    }

    directory_and_rag = {
      name = "directory-and-rag"
    }

    skills_engine = {
      name = "skills-engine"
    }
  }
}

module "services" {
  source = "./services"

  railway_project_id     = var.railway_project_id
  railway_environment_id = var.railway_environment_id
  services               = local.default_services
}

