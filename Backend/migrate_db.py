#!/usr/bin/env python3
"""
migrate_db.py — Run once to apply database schema changes introduced in the
critical security fix update.

Changes applied:
  1. ADD COLUMN is_admin BOOLEAN to users (if missing)  -- Issue #2 RBAC
  2. CREATE TABLE forum_posts                           -- Issue #6 Forum
  3. CREATE TABLE forum_likes                           -- Issue #6 Forum

Usage:
  cd d:\\SSB_tekdi\\Backend
  venv\\Scripts\\python migrate_db.py

After migration, set yourself as admin:
  venv\\Scripts\\python migrate_db.py --set-admin <your_username>
"""

import sys
import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).parent / "sql_app.db"


def migrate(conn: sqlite3.Connection):
    cur = conn.cursor()

    # 1. Add is_admin to users if not present
    cur.execute("PRAGMA table_info(users)")
    columns = {row[1] for row in cur.fetchall()}
    if "is_admin" not in columns:
        cur.execute("ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT 0 NOT NULL")
        print("[OK] Added is_admin column to users")
    else:
        print("[SKIP] is_admin already exists in users")

    # 2. Create forum_posts table
    cur.execute("""
        CREATE TABLE IF NOT EXISTS forum_posts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL REFERENCES users(id),
            text TEXT NOT NULL,
            category VARCHAR(100) NOT NULL DEFAULT 'General',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)
    print("[OK] forum_posts table ready")

    # 3. Create forum_likes table
    cur.execute("""
        CREATE TABLE IF NOT EXISTS forum_likes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL REFERENCES users(id),
            post_id INTEGER NOT NULL REFERENCES forum_posts(id),
            UNIQUE (user_id, post_id)
        )
    """)
    print("[OK] forum_likes table ready")

    conn.commit()
    print("\nMigration complete.")


def set_admin(conn: sqlite3.Connection, username: str):
    cur = conn.cursor()
    cur.execute("UPDATE users SET is_admin=1 WHERE username=?", (username,))
    if cur.rowcount == 0:
        print(f"[ERROR] User '{username}' not found.")
        sys.exit(1)
    conn.commit()
    print(f"[OK] User '{username}' is now an admin.")


if __name__ == "__main__":
    if not DB_PATH.exists():
        print(f"[ERROR] Database not found at {DB_PATH}")
        print("  Start the backend at least once to create the DB before running this script.")
        sys.exit(1)

    conn = sqlite3.connect(DB_PATH)
    try:
        migrate(conn)
        if len(sys.argv) >= 3 and sys.argv[1] == "--set-admin":
            set_admin(conn, sys.argv[2])
    finally:
        conn.close()
