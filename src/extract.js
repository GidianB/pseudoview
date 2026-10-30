// Finds every function in a project with tree-sitter, and which project functions each one calls.
import Parser from "web-tree-sitter";
import { createRequire } from "node:module";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const require = createRequire(import.meta.url);

// file extension -> grammar name in tree-sitter-wasms
export const EXT = {
  ".js": "javascript", ".mjs": "javascript", ".cjs": "javascript", ".jsx": "javascript",
  ".ts": "typescript", ".mts": "typescript", ".cts": "typescript", ".tsx": "tsx",
  ".py": "python", ".go": "go", ".rs": "rust", ".java": "java", ".cs": "c_sharp",
  ".c": "c", ".h": "c", ".cc": "cpp", ".cpp": "cpp", ".cxx": "cpp", ".hpp": "cpp", ".hh": "cpp",
  ".rb": "ruby", ".php": "php", ".kt": "kotlin", ".kts": "kotlin", ".swift": "swift", ".scala": "scala",
};

const JS = ["function_declaration", "generator_function_declaration", "method_definition",
  "function_expression", "function", "generator_function", "arrow_function"];
// node types that define a function, per grammar
const FUNCS = {
  javascript: JS, typescript: JS, tsx: JS,
  python: ["function_definition"],
  go: ["function_declaration", "method_declaration"],
  rust: ["function_item"],
  java: ["method_declaration", "constructor_declaration"],
  c_sharp: ["method_declaration", "constructor_declaration", "local_function_statement"],
  c: ["function_definition"], cpp: ["function_definition"],
  ruby: ["method", "singleton_method"],
  php: ["function_definition", "method_declaration"],
  kotlin: ["function_declaration"], swift: ["function_declaration"], scala: ["function_definition"],
};
// nodes whose name qualifies the functions inside them, such as a class: "Parser.parse"
const CONTAINERS = new Set(["class_declaration", "class_definition", "class", "class_specifier", "struct_specifier",
  "impl_item", "trait_item", "interface_declaration", "object_declaration", "object_definition", "module",
  "enum_declaration", "record_declaration", "struct_declaration", "trait_definition"]);
const CALLS = new Set(["call_expression", "call", "method_invocation", "invocation_expression",
  "function_call_expression", "member_call_expression", "scoped_call_expression", "nullsafe_member_call_expression"]);
const IDENT = /^(identifier|field_identifier|property_identifier|simple_identifier|name|constant|type_identifier)$/;
const ASSIGNED = /^(variable_declarator|pair|assignment_expression|field_definition|public_field_definition)$/;
export const TEST_FILE = /(^|\/)(tests?|__tests__|spec)\/|[._-](test|spec)\.\w+$|(^|\/)test_\w+\.py$/;
const SKIP_DIRS = new Set(["node_modules", "vendor", "dist", "build", "target", "out"]);

const NOISE = new Set(["this", "self", "exports", "module", "prototype"]);
// "Box::size", "obj.handler<T>" -> ["Box", "size"], ["obj", "handler"]
const parts = s => s.replace(/<[^<>]*>/g, "").replace(/\[[^\]]*\]$/, "").split(/[^\w$]+/).filter(p => p && !NOISE.has(p));
const lastPart = s => parts(s).pop();
const firstIdent = node => node.namedChildren.find(c => IDENT.test(c.type))?.text;
export const hashText = s => createHash("sha256").update(s.replace(/\s+/g, " ")).digest("hex").slice(0, 12);

// The function's name as written, which may carry a qualifier: "size", "Box::size", "obj.handler".
function fnName(node, lang) {
  const n = node.childForFieldName("name");
  if (n) return n.text;
  let d = node.childForFieldName("declarator"); // C and C++: int *f(void) nests the name in declarators
  while (d?.childForFieldName("declarator")) d = d.childForFieldName("declarator");
  if (d) return d.text;
  const p = node.parent; // an anonymous function takes the name it is assigned to
  if (p && ASSIGNED.test(p.type)) {
    const k = p.childForFieldName("name") || p.childForFieldName("key") || p.childForFieldName("left") || p.childForFieldName("property");
    if (k && k.id !== node.id) return k.text;
  }
  return FUNCS[lang] === JS ? null : firstIdent(node); // Kotlin has no name field; a JS callback has no name
}

function calleeName(node) {
  const f = node.childForFieldName("function") || node.childForFieldName("method") || node.childForFieldName("name") || node.namedChild(0);
  return f ? lastPart(f.text) : null;
}

