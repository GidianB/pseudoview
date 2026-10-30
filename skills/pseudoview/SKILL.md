---
name: pseudoview
description: Write or update a codebase's pseudoview page, which shows plain-English pseudocode for every function, linked by calls, in columns you click through (pseudoview/index.html). Use when the user asks to explain, map or visualize a codebase as pseudocode, runs /pseudoview, or asks to update the page after code changes.
---

# pseudoview

The `pseudoview` command parses the project with tree-sitter and does the bookkeeping: it finds every function,
its lines and the project functions it calls, and it tracks which functions changed since they were described.
Your job is the words: a summary and pseudocode for each function it lists, and an overview of the project.

Never read or edit the files in `pseudoview/`. They hold every function in the project, so they are too large to
read. `pseudoview todo` prints what you need, and `pseudoview apply` saves what you write.

## Steps

1. Run `pseudoview --help`. If the command is missing, tell the user that pseudoview is not installed, and stop.
2. From inside the project, run `pseudoview extract`. It prints how many functions need a description.
3. Run `pseudoview todo`. For each function, it prints the source with the comments above it, what it calls and
   what calls it. For a function that changed, it also prints the old pseudocode: edit that, and keep the wording
   that still holds. It prints 8 functions at a time. For small functions, `--limit 15` is fine. The source does
   not include names defined outside the function, such as constants, globals and types. When a function depends
   on one, read that part of the file before you describe it.
4. Write a batch file **outside the project**, for example in the OS temp folder:
   `{"functions": {"<id>": {"summary": "...", "pseudocode": "...", "tags": []}}}`. Use the ids exactly as printed.
5. Run `pseudoview apply --rm <file>`. It checks the batch and changes nothing if part of it is wrong: fix the
   errors and run it again. After a successful save, `--rm` deletes the batch file.
6. Repeat steps 3 to 5 until `pseudoview todo` prints "Every function is described."
7. Write or update the overview when it is missing, or when this run changed an entry point or a function the
   overview names: run `pseudoview todo --overview`, write `{"overview": {...}}` in the shape it prints, and apply it.
8. Tell the user how many functions you described, and to open `pseudoview/index.html`. Do not commit unless the
   user asks. If `pseudoview/` is new in the project, tell the user it is meant to be committed: the next run
   reuses its descriptions.

To fix a description you already applied, apply it again. The new text replaces the old one.

For a large project, ask the user which part matters most and start there: `pseudoview todo --path src/api/`.
The page works with partial descriptions and marks the functions that are not described yet.

## How to write the pseudocode

The reader should understand what the function does, and why, faster than they could from the code, even if they
don't know the language.

- Make it shorter than the code. Leave out plumbing: errors that are only passed up, type conversions, logging,
  defaults that change nothing. Keep every decision, side effect and failure that matters.
- Write keywords in capitals: `IF`, `ELSE`, `FOR EACH`, `WHILE`, `REPEAT ... UNTIL`, `RETURN`, `MATCH` (a switch),
  `REQUIRE` (a check that fails the function when false), `FAIL "message"` (return an error or throw), `ON` (a
  handler, such as a deferred cleanup or a crash handler), `AND`, `OR`, `NOT`.
- Use `x ← value` for assignment. Indent blocks by 4 spaces. Use `MATCH x:` with one `case → result` line per branch.
- Write a call to a project function with its exact name and parentheses, such as `openState(path)`. The page
  turns these into links. Describe library calls in plain words, such as "sort by length" or "read the file".
- Use domain words, not variable names: "the old keys that are still live", not `oldLive`.
- Add a comment only for the reason the code can't show: `two spaces, then // why`. Take the intent from the
  source comments when they have it.
- A summary is one or two plain sentences: what the function does and why it exists. Don't start with
  "This function".
- Tags are optional and short. Use them only when they help a reader, for example `entry point`, `security`,
  `human only` or `deprecated`. Most functions have none. A tag that would fit most functions in the project tells
  the reader nothing: keep it for the few where it matters most.

Example, for a Go function that locks a folder:

```json
{"functions": {"recipe.go:lockDir": {
  "summary": "Stops two runs from writing the same state file at the same time.",
  "pseudocode": "IF the lock file is older than 1 hour: delete it  // a crashed run left it\ncreate the lock file, failing IF it already exists\nIF it exists: FAIL \"another run is using this folder\"\nRETURN a function that deletes the lock"
}}}
```

## How to write the overview

- `summary`: what the project does, in one to three sentences.
- `entryPoints`: the ways in, such as commands, routes or exported functions. When `main` or a router only
  dispatches, list what it dispatches to, not `main` itself. Give each one a label, one line of text, and `ids`:
  start at the function that handles it, then add the few functions a reader should follow next. It does not have
  to be every step of the call path.
- `walkthroughs`: one or two step-by-step tours of the main flow. Each step names the function that does it. When
  a step happens inside a larger function, use that function's id again.
  Add `fail` when a failure at that step has a consequence worth knowing.
- `notes`: rules or guarantees a reader should know, each with the id of the function that enforces it.
  Set `notesTitle` to a heading that fits, for example "Where the code stops a key from leaking".
