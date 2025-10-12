import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { MessageCircle, Github, Heart, Youtube } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer style={{
      backgroundColor: 'var(--bg-surface)',
      borderTop: '1px solid var(--border-primary)',
      padding: '32px 0 24px',
      marginTop: 'auto'
    }}>
      <Container>
        <Row className="align-items-center">
          <Col md={6}>
            <div className="d-flex align-items-center" style={{ gap: '12px' }}>
              <div style={{
                color: '#23AF91',
                fontSize: '18px',
                fontWeight: '800',
                letterSpacing: '-0.01em'
              }}>
                LOMEN CLUB
              </div>
              <div style={{
                color: 'var(--text-muted)',
                fontSize: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <span>Made with</span>
                <Heart size={12} style={{ color: '#EF4444' }} />
                <span>for the community</span>
              </div>
            </div>
            <p style={{
              color: 'var(--text-secondary)',
              fontSize: '0.75rem',
              margin: '8px 0 0',
              lineHeight: 1.4
            }}>
              Your premier NFT community platform. Connect, collect, and create together.
            </p>
          </Col>
          
          <Col md={6}>
            <div className="d-flex justify-content-md-end align-items-center" style={{ gap: '16px' }}>
              <div style={{
                color: 'var(--text-muted)',
                fontSize: '0.75rem',
                fontWeight: 500
              }}>
                Join our community
              </div>
              
              <div className="d-flex" style={{ gap: '12px' }}>
                <a
                  href="#"
                  aria-label="X (formerly Twitter)"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '36px',
                    height: '36px',
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
                  aria-label="YouTube"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '36px',
                    height: '36px',
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
                  <Youtube size={18} />
                </a>
                
                <a
                  href="#"
                  aria-label="Discord"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '36px',
                    height: '36px',
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
                    e.currentTarget.style.color = '#5865F2';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.color = 'var(--text-secondary)';
                  }}
                >
                  <MessageCircle size={18} />
                </a>
                
                <a
                  href="#"
                  aria-label="GitHub"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '36px',
                    height: '36px',
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
                  <Github size={18} />
                </a>
              </div>
            </div>
          </Col>
        </Row>
        
        <Row style={{ marginTop: '24px' }}>
          <Col>
            <div style={{
              borderTop: '1px solid var(--border-primary)',
              paddingTop: '16px'
            }}>
              <div className="d-flex justify-content-between align-items-center">
                <div style={{
                  color: 'var(--text-muted)',
                  fontSize: '0.6875rem',
                  fontWeight: 500
                }}>
                  © 2025 Lomen Club. All rights reserved.
                </div>
                
                <div className="d-flex" style={{ gap: '20px' }}>
                  <a
                    href="/terms"
                    style={{
                      color: 'var(--text-secondary)',
                      fontSize: '0.75rem',
                      textDecoration: 'none',
                      transition: 'color 150ms cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = '#23AF91';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = 'var(--text-secondary)';
                    }}
                  >
                    Terms
                  </a>
                  <a
                    href="/privacy"
                    style={{
                      color: 'var(--text-secondary)',
                      fontSize: '0.75rem',
                      textDecoration: 'none',
                      transition: 'color 150ms cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = '#23AF91';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = 'var(--text-secondary)';
                    }}
                  >
                    Privacy
                  </a>
                </div>
              </div>
            </div>
          </Col>
        </Row>
      </Container>
    </footer>
  );
};

export default Footer;
