# Exocortex REST API Documentation

## Overview

The Exocortex plugin provides a REST API that allows external applications and AI agents to interact with your Obsidian knowledge base. This enables automation, integration with AI assistants, and programmatic access to your semantic knowledge graph.

## Features

- **SPARQL Query Execution**: Run semantic queries against your knowledge graph
- **Natural Language Processing**: Convert natural language questions to SPARQL
- **Asset Management**: Create, search, and manage knowledge assets
- **Graph Operations**: Direct manipulation of RDF triples
- **Relation Ontologization**: Convert properties to semantic relations
- **ExoFocus Context**: Manage knowledge context and filtering
- **Vault Operations**: Search and access vault files

## Getting Started

### 1. Enable the REST API

Use the Command Palette (Cmd/Ctrl + P) and run:

- `Exocortex: Start REST API Server` - Starts the API server
- `Exocortex: Show REST API Key` - Copies your API key to clipboard
- `Exocortex: Stop REST API Server` - Stops the API server

### 2. Configuration

The API server runs on port **27124** by default.

### 3. Authentication

All API requests require an API key in the `X-API-Key` header:

```bash
curl -H "X-API-Key: your-api-key-here" http://localhost:27124/api/health
```

## API Endpoints

### Health Check

```http
GET /api/health
```

Returns server status and statistics.

**Response:**

```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00Z",
  "graph": {
    "triples": 1543,
    "size": 1543
  },
  "vault": {
    "files": 234
  }
}
```

### SPARQL Query

```http
POST /api/sparql
```

Execute SPARQL queries against the knowledge graph.

**Request Body:**

```json
{
  "query": "SELECT ?s ?p ?o WHERE { ?s ?p ?o } LIMIT 10"
}
```

**Response:**

```json
{
  "results": [...],
  "count": 10,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Natural Language Query

```http
POST /api/nlp
```

Process natural language questions.

**Request Body:**

```json
{
  "q": "What are my tasks for today?"
}
```

**Response:**

```json
{
  "intent": "query_tasks",
  "sparql": "SELECT ?task WHERE ...",
  "results": [...],
  "formatted": "You have 5 tasks for today..."
}
```

### Search Assets

```http
GET /api/assets?q=keyword&class=ems__Task&limit=20
```

Search for assets in the knowledge base.

**Parameters:**

- `q` - Search keyword (optional)
- `class` - Filter by asset class (optional)
- `limit` - Maximum results (default: 20)

**Response:**

```json
{
  "assets": [
    {
      "path": "03 Knowledge/Task1.md",
      "uid": "asset-123",
      "class": "ems__Task",
      "label": "Complete documentation"
    }
  ],
  "count": 1
}
```

### Create Asset

```http
POST /api/assets/create
```

Create a new knowledge asset.

**Request Body:**

```json
{
  "name": "New Project",
  "class": "ems__Project",
  "properties": {
    "ems__Project_status": "active",
    "ems__Project_priority": "high"
  }
}
```

**Response:**

```json
{
  "uid": "asset-1234567890-abc",
  "path": "03 Knowledge/New Project.md",
  "name": "New Project",
  "class": "ems__Project"
}
```

### Graph Operations

```http
GET /api/graph?s=subject&p=predicate&o=object&limit=100
POST /api/graph
```

Query or modify RDF triples.

**GET Parameters:**

- `s` - Filter by subject
- `p` - Filter by predicate
- `o` - Filter by object
- `limit` - Maximum results

**POST Body (Add Triple):**

```json
{
  "operation": "add",
  "subject": "asset-123",
  "predicate": "ems__relatedTo",
  "object": "asset-456"
}
```

### Ontologize Relations

```http
POST /api/relations/ontologize
```

Convert asset properties to semantic relations.

**Request Body:**

```json
{
  "assetPath": "03 Knowledge/Project.md"
}
```

**Response:**

```json
{
  "relationsCreated": 5,
  "relations": [...]
}
```

### ExoFocus Context

```http
GET /api/focus
POST /api/focus
```

Manage knowledge context and filtering.

**POST Body:**

```json
{
  "context": "work",
  "filters": {
    "tags": ["project", "urgent"],
    "timeframe": "this_week"
  }
}
```

### Vault Operations

#### List Files

```http
GET /api/vault/files
```

#### Search Content

```http
GET /api/vault/search?q=search_term
```

## Client Libraries

### Python Client

Install the example client:

```python
# See examples/python-client.py
from exocortex_client import ExocortexClient

client = ExocortexClient(api_key="your-api-key")
results = client.sparql_query("SELECT ?s WHERE { ?s a ems__Task }")
```

### JavaScript/TypeScript

```javascript
const apiKey = "your-api-key";
const baseUrl = "http://localhost:27124/api";

async function queryExocortex(query) {
  const response = await fetch(`${baseUrl}/sparql`, {
    method: "POST",
    headers: {
      "X-API-Key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query }),
  });

  return response.json();
}
```

### cURL Examples

```bash
# Health check
curl -H "X-API-Key: your-api-key" http://localhost:27124/api/health

# SPARQL query
curl -X POST http://localhost:27124/api/sparql \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{"query": "SELECT ?s WHERE { ?s a ems__Task } LIMIT 10"}'

# Search assets
curl -H "X-API-Key: your-api-key" \
  "http://localhost:27124/api/assets?q=project&limit=5"

# Create asset
curl -X POST http://localhost:27124/api/assets/create \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Task", "class": "ems__Task"}'
```

## Integration with AI Agents

### Claude MCP Integration

The REST API is designed to work with Claude's Model Context Protocol (MCP) servers. AI agents can use the API to:

1. Query your knowledge base for context
2. Create new knowledge assets based on conversations
3. Update task statuses and project information
4. Perform semantic reasoning with SPARQL CONSTRUCT queries

### Example AI Agent Workflow

```python
# AI agent searching for relevant context
client = ExocortexClient(api_key=api_key)

# Set focus to current project
client.set_focus("project-x", {"tags": ["active", "Q1-2024"]})

# Query for related information
context = client.sparql_query("""
  SELECT ?doc ?label ?content WHERE {
    ?doc ems__relatedTo <project-x> .
    ?doc exo__Asset_label ?label .
    ?doc exo__content ?content
  }
""")

# Use context for AI response generation
# ...

# Create new insight as asset
client.create_asset(
  name="AI Generated Insight",
  asset_class="ems__Insight",
  properties={
    "ems__generatedBy": "Claude",
    "ems__relatedTo": "project-x",
    "ems__content": ai_response
  }
)
```

## Security Considerations

1. **API Key**: Keep your API key secure. Regenerate if compromised.
2. **Local Only**: By default, the API only accepts connections from localhost.
3. **CORS**: Configure allowed origins for browser-based clients.
4. **HTTPS**: Enable HTTPS for production use (self-signed certificate).

## Troubleshooting

### API Server Won't Start

- Check if port 27124 is already in use
- Ensure Obsidian has necessary permissions
- Check the console for error messages

### Authentication Errors

- Verify API key is correct
- Include key in `X-API-Key` header
- Use "Show REST API Key" command to get current key

### Empty Results

- Ensure vault has been indexed (restart plugin)
- Check SPARQL query syntax
- Verify asset UIDs and paths

## Performance Tips

1. Use LIMIT clauses in SPARQL queries
2. Index frequently queried predicates
3. Cache results for repeated queries
4. Use specific filters in asset searches

## Roadmap

- WebSocket support for real-time updates
- GraphQL endpoint
- Batch operations
- Query optimization
- Rate limiting
- OAuth2 authentication
