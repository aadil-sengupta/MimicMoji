from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import Room
import json

charadesEmojis = [

  "🏃‍♂️", "🕺", "🧘", "🛏️", "🍽️", "🧼", "📖", "🧹", "🚶", "🏊",


  "😂", "😢", "😡", "😱", "😴", "🤔", "😍", "🤢", "🤯", "😇",


  "👮", "👨‍🍳", "👨‍⚕️", "👨‍🏫", "🕵️", "👨‍🎤", "👩‍🚀", "🤹", "🧙", "🧛",


  "🎤", "🎸", "🎮", "🎧", "🎥", "📺", "🎭", "📚", "🎨", "🎲",


  "📱", "📷", "🪑", "🛏️", "🚪", "🧴", "🧸", "🎒", "🕰️", "🔑",


  "🏠", "🏫", "🏥", "🏖️", "🌋", "🌲", "🗻", "🌧️", "🌞", "🌪️",


  "🐶", "🐱", "🐍", "🐘", "🐒", "🦁", "🐴", "🐧", "🐟", "🐔",

  "🚗", "🚕", "🚌", "🚑", "🚀", "🛸", "🛶", "🚲", "✈️", "🚁"
]


class RoomConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room = None
        self.username = ""
        self.room_group_name = None
        
        await self.accept()
        
        # Send request for initial data
        await self.send(text_data=json.dumps({
            'type': 'connection_ready',
            'message': 'ready'
        }))

    async def disconnect(self, close_code):
        if self.room and self.username and self.room_group_name:
            # Remove user from participants
            if self.username in self.room.participants:
                self.room.participants.remove(self.username)
                await self.room.asave()
                
                # Notify all users in the room about the departure
                if self.channel_layer:
                    await self.channel_layer.group_send(
                        self.room_group_name,
                        {
                            'type': 'participants_updated',
                            'participants': self.room.participants,
                            'room_id': self.room.id,
                            'action': 'user_left',
                            'username': self.username
                        }
                    )
                else:
                    print("Warning: Channel layer not available for group send")
            
            # Leave room group
            if self.channel_layer:
                await self.channel_layer.group_discard(
                    self.room_group_name,
                    self.channel_name
                )
            else:
                print("Warning: Channel layer not available for group discard")

    async def receive(self, text_data):
        data = json.loads(text_data)
        print(f"Received data: {data}")

        if data['type'] == 'user':
            self.username = data['username']

        elif data['type'] == 'create_room':
            self.room = await Room.objects.acreate()
            self.room_group_name = f'room_{self.room.id}'
            
            # Join room group
            if self.channel_layer:
                await self.channel_layer.group_add(
                    self.room_group_name,
                    self.channel_name
                )
            else:
                print("Warning: Channel layer not available for group add")
            
            # Add user to participants
            self.room.participants.append(self.username)
            await self.room.asave()
            
            await self.send(text_data=json.dumps({
                'type': 'room_created',
                'room_id': self.room.id,
                'participants': self.room.participants,
                'timer': self.room.timer,
                'rounds': self.room.rounds
            }))
            
            # Notify all users in the room about participants change
            if self.channel_layer:
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'participants_updated',
                        'participants': self.room.participants,
                        'room_id': self.room.id,
                        'action': 'user_joined',
                        'username': self.username
                    }
                )
            else:
                print("Warning: Channel layer not available for group send")
        
        elif data['type'] == 'join_room':
            room_id = data['room_id']
            try:
                self.room = await Room.objects.aget(id=room_id)
                self.room_group_name = f'room_{self.room.id}'
                
                # Join room group
                if self.channel_layer:
                    await self.channel_layer.group_add(
                        self.room_group_name,
                        self.channel_name
                    )
                else:
                    print("Warning: Channel layer not available for group add")
                
                # Add user to participants if not already there
                if self.username not in self.room.participants:
                    self.room.participants.append(self.username)
                    await self.room.asave()
                
                await self.send(text_data=json.dumps({
                    'type': 'joined_room',
                    'room_id': self.room.id,
                    'participants': self.room.participants,
                    'timer': self.room.timer,
                    'rounds': self.room.rounds
                }))
                
                # Notify all users in the room about participants change
                if self.channel_layer:
                    await self.channel_layer.group_send(
                        self.room_group_name,
                        {
                            'type': 'participants_updated',
                            'participants': self.room.participants,
                            'room_id': self.room.id,
                            'action': 'user_joined',
                            'username': self.username
                        }
                    )
                else:
                    print("Warning: Channel layer not available for group send")
                
            except Room.DoesNotExist:
                await self.send(text_data=json.dumps({
                    'type': 'error',
                    'message': 'Room does not exist'
                }))
        elif data['type'] == 'start_game':
            # get random participant
            #get random emoji
            if self.room and self.room.participants:
                import random
                self.room.currentTurn = random.choice(self.room.participants)
                self.room.currentEmoji = random.choice(charadesEmojis)
                self.room.gameState = 'in_progress'
                await self.room.asave()
                
                # Send different messages based on whether this user is the chosen participant
                if self.username == self.room.currentTurn:
                    # This user is the chosen participant - send them the emoji
                    await self.send(text_data=json.dumps({
                        'type': 'game_started',
                        'current_turn': self.room.currentTurn,
                        'room_id': self.room.id,
                        'role': 'actor',
                        'emoji': self.room.currentEmoji
                    }))
                else:
                    # This user is a guesser
                    await self.send(text_data=json.dumps({
                        'type': 'game_started',
                        'current_turn': self.room.currentTurn,
                        'room_id': self.room.id,
                        'role': 'guesser'
                    }))
                
                # Notify all users in the room about game start
                if self.channel_layer:
                    await self.channel_layer.group_send(
                        self.room_group_name,
                        {
                            'type': 'game_started_broadcast',
                            'current_turn': self.room.currentTurn,
                            'room_id': self.room.id,
                            'emoji': self.room.currentEmoji
                        }
                    )
                else:
                    print("Warning: Channel layer not available for group send")
        elif data['type'] == 'submit_guess':
            # Handle guess submission
            guess = data.get('guess', '')
            if self.room and self.room.currentEmoji and guess:
                is_correct = guess == self.room.currentEmoji
                
                # Send response to the guesser
                if is_correct:
                    await self.send(text_data=json.dumps({
                        'type': 'guess_result',
                        'correct': True,
                        'guess': guess,
                        'correct_emoji': self.room.currentEmoji,
                        'message': '🎉 Correct! You guessed it!'
                    }))
                else:
                    await self.send(text_data=json.dumps({
                        'type': 'guess_result',
                        'correct': False,
                        'guess': guess,
                        'message': '❌ Incorrect guess. Try again!',
                        'hint': f'You guessed {guess}, but that\'s not right.'
                    }))
                
                # Notify all users about the guess
                if self.channel_layer:
                    await self.channel_layer.group_send(
                        self.room_group_name,
                        {
                            'type': 'guess_submitted',
                            'username': self.username,
                            'guess': guess,
                            'correct': is_correct,
                            'room_id': self.room.id,
                            'message': '🎉 Correct guess!' if is_correct else f'❌ {self.username} guessed {guess} - incorrect'
                        }
                    )
                else:
                    print("Warning: Channel layer not available for group send")
            else:
                # Handle invalid guess submission
                await self.send(text_data=json.dumps({
                    'type': 'guess_result',
                    'correct': False,
                    'error': True,
                    'message': '⚠️ Please enter a valid emoji guess!'
                }))

    # Handler for participants_updated group messages
    async def participants_updated(self, event):
        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'type': 'participants_updated',
            'participants': event['participants'],
            'room_id': event['room_id'],
            'action': event['action'],
            'username': event['username']
        }))

    # Handler for game_started_broadcast group messages
    async def game_started_broadcast(self, event):
        # Send different messages based on whether this user is the chosen participant
        if self.username == event['current_turn']:
            # This user is the chosen participant - send them the emoji
            await self.send(text_data=json.dumps({
                'type': 'game_started',
                'current_turn': event['current_turn'],
                'room_id': event['room_id'],
                'role': 'actor',
                'emoji': event['emoji']
            }))
        else:
            # This user is a guesser
            await self.send(text_data=json.dumps({
                'type': 'game_started',
                'current_turn': event['current_turn'],
                'room_id': event['room_id'],
                'role': 'guesser'
            }))

    # Handler for guess_submitted group messages
    async def guess_submitted(self, event):
        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'type': 'guess_submitted',
            'username': event['username'],
            'guess': event['guess'],
            'correct': event['correct'],
            'room_id': event['room_id'],
            'message': event.get('message', '')
        }))






