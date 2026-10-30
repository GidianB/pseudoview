// pseudoview/pseudoview.json: the parsed functions plus the descriptions an agent wrote for them.
import fs from "node:fs";
import path from "node:path";

export const OUT = "pseudoview";
export const dataPath = root => path.join(root, OUT, "pseudoview.json");

export function load(root) {
  try { return JSON.parse(fs.readFileSync(dataPath(root), "utf8")); }
  catch (e) {
    if (e.code === "ENOENT") return { overview: null, functions: {} };
    throw new Error(`${dataPath(root)} is unreadable: ${e.message}. If a merge left conflict markers in it, take one side`
      + ` (git checkout --ours ${OUT}/) and run pseudoview extract.`);
  }
}

export function save(root, data) {
  fs.mkdirSync(path.join(root, OUT), { recursive: true });
  const tmp = dataPath(root) + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(data, null, 1) + "\n");
  fs.renameSync(tmp, dataPath(root)); // a crash can't leave half a file
  // On a merge conflict git keeps this branch's copy, without markers, so extract can still load it and rebuild
  fs.writeFileSync(path.join(root, OUT, ".gitattributes"), "index.html binary linguist-generated\npseudoview.json -merge linguist-generated\n");
}

// Fresh parse + old descriptions. A description stays when its function's id survives; `described` holds the
// hash of the code it describes, so a changed function shows its old text marked as outdated until rewritten.
export function merge(old, fns, meta) {
  const functions = {};
  for (const [id, f] of Object.entries(fns)) {
    const { summary, pseudocode, tags, described } = old.functions[id] || {};
    functions[id] = { ...f, ...(summary !== undefined && { summary, pseudocode, tags, described }) };
  }
  return { ...meta, overview: old.overview ?? null, functions };
}

// Writes OUT/index.html: the viewer with the data inside, so the page is one file that opens from disk.
export function render(root, data) {
  const template = fs.readFileSync(new URL("./template.html", import.meta.url), "utf8");
  const json = JSON.stringify(data).replace(/</g, "\\u003c"); // "</script>" in a summary can't end the tag early
  fs.writeFileSync(path.join(root, OUT, "index.html"), template.split("__DATA__").join(json));
}

// Ids whose parse differs from what is stored: functions that were added, removed, moved or edited.
export function changed(old, fns) {
  const ids = new Set([...Object.keys(old.functions), ...Object.keys(fns)]);
  return [...ids].filter(id => {
    const a = old.functions[id], b = fns[id];
    return !a || !b || Object.keys(b).some(k => JSON.stringify(a[k]) !== JSON.stringify(b[k]));
  });
}

export const needsWork = f => f.described !== f.hash;

// Functions to describe next: the ones that call fewest others first, so callees tend to be described before callers.
export function todo(data) {
  return Object.values(data.functions).filter(needsWork)
    .sort((a, b) => a.calls.length - b.calls.length || a.file.localeCompare(b.file) || a.line - b.line);
}

// The agent's batch: {"functions": {id: {summary, pseudocode, tags?}}, "overview"?: {...}}.
// Checks everything first and changes nothing if any part is wrong.
export function apply(data, batch) {
  const errors = [];
  const isText = v => typeof v === "string" && v.trim() !== "";
  const known = id => !id || data.functions[id] || errors.push(`unknown function id "${id}"`);
  for (const [id, d] of Object.entries(batch.functions || {})) {
    if (!data.functions[id]) { errors.push(`unknown function id "${id}"`); continue; }
    if (!isText(d?.summary) || !isText(d?.pseudocode)) errors.push(`${id}: summary and pseudocode must be non-empty strings`);
    if (d?.tags !== undefined && !(Array.isArray(d.tags) && d.tags.every(isText))) errors.push(`${id}: tags must be a list of strings`);
  }
  const o = batch.overview;
  if (o !== undefined) {
    if (!isText(o?.summary)) errors.push("overview.summary must be a non-empty string");
    for (const e of o?.entryPoints || []) { if (!isText(e.label)) errors.push("each entry point needs a label"); (e.ids || []).forEach(known); }
    for (const w of o?.walkthroughs || []) {
      if (!isText(w.title) || !Array.isArray(w.steps)) errors.push("each walkthrough needs a title and steps");
      for (const s of w.steps || []) { if (!isText(s.title)) errors.push(`walkthrough "${w.title}": each step needs a title`); known(s.id); }
    }
    for (const n of o?.notes || []) { if (!isText(n.text)) errors.push("each note needs text"); known(n.id); }
  }
  if (errors.length) throw new Error(errors.join("\n"));
  let saved = 0, replaced = 0;
  for (const [id, d] of Object.entries(batch.functions || {})) {
    const f = data.functions[id];
    saved++;
    if (f.described === f.hash) replaced++; // it already had a current description
    Object.assign(f, { summary: d.summary.trim(), pseudocode: d.pseudocode.replace(/\s+$/, ""), tags: d.tags || [], described: f.hash });
  }
  if (o !== undefined) data.overview = o;
  return { saved, replaced };
}

