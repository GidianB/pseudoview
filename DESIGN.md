---
name: pseudoview
description: A codebase read as plain-English pseudocode, one column per function, on a quiet dark page.
colors:
  ground: "#0e0e0f"
  ink: "#ececec"
  ink-soft: "#c9c9ce"
  grey-text: "#8d8d93"
  grey-line: "#4a4a50"
  hover-wash: "#1c1c1f"
  signal-blue: "#5b8cff"
  outdated-amber: "#e0a33a"
typography:
  title:
    fontFamily: 'system-ui, "Segoe UI Variable Text", "Segoe UI", -apple-system, sans-serif'
    fontSize: "20px"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.015em"
  summary:
    fontFamily: 'system-ui, "Segoe UI Variable Text", "Segoe UI", -apple-system, sans-serif'
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.6
  body:
    fontFamily: 'system-ui, "Segoe UI Variable Text", "Segoe UI", -apple-system, sans-serif'
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
  body-sm:
    fontFamily: 'system-ui, "Segoe UI Variable Text", "Segoe UI", -apple-system, sans-serif'
    fontSize: "13.5px"
    fontWeight: 400
    lineHeight: 1.5
  ui:
    fontFamily: 'system-ui, "Segoe UI Variable Text", "Segoe UI", -apple-system, sans-serif'
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: 'system-ui, "Segoe UI Variable Text", "Segoe UI", -apple-system, sans-serif'
    fontSize: "12px"
    fontWeight: 500
    lineHeight: 1.5
  meta:
    fontFamily: 'system-ui, "Segoe UI Variable Text", "Segoe UI", -apple-system, sans-serif'
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.5
  code:
    fontFamily: '"Cascadia Mono", ui-monospace, Consolas, "SF Mono", monospace'
    fontSize: "12.5px"
    fontWeight: 400
    lineHeight: 1.7
  identifier:
    fontFamily: '"Cascadia Mono", ui-monospace, Consolas, "SF Mono", monospace'
    fontSize: "12.5px"
    fontWeight: 400
    lineHeight: 1.5
rounded:
  focus: "3px"
  sm: "5px"
  full: "50%"
spacing:
  row: "3px"
  xxs: "4px"
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  xxl: "48px"
components:
  breadcrumb:
    textColor: "{colors.grey-text}"
    typography: "{typography.ui}"
  breadcrumb-current:
    textColor: "{colors.ink}"
  tool-button:
    textColor: "{colors.grey-text}"
    typography: "{typography.ui}"
  tool-button-active:
    textColor: "{colors.ink}"
  icon-button:
    textColor: "{colors.grey-text}"
    rounded: "{rounded.sm}"
    size: "26px"
  icon-button-hover:
    backgroundColor: "{colors.hover-wash}"
    textColor: "{colors.ink}"
  filter-input:
    textColor: "{colors.ink}"
    typography: "{typography.ui}"
    padding: "6px 0"
  status-dot:
    backgroundColor: "{colors.signal-blue}"
    rounded: "{rounded.full}"
    size: "6px"
  status-dot-outdated:
    backgroundColor: "{colors.outdated-amber}"
    rounded: "{rounded.full}"
    size: "6px"
  column:
    width: "clamp(380px, calc((100vw - 140px) / 3), 540px)"
    padding: "36px 24px 56px"
  column-overview:
    width: "clamp(400px, calc((100vw - 140px) / 2.6), 620px)"
    padding: "36px 24px 56px"
  column-collapsed:
    textColor: "{colors.grey-text}"
    width: "36px"
    padding: "40px 0"
  column-title:
    textColor: "{colors.ink}"
    typography: "{typography.title}"
  function-summary:
    textColor: "{colors.ink-soft}"
    typography: "{typography.summary}"
  pseudocode:
    textColor: "{colors.ink-soft}"
    typography: "{typography.code}"
  outdated-note:
    textColor: "{colors.outdated-amber}"
    typography: "{typography.ui}"
  relation-row:
    textColor: "{colors.ink-soft}"
    typography: "{typography.identifier}"
    padding: "3px 0"
  relation-row-open:
    textColor: "{colors.ink}"
  sidebar-item:
    textColor: "{colors.ink-soft}"
    typography: "{typography.identifier}"
    padding: "3px 0"
  sidebar-item-active:
    textColor: "{colors.ink}"
  section-label:
    textColor: "{colors.grey-text}"
    typography: "{typography.label}"
