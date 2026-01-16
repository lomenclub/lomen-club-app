import React from 'react';
import { Nav } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import { 
  LayoutDashboard, 
  User, 
  CheckCircle, 
  Gift, 
  Users,
  Settings,
  ShoppingBag,
  Search
} from 'lucide-react';

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ mobileOpen = false, onMobileClose }) => {
  const navItems = [
    { path: '/app', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/app/profile', label: 'Profile', icon: User },
    { path: '/app/eligibility', label: 'Eligibility', icon: CheckCircle },
    { path: '/app/rewards', label: 'Rewards', icon: Gift },
    { path: '/app/governance', label: 'Governance', icon: Users },
    { path: '/app/marketplace', label: 'Marketplace', icon: ShoppingBag },
    { path: '/app/explorer', label: 'NFT Explorer', icon: Search },
  ];

  const adminItems = [
    { path: '/app/admin', label: 'Overview', icon: Settings },
  ];

  const handleNavClick = () => {
    if (onMobileClose) {
      onMobileClose();
    }
  };

  return (
    <>
      <div 
        className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`}
        onClick={handleNavClick}
      >
        <Nav className="flex-column">
          {/* Core Navigation */}
          <div className="nav-section">CORE</div>
          {navItems.map((item) => (
            <LinkContainer key={item.path} to={item.path}>
              <Nav.Link className="d-flex align-items-center">
                <item.icon size={16} className="me-3" />
                {item.label}
              </Nav.Link>
            </LinkContainer>
          ))}

          {/* Admin Navigation */}
          <div className="nav-section">ADMIN</div>
          {adminItems.map((item) => (
            <LinkContainer key={item.path} to={item.path}>
              <Nav.Link className="d-flex align-items-center">
                <item.icon size={16} className="me-3" />
                {item.label}
              </Nav.Link>
            </LinkContainer>
          ))}
        </Nav>
      </div>
      
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div 
          className="sidebar-overlay mobile-open"
          onClick={handleNavClick}
        />
      )}
    </>
  );
};

export default Sidebar;
