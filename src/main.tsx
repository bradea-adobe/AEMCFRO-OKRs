import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { DatabaseProvider } from './context/DatabaseContext';
import { SimpleTest } from './SimpleTest';

console.log('🎬 Starting OKR Tracker application...');

const rootElement = document.getElementById('root');
console.log('📍 Root element:', rootElement);

// Set to true to test if React is working at all
const SIMPLE_TEST_MODE = false;

if (!rootElement) {
  console.error('❌ Root element not found!');
} else {
  console.log('✅ Root element found, rendering React app...');
  
  if (SIMPLE_TEST_MODE) {
    console.log('🧪 Running in SIMPLE TEST MODE');
    ReactDOM.createRoot(rootElement).render(
      <React.StrictMode>
        <SimpleTest />
      </React.StrictMode>
    );
  } else {
    console.log('🚀 Running in NORMAL MODE');
    ReactDOM.createRoot(rootElement).render(
      <React.StrictMode>
        <DatabaseProvider>
          <App />
        </DatabaseProvider>
      </React.StrictMode>
    );
  }
  
  console.log('✅ React render called');
}

