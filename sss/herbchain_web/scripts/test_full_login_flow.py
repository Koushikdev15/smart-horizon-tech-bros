"""
End-to-end login test that mirrors src/services/authService.ts exactly:

  1. POST /auth/v1/token          — Supabase Auth password check
  2. GET  /rest/v1/members?email  — member lookup (list, not maybeSingle)
  3. match the Ayurvedic ID       — disambiguates shared email addresses
  4. role must match the selection
  5. status must be Active

A row only passes if all five stages pass — i.e. the portal would really let
this person in.

  python scripts/test_full_login_flow.py
"""

import json
import re
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def read_env(name: str) -> str:
    for line in (ROOT / ".env").read_text(encoding="utf-8").splitlines():
        if line.startswith(f"{name}="):
            return line.split("=", 1)[1].strip()
    raise SystemExit(f"{name} missing from .env")


URL, ANON = read_env("VITE_SUPABASE_URL"), read_env("VITE_SUPABASE_ANON_KEY")
HEADERS = {"apikey": ANON, "Authorization": f"Bearer {ANON}"}


def get_json(path: str):
    req = urllib.request.Request(f"{URL}{path}", headers=HEADERS)
    with urllib.request.urlopen(req, timeout=20) as r:
        return json.load(r)


def sign_in(email: str, password: str):
    req = urllib.request.Request(
        f"{URL}/auth/v1/token?grant_type=password",
        data=json.dumps({"email": email, "password": password}).encode(),
        headers={"apikey": ANON, "Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            return True, json.load(r).get("access_token")
    except urllib.error.HTTPError as e:
        try:
            b = json.load(e)
            return False, b.get("error_code") or b.get("msg") or f"HTTP {e.code}"
        except Exception:
            return False, f"HTTP {e.code}"


# Credentials, paired with the member row they belong to.
sql = (ROOT / "sql" / "set_all_member_passwords.sql").read_text(encoding="utf-8")
creds, seen = {}, set()
for email, password in re.findall(r"\('([^']+)', '(Demo@[^']+)'\)", sql):
    if email not in seen:
        seen.add(email)
        creds[email] = password

members = get_json("/rest/v1/members?select=ayurvedicId,name,email,role,status")

cases = []
for m in members:
    email = (m.get("email") or "").lower()
    if email in creds:
        cases.append((m, creds[email]))

cases.sort(key=lambda c: (c[0]["role"], c[1]))

print(f"Simulating the full portal login for {len(cases)} members\n")
passed, failures = 0, []

for m, password in cases:
    label = f"{m['ayurvedicId']:18} {m['role']:24}"
    email = (m["email"] or "").lower()

    ok, detail = sign_in(email, password)
    if not ok:
        failures.append((m, password, f"auth: {detail}"))
        print(f"  FAIL  {label} auth: {detail}")
        time.sleep(1.0)
        continue

    # Stage 2-3: member lookup, then disambiguate by Ayurvedic ID.
    # ilike mirrors authService — email case in `members` is not normalised.
    rows = get_json(f"/rest/v1/members?select=*&email=ilike.{urllib.parse.quote(email)}")
    match = next(
        (r for r in rows if (r.get("ayurvedicId") or "").upper() == m["ayurvedicId"].upper()),
        None,
    )
    if not match:
        failures.append((m, password, f"id mismatch among {len(rows)} row(s)"))
        print(f"  FAIL  {label} id mismatch")
        time.sleep(1.0)
        continue

    # Stage 4-5: role selection + status gate.
    if match["role"] != m["role"]:
        failures.append((m, password, "role mismatch"))
        print(f"  FAIL  {label} role mismatch")
        time.sleep(1.0)
        continue
    if match["status"] != "Active":
        failures.append((m, password, f"status {match['status']}"))
        print(f"  FAIL  {label} status {match['status']}")
        time.sleep(1.0)
        continue

    passed += 1
    shared = " (shared email)" if len(rows) > 1 else ""
    print(f"  OK    {label} {password:12} logs in{shared}")
    time.sleep(1.0)

print(f"\n{passed}/{len(cases)} members can log into the portal.")
if failures:
    print("\nFailures:")
    for m, password, why in failures:
        print(f"  {m['ayurvedicId']:18} {m['email']:42} {password:12} {why}")
