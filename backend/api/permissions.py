from rest_framework import permissions

class IsMakerOrReadOnly(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
            
        # FIX: Changed 'maker' to 'creator' to match your model
        return obj.creator == request.user