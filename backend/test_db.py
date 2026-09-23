import asyncio
import os

import asyncpg
from dotenv import load_dotenv

load_dotenv()


async def main():
    database_url = os.getenv("DATABASE_URL")

    print("DATABASE_URL exists:", bool(database_url))

    if not database_url:
        raise RuntimeError("DATABASE_URL is missing")

    safe_url = database_url.split("@")[-1]
    print("Database host:", safe_url)

    asyncpg_url = database_url.replace(
        "postgresql+asyncpg://",
        "postgresql://",
        1
    )

    conn = await asyncpg.connect(asyncpg_url)

    result = await conn.fetchval("SELECT 1")

    print("PostgreSQL test result:", result)

    await conn.close()


asyncio.run(main())