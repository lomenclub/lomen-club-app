import React from 'react';
import { Card } from 'react-bootstrap';
import PageHeader from '../components/PageHeader';

const Eligibility: React.FC = () => {
  return (
    <div>
      <PageHeader 
        title="Eligibility" 
        subtitle="Check your eligibility status and requirements"
      />

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
        <Card.Body style={{ padding: '32px' }}>
          <p style={{
            color: 'var(--text-secondary)',
            fontSize: '1rem',
            lineHeight: 1.6,
            margin: 0,
            textAlign: 'center'
          }}>
            Eligibility checking and verification features will be implemented in a future phase.
          </p>
        </Card.Body>
      </Card>
    </div>
  );
};

export default Eligibility;
