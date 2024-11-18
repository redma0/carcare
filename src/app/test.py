from config.db_config import get_db_connection
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
from config.db_config import get_db_connection

def test_connection():
    conn = get_db_connection()
    if conn:
        print("Connection successful!")
        # Test executing a simple query
        cursor = conn.cursor()
        cursor.execute("SELECT version();")
        db_version = cursor.fetchone()
        print(f"PostgreSQL version: {db_version}")
        
        # Close cursor and connection
        cursor.close()
        conn.close()
        print("Connection closed successfully!")
    else:
        print("Connection failed!")

if __name__ == "__main__":
    test_connection()
