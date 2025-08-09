from fastapi import FastAPI
from models import Room

app = FastAPI()


@app.get("/createRoom")
async def create_room():
    room = Room() 
    print(room.id)
    return {"message": "Room created", "roomId": room.id}