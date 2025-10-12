import React, { useState } from 'react';
import { Navbar, Nav, Offcanvas } from 'react-bootstrap';
import { Moon, Sun, Wallet, Menu, X, LogOut } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { useWallet } from '../hooks/useWallet';
import { Link, useLocation } from 'react-router-dom';
import WalletConnectModal from './WalletConnectModal';

interface TopNavProps {
  scrollToAbout?: () => void;
  scrollToRoadmap?: () => void;
  scrollToTeam?: () => void;
  scrollToPartners?: () => void;
  onMobileToggle?: () => void;
}

const TopNav: React.FC<TopNavProps> = ({ scrollToAbout, scrollToRoadmap, scrollToTeam, scrollToPartners, onMobileToggle }) => {
  const { theme, toggleTheme } = useTheme();
  const { isConnected, account, disconnectWallet } = useWallet();
  const location = useLocation();
  const isAppRoute = location.pathname.startsWith('/app');
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);

  const handleMobileMenuClose = () => setShowMobileMenu(false);
  const handleMobileMenuShow = () => setShowMobileMenu(true);

  const handleSectionClick = (scrollFunction?: () => void) => {
    if (scrollFunction) {
      scrollFunction();
      handleMobileMenuClose();
    }
  };

  // Desktop navigation items (hidden on mobile)
  const DesktopNavigation = () => (
    <>
      {/* Section Navigation - Only show on homepage */}
      {!isAppRoute && scrollToAbout && scrollToRoadmap && scrollToTeam && scrollToPartners && (
        <div className="d-none d-md-flex align-items-center" style={{ gap: '8px', paddingRight: '16px', borderRight: '1px solid var(--border-primary)' }}>
          <button
            onClick={scrollToAbout}
            className="d-flex align-items-center justify-content-center"
            style={{
              height: '32px',
              padding: '0 16px',
              border: 'none',
              background: 'transparent',
              color: 'var(--text-secondary)',
              borderRadius: '6px',
              fontSize: '0.875rem',
              fontWeight: 500,
              transition: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
              gap: '8px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--bg-elevated)';
              e.currentTarget.style.color = 'var(--text-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
          >
            About
          </button>
          
          <button
            onClick={scrollToRoadmap}
            className="d-flex align-items-center justify-content-center"
            style={{
              height: '32px',
              padding: '0 16px',
              border: 'none',
              background: 'transparent',
              color: 'var(--text-secondary)',
              borderRadius: '6px',
              fontSize: '0.875rem',
              fontWeight: 500,
              transition: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
              gap: '8px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--bg-elevated)';
              e.currentTarget.style.color = 'var(--text-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
          >
            Roadmap
          </button>

          <button
            onClick={scrollToTeam}
            className="d-flex align-items-center justify-content-center"
            style={{
              height: '32px',
              padding: '0 16px',
              border: 'none',
              background: 'transparent',
              color: 'var(--text-secondary)',
              borderRadius: '6px',
              fontSize: '0.875rem',
              fontWeight: 500,
              transition: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
              gap: '8px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--bg-elevated)';
              e.currentTarget.style.color = 'var(--text-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
          >
            Team
          </button>

          <button
            onClick={scrollToPartners}
            className="d-flex align-items-center justify-content-center"
            style={{
              height: '32px',
              padding: '0 16px',
              border: 'none',
              background: 'transparent',
              color: 'var(--text-secondary)',
              borderRadius: '6px',
              fontSize: '0.875rem',
              fontWeight: 500,
              transition: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
              gap: '8px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--bg-elevated)';
              e.currentTarget.style.color = 'var(--text-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
          >
            Partners
          </button>
        </div>
      )}

      {/* App Link - Only show on homepage */}
      {!isAppRoute && (
        <Link
          to="/app"
          className="d-none d-md-flex align-items-center justify-content-center"
          style={{
            height: '40px',
            padding: '0 24px',
            border: 'none',
            background: 'linear-gradient(135deg, #23AF91 0%, #1A8C70 100%)',
            color: 'white',
            borderRadius: '8px',
            fontSize: '0.875rem',
            fontWeight: 600,
            transition: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
            gap: '8px',
            textDecoration: 'none',
            boxShadow: '0 4px 12px rgba(35, 175, 145, 0.3)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 16px rgba(35, 175, 145, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(35, 175, 145, 0.3)';
          }}
        >
          Launch App
        </Link>
      )}

      {/* Social Media Links - Only show on homepage */}
      {!isAppRoute && (
        <>
          <a
            href="https://github.com/lomen-club"
            target="_blank"
            rel="noopener noreferrer"
            className="d-none d-md-flex align-items-center justify-content-center"
            aria-label="GitHub"
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              backgroundColor: 'transparent',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-primary)',
              transition: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
              textDecoration: 'none'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--bg-elevated)';
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.color = '#333';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
          </a>
          
          <a
            href="https://t.me/lomenclub"
            target="_blank"
            rel="noopener noreferrer"
            className="d-none d-md-flex align-items-center justify-content-center"
            aria-label="Telegram"
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              backgroundColor: 'transparent',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-primary)',
              transition: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
              textDecoration: 'none'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--bg-elevated)';
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.color = '#0088cc';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.14.141-.259.259-.374.261l.213-3.053 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.136-.954l11.566-4.458c.538-.196 1.006.128.832.941z"/>
            </svg>
          </a>
          
          <a
            href="https://x.com/lomenclub"
            target="_blank"
            rel="noopener noreferrer"
            className="d-none d-md-flex align-items-center justify-content-center"
            aria-label="X (formerly Twitter)"
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              backgroundColor: 'transparent',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-primary)',
              transition: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
              textDecoration: 'none',
              fontWeight: '700',
              fontSize: '16px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--bg-elevated)';
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.color = '#000000';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
          >
            𝕏
          </a>
          
          <a
            href="https://www.youtube.com/@lomenclub"
            target="_blank"
            rel="noopener noreferrer"
            className="d-none d-md-flex align-items-center justify-content-center"
            aria-label="YouTube"
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              backgroundColor: 'transparent',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-primary)',
              transition: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
              textDecoration: 'none'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--bg-elevated)';
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.color = '#FF0000';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
            </svg>
          </a>
        </>
      )}
    </>
  );

  return (
    <>
      <Navbar sticky="top" className="navbar" style={{ zIndex: 1030 }}>
        <div className="d-flex align-items-center" style={{ gap: '16px', paddingLeft: '16px' }}>
          {/* Mobile Menu Toggle */}
          <button 
            className="d-md-none"
            onClick={isAppRoute && onMobileToggle ? onMobileToggle : handleMobileMenuShow}
            aria-label="Toggle navigation"
            style={{
              border: 'none',
              background: 'transparent',
              color: 'var(--text-primary)',
              padding: '12px',
              borderRadius: '8px',
              transition: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
              minWidth: '48px',
              minHeight: '48px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--bg-elevated)';
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <Menu size={24} />
          </button>
          
          <Navbar.Brand href="/" className="text-uppercase" style={{ 
            color: '#23AF91',
            fontSize: '20px',
            fontWeight: '800',
            letterSpacing: '-0.01em',
            textShadow: '0 2px 4px rgba(35, 175, 145, 0.2)'
          }}>
            LOMEN CLUB
          </Navbar.Brand>
        </div>
        
        <Nav className="ms-auto" style={{ gap: '12px', paddingRight: '16px' }}>
          <DesktopNavigation />

          {/* Theme Toggle - Show everywhere */}
          <button
            onClick={toggleTheme}
            className="d-flex align-items-center justify-content-center"
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
            style={{
              height: '40px',
              padding: '0 16px',
              border: '1px solid var(--border-primary)',
              background: 'transparent',
              color: 'var(--text-primary)',
              borderRadius: '8px',
              fontSize: '0.875rem',
              fontWeight: 600,
              transition: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
              gap: '8px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--bg-elevated)';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            {theme === 'dark' ? (
              <Sun size={18} />
            ) : (
              <Moon size={18} />
            )}
            <span className="d-none d-sm-inline">
              {theme === 'dark' ? 'Light' : 'Dark'}
            </span>
          </button>
          
          {/* Connect Wallet - Only show in app */}
          {isAppRoute && (
            <>
              {isConnected ? (
                <div className="d-flex align-items-center" style={{ gap: '12px' }}>
                  <div className="d-flex align-items-center" style={{ 
                    height: '40px',
                    padding: '0 16px',
                    border: '1px solid var(--border-primary)',
                    background: 'var(--bg-elevated)',
                    color: 'var(--text-primary)',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    gap: '8px'
                  }}>
                    <div style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: '#16A34A'
                    }} />
                    <span className="d-none d-sm-inline">
                      {account ? `${account.slice(0, 6)}...${account.slice(-4)}` : 'Connected'}
                    </span>
                  </div>
                  <button
                    onClick={disconnectWallet}
                    className="d-flex align-items-center justify-content-center"
                    aria-label="Disconnect wallet"
                    style={{
                      width: '40px',
                      height: '40px',
                      border: '1px solid var(--border-primary)',
                      background: 'transparent',
                      color: 'var(--text-secondary)',
                      borderRadius: '8px',
                      transition: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--bg-elevated)';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                      e.currentTarget.style.color = '#EF4444';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.color = 'var(--text-secondary)';
                    }}
                  >
                    <LogOut size={18} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowWalletModal(true)}
                  className="d-flex align-items-center justify-content-center"
                  aria-label="Connect wallet"
                  style={{
                    height: '40px',
                    padding: '0 20px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #23AF91 0%, #1A8C70 100%)',
                    color: 'white',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    transition: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
                    gap: '8px',
                    boxShadow: '0 4px 12px rgba(35, 175, 145, 0.3)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(35, 175, 145, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(35, 175, 145, 0.3)';
                  }}
                >
                  <Wallet size={18} />
                  <span className="d-none d-sm-inline">
                    Connect Wallet
                  </span>
                </button>
              )}
            </>
          )}
        </Nav>
      </Navbar>

      {/* Mobile Offcanvas Menu */}
      <Offcanvas 
        show={showMobileMenu} 
        onHide={handleMobileMenuClose}
        placement="start"
        style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
      >
        <Offcanvas.Header style={{ borderBottom: '1px solid var(--border-primary)' }}>
          <Offcanvas.Title style={{ 
            color: '#23AF91',
            fontSize: '20px',
            fontWeight: '800',
            letterSpacing: '-0.01em'
          }}>
            LOMEN CLUB
          </Offcanvas.Title>
          <button
            onClick={handleMobileMenuClose}
            style={{
              border: 'none',
              background: 'transparent',
              color: 'var(--text-primary)',
              padding: '8px',
              borderRadius: '6px'
            }}
          >
            <X size={24} />
          </button>
        </Offcanvas.Header>
        
        <Offcanvas.Body style={{ padding: '0' }}>
          {/* Section Navigation */}
          {!isAppRoute && scrollToAbout && scrollToRoadmap && scrollToTeam && scrollToPartners && (
            <div style={{ padding: '16px', borderBottom: '1px solid var(--border-primary)' }}>
              <div style={{ 
                color: 'var(--text-secondary)', 
                fontSize: '0.75rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '12px'
              }}>
                Navigation
              </div>
              
              <button
                onClick={() => handleSectionClick(scrollToAbout)}
                style={{
                  width: '100%',
                  height: '48px',
                  padding: '0 16px',
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--text-primary)',
                  textAlign: 'left',
                  fontSize: '1rem',
                  fontWeight: 500,
                  borderRadius: '8px',
                  marginBottom: '8px',
                  transition: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--bg-elevated)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                About
              </button>
              
              <button
                onClick={() => handleSectionClick(scrollToRoadmap)}
                style={{
                  width: '100%',
                  height: '48px',
                  padding: '0 16px',
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--text-primary)',
                  textAlign: 'left',
                  fontSize: '1rem',
                  fontWeight: 500,
                  borderRadius: '8px',
                  marginBottom: '8px',
                  transition: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--bg-elevated)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                Roadmap
              </button>

              <button
                onClick={() => handleSectionClick(scrollToTeam)}
                style={{
                  width: '100%',
                  height: '48px',
                  padding: '0 16px',
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--text-primary)',
                  textAlign: 'left',
                  fontSize: '1rem',
                  fontWeight: 500,
                  borderRadius: '8px',
                  marginBottom: '8px',
                  transition: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--bg-elevated)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                Team
              </button>

              <button
                onClick={() => handleSectionClick(scrollToPartners)}
                style={{
                  width: '100%',
                  height: '48px',
                  padding: '0 16px',
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--text-primary)',
                  textAlign: 'left',
                  fontSize: '1rem',
                  fontWeight: 500,
                  borderRadius: '8px',
                  transition: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--bg-elevated)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                Partners
              </button>
            </div>
          )}

          {/* App Link */}
          {!isAppRoute && (
            <div style={{ padding: '16px', borderBottom: '1px solid var(--border-primary)' }}>
              <Link
                to="/app"
                onClick={handleMobileMenuClose}
                style={{
                  display: 'block',
                  width: '100%',
                  height: '48px',
                  padding: '0 16px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #23AF91 0%, #1A8C70 100%)',
                  color: 'white',
                  textAlign: 'center',
                  fontSize: '1rem',
                  fontWeight: 600,
                  borderRadius: '8px',
                  textDecoration: 'none',
                  lineHeight: '48px',
                  boxShadow: '0 4px 12px rgba(35, 175, 145, 0.3)'
                }}
              >
                Launch App
              </Link>
            </div>
          )}

          {/* Social Media Links */}
          {!isAppRoute && (
            <div style={{ padding: '16px', borderBottom: '1px solid var(--border-primary)' }}>
              <div style={{ 
                color: 'var(--text-secondary)', 
                fontSize: '0.75rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '12px'
              }}>
                Follow Us
              </div>
              
              <div style={{ display: 'flex', gap: '12px' }}>
                <a
                  href="https://github.com/lomen-club"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="d-flex align-items-center justify-content-center"
                  aria-label="GitHub"
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '8px',
                    backgroundColor: 'transparent',
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--border-primary)',
                    transition: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
                    textDecoration: 'none'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--bg-elevated)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.color = '#333';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.color = 'var(--text-secondary)';
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                </a>
                
                <a
                  href="https://t.me/lomenclub"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="d-flex align-items-center justify-content-center"
                  aria-label="Telegram"
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '8px',
                    backgroundColor: 'transparent',
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--border-primary)',
                    transition: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
                    textDecoration: 'none'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--bg-elevated)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.color = '#0088cc';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.color = 'var(--text-secondary)';
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.14.141-.259.259-.374.261l.213-3.053 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.136-.954l11.566-4.458c.538-.196 1.006.128.832.941z"/>
                  </svg>
                </a>
                
                <a
                  href="https://x.com/lomenclub"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="d-flex align-items-center justify-content-center"
                  aria-label="X (formerly Twitter)"
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '8px',
                    backgroundColor: 'transparent',
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--border-primary)',
                    transition: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
                    textDecoration: 'none',
                    fontWeight: '700',
                    fontSize: '18px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--bg-elevated)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.color = '#000000';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.color = 'var(--text-secondary)';
                  }}
                >
                  𝕏
                </a>
                
                <a
                  href="https://www.youtube.com/@lomenclub"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="d-flex align-items-center justify-content-center"
                  aria-label="YouTube"
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '8px',
                    backgroundColor: 'transparent',
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--border-primary)',
                    transition: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
                    textDecoration: 'none'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--bg-elevated)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.color = '#FF0000';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.color = 'var(--text-secondary)';
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
                  </svg>
                </a>
              </div>
            </div>
          )}
        </Offcanvas.Body>
      </Offcanvas>

      {/* Wallet Connect Modal */}
      <WalletConnectModal 
        show={showWalletModal} 
        onHide={() => setShowWalletModal(false)} 
      />
    </>
  );
};

export default TopNav;
