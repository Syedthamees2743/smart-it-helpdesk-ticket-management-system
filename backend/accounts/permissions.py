"""
Custom Permission Classes for Role-Based Access Control
"""

from rest_framework import permissions


class IsAdmin(permissions.BasePermission):
    """
    Allows access only to users with the 'admin' role.
    """
    def has_permission(self, request, view):
        if request.user and request.user.is_superuser:
            return True
        return bool(request.user and request.user.is_authenticated and request.user.role == 'admin')


class IsEmployee(permissions.BasePermission):
    """
    Allows access only to users with the 'employee' role.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'employee')


class IsTechnician(permissions.BasePermission):
    """
    Allows access only to users with the 'technician' role.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'technician')


class IsAdminOrSelf(permissions.BasePermission):
    """
    Allows access if the user is an admin OR if they are accessing their own data.
    """
    def has_object_permission(self, request, view, obj):
        # Admin can do anything
        if request.user.role == 'admin':
            return True
        # Otherwise, the user must be the owner of the object
        return obj.user == request.user

class IsAdminOrReadOnly(permissions.BasePermission):
    """
    Admin can create, update, delete.
    Others (Employees, Technicians) can only read (GET).
    """
    def has_permission(self, request, view):
        # Allow read-only methods (GET, HEAD, OPTIONS) for any authenticated user
        if request.method in permissions.SAFE_METHODS:
            return bool(request.user and request.user.is_authenticated)
        
        # Write methods (POST, PUT, PATCH, DELETE) only allowed for admins
        return bool(request.user and request.user.is_authenticated and request.user.role == 'admin')