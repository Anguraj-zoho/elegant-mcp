# Elegant MCP Server

MCP server for Elegant 1.0 design system — 12 tools for AI-assisted UI generation.

All CSS, JS, SVG icons, and fonts are served from CDN. Output is a **single `index.html`** file.

## Setup

```bash
git clone https://github.com/Anguraj-zoho/elegant-mcp.git
cd elegant-mcp
npm install
npm run build
```

## Use with Cursor

Open the `elegant-mcp` folder in Cursor. The `.cursor/mcp.json` is already configured.

Or add this to any project's `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "elegant-mcp": {
      "command": "node",
      "args": ["/FULL/PATH/TO/elegant-mcp/dist/index.js"],
      "env": {}
    }
  }
}
```

## Use with Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "elegant-mcp": {
      "command": "node",
      "args": ["/FULL/PATH/TO/elegant-mcp/dist/index.js"],
      "env": {}
    }
  }
}
```

## Available Tools (12)

| Tool | Description |
|---|---|
| `setup_project` | **Call FIRST.** Returns CDN URLs, icon table, rules |
| `get_recipe` | Shell A/B/C/D recipe (required files + structure) |
| `get_shell` | Ready-to-fill HTML skeleton with CDN links |
| `get_component` | Canonical HTML snippet for any component |
| `get_topnavbar` | Complete TopNavBar HTML with CDN icon paths |
| `get_chart_snippet` | ElegantEChart HTML+JS for bar/line/donut/area/etc |
| `get_checklist` | Pre-commit checklist for a shell type |
| `get_anti_patterns` | Known bottlenecks and fixes |
| `list_components` | All available component names |
| `search_wiki` | Full-text search across component docs |
| `get_icons` | 195 SVG icon filenames (with CDN URLs) |
| `get_full_wiki_file` | Complete wiki .md file content |

## Test Prompt

```
Build me a Windows Startup report page using Shell C.
Call setup_project first, then use get_recipe, get_shell, and get_component tools.
```
