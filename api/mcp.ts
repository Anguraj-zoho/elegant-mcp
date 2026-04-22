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
  A: `# Recipe A — Dashboard (Shell A)\n\nPage types: Home dashboard, Security overview, Cloud Protection, Threat Hub.\n\n## Required wiki files (open ALL before writing HTML)\n1. app_shells.md — Shell A tree\n2. layout_shell.md — base HTML skeleton\n3. design_tokens.md — CSS variables\n4. topnavbar.md — TopNavBar (data-active-tab="Home")\n5. line_tab.md — sub-tabs + dashboard variant actions\n6. header.md — Variant 1 (title + help icon)\n7. widget.md — widget cards (10 patterns)\n8. stat_card.md — KPI stat cards\n9. tile_widgets.md — tile JS API\n10. predefined_charts.md — ElegantEChart.* API\n11. echarts-widget.md — chart engine\n12. echarts-elegant-theme.md — theme\n13. icons.md — icon lookup\n14. form_input.md — filter inputs\n15. form_dropdown.md — filter dropdowns\n16. drawer.md — detail drawers\n17. button-row.md — action buttons\n\n## CSS load order\ntokens → layout → topnavbar → line-tab → widget → table → responsive → notification-banner\n\n## Scroll model\nONLY .dash scrolls (flex:1; overflow-y:auto). Everything above is fixed.\n\n## Shell A structure\n\`\`\`\ndiv.app-shell (height:100vh; flex:column)\n ├── header.topnavbar\n ├── div.line-tab (h:40px) + div.line-tab__actions\n ├── div.toolbar [OPTIONAL]\n └── div.dash (bg:#F5F5F5; flex:1; overflow-y:auto)\n      └── div.dash__grid\n           ├── div.dash__row.stat-row   — max 4 stat cards\n           ├── div.tile-grid            — max 3 tiles\n           └── div.dash__row            — hybrid widgets (max 3/row)\n\`\`\``,
  B: `# Recipe B — Settings (Shell B)\n\nPage types: Settings tab, Admin config, Device Management.\n\n## Required wiki files\n1-15: app_shells (Shell B), layout_shell, design_tokens, topnavbar (Settings), sidemenu_variant1_settings, header, classic_tab, data_table_type1, actionbar (Types 1-7), form_input, form_dropdown, drawer, button-row, note-container, icons\n\n## CSS load order\ntokens → layout → topnavbar → sidemenu → header → classic-tab → table → form-input → form-dropdown → drawer → responsive → notification-banner\n\n## Shell B structure\n\`\`\`\ndiv.app-shell\n ├── header.topnavbar\n └── div.app-body\n      ├── aside.sidemenu (w:240px)\n      └── main.main-content\n           ├── div.page-header\n           └── div.classic-tab\n                ├── div.classic-tab__headers\n                └── div.classic-tab__body → [actionbar + data-table]\n\`\`\``,
  C: `# Recipe C — Reports (Shell C)\n\nPage types: Reports tab, Compliance pages, any sidebar report tree + chart + table.\n\n## Required wiki files\n1-17: app_shells (Shell C), layout_shell, design_tokens, topnavbar (Reports), sidemenu_variant2_reports, header (Variant 3), classic_tab, rpt-chart-floater, predefined_charts + echarts-widget + echarts-elegant-theme, form_input, form_dropdown, data_table_type1, actionbar (Type 8), drawer, button-row, note-container, icons\n\n## Critical Shell C assembly rules\n1. .reports-quicklink is a DIRECT CHILD of .app-shell\n2. .classic-tab contains ONLY the chart area\n3. .table-scroll-area is a SIBLING of .classic-tab, NOT a child\n4. ActionBar Type 8 MANDATORY\n5. Header Variant 3 MANDATORY\n\n## Shell C structure\n\`\`\`\ndiv.app-shell\n ├── header.topnavbar (data-active-tab="Reports")\n ├── div.reports-quicklink → div.line-tab.line-tab--quicklink\n └── div.app-body\n      ├── aside.sidemenu.sidemenu--type2\n      └── main.main-content\n           ├── div.page-header (Variant 3)\n           ├── div.reports-input-row.reports-input-row--type1\n           ├── div.classic-tab [chart ONLY]\n           └── div.table-scroll-area\n                ├── div.actionbar (Type 8, sticky)\n                └── div.data-table-wrap → table.data-table\n\`\`\``,
  D: `# Recipe D — Split Panel (Shell D)\n\nPage types: AI Investigation, Incident Detail/Workbench, Playbook Editor.\n\n## Shell D structure\n\`\`\`\ndiv.app-shell\n ├── header.topnavbar\n └── div.app-body\n      └── main.main-content (padding:0)\n           ├── div.line-tab\n           └── div.line-tab__body\n                └── div.split-layout (flex:row)\n                     ├── div.left-panel (flex:1; overflow-y:auto)\n                     └── div.right-panel (w:380px; border-left)\n\`\`\``,
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

