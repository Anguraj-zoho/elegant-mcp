import { z } from "zod";
import { createMcpHandler } from "mcp-handler";

/* ── Config ── */
const CDN_BASE = "https://cdn.jsdelivr.net/gh/Anguraj-zoho/elegant-cdn@main";
const PRIVATE_REPO = "Anguraj-zoho/elegant-2.0";
const WIKI_PATH = "data/Components-Wiki";
const GH_TOKEN = process.env.ELEGANT_GH_TOKEN || "";

/* ── Wiki file reader (GitHub API) ── */
const wikiCache = new Map<string, string>();

async function readWikiFile(filename: string): Promise<string> {
  const name = filename.endsWith(".md") ? filename : `${filename}.md`;
  if (wikiCache.has(name)) return wikiCache.get(name)!;
  if (!GH_TOKEN)
    return `[ERROR: ELEGANT_GH_TOKEN env var not set]`;
  try {
    const url = `https://api.github.com/repos/${PRIVATE_REPO}/contents/${WIKI_PATH}/${name}`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${GH_TOKEN}`,
        Accept: "application/vnd.github.raw+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });
    if (!res.ok) return `[Wiki file not found: ${name} (${res.status})]`;
    const text = await res.text();
    wikiCache.set(name, text);
    return text;
  } catch (err: any) {
    return `[GitHub fetch error: ${err.message}]`;
  }
}

/* ── Helpers ── */
function rewriteAssetPaths(html: string): string {
  return html
    .replace(/src="(?:\.\.\/)*assets\//g, `src="${CDN_BASE}/assets/`)
    .replace(/href="(?:\.\.\/)*assets\//g, `href="${CDN_BASE}/assets/`);
}

function extractSection(content: string, heading: string): string {
  const lines = content.split("\n");
  const headingLower = heading.toLowerCase();
  let inSection = false;
  const out: string[] = [];
  for (const line of lines) {
    if (/^#{2,3} /.test(line)) {
      if (line.toLowerCase().includes(headingLower)) {
        inSection = true;
        out.push(line);
        continue;
      }
      if (inSection) break;
    }
    if (inSection) out.push(line);
  }
  return out.length ? out.join("\n").trim() : `[Section "${heading}" not found]`;
}

function extractHtmlBlock(content: string, heading?: string): string {
  const src = heading ? extractSection(content, heading) : content;
  const match = src.match(/```html\n([\s\S]*?)```/);
  return match ? match[1].trim() : "[No HTML block found]";
}

/* ══════════════════════════════════════════════════════
   STATIC DATA — same as stdio server
══════════════════════════════════════════════════════ */

const RECIPES: Record<string, string> = {
  A: `# Recipe A — Dashboard (Shell A)\n\nPage types: Home dashboard, Security overview, Cloud Protection, Threat Hub.\n\n## ⚠️ PREREQUISITE: Call setup_project FIRST\nOutput = SINGLE index.html with ALL assets from CDN. NEVER create local folders. NEVER copy assets. NEVER read local files — use MCP tools only.\n\n## Required wiki files (open ALL before writing HTML)\n1. app_shells.md — Shell A tree\n2. layout_shell.md — base HTML skeleton\n3. design_tokens.md — CSS variables\n4. topnavbar.md — TopNavBar (data-active-tab="Home")\n5. line_tab.md — sub-tabs + dashboard variant actions\n6. header.md — Variant 1 (title + help icon)\n7. widget.md — widget cards (10 patterns)\n8. stat_card.md — KPI stat cards\n9. tile_widgets.md — tile JS API\n10. predefined_charts.md — ElegantEChart.* API\n11. echarts-widget.md — chart engine\n12. echarts-elegant-theme.md — theme\n13. icons.md — icon lookup\n14. form_input.md — filter inputs\n15. form_dropdown.md — filter dropdowns\n16. drawer.md — detail drawers\n17. button-row.md — action buttons\n\n## CSS load order\ntokens → layout → topnavbar → line-tab → widget → table → responsive → notification-banner\n\n## Scroll model\nONLY .dash scrolls (flex:1; overflow-y:auto). Everything above is fixed.\n\n## Shell A structure\n\`\`\`\ndiv.app-shell (height:100vh; flex:column)\n ├── header.topnavbar\n ├── div.line-tab (h:40px) + div.line-tab__actions\n ├── div.toolbar [OPTIONAL]\n └── div.dash (bg:#F5F5F5; flex:1; overflow-y:auto)\n      └── div.dash__grid\n           ├── div.dash__row.stat-row   — max 4 stat cards\n           ├── div.tile-grid            — max 3 tiles\n           └── div.dash__row            — hybrid widgets (max 3/row)\n\`\`\``,
  B: `# Recipe B — Settings (Shell B)\n\nPage types: Settings tab, Admin config, Device Management.\n\n## ⚠️ PREREQUISITE: Call setup_project FIRST\nOutput = SINGLE index.html with ALL assets from CDN. NEVER create local folders. NEVER copy assets. NEVER read local files — use MCP tools only.\n\n## Required wiki files\n1-15: app_shells (Shell B), layout_shell, design_tokens, topnavbar (Settings), sidemenu_variant1_settings, header, classic_tab, data_table_type1, actionbar (Types 1-7), form_input, form_dropdown, drawer, button-row, note-container, icons\n\n## CSS load order\ntokens → layout → topnavbar → sidemenu → header → classic-tab → table → form-input → form-dropdown → drawer → responsive → notification-banner\n\n## Shell B structure\n\`\`\`\ndiv.app-shell\n ├── header.topnavbar\n └── div.app-body\n      ├── aside.sidemenu (w:240px)\n      └── main.main-content\n           ├── div.page-header\n           └── div.classic-tab\n                ├── div.classic-tab__headers\n                └── div.classic-tab__body → [actionbar + data-table]\n\`\`\``,
  C: `# Recipe C — Reports (Shell C)\n\nPage types: Reports tab, Compliance pages, any sidebar report tree + chart + table.\n\n## ⚠️ PREREQUISITE: Call setup_project FIRST\nOutput = SINGLE index.html with ALL assets from CDN. NEVER create local folders. NEVER copy assets. NEVER read local files — use MCP tools only.\n\n## Required wiki files\n1-17: app_shells (Shell C), layout_shell, design_tokens, topnavbar (Reports), sidemenu_variant2_reports, header (Variant 3), classic_tab, rpt-chart-floater, predefined_charts + echarts-widget + echarts-elegant-theme, form_input, form_dropdown, data_table_type1, actionbar (Type 8), drawer, button-row, note-container, icons\n\n## Critical Shell C assembly rules\n1. .reports-quicklink is a DIRECT CHILD of .app-shell\n2. .classic-tab contains ONLY the chart area\n3. .table-scroll-area is a SIBLING of .classic-tab, NOT a child\n4. ActionBar Type 8 MANDATORY\n5. Header Variant 3 MANDATORY\n\n## Shell C structure\n\`\`\`\ndiv.app-shell\n ├── header.topnavbar (data-active-tab="Reports")\n ├── div.reports-quicklink → div.line-tab.line-tab--quicklink\n └── div.app-body\n      ├── aside.sidemenu.sidemenu--type2\n      └── main.main-content\n           ├── div.page-header (Variant 3)\n           ├── div.reports-input-row.reports-input-row--type1\n           ├── div.classic-tab [chart ONLY]\n           └── div.table-scroll-area\n                ├── div.actionbar (Type 8, sticky)\n                └── div.data-table-wrap → table.data-table\n\`\`\``,
  D: `# Recipe D — Split Panel (Shell D)\n\nPage types: AI Investigation, Incident Detail/Workbench, Playbook Editor.\n\n## ⚠️ PREREQUISITE: Call setup_project FIRST\nOutput = SINGLE index.html with ALL assets from CDN. NEVER create local folders. NEVER copy assets. NEVER read local files — use MCP tools only.\n\n## Shell D structure\n\`\`\`\ndiv.app-shell\n ├── header.topnavbar\n └── div.app-body\n      └── main.main-content (padding:0)\n           ├── div.line-tab\n           └── div.line-tab__body\n                └── div.split-layout (flex:row)\n                     ├── div.left-panel (flex:1; overflow-y:auto)\n                     └── div.right-panel (w:380px; border-left)\n\`\`\``,
};

const COMPONENT_MAP: Record<string, { file: string; section?: string }> = {
  topnavbar:              { file: "topnavbar.md",                       section: "Complete HTML" },
  "sidemenu-settings":    { file: "sidemenu_variant1_settings.md",      section: "Complete HTML" },
  "sidemenu-reports":     { file: "sidemenu_variant2_reports.md",       section: "Complete HTML" },
  "header-v1":            { file: "header.md",                          section: "Variant 1: Default" },
  "header-v2":            { file: "header.md",                          section: "Variant 2: With Back Button" },
  "header-v3":            { file: "header.md",                          section: "Variant 3: Report Header" },
  "classic-tab":          { file: "classic_tab.md",                     section: "Variant 1: Classic Tab (Single Variant)" },
  "line-tab":             { file: "line_tab.md",                        section: "Variant 1: Default (Plain Text, h=40)" },
  "line-tab-quicklink":   { file: "line_tab.md",                        section: "Variant 3: QuickLink (pill tabs, h=32)" },
  "actionbar-type1":      { file: "actionbar.md",                       section: "Type 1 — Search + Pagination (Minimal)" },
  "actionbar-type2":      { file: "actionbar.md",                       section: "Type 2 — Search + Bulk Actions (Enable/Disable/Delete/More) + Pagination" },
  "actionbar-type8":      { file: "actionbar.md",                       section: "Type 8 — Report ActionBar: Search + Incident Button + Pagination + Column View" },
  "data-table":           { file: "data_table_type1.md",                section: "Complete HTML" },
  "data-table-type2":     { file: "data_table_type2.md",                section: "Complete HTML" },
  "rpt-chart-floater":    { file: "rpt-chart-floater.md",               section: "Complete HTML" },
  "drawer-sm":            { file: "drawer.md",                          section: "Variant 1" },
  "drawer-md":            { file: "drawer.md",                          section: "Variant 2" },
  "drawer-lg":            { file: "drawer.md",                          section: "Variant 3" },
  "form-text":            { file: "form_input.md",                      section: "Type 1" },
  "form-textarea":        { file: "form_input.md",                      section: "Type 3" },
  "form-checkbox":        { file: "form_input.md",                      section: "Type 4" },
  "form-radio":           { file: "form_input.md",                      section: "Type 5" },
  "form-dropdown":        { file: "form_dropdown.md",                   section: "Type 1: Basic Dropdown (plain text items)" },
  "widget":               { file: "widget.md",                          section: "Dashboard Container" },
  "stat-card":            { file: "stat_card.md",                       section: "Grid Wrapper + All 10 Types" },
  "button-row":           { file: "button-row.md",                      section: "Complete HTML" },
  "note-container":       { file: "note-container.md",                  section: "Complete HTML" },
  "design-tokens":        { file: "design_tokens.md",                   section: "" },
};

const CHART_SNIPPETS: Record<string, string> = {
  line: `<div id="chart-line" style="width:100%;min-height:220px;"></div>\n<script>\nElegantEChart.line('chart-line', {\n  labels: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],\n  datasets: [\n    { label: 'Series A', values: [120,180,140,220,190,160,210], color: '#2C66DD', fill: false },\n    { label: 'Series B', values: [80,110,95,140,120,100,130],  color: '#009CBB', fill: false }\n  ]\n});\n<\/script>`,
  area: `<div id="chart-area" style="width:100%;min-height:220px;"></div>\n<script>\nElegantEChart.line('chart-area', {\n  labels: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],\n  datasets: [\n    { label: 'Series A', values: [120,180,140,220,190,160,210], color: '#2C66DD', fill: true },\n    { label: 'Series B', values: [80,110,95,140,120,100,130],  color: '#009CBB', fill: true }\n  ]\n});\n<\/script>`,
  bar: `<div id="chart-bar" style="width:100%;min-height:220px;"></div>\n<script>\nElegantEChart.bar('chart-bar', {\n  labels: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],\n  datasets: [\n    { label: 'Series A', values: [24,18,31,22,27,19,26], color: '#2C66DD' },\n    { label: 'Series B', values: [8,5,12,6,9,4,7],       color: '#DD1616' }\n  ]\n});\n<\/script>`,
  hbar: `<div id="chart-hbar" style="width:100%;min-height:220px;"></div>\n<script>\nElegantEChart.hbar('chart-hbar', {\n  labels: ['Item A','Item B','Item C','Item D','Item E'],\n  datasets: [\n    { label: 'Count', values: [866,3452,1231,4567,987], color: '#2C66DD' }\n  ]\n});\n<\/script>`,
  donut: `<div id="chart-donut" style="width:100%;min-height:220px;"></div>\n<script>\nElegantEChart.donut('chart-donut', {\n  labels: ['Critical','High','Medium','Low'],\n  values: [18,34,56,92],\n  colors: ['#DD1616','#D14900','#FABB34','#198019']\n});\n<\/script>`,
  stacked: `<div id="chart-stacked" style="width:100%;min-height:220px;"></div>\n<script>\nElegantEChart.bar('chart-stacked', {\n  labels: ['Mon','Tue','Wed','Thu','Fri'],\n  datasets: [\n    { label: 'Critical', values: [12,19,8,15,22], color: '#DD1616' },\n    { label: 'High',     values: [8,14,11,9,17],  color: '#D14900' },\n    { label: 'Medium',   values: [20,25,18,22,30], color: '#FABB34' }\n  ]\n}, { stacked: true });\n<\/script>`,
};

const SHELLS: Record<string, string> = {
  A: `<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" />\n  <title><!-- PAGE TITLE --> — Log360 Cloud</title>\n  <link rel="stylesheet" href="${CDN_BASE}/components/tokens.css" />\n  <link rel="stylesheet" href="${CDN_BASE}/components/layout.css" />\n  <link rel="stylesheet" href="${CDN_BASE}/components/topnavbar.css" />\n  <link rel="stylesheet" href="${CDN_BASE}/components/line-tab.css" />\n  <link rel="stylesheet" href="${CDN_BASE}/components/widget.css" />\n  <link rel="stylesheet" href="${CDN_BASE}/components/table.css" />\n  <link rel="stylesheet" href="${CDN_BASE}/components/responsive.css" />\n  <style>html,body{height:100%;margin:0;overflow:hidden;}.app-shell{height:100vh;display:flex;flex-direction:column;overflow:hidden;}</style>\n</head>\n<body>\n<div class="app-shell">\n  <!-- SLOT: TopNavBar (data-active-tab="Home") -->\n  <!-- SLOT: Line Tab + Actions -->\n  <div class="dash"><div class="dash__grid">\n    <!-- SLOT: stat-row, tile-grid, dash__row widgets -->\n  </div></div>\n</div>\n<script src="${CDN_BASE}/components/lib/echarts.min.js"></script>\n<script src="${CDN_BASE}/components/echarts-elegant-theme.js"></script>\n<script src="${CDN_BASE}/components/echarts-widget.js"></script>\n<script src="${CDN_BASE}/components/topnavbar.js"></script>\n<script src="${CDN_BASE}/components/line-tab.js"></script>\n<script src="${CDN_BASE}/components/icon-engine.js"></script>\n</body></html>`,
  B: `<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" />\n  <title><!-- PAGE TITLE --> — Log360 Cloud</title>\n  <link rel="stylesheet" href="${CDN_BASE}/components/tokens.css" />\n  <link rel="stylesheet" href="${CDN_BASE}/components/layout.css" />\n  <link rel="stylesheet" href="${CDN_BASE}/components/topnavbar.css" />\n  <link rel="stylesheet" href="${CDN_BASE}/components/sidemenu.css" />\n  <link rel="stylesheet" href="${CDN_BASE}/components/header.css" />\n  <link rel="stylesheet" href="${CDN_BASE}/components/classic-tab.css" />\n  <link rel="stylesheet" href="${CDN_BASE}/components/table.css" />\n  <link rel="stylesheet" href="${CDN_BASE}/components/form-input.css" />\n  <link rel="stylesheet" href="${CDN_BASE}/components/form-dropdown.css" />\n  <link rel="stylesheet" href="${CDN_BASE}/components/drawer.css" />\n  <link rel="stylesheet" href="${CDN_BASE}/components/responsive.css" />\n  <style>html,body{height:100%;margin:0;overflow:hidden;}.app-shell{height:100vh;display:flex;flex-direction:column;overflow:hidden;}.app-body{flex:1;display:flex;overflow:hidden;min-height:0;}.main-content{flex:1;display:flex;flex-direction:column;overflow:hidden;min-height:0;padding:0 16px;}</style>\n</head>\n<body>\n<div class="sidemenu-backdrop"></div>\n<div class="app-shell">\n  <!-- SLOT: TopNavBar (data-active-tab="Settings") -->\n  <div class="app-body">\n    <!-- SLOT: aside.sidemenu -->\n    <button class="sidemenu-expand" id="sidebarExpand"></button>\n    <main class="main-content">\n      <!-- SLOT: page-header -->\n      <!-- SLOT: classic-tab -->\n    </main>\n  </div>\n</div>\n<script src="${CDN_BASE}/components/topnavbar.js"></script>\n<script src="${CDN_BASE}/components/sidemenu.js"></script>\n<script src="${CDN_BASE}/components/classic-tab.js"></script>\n<script src="${CDN_BASE}/components/table.js"></script>\n<script src="${CDN_BASE}/components/drawer.js"></script>\n<script src="${CDN_BASE}/components/icon-engine.js"></script>\n</body></html>`,
  C: `<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" />\n  <title><!-- REPORT TITLE --> — Reports — Log360 Cloud</title>\n  <link rel="stylesheet" href="${CDN_BASE}/components/tokens.css" />\n  <link rel="stylesheet" href="${CDN_BASE}/components/layout.css" />\n  <link rel="stylesheet" href="${CDN_BASE}/components/topnavbar.css" />\n  <link rel="stylesheet" href="${CDN_BASE}/components/sidemenu.css" />\n  <link rel="stylesheet" href="${CDN_BASE}/components/header.css" />\n  <link rel="stylesheet" href="${CDN_BASE}/components/classic-tab.css" />\n  <link rel="stylesheet" href="${CDN_BASE}/components/line-tab.css" />\n  <link rel="stylesheet" href="${CDN_BASE}/components/table.css" />\n  <link rel="stylesheet" href="${CDN_BASE}/components/form-input.css" />\n  <link rel="stylesheet" href="${CDN_BASE}/components/form-dropdown.css" />\n  <link rel="stylesheet" href="${CDN_BASE}/components/drawer.css" />\n  <link rel="stylesheet" href="${CDN_BASE}/components/rpt-chart-floater.css" />\n  <link rel="stylesheet" href="${CDN_BASE}/components/responsive.css" />\n  <style>html,body{height:100%;margin:0;overflow:hidden;}.app-shell{height:100vh;display:flex;flex-direction:column;overflow:hidden;}.app-body{flex:1;display:flex;overflow:hidden;min-height:0;}.main-content{flex:1;display:flex;flex-direction:column;overflow:hidden;min-height:0;padding:0 16px;}.classic-tab{flex-shrink:0;}.table-scroll-area{flex:1;overflow-y:auto;min-height:0;position:relative;}.actionbar{position:sticky;top:0;z-index:3;background:#fff;}</style>\n</head>\n<body>\n<div class="sidemenu-backdrop"></div>\n<div class="app-shell">\n  <!-- SLOT: TopNavBar (data-active-tab="Reports") -->\n  <div class="reports-quicklink"><!-- SLOT: line-tab quicklink --></div>\n  <div class="app-body">\n    <!-- SLOT: aside.sidemenu.sidemenu--type2 -->\n    <button class="sidemenu-expand" id="sidebarExpand"></button>\n    <main class="main-content">\n      <!-- SLOT: page-header (Variant 3) -->\n      <!-- SLOT: reports-input-row -->\n      <!-- SLOT: classic-tab [chart ONLY] -->\n      <div class="table-scroll-area">\n        <!-- SLOT: actionbar Type 8 -->\n        <!-- SLOT: data-table-wrap -->\n      </div>\n    </main>\n  </div>\n</div>\n<script src="${CDN_BASE}/components/lib/echarts.min.js"></script>\n<script src="${CDN_BASE}/components/echarts-elegant-theme.js"></script>\n<script src="${CDN_BASE}/components/echarts-widget.js"></script>\n<script src="${CDN_BASE}/components/topnavbar.js"></script>\n<script src="${CDN_BASE}/components/sidemenu.js"></script>\n<script src="${CDN_BASE}/components/classic-tab.js"></script>\n<script src="${CDN_BASE}/components/line-tab.js"></script>\n<script src="${CDN_BASE}/components/table.js"></script>\n<script src="${CDN_BASE}/components/drawer.js"></script>\n<script src="${CDN_BASE}/components/rpt-chart-floater.js"></script>\n<script src="${CDN_BASE}/components/icon-engine.js"></script>\n</body></html>`,
  D: `<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" />\n  <title><!-- TITLE --> — Log360 Cloud</title>\n  <link rel="stylesheet" href="${CDN_BASE}/components/tokens.css" />\n  <link rel="stylesheet" href="${CDN_BASE}/components/layout.css" />\n  <link rel="stylesheet" href="${CDN_BASE}/components/topnavbar.css" />\n  <link rel="stylesheet" href="${CDN_BASE}/components/line-tab.css" />\n  <link rel="stylesheet" href="${CDN_BASE}/components/header.css" />\n  <link rel="stylesheet" href="${CDN_BASE}/components/widget.css" />\n  <link rel="stylesheet" href="${CDN_BASE}/components/table.css" />\n  <link rel="stylesheet" href="${CDN_BASE}/components/drawer.css" />\n  <link rel="stylesheet" href="${CDN_BASE}/components/responsive.css" />\n  <style>html,body{height:100%;margin:0;overflow:hidden;}.app-shell{height:100vh;display:flex;flex-direction:column;overflow:hidden;}.app-body{flex:1;display:flex;overflow:hidden;min-height:0;}.main-content{flex:1;display:flex;flex-direction:column;overflow:hidden;min-height:0;padding:0;}.split-layout{display:flex;flex:1;min-height:0;}.left-panel{flex:1;overflow-y:auto;padding:0 16px 24px;}.right-panel{width:380px;border-left:1px solid #E9E9E9;display:flex;flex-direction:column;}</style>\n</head>\n<body>\n<div class="app-shell">\n  <!-- SLOT: TopNavBar -->\n  <div class="app-body"><main class="main-content">\n    <!-- SLOT: line-tab -->\n    <div class="line-tab__body" style="flex:1;display:flex;flex-direction:column;min-height:0;">\n      <div class="split-layout">\n        <div class="left-panel"><!-- SLOT --></div>\n        <div class="right-panel"><!-- SLOT --></div>\n      </div>\n    </div>\n  </main></div>\n</div>\n<script src="${CDN_BASE}/components/lib/echarts.min.js"></script>\n<script src="${CDN_BASE}/components/echarts-elegant-theme.js"></script>\n<script src="${CDN_BASE}/components/topnavbar.js"></script>\n<script src="${CDN_BASE}/components/line-tab.js"></script>\n</body></html>`,
};

const CHECKLIST: Record<string, string> = {
  C: "# Pre-Commit Checklist — Shell C (Reports)\n\n## STRUCTURE\n[ ] .classic-tab has exactly ONE direct child .classic-tab__body\n[ ] .table-scroll-area is a SIBLING of .classic-tab\n[ ] Every .drawer paired with .drawer-backdrop\n[ ] .reports-quicklink is direct child of .app-shell\n\n## CSS LINKS\n[ ] tokens, layout, topnavbar, line-tab, classic-tab, rpt-chart-floater, drawer, form-input, form-dropdown linked\n\n## VARIANTS\n[ ] Reports actionbar = Type 8\n[ ] Header = Variant 3\n[ ] Reports quicklink uses .line-tab--quicklink",
  A: "# Pre-Commit Checklist — Shell A (Dashboard)\n\n## STRUCTURE\n[ ] Only .dash scrolls\n[ ] stat-row: max 4 stat cards\n[ ] tile-grid: max 3 tiles\n[ ] Hybrid widgets: max 3 per dash__row",
  B: "# Pre-Commit Checklist — Shell B (Settings)\n\n## STRUCTURE\n[ ] sidemenu_variant1 used\n[ ] ActionBar type 1-7 ONLY\n[ ] classic-tab has __body with __content panels",
};

const ANTI_PATTERNS = `# Known Bottlenecks & Anti-Patterns\n\n| # | Symptom | Root cause | Fix |\n|---|---|---|---|\n| 1 | Reports quicklink plain text | line-tab.css not linked | Add line-tab.css link |\n| 2 | ActionBar has view-toggle on Reports | Using Type 1-7 | Reports = Type 8 |\n| 3 | Table columns uneven | Hard-coded col widths | Checkbox=32px, rest=no width |\n| 4 | Drawer body flush | style="padding:0" | Use --no-pad modifier |\n| 5 | classic-tab in drawer | Used classic-tab inside drawer | Use line-tab inside drawers |\n| 6 | Tabs switch but no change | Custom data-*-tab attributes | Use standard data-tab only |\n| 7 | Dropdown 432px in drawer | flex:1 override | Delete override, use 280px fixed |\n| 8 | table-scroll-area gone | Missing min-height:0 | Every ancestor: flex:1; min-height:0; overflow:hidden |`;

const SETUP_PROJECT = `# Elegant 1.0 — Build Instructions

## How This Works
You are connected to the Elegant Agent MCP server. ALL component HTML, wiki documentation, page blueprints, icons, and screenshots are available ONLY through the MCP tools listed below. There are NO local files to read — everything comes from this server.

## CDN Base URL
\`\`\`
${CDN_BASE}
\`\`\`

## Workflow (follow this order)
1. ✅ You already called setup_project — good
2. Call \`get_page_blueprint(page)\` — get exact layout for the target page
3. Call \`get_screenshot(query)\` — see what the real page looks like
4. Call \`get_recipe(shell)\` — get shell type (A/B/C/D) instructions
5. Call \`get_shell(shell)\` — get the HTML skeleton with CDN links
6. Call \`get_component(name)\` — get HTML for each component you need
7. Call \`get_topnavbar()\` — get the complete TopNavBar HTML
8. Call \`get_chart_snippet(chart_type)\` — get chart JS code
9. Write a SINGLE index.html file — that's your only output

## Output Rules
- Output = **ONE index.html file** — nothing else
- ALL CSS via CDN: \`<link href="${CDN_BASE}/components/FILENAME.css">\`
- ALL JS via CDN: \`<script src="${CDN_BASE}/components/FILENAME.js">\`
- ALL icons via CDN: \`<img src="${CDN_BASE}/assets/icons/ICON.svg">\`
- Logo: \`<img src="${CDN_BASE}/assets/icons/logo-log360.svg">\`
- Fonts load automatically via tokens.css

## Available CSS Files
tokens.css, layout.css, topnavbar.css, sidemenu.css, header.css, classic-tab.css, line-tab.css, table.css, table-type2.css, form-input.css, form-dropdown.css, drawer.css, rpt-chart-floater.css, widget.css, echarts-widget.css, note-container.css, notification-banner.css, responsive.css

## Available JS Files
topnavbar.js, sidemenu.js, classic-tab.js, line-tab.js, table.js, form-input.js, form-dropdown.js, drawer.js, rpt-chart-floater.js, widget.js, echarts-widget.js, echarts-elegant-theme.js, icon-engine.js, notification-banner.js, lib/echarts.min.js

## ⛔ DO NOT
- Do NOT search for or read any local files — no .md files, no data/ folders, no local HTML. Everything comes from MCP tools
- Do NOT create folders or copy files
- Do NOT write inline CSS for component styles
- Do NOT write inline SVG when an icon file exists
- Do NOT look for reference HTML in the user's workspace — use get_page_blueprint and get_screenshot instead
- ALL data you need comes from the MCP tools above — you have everything`;

const WIKI_FILES = [
  "INDEX.md","actionbar.md","app_shells.md","button-row.md","classic_tab.md",
  "data_table_type1.md","data_table_type2.md","design_tokens.md","drawer.md",
  "echarts-elegant-theme.md","echarts-widget.md","form_dropdown.md","form_input.md",
  "header.md","icon-engine.md","icons.md","layout_shell.md","line_tab.md",
  "note-container.md","predefined_charts.md","rpt-chart-floater.md",
  "sidemenu_variant1_settings.md","sidemenu_variant2_reports.md","stat_card.md",
  "tile_widgets.md","topnavbar.md","widget.md",
];

const ALL_ICONS = [
  "gauge-center.svg","icon-ab-arrow-left.svg","icon-ab-arrow-right.svg","icon-ab-column-new.svg",
  "icon-ab-column.svg","icon-ab-delete.svg","icon-ab-disable.svg","icon-ab-enable.svg",
  "icon-ab-more.svg","icon-ab-plus.svg","icon-ab-search.svg","icon-ab-table-view.svg",
  "icon-ab-toggle-view.svg","icon-action-approve.svg","icon-action-delete.svg","icon-action-edit.svg",
  "icon-action-more.svg","icon-actionbar-filter.svg","icon-actionbar-refresh.svg",
  "icon-actionbar-search.svg","icon-admin-settings.svg","icon-agent.svg",
  "icon-alert-avatar-small.svg","icon-alert-bell.svg","icon-alert-calendar.svg",
  "icon-alert-clock.svg","icon-alert-critical.svg","icon-alert-hourglass.svg","icon-alert-info.svg",
  "icon-alert-schedule.svg","icon-alert-success.svg","icon-alert-warning.svg",
  "icon-analysis-bell.svg","icon-analysis-sev-orange.svg","icon-analysis-sev-yellow.svg",
  "icon-analysis-sort.svg","icon-approve.svg","icon-apps-grid.svg","icon-avatar-person.svg",
  "icon-avatar-unassigned.svg","icon-back-arrow.svg","icon-back-button.svg",
  "icon-badge-high-risk.svg","icon-bot.svg","icon-btn-chevron-right-dark.svg",
  "icon-btn-chevron-right.svg","icon-btn-help-dark.svg","icon-btn-help.svg",
  "icon-btn-plus-dark.svg","icon-btn-plus.svg","icon-bulb.svg","icon-calendar-input.svg",
  "icon-calendar.svg","icon-checkbox-checked.svg","icon-checkbox-indeterminate.svg",
  "icon-checkbox.svg","icon-chevron-down.svg","icon-chevron-left.svg","icon-chevron-right.svg",
  "icon-close.svg","icon-dd-calendar.svg","icon-dd-settings.svg","icon-delete.svg",
  "icon-dropdown-chevron.svg","icon-edit.svg","icon-endpoint.svg","icon-export-history.svg",
  "icon-eye-hide.svg","icon-eye-show.svg","icon-filter.svg","icon-gauge-arc.svg",
  "icon-gauge-pointer.svg","icon-grip-vertical.svg","icon-help-circle.svg","icon-help.svg",
  "icon-inc-created-by.svg","icon-inc-severity-critical.svg","icon-inc-sla-clock.svg",
  "icon-inc-sort.svg","icon-incident.svg","icon-info.svg","icon-input-calendar.svg",
  "icon-input-filter.svg","icon-input-plus.svg","icon-iw-arrow-down.svg","icon-iw-close.svg",
  "icon-iw-export.svg","icon-iw-minimize.svg","icon-iw-plus.svg","icon-iw-workbench.svg",
  "icon-layout-template.svg","icon-linetab-settings.svg","icon-menu.svg","icon-metric-clock.svg",
  "icon-metric-trend-up.svg","icon-more.svg","icon-notif-close.svg","icon-notif-error.svg",
  "icon-notif-info.svg","icon-notif-success.svg","icon-notif-warning.svg","icon-notification.svg",
  "icon-number-down.svg","icon-number-up.svg","icon-os-linux.svg","icon-os-windows.svg",
  "icon-pin-attention.svg","icon-pin-critical.svg","icon-pin-trouble.svg","icon-plus.svg",
  "icon-ql-arrow.svg","icon-question.svg","icon-radio-checked.svg","icon-radio-unchecked.svg",
  "icon-refresh.svg","icon-report-help.svg","icon-report-settings.svg","icon-rpt-edit.svg",
  "icon-rpt-export.svg","icon-rpt-more.svg","icon-rpt-schedule.svg","icon-search-close.svg",
  "icon-search-settings.svg","icon-search.svg","icon-security.svg","icon-share.svg",
  "icon-sidemenu-settings.svg","icon-simple-filter.svg","icon-slider-close.svg","icon-sm-bulb.svg",
  "icon-sm-chevron-down.svg","icon-sm-chevron-right.svg","icon-sm-clock.svg","icon-sm-collapse.svg",
  "icon-sm-manage.svg","icon-status-disabled.svg","icon-status-info-high.svg",
  "icon-status-info-low.svg","icon-status-info-medium.svg","icon-status-not-started.svg",
  "icon-status-on-hold.svg","icon-status-partial-success.svg","icon-status-partial.svg",
  "icon-status-skipped.svg","icon-status-stopped.svg","icon-status-success.svg",
  "icon-status-waiting.svg","icon-status-warning.svg","icon-summary-bell.svg",
  "icon-system-settings.svg","icon-t2-ata.svg","icon-t2-avatar-unassigned.svg","icon-t2-avatar.svg",
  "icon-t2-calendar.svg","icon-t2-playbook.svg","icon-t2-rem-executing.svg",
  "icon-t2-rem-failed.svg","icon-t2-rem-success.svg","icon-t2-severity-critical.svg",
  "icon-t2-severity-medium.svg","icon-t2-thumbsup.svg","icon-t2-zia.svg",
  "icon-tab-ad-overview.svg","icon-tab-add-custom.svg","icon-tab-anomaly-trends.svg",
  "icon-tab-apache-overview.svg","icon-tab-aws-overview.svg","icon-tab-cloud-protection.svg",
  "icon-tab-entities.svg","icon-tab-event-overview.svg","icon-tab-microsoft-365.svg",
  "icon-tab-microsoft-dynamics.svg","icon-tab-network-overview.svg","icon-tab-pgsql-overview.svg",
  "icon-tab-salesforce-overview.svg","icon-tab-sql-server-overview-2.svg",
  "icon-tab-sql-server-overview.svg","icon-tag-close.svg","icon-tile-muted.svg",
  "icon-tile-sev-attention.svg","icon-tile-sev-critical.svg","icon-tile-sev-trouble.svg",
  "icon-tile-trend-down.svg","icon-tile-trend-up.svg","icon-tile-zia.svg",
  "icon-troubleshoot.svg","icon-upload.svg","icon-user-avatar.svg","icon-view-type.svg",
  "icon-widget-maximize.svg","icon-widget-notification.svg","icon-widget-schedule.svg",
  "icon-widget-sort.svg","icon-zia.svg","logo-log360.svg",
];

const SCREENSHOTS: string[] = [
"ALERTS TAB/[Main] Alerts - Main View Severity Stat Cards Table with Critical Trouble Attention Counts.png",
"ALERTS TAB/[Main] Alerts - Manage Profiles Table with Alert Types Severity Log Source Actions.png",
"ALERTS TAB/[Interaction] Alerts - Alert Detail Drawer EXE Process Executed with MITRE and Ticket Status.png",
"COMPLIANCE TAB/[Main] Compliance - Landing Page Grid Row 1 PCI-DSS HIPAA FISMA GDPR SOX ISO27001.png",
"COMPLIANCE TAB/[Main] Compliance - PCI-DSS User Logons Report Bar Chart Sidemenu Table.png",
"DASHBOARD TAB/[Main] Events Overview - Main Dashboard with Log Trend and Severity Charts.png",
"DASHBOARD TAB/[Main] Network Overview - Traffic Trend and Top Network Devices.png",
"REPORTS TAB/[Main] Reports - Servers & Workstation - Windows - All Events Table View with Line Chart.png",
"REPORTS TAB/[Main] Reports - Servers & Workstation - Windows - Sidemenu Startup Events Expanded.png",
"REPORTS TAB/[Main] Reports - Servers & Workstation - Unix - All Events Line Chart Severity Table.png",
"SEARCH TAB/[Main] Search - Results Page Bar Chart Severity Emergency Log List View.png",
"Security TAB/[Main] Security - Analytics Dashboard Detection Pipeline MITRE Tactics Trends.png",
"Settings TAB/[Main] Settings - Device Management Windows Devices Table IP Agent Status.png",
"Settings TAB/[Main] Settings - License Page Storage Stats Feature Table Usage Bars.png",
"CLOUD PROTECTION TAB/[Main] Cloud Protection - Application Insight Dashboard Traffic Trend Shadow Apps Banned Apps Charts.png",
];

const SCREENSHOT_BASE = `https://raw.githubusercontent.com/${PRIVATE_REPO}/main/data/LOG360%20Cloud%20Full%20Product%20Bulk%20Screenshot_`;

const PAGE_BLUEPRINTS: Record<string, string> = {
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
OS dropdown: Unix/Linux (selected)
Sections: All Events (highlighted), Important Events, SU Logons, Logon Reports >, Failed Logon Reports >, System Events >, Terminal Service Session >, FTP Server Reports >
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
Columns: [checkbox] | Source | Log Source | Severity | Event ID | Display Name | Source | Timestamp`,

"dashboard": `# Blueprint: Dashboard — Events Overview (Shell A)

## Layout (Shell A)
TopNavBar → data-active-tab="Home"
QuickLink bar (line-tab): Events Overview (selected) | Network Overview | AD Overview | AWS Overview | Microsoft 365 | File Monitoring | Incident Overview | PgSQL Overview | SQL Server Overview | AD Summary | Threat Analytics | Cloud Protection | Custom Tab 1
No sidemenu. Full-width scrollable main content. Date range picker in top-right.

## Stat Cards Row (4 cards, horizontal)
1. All Events: "4489K" with delta "▲ 4441,946 (3406.52%)" — blue icon
2. Windows Events: "3302K" with sub-stats
3. Syslog Events: "11444" with delta "▲ 9942 (471.63%)"
4. All Log Sources: "18" with link "View All Log Sources"

## Widget Grid (2 columns, 3 rows)
Row 1: "Log Trend" area chart | "Recent Alerts" scrollable list
Row 2: "Security Events" table | "Top 5 Log Sources" donut chart
Row 3: "Windows Severity Events" bar chart | "Syslog Severity Events" bar chart

## Key Rules
- Each widget uses the widget component
- Charts use ElegantEChart.* calls
- Incident Workbench floating button at bottom-right`,

"dashboard-network": `# Blueprint: Dashboard — Network Overview (Shell A)
Same as Events Overview but "Network Overview" tab selected in quicklink bar.
Stat cards + widget grid for network-specific data.`,

"alerts": `# Blueprint: Alerts (Shell D — no sidemenu)

## Layout
TopNavBar → data-active-tab="Alerts"
Line-tab: Alerts (selected) | Incident
No sidemenu — full-width content. Date range picker in top-right.
Right actions: Export As ▾ | Add Alert Profile | Manage Profiles

## Stat Cards Row (4 horizontal)
1. Critical Alerts: "184185" — red
2. Trouble Alerts: "6942" — orange
3. Attention Alerts: "222" — yellow
4. All Alerts: "191349" — blue

## Table (NO chart — directly below stat cards)
ActionBar: pagination "1-10 of 191349" [< >] [10 ▾] | Add/Remove Columns
Columns: [checkbox] | Severity | Profile Name | Time ▾ | Alert Message Format | Log Source

## Key Rules
- NO chart on this page — stat cards go directly to table
- Severity column shows colored labels
- Incident Workbench floating button at bottom-right`,

"alerts-manage-profiles": `# Blueprint: Alerts > Manage Profiles
Same TopNavBar + line-tab. Table: checkbox | Alert Type | Severity | Message | Log Source | Action`,

"compliance": `# Blueprint: Compliance — Landing Page (no sidemenu)

## Layout
TopNavBar → data-active-tab="Compliance"
Search bar at top-left | "Manage Compliance" link top-right
Grid (3 columns): each card has icon + title + description + "View Reports" button

### Row 1: PCI-DSS | HIPAA | FISMA
### Row 2: GDPR | SOX | ISO 27001:2013
### Row 3+: more compliance standards`,

"compliance-report": `# Blueprint: Compliance > PCI-DSS > Report Page (Shell C)

## Layout (Shell C)
Line-tab top: PCI-DSS (selected) | HIPAA | FISMA | GDPR | SOX | ...
Sidemenu Type 2: ← PCI-DSS back + accordion sections (Windows Logon Reports expanded)

## Page Header
"← PCI-DSS" back link + Title: "User Logons"
Right: Export As ▾ | date range

## Chart Area (single horizontal bar chart — NO classic-tab toggle)

## Table
ActionBar: list/table view toggle | pagination "1-10 of 299" [< >] [10 ▾] | columns
Columns: [checkbox] | Time | Log Source | User Name | Remote Device | Remote Domain | Domain | Logon Type | Process Id`,

"search": `# Blueprint: Search (custom layout)

TopNavBar → data-active-tab="Search" | No sidemenu
Search box: query input + Basic/Advanced tabs + Search button
Results: bar chart + list view (NOT table) with dense key-value fields per row
ActionBar: Incident button | pagination | Add/Remove Fields`,

"security": `# Blueprint: Security — Analytics Dashboard (Shell A variant)

TopNavBar → data-active-tab="Security" | No sidemenu

## Stat Cards (4): All Rules 81952 | Critical 48968 | Trouble 16247 | Attention 16737

## Widget Grid (3 columns)
Row 1: Detection Pipeline (stacked bar) | Detection by Tactics (radar/MITRE) | Recent Detections (list)
Row 2: Top 5 Users (bar) | Top 5 Log Sources (hbar)
Row 3: Top 10 Detections by Rules (bar) | Detection Trends (line, 3 series)

## Key Rules
- MITRE ATT&CK radar chart
- Color coding: Critical=#E24C4C, Trouble=#F5A623, Attention=#F8D648`,

"cloud-protection": `# Blueprint: Cloud Protection (Shell A variant)

Line-tab: Application Insight (selected) | User Insight | Date picker

## Stat Cards (4): Total Traffic 298.69GB | Total Request 50416 | Discovered Apps 28 | Shadow Apps 10

## Widget Grid (3 columns)
Row 1: Total Traffic Trend (area) | Top Cloud Apps (donut) | Top Banned Apps (table)
Row 2: Shadow Apps (bar) | Download Size (donut) | Upload Size (hbar)
Row 3: Top Categories (hbar) | Low Reputed Apps (bar)`,

"settings": `# Blueprint: Settings — Device Management (Shell B)

## Layout (Shell B)
TopNavBar → data-active-tab="Settings"
Sidemenu Type 1 (settings variant — icons, NOT flat accordion):
- 2 icon tabs: Configuration | Admin
- Sections with icons: Log Source Configuration (expanded: Devices, Applications, Import Logs, Manage Cloud Sources, File Integrity Monitoring), Cloud Protection Settings

## Page Header: "Device Management"

## Line Tab (below header)
Tabs: Windows Devices (7) (selected) | Syslog Devices (1) | Other Devices (7)

## Input Row
Select Category: [All Devices ▾] | "Configure domain/workgroups" link | [+ Add Device(s)] button

## Table
ActionBar: search | filter | action icons | pagination "1-10 of 64" [< >] [10 ▾] | view toggle
Columns: [checkbox] | Actions | Device ▾ | Show IP | Agent | Last Message Time ▾ | Next Scan On | Monitoring Interval | Log Source Group | Status
- Actions: 3 small icon buttons per row
- Status: "Listening for logs" (green), "Disabled" (red)`,

"settings-license": `# Blueprint: Settings — License Page (Shell B)
Same settings shell. Storage stats, feature table with usage bars, plan details.`,

"incident-workbench": `# Blueprint: Incident Workbench (floating panel)
Bottom-right panel on every page. Shows investigation tools (IP Threat Intel, Process Hunting, User Activity Overview).`,
};

/* ══════════════════════════════════════════════════════
   MCP HANDLER — Vercel Serverless (Streamable HTTP)
══════════════════════════════════════════════════════ */

const handler = createMcpHandler(
  (server) => {
    /* 1. setup_project */
    server.tool("setup_project", "⚠️ CALL THIS FIRST before any other tool. Returns the complete build instructions, CDN URLs, available CSS/JS files, and workflow steps. You MUST follow the workflow it returns. Output is always a SINGLE index.html file with all assets loaded from CDN.", { feature_name: z.string().describe("Name for the page being built (e.g. 'windows-startup', 'dashboard', 'alerts'). Used only as a label — no folders are created.") }, async ({ feature_name }) => {
      const name = feature_name.replace(/[^a-zA-Z0-9_-]/g, "-").toLowerCase();
      return { content: [{ type: "text" as const, text: SETUP_PROJECT.replace(/your-feature-name/g, name).replace(/\$FEATURE/g, name) }] };
    });

    /* 2. get_component */
    server.tool("get_component", "Returns the canonical HTML for an Elegant 1.0 UI component. All asset paths are pre-filled with CDN URLs. Copy this HTML directly into your index.html. Do NOT search for component files locally — this tool is the only source.", { name: z.enum(Object.keys(COMPONENT_MAP) as [string, ...string[]]) }, async ({ name: n }) => {
      const entry = COMPONENT_MAP[n];
      if (!entry) return { content: [{ type: "text" as const, text: `Unknown component: ${n}.\n\nAvailable components (use list_components for full list):\n${Object.keys(COMPONENT_MAP).join(", ")}` }] };
      const content = await readWikiFile(entry.file);
      if (!entry.section) return { content: [{ type: "text" as const, text: content }] };
      const html = rewriteAssetPaths(extractHtmlBlock(content, entry.section));
      return { content: [{ type: "text" as const, text: `## ${n}\nCDN: ${CDN_BASE}\nAll <img src> and <link href> paths below use the CDN. Copy as-is.\n\n\`\`\`html\n${html}\n\`\`\`` }] };
    });

    /* 3. get_recipe */
    server.tool("get_recipe", "Returns the full build recipe for a Shell type: required components, CSS load order, scroll model, and page structure. A=Dashboard, B=Settings, C=Reports, D=Split-Panel.", { shell: z.enum(["A","B","C","D"]) }, async ({ shell }) => {
      return { content: [{ type: "text" as const, text: RECIPES[shell] || `Unknown shell: ${shell}` }] };
    });

    /* 4. get_shell */
    server.tool("get_shell", "Returns a complete HTML skeleton (<!DOCTYPE> to </html>) for Shell A/B/C/D with all CSS/JS CDN links pre-filled and SLOT comments where you insert components. Use this as your starting template.", { shell: z.enum(["A","B","C","D"]) }, async ({ shell }) => {
      const s = SHELLS[shell];
      return { content: [{ type: "text" as const, text: s ? `## Shell ${shell} — Ready-to-use HTML skeleton\nAll CSS/JS links point to CDN: ${CDN_BASE}\nAll icon <img src> must also use: ${CDN_BASE}/assets/icons/ICON.svg\n\n\`\`\`html\n${s}\n\`\`\`` : `Unknown: ${shell}` }] };
    });

    /* 5. get_chart_snippet */
    server.tool("get_chart_snippet", "ElegantEChart HTML+JS snippet.", { chart_type: z.enum(["line","area","bar","hbar","donut","stacked"]) }, async ({ chart_type }) => {
      const s = CHART_SNIPPETS[chart_type];
      return { content: [{ type: "text" as const, text: s ? `## ${chart_type} Chart\n\n${s}` : `Unknown: ${chart_type}` }] };
    });

    /* 6. get_checklist */
    server.tool("get_checklist", "Pre-commit checklist for a shell type.", { shell: z.enum(["A","B","C"]) }, async ({ shell }) => {
      return { content: [{ type: "text" as const, text: CHECKLIST[shell] || `No checklist for ${shell}` }] };
    });

    /* 7. get_anti_patterns */
    server.tool("get_anti_patterns", "Known bottlenecks and fixes.", {}, async () => {
      return { content: [{ type: "text" as const, text: ANTI_PATTERNS }] };
    });

    /* 8. list_components */
    server.tool("list_components", "Lists all component names you can pass to get_component(). Grouped by category.", {}, async () => {
      const grouped: Record<string, string[]> = {
        Navigation: ["topnavbar","sidemenu-settings","sidemenu-reports","line-tab","line-tab-quicklink"],
        Header: ["header-v1","header-v2","header-v3"],
        Tabs: ["classic-tab","line-tab"],
        Content: ["data-table","data-table-type2","widget","stat-card","button-row","note-container"],
        ActionBar: ["actionbar-type1","actionbar-type2","actionbar-type8"],
        Reports: ["rpt-chart-floater"],
        Overlay: ["drawer-sm","drawer-md","drawer-lg"],
        Forms: ["form-text","form-textarea","form-checkbox","form-radio","form-dropdown"],
        Tokens: ["design-tokens"],
      };
      const text = Object.entries(grouped).map(([g, ns]) => `**${g}**\n${ns.map(n => `  - ${n}`).join("\n")}`).join("\n\n");
      return { content: [{ type: "text" as const, text }] };
    });

    /* 9. search_wiki */
    server.tool("search_wiki", "Full-text search across all component wiki documentation. Use this to find where a CSS class, rule, or pattern is documented. Do NOT search local files — this tool searches the complete wiki.", { query: z.string(), max_results: z.number().optional() }, async ({ query, max_results }) => {
      const q = query.toLowerCase();
      const max = max_results || 20;
      const results: string[] = [];
      for (const file of WIKI_FILES) {
        const content = await readWikiFile(file);
        if (content.startsWith("[")) continue;
        const lines = content.split("\n");
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].toLowerCase().includes(q)) {
            const ctx = [lines[i-1]?.trim(), `→ ${lines[i].trim()}`, lines[i+1]?.trim()].filter(Boolean).join("\n");
            results.push(`**${file}** line ${i+1}:\n${ctx}`);
            if (results.length >= max) break;
          }
        }
        if (results.length >= max) break;
      }
      return { content: [{ type: "text" as const, text: results.length ? `Found ${results.length} result(s):\n\n${results.join("\n\n---\n\n")}` : `No results for "${query}"` }] };
    });

    /* 10. get_icons */
    server.tool("get_icons", "Returns SVG icon filenames with full CDN URLs. Use filter to search by name. There are 195 icons available. Do NOT search for icons locally.", { filter: z.string().optional().describe("Substring to filter icon names (e.g. 'action', 'ab-', 'rpt', 'chevron')") }, async ({ filter }) => {
      let icons = ALL_ICONS;
      if (filter) { const f = filter.toLowerCase(); icons = icons.filter(i => i.toLowerCase().includes(f)); }
      if (!icons.length) return { content: [{ type: "text" as const, text: `No icons for "${filter}"` }] };
      return { content: [{ type: "text" as const, text: icons.map(i => `${i}  →  ${CDN_BASE}/assets/icons/${i}`).join("\n") }] };
    });

    /* 11. get_full_wiki_file */
    server.tool("get_full_wiki_file", "Returns the COMPLETE content of a wiki .md file. Use only when get_component isn't enough (e.g. you need CSS details or variant rules). Do NOT read wiki files from the local filesystem — this tool fetches them from the server.", { filename: z.string().describe("Wiki filename (e.g. 'drawer.md', 'form_input.md', 'header.md')") }, async ({ filename }) => {
      return { content: [{ type: "text" as const, text: rewriteAssetPaths(await readWikiFile(filename)) }] };
    });

    /* 12. get_topnavbar */
    server.tool("get_topnavbar", "Returns the complete TopNavBar HTML with all icon paths pre-filled as CDN URLs. Includes logo, navigation tabs, search, notification, and avatar. Copy directly into your HTML.", {}, async () => {
      const content = await readWikiFile("topnavbar.md");
      const html = rewriteAssetPaths(extractHtmlBlock(content, "Complete HTML"));
      return { content: [{ type: "text" as const, text: `## TopNavBar — Complete HTML (copy as-is)\nCDN: ${CDN_BASE}\nLogo: ${CDN_BASE}/assets/icons/logo-log360.svg\nAll icon paths are CDN URLs. Do NOT replace with inline SVG.\n\n\`\`\`html\n${html}\n\`\`\`` }] };
    });

    /* 13. get_page_blueprint */
    server.tool("get_page_blueprint", "Returns the exact layout specification for a real Log360 Cloud page — component hierarchy, column names, data patterns, chart config, sidemenu items. This is your ONLY reference for what the page looks like. Do NOT look for screenshots or HTML files locally.", { page: z.enum(Object.keys(PAGE_BLUEPRINTS) as [string, ...string[]]) }, async ({ page }) => {
      const bp = PAGE_BLUEPRINTS[page];
      if (!bp) return { content: [{ type: "text" as const, text: `Unknown page: ${page}.\n\nAvailable pages:\n${Object.keys(PAGE_BLUEPRINTS).join("\n")}` }] };
      return { content: [{ type: "text" as const, text: bp + `\n\n---\nCDN: ${CDN_BASE}\nAfter reading this blueprint, call get_shell() for the HTML skeleton, then get_component() for each component listed above.` }] };
    });

    /* 14. get_screenshot */
    server.tool("get_screenshot", "Searches 217 real product screenshots by keywords. Returns image URLs showing exact layouts, colors, and spacing. Use this for visual reference instead of looking for local files.", { query: z.string().describe("Search keywords (e.g. 'windows startup', 'alerts main', 'dashboard', 'settings device')"), max_results: z.number().optional().describe("Max results, default 5") }, async ({ query, max_results }) => {
      const keywords = query.toLowerCase().split(/[\s,]+/).filter(Boolean);
      const max = max_results || 5;
      const scored = SCREENSHOTS.map(s => {
        let score = 0;
        const lower = s.toLowerCase();
        for (const kw of keywords) { if (lower.includes(kw)) score++; }
        return { path: s, score };
      }).filter(r => r.score > 0).sort((a, b) => b.score - a.score).slice(0, max);
      if (!scored.length) return { content: [{ type: "text" as const, text: `No screenshots for "${query}". Try broader keywords.\nAvailable tabs: ALERTS, COMPLIANCE, DASHBOARD, REPORTS, SEARCH, Security, Settings, CLOUD PROTECTION.\nExample: "windows startup", "alerts main", "dashboard events", "settings device"` }] };
      const lines = scored.map((r, i) => {
        const encoded = r.path.split('/').map(p => encodeURIComponent(p)).join('/');
        return `${i+1}. **${r.path}**\n   URL: ${SCREENSHOT_BASE}/${encoded}`;
      });
      return { content: [{ type: "text" as const, text: `Found ${scored.length} screenshot(s) for "${query}":\n\n${lines.join("\n\n")}\n\nThese are real product screenshots. Match the layout exactly.` }] };
    });
  },
  {
    serverInfo: { name: "elegant-agent-mcp", version: "1.0.0" },
    capabilities: {
      tools: {},
    },
  },
  { basePath: "/api", disableSse: true },
);

export { handler as GET, handler as POST, handler as DELETE };
