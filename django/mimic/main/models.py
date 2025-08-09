from django.db import models
import string
import secrets


def generate_room_id():
    """Generate a unique 9-character room ID using uppercase letters."""
    alphabet = string.ascii_uppercase
    return ''.join(secrets.choice(alphabet) for _ in range(9))


# Create your models here.
class Room(models.Model):
    id = models.CharField(max_length=9, primary_key=True, default=generate_room_id, unique=True)
    rounds = models.IntegerField(default=3)
    timer = models.IntegerField(default=90)
    participants = models.JSONField(default=list) 
    currentTurn = models.CharField(max_length=100, null=True, blank=True)
    currentEmoji = models.CharField(max_length=100, null=True, blank=True)
    gameState = models.CharField(max_length=20, default='waiting')  # 'waiting', 'in_progress', 'finished'


    created_at = models.DateTimeField(auto_now_add=True)



    def __str__(self):
        return f"Room {self.id} - {self.rounds} rounds, {self.timer} seconds per round"

    class Meta:
        verbose_name = "Room"
        verbose_name_plural = "Rooms"

    