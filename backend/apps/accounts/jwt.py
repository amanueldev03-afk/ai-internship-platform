from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Custom JWT serializer.
    """

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # Custom JWT claims
        token["role"] = user.role
        token["email"] = user.email

        return token

    def validate(self, attrs):

        data = super().validate(attrs)

        if not self.user.is_email_verified:
            raise serializers.ValidationError(
                {
                    "detail": (
                        "Please verify your email "
                        "before logging in."
                    )
                }
            )

        data["message"] = "Login successful."

        data["user"] = {
            "id": self.user.id,
            "email": self.user.email,
            "username": self.user.username,
            "role": self.user.role,
        }

        return data