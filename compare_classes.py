from pathlib import Path
import re
backup_root = Path(r'd:\backup\shopprime-html')
react_root = Path(r'd:\OneDrive\Desktop\shopprime-react')
html_paths = sorted(backup_root.glob('*.html'))
react_paths = sorted(react_root.rglob('*.tsx'))
pattern_html = re.compile(r'class\s*=\s*["\']([^"\']+)["\']')
pattern_react = re.compile(r'className\s*=\s*\{?\s*["\']([^"\']+)["\']')
html_classes = set()
react_classes = set()
for p in html_paths:
    text = p.read_text(encoding='utf-8')
    for attr in pattern_html.findall(text):
        html_classes.update(attr.split())
for p in react_paths:
    text = p.read_text(encoding='utf-8')
    for attr in pattern_react.findall(text):
        react_classes.update(attr.split())
missing = sorted(html_classes - react_classes)
print('html', len(html_classes))
print('react', len(react_classes))
print('missing', len(missing))
for c in missing[:200]:
    print(c)