---

# Design System: pseudoview

## Overview

**Creative North Star: "The Quiet Document"**

pseudoview is a reading page. A developer opens it to learn what a function does without reading the source. Type and space do all the work. Content has no cards, no panel borders, no header bar and no fills. Columns sit on one near-black ground and only space separates them. The pseudocode looks like a typed document, not an editor.

The page is dense and calm. Most text is 12 to 15px. There are two faces: system sans for prose and one mono for pseudocode and identifiers. The palette is grey. Two hues exist, and each one carries a single meaning. Blue means "described" and "the path you opened". Amber means "the code changed after this was written". Nothing else gets colour, and that includes the pseudocode. Keywords are bold ink and comments are grey.

Navigation is Finder-style. Opening a call adds a column on the right. The page itself never scrolls. Only the sidebar and each column scroll. The strip of columns always stops at a column's left edge, so no column shows cut through its text.

**Key Characteristics:**
- One near-black ground with no surfaces on top of it.
- Two faces: system sans for prose, mono for code and identifiers.
- Colour means state. Blue is described or open, amber is outdated.
- Status is a 6px dot, never a badge.
- Links are underlined in a dark grey, and the open link's underline turns blue.
- Columns are separated only by space, and controls stay hidden until hover.

## Colors

Near-neutral greys with a faint cool cast on near-black, plus one blue and one amber that are used only as signals.

