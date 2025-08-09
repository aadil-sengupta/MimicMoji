from django.urls import re_path
from main.consumer import RoomConsumer

websocket_urlpatterns = [
    re_path(r'ws/room/$', RoomConsumer.as_asgi()),
]