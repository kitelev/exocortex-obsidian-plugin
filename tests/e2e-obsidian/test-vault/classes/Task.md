---
exo__Class: exo__Task
exo__ClassPrefix: Task
exo__ClassDescription: "An actionable task with specific requirements"
exo__superClass: exo__Asset
---

# Task

An actionable task with specific requirements.

## Properties

- **status**: Current status (ToDo, InProgress, Done)
- **priority**: Priority level (Low, Medium, High, Critical)
- **dueDate**: Due date for completion
- **estimatedHours**: Estimated time to complete
- **actualHours**: Actual time spent

## Relations

- **ems__assignedTo**: Person assigned to the task
- **ems__dependsOn**: Other tasks this depends on
- **ems__partOf**: Project this task belongs to