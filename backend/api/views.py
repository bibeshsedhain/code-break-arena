from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from .models import Challenge, UserMetrics
from .serializers import ChallengeSerializer
from .permissions import IsMakerOrReadOnly
from rest_framework.permissions import IsAuthenticatedOrReadOnly, AllowAny

# WE NEED TO IMPORT YOUR JDOODLE SERVICE HERE
from .services import evaluate_code_submission

class ChallengeViewSet(viewsets.ModelViewSet):
    queryset = Challenge.objects.all()
    serializer_class = ChallengeSerializer
    
    # Apply the custom permission to guard edit/delete routes
    permission_classes = [IsAuthenticatedOrReadOnly, IsMakerOrReadOnly] 

    def perform_create(self, serializer):
        # FIX: Ensure we use 'creator' to match your Django model
        serializer.save(creator=self.request.user)


    @action(detail=True, methods=['post'], permission_classes=[AllowAny])
    def submit(self, request, pk=None):
        challenge = self.get_object()
        user_code = request.data.get('code', '')
        
        if not user_code:
            return Response({"error": "No code provided."}, status=status.HTTP_400_BAD_REQUEST)

        feedback = evaluate_code_submission(request.user, challenge, user_code)
        
        # Write to database if the user is authenticated
        if request.user.is_authenticated:
            from .models import UserMetrics, Attempt
            
            # 1. Always log the attempt
            Attempt.objects.create(
                user=request.user,
                challenge=challenge,
                code_submission=user_code,
                result=feedback.get('status', 'ERROR')
            )
            
            # 2. Update metrics if they passed
            if feedback.get('status') == 'PASS':
                execution_time = feedback.get('execution_time', 0)
                
                metrics, created = UserMetrics.objects.get_or_create(
                    user=request.user,
                    challenge=challenge,
                    defaults={
                        'best_time': execution_time,
                        'total_attempts': 1,
                        'completed': True  # CRITICAL for your leaderboard filter!
                    }
                )
                
                if not created:
                    metrics.total_attempts += 1
                    metrics.completed = True
                    # Update best_time if it's a new record
                    if metrics.best_time is None or execution_time < metrics.best_time:
                        metrics.best_time = execution_time
                    metrics.save()

        return Response(feedback, status=status.HTTP_200_OK)
    # ==========================================

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

        leaderboard_data = []
        for metric in top_metrics:
            # FIX: Create a clean display name, defaulting to Anonymous Hacker
            display_name = "Anonymous Hacker"
            if metric.user.email:
                display_name = metric.user.email.split('@')[0] # turns "bibesh@gmail.com" into "bibesh"
            elif metric.user.username:
                display_name = metric.user.username

            leaderboard_data.append({
                "username": display_name,
                "best_time": round(metric.best_time, 3), # Force 3 decimal places
                "attempts": metric.total_attempts
            })
            
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