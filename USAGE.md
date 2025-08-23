# How to Use the Exocortex Plugin

## Prerequisites

1. **Install Dataview Plugin** (REQUIRED)
   - Go to Settings → Community plugins → Browse
   - Search for "Dataview" and install it
   - Enable the Dataview plugin
   - In Dataview settings, enable "Enable JavaScript Queries"

## Quick Start

### Step 1: Check Plugin is Active

1. Look for the brain icon (🧠) in the left ribbon
2. Click it - you should see "Exocortex plugin is active" notification

### Step 2: Use Plugin Commands

Open Command Palette (Ctrl/Cmd + P) and look for:
- `Exocortex: Create Exocortex Note` - Creates a new note with proper metadata
- `Exocortex: Refresh Exocortex Layouts` - Refreshes all dynamic layouts

### Step 3: Create Your First Exocortex Note

1. Use command `Exocortex: Create Exocortex Note`
2. Fill in:
   - **Title**: Your note name
   - **Class**: The type (e.g., `exo__Asset`, `ems__Task`, `ems__Project`)
   - **Ontology**: The namespace (e.g., `exo`, `ems`, `gtd`)
3. Click "Create"

### Step 4: See the Magic

The created note will have:
1. **Frontmatter** with semantic metadata
2. **DataviewJS block** that renders the dynamic UI

```yaml
---
exo__Asset_isDefinedBy: "[[!exo]]"
exo__Asset_uid: auto-generated-uuid
exo__Asset_createdAt: 2025-08-06T12:00:00
exo__Instance_class:
  - "[[exo__Asset]]"
exo__Asset_label: "Your Note Title"
---

```dataviewjs
await window.ExoUIRender(dv, this);
```
```

**Switch to Reading View** (Ctrl/Cmd + E) to see the rendered UI!

## What the Plugin Does

### Automatic UI Rendering

When you add this code block to any note:
```javascript
```dataviewjs
await window.ExoUIRender(dv, this);
```
```

The plugin will:
1. Read the note's frontmatter metadata
2. Detect the `exo__Instance_class` to determine the type
3. Render an appropriate UI showing:
   - All properties in a formatted table
   - Related assets (from `exo__Asset_relates`)
   - Backlinks to this note
   - Future: Custom layouts per class

### Semantic Properties

The plugin understands these key properties:

| Property | Purpose | Example |
|----------|---------|---------|
| `exo__Asset_isDefinedBy` | Links to ontology | `"[[!exo]]"` |
| `exo__Asset_uid` | Unique identifier | UUID v4 |
| `exo__Instance_class` | Type of note | `["[[ems__Task]]"]` |
| `exo__Asset_label` | Human-readable title | `"My Task"` |
| `exo__Asset_relates` | Related notes | `["[[Other Note]]"]` |

## Examples in Your Vault

Copy the example files from the plugin's `examples/` folder to your vault:
1. `1. Basic Example.md` - Simple asset
2. `2. Task Example.md` - EMS task with status
3. `3. Project Example.md` - EMS project
4. `4. Ontology Example.md` - Ontology definition

## Tips

### Creating Different Types of Notes

**For Tasks:**
```yaml
exo__Instance_class: ["[[ems__Task]]"]
ems__Task_status: "todo"
ems__Task_priority: "high"
```

**For Projects:**
```yaml
exo__Instance_class: ["[[ems__Project]]"]
ems__Project_status: "active"
ems__Project_startDate: 2025-08-01
```

**For Concepts:**
```yaml
exo__Instance_class: ["[[ims__Concept]]"]
ims__Concept_definition: "Description here"
```

### Linking Notes

Use `exo__Asset_relates` to create semantic relationships:
```yaml
exo__Asset_relates:
  - "[[Related Note 1]]"
  - "[[Related Note 2]]"
```

## Troubleshooting

### "ExoUIRender is not defined"
- Make sure the Exocortex plugin is enabled
- Try command: `Exocortex: Refresh Exocortex Layouts`
- Reload Obsidian (Ctrl/Cmd + R)

### Nothing renders in Reading View
- Ensure Dataview plugin is installed and enabled
- Check that "Enable JavaScript Queries" is ON in Dataview settings
- Verify the code block uses \`\`\`dataviewjs not \`\`\`javascript

### Properties not showing
- Check frontmatter is valid YAML
- Properties should be at the top of the file between `---` markers

## Advanced Usage

### Custom Properties

Add any ontology-specific properties:
```yaml
# For a book note
lit__Book_author: "Douglas Adams"
lit__Book_isbn: "978-0345391803"
lit__Book_rating: 5

# For a meeting
meet__Meeting_date: 2025-08-06
meet__Meeting_attendees: ["Alice", "Bob"]
meet__Meeting_agenda: "Discuss Q3 goals"
```

### Plugin Settings

Access via Settings → Plugin options → Exocortex:
- **Default Ontology**: Default namespace for new notes
- **Enable Auto Layout**: Auto-refresh layouts every 30 seconds
- **Debug Mode**: Enable console logging for troubleshooting

## Next Steps

1. Create your own ontologies
2. Build a knowledge graph with semantic relationships
3. Wait for future updates with custom layouts per class
4. Contribute ideas at [GitHub Issues](https://github.com/kitelev/exocortex-obsidian-plugin/issues)