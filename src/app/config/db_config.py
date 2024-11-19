# src/app/config/db_config.py
import os
from pathlib import Path
from dotenv import load_dotenv

def get_db_connection():  # Changed to match the name used elsewhere
    # Get the root directory (where .env.local is located)
    root_dir = Path(__file__).resolve().parents[3]
    env_path = root_dir / '.env.local'
    
    # Load environment variables from .env.local
    load_dotenv(env_path)
    
    # Database connection parameters
    return {
        "host": os.getenv('POSTGRES_HOST'),
        "port": os.getenv('POSTGRES_PORT'),
        "database": os.getenv('POSTGRES_DB'),
        "user": os.getenv('POSTGRES_USER'),
        "password": os.getenv('POSTGRES_PASSWORD')
    }
