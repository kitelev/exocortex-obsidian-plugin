# exocortex-cli

Command-line interface for Exocortex knowledge management system. Manage tasks, projects, and planning from the terminal without needing Obsidian.

## Installation

```bash
npm install -g exocortex-cli
```

Or use directly with npx:

```bash
npx exocortex-cli [command]
```

## Usage

```bash
exocortex --help
```

### SPARQL Query (NEW!)

Execute SPARQL queries against your Obsidian vault as an RDF knowledge graph:

```bash
exocortex sparql query "SELECT ?s ?p ?o WHERE { ?s ?p ?o } LIMIT 10" \
  --vault ~/vault
```

**Options:**
- `<query>` - SPARQL query string or path to .sparql file **[required]**
- `--vault <path>` - Path to Obsidian vault (default: current directory)
- `--format <type>` - Output format: `table` (default), `json`, `csv`
- `--explain` - Show optimized query plan (for debugging)
- `--stats` - Show execution statistics (load time, query time, results count)
- `--no-optimize` - Disable query optimization

**Examples:**

```bash
# Find all tasks with high effort
exocortex sparql query \
  "PREFIX ems: <http://exocortex.org/ems/>
   SELECT ?task ?label ?effort
   WHERE {
     ?task <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> ems:Task .
     ?task ems:label ?label .
     ?task ems:effort ?effort .
   }" \
  --vault ~/vault

# Query from file
exocortex sparql query queries/high-effort-tasks.sparql --vault ~/vault

# JSON output for automation
exocortex sparql query "SELECT ?s ?p ?o WHERE { ?s ?p ?o }" \
  --vault ~/vault \
  --format json > results.json

# Show query plan
exocortex sparql query "SELECT ?task WHERE { ?task <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://exocortex.org/ems/Task> }" \
  --vault ~/vault \
  --explain \
  --stats
```

**Sample Output (Table Format):**

```
📦 Loading vault: /Users/you/vault...
✅ Loaded 1,234 triples in 45ms

🔍 Parsing SPARQL query...
🔄 Translating to algebra...
🎯 Executing query...
✅ Found 5 result(s) in 12ms

┌────────────────────────────────────────────────────────────┐
│ ?label                    │ ?effort                      │
├────────────────────────────┼───────────────────────────────┤
│ "Implement SPARQL Engine" │ "240"                        │
│ "Write Documentation"     │ "120"                        │
│ "Design Architecture"     │ "180"                        │
└────────────────────────────────────────────────────────────┘
```

### Create Task

Create a new task from an area or project:

```bash
exocortex create task \
  --source ~/vault/areas/work.md \
  --label "Implement feature X" \
  --size small \
  --root ~/vault
```

**Options:**
- `-s, --source <path>` - Path to source file (area or project) **[required]**
- `-l, --label <label>` - Task label
- `--size <size>` - Task size (small, medium, large)
- `-r, --root <path>` - Root directory of vault (default: current directory)

**Example:**

```bash
cd ~/my-vault
exocortex create task -s areas/product.md -l "Design mockups" --size medium
```

### Create Instance

Create an instance from a task or meeting prototype:

```bash
exocortex create instance \
  --prototype ~/vault/prototypes/weekly-review.md \
  --label "Weekly Review 2025-10-26" \
  --root ~/vault
```

**Options:**
- `-p, --prototype <path>` - Path to prototype file **[required]**
- `-l, --label <label>` - Instance label
- `--size <size>` - Task size (for task instances)
- `-r, --root <path>` - Root directory of vault (default: current directory)

**Example:**

```bash
exocortex create instance -p prototypes/standup.md -l "Daily Standup"
```

### Change Status

Move a task to ToDo status:

```bash
exocortex status todo \
  --task ~/vault/tasks/abc-123.md \
  --root ~/vault
```

**Options:**
- `-t, --task <path>` - Path to task file **[required]**
- `-r, --root <path>` - Root directory of vault (default: current directory)

**Example:**

