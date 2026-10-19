from django.contrib import admin
from django.urls import path, re_path, include
from django.conf import settings
from django.views.static import serve
from django.http import JsonResponse

def health(request):
    return JsonResponse({"status" : "ok"})

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/health/', health),
    path('api/auth/', include('accounts.urls')),
    path('api/departments/', include('departments.urls')),
    path('api/tickets/', include('tickets.urls')),
    path('api/assets/', include('assets.urls')),
    path('api/faqs/', include('faq.urls')),
    path('api/feedbacks/', include('feedback.urls')),
    path('api/dashboard/', include('dashboard.urls')),
    path('api/reports/', include('reports.urls')),
    path('api/notifications/', include('notifications.urls')),
    
    # DEBUG=False ஆக இருந்தாலும் Render-ல் media files serve செய்ய இது உதவும்:
    re_path(r'^media/(?P<path>.*)$', serve, {'document_root': settings.MEDIA_ROOT}),
]

def custom_404(request, exception):
    return JsonResponse({"success": False, "error": "Not found."}, status=404)

handler404 = custom_404