#!/usr/bin/env python3
"""
Fix broken <main> tags - v2
"""
import glob
import re

files_to_fix = [
    'News/analysis.html', 'News/bonds.html', 'News/category.html', 
    'News/commodities.html', 'News/crypto.html', 'News/cryptocurrency.html',
    'News/economic-policy.html', 'News/economy.html', 'News/finance.html',
    'News/forex.html', 'News/global-business.html', 'News/investing.html',
    'News/markets.html', 'News/stocks-indices.html', 'News/stocks.html',
    'News/tag-economy.html', 'News/technology.html', 'News/trading.html'
]

for filepath in files_to_fix:
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Replace the pattern with proper main tag opening
        content = re.sub(
            r'</div></div>\s+id="main-archive" class="container article-container"&gt;',
            '</div></div><main id="main-archive" class="container article-container">',
            content
        )
        
        # Add closing main tag before the footer-adjacent section
        content = content.replace(
            '</div><section class="container" style="position:relative;z-index:10;margin-bottom:50px;margin-top:50px">',
            '</div></main><section class="container" style="position:relative;z-index:10;margin-bottom:50px;margin-top:50px">'
        )
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        
        print(f"✓ Fixed {filepath}")
    except Exception as e:
        print(f"✗ Error in {filepath}: {e}")

print("\nDone!")
