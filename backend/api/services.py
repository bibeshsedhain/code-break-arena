import requests
import time
from .models import TestCase, Attempt, UserMetrics
from django.conf import settings

import ast

def is_output_match(stdout, expected):
    """
    Smartly compares stdout from JDoodle with the expected database output.
    Handles spacing in lists/dicts and surrounding quotes in strings.
    """
    stdout = str(stdout).strip()
    expected = str(expected).strip()

    # 1. The Easy Win: Exact String Match
    if stdout == expected:
        return True

    # 2. The List/Dict Match: Safely parse to Python objects
    # This solves: "[1, 2, 3, 5, 8]" vs "[1,2,3,5,8]"
    try:
        parsed_stdout = ast.literal_eval(stdout)
        parsed_expected = ast.literal_eval(expected)
        
        if parsed_stdout == parsed_expected:
            return True
    except (ValueError, SyntaxError):
        pass # Ignore errors if the output is just raw text, not a list/dict

    # 3. The Quote Match: Strip surrounding quotes
    # This solves: 'fl' vs '"fl"'
    stdout_clean = stdout.strip("\"'")
    expected_clean = expected.strip("\"'")
    
    if stdout_clean == expected_clean:
        return True

    # 4. The Aggressive Fallback: Remove all spaces 
    # Use cautiously, but great for edge-case arrays that failed parsing
    if stdout.replace(" ", "") == expected.replace(" ", ""):
        return True

    return False
# JDoodle Execution Endpoint
JDOODLE_API_URL = "https://api.jdoodle.com/v1/execute"

def evaluate_code_submission(user, challenge, user_code):
    """
    Executes user code against hidden test cases using the JDoodle API.
    Evaluates correctness and tracks execution time for metrics.
    """
    # 1. Retrieve hidden test cases
    test_cases = challenge.test_cases.filter(hidden_flag=True)
    print(test_cases)
    results = []
    all_passed = True
    total_execution_time = 0.0
    status_result = "PASS"

    # Credentials (Ideally stored in .env)
    client_id = getattr(settings, 'JDOODLE_CLIENT_ID', 'dc10c5f6b449bcdd7d1a7efcda567c84')
    client_secret = getattr(settings, 'JDOODLE_CLIENT_SECRET', '55e0c0dab9772a7e5776dc614b9058f97bc48e81ef2e2a1b45fc50e3f85413fe')


    for test in test_cases:
        # Construct the test harness: User Code + Hidden Input Trigger
        harness_code = f"{user_code}\n\n{test.input_data}"
        
        payload = {
            "clientId": client_id,
            "clientSecret": client_secret,
            "script": harness_code,
            "language": "python3",
            "versionIndex": "4" # Index for Python 3.10+
        }

        try:
            start_time = time.time()
            response = requests.post(JDOODLE_API_URL, json=payload, timeout=15)
            end_time = time.time()
            
            run_time = end_time - start_time

            if response.status_code == 200:
                data = response.json()
                
                # JDoodle returns output as a single string
                stdout = data.get('output', '').strip()
                expected = test.expected_output.strip()

                # New smart check
                passed = is_output_match(stdout, expected)
                print("testing result:", stdout, expected)
                if not passed:
                    all_passed = False
                    status_result = "FAIL"

                # 2. Check for JDoodle-specific internal errors (Quota hit, syntax crash, etc.)
                # Only overwrite to ERROR if it wasn't a logic failure and an actual error exists
                if data.get('error') or data.get('statusCode') not in [200, 201]:
                    if status_result != "FAIL":
                        status_result = "ERROR"
                        all_passed = False

                total_execution_time += run_time
                
                results.append({
                    "test_id": str(test.test_id),
                    "passed": passed,
                    "stdout": stdout,
                    "time": round(run_time, 3)
                })
            else:
                all_passed = False
                status_result = "ERROR"
                results.append({
                    "test_id": str(test.test_id), 
                    "passed": False, 
                    "error": f"HTTP {response.status_code}"
                })
        
        except Exception as e:
            all_passed = False
            status_result = "ERROR"
            results.append({
                "test_id": str(test.test_id), 
                "passed": False, 
                "error": str(e)
            })

    # 3. Save Attempt and Update Metrics (Requires Authenticated User)
    if user.is_authenticated:
        # Log the raw attempt
        Attempt.objects.create(
            user=user,
            challenge=challenge,
            code_submission=user_code,
            result=status_result
        )

        # Update aggregated metrics for Gamification & Reveal mechanics
        metrics, created = UserMetrics.objects.get_or_create(user=user, challenge=challenge)
        metrics.total_attempts += 1
        
        if status_result == "PASS":
            metrics.completed = True
            # Update Leaderboard time if it's their best run yet
            if metrics.best_time is None or total_execution_time < metrics.best_time:
                metrics.best_time = total_execution_time
                
        metrics.save()
    return {
        "status": status_result,
        "execution_time": round(total_execution_time, 3),
        "results": results
    }