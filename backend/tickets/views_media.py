from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.http import FileResponse, Http404
from django.conf import settings
import os
import mimetypes

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def serve_media_file(request, path):
    safe_path = path.lstrip('/')
    if '..' in safe_path:
        raise Http404("Invalid path")
    
    file_path = os.path.join(settings.MEDIA_ROOT, safe_path)
    
    if not os.path.exists(file_path) or not os.path.isfile(file_path):
        raise Http404("File not found")
    
    mime_type, _ = mimetypes.guess_type(file_path)
    if mime_type is None:
        mime_type = 'application/octet-stream'
    
    return FileResponse(open(file_path, 'rb'), content_type=mime_type)