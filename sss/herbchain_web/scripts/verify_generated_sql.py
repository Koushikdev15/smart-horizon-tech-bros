"""Sanity-checks the generated password SQL before it's run against Supabase."""

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sql = (ROOT / "sql" / "set_all_member_passwords.sql").read_text(encoding="utf-8")

pairs = re.findall(r"\('([^']+)', '(Demo@[^']+)'\)", sql)
emails = {p[0] for p in pairs}
passwords = {p[1] for p in pairs}

print(f"credential literals (2 CTEs x 40): {len(pairs)}")
print(f"distinct emails                 : {len(emails)}")
print(f"distinct passwords              : {len(passwords)}")
print(f"balanced parens                 : {sql.count('(') == sql.count(')')}")
print(f"CREATE TABLE statements         : {len(re.findall(r'create\\s+(?:temporary\\s+)?table', sql, re.I))}")
print(f"CTE blocks                      : {sql.count('with creds(email, password) as (values')}")
print()

for needle in [
    "create extension",
    "insert into auth.users",
    "update auth.users",
    "insert into auth.identities",
    "order by m.role",
]:
    print(("  ok   " if needle in sql else "  MISS "), needle)

print()
SHEET = [
    ("koushikiam18@gmail.com", "Demo@CC01"),
    ("kanikarthi399@gmail.com", "Demo@CC02"),
    ("karthiga.cse2024@citchennai.net", "Demo@CC03"),
    ("pranatheeshs@gmail.com", "Demo@CC04"),
    ("pranatheeshs.aiml2024@citchennai.net", "Demo@CC05"),
]
intact = all(f"('{e}', '{p}')" in sql for e, p in SHEET)
print(f"spreadsheet CC pairs intact     : {intact}")
print(f"raw quotes inside literals      : {sum(1 for e, p in pairs if chr(39) in e or chr(39) in p)}")
print(f"total lines                     : {len(sql.splitlines())}")
