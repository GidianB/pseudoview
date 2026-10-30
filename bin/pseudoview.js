#!/usr/bin/env node
// pseudoview: read any codebase as linked pseudocode, one column per function.
import { spawnSync, execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import fs from "node:fs";
import path from "node:path";
import { extract } from "../src/extract.js";
import * as store from "../src/store.js";

// V8's optimizing compiler runs out of memory on the grammar files and crashes the process. V8 reads the flag that
// turns it off only at startup, so run again with it.
if (!process.execArgv.includes("--liftoff-only")) {
  const r = spawnSync(process.execPath, ["--liftoff-only", ...process.execArgv, fileURLToPath(import.meta.url), ...process.argv.slice(2)], { stdio: "inherit" });
  process.exit(r.status ?? 1);
}

const USAGE = `pseudoview: read any codebase as linked pseudocode.

  pseudoview extract [--tests]   parse the project, keep descriptions that still match, write ${store.OUT}/index.html;
                                 --tests also parses test files, and later runs remember it
  pseudoview check               fail if ${store.OUT}/ doesn't match the code; warn about functions not yet described
  pseudoview todo [--limit N] [--path DIR/]
                                 print the next functions to describe, with their source
  pseudoview todo --count        print how many functions need a description
  pseudoview todo --overview     print what the overview needs
  pseudoview apply [--rm] FILE|- save descriptions from a JSON file (or stdin), then rewrite the page;
                                 --rm deletes the file after it is saved
  pseudoview hook                install git hooks: each commit includes the refreshed ${store.OUT}/, and after it
                                 claude describes the functions that changed

Run it inside a project. Output goes to ${store.OUT}/ at the top of the git repository.
psv is a short name for pseudoview: psv extract does the same as pseudoview extract.
`;

const HOOKS = {
  "pre-commit": `#!/bin/sh
# pseudoview: add the refreshed ${store.OUT}/ to each commit, so the page matches the code. Delete this file to stop.
command -v pseudoview >/dev/null 2>&1 || exit 0
# shortcut: parses the working tree, not only the staged files, so a partly staged commit gets the page for all edits
pseudoview extract >/dev/null 2>&1 && git add -- ${store.OUT}
exit 0
`,
  "post-commit": `#!/bin/sh
# pseudoview: describe the functions that changed in each commit. Delete this file to stop.
command -v pseudoview >/dev/null 2>&1 || exit 0
pseudoview extract >/dev/null 2>&1 || exit 0
[ "$(pseudoview todo --count 2>/dev/null)" = "0" ] && exit 0
command -v claude >/dev/null 2>&1 || exit 0
# one run at a time, so two runs can't overwrite each other's work. A lock older than 1 hour is from a run that died.
# shortcut: if the running one has already finished its list, this commit's functions wait for the next commit's run
lock="$(git rev-parse --git-path pseudoview.lock)"
[ -n "$(find "$lock" -maxdepth 0 -mmin -60 2>/dev/null)" ] && exit 0
rm -rf "$lock"; mkdir "$lock" || exit 0
nohup sh -c 'claude -p "Use the pseudoview skill to describe the functions that changed in this project. Do not commit." \\
  --allowedTools "Read" "Grep" "Glob" "Write" "Bash(pseudoview:*)"; rmdir "$1"' sh "$lock" \\
  >"$(git rev-parse --git-path pseudoview.log)" 2>&1 &
`,
};

const git = (args, cwd) => {
  try { return execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim(); }
  catch { return null; }
};
const root = git(["rev-parse", "--show-toplevel"]) || process.cwd();
const [cmd, ...args] = process.argv.slice(2);
const has = f => args.includes(f);
const value = (f, d) => (args.includes(f) ? args[args.indexOf(f) + 1] : d);
const left = data => `${store.todo(data).length} left to describe${data.overview ? "" : ", plus the overview"}`;

try {
  switch (cmd) {
    case "extract": {
      // no commit or timestamp in the data: an unchanged project writes the same files, so commits don't churn
      const tests = has("--tests") || !!store.load(root).tests;
      const fns = await extract(root, { tests, out: store.OUT });
      // load again after the parse: a description that the hook's claude run saved meanwhile must not be lost
      const data = store.merge(store.load(root), fns, { project: path.basename(root), ...(tests && { tests }) });
      store.save(root, data);
      store.render(root, data);
      const all = Object.values(data.functions);
      console.log(`pseudoview: ${all.length} functions in ${new Set(all.map(f => f.file)).size} files`
        + ` (${[...new Set(all.map(f => f.lang))].join(", ") || "no supported languages"}). ${left(data)}. Page: ${store.OUT}/index.html`);
      break;
    }
    case "check": {
      const data = store.load(root);
      const stale = store.changed(data, await extract(root, { tests: !!data.tests, out: store.OUT }));
      if (stale.length) {
        throw new Error(`${store.OUT}/ doesn't match the code: ${stale.length} function${stale.length === 1 ? " was" : "s were"} added, `
          + `removed or changed (${stale.slice(0, 5).join(", ")}${stale.length > 5 ? ", ..." : ""}). Run pseudoview extract and commit ${store.OUT}/.`);
      }
      const done = !store.todo(data).length && data.overview;
      // a warning, not a failure: descriptions need an AI run, and the page marks the outdated ones
      console.log(done ? `pseudoview: ${store.OUT}/ matches the code, and every function is described.`
        : `${process.env.GITHUB_ACTIONS ? "::warning::" : "warning: "}pseudoview: ${store.OUT}/ matches the code. ${left(data)}.`);
      break;
    }
    case "todo": {
      const data = store.load(root), prefix = value("--path", "");
      const list = store.todo(data).filter(f => f.file.startsWith(prefix));
      if (has("--count")) { console.log(list.length); break; }
      if (!Object.keys(data.functions).length) throw new Error("nothing extracted yet: run pseudoview extract first");
      if (has("--overview")) { console.log(store.overviewBrief(data)); break; }
      if (!list.length) { console.log(`Every function is described.${data.overview ? "" : " The overview is missing: run pseudoview todo --overview."}`); break; }
      const limit = Number(value("--limit", 8));
      console.log(`${list.length} functions need a description. The first ${Math.min(limit, list.length)} follow.`
        + `\nWrite {"functions": {"<id>": {"summary": "...", "pseudocode": "...", "tags": []}}} to a file and run: pseudoview apply FILE\n`);
      console.log(list.slice(0, limit).map(f => store.brief(root, data, f)).join("\n\n"));
      break;
    }
    case "apply": {
      const file = args.find(a => !a.startsWith("--") || a === "-");
      if (!file) throw new Error("usage: pseudoview apply [--rm] FILE|-");
      const batch = JSON.parse(fs.readFileSync(file === "-" ? 0 : file, "utf8"));
      const data = store.load(root);
      const { saved, replaced } = store.apply(data, batch);
      store.save(root, data);
      store.render(root, data);
      // --rm: the agent's scratch file goes once it is saved; kept on failure so the agent can fix it
      if (has("--rm") && file !== "-") fs.rmSync(file);
      const what = [saved && `${saved} description${saved === 1 ? "" : "s"}${replaced ? ` (${replaced} replaced an existing one)` : ""}`,
        batch.overview && "the overview"].filter(Boolean).join(" and ") || "nothing";
      console.log(`pseudoview: saved ${what}. ${left(data)}.`);
      break;
    }
    case "hook": {
      const hooks = git(["rev-parse", "--git-path", "hooks"], root);
      if (!hooks) throw new Error("not a git repository");
      const skipped = [];
      for (const [name, script] of Object.entries(HOOKS)) {
        const file = path.resolve(root, hooks, name);
        if (fs.existsSync(file) && !fs.readFileSync(file, "utf8").includes("# pseudoview")) {
          skipped.push(`${file} already exists. Add these lines to it yourself:\n\n${script.split("\n").slice(1).join("\n")}`);
          continue;
        }
        fs.mkdirSync(path.dirname(file), { recursive: true });
        fs.writeFileSync(file, script, { mode: 0o755 });
        console.log(`pseudoview: installed ${file}`);
      }
      if (skipped.length) throw new Error(skipped.join("\n"));
      console.log(`Each commit now includes the refreshed ${store.OUT}/. After a commit that changes functions, claude describes them`
        + ` in the background, and the next commit includes the descriptions.`);
      break;
    }
    default:
      process.stdout.write(USAGE);
      if (cmd && cmd !== "help" && cmd !== "--help") process.exitCode = 2;
  }
} catch (e) {
  console.error("pseudoview: " + e.message);
  process.exitCode = 1;
}
