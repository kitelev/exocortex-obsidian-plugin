# Task: UX Designer - SPARQL Autocomplete Interface Design

**Task ID**: TASK-2025-015
**Agent**: UX Designer
**Priority**: High
**Status**: pending
**Created**: 2025-01-10
**Deadline**: 2025-01-12

## Context

Design the user interface and interaction patterns for SPARQL Autocomplete in the Exocortex plugin. The interface must be intuitive, accessible, and integrate seamlessly with Obsidian's existing editor experience.

## Design Requirements

### Functional Requirements
- Display context-appropriate suggestions while typing
- Support keyboard-only navigation
- Show different suggestion types (keywords, properties, templates, etc.)
- Provide helpful descriptions and examples
- Handle different screen sizes and editor layouts

### User Experience Goals
- **Non-intrusive**: Don't interrupt typing flow
- **Discoverable**: Easy to trigger and understand
- **Efficient**: Quick to navigate and select
- **Educational**: Help users learn SPARQL syntax
- **Accessible**: Support screen readers and keyboard navigation

## Current Context Analysis

### Existing SPARQL Interface
- Users type queries in markdown code blocks: ```sparql
- Results displayed in styled containers below code blocks
- No current autocomplete or assistance while typing
- Errors shown after execution with context

### Obsidian Editor Environment
- Dark/light theme support required
- Variable editor widths (panes, popout windows)
- CodeMirror editor with syntax highlighting
- Existing autocomplete for files, tags, etc.

## Interface Design Specifications

### 1. Suggestion Popup Design

#### Visual Hierarchy
```
┌─────────────────────────────────────────────────────────────┐
│  📝 Suggestions                                         ⨯   │ ← Header with type indicator and close
├─────────────────────────────────────────────────────────────┤
│ > SELECT                           🔤 Keyword              │ ← Selected item (highlighted)
│   WHERE                            🔤 Keyword              │
│   FILTER                           🔤 Keyword              │
│   exo:hasProperty                  🔗 Property             │ ← Different type indicators
│   rdfs:label                       🔗 Property             │
│   ?subject                         📋 Variable             │
│   Asset Query Template             📄 Template             │
├─────────────────────────────────────────────────────────────┤
│ Complete SPARQL SELECT statement                            │ ← Description area
│ Usage: SELECT ?var WHERE { ?var ?prop ?val }               │
└─────────────────────────────────────────────────────────────┘
```

#### Styling Specifications
- **Size**: Max width 400px, max height 300px (scrollable)
- **Positioning**: Below cursor, fallback above if no space
- **Background**: CSS variable for theme compatibility
- **Border**: 1px solid with theme-appropriate color
- **Shadow**: Subtle drop shadow for depth
- **Typography**: Monospace for code, sans-serif for descriptions

### 2. Suggestion Types Visual Design

#### Type Indicators (Icons/Colors)
```css
.suggestion-item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  border-radius: 4px;
}

.suggestion-item.selected {
  background: var(--interactive-accent);
  color: var(--text-on-accent);
}

.suggestion-type {
  width: 16px;
  height: 16px;
  margin-right: 8px;
}