const SETUP_PROJECT = `# MANDATORY: Project Setup — CDN Mode\n\n## CDN Base URL\n\`\`\`\n${CDN_BASE}\n\`\`\`\n\nAll CSS, JS, SVG icons, and fonts served from this public CDN.\nOutput = SINGLE index.html file.\n\n## CRITICAL RULES\n1. ALL CSS from CDN — <link href="${CDN_BASE}/components/*.css">. NEVER inline.\n2. ALL JS from CDN — <script src="${CDN_BASE}/components/*.js">. NEVER custom JS for components.\n3. ALL ICONS from CDN — <img src="${CDN_BASE}/assets/icons/icon-*.svg">. 195 pre-exported SVGs.\n4. FONTS auto-load via tokens.css.\n5. Logo: <img src="${CDN_BASE}/assets/icons/logo-log360.svg">\n6. Output = SINGLE index.html\n\n## Icon reference pattern\nEvery component: <img src="${CDN_BASE}/assets/icons/icon-NAME.svg">\n\n## Available CSS files\ntokens, layout, topnavbar, sidemenu, header, classic-tab, line-tab, table, table-type2, form-input, form-dropdown, drawer, rpt-chart-floater, widget, echarts-widget, note-container, notification-banner, responsive\n\n## Available JS files\ntopnavbar, sidemenu, classic-tab, line-tab, table, form-input, form-dropdown, drawer, rpt-chart-floater, widget, echarts-widget, echarts-elegant-theme, icon-engine, notification-banner, lib/echarts.min.js`;

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
"reports-windows-all-events": "# Blueprint: Reports > Windows > All Events\n\n## Layout (Shell C)\nTopNavBar → Reports | QuickLink: Servers & Workstation | Sidemenu Type 2 | Header v3\n\n## Sidemenu\nOS: Windows | Sections: Windows Events (expanded: All Events, Important Events, User Based Activity), Logon Reports, Device Severity Reports, Windows Startup Events, USB Storage Auditing, System Events, etc.\n\n## Input Row\nSelect Log Source [dropdown] | Period [date range] | [Generate]\n\n## Classic Tab (ONE chart area)\nTabs: All Events | Top Source | Top Devices | Time Based View\nChart: Line chart with severity legend (Error, Warning, Information, Success, Failure)\n\n## Table\nActionBar Type 8 | Columns: checkbox | Source | Log Source | Severity | Event ID | Display Name | Source | Timestamp",

"reports-windows-startup": "# Blueprint: Reports > Windows > Windows Startup\n\n## Layout (Shell C)\nSame as all-events, sidemenu 'Windows Startup Events > Windows Startup' highlighted.\n\n## Sidemenu expanded section\nWindows Startup Events: Windows Startup (active), Windows ShutDown, Windows Restarts, Unexpected Shutdown, System Uptime, Windows Startup and Windows ShutDown\n\n## Page Header: 'Startup Events'\n\n## Input Row\nSelect Log Source [All Devices] | Time Period [Last 24 Hours] | [Generate]\n\n## Classic Tab (Bar/Line toggle)\nBar (default) | Line — ONE chart area, rpt-chart-floater\n\n## Table\nColumns: checkbox | Source | Event ID | Event Description | Source IP | Log Source Type | Event Generated | Timestamp\nPagination: 1-50 of 260",

"dashboard": "# Blueprint: Dashboard — Events Overview (Shell A)\n\nTopNavBar → Home | Line-tab: Events Overview (selected) | Date picker\n\n## Stat Cards (4)\n1. All Events: 4489K\n2. Windows Events: 3302K\n3. Syslog Events: 11444\n4. All Log Sources: 18\n\n## Widgets (2 cols × 3 rows)\nRow 1: Log Trend (area chart) | Recent Alerts (list)\nRow 2: Security Events (table) | Top 5 Log Sources (donut)\nRow 3: Windows Severity Events (bar) | Syslog Severity Events (bar)",

