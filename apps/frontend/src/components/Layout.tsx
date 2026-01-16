import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import TopNav from './TopNav';
import Sidebar from './Sidebar';
import Dashboard from '../pages/Dashboard';
import Profile from '../pages/Profile';
import Eligibility from '../pages/Eligibility';
import Rewards from '../pages/Rewards';
import Governance from '../pages/Governance';
import Admin from '../pages/Admin';
import Marketplace from '../pages/Marketplace';
import NFTExplorer from '../pages/NFTExplorer';
import NFTDetails from '../pages/NFTDetails';
import ComingSoonOverlay from './ComingSoonOverlay';

const Layout: React.FC = () => {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const handleMobileClose = () => {
    setMobileNavOpen(false);
  };

  const handleMobileToggle = () => {
    setMobileNavOpen(!mobileNavOpen);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <TopNav onMobileToggle={handleMobileToggle} />
      <div style={{ flex: 1, display: 'flex' }}>
        {/* Desktop Sidebar */}
        <div className="d-lg-block" style={{ display: 'block' }}>
          <Sidebar />
        </div>
        
        {/* Mobile Sidebar */}
        <div className="d-lg-none">
          <Sidebar 
            mobileOpen={mobileNavOpen} 
            onMobileClose={handleMobileClose} 
          />
        </div>

        <main style={{ 
          flex: 1, 
          padding: 'var(--space-7)',
          backgroundColor: 'var(--bg-primary)',
          minHeight: 'calc(100vh - 72px)'
        }}>
          <Routes>
            <Route index element={
              <ComingSoonOverlay>
                <Dashboard />
              </ComingSoonOverlay>
            } />
            <Route path="profile" element={<Profile />} />
            <Route path="eligibility" element={
              <ComingSoonOverlay>
                <Eligibility />
              </ComingSoonOverlay>
            } />
            <Route path="rewards" element={
              <ComingSoonOverlay>
                <Rewards />
              </ComingSoonOverlay>
            } />
            <Route path="governance" element={
              <ComingSoonOverlay>
                <Governance />
              </ComingSoonOverlay>
            } />
            <Route path="admin" element={
              <ComingSoonOverlay>
                <Admin />
              </ComingSoonOverlay>
            } />
            <Route path="marketplace" element={
              <ComingSoonOverlay>
                <Marketplace />
              </ComingSoonOverlay>
            } />
            <Route path="explorer" element={<NFTExplorer />} />
            <Route path="nft/:tokenId" element={<NFTDetails />} />
          </Routes>
        </main>
      </div>
      <div style={{
        backgroundColor: 'var(--bg-elevated)',
        borderTop: '1px solid var(--border-primary)',
        padding: 'var(--space-4) var(--space-7)',
        textAlign: 'center',
        color: 'var(--text-muted)',
        fontSize: '0.875rem',
        fontWeight: 500
      }}>
        © 2024 Lomen Club. All rights reserved.
      </div>
    </div>
  );
};

export default Layout;