### Primary
- **Signal Blue** (#5b8cff): The "described" status dot, the 2px underline on the link whose column is open, the focus ring, the text caret and the selection background. It marks where the reader is and what is current. It never decorates.

### Secondary
- **Outdated Amber** (#e0a33a): The status dot and the note text on a description that is older than its code. It is the only warning colour on the page.

### Neutral
- **Ground** (#0e0e0f): The page background. Every region (header, sidebar, columns) sits directly on it.
- **Ink** (#ececec): Function names, the current breadcrumb, pseudocode keywords, link text, and anything in a hover or active state.
- **Soft Ink** (#c9c9ce): Summaries, pseudocode body, overview prose and identifier lists. It is the reading colour for long text.
- **Grey Text** (#8d8d93): Secondary text. Breadcrumb trail, file location, section labels, line counts, pseudocode comments, resting controls, and the ring of the "not described" dot.
- **Grey Line** (#4a4a50): Non-text marks only. Breadcrumb "/" separators, the resting underline of function links, and the filter field's bottom rule. At 2.2:1 on the ground it is too faint for words.
- **Hover Wash** (#1c1c1f): The background of an icon button on hover. It is the only fill in the system, and only controls get it.

### Named Rules
**The Two Signals Rule.** Blue and amber are the only hues. Blue means described, open or focused. Amber means outdated. Do not use either for emphasis, branding or decoration, and do not add a third hue.

**The Weight-Not-Hue Rule.** Pseudocode has no syntax colours. Keywords are Ink at weight 600, comments are Grey Text, and calls are underlined Ink. Everything else is Soft Ink.

## Typography

**Display Font:** none. The largest type is the 20px column title.
**Body Font:** system-ui (with "Segoe UI Variable Text", "Segoe UI", -apple-system, sans-serif)
**Label/Mono Font:** "Cascadia Mono" (with ui-monospace, Consolas, "SF Mono", monospace), ligatures turned off

**Character:** The platform's own sans carries all prose so the page feels native to the reader's machine. One mono sets pseudocode, function names in lists and the `/pseudoview` command. Ligatures are off, so `->` and `!=` read as typed.

### Hierarchy
- **Title** (600, 20px, 1.25, -0.015em): The function name or "Overview" at the top of each column. It wraps anywhere rather than overflow.
- **Summary** (400, 15px, 1.6): The one-paragraph description under the title, and the project summary. Max 60ch.
- **Body** (400, 14px, 1.5): The page default. Step titles in walkthroughs use it at weight 600.
- **Body small** (400, 13.5px, 1.5): Entry-point text, walkthrough step text and notes in the overview. Max 60ch.
- **UI** (400, 13px, 1.5): Header, breadcrumb, Find and Files, the filter field, the outdated note and "If it fails" lines.
- **Label** (500, 12px, 1.5): Section heads such as "Calls", "Called by" and "Where to start", in Grey Text. Sentence case, no tracking, no uppercase.
- **Meta** (400, 12px, 1.5): File location, file group names in the sidebar, and line counts (tabular figures).
- **Code** (400, 12.5px, 1.7, mono): Pseudocode blocks. Wrapped lines hang under their own indentation.
- **Identifier** (400, 12.5px, 1.5, mono): Function names in the sidebar, in Calls and Called by, and in entry-point chains. Weight 600 marks the open or active one.

### Named Rules
**The Two Faces Rule.** Sans is for sentences. Mono is for code and for names that exist in code. Never set prose in mono or an identifier in sans.

**The No-Shouting Rule.** Labels are small, grey and sentence case. Hierarchy comes from size steps (12 to 20px) and weight (400, 500, 600), not from caps or tracking.

## Layout

The page is a full-height grid that never scrolls. A header row sits on top. Below it are an optional 240px sidebar and the column strip. The sidebar and each column scroll on their own, so opening a function moves nothing else.

- **Header:** 13px text, padded 18px top and 48px each side, gap 24px. The breadcrumb fills the left and scrolls sideways without a scrollbar. Find and Files sit on the right, 20px apart.
- **Sidebar:** Hidden by default and remembered across visits. 240px wide, 20px top and 32px left padding. A filter field on top, then file groups (16px above each) and function rows.
- **Column strip:** Scrolls sideways only. It has 24px side padding, and a mask hides the left 24px, so a column that has scrolled away never shows a few letters at the edge.
- **Columns:** Width is clamp(380px, (100vw - 140px) / 3, 540px), so up to three fit. With the sidebar open the floor drops to 360px. The overview column is wider, up to 620px. Inner padding is 36px top, 24px sides, 56px bottom. A collapsed column is a 36px strip.
- **Rhythm:** A 4px-based scale. 16px from header to body, 24px before pseudocode, 32px before Calls and overview sections, 3px row padding in lists.
- **Below 760px:** The sidebar, Find and Files are hidden. The header pads 14px top and 20px sides. Columns are 88vw wide with 24px, 12px and 40px padding, and the strip mask shrinks to 8px. The breadcrumb stays.

### Named Rules
**The Still Page Rule.** The page itself never scrolls or shifts. Only the sidebar and the individual columns scroll.

**The Column Edge Rule.** When the strip moves, it stops at a column's left edge and shows the newest column plus as many parents as fit. Never leave a column cut through its text.

## Elevation & Depth

The system is flat. There are no shadows, no layered surfaces and no tonal containers. Depth is not used. Order comes from position (columns left to right), from type size and weight, and from the two signal colours. The only box-shadow in the build is a 1px inset ring that draws the hollow "not described" dot. It is a stroke, not elevation.

### Named Rules
**The Flat Ground Rule.** Every element sits on the one ground. If something needs to stand out, give it weight, ink or a signal colour, never a shadow or a panel.

## Shapes

Almost nothing has a shape. Content has no borders, boxes or corners. Three small forms exist:

- **Dot:** A 6px circle (50%) for status. Filled blue, filled amber, or hollow with a 1px grey ring.
- **Icon button:** A 26px square with gently rounded corners (5px). It is visible only through its hover wash.
- **Focus ring:** A 2px blue outline, 2px offset, with 3px corners.

The one line in the system is the filter field's 1px bottom rule in Grey Line. It turns blue on focus. Icons are 14px line drawings with a 1.6 stroke and round caps and joins.

## Components

### Buttons
Text-only and quiet. A button looks like the text around it until you point at it.
- **Shape:** No background, border or padding at rest.
- **Tool buttons (Find, Files):** UI type in Grey Text. Hover and the pressed state (Files when the sidebar is open) turn Ink.
- **Icon buttons (collapse, close):** 26px, 5px corners, 14px line icons in Grey Text. Hover turns the icon Ink on a Hover Wash fill. The pair sits at the right of a column title and fades in over 150ms when the column is hovered or a control has focus. On touch screens it is always visible.
- **Focus:** Every focusable element gets the 2px Signal Blue ring.

### Inputs / Fields
- **Style:** The filter field has no box. It is UI type in Ink over the ground, with 6px vertical padding, a 1px Grey Line bottom rule and Grey Text placeholder.
- **Focus:** The bottom rule turns Signal Blue. There is no outline.

### Navigation
- **Breadcrumb:** The project name (Ink, 600), then the open columns, separated by "/" in Grey Line with 8px gaps. Earlier crumbs are Grey Text and turn Ink on hover. The current crumb is Ink at 600. Clicking a crumb closes every column after it.
- **Sidebar list:** Files as Meta labels in Grey Text. Functions as Identifier rows in Soft Ink, each led by its status dot with an 8px gap. Hover turns a row Ink. The row whose function is open is Ink at 600. "Overview" leads the list in sans at 13px, 600.

### Function column (signature)
The core unit of the page. A column has no frame.
- **Head:** Status dot, then the Title, then the hidden controls. Under it, the file location in Meta type. It links to the source in VS Code, followed by tags after a " · ".
- **Body:** The Summary in Soft Ink. Then, if outdated, the note in Outdated Amber at 13px. Then the pseudocode 24px below.
- **Pseudocode:** Code type in Soft Ink, keywords Ink 600, comments Grey Text. A call is a function link: Ink text with a Grey Line underline, 3px offset. Hover turns the underline Ink. The link whose column is open gets a 2px Signal Blue underline.
- **Calls and Called by:** 32px below the pseudocode. Label heads, then rows of Identifier names in Soft Ink with the line count right-aligned in Grey Text. These names have no underline. The open one is Ink 600.
- **Entering:** A new column eases in from 8px to the right with an opacity fade over 180ms, using cubic-bezier(.16, 1, .3, 1). With reduced motion it appears at once.

### Collapsed column
A 36px strip with the function name written down it (12px, 400, 0.02em, vertical) in Grey Text. Everything else in the column is hidden. Hover or focus turns it Ink. It acts as a button: Tab reaches it, and Enter or Space opens it again. Its focus ring sits on the vertical name.

### Overview column
The first column. It holds the project Summary, a stats line in 12.5px Grey Text (counts with their dots), then sections under Label heads 32px apart: entry points (mono name in Ink 600, Body small text, an arrow chain of links), numbered walkthrough steps (a 22px numeral column in Grey Text), and notes with a link pushed to the right.

## Do's and Don'ts

### Do:
- **Do** put every element straight on the Ground (#0e0e0f). Separate columns and sections with space only.
- **Do** use Soft Ink (#c9c9ce) for long reading text and Ink (#ececec) for names, keywords, links and active states.
- **Do** keep Signal Blue (#5b8cff) for described, open and focused, and Outdated Amber (#e0a33a) for outdated. Nothing else.
- **Do** show status with the 6px dot, and say outdated in words as well as in amber.
- **Do** mark function links with an underline in Grey Line, 3px offset, and switch the open one to a 2px blue underline.
- **Do** set pseudocode and identifiers in the mono at 12.5px with ligatures off, and prose in system sans.
- **Do** keep prose to 60ch.
- **Do** honour reduced motion and show hidden controls on touch screens.

### Don't:
- **Don't** add cards, panels, borders, fills or shadows around content. The filter field's bottom rule and the icon button's hover wash are the only exceptions, and both belong to controls.
- **Don't** colour pseudocode by syntax. Keywords get weight, comments get grey.
- **Don't** use Grey Line (#4a4a50) for text a reader must read.
- **Don't** add a header bar, a toolbar background or a divider between columns.
- **Don't** let the page scroll, or let opening a column move anything to its left.
- **Don't** use badges or pills for status or tags. Tags are plain text after " · ".
- **Don't** set labels in uppercase or with wide tracking.
