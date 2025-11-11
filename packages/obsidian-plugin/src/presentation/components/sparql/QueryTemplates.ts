export interface QueryTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  query: string;
  useCase: string;
}

export const QUERY_TEMPLATES: QueryTemplate[] = [
  {
    id: "all-assets",
    name: "all assets",
    description: "get all notes in your vault",
    category: "basic",
    query: `PREFIX exo: <https://exocortex.my/ontology/exo#>

SELECT ?asset ?label
WHERE {
  ?asset exo:Asset_label ?label .
}
LIMIT 100`,
    useCase: "quick overview of vault contents",
  },
  {
    id: "entity-types",
    name: "list entity types",
    description: "find all unique entity classes",
    category: "basic",
    query: `PREFIX exo: <https://exocortex.my/ontology/exo#>

SELECT DISTINCT ?class
WHERE {
  ?asset exo:Instance_class ?class .
}`,
    useCase: "understanding vault structure",
  },
  {
    id: "count-by-type",
    name: "count assets by type",
    description: "count assets grouped by entity type",
    category: "basic",
    query: `PREFIX exo: <https://exocortex.my/ontology/exo#>

SELECT ?class (COUNT(?asset) AS ?count)
WHERE {
  ?asset exo:Instance_class ?class .
}
GROUP BY ?class
ORDER BY DESC(?count)`,
    useCase: "vault statistics dashboard",
  },
  {
    id: "active-tasks",
    name: "all active tasks",
    description: "list all non-archived tasks",
    category: "tasks",
    query: `PREFIX exo: <https://exocortex.my/ontology/exo#>
PREFIX ems: <https://exocortex.my/ontology/ems#>

SELECT ?task ?label ?status
WHERE {
  ?task exo:Instance_class "ems__Task" .
  ?task exo:Asset_label ?label .
  OPTIONAL { ?task ems:Task_status ?status . }
  FILTER NOT EXISTS {
    ?task exo:Asset_archived ?archived .
    FILTER(?archived = true || ?archived = "true" || ?archived = "archived")
  }
}
ORDER BY ?label`,
    useCase: "daily task review",
  },
  {
    id: "tasks-by-status",
    name: "tasks by status",
    description: "count tasks grouped by status",
    category: "tasks",
    query: `PREFIX exo: <https://exocortex.my/ontology/exo#>
PREFIX ems: <https://exocortex.my/ontology/ems#>

SELECT ?status (COUNT(?task) AS ?count)
WHERE {
  ?task exo:Instance_class "ems__Task" .
  ?task ems:Task_status ?status .
}
GROUP BY ?status
ORDER BY DESC(?count)`,
    useCase: "sprint progress tracking",
  },
  {
    id: "in-progress-tasks",
    name: "in-progress tasks",
    description: "show tasks currently being worked on",
    category: "tasks",
    query: `PREFIX exo: <https://exocortex.my/ontology/exo#>
PREFIX ems: <https://exocortex.my/ontology/ems#>

SELECT ?task ?label ?project
WHERE {
  ?task exo:Instance_class "ems__Task" .
  ?task exo:Asset_label ?label .
  ?task ems:Task_status "in-progress" .
  OPTIONAL {
    ?task ems:belongs_to_project ?project .
  }
}
ORDER BY ?project ?label`,
    useCase: "focus list for active work",
  },
  {
    id: "high-effort-tasks",
    name: "high-effort tasks",
    description: "find tasks with significant effort votes",
    category: "tasks",
    query: `PREFIX exo: <https://exocortex.my/ontology/exo#>
PREFIX ems: <https://exocortex.my/ontology/ems#>

SELECT ?task ?label ?votes
WHERE {
  ?task exo:Instance_class "ems__Task" .
  ?task exo:Asset_label ?label .
  ?task ems:Effort_votes ?votes .
  FILTER(?votes > 5)
}
ORDER BY DESC(?votes)`,
    useCase: "identify tasks requiring more time/resources",
  },
  {
    id: "orphaned-tasks",
    name: "tasks without project",
    description: "find orphaned tasks not assigned to projects",
    category: "tasks",
    query: `PREFIX exo: <https://exocortex.my/ontology/exo#>
PREFIX ems: <https://exocortex.my/ontology/ems#>

SELECT ?task ?label ?status
WHERE {
  ?task exo:Instance_class "ems__Task" .
  ?task exo:Asset_label ?label .
  OPTIONAL { ?task ems:Task_status ?status . }
  FILTER NOT EXISTS {
    ?task ems:belongs_to_project ?project .
  }
}
ORDER BY ?label`,
    useCase: "cleanup and organization",
  },
  {
    id: "tasks-by-priority",
    name: "tasks by priority",
    description: "list tasks sorted by priority",
    category: "tasks",
    query: `PREFIX exo: <https://exocortex.my/ontology/exo#>
PREFIX ems: <https://exocortex.my/ontology/ems#>

SELECT ?task ?label ?priority
WHERE {
  ?task exo:Instance_class "ems__Task" .
  ?task exo:Asset_label ?label .
  OPTIONAL { ?task ems:Task_priority ?priority . }
}
ORDER BY ?priority ?label`,
    useCase: "priority-based task planning",
  },
  {
    id: "project-tasks",
    name: "tasks in project",
    description: "find all tasks belonging to specific project",
    category: "projects",
    query: `PREFIX exo: <https://exocortex.my/ontology/exo#>
PREFIX ems: <https://exocortex.my/ontology/ems#>

SELECT ?task ?label ?status
WHERE {
  ?task exo:Instance_class "ems__Task" .
  ?task exo:Asset_label ?label .
  ?task ems:belongs_to_project ?project .
  OPTIONAL { ?task ems:Task_status ?status . }
}
ORDER BY ?label
LIMIT 50`,
    useCase: "project-specific task review",
  },
  {
    id: "project-hierarchy",
    name: "project hierarchy",
    description: "show projects with their parent areas",
    category: "projects",
    query: `PREFIX exo: <https://exocortex.my/ontology/exo#>
PREFIX ems: <https://exocortex.my/ontology/ems#>

SELECT ?project ?projectLabel ?area ?areaLabel
WHERE {
  ?project exo:Instance_class "ems__Project" .
  ?project exo:Asset_label ?projectLabel .
  OPTIONAL {
    ?project ems:belongs_to_area ?area .
    ?area exo:Asset_label ?areaLabel .
  }
}
ORDER BY ?areaLabel ?projectLabel`,
    useCase: "understanding organizational structure",
  },
  {
    id: "task-relationships",
    name: "task relationships",
    description: "visualize task relationships (CONSTRUCT query)",
    category: "relationships",
    query: `PREFIX exo: <https://exocortex.my/ontology/exo#>
PREFIX ems: <https://exocortex.my/ontology/ems#>

CONSTRUCT {
  ?task ems:belongs_to_project ?project .
  ?project ems:belongs_to_area ?area .
}
WHERE {
  ?task exo:Instance_class "ems__Task" .
  ?task ems:belongs_to_project ?project .
  ?project ems:belongs_to_area ?area .
}
LIMIT 100`,
    useCase: "graph visualization of task hierarchy",
  },
  {
    id: "recent-effort",
    name: "recent effort activity",
    description: "find assets with recent effort history",
    category: "time-based",
    query: `PREFIX exo: <https://exocortex.my/ontology/exo#>
PREFIX ems: <https://exocortex.my/ontology/ems#>

SELECT ?asset ?label ?lastEffort
WHERE {
  ?asset exo:Instance_class "ems__Task" .
  ?asset exo:Asset_label ?label .
  ?asset ems:Effort_last_entry ?lastEffort .
}
ORDER BY DESC(?lastEffort)
LIMIT 20`,
    useCase: "tracking recent work activity",
  },
  {
    id: "project-completion",
    name: "project completion rate",
    description: "calculate completion percentage per project",
    category: "aggregations",
    query: `PREFIX ems: <https://exocortex.my/ontology/ems#>

SELECT ?project (COUNT(?task) AS ?totalTasks) (SUM(?isDone) AS ?completedTasks)
WHERE {
  ?task ems:belongs_to_project ?project .
  BIND(IF(?status = "done", 1, 0) AS ?isDone)
  OPTIONAL { ?task ems:Task_status ?status . }
}
GROUP BY ?project
ORDER BY DESC(?completedTasks)`,
    useCase: "project progress reporting",
  },
  {
    id: "effort-distribution",
    name: "effort distribution",
    description: "sum effort votes by project",
    category: "aggregations",
    query: `PREFIX ems: <https://exocortex.my/ontology/ems#>

SELECT ?project (SUM(?votes) AS ?totalEffort)
WHERE {
  ?task ems:belongs_to_project ?project .
  ?task ems:Effort_votes ?votes .
}
GROUP BY ?project
ORDER BY DESC(?totalEffort)`,
    useCase: "resource allocation analysis",
  },
];

export const TEMPLATE_CATEGORIES = [
  { id: "all", name: "all templates" },
  { id: "basic", name: "basic queries" },
  { id: "tasks", name: "task management" },
  { id: "projects", name: "projects" },
  { id: "relationships", name: "relationships" },
  { id: "time-based", name: "time-based" },
  { id: "aggregations", name: "aggregations" },
];

export function getTemplatesByCategory(categoryId: string): QueryTemplate[] {
  if (categoryId === "all") {
    return QUERY_TEMPLATES;
  }
  return QUERY_TEMPLATES.filter((t) => t.category === categoryId);
}

export function getTemplateById(id: string): QueryTemplate | undefined {
  return QUERY_TEMPLATES.find((t) => t.id === id);
}
