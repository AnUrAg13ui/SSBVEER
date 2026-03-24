import sqlite3

conn = sqlite3.connect("sql_app.db")
cur = conn.cursor()

cur.execute("SELECT id, title FROM tests WHERE category='OIR'")
rows = cur.fetchall()
print("OIR tests found:", rows)

for test_id, title in rows:
    q_count = cur.execute("SELECT COUNT(*) FROM questions WHERE test_id=?", (test_id,)).fetchone()[0]
    print(f"  Test id={test_id}, title={title!r}, questions={q_count}")
    if q_count < 25:
        cur.execute("DELETE FROM questions WHERE test_id=?", (test_id,))
        cur.execute("DELETE FROM tests WHERE id=?", (test_id,))
        print(f"  DELETED (had only {q_count} questions — will be re-seeded with 25 on next start)")

conn.commit()
conn.close()
print("Done. Restart the backend to trigger the 25-question re-seed.")
