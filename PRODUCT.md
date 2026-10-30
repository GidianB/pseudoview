# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Two groups, with equal weight:

- The owner, on their own projects: coming back to code they or their AI agents wrote, to see what it does without
  reading the source.
- Developers who don't know the codebase: joining, reviewing or evaluating a project. The page must work for a
  reader with no prior knowledge of the project.

Readers are developers. They can read code but want to skip it. The pseudocode must not depend on knowing the
project's language.

## Product Purpose

pseudoview turns any codebase into plain-English pseudocode, one summary and pseudocode block per function, linked
by calls. A reader follows a call chain from an entry point down, one column per function, without opening the
source.

Readers open the page at four moments:

1. Before changing code: to find where something happens and what a change would touch.
2. Reviewing a commit or pull request: to see what changed, in plain words.
3. Onboarding: a first tour of entry points, the main flow and the rules the code enforces.
4. Checking agent-written code: to confirm that code an AI agent wrote does what was asked.

Success: a reader understands what a function does, and why, faster than from the code, and trusts that the page
matches the code.

## Positioning

Code and an AI agent split the work. The parser (tree-sitter) produces the structure: functions, line numbers, calls
and a hash of each body. That part is exact and needs no AI. The agent writes only the words. Only functions whose
hash changed go back to the agent, and the page marks descriptions that are older than their code. Git hooks keep
the page in step with each commit.

## Operating Context

- The output is one self-contained HTML file, `pseudoview/index.html`, committed inside the project it describes.
  It opens from disk with no server. `pseudoview/pseudoview.json` holds the parse and the descriptions.
- Descriptions are written by a coding agent (Claude Code today) that follows the `pseudoview` skill and calls the
  `pseudoview` CLI (`extract`, `todo`, `apply`).
- A pre-commit hook adds the refreshed page to each commit. A post-commit hook starts a background agent run to
  describe changed functions. `pseudoview check` runs in CI.
- Each function column links to the source lines in VS Code.

## Capabilities and Constraints

- Languages: JavaScript, TypeScript (with TSX), Python, Go, Rust, Java, C#, C, C++, Ruby, PHP, Kotlin, Swift, Scala.
- Node.js 20 or later. `web-tree-sitter` is pinned to 0.22.6 because newer versions can't load the grammars.
- Calls are matched by name, so calls through interfaces or variables can be missed or misattributed.
- Terminology: "structure" means the parsed facts; "description" means the summary, pseudocode and tags; a description
  is "outdated" when its function's code changed after it was written; the "overview" holds the project summary,
  entry points, walkthroughs and notes.
- Undecided: the page shows the current state only. It has no view of what changed in a given commit or PR, although
  reviewing commits is one of the four reading moments.

## Brand Commitments

- Name: pseudoview, written in lowercase.
- The page has a dark theme. The owner asked for it.
- Navigation is Finder-style columns: opening a called function adds a column to the right, browser back and forward
  move along the path, and the page itself does not scroll or shift.

## Evidence on Hand

- A real generated page for keymolt (a Go CLI, 68 functions): `C:\P\keymolt\pseudoview\index.html`.
- No users, testimonials, benchmarks or pricing exist yet. Do not invent them.

## Product Principles

1. The structure must be exact. Anything a parser can know comes from the parser, never from the AI.
2. Never hide staleness. When a description is older than its code, the reader sees that.
3. Faster than reading the code. If the pseudocode isn't shorter and clearer than the source, it failed.
4. Keep the reader's place. Navigation must never make the reader lose track of where they came from.
5. Works anywhere the code goes: one file, committed with the code, opened without a server or account.

## Business Model

Planned as a paid product later. Nothing about pricing, hosting or the license is decided. The package currently
carries npm's default ISC license, which was not a deliberate choice.
