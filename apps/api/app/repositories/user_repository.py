from uuid import UUID

from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.models.user import User


class UserRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_id(self, user_id: UUID) -> User | None:
        return self.db.get(User, user_id)

    def get_by_dni(self, dni: str) -> User | None:
        return self.db.scalar(select(User).where(User.dni == dni))

    def get_by_username(self, username: str) -> User | None:
        return self.db.scalar(select(User).where(User.username == username))

    def get_by_identifier(self, identifier: str) -> User | None:
        return self.db.scalar(
            select(User).where(or_(User.dni == identifier, User.username == identifier))
        )

    def add(self, user: User) -> User:
        self.db.add(user)
        self.db.flush()
        return user
