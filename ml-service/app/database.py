import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

def get_connection():
    return psycopg2.connect(os.getenv("DATABASE_URL"))

def get_all_events():
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT id, title, category, city, language, "durationMins"
        FROM "Event"
        WHERE status = 'active'
    """)
    rows = cur.fetchall()
    cur.close()
    conn.close()
    return [
        {
            "id": r[0],
            "title": r[1],
            "category": r[2],
            "city": r[3],
            "language": r[4],
            "durationMins": r[5],
        }
        for r in rows
    ]

def get_user_activity(user_id: str):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT "eventId", action
        FROM "Activity"
        WHERE "userId" = %s
        ORDER BY "createdAt" DESC
        LIMIT 50
    """, (user_id,))
    rows = cur.fetchall()
    cur.close()
    conn.close()
    return [{"eventId": r[0], "action": r[1]} for r in rows]

def get_all_bookings():
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT "userId", "eventId"
        FROM "Booking"
        WHERE status = 'confirmed'
    """)
    rows = cur.fetchall()
    cur.close()
    conn.close()
    return [{"userId": r[0], "eventId": r[1]} for r in rows]

def get_user_bookings(user_id: str):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT "eventId"
        FROM "Booking"
        WHERE "userId" = %s AND status = 'confirmed'
    """, (user_id,))
    rows = cur.fetchall()
    cur.close()
    conn.close()
    return [r[0] for r in rows]