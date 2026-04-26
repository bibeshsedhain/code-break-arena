

from rest_framework import permissions

class IsMakerOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow the creator of a challenge to edit or delete it.
    """
    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed to anyone (GET, HEAD, OPTIONS)
        if request.method in permissions.SAFE_METHODS:
            return True
            
        # Write permissions are ONLY allowed to the maker
        # NOTE: If your Challenge model uses 'author' or 'user' instead of 'maker', change it here!
        return obj.maker == request.user