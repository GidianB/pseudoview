import { test } from "node:test";
import assert from "node:assert/strict";
import { extract, listFiles, TEST_FILE } from "../src/extract.js";

const root = new URL("./fixtures/mixed/", import.meta.url).pathname.replace(/^\/(\w:)/, "$1");
const fns = await extract(root);
const calls = id => fns[id]?.calls;

test("finds functions in every supported language, qualified by their class", () => {
  for (const id of ["a.go:store.save", "b.py:Repo.get", "c.ts:Runner.tick", "d.rs:S.go", "e.java:Shop.Shop", "f.rb:Cart.tax",
    "g.php:App.run", "h.cs:Calc.Twice", "i.cpp:Box.size", "j.kt:Feed.load", "k.swift:View.layout", "l.scala:Main.step",
    "m.c:alloc", "sub/n.js:inSub"]) assert.ok(fns[id], `missing ${id}`);
});

test("resolves calls through methods, arrow functions and receivers", () => {
  assert.deepEqual(calls("a.go:run"), ["a.go:store.save", "a.go:load"]);
  assert.deepEqual(calls("c.ts:main"), ["c.ts:Runner.start", "c.ts:format"]);
  assert.deepEqual(calls("b.py:Repo.load"), ["b.py:parse"]);
  assert.deepEqual(calls("i.cpp:Box.size"), ["i.cpp:area"]);
  assert.deepEqual(calls("j.kt:Feed.load"), ["j.kt:parseFeed"]);
});

test("never links a call to a function in another language", () => {
  // a.go's run() calls a Go closure named helper; d.rs has a Rust function helper
  assert.ok(!calls("a.go:run").includes("d.rs:helper"));
});

test("records lines and a hash that ignores whitespace", () => {
  assert.equal(fns["b.py:parse"].line, 8);
  assert.equal(fns["b.py:parse"].end, 9);
  assert.match(fns["b.py:parse"].hash, /^[0-9a-f]{12}$/);
});

test("skips test files unless asked", () => {
  assert.ok(!listFiles(root).includes("c.test.ts"));
  assert.ok(listFiles(root, { tests: true }).includes("c.test.ts"));
  for (const f of ["src/__tests__/a.js", "tests/x.py", "pkg/a_test.go", "a.spec.ts", "test_util.py"]) assert.ok(TEST_FILE.test(f), f);
  for (const f of ["src/attest.js", "latest.go", "contest/a.py"]) assert.ok(!TEST_FILE.test(f), f);
});
