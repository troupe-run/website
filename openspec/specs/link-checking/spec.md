# link-checking Specification

## Purpose

Checks that the links on the built site still lead somewhere, and makes sure a broken external link reaches a
person rather than passing silently, without letting other sites' outages block the project's own pull requests.

## Requirements

### Requirement: External links are checked on a schedule, outside pull requests
The external-link check SHALL run weekly and when started by hand. It SHALL NOT run on pull requests and SHALL NOT
be a required check, so a third-party outage never blocks a merge.

#### Scenario: A pull request does not run the external check
- **WHEN** a pull request is opened or updated
- **THEN** the external-link check does not run, and no required check depends on it

#### Scenario: The check can be started by hand
- **WHEN** a maintainer starts the external-link check by hand
- **THEN** it runs the same check and reporting as the weekly run

### Requirement: A broken external link fails the run
The external-link check SHALL finish with a failed status when any external link on the built site is broken after
retries.

#### Scenario: One broken link turns the run red
- **WHEN** the built site links to an external URL that returns an HTTP error or can't be reached after retries
- **THEN** the run's status is failed, not passed or "passed with errors"

#### Scenario: All links working leaves the run green
- **WHEN** every external link checked responds successfully
- **THEN** the run's status is passed

### Requirement: Transient failures are retried before a link counts as broken
The check SHALL retry a link that fails with a rate-limit response, a timeout or a connection error before
reporting it as broken.

#### Scenario: A link that recovers on retry is not reported
- **WHEN** an external URL fails on the first request and succeeds on a retry within the same run
- **THEN** it is not reported as broken and does not fail the run

### Requirement: An empty scan never passes
The check SHALL fail when it checked no external links, so a misconfigured skip or an empty build can't report
success.

#### Scenario: Every external link skipped
- **WHEN** the skip patterns exclude every external link on the built site
- **THEN** the run fails with a message saying the check checked no external links

### Requirement: Broken links are listed in the run's summary
A failed run SHALL list each broken link in its job summary with the URL, the status or error, and the page it was
found on.

#### Scenario: The red run explains itself
- **WHEN** a run finds a broken link
- **THEN** the run's summary shows that link's URL, its status, and the site page that links to it

### Requirement: One open issue tracks broken external links
When a run finds broken links and no tracking issue is open, the check SHALL open one issue in troupe-run/website
with a fixed title, listing each broken link, its status, the page linking to it, and the run.

#### Scenario: First failure opens the issue
- **WHEN** a run finds broken links and no open issue has the tracking title
- **THEN** exactly one issue is opened with that title, listing every broken link and linking to the run

### Requirement: Repeat failures update the open issue rather than opening another
When a run finds broken links and the tracking issue is already open, the check SHALL comment on that issue with the
current list and SHALL NOT open a second issue.

#### Scenario: Second failing week
- **WHEN** a run finds broken links and the tracking issue is already open
- **THEN** a comment with the current list and the run link is added to that issue, and no new issue is opened

### Requirement: A clean run closes the tracking issue
When a run finds no broken links and the tracking issue is open, the check SHALL close it with a comment linking to
the clean run, so an open tracking issue always means a link is broken now.

#### Scenario: Links fixed or the site recovered
- **WHEN** a run finds no broken links and the tracking issue is open
- **THEN** the issue is closed with a comment linking to the clean run

#### Scenario: Clean run with no open issue
- **WHEN** a run finds no broken links and no tracking issue is open
- **THEN** no issue is opened, commented on or closed

### Requirement: Skipped external URLs are few and each one has a reason
The check SHALL skip only URLs listed with a written reason next to them. The product repository,
github.com/troupe-run/troupe, SHALL be checked.

#### Scenario: The product repository link is checked
- **WHEN** the built site links to https://github.com/troupe-run/troupe
- **THEN** that link is requested and its result counts toward the run's outcome

#### Scenario: Every skip carries a reason
- **WHEN** the external check's skip list is read
- **THEN** every entry has a URL pattern and a non-empty reason, and the check takes its skips from that list alone

### Requirement: The tracking issue is put on the roadmap board
When a run opens the tracking issue or comments on it, the check SHALL add that issue to the troupe roadmap board
(troupe-run project 1) in the same run, so nobody has to add it by hand. The issue body SHALL NOT ask for a hand add.

