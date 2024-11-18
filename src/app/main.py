# src/main.py

from config.db_config import get_db_connection

def main():
    conn = get_db_connection()
    if conn:
        print("Connected to database successfully!")
        conn.close()

if __name__ == "__main__":
    main()
