from channels.generic.websocket import AsyncWebsocketConsumer
from .models import Room
import json


class RoomConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room = None
        self.username = ""
        
        await self.accept()
        
        # Send request for initial data
        await self.send(text_data=json.dumps({
            'type': 'connection_ready',
            'message': 'ready'
        }))

    async def disconnect(self, close_code):
        if self.room and self.username:

            self.room.participants.remove(self.username)
            await self.room.asave()


    async def receive(self, text_data):
        data = json.loads(text_data)
        print(f"Received data: {data}")

        if data['type'] == 'user':
            self.username = data['username']

        elif data['type'] == 'create_room':
            self.room = await Room.objects.acreate()
            
            await self.send(text_data=json.dumps({
                'type': 'room_created',
                'room_id': self.room.id,
                'participants': self.room.participants,
                'timer': self.room.timer,
                'rounds': self.room.rounds
            }))
        
        elif data['type'] == 'join_room':
            room_id = data['room_id']
            try:
                self.room = await Room.objects.aget(id=room_id)
                self.room.participants.append(self.username)
                await self.room.asave()
                await self.send(text_data=json.dumps({
                    'type': 'joined_room',
                    'room_id': self.room.id,
                    'participants': self.room.participants
                }))
            except Room.DoesNotExist:
                await self.send(text_data=json.dumps({
                    'type': 'error',
                    'message': 'Room does not exist'
                }))

        
        

        
        
  