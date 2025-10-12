<!DOCTYPE html>
<html <?php language_attributes(); ?> data-theme="dark">
<head>
    <meta charset="<?php bloginfo('charset'); ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="profile" href="https://gmpg.org/xfn/11">
    <style>
        /* Mobile menu toggle - hidden on desktop, shown on mobile */
        .mobile-menu-toggle {
            display: none;
        }
        
        /* Desktop navigation - shown on desktop, hidden on mobile */
        .main-navigation {
            display: flex;
        }
        
        /* Mobile menu - hidden by default */
        .mobile-menu {
            display: none;
        }
        
        /* Mobile responsive styles */
        @media (max-width: 768px) {
            .mobile-menu-toggle {
                display: flex;
            }
            
            .main-navigation {
                display: none !important;
            }
            
            .mobile-menu {
                display: block;
            }
        }
        
        /* Ensure burger menu doesn't appear on full screen */
        @media (min-width: 769px) {
            .mobile-menu-toggle {
                display: none !important;
            }
            
            .main-navigation {
                display: flex !important;
            }
            
            .mobile-menu {
                display: none !important;
            }
        }
    </style>
    <?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>
    <?php wp_body_open(); ?>
    
    <!-- Header matching React app exactly -->
    <header class="site-header" style="
        background-color: var(--bg-elevated);
        border-bottom: 1px solid var(--border-primary);
        min-height: 72px;
        padding: 0 32px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        box-shadow: var(--shadow-sm);
        position: sticky;
        top: 0;
        z-index: 1000;
    ">
        <div style="display: flex; align-items: center; gap: 16px; padding-left: 16px;">
            <!-- Mobile Menu Toggle -->
            <button class="mobile-menu-toggle" aria-label="Toggle navigation" style="
                border: none;
                background: transparent;
                color: var(--text-primary);
                padding: 12px;
                border-radius: 8px;
                transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
                min-width: 48px;
                min-height: 48px;
                display: flex;
                align-items: center;
                justify-content: center;
            ">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
                </svg>
            </button>
            
            <!-- Logo -->
            <a href="https://lomenclub.com" class="site-title" rel="home" target="_blank" style="
                font-family: 'Inter', system-ui, sans-serif;
                font-weight: 800;
                font-size: 20px;
                letter-spacing: -0.01em;
                text-transform: uppercase;
                margin: 0;
                padding: 0;
                color: #23AF91;
                text-decoration: none;
                text-shadow: 0 2px 4px rgba(35, 175, 145, 0.2);
            ">
                LOMEN CLUB
            </a>
        </div>
        
        <!-- Desktop Navigation -->
        <nav class="main-navigation" style="
            display: flex;
            align-items: center;
            gap: 12px;
            padding-right: 16px;
        ">
            <!-- Homepage Link -->
            <div class="desktop-nav" style="
                display: flex;
                align-items: center;
                gap: 8px;
                padding-right: 16px;
                border-right: 1px solid var(--border-primary);
            ">
                <a href="https://lomenclub.com" class="nav-section-btn" target="_blank" style="
                    height: 32px;
                    padding: 0 16px;
                    border: none;
                    background: transparent;
                    color: var(--text-secondary);
                    border-radius: 6px;
                    font-size: 0.875rem;
                    font-weight: 500;
                    transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
                    gap: 8px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    text-decoration: none;
                " onmouseenter="this.style.backgroundColor='var(--bg-elevated)'; this.style.color='var(--text-primary)';"
                onmouseleave="this.style.backgroundColor='transparent'; this.style.color='var(--text-secondary)';">
                    Homepage
                </a>
            </div>

            <!-- Social Media Links -->
            <div class="social-links" style="display: flex; align-items: center; gap: 8px;">
                <a href="https://github.com/lomen-club" target="_blank" rel="noopener noreferrer" class="social-link" aria-label="GitHub" style="
                    width: 40px;
                    height: 40px;
                    border-radius: 8px;
                    background-color: transparent;
                    color: var(--text-secondary);
                    border: 1px solid var(--border-primary);
                    transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
                    text-decoration: none;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                " onmouseenter="this.style.backgroundColor='var(--bg-elevated)'; this.style.transform='translateY(-1px)'; this.style.color='#333';"
                onmouseleave="this.style.backgroundColor='transparent'; this.style.transform='translateY(0)'; this.style.color='var(--text-secondary)';">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                    </svg>
                </a>
                
                <a href="https://t.me/lomenclub" target="_blank" rel="noopener noreferrer" class="social-link" aria-label="Telegram" style="
                    width: 40px;
                    height: 40px;
                    border-radius: 8px;
                    background-color: transparent;
                    color: var(--text-secondary);
                    border: 1px solid var(--border-primary);
                    transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
                    text-decoration: none;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                " onmouseenter="this.style.backgroundColor='var(--bg-elevated)'; this.style.transform='translateY(-1px)'; this.style.color='#0088cc';"
                onmouseleave="this.style.backgroundColor='transparent'; this.style.transform='translateY(0)'; this.style.color='var(--text-secondary)';">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.14.141-.259.259-.374.261l.213-3.053 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.136-.954l11.566-4.458c.538-.196 1.006.128.832.941z"/>
                    </svg>
                </a>
                
                <a href="https://x.com/lomenclub" target="_blank" rel="noopener noreferrer" class="social-link" aria-label="X (formerly Twitter)" style="
                    width: 40px;
                    height: 40px;
                    border-radius: 8px;
                    background-color: transparent;
                    color: var(--text-secondary);
                    border: 1px solid var(--border-primary);
                    transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
                    text-decoration: none;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 700;
                    font-size: 16px;
                " onmouseenter="this.style.backgroundColor='var(--bg-elevated)'; this.style.transform='translateY(-1px)'; this.style.color='#000000';"
                onmouseleave="this.style.backgroundColor='transparent'; this.style.transform='translateY(0)'; this.style.color='var(--text-secondary)';">
                    𝕏
                </a>
                
                <a href="https://www.youtube.com/@lomenclub" target="_blank" rel="noopener noreferrer" class="social-link" aria-label="YouTube" style="
                    width: 40px;
                    height: 40px;
                    border-radius: 8px;
                    background-color: transparent;
                    color: var(--text-secondary);
                    border: 1px solid var(--border-primary);
                    transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
                    text-decoration: none;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                " onmouseenter="this.style.backgroundColor='var(--bg-elevated)'; this.style.transform='translateY(-1px)'; this.style.color='#FF0000';"
                onmouseleave="this.style.backgroundColor='transparent'; this.style.transform='translateY(0)'; this.style.color='var(--text-secondary)';">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
                    </svg>
                </a>
            </div>

            <!-- Theme Toggle -->
            <button class="theme-toggle" style="
                height: 40px;
                padding: 0 16px;
                border: 1px solid var(--border-primary);
                background: transparent;
                color: var(--text-primary);
                border-radius: 8px;
                font-size: 0.875rem;
                font-weight: 600;
                transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
                gap: 8px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
            " onmouseenter="this.style.backgroundColor='var(--bg-elevated)'; this.style.transform='translateY(-1px)';"
            onmouseleave="this.style.backgroundColor='transparent'; this.style.transform='translateY(0)';">
                <svg class="theme-icon sun-icon" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style="display: block">
                    <path d="M12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zM12 3v2m0 14v2m9-9h-2M5 12H3m13.65-6.35l-1.42 1.42M6.35 17.65l-1.42 1.42m12.7 0l-1.42-1.42M6.35 6.35l-1.42-1.42"/>
                </svg>
                <svg class="theme-icon moon-icon" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style="display: none">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                </svg>
                <span class="theme-text">Light</span>
            </button>
        </nav>
    </header>

    <!-- Mobile Menu -->
    <div class="mobile-menu" style="
        position: fixed;
        top: 0;
        left: -100%;
        width: 280px;
        height: 100vh;
        background-color: var(--bg-primary);
        z-index: 1100;
        transition: left 200ms cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: var(--shadow-lg);
    ">
        <div class="mobile-menu-header" style="
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 16px;
            border-bottom: 1px solid var(--border-primary);
            background-color: var(--bg-elevated);
        ">
            <div class="site-title" style="
                font-size: 1.25rem;
                color: #23AF91;
                font-weight: 800;
                text-transform: uppercase;
            ">
                LOMEN CLUB
            </div>
            <button class="mobile-menu-close" aria-label="Close menu" style="
                border: none;
                background: transparent;
                color: var(--text-primary);
                padding: 8px;
                border-radius: 6px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
            ">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
            </button>
        </div>
        <div class="mobile-menu-content" style="padding: 0;">
            <div class="mobile-nav-section" style="padding: 16px; border-bottom: 1px solid var(--border-primary);">
                <div class="section-label" style="
                    color: var(--text-secondary);
                    font-size: 0.75rem;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    margin-bottom: 12px;
                ">
                    Navigation
                </div>
                <a href="https://lomenclub.com" class="mobile-nav-btn" target="_blank" style="
                    width: 100%;
                    height: 48px;
                    padding: 0 16px;
                    border: none;
                    background: transparent;
                    color: var(--text-primary);
                    text-align: left;
                    font-size: 1rem;
                    font-weight: 500;
                    border-radius: 8px;
                    margin-bottom: 8px;
                    transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
                    cursor: pointer;
                    display: block;
                    text-decoration: none;
                    line-height: 48px;
                " onmouseenter="this.style.backgroundColor='var(--bg-elevated)';"
                onmouseleave="this.style.backgroundColor='transparent';">
                    Homepage
                </a>
            </div>
            <div class="mobile-nav-section" style="padding: 16px; border-bottom: 1px solid var(--border-primary);">
                <div class="section-label" style="
                    color: var(--text-secondary);
                    font-size: 0.75rem;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    margin-bottom: 12px;
                ">
                    Follow Us
                </div>
                <div class="mobile-social-links" style="display: flex; gap: 12px;">
                    <a href="https://github.com/lomen-club" target="_blank" rel="noopener noreferrer" class="mobile-social-link" aria-label="GitHub" style="
                        width: 48px;
                        height: 48px;
                        border-radius: 8px;
                        background-color: transparent;
                        color: var(--text-secondary);
                        border: 1px solid var(--border-primary);
                        transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
                        text-decoration: none;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    " onmouseenter="this.style.backgroundColor='var(--bg-elevated)'; this.style.transform='translateY(-1px)'; this.style.color='#333';"
                    onmouseleave="this.style.backgroundColor='transparent'; this.style.transform='translateY(0)'; this.style.color='var(--text-secondary)';">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                        </svg>
                    </a>
                    <a href="https://t.me/lomenclub" target="_blank" rel="noopener noreferrer" class="mobile-social-link" aria-label="Telegram" style="
                        width: 48px;
                        height: 48px;
                        border-radius: 8px;
                        background-color: transparent;
                        color: var(--text-secondary);
                        border: 1px solid var(--border-primary);
                        transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
                        text-decoration: none;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    " onmouseenter="this.style.backgroundColor='var(--bg-elevated)'; this.style.transform='translateY(-1px)'; this.style.color='#0088cc';"
                    onmouseleave="this.style.backgroundColor='transparent'; this.style.transform='translateY(0)'; this.style.color='var(--text-secondary)';">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.14.141-.259.259-.374.261l.213-3.053 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.136-.954l11.566-4.458c.538-.196 1.006.128.832.941z"/>
                        </svg>
                    </a>
                    <a href="https://x.com/lomenclub" target="_blank" rel="noopener noreferrer" class="mobile-social-link" aria-label="X (formerly Twitter)" style="
                        width: 48px;
                        height: 48px;
                        border-radius: 8px;
                        background-color: transparent;
                        color: var(--text-secondary);
                        border: 1px solid var(--border-primary);
                        transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
                        text-decoration: none;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-weight: 700;
                        font-size: 18px;
                    " onmouseenter="this.style.backgroundColor='var(--bg-elevated)'; this.style.transform='translateY(-1px)'; this.style.color='#000000';"
                    onmouseleave="this.style.backgroundColor='transparent'; this.style.transform='translateY(0)'; this.style.color='var(--text-secondary)';">
                        𝕏
                    </a>
                    <a href="https://www.youtube.com/@lomenclub" target="_blank" rel="noopener noreferrer" class="mobile-social-link" aria-label="YouTube" style="
                        width: 48px;
                        height: 48px;
                        border-radius: 8px;
                        background-color: transparent;
                        color: var(--text-secondary);
                        border: 1px solid var(--border-primary);
                        transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
                        text-decoration: none;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    " onmouseenter="this.style.backgroundColor='var(--bg-elevated)'; this.style.transform='translateY(-1px)'; this.style.color='#FF0000';"
                    onmouseleave="this.style.backgroundColor='transparent'; this.style.transform='translateY(0)'; this.style.color='var(--text-secondary)';">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
                        </svg>
                    </a>
                </div>
            </div>
        </div>
    </div>
</body>
</html>
