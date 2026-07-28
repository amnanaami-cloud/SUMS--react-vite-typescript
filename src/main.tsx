import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { StoreProvider } from './store';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: (count, error) =>
        error instanceof Error &&
        'status' in error &&
        (error as { status: number }).status >= 400 &&
        (error as { status: number }).status < 500
          ? false
          : count < 2,
      refetchOnWindowFocus: false,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <StoreProvider>
        <App />
      </StoreProvider>
    </QueryClientProvider>
  </React.StrictMode>,
);
