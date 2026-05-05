import pytest
from rest_framework.test import APIClient
from api.models import Challenge, UserMetrics
from django.contrib.auth import get_user_model

User = get_user_model()

@pytest.mark.django_db
def test_reveal_endpoint_denies_early_access():
    """Test that users with less than 3 attempts are blocked from seeing the solution."""
    client = APIClient()
    
    # 1. Setup the dummy data
    user = User.objects.create(username="hacker")
    challenge = Challenge.objects.create(
        title="Test", 
        creator=user, 
        solution_code="print('done')"
    )
    
    # 2. Log the user in
    client.force_authenticate(user=user)
    
    # 3. Give them only 1 attempt in the metrics table
    UserMetrics.objects.create(
        user=user, 
        challenge=challenge, 
        total_attempts=1, 
        completed=False
    )

    # 4. Hit the API endpoint
    response = client.get(f'/api/challenges/{challenge.challenge_id}/reveal/')
    
    # 5. Assert the API successfully blocked them (403 Forbidden)
    assert response.status_code == 403
    assert response.data['error'] == "Threshold not met."
    assert response.data['attempts_needed'] == 2


@pytest.mark.django_db
def test_reveal_endpoint_grants_access_after_threshold():
    """Test that users with 3 or more attempts successfully receive the solution code."""
    client = APIClient()
    user = User.objects.create(username="hacker2")
    challenge = Challenge.objects.create(
        title="Test 2", 
        creator=user, 
        solution_code="def solution(): return True"
    )
    
    client.force_authenticate(user=user)
    
    # Give them exactly 3 attempts (the exact boundary condition)
    UserMetrics.objects.create(
        user=user, 
        challenge=challenge, 
        total_attempts=3, 
        completed=False
    )

    response = client.get(f'/api/challenges/{challenge.challenge_id}/reveal/')
    
    # Assert they get a 200 OK and the actual solution code
    assert response.status_code == 200
    assert "solution_code" in response.data
    assert response.data["solution_code"] == "def solution(): return True"


@pytest.mark.django_db
def test_leaderboard_sorting_and_filtering():
    """Test that the leaderboard only shows completed runs, ordered by fastest time."""
    client = APIClient()
    
    # 1. Setup the Challenge
    creator = User.objects.create(username="creator")
    challenge = Challenge.objects.create(title="Speed Run", creator=creator)
    
    # 2. Setup 3 different users with different metrics
    fast_user = User.objects.create(username="fast_guy")
    slow_user = User.objects.create(username="slow_guy")
    failed_user = User.objects.create(username="failed_guy")
    
    # Fast User: Passed in 0.05s
    UserMetrics.objects.create(user=fast_user, challenge=challenge, total_attempts=1, completed=True, best_time=0.05)
    
    # Slow User: Passed in 1.20s
    UserMetrics.objects.create(user=slow_user, challenge=challenge, total_attempts=2, completed=True, best_time=1.20)
    
    # Failed User: Never passed (completed=False)
    UserMetrics.objects.create(user=failed_user, challenge=challenge, total_attempts=5, completed=False, best_time=None)

    # 3. Hit the leaderboard endpoint
    response = client.get(f'/api/challenges/{challenge.challenge_id}/leaderboard/')
    
    assert response.status_code == 200
    leaderboard = response.data
    
    # 4. Assertions
    # Should only return 2 users (the failed user should be filtered out)
    assert len(leaderboard) == 2
    
    # The first person in the list MUST be the fast user
    assert leaderboard[0]['username'] == "fast_guy"
    assert leaderboard[0]['best_time'] == 0.05
    
    # The second person MUST be the slow user
    assert leaderboard[1]['username'] == "slow_guy"
    assert leaderboard[1]['best_time'] == 1.2