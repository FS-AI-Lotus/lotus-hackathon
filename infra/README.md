# Terraform Infrastructure for Lotus Hackathon

This directory contains the Terraform configuration for deploying the Lotus Hackathon platform infrastructure on Railway.

## Prerequisites

- Terraform >= 1.6.0 installed
- Railway account with project access
- Railway API token

## Configuration

### Required Variables

The following variables are required (or have defaults set):

- `railway_token` - Railway API token (sensitive)
- `railway_project_id` - Railway project ID (default: `8632d9e3-3e0f-4fe2-8271-b12306d776ba`)
- `railway_environment_id` - Railway environment ID (default: `9290683b-f743-469c-9c05-6a439e73ba4a`)

### Setting Variables

You can set variables in three ways:

1. **terraform.tfvars file** (recommended for local development):
   ```hcl
   railway_token         = "your-token-here"
   railway_project_id    = "8632d9e3-3e0f-4fe2-8271-b12306d776ba"
   railway_environment_id = "9290683b-f743-469c-9c05-6a439e73ba4a"
   ```

2. **Environment variables**:
   ```powershell
   $env:TF_VAR_railway_token = "your-token-here"
   ```

3. **Command line**:
   ```bash
   terraform apply -var="railway_token=your-token-here"
   ```

## Usage

### Initialize Terraform

```bash
cd infra
terraform init
```

### Plan Changes

```bash
terraform plan
```

### Apply Changes

```bash
terraform apply
```

### Verify Deployment

After applying, you can verify the deployment by:

1. Checking the outputs:
   ```bash
   terraform output
   ```

2. Visiting the Railway dashboard:
   https://railway.com/project/8632d9e3-3e0f-4fe2-8271-b12306d776ba?environmentId=9290683b-f743-469c-9c05-6a439e73ba4a

## Service Provisioned

Team 1 provisions only the **Management Reporting** microservice infrastructure. Team 3
and Team 2 can extend/reconfigure it (additional env vars, secrets, CI/CD hooks) by
updating `infra/main.tf` or using the Railway dashboard.

- **management-reporting** (provisioned as `management-reporting-<env-suffix>`)
  - Env: `PORT=3200`
  - Repository/image attachment handled later via Railway or Team 3 automation

## Outputs

After deployment, Terraform outputs:

- `service_ids` - Map of service IDs
- `service_names` - Map of service names
- `project_id` - Railway project ID
- `environment_id` - Railway environment ID

## Verification Process

To verify the infrastructure works correctly:

1. Delete all services in Railway dashboard
2. Run `terraform apply`
3. Verify all services are recreated with working URLs
4. Check that service IDs and names are output correctly

## Module Structure

```
infra/
├── main.tf              # Root module configuration
├── variables.tf        # Variable definitions
├── outputs.tf          # Output definitions
├── providers.tf        # Provider configuration
├── terraform.tfvars    # Variable values (gitignored)
└── services/
    └── main.tf         # Services module
```

## Notes

- The `terraform.tfvars` file is gitignored to protect sensitive tokens
- Use `terraform.tfvars.example` as a template
- State is stored locally in `terraform.tfstate` (consider remote backend for production)

