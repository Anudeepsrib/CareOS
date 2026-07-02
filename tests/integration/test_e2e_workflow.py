from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

def test_full_discharge_workflow_e2e():
    """
    E2E Test for Phase 4:
    1. Login as a care coordinator (demo mode auth)
    2. Run discharge planning workflow
    3. Verify human review task is created
    4. Fetch the review task
    """
    # 1. Login
    login_response = client.post(
        "/api/v1/auth/login",
        json={"email": "care_coordinator@hospital-a.demo"}
    )
    assert login_response.status_code == 200
    token = login_response.json()["access_token"]
    
    headers = {
        "Authorization": f"Bearer {token}",
        "X-Demo-User": "care_coordinator@hospital-a.demo"
    }
    
    # 2. Run Workflow
    workflow_response = client.post(
        "/api/v1/workflows/discharge-planning",
        headers=headers,
        json={
            "patient_id": "pat_001",
            "query": "Create discharge readiness summary for Maria Gonzalez"
        }
    )
    assert workflow_response.status_code == 200
    data = workflow_response.json()
    assert "review_task_id" in data
    assert data["requires_human_review"] is True
    
    task_id = data["review_task_id"]
    
    # 3. Verify task exists in the review queue
    queue_response = client.get(
        "/api/v1/reviews/",
        headers=headers
    )
    assert queue_response.status_code == 200
    queue_data = queue_response.json()
    
    reviews = queue_data["reviews"]
    assert any(r["id"] == task_id for r in reviews)
