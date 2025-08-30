---
exo__Class: Class
name: Project
description: A collection of related tasks and activities with a common goal
superClass: Asset
properties:
  - name
  - description
  - status
  - start_date
  - end_date
  - budget
  - team_members
  - objectives
---

# Project

Projects represent collections of related tasks and activities organized around achieving a common goal.

## Properties

- **start_date**: Project start date
- **end_date**: Project completion target
- **budget**: Allocated budget
- **team_members**: People involved in the project
- **objectives**: Project goals and outcomes

## Layout Configuration

Projects use a layout optimized for project management:
- Project information (properties)
- Project tasks (query block)  
- Project actions (buttons)
- Related projects (backlinks)