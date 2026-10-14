"""Lists every English UI string (tx/txn calls and template texts) into src/lang/keys.json for translators."""
import re, json, pathlib
root = pathlib.Path(__file__).parent.parent
s = (root / "src/app.html").read_text()
keys = []
add = lambda k: k not in keys and keys.append(k)
for m in re.finditer(r'\btx\("((?:[^"\\]|\\.)*)"', s): add(json.loads('"' + m.group(1) + '"'))
for m in re.finditer(r'\btxn\([^,]+,\s*"((?:[^"\\]|\\.)*)",\s*"((?:[^"\\]|\\.)*)"', s): add(m.group(1)); add(m.group(2))
blk = s[s.index("const TEMPLATES = ["):s.index("function openTemplates")]
for m in re.finditer(r'(?:name|unit): "([^"]+)"', blk): add(m.group(1))
for m in re.finditer(r'subtasks: \[([^\]]+)\]', blk):
    for x in re.findall(r'"([^"]+)"', m.group(1)): add(x)
(root / "src/lang").mkdir(exist_ok=True)
(root / "src/lang/keys.json").write_text(json.dumps(keys, ensure_ascii=False, indent=1))
print(len(keys), "strings")
