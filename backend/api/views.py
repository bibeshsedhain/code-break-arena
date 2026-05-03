from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticatedOrReadOnly, AllowAny
from .models import Challenge, Attempt, UserMetrics
from .serializers import ChallengeSerializer, ChallengeDetailSerializer
from .permissions import IsMakerOrReadOnly  # Ensure this matches your file structure
from .services import evaluate_code_submission

class ChallengeViewSet(viewsets.ModelViewSet):
    queryset = Challenge.objects.all().order_by('-created_at')
    
    # Guests can read, Authenticated users can create, Makers can edit their own
    permission_classes = [IsAuthenticatedOrReadOnly, IsMakerOrReadOnly] 

    def get_serializer_class(self):
        # Hide solution code on standard list views, only show on detailed fetch if needed
        if self.action == 'retrieve':
            return ChallengeSerializer 
        return ChallengeSerializer

    def perform_create(self, serializer):
        # Automatically attach the logged-in user as the creator
        serializer.save(creator=self.request.user)


    @action(detail=True, methods=['post'], permission_classes=[AllowAny])
    def submit(self, request, pk=None):
        """
        POST /api/challenges/:id/submit/
        Handles the Taker's code submission. Open to AllowAny so Guests can play.
        Database logging is handled safely inside the service layer.
        """
        challenge = self.get_object()
        user_code = request.data.get('code')

        if not user_code:
            return Response({"error": "No code provided"}, status=status.HTTP_400_BAD_REQUEST)

        # Call the execution service (Database tracking is safely enclosed here)
        try:
            execution_data = evaluate_code_submission(
                user=request.user, 
                challenge=challenge, 
                user_code=user_code
            )
            return Response(execution_data, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['get'])
    def reveal(self, request, pk=None):
        """
        Secure endpoint to reveal the solution code.
        Requires the user to have attempted the challenge at least 3 times.
        """
        challenge = self.get_object()
        user = request.user

        if not user.is_authenticated:
            return Response({"error": "Authentication required to reveal solutions."}, status=status.HTTP_401_UNAUTHORIZED)

        try:
            # Fetch the user's interaction history
            metrics = UserMetrics.objects.get(user=user, challenge=challenge)
            
            # Define the failure threshold
            required_attempts = 3
            
            if metrics.total_attempts >= required_attempts:
                # Security condition met; transmit the solution
                return Response({"solution_code": challenge.solution_code}, status=status.HTTP_200_OK)
            else:
                # Security condition failed; deny access
                attempts_short = required_attempts - metrics.total_attempts
                return Response({
                    "error": "Threshold not met.",
                    "attempts_needed": attempts_short
                }, status=status.HTTP_403_FORBIDDEN)
                
        except UserMetrics.DoesNotExist:
             return Response({
                 "error": "No attempts logged.",
                 "attempts_needed": 3
             }, status=status.HTTP_403_FORBIDDEN)

    @action(detail=True, methods=['get'])
    def leaderboard(self, request, pk=None):
        """
        Fetches the top 10 fastest execution times for a specific challenge.
        """
        challenge = self.get_object()
        
        # Query metrics: must be completed, ordered by lowest time, limit to 10
        top_metrics = UserMetrics.objects.filter(
            challenge=challenge, 
            completed=True,
            best_time__isnull=False
        ).select_related('user').order_by('best_time')[:10]

        leaderboard_data = []
        for metric in top_metrics:
            # Clean display name logic (Hides long Firebase UIDs)
            display_name = "Anonymous Hacker"
            if metric.user.email:
                display_name = metric.user.email.split('@')[0] 
            elif metric.user.username:
                display_name = metric.user.username

            leaderboard_data.append({
                "username": display_name,
                "best_time": round(metric.best_time, 3), # Force exact 3 decimal precision
                "attempts": metric.total_attempts
            })

        return Response(leaderboard_data, status=status.HTTP_200_OK)

    # ==========================================
    # USER DASHBOARD ENDPOINTS
    # ==========================================

    @action(detail=False, methods=['get'])
    def my_profile(self, request):
        """Fetches the user's solving stats and created challenges."""
        user = request.user
        if not user.is_authenticated:
            return Response({"error": "Authentication required"}, status=status.HTTP_401_UNAUTHORIZED)

        # Get the Taker Stats
        metrics = UserMetrics.objects.filter(user=user).select_related('challenge')
        stats_data = [
            {
                "challenge_title": m.challenge.title,
                "attempts": m.total_attempts,
                "completed": m.completed,
                "best_time": m.best_time
            } for m in metrics
        ]

        # Get the Maker Portfolio 
        my_challenges = Challenge.objects.filter(creator=user).values(
            'challenge_id', 'title', 'difficulty'
        )

        return Response({
            "stats": stats_data,
            "created_challenges": my_challenges
        }, status=status.HTTP_200_OK)