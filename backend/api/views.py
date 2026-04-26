from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from .models import Challenge, UserMetrics
from .serializers import ChallengeSerializer
from .permissions import IsMakerOrReadOnly

class ChallengeViewSet(viewsets.ModelViewSet):
    queryset = Challenge.objects.all()
    serializer_class = ChallengeSerializer
    
    # Apply the custom permission to guard edit/delete routes
    permission_classes = [IsAuthenticatedOrReadOnly, IsMakerOrReadOnly] 

    def perform_create(self, serializer):
        # FIX: Ensure we use 'creator' to match your Django model
        serializer.save(creator=self.request.user)

    @action(detail=True, methods=['get'])
    def reveal(self, request, pk=None):
        """Secure endpoint to reveal the solution code."""
        challenge = self.get_object()
        user = request.user

        if not user.is_authenticated:
            return Response({"error": "Authentication required."}, status=status.HTTP_401_UNAUTHORIZED)

        try:
            metrics = UserMetrics.objects.get(user=user, challenge=challenge)
            
            # Aligned with TC5 in the Test Plan: Unlock after 5 failed attempts
            required_attempts = 5
            
            if metrics.total_attempts >= required_attempts:
                return Response({"solution_code": challenge.solution_code}, status=status.HTTP_200_OK)
            else:
                attempts_short = required_attempts - metrics.total_attempts
                return Response({
                    "error": "Threshold not met.",
                    "attempts_needed": attempts_short
                }, status=status.HTTP_403_FORBIDDEN)
                
        except UserMetrics.DoesNotExist:
             return Response({"error": "No attempts logged.", "attempts_needed": 5}, status=status.HTTP_403_FORBIDDEN)

    @action(detail=True, methods=['get'])
    def leaderboard(self, request, pk=None):
        """Fetches the top 10 fastest execution times."""
        challenge = self.get_object()
        
        top_metrics = UserMetrics.objects.filter(
            challenge=challenge, 
            completed=True,
            best_time__isnull=False
        ).select_related('user').order_by('best_time')[:10]

        leaderboard_data = [
            {
                # Failsafe: Use username if it exists, otherwise use email (Firebase default)
                "username": metric.user.username if metric.user.username else metric.user.email,
                "best_time": metric.best_time,
                "attempts": metric.total_attempts
            } for metric in top_metrics
        ]
        return Response(leaderboard_data, status=status.HTTP_200_OK)

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
        # FIX: Using 'creator=user' to match the database field
        my_challenges = Challenge.objects.filter(creator=user).values(
            'challenge_id', 'title', 'difficulty'
        )

        return Response({
            "stats": stats_data,
            "created_challenges": my_challenges
        }, status=status.HTTP_200_OK)