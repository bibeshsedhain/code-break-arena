from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from rest_framework.permissions import AllowAny
from .models import Challenge, Attempt, UserMetrics
from .serializers import ChallengeSerializer, ChallengeDetailSerializer
from .services import evaluate_code_submission
class ChallengeViewSet(viewsets.ModelViewSet):
    queryset = Challenge.objects.all().order_by('-created_at')
    permission_classes = [IsAuthenticatedOrReadOnly] # Guests can read, Makers must be auth'd to write

    def get_serializer_class(self):
        # If retrieving a specific challenge, maybe we need detail view (handling reveal logic later)
        if self.action == 'retrieve':
            return ChallengeSerializer # Standard retrieve hides solution
        return ChallengeSerializer

    def perform_create(self, serializer):
        # Automatically attach the logged-in user as the creator
        serializer.save(creator=self.request.user)

    @action(detail=True, methods=['post'])
    def submit(self, request, pk=None):
            """
            POST /api/challenges/:id/submit/
            Handles the Taker's code submission and triggers Judge0 execution.
            """
            challenge = self.get_object()
            user_code = request.data.get('code')

            if not user_code:
                return Response({"error": "No code provided"}, status=status.HTTP_400_BAD_REQUEST)

            # Call the execution service
            try:
                execution_data = evaluate_code_submission(
                    user=request.user, 
                    challenge=challenge, 
                    user_code=user_code
                )
                
                # Returns the structured JSON response as required by the frontend [cite: 167]
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
            return Response({"error": "Authentication required."}, status=status.HTTP_401_UNAUTHORIZED)

        try:
            # Fetch the user's interaction history with this specific challenge
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

        # Format the data for the frontend
        leaderboard_data = [
            {
                "username": metric.user.username, # Make sure your user model uses 'username' or adjust to 'email'
                "best_time": metric.best_time,
                "attempts": metric.total_attempts
            } for metric in top_metrics
        ]

        return Response(leaderboard_data, status=status.HTTP_200_OK)