# config/db_config.py

import os
from dotenv import load_dotenv
from psycopg2 import connect, Error

# Load environment variables
load_dotenv()

def get_db_connection():
    try:
        connection = connect(
            host=os.getenv('DB_HOST'),
            port=os.getenv('DB_PORT'),
            database=os.getenv('DB_NAME'),
            user=os.getenv('DB_USER'),
            password=os.getenv('DB_PASSWORD')
        )
        return connection
    except Error as e:
        print(f"Error connecting to PostgreSQL database: {e}")
        return None
