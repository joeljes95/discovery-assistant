# service-health Specification

## Purpose
Exposes a minimal health endpoint so a deploy or a monitor can confirm the service is up and correctly configured without running an analysis.

## Requirements

### Requirement: Health endpoint
The system SHALL expose `GET /api/health` returning HTTP 200 with a JSON body that includes a status, the configured model name, whether LLM credentials are present (as a boolean, never the value), and the spend limits in force. The body SHALL NOT include any secret value.

#### Scenario: Configured service
- **WHEN** `GET /api/health` is called and credentials are configured
- **THEN** the response is 200 with `status: "ok"` and `llmConfigured: true`

#### Scenario: Unconfigured service
- **WHEN** `GET /api/health` is called and credentials are missing
- **THEN** the response is 200 with `status: "degraded"` and `llmConfigured: false`

#### Scenario: Limits are reported
- **WHEN** `GET /api/health` is called
- **THEN** the body includes the configured per-address maximum, the window length and the daily cap

### Requirement: Health reports observed analysis volume
The system SHALL report, on the health endpoint, how many analyses the responding instance has admitted during the current UTC day, so that the guard can be observed working without spending an analysis to trip it. The response SHALL make clear that this count covers the responding instance only.

#### Scenario: Count reflects an admitted analysis
- **WHEN** an analysis is admitted by the guard and the same instance then serves a health check
- **THEN** the reported count is higher than before that analysis

#### Scenario: Count is not presented as global
- **WHEN** `GET /api/health` is called
- **THEN** the count is labelled as belonging to the responding instance rather than to the deployment as a whole

#### Scenario: Count resets with the daily budget
- **WHEN** the UTC day rolls over
- **THEN** the reported count returns to zero alongside the daily cap it is measured against
