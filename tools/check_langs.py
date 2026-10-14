"""Checks every src/lang/<code>.json against keys.json: all keys present, same {placeholders}, no ASCII double quotes."""
import json, re, pathlib
root = pathlib.Path(__file__).parent.parent / "src/lang"
keys = json.loads((root / "keys.json").read_text())
ph = lambda s: sorted(re.findall(r"\{\w+\}", s))
for f in sorted(root.glob("*.json")):
    if f.name == "keys.json": continue
    d = json.loads(f.read_text())
    miss = [k for k in keys if k not in d or not str(d[k]).strip()]
    bad = [k for k in keys if k in d and ph(k) != ph(d[k])]
    q = [k for k in keys if k in d and '"' in d[k]]
    print(f"{f.stem:6} missing {len(miss):3} placeholder {len(bad):3} quotes {len(q):3}", (miss + bad + q)[:3])
