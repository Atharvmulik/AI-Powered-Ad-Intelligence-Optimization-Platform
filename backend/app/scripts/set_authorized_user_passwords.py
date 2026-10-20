
from __future__ import annotations

import asyncio
import getpass
import sys

import bcrypt
from sqlalchemy import bindparam, text

from app.db.session import AsyncSessionLocal


AUTHORIZED_EMAILS = (
    "atharv.mulik24@vit.edu",
    "siddhi.naik24@vit.edu",
    "tejas.more24@vit.edu",
    "vaishnavi.nile24@vit.edu",
)


def hash_password(password: str) -> str:
    """Generate a salted bcrypt password hash."""

    encoded_password = password.encode("utf-8")

    # bcrypt supports passwords up to 72 bytes.
    if len(encoded_password) > 72:
        raise ValueError(
            "Password must not exceed 72 UTF-8 bytes."
        )

    return bcrypt.hashpw(
        encoded_password,
        bcrypt.gensalt(rounds=12),
    ).decode("utf-8")


async def update_authorized_users(password: str) -> None:
    """Update password hashes for all four authorized accounts."""

    async with AsyncSessionLocal() as db:
        try:
            # Check all four accounts before changing any passwords.
            query = text(
                """
                SELECT email
                FROM public.authorized_users
                WHERE email IN :emails
                """
            ).bindparams(
                bindparam("emails", expanding=True)
            )

            result = await db.execute(
                query,
                {"emails": list(AUTHORIZED_EMAILS)},
            )

            existing_emails = {
                str(row[0]).strip().lower()
                for row in result.fetchall()
            }

            expected_emails = set(AUTHORIZED_EMAILS)
            missing_emails = expected_emails - existing_emails

            if missing_emails:
                raise RuntimeError(
                    "These authorized accounts are missing from "
                    "the database: "
                    + ", ".join(sorted(missing_emails))
                    + ". No passwords were updated."
                )

            # Generate a separate salted hash for each account.
            password_hashes = {
                email: hash_password(password)
                for email in AUTHORIZED_EMAILS
            }

            # Update only the four explicitly authorized accounts.
            update_query = text(
                """
                UPDATE public.authorized_users
                SET password_hash = :password_hash
                WHERE email = :email
                """
            )

            for email, password_hash in password_hashes.items():
                result = await db.execute(
                    update_query,
                    {
                        "email": email,
                        "password_hash": password_hash,
                    },
                )

                if result.rowcount != 1:
                    raise RuntimeError(
                        f"Expected to update exactly one account "
                        f"for {email}."
                    )

            await db.commit()

            print(
                "Successfully updated password hashes for "
                f"{len(password_hashes)} authorized accounts."
            )

        except Exception:
            await db.rollback()
            raise


def main() -> None:
    """Prompt for the shared initial password."""

    password = getpass.getpass(
        "Enter the shared initial password: "
    )
    confirmation = getpass.getpass(
        "Confirm the shared initial password: "
    )

    if not password:
        print(
            "Password cannot be empty.",
            file=sys.stderr,
        )
        raise SystemExit(1)

    if password != confirmation:
        print(
            "Passwords do not match.",
            file=sys.stderr,
        )
        raise SystemExit(1)

    if len(password.encode("utf-8")) > 72:
        print(
            "Password exceeds bcrypt's 72-byte limit.",
            file=sys.stderr,
        )
        raise SystemExit(1)

    try:
        asyncio.run(update_authorized_users(password))

    except Exception as exc:
        print(
            f"Password update failed: {exc}",
            file=sys.stderr,
        )
        raise SystemExit(1)


if __name__ == "__main__":
    main()
