import string
import secrets
from pydantic import BaseModel, Field


def generate_room_id() -> str:
    """Generate a unique 8-character room ID using uppercase letters."""
    alphabet = string.ascii_uppercase
    return ''.join(secrets.choice(alphabet) for _ in range(8))


class Room(BaseModel):
    id: str = Field(
        default_factory=generate_room_id, 
        max_length=9,
        min_length=8,
        pattern=r'^[A-Z]{8}$'
    )
    timer: int = Field(default=60, ge=0, le=3600)
    rounds: int = Field(default=3, ge=1, le=10)
    participants: list[str] = Field(default_factory=list)




# Code below omitted 👇