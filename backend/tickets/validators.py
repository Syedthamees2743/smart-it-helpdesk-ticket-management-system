"""
Custom Validators for Ticket Module
"""

from rest_framework import serializers


def validate_screenshot(value):
    """
    Validates the uploaded screenshot.
    1. Checks file size (Max 2MB)
    2. Checks file type (Only JPG, JPEG, PNG)
    """
    # Maximum file size: 2 MB (2 * 1024 * 1024 bytes)
    max_size = 2 * 1024 * 1024 
    
    if value.size > max_size:
        raise serializers.ValidationError(f"File size too large. Maximum allowed is 2MB. Your file is {value.size / (1024*1024):.2f}MB.")
    
    # Allowed file extensions
    allowed_extensions = ['jpg', 'jpeg', 'png']
    
    # Get the file extension
    ext = value.name.split('.')[-1].lower()
    
    if ext not in allowed_extensions:
        raise serializers.ValidationError(f"Invalid file type '{ext}'. Only JPG, JPEG, and PNG are allowed.")
    
    return value