import React from 'react';
import { Card, Row, Col } from 'react-bootstrap';
import PageHeader from '../components/PageHeader';
import { useWallet } from '../hooks/useWallet';

const Profile: React.FC = () => {
  const { isConnected, account, chainId, kcsBalance, connectWallet, isConnecting } = useWallet();

  return (
    <div>
      <PageHeader 
        title="Profile" 
        subtitle="Manage your account settings and preferences"
      />

      <Row className="g-4">
        <Col lg={8}>
          <Card style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-primary)',
            borderRadius: '16px',
            transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.12)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
          >
            <Card.Header style={{
              background: 'transparent',
              borderBottom: '1px solid var(--border-primary)',
              padding: '20px 24px'
            }}>
              <h5 style={{
                margin: 0,
                fontSize: '1.25rem',
                fontWeight: 700,
                color: 'var(--text-primary)'
              }}>
                Personal Information
              </h5>
            </Card.Header>
            <Card.Body style={{ padding: '24px' }}>
              <p style={{
                color: 'var(--text-secondary)',
                fontSize: '1rem',
                lineHeight: 1.6,
                margin: 0
              }}>
                Profile management functionality will be implemented in a future phase.
              </p>
            </Card.Body>
          </Card>
        </Col>
        
        <Col lg={4}>
          <Card style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-primary)',
            borderRadius: '16px',
            transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.12)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
          >
            <Card.Header style={{
              background: 'transparent',
              borderBottom: '1px solid var(--border-primary)',
              padding: '20px 24px'
            }}>
              <h5 style={{
                margin: 0,
                fontSize: '1.25rem',
                fontWeight: 700,
                color: 'var(--text-primary)'
              }}>
                Wallet Information
              </h5>
            </Card.Header>
            <Card.Body style={{ padding: '24px' }}>
              {isConnected ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <div style={{
                      color: 'var(--text-secondary)',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      marginBottom: '4px'
                    }}>
                      Wallet Address
                    </div>
                    <div style={{
                      color: 'var(--text-primary)',
                      fontSize: '1rem',
                      fontWeight: 500,
                      fontFamily: 'monospace',
                      backgroundColor: 'var(--bg-primary)',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid var(--border-primary)'
                    }}>
                      {account}
                    </div>
                  </div>
                  
                  <div>
                    <div style={{
                      color: 'var(--text-secondary)',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      marginBottom: '4px'
                    }}>
                      Network
                    </div>
                    <div style={{
                      color: chainId === '0x141' ? '#16A34A' : '#EF4444',
                      fontSize: '1rem',
                      fontWeight: 500,
                      backgroundColor: 'var(--bg-primary)',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid var(--border-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <div style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: chainId === '0x141' ? '#16A34A' : '#EF4444'
                      }} />
                      {chainId === '0x141' ? 'KCC Mainnet' : `Chain ID: ${chainId}`}
                    </div>
                  </div>
                  
                  <div>
                    <div style={{
                      color: 'var(--text-secondary)',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      marginBottom: '4px'
                    }}>
                      KCS Balance
                    </div>
                    <div style={{
                      color: 'var(--text-primary)',
                      fontSize: '1rem',
                      fontWeight: 500,
                      backgroundColor: 'var(--bg-primary)',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid var(--border-primary)'
                    }}>
                      {chainId === '0x141' ? (kcsBalance ? `${kcsBalance} KCS` : 'Loading...') : 'Switch to KCC to view balance'}
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <p style={{
                    color: 'var(--text-secondary)',
                    fontSize: '1rem',
                    marginBottom: '16px'
                  }}>
                    Connect your wallet to view wallet information
                  </p>
                  <button
                    onClick={connectWallet}
                    disabled={isConnecting}
                    style={{
                      height: '40px',
                      padding: '0 20px',
                      border: 'none',
                      background: isConnecting 
                        ? 'var(--bg-elevated)' 
                        : 'linear-gradient(135deg, #23AF91 0%, #1A8C70 100%)',
                      color: isConnecting ? 'var(--text-secondary)' : 'white',
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      transition: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
                      boxShadow: isConnecting ? 'none' : '0 4px 12px rgba(35, 175, 145, 0.3)'
                    }}
                    onMouseEnter={(e) => {
                      if (!e.currentTarget.disabled && !isConnecting) {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 6px 16px rgba(35, 175, 145, 0.4)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = isConnecting ? 'none' : '0 4px 12px rgba(35, 175, 145, 0.3)';
                    }}
                  >
                    {isConnecting ? 'Connecting...' : 'Connect Wallet'}
                  </button>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Profile;
