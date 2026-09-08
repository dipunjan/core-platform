import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { App } from '@/App';
import { ErrorBoundary } from '@/components';
import { queryClient } from '@/query';
import './styles/index.css';

const root = document.getElementById('root');
if (!root) {
  throw new Error('Missing #root');
}

createRoot(root).render(
  <StrictMode>
    <ErrorBoundary homeHref="/" homeLabel="Back to sales">
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>,
);
