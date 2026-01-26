"""
Update all HTML pages to use the consistent header and footer from index.html
"""
import os
import re
from pathlib import Path

# Define the standardized header HTML from index.html
STANDARD_HEADER = '''  <!-- TICKER ADDED BACK -->
  <div class="new-ticker-wrap">
    <span class="ticker-label-fixed">NEWS</span>
    <div class="new-ticker-content">
      <div class="ticker-item">
        <span class="ticker-category">Cryptocurrency</span>
        <span class="ticker-date">June 8, 2026</span>
        <span class="ticker-headline">Bitcoin Surges Past $125,000 as Institutions Double Down</span>
        <span class="ticker-dot">•</span>
      </div>
      <div class="ticker-item">
        <span class="ticker-category">Markets</span>
        <span class="ticker-date">June 8, 2026</span>
        <span class="ticker-headline">S&P 500 Closes at Record High on Tech Rally</span>
        <span class="ticker-dot">•</span>
      </div>
      <div class="ticker-item">
        <span class="ticker-category">Commodities</span>
        <span class="ticker-date">June 8, 2026</span>
        <span class="ticker-headline">Gold Hits All-Time High Amid Economic Uncertainty</span>
        <span class="ticker-dot">•</span>
      </div>
      <div class="ticker-item">
        <span class="ticker-category">Economy</span>
        <span class="ticker-date">June 8, 2026</span>
        <span class="ticker-headline">Federal Reserve Signals Potential Rate Cuts This Year</span>
        <span class="ticker-dot">•</span>
      </div>
    </div>
  </div>

  <!-- HEADER REDESIGN -->
  <header class="site-header container">
    <div class="header-logo"><a href="index.html"><img src="/img/logo.png" alt="FNPulse"></a></div>
    <nav class="nav-island"><a href="index.html" class="nav-link">Home</a> <a href="markets.html"
        class="nav-link">Markets</a> <a href="economy.html" class="nav-link">Economy</a> <a href="technology.html"
        class="nav-link">Technology</a> <a href="stocks-indices.html" class="nav-link">Stocks</a> <a
        href="commodities.html" class="nav-link">Commodities</a> <a href="forex.html" class="nav-link">Forex</a> <a
        href="crypto.html" class="nav-link">Crypto</a> <a href="about.html" class="nav-link">About</a> <a
        href="editorial-standards.html" class="nav-link">Editorial</a> <a href="contact.html" class="nav-link">Contact</a></nav>
    <div class="header-actions">
      <div id="theme-toggle" class="toggle-switch" title="Dark Mode">
        <div class="toggle-thumb"></div>
      </div><button id="mobile-menu-btn" class="icon-btn primary" aria-label="Menu">☰</button>
    </div>
  </header>

  <!-- Mobile Menu Overlay -->
  <div id="mobile-menu-overlay" class="mobile-menu-overlay">
    <div class="mobile-nav-content">
      <a href="index.html">Home</a>
      <a href="markets.html">Markets</a>
      <a href="economy.html">Economy</a>
      <a href="technology.html">Technology</a>
      <a href="stocks-indices.html">Stocks</a>
      <a href="commodities.html">Commodities</a>
      <a href="forex.html">Forex</a>
      <a href="crypto.html">Crypto</a>
      <a href="about.html">About</a>
      <a href="editorial-standards.html">Editorial</a>
      <a href="contact.html">Contact</a>
    </div>
  </div>'''

