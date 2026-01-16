# App Configuration Guide

## Coming Soon Overlay

The app includes a configurable "Coming Soon" overlay that can be easily toggled on/off.

### How to Use:

1. **Enable Coming Soon Mode** (default):
   - Open `src/config/app-config.ts`
   - Set `showComingSoon: true`
   - The app will show a dimmed overlay with "COMING SOON" message

2. **Disable Coming Soon Mode** (show actual app):
   - Open `src/config/app-config.ts`
   - Set `showComingSoon: false`
   - The app will display normally without any overlay

### Configuration Options:

```typescript
export const appConfig = {
  showComingSoon: true, // true = show overlay, false = show app
  comingSoonMessage: "Coming Soon - We're working on something amazing!",
  backgroundColor: "rgba(0, 0, 0, 0.8)", // Overlay background
  textColor: "#ffffff" // Text color
};
```

### Features:

- **Dimmed Content**: App content is blurred and dimmed when overlay is active
- **Non-interactive**: Users cannot interact with the app when overlay is shown
- **Animated**: Includes pulsing dots animation
- **Branded**: Uses Lomen Club green gradient for the "COMING SOON" text

### Quick Toggle:

To quickly switch between modes, simply change the `showComingSoon` value and save the file. The development server will automatically reload and show the updated state.

### File Location:
- Configuration: `src/config/app-config.ts`
- Overlay Component: `src/components/ComingSoonOverlay.tsx`
- Implementation: `src/components/Layout.tsx`
