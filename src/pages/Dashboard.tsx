import React from 'react';
import { Card, Table, Badge, Row, Col } from 'react-bootstrap';
import PageHeader from '../components/PageHeader';

const Dashboard: React.FC = () => {
  // Sample data for the placeholder table
  const sampleData = [
    { id: 1, name: 'John Doe', status: 'Active', points: 1500, joined: '2024-01-15' },
    { id: 2, name: 'Jane Smith', status: 'Pending', points: 800, joined: '2024-02-20' },
    { id: 3, name: 'Mike Johnson', status: 'Active', points: 2200, joined: '2024-01-08' },
    { id: 4, name: 'Sarah Wilson', status: 'Inactive', points: 500, joined: '2024-03-10' },
    { id: 5, name: 'Alex Brown', status: 'Active', points: 1800, joined: '2024-02-05' },
  ];

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'Active': return 'success';
      case 'Pending': return 'warning';
      case 'Inactive': return 'secondary';
      default: return 'secondary';
    }
  };

  return (
    <div>
      <PageHeader 
        title="Dashboard" 
        subtitle="Welcome to Lomen Club - Your membership dashboard"
      />

      {/* Stats Cards - Modern Design */}
      <Row className="g-4 mb-5">
        <Col md={6} lg={3}>
          <Card style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-primary)',
            borderRadius: '16px',
            height: '100%',
            transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 12px 32px rgba(0, 0, 0, 0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
          >
            <Card.Body style={{ padding: '24px' }}>
              <div style={{
                fontSize: '0.875rem',
                color: 'var(--text-secondary)',
                marginBottom: '12px',
                fontWeight: 600
              }}>
                Total Members
              </div>
              <div style={{
                fontSize: '2rem',
                fontWeight: 800,
                color: 'var(--text-primary)',
                marginBottom: '8px',
                lineHeight: 1
              }}>
                1,247
              </div>
              <Badge style={{
                background: 'rgba(35, 175, 145, 0.15)',
                color: '#23AF91',
                border: '1px solid rgba(35, 175, 145, 0.4)',
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '4px 12px'
              }}>
                +12%
              </Badge>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6} lg={3}>
          <Card style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-primary)',
            borderRadius: '16px',
            height: '100%',
            transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 12px 32px rgba(0, 0, 0, 0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
          >
            <Card.Body style={{ padding: '24px' }}>
              <div style={{
                fontSize: '0.875rem',
                color: 'var(--text-secondary)',
                marginBottom: '12px',
                fontWeight: 600
              }}>
                Active Rewards
              </div>
              <div style={{
                fontSize: '2rem',
                fontWeight: 800,
                color: 'var(--text-primary)',
                marginBottom: '8px',
                lineHeight: 1
              }}>
                24
              </div>
              <Badge style={{
                background: 'rgba(22, 163, 74, 0.15)',
                color: '#16A34A',
                border: '1px solid rgba(22, 163, 74, 0.4)',
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '4px 12px'
              }}>
                +3
              </Badge>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6} lg={3}>
          <Card style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-primary)',
            borderRadius: '16px',
            height: '100%',
            transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 12px 32px rgba(0, 0, 0, 0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
          >
            <Card.Body style={{ padding: '24px' }}>
              <div style={{
                fontSize: '0.875rem',
                color: 'var(--text-secondary)',
                marginBottom: '12px',
                fontWeight: 600
              }}>
                Avg Points
              </div>
              <div style={{
                fontSize: '2rem',
                fontWeight: 800,
                color: 'var(--text-primary)',
                marginBottom: '8px',
                lineHeight: 1
              }}>
                1,560
              </div>
              <Badge style={{
                background: 'rgba(59, 130, 246, 0.15)',
                color: '#3B82F6',
                border: '1px solid rgba(59, 130, 246, 0.4)',
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '4px 12px'
              }}>
                +5%
              </Badge>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6} lg={3}>
          <Card style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-primary)',
            borderRadius: '16px',
            height: '100%',
            transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 12px 32px rgba(0, 0, 0, 0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
          >
            <Card.Body style={{ padding: '24px' }}>
              <div style={{
                fontSize: '0.875rem',
                color: 'var(--text-secondary)',
                marginBottom: '12px',
                fontWeight: 600
              }}>
                Governance
              </div>
              <div style={{
                fontSize: '2rem',
                fontWeight: 800,
                color: 'var(--text-primary)',
                marginBottom: '8px',
                lineHeight: 1
              }}>
                8
              </div>
              <Badge style={{
                background: 'rgba(245, 158, 11, 0.15)',
                color: '#F59E0B',
                border: '1px solid rgba(245, 158, 11, 0.4)',
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '4px 12px'
              }}>
                Active
              </Badge>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Sample Table - Modern Design */}
      <Card style={{
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-primary)',
        borderRadius: '16px',
        overflow: 'hidden'
      }}>
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
            Recent Members
          </h5>
        </Card.Header>
        <Card.Body style={{ padding: 0 }}>
          <Table responsive hover style={{ margin: 0 }}>
            <thead>
              <tr style={{
                background: 'rgba(255, 255, 255, 0.03)',
                borderBottom: '1px solid var(--border-primary)'
              }}>
                <th style={{
                  padding: '16px 24px',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  border: 'none'
                }}>ID</th>
                <th style={{
                  padding: '16px 24px',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  border: 'none'
                }}>Name</th>
                <th style={{
                  padding: '16px 24px',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  border: 'none'
                }}>Status</th>
                <th style={{
                  padding: '16px 24px',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  border: 'none'
                }}>Points</th>
                <th style={{
                  padding: '16px 24px',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  border: 'none'
                }}>Joined</th>
              </tr>
            </thead>
            <tbody>
              {sampleData.map((member) => (
                <tr key={member.id} style={{
                  borderBottom: '1px solid var(--border-primary)',
                  transition: 'background-color 150ms ease'
                }}>
                  <td style={{
                    padding: '16px 24px',
                    fontSize: '0.875rem',
                    color: 'var(--text-muted)',
                    border: 'none'
                  }}>#{member.id}</td>
                  <td style={{
                    padding: '16px 24px',
                    fontSize: '0.875rem',
                    color: 'var(--text-primary)',
                    border: 'none',
                    fontWeight: 500
                  }}>{member.name}</td>
                  <td style={{
                    padding: '16px 24px',
                    border: 'none'
                  }}>
                    <Badge bg={getStatusVariant(member.status)} style={{
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      padding: '4px 12px'
                    }}>
                      {member.status}
                    </Badge>
                  </td>
                  <td style={{
                    padding: '16px 24px',
                    fontSize: '0.875rem',
                    color: 'var(--text-primary)',
                    border: 'none',
                    fontWeight: 600
                  }}>{member.points.toLocaleString()}</td>
                  <td style={{
                    padding: '16px 24px',
                    fontSize: '0.875rem',
                    color: 'var(--text-muted)',
                    border: 'none'
                  }}>{member.joined}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </div>
  );
};

export default Dashboard;
