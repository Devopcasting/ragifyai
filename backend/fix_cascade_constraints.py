#!/usr/bin/env python3
"""
Script to fix the database schema by adding proper cascade constraints.
This ensures that when chat sessions are deleted, their messages are automatically deleted.
"""

import sqlite3
import os


def fix_cascade_constraints():
    """Fix the foreign key constraints to include CASCADE DELETE"""

    # Database path
    db_path = "data/ragify.db"

    if not os.path.exists(db_path):
        print(f"Database not found at {db_path}")
        return

    try:
        # Connect to the database
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        print("Fixing cascade constraints...")

        # Check current foreign key constraints
        cursor.execute("PRAGMA foreign_key_list(chat_messages)")
        current_constraints = cursor.fetchall()
        print(f"Current foreign key constraints: {current_constraints}")

        # Drop the existing foreign key constraint
        cursor.execute("""
            CREATE TABLE chat_messages_new (
                id INTEGER NOT NULL, 
                session_id INTEGER NOT NULL, 
                role VARCHAR(50) NOT NULL, 
                content TEXT NOT NULL, 
                sources JSON, 
                confidence INTEGER, 
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP, 
                PRIMARY KEY (id), 
                FOREIGN KEY(session_id) REFERENCES chat_sessions (id) ON DELETE CASCADE
            )
        """)

        # Copy data from old table to new table
        cursor.execute("""
            INSERT INTO chat_messages_new 
            SELECT id, session_id, role, content, sources, confidence, created_at 
            FROM chat_messages
        """)

        # Drop old table and rename new table
        cursor.execute("DROP TABLE chat_messages")
        cursor.execute("ALTER TABLE chat_messages_new RENAME TO chat_messages")

        # Recreate the index
        cursor.execute(
            "CREATE INDEX ix_chat_messages_id ON chat_messages (id)")

        # Verify the new constraint
        cursor.execute("PRAGMA foreign_key_list(chat_messages)")
        new_constraints = cursor.fetchall()
        print(f"New foreign key constraints: {new_constraints}")

        # Commit changes
        conn.commit()
        print("Successfully updated foreign key constraints with CASCADE DELETE")

    except Exception as e:
        print(f"Error fixing cascade constraints: {e}")
        conn.rollback()
    finally:
        conn.close()


if __name__ == "__main__":
    fix_cascade_constraints()
