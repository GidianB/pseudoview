# pseudoview

Read any codebase as plain-English pseudocode, one column per function.

pseudoview writes `pseudoview/index.html` into your project. The page shows a summary and pseudocode for every
function. Click a function name and it opens in the next column, so you can follow a call chain from the entry
point down without reading the source. Back closes the last column. Each column links to the real lines in VS Code.

## How it works

The work is split between code and an AI agent:

- **The `pseudoview` command** parses the project with [tree-sitter](https://tree-sitter.github.io/). It finds
  every function, its lines, and the project functions it calls, and it hashes each function's body. Line numbers,
  links and call lists come from the parser, so they are exact.
- **The `pseudoview` skill** tells a coding agent, such as Claude Code, how to write a summary and pseudocode for
  each function the command lists, and an overview of the project.

When code changes, only the functions whose hash changed go back to the agent. The others keep their descriptions.
A changed function keeps its old text, marked as outdated, until the agent rewrites it.

## Languages

JavaScript, TypeScript (with TSX), Python, Go, Rust, Java, C#, C, C++, Ruby, PHP, Kotlin, Swift and Scala.

## Install

pseudoview needs Node.js 20 or later.

```
git clone <this repository> pseudoview
cd pseudoview
npm install
npm link
```

This installs two commands that do the same thing: `pseudoview` and the shorter `psv`.

Then make the skill available to your agent. For Claude Code, link or copy `skills/pseudoview` into
`~/.claude/skills/pseudoview`.

## Use

In a project, ask your agent to run `/pseudoview`, or to "explain this codebase with pseudoview". The agent runs
the commands below and writes the descriptions. Then open `pseudoview/index.html`.

```
pseudoview extract [--tests]          parse the project and rewrite the page (test files are skipped unless you
                                      pass --tests once; later runs remember it)
pseudoview check                      fail if pseudoview/ doesn't match the code; warn about missing descriptions
pseudoview todo [--limit N] [--path DIR/]
                                      print the next functions to describe, with their source
pseudoview todo --count               print how many functions need a description
pseudoview todo --overview            print what the overview needs
pseudoview apply [--rm] FILE|-        save descriptions from a JSON file or stdin, then rewrite the page
                                      (--rm deletes the file after it is saved)
pseudoview hook                       keep the page up to date with git hooks
```

`pseudoview/pseudoview.json` holds the parse and the descriptions. Commit it with the page, so the next person
starts from your descriptions instead of from nothing.

`pseudoview/.gitattributes` tells git not to merge these files line by line. When two branches both change
`pseudoview/`, git keeps your branch's copy and reports a conflict. To resolve it, run `pseudoview extract`, then
`git add pseudoview`, then finish the merge. Descriptions written only on the other branch are lost: those
functions go back on the todo list.

## Keep the page up to date

The page has two layers. The structure (functions, lines, calls) comes from the parser in under a second, so it can
be exact in every commit. The descriptions need an AI run, so they can trail the code. The page marks a function
whose code changed after it was described.

`pseudoview hook` installs two git hooks:

- **pre-commit** runs `pseudoview extract` and adds `pseudoview/` to the commit, so each commit's page matches
  its code.
- **post-commit** starts `claude -p` in the background when functions need a description, logging to
  `.git/pseudoview.log`. It does not commit. The next commit includes the new descriptions.

To stop, delete `.git/hooks/pre-commit` and `.git/hooks/post-commit`.

Hooks run only on machines where someone installed them. To catch the rest, run `pseudoview check` in CI. It
exits with 1 when `pseudoview/` doesn't match the code. When some descriptions are missing or outdated, it prints
a warning and exits with 0. On GitHub Actions, the warning shows as an annotation.

## Limits

- Calls are matched by name: a call goes to the function of that name in the same file, else the same folder, else
  the only one in the project. A call through an interface or a variable can be missed, or linked to the wrong
  function when two functions share a name.
- Anonymous functions are part of the function they appear in, unless they are assigned to a name.
- Files over 1 MB and `.min.js` files are skipped.
- The pre-commit hook parses the working tree, not only the staged files. If you commit part of your edits, the
  page in that commit also covers the edits you didn't commit.
- When two branches both change `pseudoview/`, a merge can conflict there. Keep either side, then run
  `pseudoview extract`. Functions described only on the other side go back on the list to describe.
