<?php
/**
 * Lomen Club WordPress Theme Functions
 * 
 * @package Lomen_Club
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Set up theme defaults and register support for various WordPress features
 */
function lomen_club_setup() {
    // Add support for post thumbnails
    add_theme_support('post-thumbnails');
    
    // Add support for title tag
    add_theme_support('title-tag');
    
    // Add support for custom logo
    add_theme_support('custom-logo', array(
        'height'      => 40,
        'width'       => 200,
        'flex-height' => true,
        'flex-width'  => true,
    ));
    
    // Add support for HTML5
    add_theme_support('html5', array(
        'search-form',
        'comment-form',
        'comment-list',
        'gallery',
        'caption',
    ));
    
    // Add support for custom background
    add_theme_support('custom-background');
    
    // Register navigation menus
    register_nav_menus(array(
        'primary' => __('Primary Menu', 'lomen-club'),
        'footer'  => __('Footer Menu', 'lomen-club'),
    ));
    
    // Add support for editor styles
    add_theme_support('editor-styles');
    add_editor_style('style.css');
}
add_action('after_setup_theme', 'lomen_club_setup');

/**
 * Enqueue theme scripts and styles
 */
function lomen_club_scripts() {
    // Enqueue main stylesheet
    wp_enqueue_style('lomen-club-style', get_stylesheet_uri(), array(), wp_get_theme()->get('Version'));
    
    // Enqueue Google Fonts (Inter)
    wp_enqueue_style('lomen-club-fonts', 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap', array(), null);
    
    // Enqueue theme JavaScript
    wp_enqueue_script('lomen-club-script', get_template_directory_uri() . '/js/theme.js', array(), wp_get_theme()->get('Version'), true);
    
    // Add theme color meta tag for mobile browsers
    echo '<meta name="theme-color" content="#0B1220">';
    
    // Add theme color meta tag for light mode
    echo '<meta name="theme-color" media="(prefers-color-scheme: light)" content="#FFFFFF">';
    echo '<meta name="theme-color" media="(prefers-color-scheme: dark)" content="#0B1220">';
}
add_action('wp_enqueue_scripts', 'lomen_club_scripts');

/**
 * Add custom classes to body tag
 */
function lomen_club_body_classes($classes) {
    // Add dark theme class
    $classes[] = 'lomen-club-dark';
    
    // Add page slug class
    if (is_singular()) {
        global $post;
        $classes[] = 'page-' . $post->post_name;
    }
    
    return $classes;
}
add_filter('body_class', 'lomen_club_body_classes');

/**
 * Custom excerpt length
 */
function lomen_club_excerpt_length($length) {
    return 25;
}
add_filter('excerpt_length', 'lomen_club_excerpt_length');

/**
 * Custom excerpt more
 */
function lomen_club_excerpt_more($more) {
    return '...';
}
add_filter('excerpt_more', 'lomen_club_excerpt_more');

/**
 * Add custom image sizes
 */
function lomen_club_image_sizes() {
    add_image_size('blog-thumbnail', 400, 250, true);
    add_image_size('hero-image', 1200, 800, true);
}
add_action('after_setup_theme', 'lomen_club_image_sizes');

/**
 * Customize the WordPress admin bar
 */
function lomen_club_admin_bar() {
    if (is_admin_bar_showing()) {
        echo '<style>
            #wpadminbar {
                background-color: var(--bg-elevated) !important;
                border-bottom: 1px solid var(--border-primary) !important;
            }
            #wpadminbar .ab-item, #wpadminbar a.ab-item, #wpadminbar > #wp-toolbar span.ab-label, #wpadminbar > #wp-toolbar span.noticon {
                color: var(--text-primary) !important;
            }
        </style>';
    }
}
add_action('wp_head', 'lomen_club_admin_bar');

/**
 * Add theme options page
 */
function lomen_club_theme_options() {
    add_theme_page(
        __('Lomen Club Theme Options', 'lomen-club'),
        __('Theme Options', 'lomen-club'),
        'manage_options',
        'lomen-club-options',
        'lomen_club_options_page'
    );
}
add_action('admin_menu', 'lomen_club_theme_options');

function lomen_club_options_page() {
    ?>
    <div class="wrap">
        <h1><?php _e('Lomen Club Theme Options', 'lomen-club'); ?></h1>
        <p><?php _e('Customize your Lomen Club theme settings here.', 'lomen-club'); ?></p>
    </div>
    <?php
}

/**
 * Custom comment form
 */