// What the agent reads to write the overview: the likely entry points, what they lead to, and the current overview.
export function overviewBrief(data) {
  const fns = Object.values(data.functions), called = new Set(fns.flatMap(f => f.calls));
  // shortcut: lists two call levels below the entry points, not every function, so the brief stays readable in a
  // large project; go deeper if overviews miss the main flows
  const near = new Set(fns.filter(f => !called.has(f.id)).map(f => f.id));
  for (let level = 0; level < 2; level++) for (const id of [...near]) data.functions[id]?.calls.forEach(c => near.add(c));
  const o = data.overview;
  [...(o?.entryPoints || []).flatMap(e => e.ids || []), ...(o?.walkthroughs || []).flatMap(w => (w.steps || []).map(s => s.id)),
    ...(o?.notes || []).map(n => n.id)].forEach(id => id && near.add(id));
  const line = f => `- ${f.id}${f.summary ? ` — ${f.summary}` : ""}`;
  return [
    `Project: ${data.project}. ${fns.length} functions.`,
    `Write {"overview": {...}} to a file and run: pseudoview apply FILE. Shape:`,
    `{"summary": "what the project does, 1-3 sentences",`,
    ` "entryPoints": [{"label": "a command, route or public API", "text": "what it does", "ids": ["<handler id>", "<key ids a reader should follow>"]}],`,
    ` "walkthroughs": [{"title": "What happens during <main flow>", "intro": "optional", "steps": [{"title": "...", "text": "...", "id": "<id>", "fail": "optional: what happens if this step fails"}]}],`,
    ` "notesTitle": "optional heading", "notes": [{"text": "a rule or guarantee worth knowing", "id": "<id that enforces it>"}]}`,
    "", "Not called by any other project function, with what each one calls. A dispatcher such as main or a router",
    "calls the real entry points (commands, routes), so look one level down:",
    ...fns.filter(f => !called.has(f.id)).map(f => `${line(f)}\n    calls: ${f.calls.join(", ") || "nothing in this project"}`),
    "", "The functions they call, two levels down, and the functions the current overview names:",
    ...fns.filter(f => near.has(f.id)).map(line),
    ...(data.overview ? ["", "Current overview (update it, keep what still holds):", JSON.stringify(data.overview, null, 1)] : []),
  ].join("\n");
}

// What the agent reads to write one function: where it is, what it calls, who calls it, and its source.
export function brief(root, data, f) {
  const fns = data.functions;
  const name = id => `${id}${fns[id].summary ? ` (${fns[id].summary})` : ""}`;
  const callers = Object.values(fns).filter(g => g.calls.includes(f.id)).map(g => g.id);
  const all = fs.readFileSync(path.join(root, f.file), "utf8").split(/\r?\n/);
  // include the comments and decorators right above the function: that is often where the "why" is written
  let start = f.line - 1;
  while (start > 0 && /^\s*(\/\/|#|\/\*|\*|@|--|""")/.test(all[start - 1])) start--;
  const lines = all.slice(start, f.end);
  return [
    `### ${f.id}`,
    `${f.file} lines ${f.line}-${f.end} (${f.lang}) · ${f.described ? "changed since it was described" : "new"}`,
    `calls: ${f.calls.map(name).join("; ") || "none in this project"}`,
    `called by: ${callers.join(", ") || "nothing in this project"}`,
    ...(f.described ? ["previous pseudocode (keep what still holds):", "```", f.pseudocode, "```"] : []),
    "```" + f.lang, ...lines, "```",
  ].join("\n");
}
