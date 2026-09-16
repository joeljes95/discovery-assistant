# service-health Specification

## Purpose
Exposes a minimal health endpoint so a deploy or a monitor can confirm the service is up and correctly configured without running an analysis.

## Requirements

### Requirement: Health endpoint
The system SHALL expose `GET /api/health` returning HTTP 200 with a JSON body that includes a status, the configured model name, and whether LLM credentials are present (as a boolean, never the value).

#### Scenario: Configured service
- **WHEN** `GET /api/health` is called and credentials are configured
- **THEN** the response is 200 with `status: "ok"` and `llmConfigured: true`

#### Scenario: Unconfigured service
- **WHEN** `GET /api/health` is called and credentials are missing
- **THEN** the response is 200 with `status: "degraded"` and `llmConfigured: false`
