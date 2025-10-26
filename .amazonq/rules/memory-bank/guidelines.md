# Development Guidelines

## Code Quality Standards

### TypeScript Usage
- **Strict Interface Definitions**: All data structures use explicit TypeScript interfaces (Plot, MapData, Props, State)
- **Type Safety**: Function parameters and return types are explicitly typed
- **Generic Type Parameters**: Use React.FC for functional components, Component<Props, State> for class components
- **Null Safety**: Proper null checking with optional chaining and conditional rendering

### Import Organization
- **React Imports First**: React and React hooks imported at the top
- **Local Imports**: Component-specific CSS files imported after React
- **Relative Imports**: Use relative paths for local components (./ComponentName)

### Component Structure Patterns

#### Functional Components (Primary Pattern)
```typescript
const ComponentName: React.FC = () => {
  // State declarations using useState
  // Ref declarations using useRef
  // Effect hooks using useEffect
  // Callback functions using useCallback
  // Event handlers
  // Return JSX
};
```

#### Class Components (Error Boundaries)
```typescript
class ComponentName extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { /* initial state */ };
  }
  
  static getDerivedStateFromError(error: Error): State {
    // Error handling logic
  }
  
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Error logging
  }
  
  render() {
    // Conditional rendering for error states
  }
}
```

## State Management Patterns

### Hook Usage Conventions
- **useState**: Group related state variables, use descriptive names
- **useRef**: For DOM element references and mutable values
- **useEffect**: Separate effects by concern, include dependency arrays
- **useCallback**: Optimize expensive functions, especially those passed to child components

### State Naming Conventions
- Boolean states: `isLoading`, `hasError`, `showAllPlots`
- Object states: `mapData`, `dragStart`, `highlightedPlot`
- Array states: `plots` (plural form)
- Setters: `setStateName` pattern consistently

## Performance Optimization Patterns

### Canvas Rendering Optimizations
- **Early Returns**: Skip rendering when no data to display
- **Viewport Culling**: Skip drawing elements outside visible area
- **Batch Operations**: Set common styles once before drawing multiple elements
- **RequestAnimationFrame**: Use for smooth animations and updates

### Event Handler Patterns
- **Prevent Default**: Use `e.preventDefault()` for wheel events
- **State Batching**: Update multiple related states together
- **Conditional Logic**: Early returns in event handlers for performance

## Error Handling Standards

### Error Boundary Implementation
- **Graceful Degradation**: Provide user-friendly error messages
- **Recovery Options**: Include refresh/retry buttons
- **Console Logging**: Log detailed error information for debugging
- **Inline Styling**: Use inline styles for error UI to avoid CSS dependencies

### Async Error Handling
- **Try-Catch Blocks**: Wrap async operations in try-catch
- **Console Logging**: Log errors with descriptive messages
- **User Feedback**: Provide alerts or UI feedback for failed operations

## Styling Conventions

### CSS Organization
- **Component-Specific**: Each component has its own CSS file
- **Class Naming**: Use kebab-case for CSS classes (`interactive-map-container`)
- **Semantic Structure**: Organize styles by component sections

### Inline Styles Usage
- **Error States**: Use inline styles for error boundaries and fallback UI
- **Dynamic Styles**: Use inline styles for transform properties and dynamic values
- **Conditional Styling**: Apply styles based on component state

## Testing Patterns

### Test Structure
- **React Testing Library**: Use for component testing
- **Screen Queries**: Use screen.getByText() for element selection
- **Descriptive Test Names**: Use clear, behavior-focused test descriptions

## File Organization Standards

### Component Files
- **Single Responsibility**: One main component per file
- **Export Default**: Use default exports for main components
- **Co-located Styles**: Keep CSS files alongside component files

### Asset Management
- **Public Directory**: Store static assets in /public folder
- **Relative Paths**: Use relative paths for asset references
- **Descriptive Names**: Use clear, descriptive file names