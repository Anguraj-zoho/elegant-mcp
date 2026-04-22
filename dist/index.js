/**
 * elegant-agent-mcp — MCP Server
 * Works with: Cursor + Claude Desktop (stdio transport)
 *
 * Tools exposed:
 *   get_component      → canonical HTML snippet for any component
 *   get_recipe         → Shell A/B/C/D recipe (required files + structure)
 *   get_shell          → full shell skeleton HTML for a page type
 *   get_chart_snippet  → ElegantEChart.* call for a chart type
 *   list_components    → all available component names
 *   search_wiki        → keyword search across all wiki files
 *   get_icons          → icon file list (optionally filtered)
 *   get_checklist      → pre-commit checklist for a shell type
 *   get_anti_patterns  → known bottlenecks + their fixes
 *   setup_project      → mandatory project folder setup instructions
 *   get_topnavbar      → complete TopNavBar HTML (ready to paste)
 */
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema, } from "@modelcontextprotocol/sdk/types.js";
const CDN_BASE = "https://cdn.jsdelivr.net/gh/Anguraj-zoho/elegant-cdn@main";
const PRIVATE_REPO = "Anguraj-zoho/elegant-2.0";
const WIKI_PATH = "data/Components-Wiki";
const GH_TOKEN = process.env.ELEGANT_GH_TOKEN || "";
/* In-memory cache so we only fetch each wiki file once per session */
const wikiCache = new Map();
/* ══════════════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════════════ */
/** Fetch a wiki .md file from private GitHub repo (cached) */
async function readWikiFile(filename) {
    const name = filename.endsWith(".md") ? filename : `${filename}.md`;
    if (wikiCache.has(name))
        return wikiCache.get(name);
    if (!GH_TOKEN)
        return `[ERROR: ELEGANT_GH_TOKEN env var not set. Create a fine-grained token at github.com/settings/tokens]`;
    try {
        const url = `https://api.github.com/repos/${PRIVATE_REPO}/contents/${WIKI_PATH}/${name}`;
        const res = await fetch(url, {
            headers: {
                "Authorization": `Bearer ${GH_TOKEN}`,
                "Accept": "application/vnd.github.raw+json",
                "X-GitHub-Api-Version": "2022-11-28",
            },
        });
        if (!res.ok)
            return `[Wiki file not found: ${name} (${res.status})]`;
        const text = await res.text();
        wikiCache.set(name, text);
        return text;
    }
    catch (err) {
        return `[GitHub fetch error: ${err instanceof Error ? err.message : String(err)}]`;
    }
}
/**
 * Extract a named section from a markdown file.
 * Returns from the first H2/H3 that matches `heading` until the next H2/H3.
 */
function extractSection(content, heading) {
    const lines = content.split("\n");
    const headingLower = heading.toLowerCase();
    let inSection = false;
    const out = [];
    for (const line of lines) {
        if (/^#{2,3} /.test(line)) {
            if (line.toLowerCase().includes(headingLower)) {
                inSection = true;
                out.push(line);
                continue;
            }
            if (inSection)
                break; // next section — stop
        }
        if (inSection)
            out.push(line);
    }
    return out.length ? out.join("\n").trim() : `[Section "${heading}" not found]`;
}
/**
 * Extract the first ```html ... ``` block that appears after `heading`.
 * Returns just the HTML, no fences.
 */
