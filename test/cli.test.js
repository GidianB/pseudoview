import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const bin = fileURLToPath(new URL("../bin/pseudoview.js", import.meta.url));
const run = (cwd, ...args) => spawnSync(process.execPath, [bin, ...args], { cwd, encoding: "utf8", env: { ...process.env, GITHUB_ACTIONS: "" } });

test("check passes with a warning when only descriptions are missing, and fails when the code moved on", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "pv-"));
  fs.writeFileSync(path.join(root, "a.go"), "package a\n\nfunc y() int {\n\treturn 1\n}\n");
  assert.equal(run(root, "check").status, 1); // nothing extracted yet
  assert.equal(run(root, "extract").status, 0);
  const json = fs.readFileSync(path.join(root, "pseudoview", "pseudoview.json"), "utf8");
  const ok = run(root, "check");
  assert.equal(ok.status, 0);
  assert.match(ok.stdout, /^warning: .*1 left to describe/);
  assert.equal(run(root, "extract").status, 0);
  assert.equal(fs.readFileSync(path.join(root, "pseudoview", "pseudoview.json"), "utf8"), json, "a second extract writes the same file");
  fs.appendFileSync(path.join(root, "a.go"), "\nfunc z() {}\n");
  const bad = run(root, "check");
  assert.equal(bad.status, 1);
  assert.match(bad.stderr, /doesn't match the code: 1 function was added, removed or changed \(a\.go:z\)/);
  fs.rmSync(root, { recursive: true });
});
