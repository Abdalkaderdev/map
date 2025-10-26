# Project Structure

## Directory Organization

### Root Level
- **package.json**: Project dependencies and scripts configuration
- **tsconfig.json**: TypeScript compiler configuration
- **README.md**: Project documentation and setup instructions
- **.gitignore**: Git version control exclusions

### Public Directory (`/public/`)
- **index.html**: Main HTML template for the React application
- **plots-for-editing.json**: Plot data source file containing plot information
- **favicon.ico, logo192.png, logo512.png**: Application branding assets
- **manifest.json**: Progressive Web App configuration
- **xaritakark 2.jpg**: Image asset for the application

### Source Directory (`/src/`)
- **App.tsx**: Main application component and routing logic
- **App.css**: Global application styling
- **InteractiveMap.tsx**: Core map component for plot visualization
- **InteractiveMap.css**: Map-specific styling and layout
- **ErrorBoundary.tsx**: Error handling wrapper component
- **index.tsx**: Application entry point and React DOM rendering
- **hooks/**: Custom React hooks directory (for reusable logic)

### Configuration Files
- **react-app-env.d.ts**: TypeScript environment declarations
- **setupTests.ts**: Jest testing framework configuration
- **reportWebVitals.ts**: Performance monitoring setup

## Core Components

### Application Architecture
- **Single Page Application (SPA)**: Built with Create React App framework
- **Component-Based Structure**: Modular React components for maintainability
- **Error Boundary Pattern**: Centralized error handling for robust user experience
- **Hook-Based Logic**: Custom hooks for reusable stateful logic

### Component Relationships
- **App Component**: Root component managing application state and layout
- **InteractiveMap Component**: Primary feature component handling map interactions
- **ErrorBoundary Component**: Wrapper component providing error recovery
- **Custom Hooks**: Shared logic abstraction for component reusability