"""
Async SQLAlchemy engine and session factory.

This module is the single source of truth for database connectivity.

Environment variables
---------------------
DATABASE_URL : str
    Async PostgreSQL DSN, e.g.
    postgresql+asyncpg://user:password@localhost:5432/adplatform

Redis / Kafka stubs are co-located here as import-time singletons so
every service can access them from one place once the infrastructure
layers are wired up.
"""

from __future__ import annotations

import os
from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.pool import NullPool
from dotenv import load_dotenv

load_dotenv()
# ---------------------------------------------------------------------------
# Engine
# ---------------------------------------------------------------------------


DATABASE_URL: str = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is not set.")

import ssl

ssl_context = ssl.create_default_context()

engine: AsyncEngine = create_async_engine(
    DATABASE_URL,
    echo=False,
    pool_pre_ping=True,
    poolclass=NullPool,
    connect_args={
        "ssl": ssl_context
    }
)

# ---------------------------------------------------------------------------
# Session factory
# ---------------------------------------------------------------------------

AsyncSessionLocal: async_sessionmaker[AsyncSession] = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
    autocommit=False,
)


# ---------------------------------------------------------------------------
# FastAPI dependency
# ---------------------------------------------------------------------------

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Yield an async SQLAlchemy session and guarantee it is closed after use.

    Usage
    -----
    async def my_endpoint(db: AsyncSession = Depends(get_db)):
        ...
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


# ---------------------------------------------------------------------------
# Redis client stub  (Redis-ready)
# ---------------------------------------------------------------------------
# Uncomment and configure when the Redis layer is available:
#
# import aioredis
#
# REDIS_URL: str = os.environ.get("REDIS_URL", "redis://localhost:6379/0")
# redis_client: aioredis.Redis = aioredis.from_url(
#     REDIS_URL,
#     encoding="utf-8",
#     decode_responses=True,
# )


# ---------------------------------------------------------------------------
# Kafka producer stub  (Kafka-ready)
# ---------------------------------------------------------------------------
# Uncomment and configure when the Kafka layer is available:
#
# from aiokafka import AIOKafkaProducer
# import json
#
# KAFKA_BOOTSTRAP: str = os.environ.get("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092")
#
# async def get_kafka_producer() -> AsyncGenerator[AIOKafkaProducer, None]:
#     producer = AIOKafkaProducer(
#         bootstrap_servers=KAFKA_BOOTSTRAP,
#         value_serializer=lambda v: json.dumps(v).encode("utf-8"),
#     )
#     await producer.start()
#     try:
#         yield producer
#     finally:
#         await producer.stop()