from rest_framework_simplejwt.tokens import RefreshToken, AccessToken
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
import pyotp
import qrcode
import io
import base64
import requests
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.tokens import default_token_generator
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.core.mail import send_mail
from django.conf import settings
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import User
from .serializers import RegisterSerializer, UserSerializer
from .tokens import email_verification_token


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def perform_create(self, serializer):
        user = serializer.save()
        self.send_verification_email(user)

    def send_verification_email(self, user):
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = email_verification_token.make_token(user)
        verify_link = f"{settings.FRONTEND_URL}/verify-email/{uid}/{token}/"

        send_mail(
            subject="Verify your email",
            message=f"Hi {user.full_name},\n\nClick this link to verify your email:\n{verify_link}",
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
        )


class VerifyEmailView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []
    

    def post(self, request, uidb64, token):
        try:
            uid = force_str(urlsafe_base64_decode(uidb64))
            user = User.objects.get(pk=uid)
        except (User.DoesNotExist, ValueError, TypeError, OverflowError):
            return Response({"detail": "Invalid link."}, status=status.HTTP_400_BAD_REQUEST)

        if not email_verification_token.check_token(user, token):
            return Response({"detail": "Invalid or expired token."}, status=status.HTTP_400_BAD_REQUEST)

        user.is_verified = True
        user.save()
        return Response({"detail": "Email verified successfully."})


class MeView(APIView):
    def get(self, request):
        return Response(UserSerializer(request.user).data)
class GoogleLoginView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []
    def post(self, request):
        code = request.data.get('code')
        if not code:
            return Response({"detail": "Authorization code is required."}, status=status.HTTP_400_BAD_REQUEST)

        token_response = requests.post('https://oauth2.googleapis.com/token', data={
            'code': code,
            'client_id': settings.GOOGLE_CLIENT_ID,
            'client_secret': settings.GOOGLE_CLIENT_SECRET,
            'redirect_uri': 'http://localhost:5173/auth/callback/google',
            'grant_type': 'authorization_code',
        })

        if token_response.status_code != 200:
            return Response({"detail": "Failed to exchange code with Google."}, status=status.HTTP_400_BAD_REQUEST)

        access_token = token_response.json().get('access_token')

        userinfo_response = requests.get(
            'https://www.googleapis.com/oauth2/v3/userinfo',
            headers={'Authorization': f'Bearer {access_token}'}
        )
        userinfo = userinfo_response.json()
        email = userinfo.get('email')
        name = userinfo.get('name', email)

        if not email:
            return Response({"detail": "Could not retrieve email from Google."}, status=status.HTTP_400_BAD_REQUEST)

        user, created = User.objects.get_or_create(email=email, defaults={'full_name': name})
        if created:
            user.set_unusable_password()
            user.is_verified = True  # Google already verified this email for us
            user.save()

        refresh = RefreshToken.for_user(user)
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        })
class GithubLoginView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request):
        code = request.data.get('code')
        if not code:
            return Response({"detail": "Authorization code is required."}, status=status.HTTP_400_BAD_REQUEST)

        token_response = requests.post(
            'https://github.com/login/oauth/access_token',
            data={
                'client_id': settings.GITHUB_CLIENT_ID,
                'client_secret': settings.GITHUB_CLIENT_SECRET,
                'code': code,
            },
            headers={'Accept': 'application/json'},
        )

        token_data = token_response.json()
        access_token = token_data.get('access_token')
        if not access_token:
            return Response({"detail": "Failed to exchange code with GitHub."}, status=status.HTTP_400_BAD_REQUEST)

        profile_response = requests.get(
            'https://api.github.com/user',
            headers={'Authorization': f'Bearer {access_token}'}
        )
        profile = profile_response.json()
        name = profile.get('name') or profile.get('login')

        # GitHub doesn't always include email on /user — fetch it separately
        email = profile.get('email')
        if not email:
            emails_response = requests.get(
                'https://api.github.com/user/emails',
                headers={'Authorization': f'Bearer {access_token}'}
            )
            emails = emails_response.json()
            primary = next((e for e in emails if e.get('primary')), None)
            email = primary['email'] if primary else None

        if not email:
            return Response({"detail": "Could not retrieve email from GitHub. Make sure your GitHub email is not set to private, or add a public email."}, status=status.HTTP_400_BAD_REQUEST)

        user, created = User.objects.get_or_create(email=email, defaults={'full_name': name})
        if created:
            user.set_unusable_password()
            user.is_verified = True
            user.save()

        refresh = RefreshToken.for_user(user)
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        })
class ForgotPasswordView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request):
        email = request.data.get('email')
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({"detail": "If that email exists, a reset link has been sent."})

        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)
        reset_link = f"{settings.FRONTEND_URL}/reset-password/{uid}/{token}/"

        send_mail(
            subject="Reset your password",
            message=f"Hi {user.full_name},\n\nClick this link to reset your password:\n{reset_link}",
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
        )
        return Response({"detail": "If that email exists, a reset link has been sent."})


