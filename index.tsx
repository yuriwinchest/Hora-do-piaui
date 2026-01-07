import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import App from './App';
import './index.css';

const getRouterBasename = () => {
  const { hostname, pathname } = window.location;
  const segments = pathname.split('/').filter(Boolean);
  if (hostname.endsWith('github.io') && segments.length > 0) return `/${segments[0]}`;
  return '';
};

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <HelmetProvider>
      <BrowserRouter basename={getRouterBasename()}>
        <App />
      </BrowserRouter>
    </HelmetProvider>
  </React.StrictMode>
);
