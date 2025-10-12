<?php
/**
 * The main template file
 *
 * @package Lomen_Club
 */

get_header();
?>

<div class="hero-section">
    <div class="container">
        <div class="hero-content">
            <div class="hero-badge">
                10,000 Unique NFTs on KCC
            </div>
            
            <h1 class="hero-title">
                Welcome to <span>Lomen Club</span>
            </h1>
            
            <p class="hero-description">
                As a Lomen holder, you're part of an <strong style="color: #24AE8F;">exclusive community</strong> with access to unique benefits, validator rewards, and community-driven governance.
            </p>
            
            <div class="hero-buttons">
                <a href="/app" class="btn btn-primary">
                    Launch App
                </a>
                
                <button class="btn btn-outline" onclick="scrollToSection('about')">
                    Learn More
                </button>
            </div>
        </div>
    </div>
</div>

<section id="about" class="section">
    <div class="container">
        <h2 class="section-title">
            About <span>Lomen Club</span>
        </h2>
        
        <div class="row">
            <div class="col-md-6">
                <div class="card">
                    <div class="card-body">
                        <h3>What Is Lomen NFT?</h3>
                        <p><strong>Lomen: The First Generated Art NFTs on KCC</strong></p>
                        <p>Lomen is a collection of 10,000 randomly generated art NFTs on KCC, created by the KuCoin team.</p>
                        <p>Each Lomen has a unique look and set of features.</p>
                    </div>
                </div>
            </div>
            
            <div class="col-md-6">
                <div class="card">
                    <div class="card-body">
                        <h3>What Is Lomen Club?</h3>
                        <p><strong>Lomen Club: A Community-Driven Initiative</strong></p>
                        <p>Lomen Club is a community-driven initiative that aims to provide value to Lomen NFT holders through various initiatives and projects.</p>
                        <p>Our goal is to create a sustainable ecosystem that benefits all Lomen holders and helps grow the Lomen community.</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</section>

<section class="section">
    <div class="container">
        <h2 class="section-title">
            Latest <span>Blog Posts</span>
        </h2>
        
        <div class="blog-grid">
            <?php
            $blog_posts = new WP_Query(array(
                'post_type'      => 'post',
                'posts_per_page' => 3,
                'post_status'    => 'publish',
            ));
            
            if ($blog_posts->have_posts()) :
                while ($blog_posts->have_posts()) : $blog_posts->the_post();
            ?>
                <article class="blog-post">
                    <?php if (has_post_thumbnail()) : ?>
                        <div class="post-thumbnail">
                            <?php the_post_thumbnail('blog-thumbnail'); ?>
                        </div>
                    <?php else : ?>
                        <div class="post-thumbnail">
                            Featured Image
                        </div>
                    <?php endif; ?>
                    
                    <div class="post-content">
                        <h3 class="post-title">
                            <a href="<?php the_permalink(); ?>"><?php the_title(); ?></a>
                        </h3>
                        
                        <div class="post-excerpt">
                            <?php the_excerpt(); ?>
                        </div>
                        
                        <div class="post-meta">
                            <span class="post-date"><?php echo get_the_date(); ?></span>
                            <?php
                            $categories = get_the_category();
                            if (!empty($categories)) {
                                echo '<span class="post-category">' . esc_html($categories[0]->name) . '</span>';
                            }
                            ?>
                        </div>
                    </div>
                </article>
            <?php
                endwhile;
                wp_reset_postdata();
            else :
            ?>
                <div class="no-posts">
                    <p>No blog posts found.</p>
                </div>
            <?php endif; ?>
        </div>
        
        <div style="text-align: center; margin-top: var(--space-8);">
            <a href="<?php echo get_permalink(get_option('page_for_posts')); ?>" class="btn btn-outline">
                View All Posts
            </a>
        </div>
    </div>
</section>

<script>
function scrollToSection(sectionId) {
    const element = document.getElementById(sectionId);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
    }
}
</script>

<?php
get_footer();