class ResetPasswordView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request, uidb64, token):
        new_password = request.data.get('password')
        if not new_password:
            return Response({"detail": "Password is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            uid = force_str(urlsafe_base64_decode(uidb64))
            user = User.objects.get(pk=uid)
        except (User.DoesNotExist, ValueError, TypeError, OverflowError):
            return Response({"detail": "Invalid link."}, status=status.HTTP_400_BAD_REQUEST)

        if not default_token_generator.check_token(user, token):
            return Response({"detail": "Invalid or expired token."}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_password)
        user.save()
        return Response({"detail": "Password reset successfully."})
class MFASetupView(APIView):
    def get(self, request):
        user = request.user

        if not user.mfa_secret:
            user.mfa_secret = pyotp.random_base32()
            user.save()

        totp = pyotp.TOTP(user.mfa_secret)
        setup_uri = totp.provisioning_uri(name=user.email, issuer_name="Enterprise PM Platform")

        qr = qrcode.make(setup_uri)
        buffer = io.BytesIO()
        qr.save(buffer, format='PNG')
        qr_base64 = base64.b64encode(buffer.getvalue()).decode()

        return Response({
            "qr_code": f"data:image/png;base64,{qr_base64}",
            "secret": user.mfa_secret,  # shown as a manual fallback if QR scanning fails
        })


class MFAEnableView(APIView):
    def post(self, request):
        user = request.user
        code = request.data.get('code')

        if not user.mfa_secret:
            return Response({"detail": "Call MFA setup first."}, status=status.HTTP_400_BAD_REQUEST)

        totp = pyotp.TOTP(user.mfa_secret)
        if not totp.verify(code):
            return Response({"detail": "Invalid code."}, status=status.HTTP_400_BAD_REQUEST)

        user.mfa_enabled = True
        user.save()
        return Response({"detail": "MFA enabled successfully."})


class MFADisableView(APIView):
    def post(self, request):
        user = request.user
        user.mfa_enabled = False
        user.mfa_secret = None
        user.save()
        return Response({"detail": "MFA disabled."})
class LoginView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')

        user = User.objects.filter(email=email).first()
        if not user or not user.check_password(password):
            return Response({"detail": "No active account found with the given credentials"}, status=status.HTTP_401_UNAUTHORIZED)

        if user.mfa_enabled:
            # Don't issue real tokens yet — just prove the password was correct,
            # and ask for the second factor.
            mfa_token = RefreshToken.for_user(user)
            mfa_token['mfa_pending'] = True
            return Response({
                "mfa_required": True,
                "mfa_token": str(mfa_token.access_token),
            })

        refresh = RefreshToken.for_user(user)
        return Response({
            "access": str(refresh.access_token),
            "refresh": str(refresh),
        })


class MFAVerifyView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request):
        mfa_token_str = request.data.get('mfa_token')
        code = request.data.get('code')

        try:
            mfa_token = AccessToken(mfa_token_str)
        except Exception:
            return Response({"detail": "Invalid or expired session."}, status=status.HTTP_400_BAD_REQUEST)

        if not mfa_token.get('mfa_pending'):
            return Response({"detail": "Invalid session."}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.get(id=mfa_token['user_id'])
        totp = pyotp.TOTP(user.mfa_secret)

        if not totp.verify(code):
            return Response({"detail": "Invalid code."}, status=status.HTTP_400_BAD_REQUEST)

        refresh = RefreshToken.for_user(user)
        return Response({
            "access": str(refresh.access_token),
            "refresh": str(refresh),
        })