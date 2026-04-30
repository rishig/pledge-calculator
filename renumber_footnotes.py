#!/usr/bin/env python3
"""
Script to renumber footnotes in index.html in order of their first appearance.
Only renumbers footnotes in the body of the document (before the Footnotes section).
"""

import re
import sys
import os

def renumber_footnotes(html_file):
    print(f"Renumbering footnotes in {html_file}")
    
    # Read the file
    with open(html_file, 'r') as f:
        content = f.read()
    
    # Find where the Footnotes section begins
    footnotes_marker = '<h3 id="footnotes"'
    parts = content.split(footnotes_marker, 1)
    if len(parts) != 2:
        print("Could not find the Footnotes section. Aborting.")
        return
    
    body = parts[0]
    footnotes_section = footnotes_marker + parts[1]
    
    # Find all footnote references with their positions in order
    pattern = r'<a href="#footnotes"\s*>\[(\d{1,2})\]</a>'
    matches = list(re.finditer(pattern, body))
    
    # Create a mapping of old footnote numbers to their positions
    positions = {}
    for match in matches:
        old_num = match.group(1)
        pos = match.start()
        if old_num not in positions:
            positions[old_num] = pos
    
    # Sort old footnote numbers by their first appearance
    sorted_old_nums = sorted(positions.items(), key=lambda x: x[1])
    old_nums = [item[0] for item in sorted_old_nums]
    
    # Create mapping from old to new footnote numbers
    footnote_map = {old: str(i) for i, old in enumerate(old_nums, 1)}
    
    print(f"Found {len(footnote_map)} unique footnote numbers.")
    print("Mapping:")
    for old, new in footnote_map.items():
        print(f"  [old {old}] -> [new {new}]")
    
    # Replace the footnote references in the body
    new_body = body
    for old, new in footnote_map.items():
        new_body = re.sub(
            r'<a href="#footnotes"\s*>\[' + re.escape(old) + r'\]</a>',
            f'<a href="#footnotes" >[{new}]</a>',
            new_body
        )
    
    # Combine the new body with the unchanged footnotes section
    new_content = new_body + footnotes_section
    
    # Check if any changes were made
    if new_content == content:
        print("Warning: No changes were made to the file.")
        return
    
    # Create a backup of the original file
    backup_file = html_file + '.backup'
    with open(backup_file, 'w') as f:
        f.write(content)
    print(f"Original file backed up to {backup_file}")
    
    # Write the updated content
    with open(html_file, 'w') as f:
        f.write(new_content)
    
    print(f"Footnotes in {html_file} have been renumbered successfully.")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        html_file = sys.argv[1]
    else:
        html_file = "index.html"  # Default to index.html in current directory
    
    renumber_footnotes(html_file)