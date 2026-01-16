import React from 'react';
import { Card, Badge } from 'react-bootstrap';

interface DashboardCardProps {
  title: string;
  value: string | number;
  badgeText: string;
  badgeColor: string;
  badgeBorderColor: string;
  children?: React.ReactNode;
}

const DashboardCard: React.FC<DashboardCardProps> = ({
  title,
  value,
  badgeText,
  badgeColor,
  badgeBorderColor,
  children
}) => {
  return (
    <Card className="dashboard-card">
      <Card.Body className="dashboard-card-body">
        <div className="dashboard-card-title">{title}</div>
        <div className="dashboard-card-value">{value}</div>
        <Badge 
          className="dashboard-card-badge"
          style={{
            background: badgeColor,
            color: badgeBorderColor,
            border: `1px solid ${badgeBorderColor}`
          }}
        >
          {badgeText}
        </Badge>
        {children}
      </Card.Body>
    </Card>
  );
};

export default DashboardCard;
