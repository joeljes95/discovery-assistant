## MODIFIED Requirements

### Requirement: Input length is capped
The system SHALL reject input longer than 60,000 characters before calling the LLM and tell
the user the limit and the current length. The cap SHALL be large enough to hold the raw
transcript of a call of about an hour, and the per-call timeout SHALL be large enough for an
input of that size to complete.

#### Scenario: Oversized transcript
- **WHEN** the user submits 75,000 characters
- **THEN** no LLM call is made and the user sees a message with the 60,000 character limit and their current length

#### Scenario: Full-length transcript
- **WHEN** the user submits a transcript close to the cap
- **THEN** the request is accepted and the analysis is given enough time to finish rather than timing out inside the budget
