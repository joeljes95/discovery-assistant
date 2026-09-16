## ADDED Requirements

### Requirement: Analyses are rate limited per caller
The system SHALL limit how many analyses a single client address may run inside a sliding time window. A request beyond that limit SHALL be rejected before the LLM is called, with HTTP 429, a `Retry-After` header in seconds, and an error marked retryable.

#### Scenario: Caller within the limit
- **WHEN** a client address has made fewer analyses than the per-address limit inside the window
- **THEN** the request proceeds to the analysis

#### Scenario: Caller over the limit
- **WHEN** a client address has already reached the per-address limit inside the window
- **THEN** the response is 429 with a `Retry-After` header and `retryable: true`, and no LLM call is made

#### Scenario: Window slides
- **WHEN** enough time passes that the caller's oldest counted analysis falls outside the window
- **THEN** that caller may run an analysis again

#### Scenario: Callers are counted independently
- **WHEN** one client address has reached its limit
- **THEN** a different client address is unaffected

### Requirement: Total daily analyses are capped
The system SHALL cap the total number of analyses across all callers within one UTC day. This bound SHALL apply regardless of client address, so that a caller presenting many different addresses cannot exceed it. A request beyond the cap SHALL be rejected with HTTP 429, a `Retry-After` header pointing at the next UTC midnight, and an error marked not retryable.

#### Scenario: Cap reached by distinct addresses
- **WHEN** the daily cap has been reached by requests from several different client addresses
- **THEN** a further request from any address is rejected with 429 and `retryable: false`

#### Scenario: Daily cap takes precedence
- **WHEN** a request would be rejected by both the per-address limit and the daily cap
- **THEN** the rejection names the daily cap, so the message states the real reason

#### Scenario: Cap resets at UTC midnight
- **WHEN** the UTC day rolls over
- **THEN** the daily count resets and analyses are accepted again

### Requirement: Rejected requests do not consume quota
The system SHALL count an analysis against the limits only when it is admitted. Requests rejected by input validation or by the guard itself SHALL NOT consume either budget.

#### Scenario: Invalid input does not cost the caller quota
- **WHEN** a request is rejected because the notes are too short or too long
- **THEN** the caller's remaining quota is unchanged

#### Scenario: A rejection does not spend the daily budget
- **WHEN** a caller repeatedly hits its per-address limit
- **THEN** those rejections do not reduce the daily budget available to other callers

### Requirement: Limits are configurable without a code change
The system SHALL read the per-address limit, the window length and the daily cap from the environment, falling back to documented defaults.

#### Scenario: Override supplied
- **WHEN** the environment sets a limit override
- **THEN** the guard uses the supplied value instead of the default
