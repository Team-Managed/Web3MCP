# Issue tracker

Issues and specs for this repo can live as local markdown files under `.scratch/` or on GitHub (`Team-Managed/Web3MCP`).

## Primary: Local Markdown

- One feature per directory: `.scratch/<feature-slug>/`
- The spec is `.scratch/<feature-slug>/spec.md`
- Implementation issues are one file per ticket at `.scratch/<feature-slug>/issues/<NN>-<slug>.md`, numbered from `01`, never a single combined tickets file
- Triage state is recorded as a `Status:` line near the top of each issue file (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`)
- Comments and conversation history append to the bottom of the file under a `## Comments` heading

## Remote: GitHub (Optional)

When `gh` CLI is installed and authenticated for `Team-Managed/Web3MCP`:
- Create issue: `gh issue create --title "..." --body "..."`
- Read issue: `gh issue view <number>`
- Close issue: `gh issue close <number>`

## When a skill says "publish to the issue tracker"

Create a new file under `.scratch/<feature-slug>/` (creating the directory if needed).

## When a skill says "fetch the relevant ticket"

Read the file at the referenced path.
