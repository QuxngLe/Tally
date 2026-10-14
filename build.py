"""Builds the installable app into docs/ (served by GitHub Pages) from src/app.html (the same file is published as the Artifact)."""
import re, shutil, pathlib
root = pathlib.Path(__file__).parent
src, dist = root / "src", root / "docs"
dist.mkdir(exist_ok=True)
body = (src / "app.html").read_text()
head_bits = re.findall(r'<title>.*?</title>|<link [^>]*>|<style>.*?</style>', body, flags=re.S)
for b in head_bits: body = body.replace(b, "", 1)
body = re.sub(r'<meta name="claude:viewport-fit-sides"[^>]*>\n?', "", body)
html = f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#2E6B57">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="Tally">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" href="icon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="icon-192.png">
{chr(10).join(head_bits)}
<style>:root{{padding-top:env(safe-area-inset-top,0px)}} body{{margin:0}} [hidden]{{display:none!important}}</style>
</head>
<body>
{body.strip()}
</body>
</html>
"""
(dist / "index.html").write_text(html)
for f in ["manifest.webmanifest", "sw.js", "icon.svg", "icon-192.png", "icon-512.png"]:
    if (src / f).exists(): shutil.copy(src / f, dist / f)
print("built", dist)
