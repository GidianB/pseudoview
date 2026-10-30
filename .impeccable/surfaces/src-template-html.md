---
version: 1
slug: "src-template-html"
primary_target: "src/template.html"
related_targets: []
---

Scope: the generated page, `src/template.html` rendered to `pseudoview/index.html`. Mode: Read.

Audience and job: developers (the owner and newcomers) reading a codebase as pseudocode before changing code, while reviewing, onboarding, or checking agent-written code. Constraints: one self-contained file opened from disk, dark theme, Finder-style columns, the page never scrolls.

## Direction contract

THESIS: Type and space carry everything. The page refuses the developer-tool default of cards, panel borders, header bars and coloured syntax; the pseudocode reads like a quiet document.

OWN-WORLD: Near-black ground #0e0e0f, ink #ececec plus a softer ink #c9c9ce for summaries and pseudocode, two greys (#8d8d93 for secondary text, #4a4a50 for separators), one blue (#5b8cff) for described and the open path, one amber for outdated. System sans for prose, one mono for pseudocode. No borders, boxes or backgrounds on content; status is a 6px dot.

STORY: The reader sees where they are (the breadcrumb), what a function does (summary), how (pseudocode), and where to go next (underlined calls). They trust it because outdated text says so in amber.

FIRST VIEWPORT: A 13px breadcrumb header with Find and Files on the right. Below, up to three columns of equal width separated only by space: dot plus 20px name, file link, summary, pseudocode, Calls and Called by with line counts. Collapsed columns are 36px strips with a vertical name.

FORM: Plain, type and space only; position 1 on the ordered list (the pick card). seed:772ce5678d30d1ca

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

Signature interaction: opening a call adds a column that eases in from 8px right in 180ms; the breadcrumb grows by one crumb, and every crumb truncates the path when clicked.

Below 760px (decided with the review): the function list, Find and Files are hidden, because the list needs a side panel the phone width cannot hold. Readers browse from the overview and the links, and the breadcrumb stays.
