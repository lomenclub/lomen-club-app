import React, { ReactNode } from 'react';
import { Row, Col } from 'react-bootstrap';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, actions }) => {
  return (
    <div style={{ marginBottom: '48px' }}>
      <Row className="align-items-center">
        <Col>
          <h1 style={{
            fontSize: 'clamp(2rem, 4vw, 2.5rem)',
            fontWeight: 800,
            color: 'var(--text-primary)',
            marginBottom: '12px',
            letterSpacing: '-0.02em',
            lineHeight: 1.1
          }}>
            {title}
          </h1>
          {subtitle && (
            <p style={{
              fontSize: '1.125rem',
              color: 'var(--text-secondary)',
              margin: 0,
              lineHeight: 1.6,
              maxWidth: '600px'
            }}>
              {subtitle}
            </p>
          )}
        </Col>
        {actions && (
          <Col xs="auto">
            {actions}
          </Col>
        )}
      </Row>
    </div>
  );
};

export default PageHeader;
