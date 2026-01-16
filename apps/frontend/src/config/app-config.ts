// App Configuration
// Set showComingSoon to true to display a "Coming Soon" overlay on the app
// Set to false to show the actual app content

export const appConfig = {
  showComingSoon: import.meta.env.VITE_APP_SHOW_COMING_SOON === 'true' || false,
  comingSoonMessage: import.meta.env.VITE_APP_COMING_SOON_MESSAGE || "Coming Soon - We're working on something amazing!",
  backgroundColor: import.meta.env.VITE_APP_BACKGROUND_COLOR || "rgba(0, 0, 0, 0.8)",
  textColor: import.meta.env.VITE_APP_TEXT_COLOR || "#ffffff"
};

export default appConfig;
