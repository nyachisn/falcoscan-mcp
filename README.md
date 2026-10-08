# FalcoScan MCP

Connect Claude, Cursor and other MCP clients to [FalcoScan](https://falcoscan.com): AI market intelligence on 7,000+ AI products across 29 markets.

Ask in plain English:

- Which AI markets still have room for a new product?
- Who are the closest rivals to a given AI product?
- Is this AI product still running, or was it acquired?
- Which AI startups shut down or were bought this year, and by whom?

FalcoScan also offers an API, the Market Terminal dashboard and other products at [falcoscan.com](https://falcoscan.com).

## Access

The FalcoScan MCP server runs at `https://falcoscan.com/api/mcp` (Streamable HTTP).

**You need a FalcoScan API key to connect.** Request access at [falcoscan.com/data-access](https://falcoscan.com/data-access). Your key is tied to your account, so keep it private.

This repository holds no FalcoScan data. Every answer comes from falcoscan.com, and every request is checked there against your key.

## Connect

### Claude, Cursor and other clients with remote MCP support

| Setting | Value |
|---|---|
| URL | `https://falcoscan.com/api/mcp` |
| Header | `Authorization: Bearer YOUR_FALCOSCAN_API_KEY` |

**Claude Code**

```bash
claude mcp add --transport http falcoscan https://falcoscan.com/api/mcp --header "Authorization: Bearer $FALCOSCAN_API_KEY"
```

**Cursor** (`.cursor/mcp.json`)

```json
{
  "mcpServers": {
    "falcoscan": {
      "url": "https://falcoscan.com/api/mcp",
      "headers": { "Authorization": "Bearer YOUR_FALCOSCAN_API_KEY" }
    }
  }
}
```

### Clients that only run local (stdio) servers

This repository includes a small bridge (Node 18 or later, no dependencies). It forwards your client's requests to falcoscan.com with your key, and it will not start without one.

```json
{
  "mcpServers": {
    "falcoscan": {
      "command": "npx",
      "args": ["-y", "github:nyachisn/falcoscan-mcp"],
      "env": { "FALCOSCAN_API_KEY": "YOUR_FALCOSCAN_API_KEY" }
    }
  }
}
```

## Tools

| Tool | What it answers |
|---|---|
| `lookup_product` | Find an AI product by name or website: its market, whether it is still running and its closest rivals |
| `search_tools` | Search AI products by name, market or what they do |
| `get_tool` | One product's full FalcoScan profile |
| `list_markets` | The 29 AI markets FalcoScan tracks |
| `market_overview` | One market at a glance, with its leading products |
| `market_mortality` | What has shut down or been acquired in a market |
| `ai_graveyard` | AI products that shut down or were acquired, each with a source |

Every answer includes a FalcoScan link you can cite.

## Links

- MCP page: [falcoscan.com/mcp](https://falcoscan.com/mcp)
- Official MCP Registry: `com.falcoscan/mcp`
- AI Graveyard: [falcoscan.com/ai-graveyard](https://falcoscan.com/ai-graveyard)
- Terms: [falcoscan.com/terms](https://falcoscan.com/terms)

## License

The bridge code in this repository is MIT licensed. FalcoScan data is not part of this repository: it is served by falcoscan.com under the [FalcoScan Terms of Service](https://falcoscan.com/terms) and may not be copied or redistributed.
