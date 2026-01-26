#!/usr/bin/env python3
"""
Fix broken <main> tags in HTML files
"""
import os
import glob

def fix_html_file(filepath):
    """Fix a single HTML file by correcting the broken main tag"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Check if the file has the broken main tag pattern
        if ' id="main-archive" class="container article-container"&gt;' not in content:
            print(f"✓ {os.path.basename(filepath)} - no broken main tag, skipping")
            return False
        
        # Replace the broken pattern with correct HTML
        old_pattern = '</div></div> id="main-archive" class="container article-container"&gt;'
        new_pattern = '</div></div><main id="main-archive" class="container article-container">'
        
        new_content = content.replace(old_pattern, new_pattern)
        
        # Also need to close the main tag - find where it should end
        # The main tag should close before the footer
        if '<main id="main-archive"' in new_content:
            # Find the closing pattern - looking for the section before footer
            new_content = new_content.replace(
                '<section class="container" style="position:relative;z-index:10;margin-bottom:50px;margin-top:50px">',
                '</main><section class="container" style="position:relative;z-index:10;margin-bottom:50px;margin-top:50px">'
            )
        
        # Write back to file
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        
        print(f"✓ {os.path.basename(filepath)} - fixed main tag")
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
