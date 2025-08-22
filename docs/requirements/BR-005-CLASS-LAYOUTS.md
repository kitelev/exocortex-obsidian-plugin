# BR-005: Configurable Class-Based Layouts

## Executive Summary

Enable users to define custom view layouts for different asset classes through configuration assets, providing flexible and context-aware presentation of information.

## Business Problem

Users need different views for different types of assets:

- Projects need to show incomplete tasks
- Areas need to show sub-areas
- Tasks need to show related context
- Each class has unique presentation requirements

Current fixed layout doesn't adapt to asset class context.

## Proposed Solution

Implement configurable layout system where users create `ui__ClassLayout` assets that define:

- Which blocks appear for each class
- Block order and configuration
- Query-based dynamic content
- Custom display options

## User Stories

### US-001: Configure Project View

**As a** project manager  
**I want to** see incomplete tasks in project views  
**So that** I can track project progress at a glance

**Acceptance Criteria:**

- Project view displays tasks with status != Done
- Tasks are filtered by project relation
- Count of incomplete tasks is shown

### US-002: Configure Area View

**As an** area owner  
**I want to** see sub-areas hierarchy  
**So that** I can navigate organizational structure

**Acceptance Criteria:**

- Area view shows child areas
- Parent-child relationships are clear
- Navigation between areas is seamless

### US-003: Create Layout Configuration

**As a** power user  
**I want to** create layout configurations as assets  
**So that** I can customize views for my workflow

**Acceptance Criteria:**

- Create ui\_\_ClassLayout assets
- Define blocks with queries
- Set display preferences
- Enable/disable layouts

## Functional Requirements

### FR-001: Layout Discovery

System SHALL discover layout configurations from user-defined folder

### FR-002: Layout Matching

System SHALL match layouts to asset classes by priority

### FR-003: Block Types

System SHALL support block types:

- Query blocks (filtered asset lists)
- Property blocks (editable fields)
- Relation blocks (linked assets)
- Backlink blocks (incoming links)
- Custom blocks (user scripts)

### FR-004: Query Execution

Query blocks SHALL:

- Filter by class
- Filter by properties
- Support operators (equals, contains, etc.)
- Limit results
- Sort results

### FR-005: Fallback Behavior

System SHALL use default layout when no configuration exists

## Non-Functional Requirements

### NFR-001: Performance

Layout rendering SHALL complete within 500ms

### NFR-002: Scalability

Support up to 20 blocks per layout

### NFR-003: Usability

Configuration SHALL use intuitive frontmatter format

## Example Configuration

```yaml
---
exo__Instance_class: "[[ui__ClassLayout]]"
ui__ClassLayout_targetClass: "[[ems__Project]]"
ui__ClassLayout_priority: 10
ui__ClassLayout_blocks:
  - id: "incomplete-tasks"
    type: "query"
    title: "📋 Incomplete Tasks"
    order: 1
    config:
      className: "ems__Task"
      propertyFilters:
        - property: "ems__Task_project"
          operator: "equals"
          value: "{{current_asset}}"
        - property: "ems__Effort_status"
          operator: "notEquals"
          value: "[[ems__EffortStatus - Done]]"
      displayAs: "list"
      maxResults: 20
  - id: "properties"
    type: "properties"
    title: "📝 Properties"
    order: 2
    config:
      editableProperties: ["ems__Project_status", "ems__Project_deadline"]
---
```

## Success Metrics

- User satisfaction with custom views
- Reduction in navigation clicks
- Increase in asset discovery
- Time saved finding information

## Dependencies

- Asset repository system
- Query engine
- Property editor component
- Dataview integration

## Risks

- Performance with complex queries
- Configuration complexity
- Migration from existing layouts

## Timeline

- Phase 1: Core layout engine (2 days)
- Phase 2: Query blocks (1 day)
- Phase 3: UI integration (1 day)
- Phase 4: Testing & documentation (1 day)
