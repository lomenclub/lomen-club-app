# Lomen Club - Phase 0 UI/UX Baseline

A production-ready UI shell for Lomen Club with a dark-first theme and primary color #24AE8F. Built with React 18, Vite, TypeScript, and React-Bootstrap.

## Features

- **Dark-First Theme**: Default dark theme with light mode toggle
- **Responsive Layout**: Sticky top navigation, collapsible sidebar, fluid content area
- **Theme Persistence**: Theme preference saved in localStorage and applied before first paint
- **Accessibility**: Visible focus rings, proper ARIA labels, high contrast ratios
- **Clean Architecture**: TypeScript, CSS variables for design tokens, reusable components

## Tech Stack

- **Frontend**: React 18 + Vite + TypeScript
- **UI Framework**: React-Bootstrap + Bootstrap
- **Routing**: React Router DOM
- **Icons**: Lucide React
- **Styling**: CSS Variables (Design Tokens)

## Design Tokens

All design tokens are defined in `src/design-tokens.css` using CSS custom properties:

### Colors
- **Primary**: #24AE8F (hover: #12946C)
- **Dark Theme**: Background #0B1220, Surface #0F172A, Text #E6E8EC
- **Light Theme**: Background #FFFFFF, Surface #F8FAFC, Text #0F172A
- **Semantic**: Success #16A34A, Warning #F59E0B, Danger #EF4444

### Spacing & Layout
- **Spacing Scale**: 4, 8, 12, 16, 20, 24, 32, 40, 48px
- **Border Radius**: 6px (sm), 12px (cards)
- **Transitions**: 150-200ms ease-in-out

## Theme Engine

The theme engine works by:
1. Setting `data-theme="dark|light"` on the `<html>` element
2. Persisting user preference in localStorage (`lomen-theme`)
3. Applying theme before first paint to prevent flash of unstyled content
4. Using CSS variables that change based on the data-theme attribute

## Project Structure

```
src/
├── components/
│   ├── Layout.tsx          # Main layout with nav, sidebar, content
│   ├── TopNav.tsx          # Sticky top navigation
│   ├── Sidebar.tsx         # Left navigation sidebar
│   ├── PageHeader.tsx      # Reusable page header component
│   └── ErrorBoundary.tsx   # Error boundary with fallback UI
├── contexts/
│   └── ThemeContext.tsx    # Theme management with React Context
├── pages/
│   ├── Dashboard.tsx       # Dashboard with stats and sample table
│   ├── Profile.tsx         # Profile management
│   ├── Eligibility.tsx     # Eligibility checking
│   ├── Rewards.tsx         # Rewards and points
│   ├── Governance.tsx      # Community governance
│   └── Admin.tsx           # Administrative tools
├── design-tokens.css       # CSS variables and global styles
├── App.tsx                 # Root app component
└── main.tsx               # Application entry point
```

## Routes

- `/` - Dashboard
- `/profile` - User profile
- `/eligibility` - Eligibility checking
- `/rewards` - Rewards management
- `/governance` - Community governance
- `/admin` - Administrative overview

## Getting Started

### Prerequisites
- Node.js 16+ 
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm run dev
```

3. Open your browser to `http://localhost:3000`

### Build for Production

```bash
npm run build
```

### Linting

```bash
npm run lint
```

## Accessibility Features

- Visible focus rings for keyboard navigation
- ARIA labels on icon-only buttons
- High contrast color ratios (≥4.5:1)
- Semantic HTML structure
- Proper heading hierarchy

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Future Phases

This is Phase 0 - UI/UX Baseline. Future phases will include:
- Backend integration (NestJS + Postgres)
- Web3 wallet integration
- Authentication (JWT + SIWE)
- Smart contract interactions
- Real-time features

## Development Guidelines

- Use TypeScript for all new components
- Follow the design token system (no hard-coded colors)
- Ensure accessibility compliance
- Maintain zero console warnings
- Write clean, reusable components
