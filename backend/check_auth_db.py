
import asyncio
from sqlalchemy import text
from app.db.session import AsyncSessionLocal


async def main():
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            text("""
                SELECT
                    current_database() AS database_name,
                    current_schema() AS schema_name,
                    current_setting('search_path') AS search_path,
                    inet_server_addr()::text AS server_address
            """)
        )
        print("Connection:", dict(result.mappings().one()))

        result = await db.execute(
            text("""
                SELECT id, email
                FROM public.authorized_users
                ORDER BY id
            """)
        )
        rows = result.mappings().all()

        print("Accounts found:", len(rows))
        for row in rows:
            print(row["id"], repr(row["email"]))


if __name__ == "__main__":
    asyncio.run(main())
