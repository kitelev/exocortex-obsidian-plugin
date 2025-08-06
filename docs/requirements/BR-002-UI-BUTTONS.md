# Business Requirements: Dynamic UI Buttons in Asset Views

## BR-002: Dynamic Button System

### Executive Summary
Users need the ability to define custom buttons that appear in asset views, with each button executing specific commands based on the asset's class configuration.

### Business Need
Currently, asset views are static and don't provide interactive actions. Users want to:
- Define custom actions for different asset classes
- Execute commands directly from asset views
- Configure button behavior without coding
- Create reusable command patterns

### Stakeholder Requirements

#### SR-001: Button Definition
**As an** ontology designer  
**I want to** define buttons with labels and commands  
**So that** users can interact with assets through custom actions

#### SR-002: Class-Specific Buttons
**As an** ontology designer  
**I want to** specify which buttons appear for which classes  
**So that** each asset type has appropriate actions

#### SR-003: Command Execution
**As a** user viewing an asset  
**I want to** click buttons to execute commands  
**So that** I can perform actions without manual navigation

### Solution Concept

#### Ontology Structure
```
ui__Button (Class)
├── ui__Button_label (Property) - Display text
└── ui__Button_command (Property) - Reference to ButtonCommand

ui__ButtonCommand (Class)
├── ui__Command_type (Property) - Command type identifier
├── ui__Command_parameters (Property) - Parameter configuration
└── ui__Command_requiresInput (Property) - Boolean for modal requirement

ui__ClassView (Class)
└── ui__ClassView_buttons (Property) - References to Buttons
```

#### Interaction Flow
1. User opens asset view for class N
2. System queries ui__ClassView for class N
3. System retrieves associated buttons via ui__ClassView_buttons
4. Buttons render with labels from ui__Button_label
5. On click, execute command from ui__Button_command
6. If command requires input, show modal
7. Execute command with parameters

### Success Criteria
- [ ] Buttons appear in asset views based on class
- [ ] Button labels are dynamically loaded
- [ ] Commands execute correctly
- [ ] Modal appears when input required
- [ ] Commands receive correct parameters

### Constraints
- Must work within Obsidian's plugin architecture
- Must not break existing asset views
- Must be configurable through ontology files
- Performance must not degrade with many buttons

### Assumptions
- Ontology files define UI configuration
- Commands are predefined in the system
- Users understand ontology structure

### Risks
| Risk | Impact | Mitigation |
|------|--------|------------|
| Complex command parameters | High | Provide clear documentation and examples |
| Performance with many buttons | Medium | Lazy load button configurations |
| User confusion with dynamic UI | Medium | Consistent button placement and styling |

### Dependencies
- Existing asset view rendering system
- Ontology querying capabilities
- Command execution framework

### Out of Scope
- Custom command creation through UI
- Button styling customization
- Keyboard shortcuts for buttons
- Button permissions/security