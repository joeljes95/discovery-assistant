# discovery-brief Specification

## Purpose
Turns the raw notes or transcript of a discovery call into a structured, validated brief with proposals matched against AdoptAI's past-projects portfolio, so a human can review it instead of starting from a blank page.

## Requirements

### Requirement: Analyze pasted call notes
The system SHALL accept free text (notes or transcript) of a discovery call and return a brief containing: a client summary, a list of detected pains, between 2 and 3 proposals, a list of open questions for the next call, and a list of risk flags.

#### Scenario: Notes produce a brief
- **WHEN** the user submits notes describing a client and at least one operational problem
- **THEN** the system returns a brief with a client summary, at least one pain, 2 to 3 proposals, and the open questions and risk flags lists (possibly empty)

#### Scenario: Notes are too short to analyze
- **WHEN** the user submits fewer than 50 characters
- **THEN** the system rejects the request before calling the LLM and tells the user the notes are too short

### Requirement: Each proposal carries a reuse match against the portfolio
Each proposal SHALL include a title, a description of what it does, an effort estimate of S, M or L, and a reuse assessment with level `reuse`, `adapt` or `new`, a reason, and, when the level is `reuse` or `adapt`, the id of the matched past project from the portfolio.

#### Scenario: Proposal matches a past project
- **WHEN** the client's problem resembles a project in the portfolio
- **THEN** the proposal's reuse level is `reuse` or `adapt` and references that project's id, and the UI shows the matched project's name and a one-line description

#### Scenario: Proposal has no precedent
- **WHEN** the client's problem resembles nothing in the portfolio
- **THEN** the proposal's reuse level is `new` and no project id is referenced

### Requirement: Invented portfolio ids are neutralized
The system SHALL verify every referenced project id against the portfolio. A proposal referencing an id that does not exist SHALL be downgraded to level `new`, the reference removed, and the user SHALL be told that the model cited an unknown project.

#### Scenario: Model cites a non-existent project
- **WHEN** the LLM returns a proposal referencing a project id not present in the portfolio
- **THEN** the brief is still returned, that proposal shows level `new`, and a visible warning names the unknown id

### Requirement: Malformed LLM output is retried once
The system SHALL validate the LLM output against the brief schema. On a validation failure it SHALL retry the call exactly once, passing the validation error back to the model. If the retry also fails, the system SHALL return an error that states the output could not be validated.

#### Scenario: First attempt malformed, retry succeeds
- **WHEN** the first LLM response fails schema validation and the second passes
- **THEN** the user receives the brief from the second response

#### Scenario: Both attempts malformed
- **WHEN** both LLM responses fail schema validation
- **THEN** the user sees an error saying the analysis could not be validated and is invited to retry, with no partial brief shown

### Requirement: Input length is capped
The system SHALL reject input longer than 20,000 characters before calling the LLM and tell the user the limit and the current length.

#### Scenario: Oversized transcript
- **WHEN** the user submits 25,000 characters
- **THEN** no LLM call is made and the user sees a message with the 20,000 character limit and their current length

### Requirement: LLM failures are surfaced clearly
The system SHALL bound each LLM call with a timeout and SHALL map timeouts, authentication errors, rate limits and other provider errors to a plain-language message that distinguishes a configuration problem from a transient one.

#### Scenario: Missing credentials
- **WHEN** the LLM credentials are not configured
- **THEN** the user sees a message saying the service is not configured, not a generic failure

#### Scenario: Provider timeout
- **WHEN** the LLM call exceeds the timeout
- **THEN** the user sees a message saying the analysis timed out and can retry

### Requirement: Estimated cost is shown per analysis
The system SHALL report, with each successful brief, the input and output token counts and an estimated cost in USD derived from the model's published prices, and the UI SHALL display it.

#### Scenario: Successful analysis shows cost
- **WHEN** a brief is returned
- **THEN** the UI shows the token counts and the estimated cost in USD with the model name

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
