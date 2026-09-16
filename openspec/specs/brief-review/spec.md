# brief-review Specification

## Purpose
Lets the person who ran the call review the generated proposals, record a verdict and notes on each one, and export the reviewed brief as markdown to paste into the CRM or a proposal document.

## Requirements

### Requirement: Human verdict per proposal
For each proposal in a brief the user SHALL be able to set exactly one verdict among `worth it`, `inspiration` and `discard`, and write free-text notes. Verdicts and notes SHALL be kept only in the browser session; reloading the page discards them.

#### Scenario: Marking a proposal
- **WHEN** the user selects `inspiration` on a proposal and types a note
- **THEN** the proposal displays the selected verdict and the note, and the other proposals are unaffected

#### Scenario: Changing a verdict
- **WHEN** the user selects a different verdict on the same proposal
- **THEN** only the new verdict is shown as selected

### Requirement: Export reviewed brief as markdown
The system SHALL produce a markdown document containing the client summary, pains, every proposal with its effort, reuse assessment, verdict and notes, the open questions and the risk flags, and SHALL copy it to the clipboard on request.

#### Scenario: Copy as markdown
- **WHEN** the user clicks "Copy as markdown"
- **THEN** the clipboard contains the full brief in markdown including the verdicts and notes entered so far, and the UI confirms the copy

#### Scenario: Proposal without verdict
- **WHEN** the user exports before marking a proposal
- **THEN** that proposal appears in the markdown with verdict "not reviewed"
