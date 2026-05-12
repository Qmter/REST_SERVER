import pymysql
from fastapi import HTTPException

from app.core.config import settings


def get_db():

    try:
        connection = pymysql.connect(
            host=settings.DB_HOST,
            port=settings.DB_PORT,
            user=settings.DB_USER,
            password=settings.DB_PASSWORD,
            database=settings.DB_NAME,
            cursorclass=pymysql.cursors.DictCursor
        )
    except Exception as e:
        raise HTTPException(500, f"MySQL server is not started")

    try:
        yield connection
    
    finally:
        connection.close()
