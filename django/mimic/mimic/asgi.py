import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.security.websocket import AllowedHostsOriginValidator

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mimic.settings')

# Get Django ASGI application first - this sets up Django
django_asgi_app = get_asgi_application()

# Now import your middleware and routing after Django is set up

from mimic.routing import websocket_urlpatterns

application = ProtocolTypeRouter({
    'http': django_asgi_app,
    'websocket': AllowedHostsOriginValidator(
            URLRouter(
                websocket_urlpatterns
            )
    )
})