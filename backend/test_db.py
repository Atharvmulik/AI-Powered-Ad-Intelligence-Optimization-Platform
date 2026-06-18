import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from dotenv import load_dotenv
import os
import ssl

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

async def main():
    engine = create_async_engine(
        DATABASE_URL,
        connect_args={"ssl": ssl.create_default_context()}
    )

    async with engine.begin() as conn:
        result = await conn.exec_driver_sql("SELECT 1")
        print(result.scalar())

asyncio.run(main())