import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { AuthProvider } from './contexts/AuthContext';

// Suppress Recharts warnings
const originalError = console.error;
console.error = (...args) => {
  if (typeof args[0] === 'string' && /defaultProps will be removed/.test(args[0])) {
    return;
  }
  originalError(...args);
};

const originalWarn = console.warn;
console.warn = (...args) => {
  if (typeof args[0] === 'string' && /The width\(-?\d+\) and height\(-?\d+\) of chart should be greater than 0/.test(args[0])) {
    return;
  }
  originalWarn(...args);
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
);
