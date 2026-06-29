from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import RegisterView, MeView, VerifyEmailView, GoogleLoginView, GithubLoginView, ForgotPasswordView, ResetPasswordView, MFASetupView, MFAEnableView, MFADisableView, LoginView, MFAVerifyView

urlpatterns = [
    path('register/', RegisterView.as_view()),
    path('login/', LoginView.as_view()),
    path('refresh/', TokenRefreshView.as_view()),
    path('me/', MeView.as_view()),
    path('verify-email/<str:uidb64>/<str:token>/', VerifyEmailView.as_view()),
    path('google/', GoogleLoginView.as_view()),
    path('github/', GithubLoginView.as_view()),
    path('forgot-password/', ForgotPasswordView.as_view()),
    path('reset-password/<str:uidb64>/<str:token>/', ResetPasswordView.as_view()),
    path('mfa/setup/', MFASetupView.as_view()),
    path('mfa/enable/', MFAEnableView.as_view()),
    path('mfa/disable/', MFADisableView.as_view()),
    path('mfa/verify/', MFAVerifyView.as_view()),
]