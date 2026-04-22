# Elegant MCP Server

MCP server for **Elegant 1.0 design system** — 12 tools for AI-assisted UI generation.

All CSS, JS, SVG icons, and fonts load from CDN. Output is a **single `index.html`** file.

---

## Quick Start (3 steps)

### Step 1 — Clone & Install

```bash
git clone https://github.com/Anguraj-zoho/elegant-mcp.git
cd elegant-mcp
npm install
```

### Step 2 — Add Token

Open `.cursor/mcp.json` inside the `elegant-mcp` folder and replace `YOUR_GITHUB_PAT_HERE` with the token provided to you.

If you want to use it in **another project**, add this to that project's `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "elegant-mcp": {
      "command": "node",
      "args": ["/FULL/PATH/TO/elegant-mcp/dist/index.js"],
      "env": {
        "ELEGANT_GH_TOKEN": "PASTE_TOKEN_HERE"
      }
    }
  }
}
```

### Step 3 — Open in Cursor & Test

1. Open the `elegant-mcp` folder in **Cursor**
2. Cursor will detect `.cursor/mcp.json` and start the MCP server automatically
3. You should see **"elegant-mcp"** listed in the MCP panel (Settings > MCP)
4. Start a new chat and paste this test prompt:

```
Build me a Windows Startup report page using Shell C.
Call setup_project first, then use get_recipe, get_shell, and get_component tools.
```

> The AI will call tools → get CDN-linked HTML skeletons → produce a single `index.html`.
> Open that file in a browser — all CSS, JS, icons, and fonts load from CDN automatically.

---

## Claude Desktop (Optional)

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "elegant-mcp": {
      "command": "node",
      "args": ["/FULL/PATH/TO/elegant-mcp/dist/index.js"],
      "env": {
        "ELEGANT_GH_TOKEN": "PASTE_TOKEN_HERE"
      }
    }
  }
}
```

---

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

---

## Requirements

- **Node.js** 18+ (check: `node -v`)
- **Cursor IDE** (latest version with MCP support)
