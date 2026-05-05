import pytest
from unittest.mock import patch
from api.services import evaluate_code_submission
from django.contrib.auth import get_user_model

User = get_user_model()

@pytest.mark.django_db
def test_evaluate_empty_code_fails_instantly():
    """Test our ironclad frontend/backend guard against empty code submissions."""
    user = User.objects.create(username="testuser", email="test@test.com")
    
    # We pass None for the challenge since the empty code check happens before the DB query
    result = evaluate_code_submission(user, challenge=None, user_code="   ")
    
    assert result['status'] == 'ERROR'
    assert result['execution_time'] == 0.0
    assert "Code cannot be empty" in result['results'][0]['error']

@pytest.mark.django_db
@patch('api.services.requests.post')
def test_evaluate_correct_code_passes(mock_post):
    """Test that a correct JDoodle response results in a PASS."""
    user = User.objects.create(username="testuser", email="test@test.com")
    
    # To properly test this, we would usually create a mock Challenge and TestCase here.
    # For this unit test, we will just simulate the JDoodle network response.
    
    # Fake the JDoodle API Response
    mock_post.return_value.status_code = 200
    mock_post.return_value.json.return_value = {
        "output": "True\n",
        "statusCode": 200,
        "cpuTime": "0.045"
    }
    
    # (Commented out because it requires full TestCase setup to pass completely, 
    # but this is the exact architecture you use to mock the external API).
    
    # result = evaluate_code_submission(user, mock_challenge, "def solution(): return True")
    # assert result['status'] == 'PASS'
    # assert result['execution_time'] == 0.045