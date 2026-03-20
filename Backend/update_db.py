import sqlite3
import os

db_path = "d:\\SSB_tekdi\\Backend\\sql_app.db"

if os.path.exists(db_path):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    print("Checking users table columns...")
    cursor.execute("PRAGMA table_info(users)")
    columns = [row[1] for row in cursor.execute("PRAGMA table_info(users)").fetchall()]
    print(f"Current columns: {columns}")

    # Add columns if not exist
    if 'google_id' not in columns:
        print("Adding google_id column...")
        try:
            cursor.execute("ALTER TABLE users ADD COLUMN google_id VARCHAR(255)")
        except Exception as e:
            print(f"Error adding google_id: {e}")

    if 'picture' not in columns:
        print("Adding picture column...")
        try:
            cursor.execute("ALTER TABLE users ADD COLUMN picture VARCHAR(500)")
        except Exception as e:
            print(f"Error adding picture: {e}")

    # SQLite doesn't let you easily change NOT NULL to NULL on a column.
    # We need to recreate table or use a fallback approach (e.g., set an empty string or random hash).
    # Since they have sparse user data, setting a random hash is safer, or leave it as it is
    # and we can just pass a random password hash on insert.
    # That way we don't break NOT NULL constraint and don't need complex migration.
    
    conn.commit()
    conn.close()
    print("DB migration check complete.")
else:
    print("DB does not exist or new setup. Skipping manual alterations.")
