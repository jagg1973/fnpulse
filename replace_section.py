import os

file_path = "c:/FNPulse/News/index.html"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

start_marker = "<!-- NEW HEADER REDESIGN -->"
end_marker = "</section>"

# Find start
start_idx = content.find(start_marker)
if start_idx == -1:
    print("Start marker not found")
    exit(1)

# Find end (first section close after start)
end_idx = content.find(end_marker, start_idx)
if end_idx == -1:
    print("End marker not found")
    exit(1)

new_html = """<!-- HEADER REDESIGN -->
<header class="site-header container">
    <div class="header-logo">
        <a href="index.html"><img src="/img/logo.png" alt="FNPulse"></a>
    </div>
    
    <nav class="nav-island">
        <a href="index.html" class="nav-link active">Latest news</a>
        <a href="markets.html" class="nav-link">Sport</a>
        <a href="premium.html" class="nav-link">Premium</a>
        <a href="business.html" class="nav-link">Business</a>
        <a href="culture.html" class="nav-link">Culture</a>
        <a href="real-estate.html" class="nav-link">Real estate</a>
        <a href="travel.html" class="nav-link">Travel</a>
        <a href="weather.html" class="nav-link">Weather</a>
    </nav>
    
    <div class="header-actions">
        <!-- Dark Mode Toggle Mock -->
        <div class="toggle-switch" title="Dark Mode">
             <div class="toggle-thumb" style="transform: translateX(2px);"></div>
             <span style="position: absolute; right: 6px; font-size: 12px;">í¼™</span>
        </div>
        <button class="icon-btn primary" aria-label="Menu">â˜°</button>
    </div>
</header>

<main id="content">

    <div class="ad-hero-container">
        <div class="ad-placeholder-large">
            <span class="ad-mark">Advertisement</span>
            <span class="ad-label">advertisement</span>
        </div>
    </div>

    <section class="hero-wrapper container">
        <div class="trending-strip">
            <h2 class="trending-title">Trending</h2>
            <div class="trending-tags">
                <a href="#">Elections 2025</a>
                <a href="#">Artificial Intelligence</a>
                <a href="#">Mission to Mars</a>
                <a href="#">Moon mining</a>
            </div>
        </div>

        <div class="hero-grid-layout">
            <!-- Col 1 -->
            <article class="card hero-main">
                <div class="card-image-wrap">
                    <img src="/img/news-825x525.jpg" alt="Featured">
                    <span class="card-badge">Moon mining</span>
                </div>
                <h3 class="card-title"><a href="#">Miners on the Moon. First private lunar mine begins operations</a></h3>
            </article>

            <!-- Col 2 -->
            <article class="card hero-secondary">
                <div class="card-image-wrap">
                    <img src="/img/news-350x223-1.jpg" alt="Secondary">
                    <span class="card-badge"><span class="live-badge"><span class="live-dot"></span> Live Now</span></span>
                </div>
                <h3 class="card-title"><a href="#">"I lost my eye to a cop!" Woman becomes the face of violent street protests</a></h3>
            </article>

            <!-- Col 3 -->
            <article class="card-text-only hero-tertiary">
                <h3><a href="#">Massive blackout strikes five cities. Experts fear a targeted cyberattack on infrastructure</a></h3>
            </article>
        </div>
        
        <!-- Elections Row Preview -->
        <div class="sub-section">
             <div class="section-head">
                <h2>Elections 2025</h2>
                <nav class="section-nav">
                    <a href="#">Candidates</a>
                    <a href="#">Opinions</a>
                    <a href="#">Meetings</a>
                    <a href="#">Polls</a>
                </nav>
            </div>
        </div>"""

# Replace the content
final_content = content[:start_idx] + new_html + content[end_idx + len(end_marker):]

with open(file_path, "w", encoding="utf-8") as f:
    f.write(final_content)

print("Successfully updated index.html")
