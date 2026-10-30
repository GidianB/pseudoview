import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import * as store from "../src/store.js";

const fn = (id, hash, calls = []) => ({ id, name: id.split(":")[1], qname: id.split(":")[1], file: id.split(":")[0], line: 1, end: 2, lang: "go", hash, calls });
const parsed = () => ({ "a.go:x": fn("a.go:x", "h1", ["a.go:y"]), "a.go:y": fn("a.go:y", "h2") });

test("apply saves descriptions, and merge keeps them while the code is unchanged", () => {
  const data = store.merge({ functions: {} }, parsed(), {});
  assert.equal(store.todo(data).length, 2);
  store.apply(data, { functions: { "a.go:y": { summary: "Does y.", pseudocode: "RETURN 1" } } });
  assert.deepEqual(store.todo(data).map(f => f.id), ["a.go:x"]);
  const again = store.merge(data, parsed(), {});
  assert.equal(again.functions["a.go:y"].summary, "Does y.");
  assert.deepEqual(store.todo(again).map(f => f.id), ["a.go:x"]);
});

test("a changed function keeps its old text but goes back on the list", () => {
  const data = store.merge({ functions: {} }, parsed(), {});
  store.apply(data, { functions: { "a.go:y": { summary: "Does y.", pseudocode: "RETURN 1" } } });
  const changed = parsed();
  changed["a.go:y"].hash = "h9";
  const next = store.merge(data, changed, {});
  assert.equal(next.functions["a.go:y"].pseudocode, "RETURN 1");
  assert.ok(store.todo(next).some(f => f.id === "a.go:y"));
});

test("apply rejects a bad batch and changes nothing", () => {
  const data = store.merge({ functions: {} }, parsed(), {});
  const before = JSON.stringify(data);
  assert.throws(() => store.apply(data, { functions: { "a.go:y": { summary: "ok", pseudocode: "ok" }, "a.go:nope": { summary: "s", pseudocode: "p" } } }), /unknown function id "a.go:nope"/);
  assert.throws(() => store.apply(data, { functions: { "a.go:y": { summary: "", pseudocode: "p" } } }), /non-empty/);
  assert.throws(() => store.apply(data, { overview: { summary: "s", notes: [{ text: "t", id: "a.go:gone" }] } }), /unknown function id/);
  assert.equal(JSON.stringify(data), before);
});

test("apply reports when it replaces a current description", () => {
  const data = store.merge({ functions: {} }, parsed(), {});
  const batch = { functions: { "a.go:y": { summary: "Does y.", pseudocode: "RETURN 1" } } };
  assert.deepEqual(store.apply(data, batch), { saved: 1, replaced: 0 });
  assert.deepEqual(store.apply(data, batch), { saved: 1, replaced: 1 });
});

test("the brief shows the comments right above the function", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "pv-"));
  fs.writeFileSync(path.join(root, "a.go"), "package a\n\n// y exists because x needs it\nfunc y() int {\n\treturn 1\n}\n");
  const data = store.merge({ functions: {} }, { "a.go:y": { ...fn("a.go:y", "h"), line: 4, end: 6 } }, {});
  const text = store.brief(root, data, data.functions["a.go:y"]);
  assert.match(text, /\/\/ y exists because x needs it\nfunc y\(\)/);
  assert.doesNotMatch(text, /package a/);
  fs.rmSync(root, { recursive: true });
});

test("changed finds added, removed and edited functions, and ignores descriptions", () => {
  const data = store.merge({ functions: {} }, parsed(), {});
  store.apply(data, { functions: { "a.go:y": { summary: "Does y.", pseudocode: "RETURN 1" } } });
  assert.deepEqual(store.changed(data, parsed()), []);
  const next = parsed();
  next["a.go:x"].line = 5;
  delete next["a.go:y"];
  next["a.go:z"] = fn("a.go:z", "h3");
  assert.deepEqual(store.changed(data, next).sort(), ["a.go:x", "a.go:y", "a.go:z"]);
});

test("todo lists functions that call fewer others first", () => {
  const data = store.merge({ functions: {} }, parsed(), {});
  assert.deepEqual(store.todo(data).map(f => f.id), ["a.go:y", "a.go:x"]);
});

test("render embeds the data so that text can't close the script tag", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "pv-"));
  const data = store.merge({ functions: {} }, parsed(), { project: "demo" });
  store.apply(data, { functions: { "a.go:y": { summary: "Stops at </script><b>", pseudocode: "RETURN 1" } } });
  store.save(root, data);
  store.render(root, data);
  const html = fs.readFileSync(path.join(root, "pseudoview", "index.html"), "utf8");
  assert.ok(!html.includes("</script><b>"));
  const json = html.match(/<script type="application\/json" id="data">(.*?)<\/script>/s)[1];
  assert.equal(JSON.parse(json).functions["a.go:y"].summary, "Stops at </script><b>");
  assert.deepEqual(store.load(root).functions["a.go:y"].summary, "Stops at </script><b>");
  fs.rmSync(root, { recursive: true });
});

test("the overview brief lists two call levels below the entry points, plus what the overview names", () => {
  const chain = { "a.go:main": fn("a.go:main", "h", ["a.go:b"]), "a.go:b": fn("a.go:b", "h", ["a.go:c"]),
    "a.go:c": fn("a.go:c", "h", ["a.go:d"]), "a.go:d": fn("a.go:d", "h", ["a.go:e"]), "a.go:e": fn("a.go:e", "h") };
  const data = store.merge({ functions: {} }, chain, {});
  const listed = () => store.overviewBrief(data).split("two levels down")[1];
  assert.match(listed(), /a\.go:c/);
  assert.doesNotMatch(listed(), /a\.go:d|a\.go:e/);
  data.overview = { summary: "s", notes: [{ text: "t", id: "a.go:e" }] };
  assert.match(listed().split("Current overview")[0], /- a\.go:e/);
});

test("save marks pseudoview/ so git does not merge it line by line", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "pv-"));
  store.save(root, store.merge({ functions: {} }, parsed(), {}));
  assert.match(fs.readFileSync(path.join(root, "pseudoview", ".gitattributes"), "utf8"), /pseudoview\.json -merge/);
  fs.rmSync(root, { recursive: true });
});
