[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [string]$ProjectId,
  [string]$Region = "asia-south1",
  [string]$Repository = "educonnect",
  [string]$Service = "school-api",
  [string]$RuntimeServiceAccount = "",
  [string]$StorageBucket = "",
  [Parameter(Mandatory = $true)]
  [string]$CorsOrigins,
  [Parameter(Mandatory = $true)]
  [string]$AdminEmail
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

if (-not (Get-Command gcloud -ErrorAction SilentlyContinue)) {
  throw "gcloud CLI is required and was not found in PATH."
}

if (-not $RuntimeServiceAccount) {
  $RuntimeServiceAccount = "school-api@$ProjectId.iam.gserviceaccount.com"
}
if (-not $StorageBucket) {
  $StorageBucket = "$ProjectId.appspot.com"
}

$gitSha = (& git rev-parse --short HEAD 2>$null)
$imageTag = if ($LASTEXITCODE -eq 0 -and $gitSha) { $gitSha.Trim() } else { Get-Date -Format "yyyyMMddHHmmss" }

& gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com secretmanager.googleapis.com --project $ProjectId
if ($LASTEXITCODE -ne 0) { throw "Failed to enable required Google Cloud APIs." }

& gcloud artifacts repositories describe $Repository --location $Region --project $ProjectId 2>$null
if ($LASTEXITCODE -ne 0) {
  & gcloud artifacts repositories create $Repository --repository-format docker --location $Region --project $ProjectId
  if ($LASTEXITCODE -ne 0) { throw "Failed to create Artifact Registry repository." }
}

$substitutions = @(
  "_REGION=$Region",
  "_REPOSITORY=$Repository",
  "_SERVICE=$Service",
  "_IMAGE_TAG=$imageTag",
  "_RUNTIME_SERVICE_ACCOUNT=$RuntimeServiceAccount",
  "_STORAGE_BUCKET=$StorageBucket",
  "_CORS_ORIGINS=$CorsOrigins",
  "_ADMIN_EMAIL=$AdminEmail"
) -join ","

& gcloud builds submit . --project $ProjectId --config cloudbuild.yaml --substitutions $substitutions
if ($LASTEXITCODE -ne 0) { throw "Cloud Build deployment failed." }

& gcloud run services describe $Service --region $Region --project $ProjectId --format "value(status.url)"
