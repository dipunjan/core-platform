import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { App } from '@/App';
import { store } from '@/store';
import './styles/index.css';

const root = document.getElementById('root');
if (!root) {
  throw new Error('Missing #root');
}

createRoot(root).render(
  <StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </StrictMode>,
);
