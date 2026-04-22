# Elegant Agent MCP Server

MCP server for the **Elegant 1.0** UI component library. Provides 14 tools that give AI assistants everything they need to build Log360 Cloud pages — component HTML, page blueprints, shell skeletons, chart snippets, icons, and wiki documentation.

All data is served from the cloud. No local files needed.

## Quick Setup

### Cursor (recommended)

Add to `.cursor/mcp.json` in any project:

```json
{
  "mcpServers": {
    "elegant-agent": {
      "url": "https://elegant-mcp.vercel.app/api/mcp"
    }
  }
}
```

Reload Cursor. 14 tools will appear.

### Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "elegant-agent": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "https://elegant-mcp.vercel.app/api/mcp"]
    }
  }
}
```

Restart Claude Desktop.

## Usage

Just ask the AI to build a page:

> "Create Report Servers & Workstation - Windows - Windows Startup report page with all interactions"

The AI will automatically call the MCP tools in order:
1. `setup_project` — gets CDN URLs and build rules
2. `get_page_blueprint` — gets exact layout specification
3. `get_recipe` / `get_shell` — gets shell skeleton
4. `get_component` — gets HTML for each component
5. Outputs a single `index.html` with all assets loaded from CDN

## Available Tools (14)

| Tool | Description |
|---|---|
| `setup_project` | CDN URLs, build rules, workflow steps |
| `get_component` | Canonical HTML for any UI component |
| `get_recipe` | Build recipe for Shell A/B/C/D |
| `get_shell` | Complete HTML skeleton with CDN links |
| `get_chart_snippet` | ElegantEChart HTML+JS code |
| `get_checklist` | Pre-commit checklist |
| `get_anti_patterns` | Known issues and fixes |
| `list_components` | All available component names |
| `search_wiki` | Full-text search across wiki docs |
| `get_icons` | 195 SVG icon names with CDN URLs |
| `get_full_wiki_file` | Complete wiki markdown file |
| `get_topnavbar` | Complete TopNavBar HTML |
| `get_page_blueprint` | Detailed page layout specification |
| `get_screenshot` | Search 217 product screenshots |
