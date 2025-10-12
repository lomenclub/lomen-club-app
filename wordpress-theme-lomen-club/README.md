# Lomen Club WordPress Theme

A modern dark-first WordPress theme that perfectly matches the design of the Lomen Club React application. Features a beautiful dark theme with primary green accent (#24AE8F), responsive design, and full blog functionality.

## 🎨 Design Features

- **Dark-First Design**: Beautiful dark theme matching the Lomen Club brand
- **Primary Green Accent**: #24AE8F color scheme throughout
- **Modern Typography**: Inter font family with proper hierarchy
- **Responsive Design**: Mobile-first approach with breakpoints
- **Smooth Animations**: CSS transitions and hover effects
- **Accessibility**: WCAG compliant with proper focus states

## 📁 Theme Structure

```
wordpress-theme-lomen-club/
├── style.css                 # Main stylesheet with theme header
├── functions.php             # Theme functions and features
├── header.php                # Header template
├── footer.php                # Footer template
├── index.php                 # Main template (homepage)
├── README.md                 # This file
└── screenshot.png            # Theme screenshot (optional)
```

## 🚀 Installation

1. **Upload the Theme**:
   - Download the `wordpress-theme-lomen-club` folder
   - Upload it to your WordPress installation at `/wp-content/themes/`
   - Alternatively, zip the folder and upload via WordPress admin

2. **Activate the Theme**:
   - Go to Appearance → Themes in WordPress admin
   - Find "Lomen Club" theme and click "Activate"

3. **Configure Settings**:
   - Go to Appearance → Menus to set up navigation
   - Go to Appearance → Customize to add a logo
   - Set up your blog posts and pages

## 🛠 Required Setup

### Navigation Menu
1. Go to **Appearance → Menus**
2. Create a new menu named "Primary Menu"
3. Assign it to the "Primary" location
4. Add your desired pages and links

### Blog Setup
1. Go to **Settings → Reading**
2. Set "Your homepage displays" to "Your latest posts"
3. Or create a static homepage and set a separate posts page

### Custom Logo
1. Go to **Appearance → Customize → Site Identity**
2. Upload your logo (recommended size: 200x40px)

## 🎯 Theme Features

### Built-in Support
- ✅ Post thumbnails (featured images)
- ✅ Custom logo
- ✅ Navigation menus (primary & footer)
- ✅ HTML5 markup
- ✅ Custom background
- ✅ Title tag
- ✅ Editor styles
- ✅ WooCommerce support
- ✅ Block editor support

### Custom Widget Areas
- **Blog Sidebar**: For blog page widgets
- **Footer Widgets**: For footer content

### Security Features
- Security headers (X-Frame-Options, XSS Protection)
- WordPress version removal
- Input sanitization

### Performance
- Optimized CSS with CSS variables
- Google Fonts loading
- Minimal JavaScript

## 🎨 Customization

### CSS Variables
The theme uses CSS custom properties for easy customization:

```css
:root {
  --primary-500: #24AE8F;    /* Main green color */
  --bg-primary: #0B1220;     /* Background color */
  --text-primary: #E6E8EC;   /* Main text color */
  /* ... more variables */
}
```

### Color Schemes
- **Dark Theme**: Default dark mode with navy backgrounds
- **Light Theme**: Optional light mode (minimal implementation)

### Typography
- **Font Family**: Inter (Google Fonts)
- **Font Weights**: 400, 500, 600, 700, 800
- **Responsive**: Clamp functions for fluid typography

## 📱 Responsive Breakpoints

- **Mobile**: < 768px
- **Tablet**: 768px - 1024px  
- **Desktop**: > 1024px

## 🔗 Blog Integration

The theme includes a "Blog" link in the header that points to `https://blog.lomenclub.com`. To change this:

1. Edit `header.php`
2. Find the blog link in the navigation
3. Update the URL to your blog location

## 🐛 Troubleshooting

### Common Issues

1. **Menu not displaying**:
   - Ensure you've created and assigned a "Primary Menu"
   - Check menu location settings

2. **Styles not loading**:
   - Clear browser cache
   - Check theme activation
   - Verify file permissions

3. **Blog posts not showing**:
   - Check reading settings
   - Ensure posts are published
   - Verify post visibility

### Browser Support
- Chrome 88+
- Firefox 85+
- Safari 14+
- Edge 88+

## 📄 License

This theme is licensed under the GPL v2 or later.

## 🤝 Support

For theme support and customization requests, contact the Lomen Club team.

---

**Lomen Club WordPress Theme** - Bringing the beautiful Lomen Club design to WordPress.