function walk(node, lang, ctx, out) {
  if (CALLS.has(node.type) && ctx.fn) {
    const c = calleeName(node);
    if (c) ctx.fn.callNames.push(c);
  }
  if (FUNCS[lang].includes(node.type)) {
    const written = parts(fnName(node, lang) || "");
    const name = written.pop();
    if (name) {
      let qual = [...ctx.qual, ...written];
      const recv = lang === "go" && node.childForFieldName("receiver")?.descendantsOfType("type_identifier")[0];
      if (recv) qual = [recv.text];
      const fn = { name, qname: [...qual, name].join("."), file: ctx.file, line: node.startPosition.row + 1,
        end: node.endPosition.row + 1, lang, hash: hashText(node.text), callNames: [] };
      out.push(fn);
      ctx = { ...ctx, fn, qual: [...qual, name] };
    }
  } else if (CONTAINERS.has(node.type)) {
    const c = node.type === "impl_item" ? node.childForFieldName("type")?.text : node.childForFieldName("name")?.text || firstIdent(node);
    if (c) ctx = { ...ctx, qual: [...ctx.qual, lastPart(c)] };
  }
  for (const child of node.namedChildren) walk(child, lang, ctx, out);
}

// Source files to read: git's view when the folder is a repo (so .gitignore applies), else a plain walk.
export function listFiles(root, { tests = false, out = "pseudoview" } = {}) {
  let files;
  try {
    files = execFileSync("git", ["ls-files", "-co", "--exclude-standard", "-z"], { cwd: root, encoding: "utf8", maxBuffer: 1 << 28, stdio: ["ignore", "pipe", "ignore"] })
      .split("\0").filter(Boolean);
  } catch {
    files = [];
    const visit = dir => {
      for (const e of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
        const rel = dir ? `${dir}/${e.name}` : e.name;
        if (e.isDirectory()) { if (!e.name.startsWith(".") && !SKIP_DIRS.has(e.name)) visit(rel); }
        else files.push(rel);
      }
    };
    visit("");
  }
  return files.filter(f => EXT[path.extname(f).toLowerCase()] && !f.startsWith(out + "/") && !f.endsWith(".min.js")
    && (tests || !TEST_FILE.test(f))).sort();
}

const languages = {};
async function parserFor(lang) {
  if (!languages[lang]) {
    await Parser.init();
    const p = new Parser();
    p.setLanguage(await Parser.Language.load(require.resolve(`tree-sitter-wasms/out/tree-sitter-${lang}.wasm`)));
    languages[lang] = p;
  }
  return languages[lang];
}

// Returns {id: function} with each function's resolved calls, sorted by file and line.
export async function extract(root, opts = {}) {
  const found = [];
  for (const file of listFiles(root, opts)) {
    let src;
    try {
      const full = path.join(root, file);
      if (fs.statSync(full).size > 1 << 20) continue; // generated or bundled code
      src = fs.readFileSync(full, "utf8");
    } catch { continue; } // deleted but still in git's index
    const lang = EXT[path.extname(file).toLowerCase()];
    const tree = (await parserFor(lang)).parse(src);
    walk(tree.rootNode, lang, { file, qual: [], fn: null }, found);
    tree.delete();
  }
  const seen = {}, byName = {};
  for (const f of found) {
    const base = `${f.file}:${f.qname}`;
    seen[base] = (seen[base] || 0) + 1;
    f.id = seen[base] > 1 ? `${base}#${seen[base]}` : base; // same name twice in a file, such as overloads
    (byName[f.name] ||= []).push(f);
  }
  // a call goes to a function of that name in the same file, else the same folder, else the only one in the project
  const family = l => ({ typescript: "javascript", tsx: "javascript", cpp: "c" })[l] || l;
  const resolve = (name, from) => {
    const c = (byName[name] || []).filter(f => family(f.lang) === family(from.lang));
    const file = c.filter(f => f.file === from.file);
    if (file.length) return file[0].id;
    const dir = c.filter(f => path.dirname(f.file) === path.dirname(from.file));
    if (dir.length === 1) return dir[0].id;
    return c.length === 1 ? c[0].id : null;
  };
  const fns = {};
  for (const f of found) {
    const calls = [...new Set(f.callNames.map(n => resolve(n, f)).filter(id => id && id !== f.id))];
    const { callNames, ...rest } = f;
    fns[f.id] = { ...rest, calls };
  }
  return fns;
}