```bash
exocortex status todo -t tasks/feature-implementation.md
```

### Plan Task

Plan a task for today:

```bash
exocortex plan today \
  --task ~/vault/tasks/abc-123.md \
  --root ~/vault
```

**Options:**
- `-t, --task <path>` - Path to task file **[required]**
- `-r, --root <path>` - Root directory of vault (default: current directory)

**Example:**

```bash
exocortex plan today -t tasks/write-documentation.md
```

## Workflow Examples

### Morning Planning

```bash
# Plan high-priority tasks for today
exocortex plan today -t tasks/task1.md
exocortex plan today -t tasks/task2.md
exocortex plan today -t tasks/task3.md

# Move them to ToDo
exocortex status todo -t tasks/task1.md
exocortex status todo -t tasks/task2.md
exocortex status todo -t tasks/task3.md
```

### Creating Tasks from Project

```bash
# Create multiple tasks for a project
exocortex create task -s projects/website-redesign.md -l "Update homepage" --size small
exocortex create task -s projects/website-redesign.md -l "Redesign navigation" --size medium
exocortex create task -s projects/website-redesign.md -l "Test on mobile" --size small
```

### Weekly Review Workflow

```bash
# Create this week's review instance
exocortex create instance -p prototypes/weekly-review.md -l "Weekly Review $(date +%Y-%m-%d)"
```

## Architecture

The CLI uses `@exocortex/core` for business logic and implements a Node.js file system adapter:

```
exocortex-cli/
├── src/
│   ├── index.ts           - Main CLI entry point
│   ├── adapters/
│   │   └── NodeFsAdapter.ts - Node.js file system implementation
│   └── commands/
│       ├── create-task.ts
│       ├── create-instance.ts
│       ├── status.ts
│       └── plan.ts
└── dist/                  - Compiled output
```

## Features

- **SPARQL Query Engine** - Execute SPARQL 1.1 queries against vault as RDF knowledge graph
  - BGP (Basic Graph Pattern) execution with variable bindings
  - Query optimization (filter push-down, join reordering)
  - Multiple output formats (table, JSON, CSV)
  - Query plan visualization (--explain flag)
  - Performance statistics (--stats flag)
- **File System Operations** - Read/write markdown files with frontmatter
- **Task Creation** - Generate tasks from areas, projects, and prototypes
- **Instance Creation** - Create instances from prototypes
- **Status Management** - Update task status through workflow
- **Planning** - Assign tasks to specific days
- **Frontmatter Support** - Full YAML frontmatter parsing and manipulation
- **Progress Indicators** - Spinners and colored output for better UX

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Run locally
node dist/index.js --help

# Watch mode
npm run dev
```

## Requirements

- Node.js >= 18.0.0
- A vault with Exocortex-compatible markdown files

## Vault Structure

Your vault should follow Exocortex conventions:

```
vault/
├── areas/
│   ├── work.md
│   └── personal.md
├── projects/
│   └── website-redesign.md
├── tasks/
│   ├── abc-123.md
│   └── def-456.md
└── prototypes/
    ├── weekly-review.md
    └── standup.md
```

Each file should have YAML frontmatter with Exocortex properties:

```yaml
---
exo__Asset_isDefinedBy: my-ontology
exo__Asset_uid: abc-123
exo__Instance_class:
  - "[[ems__Task]]"
ems__Effort_status: "[[ems__EffortStatusDraft]]"
---
```

## Roadmap

### Planned Commands

- `exocortex status backlog` - Move to Backlog
- `exocortex status doing` - Start effort
- `exocortex status done` - Mark as done
- `exocortex status rollback` - Rollback status
- `exocortex plan date <date>` - Plan for specific date
- `exocortex plan shift forward` - Shift day forward
- `exocortex plan shift backward` - Shift day backward
- `exocortex create project` - Create project from area
- `exocortex query` - Query vault by metadata
- `exocortex list tasks` - List all tasks
- `exocortex list today` - List today's tasks

## License

MIT
