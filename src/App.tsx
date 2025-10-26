import React from 'react';
import InteractiveMap from './InteractiveMap';
import ErrorBoundary from './ErrorBoundary';
import './App.css';

function App() {
  return (
    <ErrorBoundary>
      <div className="App">
        <InteractiveMap />
      </div>
    </ErrorBoundary>
  );
}

export default App;