"alerts": "# Blueprint: Alerts (Shell D variant)\n\nTopNavBar → Alerts | Line-tab: Alerts | Incident\nNo sidemenu. Stat cards (Critical, Trouble, Attention, All) → direct table.\nActionBar: pagination | columns\nColumns: checkbox | Severity | Profile Name | Time | Alert Message Format | Log Source",

"settings": "# Blueprint: Settings — Device Management (Shell B)\n\nTopNavBar → Settings | Sidemenu Type 1 (icons, not flat accordion)\nLine Tab: Windows Devices (7) | Syslog Devices (1) | Other Devices (7)\nTable: checkbox | Actions | Device | Show IP | Agent | Last Message | Next Scan | Monitoring Interval | Log Source Group | Status",

"compliance": "# Blueprint: Compliance Landing (no sidemenu)\n\nTopNavBar → Compliance | Search bar | Manage Compliance link\nGrid (3 cols): PCI-DSS, HIPAA, FISMA, GDPR, SOX, ISO 27001... each card with icon + description + View Reports button",

"compliance-report": "# Blueprint: Compliance Report (Shell C)\n\nLine-tab top: PCI-DSS | HIPAA | FISMA | ...\nSidemenu Type 2: ← PCI-DSS back + accordion sections\nHorizontal bar chart + table with user logon data",

"search": "# Blueprint: Search\n\nTopNavBar → Search | No sidemenu\nSearch box: query input + Basic/Advanced tabs\nResults: bar chart + list view with key-value fields",

"security": "# Blueprint: Security Analytics (Shell A variant)\n\nStat Cards: All Rules, Critical, Trouble, Attention\nWidgets: Detection Pipeline, Detection by Tactics (radar), Recent Detections, Top Users, Top Log Sources, Top Detections, Detection Trends",

"cloud-protection": "# Blueprint: Cloud Protection (Shell A variant)\n\nLine-tab: Application Insight | User Insight\nStat Cards: Total Traffic, Total Request, Discovered Apps, Shadow Apps\nWidgets: Traffic Trend, Top Cloud Apps, Banned Apps, Shadow Apps, Download/Upload Size, Categories",

"settings-license": "# Blueprint: Settings License (Shell B)\n\nStorage stats, feature table with usage bars, plan details.",

"incident-workbench": "# Blueprint: Incident Workbench (floating panel)\n\nBottom-right panel on every page. Shows investigation tools.",

"dashboard-network": "# Blueprint: Dashboard Network Overview (Shell A)\n\nSame as Events Overview but Network Overview tab selected.",

"alerts-manage-profiles": "# Blueprint: Alerts > Manage Profiles\n\nTable: checkbox | Alert Type | Severity | Message | Log Source | Action",

"reports-unix-all-events": "# Blueprint: Reports > Unix > All Events (Shell C)\n\nSidemenu OS: Unix/Linux | Sections: All Events, Important Events, SU Logons, Logon/Failed Logon/System Events, Terminal Service, FTP Server\nChart: Line with severity legend\nTable: Same columns as Windows reports",
};

/* ══════════════════════════════════════════════════════
   MCP HANDLER — Vercel Serverless (Streamable HTTP)
══════════════════════════════════════════════════════ */

