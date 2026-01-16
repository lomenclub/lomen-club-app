import React from 'react';
import { Modal } from 'react-bootstrap';
import { Wallet, ExternalLink, X } from 'lucide-react';
import { useWallet } from '../hooks/useWallet';

interface WalletConnectModalProps {
  show: boolean;
  onHide: () => void;
}

const WalletConnectModal: React.FC<WalletConnectModalProps> = ({ show, onHide }) => {
  const { connectWallet, isConnecting } = useWallet();

  const walletOptions = [
    {
      id: 'metamask',
      name: 'MetaMask',
      description: 'Connect using MetaMask browser extension',
      icon: 'https://raw.githubusercontent.com/MetaMask/brand-resources/master/SVG/metamask-fox.svg',
      isPopular: true,
      onClick: () => {
        connectWallet();
        onHide();
      }
    }
  ];

  return (
    <Modal 
      show={show} 
      onHide={onHide}
      centered
      size="sm"
      style={{ backdropFilter: 'blur(8px)' }}
    >
      <Modal.Header style={{
        background: 'var(--bg-elevated)',
        borderBottom: '1px solid var(--border-primary)',
        padding: '24px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #23AF91 0%, #1A8C70 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Wallet size={20} color="white" />
            </div>
            <div>
              <h5 style={{
                margin: 0,
                fontSize: '1.25rem',
                fontWeight: 700,
                color: 'var(--text-primary)'
              }}>
                Connect Wallet
              </h5>
              <p style={{
                margin: '4px 0 0',
                fontSize: '0.875rem',
                color: 'var(--text-secondary)'
              }}>
                Choose your preferred wallet
              </p>
            </div>
          </div>
          <button
            onClick={onHide}
            style={{
              border: 'none',
              background: 'transparent',
              color: 'var(--text-secondary)',
              padding: '8px',
              borderRadius: '8px',
              transition: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)'
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
            <X size={20} />
          </button>
        </div>
      </Modal.Header>

      <Modal.Body style={{ 
        background: 'var(--bg-elevated)',
        padding: '24px'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {walletOptions.map((wallet) => (
            <button
              key={wallet.id}
              onClick={wallet.onClick}
              disabled={isConnecting && wallet.id === 'metamask'}
              style={{
                width: '100%',
                padding: '20px',
                border: '1px solid var(--border-primary)',
                background: 'transparent',
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                if (!e.currentTarget.disabled) {
                  e.currentTarget.style.backgroundColor = 'var(--bg-primary)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.borderColor = '#23AF91';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(35, 175, 145, 0.15)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = 'var(--border-primary)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'var(--bg-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden'
              }}>
                {wallet.icon ? (
                  <img 
                    src={wallet.icon} 
                    alt={wallet.name}
                    style={{ 
                      width: wallet.id === 'metamask' ? '32px' : '28px', 
                      height: wallet.id === 'metamask' ? '32px' : '28px',
                      objectFit: 'contain'
                    }}
                    onError={(e) => {
                      // Fallback to first letter if icon fails to load
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent) {
                        parent.textContent = wallet.name.charAt(0);
                        parent.style.fontSize = '20px';
                        parent.style.fontWeight = 'bold';
                        parent.style.color = 'var(--text-primary)';
                      }
                    }}
                  />
                ) : (
                  <div style={{
                    fontSize: '20px',
                    fontWeight: 'bold',
                    color: 'var(--text-primary)'
                  }}>
                    {wallet.name.charAt(0)}
                  </div>
                )}
              </div>
              <div style={{ flex: 1, textAlign: 'left' }}>
                <div style={{
                  fontSize: '1.125rem',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  marginBottom: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  {wallet.name}
                  {isConnecting && wallet.id === 'metamask' && (
                    <span style={{
                      fontSize: '0.75rem',
                      color: '#23AF91',
                      fontWeight: 600,
                      padding: '2px 8px',
                      backgroundColor: 'rgba(35, 175, 145, 0.1)',
                      borderRadius: '12px'
                    }}>
                      Connecting...
                    </span>
                  )}
                </div>
                <div style={{
                  fontSize: '0.875rem',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.4
                }}>
                  {wallet.description}
                </div>
              </div>
              <ExternalLink size={18} color="var(--text-secondary)" />
            </button>
          ))}
        </div>
      </Modal.Body>

      <Modal.Footer style={{
        background: 'var(--bg-elevated)',
        borderTop: '1px solid var(--border-primary)',
        padding: '16px 24px'
      }}>
        <p style={{
          margin: 0,
          fontSize: '0.75rem',
          color: 'var(--text-secondary)',
          textAlign: 'center',
          lineHeight: 1.4
        }}>
          By connecting your wallet, you agree to our{' '}
          <a href="/terms" style={{ color: '#23AF91', textDecoration: 'none' }}>
            Terms of Service
          </a>{' '}
          and{' '}
          <a href="/privacy" style={{ color: '#23AF91', textDecoration: 'none' }}>
            Privacy Policy
          </a>
        </p>
      </Modal.Footer>
    </Modal>
  );
};

export default WalletConnectModal;
