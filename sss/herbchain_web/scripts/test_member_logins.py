"""
Signs in as every generated member credential against the real Supabase Auth
endpoint — the same call the login page makes — and reports pass/fail per row.

  python scripts/test_member_logins.py
"""

import json
import re
import time
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def read_env(name: str) -> str | None:
    for line in (ROOT / ".env").read_text(encoding="utf-8").splitlines():
        if line.startswith(f"{name}="):
            return line.split("=", 1)[1].strip()
    return None


URL = read_env("VITE_SUPABASE_URL")
ANON = read_env("VITE_SUPABASE_ANON_KEY")

sql = (ROOT / "sql" / "set_all_member_passwords.sql").read_text(encoding="utf-8")
# The credential list is duplicated across CTEs; dedupe while keeping order.
pairs, seen = [], set()
for email, password in re.findall(r"\('([^']+)', '(Demo@[^']+)'\)", sql):
    if email not in seen:
        seen.add(email)
        pairs.append((email, password))


def sign_in(email: str, password: str):
    req = urllib.request.Request(
        f"{URL}/auth/v1/token?grant_type=password",
        data=json.dumps({"email": email, "password": password}).encode(),
        headers={"apikey": ANON, "Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            return True, "" if json.load(r).get("access_token") else "no token"
    except urllib.error.HTTPError as e:
        try:
            body = json.load(e)
            return False, body.get("error_code") or body.get("msg") or f"HTTP {e.code}"
        except Exception:
            return False, f"HTTP {e.code}"
    except Exception as exc:  # network/timeout
        return False, str(exc)[:40]


passed, failed = 0, []
print(f"Testing {len(pairs)} credentials against {URL}\n")

for email, password in pairs:
    ok, reason = sign_in(email, password)
    if ok:
        passed += 1
        print(f"  OK    {password:12} {email}")
    else:
        failed.append((email, password, reason))
        print(f"  FAIL  {password:12} {email:45} {reason}")
    time.sleep(0.25)  # stay clear of auth rate limits

print(f"\n{passed}/{len(pairs)} credentials sign in successfully.")
if failed:
    print("\nFailures:")
    for email, password, reason in failed:
        print(f"  {password:12} {email:45} {reason}")