const handler = createMcpHandler(
  (server) => {
    /* 1. setup_project */
    server.tool("setup_project", "CALL FIRST. CDN URLs, icon table, rules.", { feature_name: z.string() }, async ({ feature_name }) => {
      const name = feature_name.replace(/[^a-zA-Z0-9_-]/g, "-").toLowerCase();
      return { content: [{ type: "text" as const, text: SETUP_PROJECT.replace(/your-feature-name/g, name).replace(/\$FEATURE/g, name) }] };
    });

    /* 2. get_component */
    server.tool("get_component", "Canonical HTML snippet for any Elegant 1.0 component.", { name: z.enum(Object.keys(COMPONENT_MAP) as [string, ...string[]]) }, async ({ name: n }) => {
      const entry = COMPONENT_MAP[n];
      if (!entry) return { content: [{ type: "text" as const, text: `Unknown: ${n}. Available: ${Object.keys(COMPONENT_MAP).join(", ")}` }] };
      const content = await readWikiFile(entry.file);
      if (!entry.section) return { content: [{ type: "text" as const, text: content }] };
      const html = rewriteAssetPaths(extractHtmlBlock(content, entry.section));
      return { content: [{ type: "text" as const, text: `## ${n}\nSource: ${entry.file}\n\n\`\`\`html\n${html}\n\`\`\`` }] };
    });

    /* 3. get_recipe */
    server.tool("get_recipe", "Full recipe for Shell A/B/C/D.", { shell: z.enum(["A","B","C","D"]) }, async ({ shell }) => {
      return { content: [{ type: "text" as const, text: RECIPES[shell] || `Unknown shell: ${shell}` }] };
    });

    /* 4. get_shell */
    server.tool("get_shell", "HTML skeleton for Shell A/B/C/D with CDN links.", { shell: z.enum(["A","B","C","D"]) }, async ({ shell }) => {
      const s = SHELLS[shell];
      return { content: [{ type: "text" as const, text: s ? `## Shell ${shell}\n\n\`\`\`html\n${s}\n\`\`\`` : `Unknown: ${shell}` }] };
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
    server.tool("list_components", "Lists all available component names.", {}, async () => {
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
    server.tool("search_wiki", "Full-text search across wiki files.", { query: z.string(), max_results: z.number().optional() }, async ({ query, max_results }) => {
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
    server.tool("get_icons", "SVG icon filenames with CDN URLs.", { filter: z.string().optional() }, async ({ filter }) => {
      let icons = ALL_ICONS;
      if (filter) { const f = filter.toLowerCase(); icons = icons.filter(i => i.toLowerCase().includes(f)); }
      if (!icons.length) return { content: [{ type: "text" as const, text: `No icons for "${filter}"` }] };
      return { content: [{ type: "text" as const, text: icons.map(i => `${i}  →  ${CDN_BASE}/assets/icons/${i}`).join("\n") }] };
    });

    /* 11. get_full_wiki_file */
    server.tool("get_full_wiki_file", "Complete wiki .md file content.", { filename: z.string() }, async ({ filename }) => {
      return { content: [{ type: "text" as const, text: rewriteAssetPaths(await readWikiFile(filename)) }] };
    });

    /* 12. get_topnavbar */
    server.tool("get_topnavbar", "Complete TopNavBar HTML with CDN icons.", {}, async () => {
      const content = await readWikiFile("topnavbar.md");
      const html = rewriteAssetPaths(extractHtmlBlock(content, "Complete HTML"));
      return { content: [{ type: "text" as const, text: `## TopNavBar\nLogo: ${CDN_BASE}/assets/icons/logo-log360.svg\n\n\`\`\`html\n${html}\n\`\`\`` }] };
    });

    /* 13. get_page_blueprint */
    server.tool("get_page_blueprint", "Visual blueprint of a real Log360 page.", { page: z.enum(Object.keys(PAGE_BLUEPRINTS) as [string, ...string[]]) }, async ({ page }) => {
      return { content: [{ type: "text" as const, text: PAGE_BLUEPRINTS[page] || `Unknown page: ${page}` }] };
    });

    /* 14. get_screenshot */
    server.tool("get_screenshot", "Search product screenshots by keywords.", { query: z.string(), max_results: z.number().optional() }, async ({ query, max_results }) => {
      const keywords = query.toLowerCase().split(/[\s,]+/).filter(Boolean);
      const max = max_results || 5;
      const scored = SCREENSHOTS.map(s => {
        let score = 0;
        const lower = s.toLowerCase();
        for (const kw of keywords) { if (lower.includes(kw)) score++; }
        return { path: s, score };
      }).filter(r => r.score > 0).sort((a, b) => b.score - a.score).slice(0, max);
      if (!scored.length) return { content: [{ type: "text" as const, text: `No screenshots for "${query}". Try: windows startup, alerts main, dashboard events, settings device` }] };
      const lines = scored.map((r, i) => {
        const encoded = r.path.split('/').map(p => encodeURIComponent(p)).join('/');
        return `${i+1}. **${r.path}**\n   URL: ${SCREENSHOT_BASE}/${encoded}`;
      });
      return { content: [{ type: "text" as const, text: `Found ${scored.length} screenshot(s):\n\n${lines.join("\n\n")}` }] };
    });
  },
  { serverInfo: { name: "elegant-agent-mcp", version: "1.0.0" } },
  { basePath: "/api", disableSse: true },
);

export { handler as GET, handler as POST, handler as DELETE };