function lomen_club_comment_form($fields) {
    $fields['comment_field'] = '<div class="comment-form-comment"><textarea id="comment" name="comment" cols="45" rows="8" aria-required="true" placeholder="' . __('Your comment...', 'lomen-club') . '"></textarea></div>';
    
    $fields['author'] = '<div class="comment-form-author"><input id="author" name="author" type="text" value="" size="30" placeholder="' . __('Name', 'lomen-club') . '" /></div>';
    
    $fields['email'] = '<div class="comment-form-email"><input id="email" name="email" type="text" value="" size="30" placeholder="' . __('Email', 'lomen-club') . '" /></div>';
    
    $fields['url'] = '<div class="comment-form-url"><input id="url" name="url" type="text" value="" size="30" placeholder="' . __('Website', 'lomen-club') . '" /></div>';
    
    return $fields;
}
add_filter('comment_form_default_fields', 'lomen_club_comment_form');

/**
 * Add support for WooCommerce
 */
function lomen_club_woocommerce_support() {
    add_theme_support('woocommerce');
    add_theme_support('wc-product-gallery-zoom');
    add_theme_support('wc-product-gallery-lightbox');
    add_theme_support('wc-product-gallery-slider');
}
add_action('after_setup_theme', 'lomen_club_woocommerce_support');

/**
 * Custom pagination
 */
function lomen_club_pagination() {
    global $wp_query;
    
    if ($wp_query->max_num_pages <= 1) {
        return;
    }
    
    $big = 999999999;
    $pages = paginate_links(array(
        'base'      => str_replace($big, '%#%', esc_url(get_pagenum_link($big))),
        'format'    => '?paged=%#%',
        'current'   => max(1, get_query_var('paged')),
        'total'     => $wp_query->max_num_pages,
        'type'      => 'array',
        'prev_text' => __('&laquo; Previous', 'lomen-club'),
        'next_text' => __('Next &raquo;', 'lomen-club'),
    ));
    
    if (is_array($pages)) {
        echo '<div class="pagination">';
        foreach ($pages as $page) {
            echo '<span class="page-item">' . $page . '</span>';
        }
        echo '</div>';
    }
}

/**
 * Add custom CSS classes to navigation menu items
 */
function lomen_club_nav_menu_css_class($classes, $item, $args) {
    if ('primary' === $args->theme_location) {
        $classes[] = 'nav-item';
    }
    return $classes;
}
add_filter('nav_menu_css_class', 'lomen_club_nav_menu_css_class', 10, 3);

function lomen_club_nav_menu_link_attributes($atts, $item, $args) {
    if ('primary' === $args->theme_location) {
        $atts['class'] = 'nav-link';
    }
    return $atts;
}
add_filter('nav_menu_link_attributes', 'lomen_club_nav_menu_link_attributes', 10, 3);

/**
 * Custom widget areas
 */
function lomen_club_widgets_init() {
    register_sidebar(array(
        'name'          => __('Blog Sidebar', 'lomen-club'),
        'id'            => 'blog-sidebar',
        'description'   => __('Add widgets here to appear in your blog sidebar.', 'lomen-club'),
        'before_widget' => '<div class="widget %2$s">',
        'after_widget'  => '</div>',
        'before_title'  => '<h3 class="widget-title">',
        'after_title'   => '</h3>',
    ));
    
    register_sidebar(array(
        'name'          => __('Footer Widgets', 'lomen-club'),
        'id'            => 'footer-widgets',
        'description'   => __('Add widgets here to appear in your footer.', 'lomen-club'),
        'before_widget' => '<div class="footer-widget %2$s">',
        'after_widget'  => '</div>',
        'before_title'  => '<h4 class="footer-widget-title">',
        'after_title'   => '</h4>',
    ));
}
add_action('widgets_init', 'lomen_club_widgets_init');

/**
 * Security enhancements
 */
function lomen_club_security_headers() {
    header('X-Frame-Options: SAMEORIGIN');
    header('X-Content-Type-Options: nosniff');
    header('X-XSS-Protection: 1; mode=block');
}
add_action('send_headers', 'lomen_club_security_headers');

/**
 * Remove WordPress version number for security
 */
function lomen_club_remove_version() {
    return '';
}
add_filter('the_generator', 'lomen_club_remove_version');

/**
 * Add theme support for block styles
 */
function lomen_club_block_styles() {
    add_theme_support('wp-block-styles');
    add_theme_support('responsive-embeds');
    add_theme_support('align-wide');
}
add_action('after_setup_theme', 'lomen_club_block_styles');

/**
 * Custom login page styling
 */
function lomen_club_login_styles() {
    wp_enqueue_style('lomen-club-login', get_template_directory_uri() . '/style.css', array(), wp_get_theme()->get('Version'));
}
add_action('login_enqueue_scripts', 'lomen_club_login_styles');

function lomen_club_login_logo_url() {
    return home_url();
}
add_filter('login_headerurl', 'lomen_club_login_logo_url');

function lomen_club_login_logo_url_title() {
    return get_bloginfo('name');
}
add_filter('login_headertext', 'lomen_club_login_logo_url_title');
