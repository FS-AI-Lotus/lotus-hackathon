terraform {
  required_version = ">= 1.6.0"

  required_providers {
    railway = {
      source  = "terraform-community-providers/railway"
      version = "~> 0.4.0"
    }
  }

  backend "local" {
    path = "terraform.tfstate"
  }
}

provider "railway" {
  token = var.railway_token
}

