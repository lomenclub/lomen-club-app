import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { WalletProvider } from './contexts/WalletContext';
import ErrorBoundary from './components/ErrorBoundary';
import Layout from './components/Layout';
import Homepage from './pages/Homepage';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import 'bootstrap/dist/css/bootstrap.min.css';
import './design-tokens.css';
import './bootstrap-override.css';

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <WalletProvider>
        <ErrorBoundary>
          <Routes>
            <Route path="/" element={<Homepage />} />
            <Route path="/app/*" element={<Layout />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
          </Routes>
        </ErrorBoundary>
      </WalletProvider>
    </ThemeProvider>
  );
};

export default App;