#### Scenario: First failure puts the new issue on the board
- **WHEN** a run on `main` finds broken links and opens the tracking issue
- **THEN** the same run adds that issue to project 1, and the issue's project items list "troupe roadmap"

#### Scenario: A repeat failure leaves one card
- **WHEN** a run on `main` finds broken links and comments on a tracking issue that's already on the board
- **THEN** the run adds it again, which leaves the board with one card for it, not two

#### Scenario: A repeat failure puts an issue that's off the board back on it
- **WHEN** a run on `main` comments on a tracking issue that isn't on the board
- **THEN** the same run adds it to project 1

#### Scenario: Runs that don't open or comment don't touch the board
- **WHEN** a run closes the tracking issue, finds nothing to do, crashed, or checked no external links
- **THEN** nothing is written to the board

#### Scenario: The issue body doesn't ask for a hand add
- **WHEN** the tracking issue is opened or commented on
- **THEN** its text doesn't say to add it to the roadmap board by hand

### Requirement: Only a job that runs no site code can read the board credential
The board write SHALL be done in a job of its own that uses the `board` environment, checks out nothing, installs
nothing and runs no project code. Its `GITHUB_TOKEN` SHALL have no permissions. No other job SHALL use the `board`
environment or read `BOARD_APP_PRIVATE_KEY`.

#### Scenario: The job that builds the site can't read the key
- **WHEN** the workflow's jobs are read
- **THEN** the job that runs `npm ci` and the build has no environment and doesn't mention `BOARD_APP_PRIVATE_KEY`,
  and the only job that mentions it uses the `board` environment and has no checkout, setup or install step

#### Scenario: The board job's own token can write nothing
- **WHEN** the board job's permissions are read
- **THEN** they grant its `GITHUB_TOKEN` no permission at all

### Requirement: A failed board write is visible
If adding the issue to the board fails, the run SHALL fail, with the job that failed and its error shown in the run.
The issue SHALL still be opened or commented on, since the board write comes after it.

#### Scenario: The key is missing or rotated
- **WHEN** the board job can't mint its token or `gh project item-add` exits non-zero
- **THEN** the run's status is failed, the board job's log shows the error, and the tracking issue has still been
  opened or commented on

#### Scenario: A run on another branch
- **WHEN** a run started by hand on a branch other than `main` opens or comments on the tracking issue
- **THEN** GitHub refuses the board job the `board` environment, nothing is written to the board, and the run is
  failed

### Requirement: A run started by hand can check one extra URL
A run started by hand SHALL take an optional input, `extra-url`. When it's set, the run SHALL check that URL with the
same retries and reporting as the site's own links, listing it as found on a page whose name says it came from the
input. When it's empty, and in every scheduled run, the run SHALL check the site's links only.

#### Scenario: A URL that's certain to 404
- **WHEN** a maintainer starts the check by hand with `extra-url` set to `https://troupe.run/definitely-not-here-404`
- **THEN** the run reports that URL as broken with its status, the page it's found on says it came from the
  `extra-url` input, and the tracking issue is opened or commented on as for any broken link

#### Scenario: The input is left empty
- **WHEN** the check is started by hand with `extra-url` empty, or runs on its schedule
- **THEN** it checks exactly the site's external links, as before this change

#### Scenario: The extra URL is never published
- **WHEN** a run checks an `extra-url`
- **THEN** nothing it adds to the scan reaches the deployed site, because this workflow doesn't deploy

### Requirement: A malformed or skipped extra URL is refused
The check SHALL refuse an `extra-url` that isn't an absolute http or https URL, or that one of the skip patterns would
skip. It SHALL fail before checking any link, with a message that names the input, the value and the fix. It SHALL
NOT ignore the input and check the site only.

#### Scenario: Not a URL
- **WHEN** the check is started by hand with `extra-url` set to `troupe.run/x` or `ftp://troupe.run/x`
- **THEN** the run fails before checking links, saying `extra-url` must be an absolute http(s) URL and showing the
  value given

#### Scenario: A skipped URL
- **WHEN** the check is started by hand with an `extra-url` that matches a skip pattern
- **THEN** the run fails before checking links, naming the skip pattern it matched, since a skipped URL would prove
  nothing
