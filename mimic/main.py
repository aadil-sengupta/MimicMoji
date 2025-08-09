from fastapi import FastAPI

app = FastAPI()


@app.get("/createRoom")
async def create_room():
    # room = Room() 
    # print(room.id)
    return {"message": "Room created", "roomId": "dummy_id"}