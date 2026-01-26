#!/usr/bin/env python3
"""
Fix UI scripts - Add theme toggle and mobile menu script to all HTML pages
"""
import os
import glob

# The theme toggle script to add
THEME_SCRIPT = '''<script>document.addEventListener("DOMContentLoaded", () => { const e = document.getElementById("theme-toggle"), t = document.body, l = document.querySelector(".header-logo img"); function updateHeaderLogo() { l && (l.src = t.classList.contains("dark-mode") ? "/img/logo-footer.svg" : "/img/logo.png") } "dark" === localStorage.getItem("theme") && (t.classList.add("dark-mode"), updateHeaderLogo()), e && e.addEventListener("click", () => { t.classList.toggle("dark-mode"); const e = t.classList.contains("dark-mode"); localStorage.setItem("theme", e ? "dark" : "light"), updateHeaderLogo() }); const n = document.getElementById("mobile-menu-btn"), o = document.getElementById("mobile-menu-overlay"); n && o && (n.addEventListener("click", () => { o.classList.toggle("active"), n.textContent = o.classList.contains("active") ? "✕" : "☰" }), o.querySelectorAll("a").forEach(e => { e.addEventListener("click", () => { o.classList.remove("active"), n.textContent = "☰" }) })) })</script>'''

def fix_html_file(filepath):
    """Fix a single HTML file by adding the theme script if it's missing"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Check if the file already has the theme toggle script
        if 'document.getElementById("theme-toggle")' in content:
            print(f"✓ {os.path.basename(filepath)} - already has script, skipping")
            return False
        
        # Check if the file has the main.min.js script (it should be in all pages)
        if '<script src="/js/main.min.js"></script>' not in content:
            print(f"⚠ {os.path.basename(filepath)} - no main.min.js found, skipping")
            return False
        
        # Replace the closing script tag with script + theme script
        old_pattern = '<script src="/js/main.min.js"></script>'
        new_pattern = f'<script src="/js/main.min.js"></script>\n  {THEME_SCRIPT}'
        
        new_content = content.replace(old_pattern, new_pattern)
        
        # Write back to file
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        
        print(f"✓ {os.path.basename(filepath)} - script added successfully")
        return True
        
    except Exception as e:
        print(f"✗ {os.path.basename(filepath)} - Error: {e}")
        return False

def main():
    # Get all HTML files in News directory
    html_files = glob.glob('News/*.html')
    
    print(f"Found {len(html_files)} HTML files\n")
    
    fixed_count = 0
    skipped_count = 0
    
    for filepath in sorted(html_files):
        if fix_html_file(filepath):
            fixed_count += 1
        else:
            skipped_count += 1
    
    print(f"\n{'='*60}")
    print(f"Summary:")
    print(f"  Fixed: {fixed_count}")
    print(f"  Skipped: {skipped_count}")
    print(f"  Total: {len(html_files)}")
    print(f"{'='*60}")

if __name__ == '__main__':
    main()