STANDARD_FOOTER = '''  <footer class="site-footer dark-footer">
    <div class="container" style="padding-top:180px">
      <div class="footer-top-grid">
        <div class="footer-branding">
          <div class="f-logo"><img src="/img/logo-footer.svg" alt="FNPulse" class="logo-white-filter"> <span
              class="logo-text">FNPulse</span></div>
          <p class="f-desc">FNPulse delivers breaking financial news and real-time market coverage—fast, verified, and
            actionable.</p>
          <div class="f-socials"><a href="#">Fb</a><a href="#">In</a><a href="#">X</a><a href="#">Ln</a></div>
          <div class="f-apps"><button class="app-store-btn">Google Play</button> <button class="app-store-btn">App
              Store</button></div>
        </div>
        <div class="footer-widget">
          <h4>Top Categories</h4>
          <ul class="f-links">
            <li><a href="markets.html">Markets</a></li>
            <li><a href="economy.html">Economy</a></li>
            <li><a href="technology.html">Technology</a></li>
            <li><a href="stocks-indices.html">Stocks & Indices</a></li>
            <li><a href="commodities.html">Commodities</a></li>
            <li><a href="economic-policy.html">Economic Policy</a></li>
            <li><a href="global-business.html">Global Business</a></li>
            <li><a href="about.html">About Us</a></li>
            <li><a href="advertisement.html">Advertise</a></li>
            <li><a href="contact.html">Contact</a></li>
          </ul>
        </div>
        <div class="footer-widget">
          <h4>Recent Post</h4>
          <div class="f-posts">
            <article class="f-post-item"><img src="/img/news-350x223-4.jpg" alt="thumb">
              <div><a href="news/the-pyramid-being-built-but-are-in-ruins-already-xddd.html">test the edits - The
                  pyramid being built but are in ruins already? XDDD</a> <span class="f-date">Jan 24, 2026</span></div>
            </article>
            <article class="f-post-item"><img src="/img/news-350x223-3.jpg" alt="thumb">
              <div><a href="article-sp500-record.html">S&P 500 Closes at Record High on Tech Rally</a> <span
                  class="f-date">Jan 21, 2026</span></div>
            </article>
            <article class="f-post-item"><img src="/img/news-350x223-1.jpg" alt="thumb">
              <div><a href="article-bitcoin-125k.html">Bitcoin Surges Past $125,000 as Institutions Double Down</a>
                <span class="f-date">Jan 21, 2026</span>
              </div>
            </article>
          </div>
        </div>
        <div class="footer-widget">
          <h4>Tags</h4>
          <div class="tag-cloud dark-tags"><a href="forex.html">Forex</a> <a href="crypto.html">Crypto</a> <a
              href="stocks-indices.html">Stocks</a> <a href="economy.html">Economy</a> <a
              href="markets.html">Trading</a> <a href="markets.html">Investing</a> <a href="markets.html">Finance</a> <a
              href="markets.html">Analysis</a></div>
        </div>
      </div>
      <div class="footer-bar"><span><a href="terms.html">Terms & Agreements</a></span> <span>Copyright © 2026 FNPulse.
          Designed by RSTheme.</span> <span><a href="privacy.html">Privacy policy</a></span></div>
    </div>
  </footer>
  <nav class="bottom-nav" aria-label="Mobile"><a href="index.html" class="bottom-link">Home</a> <a
      href="markets.html" class="bottom-link">Markets</a> <a href="economy.html" class="bottom-link">Economy</a> <a
      href="about.html" class="bottom-link">About</a></nav>'''

def update_html_file(filepath):
    """Update a single HTML file with standard header and footer"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Check if file already uses the new design (has the new ticker)
        if 'new-ticker-wrap' in content and 'site-header container' in content:
            print(f"✓ {filepath.name} - Already using new design, skipping")
            return False
            
        # Add hero-redesign.css to the head if not present
        if '<link rel="stylesheet" href="/css/fnpulse.min.css">' in content and 'hero-redesign.css' not in content:
            content = content.replace(
                '<link rel="stylesheet" href="/css/fnpulse.min.css">',
                '<link rel="stylesheet" href="/css/fnpulse.min.css">\n  <link rel="stylesheet" href="/css/hero-redesign.css">'
            )
        
        # Replace old header - find everything between skip-link/body and main tag
        # Pattern: from after skip-link (or body start) to before <main
        body_start_pattern = r'(<body>.*?(?:<a class="skip-link"[^>]*>.*?</a>)?)(.*?)(<main)'
        
        match = re.search(body_start_pattern, content, re.DOTALL)
        if match:
            # Replace everything between skip-link and main with new header
            content = re.sub(
                body_start_pattern,
                r'\1\n' + STANDARD_HEADER + '\n\n  \3',
                content,
                flags=re.DOTALL
            )
        
        # Replace footer (from <footer to closing </nav> before scripts)
        footer_pattern = r'<footer[^>]*>.*?</footer>(?:\s*<nav class="bottom-nav".*?</nav>)?'
        
        if re.search(footer_pattern, content, re.DOTALL):
            content = re.sub(
                footer_pattern,
                STANDARD_FOOTER,
                content,
                flags=re.DOTALL
            )
        
        # Write back
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        
        print(f"✓ {filepath.name} - Updated successfully")
        return True
        
    except Exception as e:
        print(f"✗ {filepath.name} - Error: {e}")
        return False

def main():
    news_dir = Path('c:/FNPulse/News')
    
    # Get all HTML files except index.html (which is already correct)
    html_files = [f for f in news_dir.glob('*.html') if f.name not in ['index.html', 'index-broken-backup.html']]
    
    print(f"Found {len(html_files)} HTML files to update\n")
    
    updated_count = 0
    for filepath in sorted(html_files):
        if update_html_file(filepath):
            updated_count += 1
    
    print(f"\n✓ Updated {updated_count} files successfully")

if __name__ == "__main__":
    main()
