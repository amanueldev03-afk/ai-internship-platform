from rest_framework.permissions import BasePermission


class IsAdminRole(BasePermission):
    """
    Allow access only to authenticated users
    whose application role is ADMIN, is_superuser, or is_staff.
    """

    message = "Only administrators can perform this action."

    def has_permission(self, request, view):
        user = request.user

        if not user or not user.is_authenticated:
            return False

        # Check if user is admin (role == ADMIN, is_superuser, or is_staff)
        is_admin = (
            user.role == "ADMIN" 
            or user.is_superuser 
            or user.is_staff
        )

        return is_admin