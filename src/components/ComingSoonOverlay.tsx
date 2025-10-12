import React from 'react';
import { appConfig } from '../config/app-config';

interface ComingSoonOverlayProps {
  children: React.ReactNode;
}

const ComingSoonOverlay: React.FC<ComingSoonOverlayProps> = ({ children }) => {
  if (!appConfig.showComingSoon) {
    return <>{children}</>;
  }

  return (
    <div style={{ position: 'relative' }}>
      {/* Main content dimmed */}
      <div style={{
        filter: 'blur(2px)',
        opacity: 0.3,
        pointerEvents: 'none',
        userSelect: 'none'
      }}>
        {children}
      </div>
      
      {/* Coming Soon Overlay */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: appConfig.backgroundColor,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        borderRadius: '12px'
      }}>
        <div style={{
          textAlign: 'center',
          padding: '40px',
          maxWidth: '500px'
        }}>
          <div style={{
            fontSize: '48px',
            fontWeight: '800',
            color: appConfig.textColor,
            marginBottom: '16px',
            background: 'linear-gradient(135deg, #23AF91 0%, #1A8C70 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            COMING SOON
          </div>
          
          <p style={{
            fontSize: '18px',
            color: appConfig.textColor,
            marginBottom: '32px',
            lineHeight: 1.6
          }}>
            {appConfig.comingSoonMessage}
          </p>
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px'
          }}>
            <div style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: '#23AF91',
              animation: 'pulse 2s infinite'
            }} />
            <div style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: '#23AF91',
              animation: 'pulse 2s infinite 0.3s'
            }} />
            <div style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: '#23AF91',
              animation: 'pulse 2s infinite 0.6s'
            }} />
          </div>
        </div>
      </div>

      <style>
        {`
          @keyframes pulse {
            0%, 100% {
              opacity: 1;
              transform: scale(1);
            }
            50% {
              opacity: 0.5;
              transform: scale(0.8);
            }
          }
        `}
      </style>
    </div>
  );
};

export default ComingSoonOverlay;
