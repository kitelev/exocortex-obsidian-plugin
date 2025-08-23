# Graph Visualization Examples

The Exocortex plugin now supports interactive graph visualization using the `graph` code block processor. This allows you to visualize RDF triples as node-link diagrams.

## Basic Usage

### Simple Graph Visualization

Display all triples in the knowledge graph (limited to 100 nodes by default):

```graph
limit: 100
```

### Focus on a Specific Note

Visualize the relationships around a specific note with 2 levels of depth:

```graph
focus: [[My Important Note]]
depth: 2
limit: 50
```

### Using SPARQL Queries

Use SPARQL queries to filter and visualize specific data:

```graph
SELECT ?s ?p ?o WHERE {
  ?s ?p ?o .
  FILTER(regex(?s, "Project", "i"))
} LIMIT 20
```

## Configuration Options

### Available Parameters

- `focus`: Focus the graph around a specific entity (use `[[Note Name]]` format)
- `depth`: How many relationship levels to traverse from the focus (default: 2)
- `limit`: Maximum number of nodes to display (default: 100)
- `query`: Use a custom SPARQL query to filter the data
- `showLabels`: Show/hide node and edge labels (default: true)
- `nodeSize`: Size of the nodes in pixels (default: 8)
- `linkDistance`: Distance between connected nodes (default: 80)

### Configuration Example

```graph
focus: [[Task Management]]
depth: 3
limit: 200
showLabels: true
nodeSize: 10
linkDistance: 100
```

## Advanced Examples

### Project Dependencies Visualization

```graph
SELECT ?project ?relation ?dependency WHERE {
  ?project rdf:type "Project" .
  ?project ?relation ?dependency .
  FILTER(?relation IN ("depends_on", "blocks", "part_of"))
} LIMIT 50
```

### File Relationships

```graph
SELECT ?file1 ?relation ?file2 WHERE {
  ?file1 file_path ?path1 .
  ?file2 file_path ?path2 .
  ?file1 ?relation ?file2 .
  FILTER(regex(?path1, "\\.md$") && regex(?path2, "\\.md$"))
} LIMIT 30
```

### Tag-based Network

```graph
SELECT ?note ?tag ?value WHERE {
  ?note tags ?tag .
  ?note ?prop ?value .
  FILTER(?prop != "file_path" && ?prop != "file_name")
} LIMIT 100
```

## Interactive Features

The graph visualization includes several interactive features:

### Navigation
- **Pan**: Click and drag to move around the graph
- **Zoom**: Use mouse wheel to zoom in and out
- **Node Click**: Click on file nodes to navigate to the corresponding Obsidian note
- **Reset View**: Use the "Reset View" button to return to the original position

### Export Options
- **Export SVG**: Download the current graph as an SVG file for use in other applications

### Visual Elements
- **Node Colors**: Different colors indicate node types (subjects, objects, predicates)
- **Edge Labels**: Relationship names are shown on the connections
- **Hover Effects**: Nodes and edges highlight when you hover over them

## Performance Tips

### For Large Graphs
- Use the `limit` parameter to restrict the number of nodes
- Focus on specific areas using the `focus` parameter
- Use SPARQL queries to filter relevant data

### Example for Large Vaults
```graph
focus: [[My Current Project]]
depth: 2
limit: 50
nodeSize: 6
```

## Styling Integration

The graph visualization automatically adapts to your current Obsidian theme:
- Uses theme colors for nodes, edges, and backgrounds
- Responsive design for different screen sizes
- Consistent with Obsidian's design language

## Troubleshooting

### Common Issues
1. **Empty Graph**: Check if you have data in your knowledge graph by running a basic SPARQL query first
2. **Performance Issues**: Reduce the `limit` or use more specific queries
3. **Layout Problems**: Try using the "Reset View" button or refresh the note

### Example Test Query
First, verify your data with a simple SPARQL query:

```sparql
SELECT ?s ?p ?o WHERE {
  ?s ?p ?o .
} LIMIT 10
```

Then create a graph visualization:

```graph
limit: 20
showLabels: true
```

## Integration with SPARQL

The graph visualization works seamlessly with the existing SPARQL functionality. You can:

1. Use SPARQL queries to explore your data
2. Visualize the results as a graph
3. Navigate to specific notes from the graph
4. Export visualizations for documentation

This creates a powerful workflow for knowledge discovery and visualization in your Obsidian vault.