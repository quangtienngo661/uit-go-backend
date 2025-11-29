# Self-Service Platform (Terraform + GitHub Actions)

## Layout
- `infra/modules/*`: Reusable building blocks (network, ECS cluster, ALB, service, RDS, FinOps).
- `infra/stacks/dev`: Example stack wiring modules together for all services.
- Workflows:
  - `.github/workflows/self-service.yml`: build/push a single service image and run Terraform plan/apply via OIDC.
  - `.github/workflows/ci.yml`: lint/build.
  - `.github/workflows/docker-publish.yml`: build/push all images.

## Usage
1) Configure GitHub secrets:
   - `AWS_OIDC_ROLE_ARN`: IAM role for OIDC GitHub Actions.
   - (Optional) `RENDER_DEPLOY_HOOK` or other deploy hooks.
2) Trigger **Self-Service Deploy** workflow (Actions tab):
   - Choose `service` (apps/*), `environment` (folder under `infra/stacks`), `image_tag`, `apply` (true to apply, false to plan).
3) The workflow:
   - Builds & pushes `apps/<service>/Dockerfile` to GHCR.
   - Runs `terraform init/plan` (and `apply` if requested) in `infra/stacks/<environment>`.
   - Overrides only the chosen service image tag; others use defaults (`local.default_images`).

## Extending
- Add a new stack: copy `infra/stacks/dev` to `staging`/`prod`, tweak variables.
- Add a service: update `local.service_cfg` and `local.default_images` in the stack, then run the workflow with that service name.
- Modules are thin wrappers over upstream terraform-aws-modules; add optional data stores (Redis/MQ) similarly if needed.
