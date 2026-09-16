## ADDED Requirements

### Requirement: The idle screen explains the tool
Before any analysis has been run, the system SHALL show what the tool does: the steps of the
workflow, from pasting the notes to exporting the reviewed brief, and what a brief contains.
This explanation SHALL be replaced by the brief once one has been generated, and SHALL NOT
require scrolling past an empty input to be read.

#### Scenario: First load
- **WHEN** the app is opened and no analysis has been run
- **THEN** the screen names the three steps of the workflow and what the brief comes back with, above or beside the notes input

#### Scenario: After an analysis
- **WHEN** a brief has been generated
- **THEN** the explanation is no longer shown and the brief occupies that space

### Requirement: Configuration state is visible before the first analysis
The system SHALL report in the browser, from `GET /api/health`, whether the analysis service
is configured, so that a missing key is visible before notes are pasted rather than after an
analysis is attempted. The indicator SHALL NOT display any secret value, and a failure to
reach the health endpoint SHALL NOT block the input.

#### Scenario: Service configured
- **WHEN** the health endpoint reports the service as configured
- **THEN** the shell shows a ready state alongside the number of past projects in the portfolio

#### Scenario: Key missing
- **WHEN** the health endpoint reports the service as not configured
- **THEN** the shell says so in plain language before any notes are pasted

#### Scenario: Health check unavailable
- **WHEN** the health endpoint cannot be reached
- **THEN** the indicator is omitted and the notes input remains usable
