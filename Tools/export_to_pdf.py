#!/usr/bin/env python3
"""
Export Markdown reports to PDF
"""

import os
import sys
from datetime import datetime

def main():
    """Export Executive Summary to PDF"""
    
    # Try using markdown to PDF converters
    input_file = '/Users/bradea/CursorProjects/AEMCFRO-OKRs/Summaries/2025-12-04_ContentAI_Executive_Summary_Final.md'
    output_file = '/Users/bradea/CursorProjects/AEMCFRO-OKRs/Summaries/2025-12-04_ContentAI_Executive_Summary.pdf'
    
    print("="*80)
    print("PDF Export - ContentAI Executive Summary")
    print("="*80)
    
    if not os.path.exists(input_file):
        print(f"✗ Input file not found: {input_file}")
        return 1
    
    print(f"\nInput:  {input_file}")
    print(f"Output: {output_file}")
    
    # Method 1: Try using pandoc (most common)
    print("\nAttempting PDF export with pandoc...")
    result = os.system(f'which pandoc > /dev/null 2>&1')
    
    if result == 0:
        print("✓ Found pandoc")
        cmd = f'pandoc "{input_file}" -o "{output_file}" --pdf-engine=pdflatex -V geometry:margin=1in --toc 2>&1'
        print(f"Running: {cmd}")
        result = os.system(cmd)
        
        if result == 0 and os.path.exists(output_file):
            size = os.path.getsize(output_file) / 1024
            print(f"\n✓ PDF created successfully!")
            print(f"  Size: {size:.1f} KB")
            print(f"  Location: {output_file}")
            return 0
        else:
            print("✗ Pandoc failed, trying alternative method...")
    else:
        print("  pandoc not found, trying alternative...")
    
    # Method 2: Try using grip (GitHub Markdown to HTML then print)
    print("\nAttempting PDF export with weasyprint...")
    result = os.system(f'which weasyprint > /dev/null 2>&1')
    
    if result == 0:
        print("✓ Found weasyprint")
        # First convert to HTML, then to PDF
        html_file = output_file.replace('.pdf', '.html')
        
        # Read markdown and create simple HTML
        with open(input_file, 'r') as f:
            md_content = f.read()
        
        html_content = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>ContentAI Executive Summary</title>
    <style>
        body {{
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
            line-height: 1.6;
            max-width: 900px;
            margin: 40px auto;
            padding: 20px;
            color: #24292e;
        }}
        h1 {{ color: #0366d6; border-bottom: 2px solid #0366d6; padding-bottom: 10px; }}
        h2 {{ color: #0366d6; margin-top: 30px; border-bottom: 1px solid #eaecef; padding-bottom: 5px; }}
        h3 {{ color: #586069; margin-top: 20px; }}
        table {{ border-collapse: collapse; width: 100%; margin: 20px 0; }}
        th, td {{ border: 1px solid #dfe2e5; padding: 8px 12px; text-align: left; }}
        th {{ background-color: #f6f8fa; font-weight: 600; }}
        code {{ background-color: #f6f8fa; padding: 2px 6px; border-radius: 3px; }}
        blockquote {{ border-left: 4px solid #dfe2e5; padding-left: 16px; color: #586069; }}
        @page {{ size: letter; margin: 0.75in; }}
    </style>
</head>
<body>
<pre style="white-space: pre-wrap; font-family: inherit;">{md_content}</pre>
</body>
</html>"""
        
        with open(html_file, 'w') as f:
            f.write(html_content)
        
        cmd = f'weasyprint "{html_file}" "{output_file}" 2>&1'
        print(f"Running: {cmd}")
        result = os.system(cmd)
        
        if result == 0 and os.path.exists(output_file):
            size = os.path.getsize(output_file) / 1024
            print(f"\n✓ PDF created successfully!")
            print(f"  Size: {size:.1f} KB")
            print(f"  Location: {output_file}")
            os.remove(html_file)
            return 0
    
    # Method 3: Create HTML version for browser printing
    print("\n⚠ PDF converters not available. Creating HTML version instead...")
    print("  You can open the HTML file in a browser and print to PDF")
    
    html_output = output_file.replace('.pdf', '.html')
    
    # Use markdown library if available
    try:
        import markdown
        print("✓ Using markdown library")
        
        with open(input_file, 'r') as f:
            md_content = f.read()
        
        html_body = markdown.markdown(md_content, extensions=['tables', 'fenced_code'])
        
        html_full = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>ContentAI Executive Summary - {datetime.now().strftime('%Y-%m-%d')}</title>
    <style>
        body {{
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
            line-height: 1.6;
            max-width: 900px;
            margin: 40px auto;
            padding: 20px;
            color: #24292e;
        }}
        h1 {{ 
            color: #0366d6; 
            border-bottom: 3px solid #0366d6; 
            padding-bottom: 10px;
            margin-top: 40px;
        }}
        h2 {{ 
            color: #0366d6; 
            margin-top: 35px; 
            border-bottom: 2px solid #eaecef; 
            padding-bottom: 8px; 
        }}
        h3 {{ 
            color: #586069; 
            margin-top: 25px;
            font-size: 1.25em;
        }}
        h4 {{
            color: #6a737d;
            margin-top: 20px;
        }}
        table {{ 
            border-collapse: collapse; 
            width: 100%; 
            margin: 20px 0;
            font-size: 0.9em;
        }}
        th, td {{ 
            border: 1px solid #dfe2e5; 
            padding: 10px 12px; 
            text-align: left; 
        }}
        th {{ 
            background-color: #f6f8fa; 
            font-weight: 600;
            color: #24292e;
        }}
        tr:nth-child(even) {{
            background-color: #f6f8fa;
        }}
        code {{ 
            background-color: #f6f8fa; 
            padding: 3px 6px; 
            border-radius: 3px;
            font-family: "SF Mono", Monaco, Consolas, monospace;
            font-size: 0.9em;
        }}
        pre {{
            background-color: #f6f8fa;
            padding: 16px;
            border-radius: 6px;
            overflow-x: auto;
        }}
        blockquote {{ 
            border-left: 4px solid #dfe2e5; 
            padding-left: 16px; 
            color: #586069;
            margin: 20px 0;
            font-style: italic;
        }}
        hr {{
            border: none;
            border-top: 2px solid #eaecef;
            margin: 30px 0;
        }}
        ul, ol {{
            padding-left: 2em;
        }}
        li {{
            margin: 8px 0;
        }}
        strong {{
            color: #24292e;
            font-weight: 600;
        }}
        @media print {{
            body {{
                margin: 0;
                padding: 20px;
                max-width: 100%;
            }}
            h1 {{
                page-break-before: always;
            }}
            h1:first-child {{
                page-break-before: avoid;
            }}
            table {{
                page-break-inside: avoid;
            }}
        }}
    </style>
</head>
<body>
{html_body}
<hr>
<p style="text-align: center; color: #6a737d; font-size: 0.9em; margin-top: 40px;">
    Generated: {datetime.now().strftime('%B %d, %Y at %H:%M')} | 
    <a href="#" onclick="window.print(); return false;">Print to PDF</a>
</p>
</body>
</html>"""
        
        with open(html_output, 'w') as f:
            f.write(html_full)
        
        size = os.path.getsize(html_output) / 1024
        print(f"\n✓ HTML file created successfully!")
        print(f"  Size: {size:.1f} KB")
        print(f"  Location: {html_output}")
        print(f"\nTo create PDF:")
        print(f"  1. Open file in browser: open {html_output}")
        print(f"  2. Press Cmd+P (Mac) or Ctrl+P (Windows)")
        print(f"  3. Select 'Save as PDF'")
        
        # Try to open in browser
        os.system(f'open "{html_output}" 2>/dev/null')
        
        return 0
        
    except ImportError:
        print("  markdown library not available")
        print(f"\nℹ Please install PDF tools:")
        print(f"  pip3 install markdown")
        print(f"  or")
        print(f"  brew install pandoc")
        return 1

if __name__ == "__main__":
    sys.exit(main())