function extractHtmlBlock(content, heading) {
    const src = heading ? extractSection(content, heading) : content;
    const match = src.match(/```html\n([\s\S]*?)```/);
    return match ? match[1].trim() : "[No HTML block found]";
}
/* ══════════════════════════════════════════════════════
   STATIC DATA — Recipes, Shells, Charts, Checklist
══════════════════════════════════════════════════════ */
const RECIPES = {
    A: `# Recipe A — Dashboard (Shell A)

Page types: Home dashboard, Security overview, Cloud Protection, Threat Hub.

## ⚠️ PREREQUISITE: Call setup_project FIRST
Before writing any HTML, call setup_project(feature_name) to get the folder structure, copy commands, and critical rules. ALL CSS/JS/icons must be LOCAL files — never CDN, never inline.

## Required wiki files (open ALL before writing HTML)
1. app_shells.md       — Shell A tree
2. layout_shell.md     — base HTML skeleton
3. design_tokens.md    — CSS variables
4. topnavbar.md        — TopNavBar (data-active-tab="Home")
5. line_tab.md         — sub-tabs + dashboard variant actions
6. header.md           — Variant 1 (title + help icon)
7. widget.md           — widget cards (10 patterns)
8. stat_card.md        — KPI stat cards
9. tile_widgets.md     — tile JS API
10. predefined_charts.md — ElegantEChart.* API
11. echarts-widget.md  — chart engine
12. echarts-elegant-theme.md — theme
13. icons.md           — icon lookup
14. form_input.md      — filter inputs
15. form_dropdown.md   — filter dropdowns
16. drawer.md          — detail drawers
17. button-row.md      — action buttons

## CSS load order
tokens → layout → topnavbar → line-tab → widget → table → responsive → notification-banner

## Scroll model
ONLY .dash scrolls (flex:1; overflow-y:auto). Everything above is fixed.

## Shell A structure
\`\`\`
div.app-shell (height:100vh; flex:column)
 ├── header.topnavbar
 ├── div.line-tab (h:40px) + div.line-tab__actions
 ├── div.toolbar [OPTIONAL]
 └── div.dash (bg:#F5F5F5; flex:1; overflow-y:auto)
      └── div.dash__grid
           ├── div.dash__row.stat-row   — max 4 stat cards
           ├── div.tile-grid            — max 3 tiles
           └── div.dash__row            — hybrid widgets (max 3/row)
\`\`\`
`,
    B: `# Recipe B — Settings (Shell B)

Page types: Settings tab, Admin config, Device Management.

## ⚠️ PREREQUISITE: Call setup_project FIRST
Before writing any HTML, call setup_project(feature_name) to get the folder structure, copy commands, and critical rules. ALL CSS/JS/icons must be LOCAL files — never CDN, never inline.

## Required wiki files (open ALL before writing HTML)
1. app_shells.md              ⚠ Shell B ONLY
2. layout_shell.md
3. design_tokens.md
4. topnavbar.md               — data-active-tab="Settings"
5. sidemenu_variant1_settings.md ⚠ mandatory
6. header.md                  — Variant 1 or 2
7. classic_tab.md             — tabs inside settings
8. data_table_type1.md
9. actionbar.md               ⚠ Types 1–7 ONLY (NOT Type 8)
10. form_input.md
11. form_dropdown.md
12. drawer.md
13. button-row.md             ⚠ Save/Cancel rows
14. note-container.md
15. icons.md

## CSS load order
tokens → layout → topnavbar → sidemenu → header → classic-tab → table → form-input → form-dropdown → drawer → responsive → notification-banner

## Scroll model
.sidemenu__scroll scrolls sidebar. .classic-tab__body or .table-scroll-area scrolls content.

## Shell B structure
\`\`\`
div.app-shell
 ├── header.topnavbar
 └── div.app-body
      ├── aside.sidemenu (w:240px)
      └── main.main-content (flex:1; pad:0 16px)
           ├── div.page-header (h:40px)
           └── div.classic-tab
                ├── div.classic-tab__headers
                └── div.classic-tab__body
                     └── [actionbar + data-table]
\`\`\`
`,
    C: `# Recipe C — Reports (Shell C)

Page types: Reports tab, Compliance pages, any sidebar report tree + chart + table.

## ⚠️ PREREQUISITE: Call setup_project FIRST
Before writing any HTML, call setup_project(feature_name) to get the folder structure, copy commands, and critical rules. ALL CSS/JS/icons must be LOCAL files — never CDN, never inline.

## Required wiki files (open ALL before writing HTML)
1. app_shells.md              ⚠ Shell C ONLY
2. layout_shell.md
3. design_tokens.md
4. topnavbar.md               — data-active-tab="Reports"
5. sidemenu_variant2_reports.md ⚠ mandatory (OS dropdown + search)
6. header.md                  ⚠ Variant 3 MANDATORY (Edit Report + Export As + Schedule + More)
7. classic_tab.md             — chart area ONLY
8. rpt-chart-floater.md       ⚠ mandatory on every report page
9. predefined_charts.md + echarts-widget.md + echarts-elegant-theme.md
10. form_input.md             ⚠ .reports-input-row--type1 + .rpt-textbox--* + .form-checkbox
11. form_dropdown.md          ⚠ NEVER <select>
12. data_table_type1.md
13. actionbar.md              ⚠ Type 8 MANDATORY
14. drawer.md                 — Customize View, Select Columns, Export History, Incident Workbench
15. button-row.md
16. note-container.md
17. icons.md

## CSS load order
tokens → layout → topnavbar → sidemenu → header → classic-tab → line-tab → table → form-input → form-dropdown → drawer → rpt-chart-floater → notification-banner → responsive

## Scroll model
ONLY .table-scroll-area scrolls (flex:1; overflow-y:auto; min-height:0).
ActionBar: position:sticky; top:0; z-index:3
thead: position:sticky; top:36px

## Critical Shell C assembly rules
1. .reports-quicklink is a DIRECT CHILD of .app-shell (sibling of topnavbar and app-body)
2. .classic-tab contains ONLY the chart area (rpt-chart-area + rpt-chart-floater)
3. .table-scroll-area is a SIBLING of .classic-tab, NOT a child
4. Page header action dropdowns: panel is a SIBLING of <button>, wrap in <div class="ph-action-wrap" style="position:relative">
5. Every ancestor from .app-shell → .table-scroll-area needs min-height:0; overflow:hidden

## Shell C structure
\`\`\`
div.app-shell
 ├── header.topnavbar (data-active-tab="Reports")
 ├── div.reports-quicklink → div.line-tab.line-tab--quicklink
 └── div.app-body
      ├── aside.sidemenu.sidemenu--type2
      └── main.main-content
           ├── div.page-header (Variant 3)
           ├── div.reports-input-row.reports-input-row--type1
           ├── div.classic-tab [chart ONLY]
           │    └── div.rpt-chart-area
           │         ├── div.rpt-chart-floater
           │         └── div.rpt-chart#chartId
           └── div.table-scroll-area
                ├── div.actionbar (Type 8, sticky)
                └── div.data-table-wrap → table.data-table
\`\`\`
`,
    D: `# Recipe D — Split Panel (Shell D)

Page types: AI Investigation, Incident Detail/Workbench, Playbook Editor.

## ⚠️ PREREQUISITE: Call setup_project FIRST
Before writing any HTML, call setup_project(feature_name) to get the folder structure, copy commands, and critical rules. ALL CSS/JS/icons must be LOCAL files — never CDN, never inline.

## Required wiki files (open ALL before writing HTML)
1. app_shells.md              — Shell D
2. layout_shell.md
3. design_tokens.md
4. topnavbar.md
5. header.md                  — Variant 2 (back button)
6. line_tab.md                — sub-navigation inside detail
7. data_table_type2.md        — grouped/expandable (never mix with Type 1 classes)
8. form_input.md + form_dropdown.md
9. drawer.md
10. button-row.md
11. note-container.md
12. icons.md

## Shell D structure
\`\`\`
div.app-shell
 ├── header.topnavbar
 └── div.app-body
      └── main.main-content (padding:0)
           ├── div.line-tab
           └── div.line-tab__body (flex:1; min-height:0)
                └── div.line-tab__content--active
                     └── div.split-layout (flex:row)
                          ├── div.left-panel  (flex:1; overflow-y:auto)
                          └── div.right-panel (w:380px; border-left)
\`\`\`
`,
};
const SHELLS = {
    A: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title><!-- PAGE TITLE --> — Log360 Cloud</title>
  <link rel="stylesheet" href="${CDN_BASE}/components/tokens.css" />
  <link rel="stylesheet" href="${CDN_BASE}/components/layout.css" />
  <link rel="stylesheet" href="${CDN_BASE}/components/topnavbar.css" />
  <link rel="stylesheet" href="${CDN_BASE}/components/line-tab.css" />
  <link rel="stylesheet" href="${CDN_BASE}/components/widget.css" />
  <link rel="stylesheet" href="${CDN_BASE}/components/table.css" />
  <link rel="stylesheet" href="${CDN_BASE}/components/form-input.css" />
  <link rel="stylesheet" href="${CDN_BASE}/components/form-dropdown.css" />
  <link rel="stylesheet" href="${CDN_BASE}/components/drawer.css" />
  <link rel="stylesheet" href="${CDN_BASE}/components/responsive.css" />
  <link rel="stylesheet" href="${CDN_BASE}/components/notification-banner.css" />
  <style>
    html,body{height:100%;margin:0;overflow:hidden;}
    .app-shell{height:100vh;display:flex;flex-direction:column;overflow:hidden;}
  </style>
</head>
<body>
<div class="sidemenu-backdrop"></div>
<div class="app-shell">

  <!-- SLOT: TopNavBar (data-active-tab="Home") -->

  <!-- SLOT: Line Tab + Actions -->
  <div class="line-tab">
    <div class="line-tab__headers">
      <button class="line-tab__header line-tab__header--selected" data-tab="overview">Overview</button>
      <!-- more tabs -->
    </div>
    <div class="line-tab__actions">
      <!-- cal-input, refresh, expand, separator, settings -->
    </div>
  </div>

  <!-- SLOT: Dashboard Grid (sole scroll area) -->
  <div class="dash">
    <div class="dash__grid">
      <!-- ROW 1: Stat cards (max 4) -->
      <div class="dash__row stat-row"><!-- stat-card × N --></div>
      <!-- ROW 2: Tiles (max 3) -->
      <div class="tile-grid" style="grid-template-columns:repeat(3,1fr);gap:4px;"><!-- tiles --></div>
      <!-- ROW 3+: Hybrid widgets (max 3/row) -->
      <div class="dash__row"><!-- widget × N --></div>
    </div>
  </div>

</div>
<!-- SLOT: Drawers (outside app-shell) -->
<!-- SLOT: Nav bottom sheet -->
<script src="${CDN_BASE}/components/lib/echarts.min.js"></script>
<script src="${CDN_BASE}/components/echarts-elegant-theme.js"></script>
<script src="${CDN_BASE}/components/echarts-widget.js"></script>
<script src="${CDN_BASE}/components/topnavbar.js"></script>
<script src="${CDN_BASE}/components/line-tab.js"></script>
<script src="${CDN_BASE}/components/icon-engine.js"></script>
<script src="${CDN_BASE}/components/notification-banner.js"></script>
</body></html>`,
    B: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title><!-- PAGE TITLE --> — Log360 Cloud</title>
  <link rel="stylesheet" href="${CDN_BASE}/components/tokens.css" />
  <link rel="stylesheet" href="${CDN_BASE}/components/layout.css" />
  <link rel="stylesheet" href="${CDN_BASE}/components/topnavbar.css" />
  <link rel="stylesheet" href="${CDN_BASE}/components/sidemenu.css" />
  <link rel="stylesheet" href="${CDN_BASE}/components/header.css" />
  <link rel="stylesheet" href="${CDN_BASE}/components/classic-tab.css" />
  <link rel="stylesheet" href="${CDN_BASE}/components/table.css" />
  <link rel="stylesheet" href="${CDN_BASE}/components/form-input.css" />
  <link rel="stylesheet" href="${CDN_BASE}/components/form-dropdown.css" />
  <link rel="stylesheet" href="${CDN_BASE}/components/drawer.css" />
  <link rel="stylesheet" href="${CDN_BASE}/components/responsive.css" />
  <link rel="stylesheet" href="${CDN_BASE}/components/notification-banner.css" />
  <style>
    html,body{height:100%;margin:0;overflow:hidden;}
    .app-shell{height:100vh;display:flex;flex-direction:column;overflow:hidden;}
    .app-body{flex:1;display:flex;flex-direction:row;overflow:hidden;min-height:0;}
    .main-content{flex:1;display:flex;flex-direction:column;overflow:hidden;min-height:0;padding:0 16px;}
  </style>
</head>
<body>
<div class="sidemenu-backdrop"></div>
<div class="app-shell">

  <!-- SLOT: TopNavBar (data-active-tab="Settings") -->

  <div class="app-body">
    <!-- SLOT: aside.sidemenu (variant 1 settings) -->
    <button class="sidemenu-expand" id="sidebarExpand"></button>

    <main class="main-content">
      <!-- SLOT: div.page-header (Variant 1) -->

      <!-- SLOT: div.classic-tab -->
      <div class="classic-tab">
        <div class="classic-tab__headers">
          <button class="classic-tab__header classic-tab__header--selected" data-tab="tab1">Tab 1</button>
          <div class="classic-tab__filler"></div>
        </div>
        <div class="classic-tab__body">
          <div class="classic-tab__content classic-tab__content--active" data-tab-content="tab1">
            <!-- SLOT: actionbar (Type 1-7) + data-table-wrap -->
          </div>
        </div>
      </div>
    </main>
  </div>

</div>
<!-- SLOT: Drawers -->
<script src="${CDN_BASE}/components/topnavbar.js"></script>
<script src="${CDN_BASE}/components/sidemenu.js"></script>
<script src="${CDN_BASE}/components/classic-tab.js"></script>
<script src="${CDN_BASE}/components/table.js"></script>
<script src="${CDN_BASE}/components/drawer.js"></script>
<script src="${CDN_BASE}/components/form-input.js"></script>
<script src="${CDN_BASE}/components/form-dropdown.js"></script>
<script src="${CDN_BASE}/components/icon-engine.js"></script>
<script src="${CDN_BASE}/components/notification-banner.js"></script>
</body></html>`,
    C: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title><!-- REPORT TITLE --> — Reports — Log360 Cloud</title>
  <link rel="stylesheet" href="${CDN_BASE}/components/tokens.css" />
  <link rel="stylesheet" href="${CDN_BASE}/components/layout.css" />
  <link rel="stylesheet" href="${CDN_BASE}/components/topnavbar.css" />
  <link rel="stylesheet" href="${CDN_BASE}/components/sidemenu.css" />
  <link rel="stylesheet" href="${CDN_BASE}/components/header.css" />
  <link rel="stylesheet" href="${CDN_BASE}/components/classic-tab.css" />
  <link rel="stylesheet" href="${CDN_BASE}/components/line-tab.css" />
  <link rel="stylesheet" href="${CDN_BASE}/components/table.css" />
  <link rel="stylesheet" href="${CDN_BASE}/components/form-input.css" />
  <link rel="stylesheet" href="${CDN_BASE}/components/form-dropdown.css" />
  <link rel="stylesheet" href="${CDN_BASE}/components/drawer.css" />
  <link rel="stylesheet" href="${CDN_BASE}/components/rpt-chart-floater.css" />
  <link rel="stylesheet" href="${CDN_BASE}/components/notification-banner.css" />
  <link rel="stylesheet" href="${CDN_BASE}/components/responsive.css" />
  <style>
    html,body{height:100%;margin:0;overflow:hidden;}
    .app-shell{height:100vh;display:flex;flex-direction:column;overflow:hidden;}
    .app-body{flex:1;display:flex;flex-direction:row;overflow:hidden;min-height:0;}
    .main-content{flex:1;display:flex;flex-direction:column;overflow:hidden;min-height:0;padding:0 16px;}
    .classic-tab{flex-shrink:0;}
    .table-scroll-area{flex:1;overflow-y:auto;min-height:0;position:relative;}
    .actionbar{position:sticky;top:0;z-index:var(--z-floating-panel,3);background:#fff;}
    .reports-quicklink{flex-shrink:0;background:#fff;border-bottom:1px solid #E9E9E9;}
    .reports-quicklink .line-tab{border-bottom:none;}
    .reports-input-row--type1{display:flex;align-items:center;gap:12px;padding:8px 0;flex-shrink:0;flex-wrap:wrap;}
    .reports-input-row--type1 label{font-size:12px;color:#626262;white-space:nowrap;}
    .reports-input-row__group{display:flex;align-items:center;gap:6px;}
  </style>
</head>
<body>
<div class="sidemenu-backdrop"></div>
<div class="app-shell">

  <!-- SLOT: TopNavBar (data-active-tab="Reports") -->

  <!-- SLOT: reports-quicklink (direct child of app-shell, sibling of app-body) -->
  <div class="reports-quicklink">
    <div class="line-tab line-tab--quicklink">
      <div class="line-tab__headers">
        <button class="line-tab__header line-tab__header--selected">Servers &amp; Workstation</button>
        <!-- more quicklinks -->
      </div>
    </div>
  </div>

  <div class="app-body">
    <!-- SLOT: aside.sidemenu.sidemenu--type2 (data-active-item="Report Name") -->
    <button class="sidemenu-expand" id="sidebarExpand"></button>

    <main class="main-content">

      <!-- SLOT: div.page-header (Variant 3: title + help + Edit Report + Export As + Schedule + More) -->

      <!-- SLOT: div.reports-input-row.reports-input-row--type1 -->
      <div class="reports-input-row reports-input-row--type1">
        <!-- form-dropdown-wrap groups + Generate button -->
      </div>

      <!-- SLOT: classic-tab (CHART ONLY) -->
      <div class="classic-tab">
        <div class="classic-tab__headers">
          <button class="classic-tab__header classic-tab__header--selected" data-tab="line">Line</button>
          <button class="classic-tab__header" data-tab="bar">Bar</button>
          <div class="classic-tab__filler"></div>
        </div>
        <div class="classic-tab__body">
          <div class="classic-tab__content classic-tab__content--active" data-tab-content="line">
            <div class="rpt-chart-area">
              <!-- rpt-chart-floater (mandatory) -->
              <div class="rpt-chart-floater" role="toolbar" aria-label="Chart tools">
                <button class="rpt-chart-floater__btn" type="button" data-drawer-open="customizeViewDrawer" title="Customize View" aria-label="Customize View">
                  <svg viewBox="0 0 14 14"><path d="M1 3.5H5M9 3.5H13M1 7H8M11 7H13M1 10.5H4M7 10.5H13"/><circle cx="7" cy="3.5" r="1.5"/><circle cx="9.5" cy="7" r="1.5"/><circle cx="5.5" cy="10.5" r="1.5"/></svg>
                </button>
                <div class="rpt-chart-floater__divider" aria-hidden="true"></div>
                <button class="rpt-chart-floater__btn rpt-chart-floater__btn--toggle" type="button" title="Chart View" aria-pressed="true" data-view="chart">
                  <svg viewBox="0 0 14 14"><path d="M1 13H13M3.5 13V8M7 13V4M10.5 13V6.5"/></svg>
                </button>
              </div>
              <div class="rpt-chart" id="mainChart" style="width:100%;min-height:220px;"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- SLOT: table-scroll-area (SIBLING of classic-tab, NOT inside it) -->
      <div class="table-scroll-area">
        <!-- actionbar Type 8 (sticky) -->
        <div class="actionbar">
          <div class="actionbar__left">
            <button class="actionbar__icon-btn" title="Search"><img src="assets/icons/icon-ab-search.svg" alt="" style="width:14px;height:14px;" /></button>
            <div class="actionbar__separator"></div>
            <button class="actionbar__btn-report" onclick="ElegantDrawer&&ElegantDrawer.open('incidentWorkbenchDrawer')">
              <img src="assets/icons/icon-ab-plus.svg" alt="" /><span>Incident</span>
            </button>
          </div>
          <div class="actionbar__right">
            <span class="actionbar__pagination">1-50 <i>of</i> <b><!-- TOTAL --></b></span>
            <button class="actionbar__nav-btn"><img src="assets/icons/icon-ab-arrow-left.svg" alt="" /></button>
            <button class="actionbar__nav-btn"><img src="assets/icons/icon-ab-arrow-right.svg" alt="" /></button>
            <div class="actionbar__separator"></div>
            <button class="actionbar__icon-btn" onclick="ElegantDrawer&&ElegantDrawer.open('selectColumnsDrawer')"><img src="assets/icons/icon-ab-column.svg" alt="" style="width:14px;height:14px;" /></button>
          </div>
        </div>
        <!-- data-table-wrap -->
        <div class="data-table-wrap">
          <table class="data-table">
            <colgroup>
              <col style="width:32px;" />
              <!-- SLOT: cols (no width = proportional) -->
            </colgroup>
            <thead><tr>
              <th class="cell-checkbox" data-checked="unchecked"><img src="assets/icons/icon-checkbox.svg" alt="" style="width:14px;height:14px;" /></th>
              <!-- SLOT: th headers -->
            </tr></thead>
            <tbody><!-- SLOT: rows --></tbody>
          </table>
        </div>
      </div>

    </main>
  </div>

</div>
<!-- SLOT: Drawers (outside app-shell) — customizeViewDrawer, selectColumnsDrawer, eventDetailDrawer, incidentWorkbenchDrawer -->
<!-- SLOT: Nav bottom sheet -->
<script src="${CDN_BASE}/components/lib/echarts.min.js"></script>
<script src="${CDN_BASE}/components/echarts-elegant-theme.js"></script>
<script src="${CDN_BASE}/components/echarts-widget.js"></script>
<script src="${CDN_BASE}/components/topnavbar.js"></script>
<script src="${CDN_BASE}/components/sidemenu.js"></script>
<script src="${CDN_BASE}/components/classic-tab.js"></script>
<script src="${CDN_BASE}/components/line-tab.js"></script>
<script src="${CDN_BASE}/components/table.js"></script>
<script src="${CDN_BASE}/components/drawer.js"></script>
<script src="${CDN_BASE}/components/form-input.js"></script>
<script src="${CDN_BASE}/components/form-dropdown.js"></script>
<script src="${CDN_BASE}/components/rpt-chart-floater.js"></script>
<script src="${CDN_BASE}/components/icon-engine.js"></script>
<script src="${CDN_BASE}/components/notification-banner.js"></script>
<script>
  /* SLOT: chart render calls */
  /* ElegantEChart.line('mainChart', { labels:[...], datasets:[...] }); */
</script>
</body></html>`,
    D: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title><!-- TITLE --> — Log360 Cloud</title>
  <link rel="stylesheet" href="${CDN_BASE}/components/tokens.css" />
  <link rel="stylesheet" href="${CDN_BASE}/components/layout.css" />
  <link rel="stylesheet" href="${CDN_BASE}/components/topnavbar.css" />
  <link rel="stylesheet" href="${CDN_BASE}/components/line-tab.css" />
  <link rel="stylesheet" href="${CDN_BASE}/components/header.css" />
  <link rel="stylesheet" href="${CDN_BASE}/components/widget.css" />
  <link rel="stylesheet" href="${CDN_BASE}/components/table.css" />
  <link rel="stylesheet" href="${CDN_BASE}/components/drawer.css" />
  <link rel="stylesheet" href="${CDN_BASE}/components/responsive.css" />
  <style>
    html,body{height:100%;margin:0;overflow:hidden;}
    .app-shell{height:100vh;display:flex;flex-direction:column;overflow:hidden;}
    .app-body{flex:1;display:flex;overflow:hidden;min-height:0;}
    .main-content{flex:1;display:flex;flex-direction:column;overflow:hidden;min-height:0;padding:0;}
    .split-layout{display:flex;flex:1;min-height:0;}
    .left-panel{flex:1;overflow-y:auto;padding:0 16px 24px;}
    .right-panel{width:380px;border-left:1px solid #E9E9E9;display:flex;flex-direction:column;}
    .panel-header{padding:12px 16px;border-bottom:1px solid #E9E9E9;font-size:14px;font-weight:600;}
    .panel-body{flex:1;overflow-y:auto;padding:16px;}
    .panel-footer{padding:12px 16px;border-top:1px solid #E9E9E9;display:flex;gap:8px;}
  </style>
</head>
<body>
<div class="app-shell">

  <!-- SLOT: TopNavBar -->

  <div class="app-body">
    <main class="main-content">
      <!-- SLOT: line-tab (sub-navigation) -->
      <div class="line-tab"><div class="line-tab__headers">
        <button class="line-tab__header line-tab__header--selected" data-tab="main">Main</button>
      </div></div>

      <!-- SLOT: line-tab__body -->
      <div class="line-tab__body" style="flex:1;display:flex;flex-direction:column;min-height:0;">
        <div class="line-tab__content line-tab__content--active" data-tab-content="main" style="flex:1;display:flex;flex-direction:column;">
          <div class="split-layout">
            <div class="left-panel scrollbar-thin"><!-- SLOT: widgets, tables, timeline --></div>
            <div class="right-panel">
              <div class="panel-header"><!-- SLOT: panel title --></div>
              <div class="panel-body scrollbar-thin"><!-- SLOT: panel content --></div>
              <div class="panel-footer"><!-- SLOT: buttons --></div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>

</div>
<script src="${CDN_BASE}/components/lib/echarts.min.js"></script>
<script src="${CDN_BASE}/components/echarts-elegant-theme.js"></script>
<script src="${CDN_BASE}/components/echarts-widget.js"></script>
<script src="${CDN_BASE}/components/topnavbar.js"></script>
<script src="${CDN_BASE}/components/line-tab.js"></script>
</body></html>`,
};
const CHART_SNIPPETS = {
    line: `<div id="chart-line" style="width:100%;min-height:220px;"></div>
<script>
ElegantEChart.line('chart-line', {
  labels: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
  datasets: [
    { label: 'Series A', values: [120,180,140,220,190,160,210], color: '#2C66DD', fill: false },
    { label: 'Series B', values: [80,110,95,140,120,100,130],  color: '#009CBB', fill: false }
  ]
});
<\/script>`,
    area: `<div id="chart-area" style="width:100%;min-height:220px;"></div>
<script>
ElegantEChart.line('chart-area', {
  labels: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
  datasets: [
    { label: 'Series A', values: [120,180,140,220,190,160,210], color: '#2C66DD', fill: true },
    { label: 'Series B', values: [80,110,95,140,120,100,130],  color: '#009CBB', fill: true }
  ]
});
<\/script>`,
    bar: `<div id="chart-bar" style="width:100%;min-height:220px;"></div>
<script>
ElegantEChart.bar('chart-bar', {
  labels: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
  datasets: [
    { label: 'Series A', values: [24,18,31,22,27,19,26], color: '#2C66DD' },
    { label: 'Series B', values: [8,5,12,6,9,4,7],       color: '#DD1616' }
  ]
});
<\/script>`,
    hbar: `<div id="chart-hbar" style="width:100%;min-height:220px;"></div>
<script>
ElegantEChart.hbar('chart-hbar', {
  labels: ['Item A','Item B','Item C','Item D','Item E'],
  datasets: [
    { label: 'Count', values: [866,3452,1231,4567,987], color: '#2C66DD' }
  ]
});
<\/script>`,
    donut: `<div id="chart-donut" style="width:100%;min-height:220px;"></div>
<script>
ElegantEChart.donut('chart-donut', {
  labels: ['Critical','High','Medium','Low'],
  values: [18,34,56,92],
  colors: ['#DD1616','#D14900','#FABB34','#198019']
});
<\/script>`,
    stacked: `<div id="chart-stacked" style="width:100%;min-height:220px;"></div>
<script>
ElegantEChart.bar('chart-stacked', {
  labels: ['Mon','Tue','Wed','Thu','Fri'],
  datasets: [
    { label: 'Critical', values: [12,19,8,15,22], color: '#DD1616' },
    { label: 'High',     values: [8,14,11,9,17],  color: '#D14900' },
    { label: 'Medium',   values: [20,25,18,22,30], color: '#FABB34' }
  ]
}, { stacked: true });
<\/script>`,
};
const CHECKLIST = {
    C: `# Pre-Commit Checklist — Shell C (Reports)

## STRUCTURE
[ ] .classic-tab has exactly ONE direct child .classic-tab__body
[ ] .classic-tab__body has >=1 .classic-tab__content panel
[ ] .table-scroll-area is a SIBLING of .classic-tab (NOT inside it)
[ ] Every .drawer is paired with .drawer-backdrop[data-drawer="..."] sibling
[ ] .reports-quicklink is direct child of .app-shell (sibling of topnavbar + app-body)
[ ] No <button> nested inside another <button>

## CSS LINKS
[ ] tokens.css, layout.css, topnavbar.css always linked
[ ] line-tab.css linked (used for quicklink + drawer tabs)
[ ] classic-tab.css linked
[ ] rpt-chart-floater.css linked
[ ] drawer.css linked
[ ] form-input.css + form-dropdown.css linked

## OVERRIDES — NONE of these should exist
[ ] NO style="padding:0" on .drawer__body (use --no-pad / --flush-* modifier)
[ ] NO inline z-index override on .drawer / .drawer-backdrop
[ ] NO custom data-*-tab / data-*-pane attributes (use built-in data-tab)
[ ] NO inline <style> block redefining a class already in a linked CSS file
[ ] NO raw <input type="checkbox|radio"> (use .form-checkbox / .form-radio)
[ ] NO raw <select> (use form-dropdown component)
[ ] NO .rpt-chart-toggle segmented control (use rpt-chart-floater instead)

## INPUT WIDTH INVARIANT
[ ] Every .form-row__input uses exactly ONE: (no modifier=280) / --medium (160) / --small (100) / --full
[ ] NO inline .form-row__input { flex:1 } — breaks 280px invariant
[ ] .drawer-form container ONLY has display:flex; flex-direction:column; gap:16px

## LABEL BALANCE
[ ] Every vertical drawer form has exactly ONE --labels-* on its container
[ ] NO .form-row--gap-16 on rows inside a vertical drawer form

## VARIANTS
[ ] Reports actionbar = Type 8 (Search + Incident | pagination + Column View)
[ ] Reports page has .rpt-chart-floater inside .rpt-chart-area
[ ] Reports quicklink uses .line-tab--quicklink
[ ] Table columns: 32px fixed for checkbox, rest proportional (no width on other cols)
[ ] Drawer tabs = line-tab (NOT classic-tab)
[ ] Header = Variant 3 (Edit Report + Export As + Schedule Reports + More)
`,
    A: `# Pre-Commit Checklist — Shell A (Dashboard)

## STRUCTURE
[ ] Only .dash scrolls (overflow-y:auto). html/body/.app-shell NEVER scroll
[ ] stat-row: max 4 stat cards
[ ] tile-grid: max 3 tiles, max 1 row
[ ] Hybrid widgets: max 3 per dash__row

## CSS LINKS
[ ] tokens.css, layout.css, topnavbar.css, line-tab.css, widget.css, table.css linked

## OVERRIDES
[ ] NO raw <select> / <input type=checkbox/radio>
[ ] NO hardcoded z-index (use var(--z-*))

## ANIMATIONS
[ ] Every widget/tile/card has anim-fade-in-up + staggered anim-delay-N
`,
    B: `# Pre-Commit Checklist — Shell B (Settings)

## STRUCTURE
[ ] sidemenu_variant1 used (NOT type2)
[ ] ActionBar type 1-7 ONLY (NEVER type 8)
[ ] classic-tab has __body with __content panels

## CSS LINKS
[ ] sidemenu.css, header.css, classic-tab.css, table.css, form-input.css, form-dropdown.css, drawer.css linked

## OVERRIDES
[ ] NO raw <select> / <input type=checkbox/radio>
[ ] Drawer form labels use --labels-* container modifier
`,
};
const ANTI_PATTERNS = `# Known Bottlenecks & Anti-Patterns

| # | Symptom | Root cause | Fix |
|---|---|---|---|
| 1 | Reports quicklink renders as plain text buttons | line-tab.css not linked | Add <link href="${CDN_BASE}/components/line-tab.css"> |
| 2 | ActionBar has view-toggle instead of Search | Using Type 1-7 on Reports page | Reports = Type 8 exclusively |
| 3 | ActionBar has rows-per-page dropdown | Not in Type 8 spec | Remove it |
| 4 | Table columns unevenly sized | Hard-coded <col style="width:Npx"> on non-checkbox cols | Checkbox = 32px fixed; ALL others = <col /> no width |
| 5 | Drawer body flush to edges | style="padding:0" on .drawer__body | Use .drawer__body--no-pad / --flush-x / --flush-top |
| 6 | classic-tab strip orphaned in drawer | Used classic-tab inside drawer | Use line-tab inside drawers ALWAYS |
| 7 | Tabs switch but content doesn't change | Custom data-*-tab attributes bypass line-tab.js | Use standard data-tab / data-tab-content only |
| 8 | Drawer backdrop doesn't dim page | Inline z-index override | Let drawer.css canonical z-index:900/910 stand |
| 9 | Dropdown 432px wide in drawer form | Inline .form-row__input { flex:1 } override | Delete override. Library = 280px fixed. Use --medium/--small/--full |
| 10 | Drawer form labels jagged | .form-row--gap-16 inside vertical drawer | Put .drawer-form--labels-100 (or N) on container. Remove --gap-16 |
| 11 | Dropdown panel renders behind tabs/header | Hardcoded z-index or ancestor position:relative z-index:1 | Use var(--z-*) tokens. Use isolation:isolate instead of z-index:1 on wrappers |
| 12 | table-scroll-area doesn't scroll / disappears | Missing min-height:0 or overflow:hidden on ancestor | Every ancestor: flex:1; min-height:0; overflow:hidden |
| 13 | rpt-chart-floater drifts to viewport corner | .rpt-chart-area missing position:relative | .rpt-chart-area already has it in rpt-chart-floater.css — don't remove |
`;
const SETUP_PROJECT = `# MANDATORY: Project Setup — CDN Mode

## CDN Base URL

\`\`\`
${CDN_BASE}
\`\`\`

All CSS, JS, SVG icons, and fonts are served from this public CDN.
The output is a **single index.html file** — no local folders needed.

## ⛔ CRITICAL RULES — READ BEFORE WRITING ANY HTML

1. **ALL CSS from CDN** — use \`<link rel="stylesheet" href="${CDN_BASE}/components/*.css">\`. NEVER inline CSS. NEVER write <style> blocks for component styles.
2. **ALL JS from CDN** — use \`<script src="${CDN_BASE}/components/*.js">\`. NEVER write custom JS that replaces component JS.
3. **ALL ICONS from CDN** — use \`<img src="${CDN_BASE}/assets/icons/icon-*.svg">\`. There are 195 pre-exported SVGs. NEVER use inline <svg> when a file exists. For icons NOT in the library, use Lucide CDN: \`https://cdn.jsdelivr.net/npm/lucide-static/icons/ICON_NAME.svg\`
4. **FONTS load automatically** via tokens.css @font-face (Zoho Puvi). No extra font links needed.
5. **Logo from CDN** — use \`<img src="${CDN_BASE}/assets/icons/logo-log360.svg">\`. NEVER omit the logo.
6. **Output = SINGLE index.html** — no folder setup, no copy commands. Just one HTML file that loads everything from CDN.

## Icon reference pattern

Every component uses \`<img src="${CDN_BASE}/assets/icons/icon-NAME.svg">\`. Key icons:

| Purpose | Icon file |
|---|---|
| Product logo | \`logo-log360.svg\` |
| Search | \`icon-ab-search.svg\` (report), \`icon-actionbar-search.svg\` (settings) |
| Pagination prev/next | \`icon-ab-arrow-left.svg\`, \`icon-ab-arrow-right.svg\` |
| Checkbox | \`icon-checkbox.svg\`, \`icon-checkbox-checked.svg\` |
| Close | \`icon-close.svg\` |
| Dropdown chevron | \`icon-dropdown-chevron.svg\` |
| Refresh | \`icon-actionbar-refresh.svg\` |
| Edit | \`icon-rpt-edit.svg\`, \`icon-action-edit.svg\` |
| Export | \`icon-rpt-export.svg\` |
| Schedule | \`icon-rpt-schedule.svg\` |
| More | \`icon-rpt-more.svg\`, \`icon-action-more.svg\` |
| Help | \`icon-report-help.svg\`, \`icon-help.svg\` |
| Plus | \`icon-ab-plus.svg\` |
| Column view | \`icon-ab-column.svg\` |
| OS Windows | \`icon-os-windows.svg\` |
| OS Linux | \`icon-os-linux.svg\` |
| Settings | \`icon-dd-settings.svg\` |
| Calendar | \`icon-dd-calendar.svg\` |
| Menu hamburger | \`icon-menu.svg\` |
| User avatar | \`icon-user-avatar.svg\` |
| Notification | \`icon-notification.svg\` |

Use \`get_icons("search-term")\` to find any icon by name.

## Lucide CDN (for icons not in Elegant library)

\`\`\`
https://cdn.jsdelivr.net/npm/lucide-static/icons/{icon-name}.svg
\`\`\`
Example: \`<img src="https://cdn.jsdelivr.net/npm/lucide-static/icons/shield.svg" width="14" height="14">\`

## HTML head pattern (ALWAYS use CDN URLs, never inline CSS)

\`\`\`html
<link rel="stylesheet" href="${CDN_BASE}/components/tokens.css" />
<link rel="stylesheet" href="${CDN_BASE}/components/layout.css" />
<link rel="stylesheet" href="${CDN_BASE}/components/topnavbar.css" />
<!-- ... only the CSS files needed for this page ... -->
\`\`\`

## Script load order (at end of body, ALWAYS use CDN URLs)

\`\`\`html
<script src="${CDN_BASE}/components/lib/echarts.min.js"><\/script>
<script src="${CDN_BASE}/components/echarts-elegant-theme.js"><\/script>
<script src="${CDN_BASE}/components/echarts-widget.js"><\/script>
<script src="${CDN_BASE}/components/topnavbar.js"><\/script>
<!-- ... only the JS files needed for this page ... -->
\`\`\`

## Available CSS files
tokens.css, layout.css, topnavbar.css, sidemenu.css, header.css, classic-tab.css,
line-tab.css, table.css, table-type2.css, form-input.css, form-dropdown.css,
drawer.css, rpt-chart-floater.css, widget.css, echarts-widget.css,
note-container.css, notification-banner.css, responsive.css

## Available JS files
topnavbar.js, sidemenu.js, classic-tab.js, line-tab.js, table.js,
form-input.js, form-dropdown.js, drawer.js, rpt-chart-floater.js,
widget.js, echarts-widget.js, echarts-elegant-theme.js, icon-engine.js,
notification-banner.js, lib/echarts.min.js, lib/echarts-liquidfill.min.js,
lib/world-map-register.js
`;
/* ══════════════════════════════════════════════════════
   COMPONENT NAME → WIKI FILE MAP
══════════════════════════════════════════════════════ */
const COMPONENT_MAP = {
    topnavbar: { file: "topnavbar.md", section: "Complete HTML" },
    "sidemenu-settings": { file: "sidemenu_variant1_settings.md", section: "Complete HTML" },
    "sidemenu-reports": { file: "sidemenu_variant2_reports.md", section: "Complete HTML" },
    "header-v1": { file: "header.md", section: "Variant 1: Default" },
    "header-v2": { file: "header.md", section: "Variant 2: With Back Button" },
    "header-v3": { file: "header.md", section: "Variant 3: Report Header" },
    "classic-tab": { file: "classic_tab.md", section: "Complete HTML" },
    "line-tab": { file: "line_tab.md", section: "Complete HTML" },
    "line-tab-quicklink": { file: "line_tab.md", section: "Variant 4" },
    "actionbar-type1": { file: "actionbar.md", section: "Type 1" },
    "actionbar-type2": { file: "actionbar.md", section: "Type 2" },
    "actionbar-type8": { file: "actionbar.md", section: "Type 8" },
    "data-table": { file: "data_table_type1.md", section: "Complete HTML" },
    "data-table-type2": { file: "data_table_type2.md", section: "Complete HTML" },
    "rpt-chart-floater": { file: "rpt-chart-floater.md", section: "Complete HTML" },
    "drawer-sm": { file: "drawer.md", section: "Variant 1" },
    "drawer-md": { file: "drawer.md", section: "Variant 2" },
    "drawer-lg": { file: "drawer.md", section: "Variant 3" },
    "form-text": { file: "form_input.md", section: "Type 1" },
    "form-textarea": { file: "form_input.md", section: "Type 3" },
    "form-checkbox": { file: "form_input.md", section: "Type 4" },
    "form-radio": { file: "form_input.md", section: "Type 5" },
    "form-dropdown": { file: "form_dropdown.md", section: "Complete HTML" },
    "widget": { file: "widget.md", section: "Complete HTML" },
    "stat-card": { file: "stat_card.md", section: "Complete HTML" },
    "button-row": { file: "button-row.md", section: "Complete HTML" },
    "note-container": { file: "note-container.md", section: "Complete HTML" },
    "design-tokens": { file: "design_tokens.md", section: "" },
};
/* ══════════════════════════════════════════════════════
   TOOL DEFINITIONS
══════════════════════════════════════════════════════ */
const TOOLS = [
    {
        name: "get_component",
        description: "Returns the canonical HTML snippet for an Elegant 1.0 component. Much cheaper than reading a full wiki .md file. Use this instead of Read on any component wiki file.",
        inputSchema: {
            type: "object",
            properties: {
                name: {
                    type: "string",
                    description: "Component name. Use list_components to see all options.",
                    enum: Object.keys(COMPONENT_MAP),
                },
            },
            required: ["name"],
        },
    },
    {
        name: "get_recipe",
        description: "Returns the full recipe for a Shell type (A/B/C/D): required wiki files, CSS load order, scroll model, and shell structure. Read this INSTEAD of LLM-WIKI.md or INDEX.md for page scaffolding.",
        inputSchema: {
            type: "object",
            properties: {
                shell: {
                    type: "string",
                    enum: ["A", "B", "C", "D"],
                    description: "A=Dashboard, B=Settings, C=Reports, D=Split-Panel/Detail",
                },
            },
            required: ["shell"],
        },
    },
    {
        name: "get_shell",
        description: "Returns a ready-to-fill HTML skeleton for Shell A/B/C/D with all required CSS/JS links and SLOT comments. Copy-paste this as the base, then fill the SLOTs.",
        inputSchema: {
            type: "object",
            properties: {
                shell: {
                    type: "string",
                    enum: ["A", "B", "C", "D"],
                },
            },
            required: ["shell"],
        },
    },
    {
        name: "get_chart_snippet",
        description: "Returns a ready-to-use ElegantEChart.* HTML+JS snippet for a chart type.",
        inputSchema: {
            type: "object",
            properties: {
                type: {
                    type: "string",
                    enum: ["line", "area", "bar", "hbar", "donut", "stacked"],
                },
            },
            required: ["type"],
        },
    },
    {
        name: "get_checklist",
        description: "Returns the pre-commit checklist for a shell type. Run this before declaring a page done.",
        inputSchema: {
            type: "object",
            properties: {
                shell: {
                    type: "string",
                    enum: ["A", "B", "C"],
                },
            },
            required: ["shell"],
        },
    },
    {
        name: "get_anti_patterns",
        description: "Returns the full list of known bottlenecks, their root causes, and fixes. Read this when something looks wrong before patching inline.",
        inputSchema: {
            type: "object",
            properties: {},
        },
    },
    {
        name: "list_components",
        description: "Lists all available component names you can pass to get_component.",
        inputSchema: {
            type: "object",
            properties: {},
        },
    },
    {
        name: "search_wiki",
        description: "Full-text search across all Components-Wiki .md files. Returns file name + matching line + 2 lines of context. Use this to find where a specific class, rule, or pattern is documented.",
        inputSchema: {
            type: "object",
            properties: {
                query: {
                    type: "string",
                    description: "Search term (case-insensitive)",
                },
                max_results: {
                    type: "number",
                    description: "Max results to return (default 20)",
                },
            },
            required: ["query"],
        },
    },
    {
        name: "get_icons",
        description: "Returns the list of available icon SVG filenames. Optionally filter by a search term.",
        inputSchema: {
            type: "object",
            properties: {
                filter: {
                    type: "string",
                    description: "Optional substring to filter icon names (e.g. 'action', 'ab-', 'rpt')",
                },
            },
        },
    },
    {
        name: "get_full_wiki_file",
        description: "Returns the COMPLETE content of a wiki .md file. Use only when get_component / get_recipe aren't enough (e.g. reading CSS section for a specific variant). Prefer get_component for HTML snippets.",
        inputSchema: {
            type: "object",
            properties: {
                filename: {
                    type: "string",
                    description: "Wiki filename without path (e.g. 'drawer.md', 'form_input.md')",
                },
            },
            required: ["filename"],
        },
    },
    {
        name: "setup_project",
        description: "⚠️ CALL THIS FIRST before building any page. Returns mandatory folder structure, copy commands, icon reference table, CSS/JS link patterns, and critical rules (NO CDN, NO inline CSS, NO inline SVG). Skipping this tool will produce broken output.",
        inputSchema: {
            type: "object",
            properties: {
                feature_name: {
                    type: "string",
                    description: "Name for the feature folder under figma-export/ (e.g. 'windows-startup', 'dashboard')",
                },
            },
            required: ["feature_name"],
        },
    },
    {
        name: "get_topnavbar",
        description: "Returns the COMPLETE TopNavBar HTML ready to paste. Includes both Row 1 (logo, subscription, icons, avatar) and Row 2 (navigation tabs). All icon paths pre-filled.",
        inputSchema: {
            type: "object",
            properties: {},
        },
    },
];
/* ══════════════════════════════════════════════════════
   TOOL HANDLERS
══════════════════════════════════════════════════════ */
function rewriteAssetPaths(html) {
    return html
        .replace(/src="assets\//g, `src="${CDN_BASE}/assets/`)
        .replace(/href="assets\//g, `href="${CDN_BASE}/assets/`);
}
async function handleGetComponent(args) {
    const entry = COMPONENT_MAP[args.name];
    if (!entry)
        return `Unknown component: ${args.name}. Use list_components to see options.`;
    const content = await readWikiFile(entry.file);
    if (!entry.section)
        return content;
    const html = rewriteAssetPaths(extractHtmlBlock(content, entry.section));
    return `## ${args.name} — ${entry.section}\n\nSource: ${entry.file}\nCDN: ${CDN_BASE}\n\n\`\`\`html\n${html}\n\`\`\``;
}
function handleGetRecipe(args) {
    const r = RECIPES[args.shell.toUpperCase()];
    if (!r)
        return `Unknown shell: ${args.shell}`;
    return r;
}
function handleGetShell(args) {
    const s = SHELLS[args.shell.toUpperCase()];
    if (!s)
        return `Unknown shell: ${args.shell}`;
    return `## Shell ${args.shell.toUpperCase()} Skeleton\n\nAll CSS/JS links point to CDN: ${CDN_BASE}\nAll icon <img> src must also use: ${CDN_BASE}/assets/icons/ICON_NAME.svg\n\n\`\`\`html\n${s}\n\`\`\``;
}
function handleGetChartSnippet(args) {
    const s = CHART_SNIPPETS[args.type.toLowerCase()];
    if (!s)
        return `Unknown chart type: ${args.type}. Options: ${Object.keys(CHART_SNIPPETS).join(", ")}`;
    return `## ${args.type} Chart Snippet\n\n${s}`;
}
function handleGetChecklist(args) {
    const c = CHECKLIST[args.shell.toUpperCase()];
    if (!c)
        return `No checklist for shell: ${args.shell}`;
    return c;
}
function handleListComponents() {
    const grouped = {
        Navigation: ["topnavbar", "sidemenu-settings", "sidemenu-reports", "line-tab", "line-tab-quicklink"],
        Header: ["header-v1", "header-v2", "header-v3"],
        Tabs: ["classic-tab", "line-tab"],
        Content: ["data-table", "data-table-type2", "widget", "stat-card", "button-row", "note-container"],
        ActionBar: ["actionbar-type1", "actionbar-type2", "actionbar-type8"],
        Reports: ["rpt-chart-floater"],
        Overlay: ["drawer-sm", "drawer-md", "drawer-lg"],
        Forms: ["form-text", "form-textarea", "form-checkbox", "form-radio", "form-dropdown"],
        Tokens: ["design-tokens"],
    };
    return Object.entries(grouped)
        .map(([group, names]) => `**${group}**\n${names.map(n => `  - ${n}`).join("\n")}`)
        .join("\n\n");
}
const WIKI_FILES = [
    "INDEX.md", "actionbar.md", "app_shells.md", "button-row.md", "classic_tab.md",
    "data_table_type1.md", "data_table_type2.md", "design_tokens.md", "drawer.md",
    "echarts-elegant-theme.md", "echarts-widget.md", "form_dropdown.md", "form_input.md",
    "header.md", "icon-engine.md", "icons.md", "layout_shell.md", "line_tab.md",
    "note-container.md", "predefined-chart-calendar-heatmap.md", "predefined-chart-combo.md",
    "predefined-chart-gauge.md", "predefined-chart-geo-widget.md", "predefined-chart-liquid-fill.md",
    "predefined-chart-network-graph.md", "predefined-chart-nightingale-rose.md",
    "predefined-chart-pictorial-bar.md", "predefined-chart-radar.md",
    "predefined-chart-risk-distribution.md", "predefined-chart-sankey.md",
    "predefined-chart-scatter.md", "predefined-chart-sparkline.md",
    "predefined-chart-summary-chart-widget.md", "predefined-chart-tangential-polar.md",
    "predefined-chart-waterfall.md", "predefined_charts.md", "rpt-chart-floater.md",
    "sidemenu_variant1_settings.md", "sidemenu_variant2_reports.md", "stat_card.md",
    "tile_widgets.md", "topnavbar.md", "widget.md",
];
async function handleSearchWiki(args) {
    const query = args.query.toLowerCase();
    const maxResults = args.max_results || 20;
    const results = [];
    for (const file of WIKI_FILES) {
        const content = await readWikiFile(file);
        if (content.startsWith("["))
            continue;
        const lines = content.split("\n");
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].toLowerCase().includes(query)) {
                const context = [
                    lines[i - 1]?.trim() ? `  ${lines[i - 1].trim()}` : null,
                    `→ ${lines[i].trim()}`,
                    lines[i + 1]?.trim() ? `  ${lines[i + 1].trim()}` : null,
                ].filter(Boolean).join("\n");
                results.push(`**${file}** line ${i + 1}:\n${context}`);
                if (results.length >= maxResults)
                    break;
            }
        }
        if (results.length >= maxResults)
            break;
    }
    if (results.length === 0)
        return `No results found for: "${args.query}"`;
    return `Found ${results.length} result(s) for "${args.query}":\n\n${results.join("\n\n---\n\n")}`;
}
const ALL_ICONS = [
    "gauge-center.svg", "icon-ab-arrow-left.svg", "icon-ab-arrow-right.svg", "icon-ab-column-new.svg",
    "icon-ab-column.svg", "icon-ab-delete.svg", "icon-ab-disable.svg", "icon-ab-enable.svg",
    "icon-ab-more.svg", "icon-ab-plus.svg", "icon-ab-search.svg", "icon-ab-table-view.svg",
    "icon-ab-toggle-view.svg", "icon-action-approve.svg", "icon-action-delete.svg", "icon-action-edit.svg",
    "icon-action-more.svg", "icon-actionbar-filter.svg", "icon-actionbar-refresh.svg",
    "icon-actionbar-search.svg", "icon-admin-settings.svg", "icon-agent.svg",
    "icon-alert-avatar-small.svg", "icon-alert-bell.svg", "icon-alert-calendar.svg",
    "icon-alert-clock.svg", "icon-alert-critical.svg", "icon-alert-hourglass.svg", "icon-alert-info.svg",
    "icon-alert-schedule.svg", "icon-alert-success.svg", "icon-alert-warning.svg",
    "icon-analysis-bell.svg", "icon-analysis-sev-orange.svg", "icon-analysis-sev-yellow.svg",
    "icon-analysis-sort.svg", "icon-approve.svg", "icon-apps-grid.svg", "icon-avatar-person.svg",
    "icon-avatar-unassigned.svg", "icon-back-arrow.svg", "icon-back-button.svg",
    "icon-badge-high-risk.svg", "icon-bot.svg", "icon-btn-chevron-right-dark.svg",
    "icon-btn-chevron-right.svg", "icon-btn-help-dark.svg", "icon-btn-help.svg",
    "icon-btn-plus-dark.svg", "icon-btn-plus.svg", "icon-bulb.svg", "icon-calendar-input.svg",
    "icon-calendar.svg", "icon-checkbox-checked.svg", "icon-checkbox-indeterminate.svg",
    "icon-checkbox.svg", "icon-chevron-down.svg", "icon-chevron-left.svg", "icon-chevron-right.svg",
    "icon-close.svg", "icon-dd-calendar.svg", "icon-dd-settings.svg", "icon-delete.svg",
    "icon-dropdown-chevron.svg", "icon-edit.svg", "icon-endpoint.svg", "icon-export-history.svg",
    "icon-eye-hide.svg", "icon-eye-show.svg", "icon-filter.svg", "icon-gauge-arc.svg",
    "icon-gauge-pointer.svg", "icon-grip-vertical.svg", "icon-help-circle.svg", "icon-help.svg",
    "icon-inc-created-by.svg", "icon-inc-severity-critical.svg", "icon-inc-sla-clock.svg",
    "icon-inc-sort.svg", "icon-incident.svg", "icon-info.svg", "icon-input-calendar.svg",
    "icon-input-filter.svg", "icon-input-plus.svg", "icon-iw-arrow-down.svg", "icon-iw-close.svg",
    "icon-iw-export.svg", "icon-iw-minimize.svg", "icon-iw-plus.svg", "icon-iw-workbench.svg",
    "icon-layout-template.svg", "icon-linetab-settings.svg", "icon-menu.svg", "icon-metric-clock.svg",
    "icon-metric-trend-up.svg", "icon-more.svg", "icon-notif-close.svg", "icon-notif-error.svg",
    "icon-notif-info.svg", "icon-notif-success.svg", "icon-notif-warning.svg", "icon-notification.svg",
    "icon-number-down.svg", "icon-number-up.svg", "icon-os-linux.svg", "icon-os-windows.svg",
    "icon-pin-attention.svg", "icon-pin-critical.svg", "icon-pin-trouble.svg", "icon-plus.svg",
    "icon-ql-arrow.svg", "icon-question.svg", "icon-radio-checked.svg", "icon-radio-unchecked.svg",
    "icon-refresh.svg", "icon-report-help.svg", "icon-report-settings.svg", "icon-rpt-edit.svg",
    "icon-rpt-export.svg", "icon-rpt-more.svg", "icon-rpt-schedule.svg", "icon-search-close.svg",
    "icon-search-settings.svg", "icon-search.svg", "icon-security.svg", "icon-share.svg",
    "icon-sidemenu-settings.svg", "icon-simple-filter.svg", "icon-slider-close.svg", "icon-sm-bulb.svg",
    "icon-sm-chevron-down.svg", "icon-sm-chevron-right.svg", "icon-sm-clock.svg", "icon-sm-collapse.svg",
    "icon-sm-manage.svg", "icon-status-disabled.svg", "icon-status-info-high.svg",
    "icon-status-info-low.svg", "icon-status-info-medium.svg", "icon-status-not-started.svg",
    "icon-status-on-hold.svg", "icon-status-partial-success.svg", "icon-status-partial.svg",
    "icon-status-skipped.svg", "icon-status-stopped.svg", "icon-status-success.svg",
    "icon-status-waiting.svg", "icon-status-warning.svg", "icon-summary-bell.svg",
    "icon-system-settings.svg", "icon-t2-ata.svg", "icon-t2-avatar-unassigned.svg", "icon-t2-avatar.svg",
    "icon-t2-calendar.svg", "icon-t2-playbook.svg", "icon-t2-rem-executing.svg",
    "icon-t2-rem-failed.svg", "icon-t2-rem-success.svg", "icon-t2-severity-critical.svg",
    "icon-t2-severity-medium.svg", "icon-t2-thumbsup.svg", "icon-t2-zia.svg",
    "icon-tab-ad-overview.svg", "icon-tab-add-custom.svg", "icon-tab-anomaly-trends.svg",
    "icon-tab-apache-overview.svg", "icon-tab-aws-overview.svg", "icon-tab-cloud-protection.svg",
    "icon-tab-entities.svg", "icon-tab-event-overview.svg", "icon-tab-microsoft-365.svg",
    "icon-tab-microsoft-dynamics.svg", "icon-tab-network-overview.svg", "icon-tab-pgsql-overview.svg",
    "icon-tab-salesforce-overview.svg", "icon-tab-sql-server-overview-2.svg",
    "icon-tab-sql-server-overview.svg", "icon-tag-close.svg", "icon-tile-muted.svg",
    "icon-tile-sev-attention.svg", "icon-tile-sev-critical.svg", "icon-tile-sev-trouble.svg",
    "icon-tile-trend-down.svg", "icon-tile-trend-up.svg", "icon-tile-zia.svg",
    "icon-troubleshoot.svg", "icon-upload.svg", "icon-user-avatar.svg", "icon-view-type.svg",
    "icon-widget-maximize.svg", "icon-widget-notification.svg", "icon-widget-schedule.svg",
    "icon-widget-sort.svg", "icon-zia.svg", "logo-log360.svg",
];
function handleGetIcons(args) {
    let icons = ALL_ICONS;
    if (args.filter) {
        const f = args.filter.toLowerCase();
        icons = icons.filter(i => i.toLowerCase().includes(f));
    }
    if (icons.length === 0)
        return `No icons found matching: "${args.filter}"`;
    const withCdn = icons.map(i => `${i}  →  ${CDN_BASE}/assets/icons/${i}`);
    return `${icons.length} icon(s):\n\n${withCdn.join("\n")}`;
}
async function handleGetFullWikiFile(args) {
    return readWikiFile(args.filename);
}
function handleGetAntiPatterns() {
    return ANTI_PATTERNS;
}
function handleSetupProject(args) {
    const name = args.feature_name.replace(/[^a-zA-Z0-9_-]/g, "-").toLowerCase();
    return SETUP_PROJECT.replace(/your-feature-name/g, name)
        .replace(/\$FEATURE/g, name);
}
async function handleGetTopnavbar() {
    const entry = COMPONENT_MAP["topnavbar"];
    if (!entry)
        return "TopNavBar not found in component map";
    const content = await readWikiFile(entry.file);
    let html = extractHtmlBlock(content, entry.section);
    html = html.replace(/src="assets\//g, `src="${CDN_BASE}/assets/`);
    return `## TopNavBar — Complete HTML\n\nSource: ${entry.file}\n\nCDN Base: ${CDN_BASE}\n\n⚠️ IMPORTANT: All <img> src paths use CDN URLs.\nLogo: \`${CDN_BASE}/assets/icons/logo-log360.svg\`\nIcons: \`${CDN_BASE}/assets/icons/icon-*.svg\`\nNEVER replace these with inline <svg>.\n\n\`\`\`html\n${html}\n\`\`\``;
}
/* ══════════════════════════════════════════════════════
   MCP SERVER SETUP
══════════════════════════════════════════════════════ */
const server = new Server({ name: "elegant-agent-mcp", version: "1.0.0" }, { capabilities: { tools: {} } });
server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    try {
        let text = "";
        switch (name) {
            case "get_component":
                text = await handleGetComponent(args);
                break;
            case "get_recipe":
                text = handleGetRecipe(args);
                break;
            case "get_shell":
                text = handleGetShell(args);
                break;
            case "get_chart_snippet":
                text = handleGetChartSnippet(args);
                break;
            case "get_checklist":
                text = handleGetChecklist(args);
                break;
            case "get_anti_patterns":
                text = handleGetAntiPatterns();
                break;
            case "list_components":
                text = handleListComponents();
                break;
            case "search_wiki":
                text = await handleSearchWiki(args);
                break;
            case "get_icons":
                text = handleGetIcons(args);
                break;
            case "get_full_wiki_file":
                text = await handleGetFullWikiFile(args);
                break;
            case "setup_project":
                text = handleSetupProject(args);
                break;
            case "get_topnavbar":
                text = await handleGetTopnavbar();
                break;
            default: text = `Unknown tool: ${name}`;
        }
        return { content: [{ type: "text", text }] };
    }
    catch (err) {
        return {
            content: [{ type: "text", text: `Error: ${err instanceof Error ? err.message : String(err)}` }],
            isError: true,
        };
    }
});
/* ── Start ── */
const transport = new StdioServerTransport();
await server.connect(transport);
console.error("elegant-agent-mcp running on stdio");