.suggestion-type.keyword { color: #2196F3; } /* Blue */
.suggestion-type.property { color: #FF9800; } /* Orange */
.suggestion-type.variable { color: #4CAF50; } /* Green */
.suggestion-type.template { color: #9C27B0; } /* Purple */
.suggestion-type.namespace { color: #F44336; } /* Red */
.suggestion-type.function { color: #607D8B; } /* Blue Grey */
```

#### Content Layout for Different Types

**Keywords**
```
🔤 SELECT                    Keyword
   ↳ Query selection clause
```

**Properties**
```
🔗 exo:hasTitle             Property
   ↳ Asset title property (used 142 times)
```

**Templates**
```
📄 Asset Query              Template
   ↳ SELECT ?asset ?title WHERE { ?asset exo:hasTitle ?title }
```

**Variables**
```
📋 ?subject                 Variable
   ↳ Already used in this query
```

### 3. Interaction Patterns

#### Triggering Autocomplete
1. **Automatic**: Show after 2 characters typed
2. **Manual**: Ctrl+Space (Cmd+Space on Mac)
3. **Context**: Show relevant suggestions based on cursor position

#### Navigation
- **Arrow Keys**: Up/Down to navigate suggestions
- **Tab/Enter**: Accept selected suggestion
- **Escape**: Close suggestions
- **Typing**: Filter suggestions in real-time
- **Click**: Mouse selection (accessibility consideration)

#### Selection Behavior
- **Insert Mode**: Replace current word/token
- **Smart Positioning**: Position cursor appropriately after insertion
- **Template Expansion**: Support tab stops for templates

### 4. Responsive Design

#### Small Screens (< 768px)
- Reduce suggestion popup width to 90% of screen
- Stack description below suggestion text
- Larger touch targets (44px minimum)

#### Large Screens (> 1200px)
- Show more suggestions (up to 12 instead of 8)
- Wider description area
- Side-by-side layout for complex templates

### 5. Accessibility Design

#### Screen Reader Support
```html
<div role="listbox" aria-label="SPARQL suggestions">
  <div role="option" 
       aria-selected="true" 
       aria-describedby="suggestion-desc-1">
    SELECT
  </div>
  <div id="suggestion-desc-1" class="sr-only">
    SPARQL keyword for selecting variables
  </div>
</div>
```

#### Keyboard Navigation
- Focus management with clear visual indicators
- Announce selection changes to screen readers
- Support for high contrast mode
- Respect user's motion preferences

#### Color Accessibility
- Minimum 4.5:1 contrast ratio for all text
- Don't rely solely on color for type indication
- Support for colorblind users with shapes/patterns

### 6. Animation and Transitions

#### Entrance Animation
```css
.suggestions-popup {
  animation: slideIn 150ms ease-out;
  transform-origin: top;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-8px) scaleY(0.8);
  }
  to {
    opacity: 1;
    transform: translateY(0) scaleY(1);
  }
}
```

#### Selection Feedback
- Subtle highlight on hover (100ms transition)
- No animation on keyboard navigation (accessibility)
- Brief highlight on selection (200ms fade)

### 7. Context-Aware Display

#### Query Position Awareness
```
Cursor after "SELECT" → Show variables, wildcards
Cursor in WHERE clause → Show properties, patterns
Cursor after FILTER → Show functions, operators
```

#### Smart Filtering
- Real-time filtering as user types
- Fuzzy matching for typos ("SELCT" → "SELECT")
- Frequency-based ranking for properties

### 8. Template Interface Design

#### Template Preview
```
┌─────────────────────────────────────────────────────────────┐
│ 📄 Asset Query Template                                     │
├─────────────────────────────────────────────────────────────┤
│ SELECT ?asset ?title ?type                                  │
│ WHERE {                                                     │
│   ?asset a ?type .                                         │
│   ?asset exo:hasTitle ?title                               │
│ }                                                           │
├─────────────────────────────────────────────────────────────┤
│ Find assets with their titles and types                     │
│ Variables: asset, title, type                               │
└─────────────────────────────────────────────────────────────┘
```

#### Template Insertion with Tab Stops
```sparql
SELECT ${1:?asset} ${2:?title}
WHERE {
  ${1:?asset} exo:hasTitle ${2:?title}
  FILTER(${3:condition})
}
```

## Design Patterns Integration

### Obsidian Native Patterns
- Use Obsidian's CSS variables for theming
- Match existing popup styling (command palette, suggestions)
- Consistent with file/tag autocomplete behavior
- Support for Obsidian's plugin API styling hooks

### Code Editor Patterns
- Similar to VS Code IntelliSense
- Monaco Editor suggestion styling
- JetBrains IDE autocomplete patterns
- Vim/Emacs command completion where applicable

## Performance Considerations

### UI Performance
- Virtual scrolling for large suggestion lists
- Debounced rendering (60fps)
- CSS containment for popup isolation
- Efficient DOM updates with minimal reflows

### Visual Feedback
- Loading indicator for slow suggestions (>200ms)
- Skeleton loading for property suggestions
- Error states for failed suggestion loading

## Testing Requirements

### Visual Testing
- Cross-browser compatibility (Chromium, Firefox)
- Theme compatibility (dark/light, community themes)
- Screen resolution testing (1080p to 4K)
- Mobile device testing (tablets)

### Usability Testing
- Task completion rates for query writing
- Time to proficiency for new users
- Error rate reduction measurement
- User satisfaction surveys

### Accessibility Testing
- Screen reader compatibility (NVDA, JAWS, VoiceOver)
- Keyboard-only navigation
- High contrast mode
- Color blindness simulation

## Implementation Guidelines

### CSS Architecture
```scss
.exocortex-suggestions {
  // Use BEM methodology
  &__popup { /* popup container */ }
  &__item { /* suggestion item */ }
  &__type { /* type indicator */ }
  &__description { /* description text */ }
  
  // State modifiers
  &--loading { /* loading state */ }
  &--error { /* error state */ }
}
```

### Component Structure
```typescript
interface SuggestionUIComponent {
  render(suggestions: Suggestion[]): HTMLElement;
  updateSelection(index: number): void;
  destroy(): void;
  onSelect: (suggestion: Suggestion) => void;
  onDismiss: () => void;
}
```

## Success Metrics

### Usability Metrics
- **Discoverability**: >80% of users find autocomplete within first session
- **Adoption**: >70% of queries use at least one suggestion
- **Efficiency**: 40% reduction in time to complete queries
- **Satisfaction**: >4.5/5 rating for autocomplete experience

### Accessibility Metrics
- 100% keyboard navigable
- WCAG 2.1 AA compliance
- Screen reader compatibility verified
- Color contrast >4.5:1 for all elements

## Next Steps

1. **Prototype Development**: Create interactive mockups using Figma/HTML
2. **User Testing**: Test with existing SPARQL users
3. **Implementation Support**: Work with SWEBOK Engineer on UI implementation
4. **Accessibility Review**: Validate design meets accessibility requirements

## Deliverables

- [ ] Interactive UI mockups in Figma
- [ ] CSS specifications and theme integration
- [ ] Accessibility compliance documentation
- [ ] Animation and interaction specifications
- [ ] Responsive design breakpoints
- [ ] User testing results and iterations

This design creates an intuitive, accessible, and powerful SPARQL autocomplete experience that enhances productivity while maintaining Obsidian's design consistency.