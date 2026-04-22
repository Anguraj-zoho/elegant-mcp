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
            <button class="actionbar__icon-btn" title="Search"><img src="${CDN_BASE}/assets/icons/icon-ab-search.svg" alt="" style="width:14px;height:14px;" /></button>
            <div class="actionbar__separator"></div>
            <button class="actionbar__btn-report" onclick="ElegantDrawer&&ElegantDrawer.open('incidentWorkbenchDrawer')">
              <img src="${CDN_BASE}/assets/icons/icon-ab-plus.svg" alt="" /><span>Incident</span>
            </button>
          </div>
          <div class="actionbar__right">
            <span class="actionbar__pagination">1-50 <i>of</i> <b><!-- TOTAL --></b></span>
            <button class="actionbar__nav-btn"><img src="${CDN_BASE}/assets/icons/icon-ab-arrow-left.svg" alt="" /></button>
            <button class="actionbar__nav-btn"><img src="${CDN_BASE}/assets/icons/icon-ab-arrow-right.svg" alt="" /></button>
            <div class="actionbar__separator"></div>
            <button class="actionbar__icon-btn" onclick="ElegantDrawer&&ElegantDrawer.open('selectColumnsDrawer')"><img src="${CDN_BASE}/assets/icons/icon-ab-column.svg" alt="" style="width:14px;height:14px;" /></button>
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
              <th class="cell-checkbox" data-checked="unchecked"><img src="${CDN_BASE}/assets/icons/icon-checkbox.svg" alt="" style="width:14px;height:14px;" /></th>
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
    "classic-tab": { file: "classic_tab.md", section: "Variant 1: Classic Tab (Single Variant)" },
    "line-tab": { file: "line_tab.md", section: "Variant 1: Default (Plain Text, h=40)" },
    "line-tab-quicklink": { file: "line_tab.md", section: "Variant 3: QuickLink (pill tabs, h=32)" },
    "actionbar-type1": { file: "actionbar.md", section: "Type 1 — Search + Pagination (Minimal)" },
    "actionbar-type2": { file: "actionbar.md", section: "Type 2 — Search + Bulk Actions (Enable/Disable/Delete/More) + Pagination" },
    "actionbar-type8": { file: "actionbar.md", section: "Type 8 — Report ActionBar: Search + Incident Button + Pagination + Column View" },
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
    "form-dropdown": { file: "form_dropdown.md", section: "Type 1: Basic Dropdown (plain text items)" },
    "widget": { file: "widget.md", section: "Dashboard Container" },
    "stat-card": { file: "stat_card.md", section: "Grid Wrapper + All 10 Types" },
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
                chart_type: {
                    type: "string",
                    enum: ["line", "area", "bar", "hbar", "donut", "stacked"],
                },
            },
            required: ["chart_type"],
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
    {
        name: "get_page_blueprint",
        description: "Returns a detailed visual blueprint of a real Log360 Cloud page — exact layout, component hierarchy, column names, data patterns, chart config, and sidemenu structure. ALWAYS call this before building any page to understand the correct structure.",
        inputSchema: {
            type: "object",
            properties: {
                page: {
                    type: "string",
                    description: "Page name to get the blueprint for.",
                    enum: [
                        "reports-windows-all-events",
                        "reports-windows-startup",
                        "reports-unix-all-events",
                        "dashboard",
                        "dashboard-network",
                        "alerts",
                        "alerts-manage-profiles",
                        "compliance",
                        "compliance-report",
                        "search",
                        "security",
                        "cloud-protection",
                        "settings",
                        "settings-license",
                        "incident-workbench",
                    ],
                },
            },
            required: ["page"],
        },
    },
    {
        name: "get_screenshot",
        description: "Searches 217 real Log360 Cloud product screenshots by keywords. Returns matching image URLs you can view to understand exact layout, colors, spacing, and data patterns. ALWAYS use this to see what a page really looks like before building it.",
        inputSchema: {
            type: "object",
            properties: {
                query: {
                    type: "string",
                    description: "Search keywords (e.g. 'windows startup', 'alerts main', 'dashboard events', 'settings device'). Searches screenshot filenames.",
                },
                max_results: {
                    type: "number",
                    description: "Max results (default 5)",
                },
            },
            required: ["query"],
        },
    },
];
/* ══════════════════════════════════════════════════════
   SCREENSHOT INDEX — 217 real product screenshots
══════════════════════════════════════════════════════ */
const SCREENSHOTS = [
    "ALERTS TAB/[Interaction] Alerts - Add Alert Profile Form with Name Criteria Severity Message Format.png",
    "ALERTS TAB/[Interaction] Alerts - Add Alert Profile Form with Notification Settings Email Config.png",
    "ALERTS TAB/[Interaction] Alerts - Alert Detail Drawer EXE Process Executed with MITRE and Ticket Status.png",
    "ALERTS TAB/[Interaction] Alerts - Create View Modal with Severity Equals Critical Filter Criteria.png",
    "ALERTS TAB/[Interaction] Alerts - Select Columns Modal with Available and Selected Column Lists.png",
    "ALERTS TAB/[Interaction] Alerts - Settings Gear Dropdown with Ticketing Tool Integration Option.png",
    "ALERTS TAB/[Interaction] Alerts - Ticketing Tool Integration Form ServiceDesk Plus with Client ID.png",
    "ALERTS TAB/[Interaction] Alerts - Ticketing Tool Macros Dropdown Source EventID LogSource Severity.png",
    "ALERTS TAB/[Interaction] Alerts - View Filter Dropdown with All Critical Trouble Attention Options.png",
    "ALERTS TAB/[Main] Alerts - Investigation Mitigation Actions Affected Entities Future Risks.png",
    "ALERTS TAB/[Main] Alerts - Investigation Panel with Insights Summary Timeline MITRE Mapping.png",
    "ALERTS TAB/[Main] Alerts - Investigation Result Attack Chain with Affected Entities and Events.png",
    "ALERTS TAB/[Main] Alerts - Main View Severity Stat Cards Table with Critical Trouble Attention Counts.png",
    "ALERTS TAB/[Main] Alerts - Manage Profiles Table with Alert Types Severity Log Source Actions.png",
    "CLOUD PROTECTION TAB/[Main] Cloud Protection - Application Insight Dashboard Traffic Trend Shadow Apps Banned Apps Charts.png",
    "CLOUD PROTECTION TAB/[Main] Cloud Protection - User Insight Dashboard Actors Trend Shadow Banned Apps Download Upload Size.png",
    "COMPLIANCE TAB/[Interaction] Compliance - Create New Compliance Form Source Domain Report Groups.png",
    "COMPLIANCE TAB/[Interaction] Compliance - Edit HIPAA Configuration Form Source Domain Reports.png",
    "COMPLIANCE TAB/[Interaction] Compliance - Edit PCI-DSS Configuration Form Source Domain Reports.png",
    "COMPLIANCE TAB/[Interaction] Compliance - HIPAA Custom View Edit Mode Checkbox Tabs Save Cancel.png",
    "COMPLIANCE TAB/[Interaction] Compliance - HIPAA Custom View Edit Mode Duplicate.png",
    "COMPLIANCE TAB/[Interaction] Compliance - HIPAA Export As Modal Report Scope PDF Format.png",
    "COMPLIANCE TAB/[Interaction] Compliance - HIPAA Export History Panel Previous Records.png",
    "COMPLIANCE TAB/[Interaction] Compliance - HIPAA Overview Settings Dropdown Customize Manage.png",
    "COMPLIANCE TAB/[Interaction] Compliance - Landing Page Edit Mode Pencil Checkmark PCI-DSS Card.png",
    "COMPLIANCE TAB/[Interaction] Compliance - Landing Page View Reports Button PCI-DSS Highlight.png",
    "COMPLIANCE TAB/[Main] Compliance - HIPAA Overview AD Tab with Sidemenu and Line Tab Switcher.png",
    "COMPLIANCE TAB/[Main] Compliance - Landing Page Grid Row 1 PCI-DSS HIPAA FISMA GDPR SOX ISO27001.png",
    "COMPLIANCE TAB/[Main] Compliance - Landing Page Grid Row 2 PDPA NERC NRC CMMC POPIA SAMA.png",
    "COMPLIANCE TAB/[Main] Compliance - Landing Page Grid Row 3 CJIN SOC2 QCF TISAX ECC PDPL.png",
    "COMPLIANCE TAB/[Main] Compliance - Manage Compliance Table with Show Hide Toggles and Actions.png",
    "COMPLIANCE TAB/[Main] Compliance - PCI-DSS All Audit Reports List Logon Logoff Policy Device.png",
    "COMPLIANCE TAB/[Main] Compliance - PCI-DSS Audit Reports Continued Policy Account Firewall Threat.png",
    "COMPLIANCE TAB/[Main] Compliance - PCI-DSS Audit Reports List Full View.png",
    "COMPLIANCE TAB/[Main] Compliance - PCI-DSS Overview AD Tab Classic Tabs Empty State.png",
    "COMPLIANCE TAB/[Main] Compliance - PCI-DSS Overview Unix Tab Pie Bar Charts Logon FTP Threats.png",
    "COMPLIANCE TAB/[Main] Compliance - PCI-DSS Overview Windows Tab Pie Bar Charts Logon Policy Events.png",
    "COMPLIANCE TAB/[Main] Compliance - PCI-DSS User Logons Report Bar Chart Sidemenu Table.png",
    "DASHBOARD TAB/[Interaction] Custom Tab 1 - Dropdown Menu Showing Available Custom Views.png",
    "DASHBOARD TAB/[Interaction] Log Sources - Applications Tab Manage Tooltip.png",
    "DASHBOARD TAB/[Interaction] Log Sources - Devices Tab Export Dropdown (PDF CSV).png",
    "DASHBOARD TAB/[Interaction] Log Sources - Devices Tab Export History Panel.png",
    "DASHBOARD TAB/[Interaction] Log Sources - Devices Tab Manage Devices Tooltip.png",
    "DASHBOARD TAB/[Main] AD Overview - Logon Failure and Account Management.png",
    "DASHBOARD TAB/[Main] AD Summary - Logon Activity User Group GPO Management.png",
    "DASHBOARD TAB/[Main] AWS Overview - Resources and Security Events.png",
    "DASHBOARD TAB/[Main] Anomaly Trends - Recent Anomalies Risk Levels and Detection Stats.png",
    "DASHBOARD TAB/[Main] Cloud Protection - Network Traffic Shadow Apps and Categories.png",
    "DASHBOARD TAB/[Main] Custom Tab 1 - GPO Management and Top Network Devices.png",
    "DASHBOARD TAB/[Main] Detection Overview - Detection Pipeline Tactics and Top Rules.png",
    "DASHBOARD TAB/[Main] Entities - Entity Risk Score Distribution and Watchlisted.png",
    "DASHBOARD TAB/[Main] Events Overview - Main Dashboard with Log Trend and Severity Charts.png",
    "DASHBOARD TAB/[Main] File Monitoring - File Activity Trend and Folder Changes.png",
    "DASHBOARD TAB/[Main] Incident Overview - Incidents MTTR and Recent Incidents.png",
    "DASHBOARD TAB/[Main] Log Sources - Applications Tab with Log Source Types.png",
    "DASHBOARD TAB/[Main] Log Sources - Cloud Sources Tab with Data Fetch Status.png",
    "DASHBOARD TAB/[Main] Log Sources - Devices Tab with Agent Status Table.png",
    "DASHBOARD TAB/[Main] Log Sources - File Integrity Monitoring Tab with Device Status.png",
    "DASHBOARD TAB/[Main] Log Sources - Gateway Clusters Tab with Status.png",
    "DASHBOARD TAB/[Main] Microsoft 365 - M365 Logs and Exchange Admin Activity.png",
    "DASHBOARD TAB/[Main] Network Overview - Traffic Trend and Top Network Devices.png",
    "DASHBOARD TAB/[Main] PostgreSQL Overview - Security Events DML DDL Tables.png",
    "DASHBOARD TAB/[Main] SQL Server Overview - Read Write Security Events.png",
    "DASHBOARD TAB/[Main] Salesforce Overview - Events Top Users and Failed Logins.png",
    "DASHBOARD TAB/[Main] Threat Analytics - Breach Events Dark Web Summary (Active Data).png",
    "DASHBOARD TAB/[Main] Threat Analytics - Breach Trends Dark Web and Botnet.png",
    "DASHBOARD TAB/[Main] Users - User Risk Score Distribution and Watchlisted.png",
    "Incident workbench right bottom componet flow sequence_/[Interaction] Incident Workbench - IP Threat Intel Panel Reputation Score Trends Category Recommendation.png",
    "Incident workbench right bottom componet flow sequence_/[Interaction] Incident Workbench - Process Hunting Flow General Tab Tree View Parent Process Timeline.png",
    "Incident workbench right bottom componet flow sequence_/[Interaction] Incident Workbench - User Activity Overview Account Management Device Software Process Audit.png",
    "LOG ME TAB/[Main] LogMe - Supported Log Sources Grid All Categories Windows Network Cloud Database Security Icons.png",
    "REPORTS TAB/[Interaction] Reports - Active Directory - TopNav Dropdown.png",
    "REPORTS TAB/[Interaction] Reports - Applications - TopNav Dropdown Cloud Apps Zoho.png",
    "REPORTS TAB/[Interaction] Reports - Applications - TopNav Dropdown Log Source Types Grid.png",
    "REPORTS TAB/[Interaction] Reports - Cloud Sources - TopNav Dropdown AWS Salesforce.png",
    "REPORTS TAB/[Interaction] Reports - Custom Reports - TopNav Dropdown Identity Sources.png",
    "REPORTS TAB/[Interaction] Reports - File Integrity Monitoring - TopNav Dropdown.png",
    "REPORTS TAB/[Interaction] Reports - Microsoft 365 - TopNav Dropdown Services List.png",
    "REPORTS TAB/[Interaction] Reports - Network Devices - TopNav Dropdown Vendor List.png",
    "REPORTS TAB/[Interaction] Reports - Servers & Workstation - TopNav Dropdown Windows Unix.png",
    "REPORTS TAB/[Interaction] Reports - Servers & Workstation - Windows - Add to Incident Dropdown Create Options.png",
    "REPORTS TAB/[Interaction] Reports - Servers & Workstation - Windows - All Events Filter Tag Clear Interaction.png",
    "REPORTS TAB/[Interaction] Reports - Servers & Workstation - Windows - All Events Manage Custom Views Button.png",
    "REPORTS TAB/[Interaction] Reports - Servers & Workstation - Windows - Available Schedule Modal Schedule List.png",
    "REPORTS TAB/[Interaction] Reports - Servers & Workstation - Windows - Create Filter Modal Log Source Criteria.png",
    "REPORTS TAB/[Interaction] Reports - Servers & Workstation - Windows - Customize View Modal Sorting Limits Tab.png",
    "REPORTS TAB/[Interaction] Reports - Servers & Workstation - Windows - Customize View Modal Widget Chart Type.png",
    "REPORTS TAB/[Interaction] Reports - Servers & Workstation - Windows - Export As Dropdown PDF CSV XLSX HTML.png",
    "REPORTS TAB/[Interaction] Reports - Servers & Workstation - Windows - Export History Panel Download Links.png",
    "REPORTS TAB/[Interaction] Reports - Servers & Workstation - Windows - More Menu Pin to Dashboard Annotation.png",
    "REPORTS TAB/[Interaction] Reports - Servers & Workstation - Windows - Pin to Dashboard Modal Widget Config.png",
    "REPORTS TAB/[Interaction] Reports - Servers & Workstation - Windows - Select Columns Modal Dialog.png",
    "REPORTS TAB/[Interaction] Reports - Servers & Workstation - Windows - Select Log Source Modal Device Tree.png",
    "REPORTS TAB/[Interaction] Reports - Servers & Workstation - Windows - Table Add Remove Columns Button.png",
    "REPORTS TAB/[Interaction] Reports - Servers & Workstation - Windows - Table Pagination Rows Per Page Dropdown.png",
    "REPORTS TAB/[Interaction] Reports - Threats - TopNav Dropdown Security Sources.png",
    "REPORTS TAB/[Interaction] Reports - VM Management - TopNav Dropdown ESXi HyperV.png",
    "REPORTS TAB/[Main] Reports - Servers & Workstation - Unix - All Events Line Chart Severity Table.png",
    "REPORTS TAB/[Main] Reports - Servers & Workstation - Unix - All Events Overview Sidemenu.png",
    "REPORTS TAB/[Main] Reports - Servers & Workstation - Unix - Important Events Summary Table.png",
    "REPORTS TAB/[Main] Reports - Servers & Workstation - Unix - SU Logons Top Devices Bar Chart Table.png",
    "REPORTS TAB/[Main] Reports - Servers & Workstation - Unix - Top Logons by Users Line Chart Percentage Table.png",
    "REPORTS TAB/[Main] Reports - Servers & Workstation - Unix - User Logons Empty State No Data.png",
    "REPORTS TAB/[Main] Reports - Servers & Workstation - Windows - All Events Default Baseline State.png",
    "REPORTS TAB/[Main] Reports - Servers & Workstation - Windows - All Events List View Checkboxes Full Sidemenu.png",
    "REPORTS TAB/[Main] Reports - Servers & Workstation - Windows - All Events List View Inline Fields.png",
    "REPORTS TAB/[Main] Reports - Servers & Workstation - Windows - All Events Table View with Line Chart.png",
    "REPORTS TAB/[Main] Reports - Servers & Workstation - Windows - Sidemenu All Events Overview.png",
    "REPORTS TAB/[Main] Reports - Servers & Workstation - Windows - Sidemenu Application Crashes Expanded.png",
    "REPORTS TAB/[Main] Reports - Servers & Workstation - Windows - Sidemenu Application Whitelisting Expanded.png",
    "REPORTS TAB/[Main] Reports - Servers & Workstation - Windows - Sidemenu Backup and Restore Expanded.png",
    "REPORTS TAB/[Main] Reports - Servers & Workstation - Windows - Sidemenu DNS Server Expanded Alt.png",
    "REPORTS TAB/[Main] Reports - Servers & Workstation - Windows - Sidemenu DNS Server Expanded.png",
    "REPORTS TAB/[Main] Reports - Servers & Workstation - Windows - Sidemenu Device Severity Reports Expanded.png",
    "REPORTS TAB/[Main] Reports - Servers & Workstation - Windows - Sidemenu Eventlog Reports Expanded.png",
    "REPORTS TAB/[Main] Reports - Servers & Workstation - Windows - Sidemenu Failed Logon Reports Expanded.png",
    "REPORTS TAB/[Main] Reports - Servers & Workstation - Windows - Sidemenu Firewall Auditing Expanded.png",
    "REPORTS TAB/[Main] Reports - Servers & Workstation - Windows - Sidemenu Group Management Expanded.png",
    "REPORTS TAB/[Main] Reports - Servers & Workstation - Windows - Sidemenu Important Events Expanded.png",
    "REPORTS TAB/[Main] Reports - Servers & Workstation - Windows - Sidemenu Local Account Management Expanded.png",
    "REPORTS TAB/[Main] Reports - Servers & Workstation - Windows - Sidemenu Logoff Reports Expanded.png",
    "REPORTS TAB/[Main] Reports - Servers & Workstation - Windows - Sidemenu Logon Reports Expanded.png",
    "REPORTS TAB/[Main] Reports - Servers & Workstation - Windows - Sidemenu Network Policy Server Expanded.png",
    "REPORTS TAB/[Main] Reports - Servers & Workstation - Windows - Sidemenu Network Share Auditing Expanded.png",
    "REPORTS TAB/[Main] Reports - Servers & Workstation - Windows - Sidemenu Policy Changes Expanded.png",
    "REPORTS TAB/[Main] Reports - Servers & Workstation - Windows - Sidemenu Powershell Auditing Expanded.png",
    "REPORTS TAB/[Main] Reports - Servers & Workstation - Windows - Sidemenu Process Tracking Expanded.png",
    "REPORTS TAB/[Main] Reports - Servers & Workstation - Windows - Sidemenu Program Inventory Expanded.png",
    "REPORTS TAB/[Main] Reports - Servers & Workstation - Windows - Sidemenu Registry Changes Expanded.png",
    "REPORTS TAB/[Main] Reports - Servers & Workstation - Windows - Sidemenu Service Audit Expanded.png",
    "REPORTS TAB/[Main] Reports - Servers & Workstation - Windows - Sidemenu Startup Events Expanded.png",
    "REPORTS TAB/[Main] Reports - Servers & Workstation - Windows - Sidemenu System Events Expanded.png",
    "REPORTS TAB/[Main] Reports - Servers & Workstation - Windows - Sidemenu Threat Detection Antivirus Expanded.png",
    "REPORTS TAB/[Main] Reports - Servers & Workstation - Windows - Sidemenu Threat Detection Expanded.png",
    "REPORTS TAB/[Main] Reports - Servers & Workstation - Windows - Sidemenu USB Storage Auditing Expanded.png",
    "REPORTS TAB/[Main] Reports - Servers & Workstation - Windows - Sidemenu Wireless Network Reports Expanded.png",
    "SEARCH TAB/[Interaction] Search - Criteria Modal Severity Equals Emergency Filter Builder.png",
    "SEARCH TAB/[Interaction] Search - Log Types Dropdown All Windows Unix Cisco Device.png",
    "SEARCH TAB/[Interaction] Search - More Menu Dropdown with Saved Search Option.png",
    "SEARCH TAB/[Interaction] Search - Save As Dropdown Save Search Save as Alert Save as Rule.png",
    "SEARCH TAB/[Interaction] Search - Select Log Source Modal Group Tree with Device Checkboxes.png",
    "SEARCH TAB/[Main] Search - Landing Page Basic Advanced Query Box with Help Card.png",
    "SEARCH TAB/[Main] Search - Results Page Bar Chart Severity Emergency Log List View.png",
    "SEARCH TAB/[Main] Search - Results Page with Add to Incident and Extract Fields Toolbar.png",
    "SUPPORT TAB/[Main] Support - Get in Touch Cards Request Live Chat Store Contact Forum Posts Announcements.png",
    "Security TAB/[Interaction] Security - Create Rule Dropdown Standard Anomaly Advanced Options.png",
    "Security TAB/[Interaction] Security - Create Schedule Form Frequency Time Range Format Rule.png",
    "Security TAB/[Interaction] Security - Manage Rules Dropdown Import Export Enable Disable Update.png",
    "Security TAB/[Interaction] Security - Manage Rules Filter Dropdown State Label New Deprecated.png",
    "Security TAB/[Interaction] Security - Rule Library Installed Rules Label Filter All New Deprecated.png",
    "Security TAB/[Interaction] Security - Rule Library Settings Auto Install Rules Severity Popup.png",
    "Security TAB/[Main] Security - Analytics Dashboard Detection Pipeline MITRE Tactics Trends.png",
    "Security TAB/[Main] Security - Manage Rules Table with MITRE Mapping Severity Tags Profiles.png",
    "Security TAB/[Main] Security - Rule Library Installed Rules Tab with MITRE Mapping Table.png",
    "Security TAB/[Main] Security - Rule Library Sidemenu All Vendors Available Rules Tab.png",
    "Security TAB/[Main] Security - Scheduled Detection Reports Empty State No Schedule.png",
    "Settings TAB/[Interaction] Settings - Account Management Configure Domains Table Audit Sync.png",
    "Settings TAB/[Interaction] Settings - Add Storage Tier Form Log Types Sources Retention.png",
    "Settings TAB/[Interaction] Settings - Agent Administration Access Key Modal Regenerate.png",
    "Settings TAB/[Interaction] Settings - Agent Administration Download Agent Modal Prerequisites.png",
    "Settings TAB/[Interaction] Settings - Agent Settings Offline Collection Toggle Max Size Form.png",
    "Settings TAB/[Interaction] Settings - Device Management Add Device Modal ESXi Log Source Form.png",
    "Settings TAB/[Interaction] Settings - Device Management Syslog Devices Refresh IP Tooltip.png",
    "Settings TAB/[Interaction] Settings - Device Management Windows Devices Category Filter Dropdown.png",
    "Settings TAB/[Interaction] Settings - Device Management Windows Devices Monitor Interval Toolbar.png",
    "Settings TAB/[Interaction] Settings - File Integrity Monitoring Add FIM Form Log Source Agent.png",
    "Settings TAB/[Interaction] Settings - File Integrity Monitoring Templates Form Name Locations.png",
    "Settings TAB/[Interaction] Settings - Log Forwarding Architecture Diagram to Amazon S3.png",
    "Settings TAB/[Interaction] Settings - Notification Template Preview Modal Schedule Export Email.png",
    "Settings TAB/[Interaction] Settings - Zia Configuration Confirm Switch Service Modal.png",
    "Settings TAB/[Main] Settings - Agent Administration Windows Tab Agents Table Status.png",
    "Settings TAB/[Main] Settings - Banned Cloud Applications Table Name IP Category Reputation.png",
    "Settings TAB/[Main] Settings - Certificate Authorities Table Expiry Cluster List.png",
    "Settings TAB/[Main] Settings - Cloud Sources Microsoft 365 Tab Tenant Data Source Table.png",
    "Settings TAB/[Main] Settings - Custom Log Format Table Format Names Types Parser Rules.png",
    "Settings TAB/[Main] Settings - Custom Widgets Table Names Types Sources Details.png",
    "Settings TAB/[Main] Settings - Device Management Other Devices Table IP Agent Status.png",
    "Settings TAB/[Main] Settings - Device Management Syslog Devices Table Auto Log Forward.png",
    "Settings TAB/[Main] Settings - Device Management Windows Devices Table IP Agent Status.png",
    "Settings TAB/[Main] Settings - Extension Profiles Table Download Links Share Steps.png",
    "Settings TAB/[Main] Settings - File Integrity Monitoring Windows Tab Device Agent Table.png",
    "Settings TAB/[Main] Settings - Gateway Configuration Cluster Details Server Table.png",
    "Settings TAB/[Main] Settings - Import Log Files Table File Name Format Status Report.png",
    "Settings TAB/[Main] Settings - License Page Storage Stats Feature Table Usage Bars.png",
    "Settings TAB/[Main] Settings - Listener Ports Table Port Protocol Agent Counts.png",
    "Settings TAB/[Main] Settings - Log Collection Filters Table Filter Names Devices.png",
    "Settings TAB/[Main] Settings - Log Source Groups Table Description Source Counts.png",
    "Settings TAB/[Main] Settings - MarketPlace Installed Extensions Table Config Status.png",
    "Settings TAB/[Main] Settings - My Account Profile Settings Organization Info.png",
    "Settings TAB/[Main] Settings - Notification Settings Table Email SMS Enabled Status.png",
    "Settings TAB/[Main] Settings - Privacy Settings GDPR Consent and Password Protection.png",
    "Settings TAB/[Main] Settings - Product Settings General and Notifications Form Fields.png",
    "Settings TAB/[Main] Settings - Sanctioned Cloud Applications Table IP Category Reputation.png",
    "Settings TAB/[Main] Settings - Storage Tiers Bar Chart Archival Search Table.png",
    "Settings TAB/[Main] Settings - Storage Tiers Bar Chart Table Full Sidemenu Expanded.png",
    "Settings TAB/[Main] Settings - Tags Table Tag Names Criteria Search Logs Tooltip.png",
    "Settings TAB/[Main] Settings - Technician Audit Log Table Module Operation Status.png",
    "Settings TAB/[Main] Settings - Threat Management Default Threat Server Tab.png",
    "Settings TAB/[Main] Settings - User Management Table Username Email Access Levels.png",
    "Settings TAB/[Main] Settings - Working Hour Settings Form Day Selector Hour Range.png",
    "Settings TAB/[Main] Settings - Zia AI Configuration Azure OpenAI and OpenAI Cards.png",
    "TOP BLOCKED COUNTRIES/[Main] Top Blocked Countries - Firewall Bar Chart with Country Request Count Table.png",
];
const SCREENSHOT_BASE = `https://raw.githubusercontent.com/${PRIVATE_REPO}/main/data/LOG360%20Cloud%20Full%20Product%20Bulk%20Screenshot_`;
function handleGetScreenshot(args) {
    const keywords = args.query.toLowerCase().split(/[\s,]+/).filter(Boolean);
    const max = args.max_results || 5;
    const scored = SCREENSHOTS.map(s => {
        const lower = s.toLowerCase();
        let score = 0;
        for (const kw of keywords) {
            if (lower.includes(kw))
                score++;
        }
        return { path: s, score };
    }).filter(r => r.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, max);
    if (scored.length === 0) {
        return `No screenshots found for "${args.query}".\n\nTip: Try broader keywords. Available tabs: ALERTS, COMPLIANCE, DASHBOARD, REPORTS, SEARCH, Security, Settings, CLOUD PROTECTION.\nExample keywords: "windows startup", "alerts main", "dashboard events", "settings device", "compliance landing"`;
    }
    const lines = scored.map((r, i) => {
        const encoded = r.path.split('/').map(p => encodeURIComponent(p)).join('/');
        const url = `${SCREENSHOT_BASE}/${encoded}`;
        return `${i + 1}. **${r.path}**\n   URL: ${url}\n   Local: data/LOG360 Cloud Full Product Bulk Screenshot_/${r.path}`;
    });
    return `Found ${scored.length} screenshot(s) for "${args.query}":\n\n${lines.join("\n\n")}\n\n⚠️ These are real product screenshots from the private repo.\n- The filenames describe exactly what each screenshot shows.\n- Use get_page_blueprint for the structured layout description.\n- Match these layouts exactly — component positions, spacing, colors, data density.`;
}
/* ══════════════════════════════════════════════════════
   TOOL HANDLERS
══════════════════════════════════════════════════════ */
function rewriteAssetPaths(html) {
    return html
        .replace(/src="(?:\.\.\/)*assets\//g, `src="${CDN_BASE}/assets/`)
        .replace(/href="(?:\.\.\/)*assets\//g, `href="${CDN_BASE}/assets/`);
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
    const t = args.chart_type.toLowerCase();
    const s = CHART_SNIPPETS[t];
    if (!s)
        return `Unknown chart type: ${t}. Options: ${Object.keys(CHART_SNIPPETS).join(", ")}`;
    return `## ${t} Chart Snippet\n\n${s}`;
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
    return rewriteAssetPaths(await readWikiFile(args.filename));
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
    html = rewriteAssetPaths(html);
    return `## TopNavBar — Complete HTML\n\nSource: ${entry.file}\n\nCDN Base: ${CDN_BASE}\n\n⚠️ IMPORTANT: All <img> src paths use CDN URLs.\nLogo: \`${CDN_BASE}/assets/icons/logo-log360.svg\`\nIcons: \`${CDN_BASE}/assets/icons/icon-*.svg\`\nNEVER replace these with inline <svg>.\n\n\`\`\`html\n${html}\n\`\`\``;
}
/* ══════════════════════════════════════════════════════
   PAGE BLUEPRINTS — Structured visual descriptions of real Log360 pages
══════════════════════════════════════════════════════ */
const PAGE_BLUEPRINTS = {
    "reports-windows-all-events": `# Blueprint: Reports > Servers & Workstation > Windows > All Events

## Layout (Shell C)
TopNavBar → data-active-tab="Reports"
QuickLink bar (line-tab): Servers & Workstation (selected) | Network Devices | Cloud Sources | ...
Sidemenu Type 2 (left): OS dropdown "Windows" + search + flat accordion sections
Main content: Header + input-row + classic-tab (chart) + table-scroll-area

## TopNavBar Row 2
Tab items: Servers & Workstation | Network Devices | Cloud Protection | Applications | Active Directory | Microsoft 365 | Cloud Sources | File Integrity Monitoring | Threats | VM Management | Custom Reports

## Sidemenu (flat accordion with chevron-right icons)
Sections (each has > chevron that rotates on expand):
- Windows Events (expanded by default, shows sub-items)
  - All Events (highlighted when active)
  - Important Events
  - User Based Activity
- Logon Reports >
- Device Severity Reports >
- Windows Startup Events > (expand to show: Windows Startup, Windows ShutDown, Windows Restarts, Unexpected Shutdown, System Uptime, Windows Startup and Windows ShutDown)
- USB Storage Auditing >
- System Events >
- Windows Firewall Auditing >
- Registry Changes >
- Service Audit >
- Eventlog Reports >
- Network Share Auditing >
- Local Account Management >
- Process Tracking >
- DNS Server >
- Policy Changes >
- Group Management >
- Logoff Reports >
- Failed Logon Reports >
- Windows Backup and Restore >
- Program Inventory >
- Application Whitelisting >
- Windows Important Events >
- Threat Detection from Antivirus >
- Threat Detection >
- Application Crashes >
- Network Policy Server >
- Wireless Network Reports >
- Powershell Auditing >

Bottom links: Scheduled Reports | Manage Reports | Need New Reports?

## Page Header (header-v3)
Title: "All Events" + help icon
Right buttons: Edit Report | Export As ▾ | Schedule Reports | More ▾

## Input Row (reports-input-row--type1)
Fields: Select Log Source [dropdown with IP tags] | Period [date range picker] | [Generate button blue]

## Classic Tab (chart toggle — ONE chart area, NOT two separate charts)
Tab headers: All Events (selected) | Top Source | Top Devices | Time Based View | TEST
Below tabs: ONE chart container with rpt-chart-floater toolbar (customize + chart/table toggle)
Chart: Line chart showing event count over time (x-axis: dates, y-axis: count)
Legend below chart: ● Error ● Warning ● Information ● Success ● Failure (color-coded)

⚠️ CRITICAL: This is ONE classic-tab with ONE chart area. The tab buttons switch between All Events / Top Source / Top Devices views. Do NOT create separate charts for each tab. Use classic-tab JS to toggle content panels.

## Table
ActionBar: [list/table view toggle] [Incident button] | pagination "1-10 of 3302351" [< >] [10 ▾] [columns icon]
Columns: [checkbox] | Source | Log Source | Severity | Event ID | Display Name | Source (rightmost) | Timestamp
Row data pattern: "2020-04-18 01:30:48 | server | success | 4689 | Server | microsoft-windows-security-auditing"
Rows show realistic Windows event log data with Event IDs like 4689, 4658, 4656, 7036.`,
    "reports-windows-startup": `# Blueprint: Reports > Servers & Workstation > Windows > Windows Startup

## Layout (Shell C)
Same as "reports-windows-all-events" but sidemenu has "Windows Startup Events > Windows Startup" highlighted.

## Sidemenu
"Windows Startup Events" section is EXPANDED showing sub-items:
- Windows Startup (highlighted/active)
- Windows ShutDown
- Windows Restarts
- Unexpected Shutdown
- System Uptime
- Windows Startup and Windows ShutDown

## Page Header
Title: "Startup Events" (NOT "Windows Startup" — use the actual report title)

## Input Row
Fields: Select Log Source [dropdown "All Devices"] | Time Period [dropdown "Last 24 Hours"] | [Generate button blue]

## Classic Tab (Bar / Line toggle — ONE chart, toggle between views)
Tab headers: Bar (selected by default) | Line
ONE chart area with rpt-chart-floater.
Default view: Bar chart showing startup events count by device (x-axis: device hostnames, y-axis: event count)
Line tab: Line chart showing startup events over time (x-axis: dates, y-axis: count)

⚠️ CRITICAL: This is a classic-tab with Bar/Line toggle. There is ONE chart area. The classic-tab JS handles switching between bar and line views. Do NOT render two charts. Render ONE and use:
\`\`\`js
// In Bar tab content:
ElegantEChart.bar('mainChart', { labels:[...], datasets:[...] });
// In Line tab content (hidden by default):
// Chart renders on tab switch via classic-tab.js
\`\`\`

## Table
ActionBar: same as all-events (search + Incident + pagination + columns)
Columns: [checkbox] | Source | Event ID | Event Description | Source (IP) | Log Source Type | Event Generated | Timestamp
Row data pattern: Windows startup log entries with:
- Source: "EventLog" or "Service Control"
- Event ID: 6005, 6009, 7036, 10, etc.
- Event Description: "The Event log service was started", "Microsoft Windows...", "The following boot-start or system-start..."
- Log Source Type: "@Author"
- Realistic timestamps
Total rows: ~260 (show "1-50 of 260" in pagination)`,
    "reports-unix-all-events": `# Blueprint: Reports > Servers & Workstation > Unix > All Events

## Layout (Shell C)
Same shell as Windows reports but OS dropdown in sidemenu set to "Unix/Linux".

## Sidemenu
OS dropdown: Unix/Linux (selected — icon changes to penguin/terminal icon)
Sections change to Unix-specific:
- All Events (highlighted by default)
- Important Events
- SU Logons
- Logon Reports >
- Failed Logon Reports >
- System Events >
- Terminal Service Session >
- FTP Server Reports >

Bottom links: Scheduled Reports | Manage Reports | Need New Reports?

## Page Header (header-v3)
Title: "All Events" + help icon
Right buttons: Edit Report | Export As ▾ | Schedule Reports | More ▾

## Input Row
Fields: Select Log Source [dropdown] | Period [date range picker] | [Generate button blue]

## Classic Tab (chart toggle)
Tab headers: All Events (selected) | Top Source | Top Devices | Time Based View
ONE chart area with rpt-chart-floater. Line chart with severity breakdown.
Legend: ● Error ● Warning ● Information ● Success ● Failure

## Table
ActionBar: list/table view toggle | Incident | pagination | columns
Columns: [checkbox] | Source | Log Source | Severity | Event ID | Display Name | Source | Timestamp
Row data: Unix syslog entries with severity levels.`,
    "dashboard": `# Blueprint: Dashboard — Events Overview (Shell A)

## Layout (Shell A)
TopNavBar → data-active-tab="Home"
QuickLink bar (line-tab below topnavbar): Events Overview (selected) | Network Overview | AD Overview | AWS Overview | Microsoft 365 | File Monitoring | Incident Overview | PgSQL Overview | SQL Server Overview | AD Summary | Threat Analytics | Cloud Protection | Custom Tab 1
No sidemenu. Full-width scrollable main content.
Date range picker in top-right corner.

## Stat Cards Row (4 cards, horizontal)
1. All Events: "4489K" with delta "▲ 4441,946 (3406.52%)" — blue icon (bar chart)
2. Windows Events: "3302K" with sub-stats "▲ 330251 ● Failure 4556 ● Error 1895 ● Warning 778" — blue icon
3. Syslog Events: "11444" with delta "▲ 9942 (471.63%)" sub-stats "● Warning 462 ● Critical 143 ● Error 18" — green icon
4. All Log Sources: "18" with link "View All Log Sources" + "2 Inactive Devices" — purple icon

## Widget Grid (2 columns, 3 rows)
### Row 1:
- LEFT WIDE: "Log Trend" — area chart (blue fill, x-axis: months Dec–Nov, y-axis: count 0–5C)
- RIGHT NARROW: "Recent Alerts" — scrollable list of alert entries, each with colored left border (red=critical), message text, timestamp

### Row 2:
- LEFT: "Security Events" — simple 2-column table: Report Name | Count (Logon: 321174, Account Logon: 12046, Account Management: 66, Object Access: 1893203, System Events: 439)
- MIDDLE: "Top 5 Log Sources" — donut/pie chart with legend (Server, Salesforce, logauto-dc, dineshrv.dc, mistryiv-10166)
- RIGHT: (part of Recent Alerts continuing)

### Row 3:
- LEFT: "Windows Severity Events" — bar chart (x-axis: success/information/failure/error/warning, y-axis: count to 5C)
- RIGHT: "Syslog Severity Events" — bar chart (x-axis: information/notice/warning/critical/debug/error/alert/emergency, y-axis: count)

## Key Rules
- Each widget uses the \`widget\` component (widget header + widget body)
- Charts use ElegantEChart.* calls
- All stat card numbers should be realistic large numbers
- "Recent Alerts" is a live feed list, not a table
- Incident Workbench floating button at bottom-right`,
    "dashboard-network": `# Blueprint: Dashboard — Network Overview

## Layout (Shell A)
Same as Events Overview but "Network Overview" tab selected in quicklink bar.
Stat cards + widget grid for network-specific data (traffic, devices, top talkers).`,
    "alerts": `# Blueprint: Alerts (Shell D — no sidemenu)

## Layout
TopNavBar → data-active-tab="Alerts"
Line-tab below TopNavBar: Alerts (selected) | Incident
No sidemenu — full-width content.
Date range picker in top-right.
Right actions: Export As ▾ | 🔔 Add Alert Profile | ⚙ Manage Profiles

## Filter Row
"View:" dropdown → "All Alerts ▾" (options: All, Critical, Trouble, Attention)
"T" filter icon for additional filtering

## Stat Cards Row (4 horizontal)
1. Critical Alerts: "184185" — red circle icon with X
2. Trouble Alerts: "6942" — orange circle icon with X
3. Attention Alerts: "222" — yellow/green circle icon with !
4. All Alerts: "191349" — blue/purple circle icon (highlighted background)

## Table (NO classic-tab, NO chart — directly below stat cards)
ActionBar: pagination "1-10 of 191349" [< >] [10 ▾] | Add/Remove Columns
Columns: [checkbox] | Severity | Profile Name | Time ▾ | Alert Message Format | Log Source
Row data pattern:
- Severity: "Critical" with red dot icon
- Profile Name: "EXE Process Executed", "Logon on Critical Servers"
- Time: "2026-04-18 01:30:46"
- Alert Message Format: "microsoft-windows-security-auditing : A new process has b..." or "An account was succ..."
- Log Source: "server"

## Key Rules
- Severity column shows colored severity label (Critical=red, Trouble=orange, Attention=yellow)
- Each row is clickable → opens detail drawer
- NO chart on this page — stat cards go directly to table
- Incident Workbench floating button at bottom-right`,
    "alerts-manage-profiles": `# Blueprint: Alerts > Manage Profiles

## Layout
Same TopNavBar + line-tab as alerts. Content area shows profile management table.

## Table
Columns: [checkbox] | Alert Type | Severity | Message | Log Source | Action
CRUD operations: Add/Edit/Delete alert profiles.`,
    "compliance": `# Blueprint: Compliance — Landing Page (Shell A variant — no sidemenu)

## Layout
TopNavBar → data-active-tab="Compliance"
Search bar at top-left: "Search Compliance"
"Manage Compliance" link at top-right
Title: "Configured Compliance"
No sidemenu — full-width grid layout.

## Compliance Grid (3 columns × N rows)
Each card contains:
- Icon (compliance standard logo — use placeholder colored circle or shield icon)
- Title bold: "PCI-DSS" / "HIPAA" / "FISMA" etc.
- Subtitle: "Compliance Standard"
- Description: 2-3 lines of text explaining the standard
- "View Reports" button (outlined, primary blue)

### Row 1: PCI-DSS | HIPAA | FISMA
### Row 2: GDPR | SOX | ISO 27001:2013
### Row 3: ISO 27001:2022 | CCPA and CPRA | Cyber Essentials
### Row 4: COCO | FERPA | GLBA
### Row 5: GPG | ISLP | NIST CSF
### Row 6: PDPA | NERC | NRC (partially visible)

## Key Rules
- Cards have white background, subtle border, consistent padding
- Logo/icon is top-left of each card (32×32 or 40×40)
- "View Reports" button navigates to compliance report detail page
- Incident Workbench floating button at bottom-right`,
    "compliance-report": `# Blueprint: Compliance > PCI-DSS > Report Page (Shell C)

## Layout (Shell C)
TopNavBar → data-active-tab="Compliance"
Line-tab below topnavbar (compliance standards): PCI-DSS (selected) | HIPAA | FISMA | GDPR | SOX | ISO 27001:2013 | ISO 27001:2022 | CCPA and CPRA | Cyber Essentia... | COCO | FERPA | GLBA | GPG | ISLP | NIST CSF | PDPA | SAMA | CJIN
Sidemenu Type 2 on left: ← PCI-DSS back arrow + flat accordion sections
Main content: header + bar chart + table

## Sidemenu (flat accordion with chevron-right)
Sections:
- Windows Logon Reports > (expanded: User Logons, Network Logons, Interactive Logon, Remote Interactive Logon, Logon Attempt Using explicit Crede..., Passcode Assigned to New Logon, Radius Logon History/NPS)
- Windows Logoff Reports >
- Windows Failed Logon Reports >
- Terminal Service Session >
- Policy Changes >
- System Events >
- User Account Validation >
- Windows USB Storage Auditing >
- Windows Services >
- Windows Threat Detection from An... >
- Windows Threat Detection >
- Windows Application Whitelisting >
- Ad Indicators >
- Windows Application Crashes >
- Windows Wireless Network Reports >
- Windows Registry Changes >
- Windows User Access >
- Group Account Changes >

Bottom link: Manage Compliance

## Page Header
"← PCI-DSS" back link + Title: "User Logons"
Right: Export As ▾ | date range

## Input Row
Devices: [dropdown with tags "DefaultGroup,WindowsGroup,Uni..."] [+] button
Period: [date range picker]

## Chart Area (NO classic-tab toggle — single horizontal bar chart)
Horizontal bar chart showing logon counts by source (Server: ~350, logon-N-1: ~5, workstation: ~1)

## Table
ActionBar: list/table view toggle | pagination "1-10 of 299" [< >] [10 ▾] | columns
Columns: [checkbox] | Time | Log Source | User Name | Remote Device | Remote Domain(y) | Domain | Logon Type | Process Id
Row data: "2026-04-18 01:30:13 | server | dwm1-4 | - | - | font driver host | 2 | 0x1988"`,
    "search": `# Blueprint: Search (no shell — custom layout)

## Layout
TopNavBar → data-active-tab="Search"
No sidemenu — full-width content.
Title: "Search" with help icon "How To Search?"
Right: Export As ▾ | calendar icon
Date range picker top-right

## Search Box Area (white card, prominent)
Row 1: [🔍 search input "Type Source / Group Name(s)"] | "Pick Log Source" link (blue) | [All Log Types ▾ dropdown]
Row 2: Basic (selected) | Advanced | More ▾
Row 3: Query text area (monospace): \`{ ( severity = "emergency" ) }\`
Row 4: [Search button blue] | [Save As ▾]
"Clear Search" link with green icon below

## Results Area
Chart: Horizontal bar chart showing event distribution by month (x-axis: months, y-axis: count)
Legend: ● Months (green bars)
Right: "Hide Graph" link | "Edit Widget" button

## Results List (list view, NOT table view)
ActionBar: [📋 Incident] [How to Extract Fields?] | pagination "1-3 of 3" [< >] [10 ▾] | Add/Remove Fields
Each result is a card/row with:
- Line 1 (bold): "Message: warning level1[...]: Config error: Incomplete bad chain for listener: <name>"
- Line 2 (gray, key-value pairs): "Target Group: - | Source: rtp | LogType: antix | Target Domain: - | Remote Device: - | Time: 2026-01-29 17:03:15 | ..."
- All fields shown inline with separators: LogonId, User Id, Common Report Name, Target User, Severity (highlighted "emergency" in blue badge), Audit Id, Group Id, Display Name, User Rid, Facility (rtp), Logon Type, User Name, Log Source: 192.168.2.15

## Key Rules
- Search results are list-view (expandable rows) not table rows
- Severity badges are color-coded
- Each result row is dense with many key-value fields
- Bar chart above results shows distribution`,
    "security": `# Blueprint: Security — Analytics Dashboard (Shell A variant)

## Layout
TopNavBar → data-active-tab="Security"
Title: "Security Analytics"
Right: date range picker | 🛡 Manage Rules button
No sidemenu — full-width scrollable dashboard.

## Stat Cards Row (4 horizontal)
1. All Rules - Detections: "81952" with delta "▲ 30655 (69.75%)" — blue shield icon
2. Critical Rules - Detections: "48968" with delta "▲ 45040 (1295.90%)" — blue X icon
3. Trouble Rules - Detections: "16247" with delta "▲ 10882 (-5.01%)" — orange X icon
4. Attention Rules - Detections: "16737" with delta "▲ 14077 (529.31%)" — yellow ! icon

## Widget Grid (3 columns)
### Row 1:
- LEFT: "Detection Pipeline" — horizontal stacked bar showing flow: 81952 Detections → [Critical (red) | Trouble (orange) | Attention (yellow)] → 708 Alerts
- MIDDLE: "Detection by Tactics" — radar/spider chart with MITRE ATT&CK tactics around the perimeter (Defense Evasion, Lateral Movement, Impact, Execution, Credential Access Collection, Persistence, Privilege Escalation, Discovery, Command Control). Color-coded: Critical (red), Trouble (orange), Attention (yellow)
- RIGHT: "Recent Detections" — scrollable list with colored left borders (red=critical, orange=trouble), each showing: Rule name, Username, Device Name, server info, MITRE ATT&CK Mapping, timestamp

### Row 2:
- LEFT: "Top 5 User by Detections" — vertical bar chart (x-axis: usernames like system0, server0, administrator, dc5, clusteruser. Color-coded by severity)
- MIDDLE: "Top 5 Log Sources by Detections" — horizontal stacked bar chart (Server, logauto-dc, logon-w18-1, DC-8.0.0, 192.0.0.0). Colors: Critical=red, Trouble=orange, Attention=yellow

### Row 3:
- LEFT: "Top 10 Detections by Rules" — vertical bar chart (x-axis: rule identifier names, y-axis: count to 1M)
- MIDDLE: "Detection Trends" — line chart (x-axis: months Dec–Nov, y-axis: count). Three colored lines: Critical, Trouble, Attention

## Key Rules
- All widgets use the widget component
- MITRE ATT&CK tactics shown as radar chart (use ElegantEChart radar type)
- Recent Detections list is similar to Recent Alerts in dashboard
- Color coding consistent: Critical=#E24C4C, Trouble=#F5A623, Attention=#F8D648`,
    "cloud-protection": `# Blueprint: Cloud Protection (Shell A variant)

## Layout
TopNavBar → data-active-tab="Cloud Protection"
Line-tab below topnavbar: Application Insight (selected) | User Insight
Date range picker top-right
No sidemenu — full-width scrollable dashboard.

## Stat Cards Row (4 horizontal)
1. Total Traffic: "298.69GB" with sub-stats "● Upload Size 14.03GB ● Download Size 5.83MB" — blue icon
2. Total Request: "50416" with sub-stats "● Allowed 33616 ● Denied 16800" — blue icon
3. Discovered Apps: "28" — grid icon (purple/blue)
4. Shadow Apps: "10" — grid icon with warning overlay

## Widget Grid (3 columns)
### Row 1:
- LEFT: "Total Traffic Trend" — area chart (blue fill, x-axis: months, y-axis: size in MB)
- MIDDLE: "Top Cloud Apps By Request" — pie/donut chart with legend (instagram.com, mail.zoho.com, twitter.com, ad.yieldmanager.com, audio.stream.com)
- RIGHT: "Top Attempted Banned Apps" — table: Cloud App | Count | Percentage (twitter.com: 3360 20%, ad.yieldmanager.com: 1800 10%, discord.com: 1800 10%, etc.)

### Row 2:
- LEFT: "Top Shadow Cloud Apps By Request" — bar chart (x-axis: app domains, y-axis: count to 10K)
- MIDDLE: "Top Cloud Apps By Download Size" — donut chart with legend
- RIGHT: "Top Cloud Apps By Upload Size" — horizontal bar chart (app domains on y-axis)

### Row 3:
- LEFT: "Top Cloud App Categories" — horizontal bar chart (categories: social networking, computer and internet, streaming media, web-based email, business and economy, etc.)
- RIGHT: "Low Reputed Apps" — bar chart (x-axis: app domains, y-axis: count)

## Key Rules
- This is a dashboard-style page with stat cards + widget grid (like Shell A)
- All charts use ElegantEChart.* calls
- Pie/donut charts have side legends with colored dots`,
    "settings": `# Blueprint: Settings — Device Management (Shell B)

## Layout (Shell B)
TopNavBar → data-active-tab="Settings"
Sidemenu Type 1 (settings variant — icons for each section, NOT flat accordion):
- Left panel has 2 icon tabs at top: ⚙ Configuration | 👤 Admin
- Below: collapsible sections with icons:
  - Log Source Configuration > (expanded: Devices, Applications, Import Logs, Manage Cloud Sources, File Integrity Monitoring)
  - Cloud Protection Settings >

## Page Header
Title: "Device Management"

## Line Tab (below header)
Tabs: Windows Devices (7) (selected) | Syslog Devices (1) | Other Devices (7)
Each tab shows count badge.

## Input Row
Select Category: [All Devices ▾] | "Configure domain/workgroups" link (blue)
Right: [+ Add Device(s)] button (green/primary)

## Table
ActionBar: [🔍] [filter] [✓] [⚙] [⬇] [↕] icons | pagination "1-10 of 64" [< >] [10 ▾] | view toggle icons
Columns: [checkbox] | Actions | Device ▾ | Show IP | Agent | Last Message Time ▾ | Next Scan On | Monitoring Interval | Log Source Group | Status
Row data:
- Actions column: small icon buttons (delete, edit, checkmark — 3 action icons per row)
- Device: "1", "10.0.0.1", "11.0.0.1", "192.168.111.14", etc.
- Agent: "logon-N-1" with agent icon
- Status: "Listening for logs" (green), "Disabled" (red text)
- Monitoring Interval: "Real-time"
- Log Source Group: "WindowsGroup", "StatusGroup"

## Key Rules
- Settings pages use Shell B (sidemenu-settings + main content)
- Sidemenu Type 1 has ICONS (not just text like Type 2)
- Tab counts in parentheses after tab name
- Action icons in table rows are small (14px) icon buttons
- Status column is color-coded: green=active, red=disabled`,
    "settings-license": `# Blueprint: Settings — License Page

## Layout (Shell B)
Same settings shell. Sidemenu section active item varies.

## Content
License info page with storage stats, feature table with usage bars, plan details.`,
    "incident-workbench": `# Blueprint: Incident Workbench (floating panel)

## Layout
This is NOT a full page — it's a floating bottom-right panel/bar that appears on every page.
Shows: "🛡 Incident Workbench" label | X close button | expand icon
When expanded: shows investigation tools (IP Threat Intel, Process Hunting, User Activity Overview).`,
};
function handleGetPageBlueprint(args) {
    const bp = PAGE_BLUEPRINTS[args.page];
    if (!bp)
        return `Unknown page: ${args.page}. Options: ${Object.keys(PAGE_BLUEPRINTS).join(", ")}`;
    return bp;
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
            case "get_page_blueprint":
                text = handleGetPageBlueprint(args);
                break;
            case "get_screenshot":
                text = handleGetScreenshot(args);
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
