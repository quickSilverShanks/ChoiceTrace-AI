def test_get_challenges(client, auth_headers):
    response = client.get("/api/challenges", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0
    assert data[0]["completed"] is False

def test_complete_challenge(client, auth_headers):
    # Fetch list to get an ID
    list_res = client.get("/api/challenges", headers=auth_headers)
    challenge_id = list_res.json()[0]["id"]
    
    # Complete it
    comp_res = client.post(f"/api/challenges/{challenge_id}/complete", headers=auth_headers)
    assert comp_res.status_code == 200
    assert comp_res.json()["completed"] is True
    
    # Verify user stats updated
    me_res = client.get("/api/auth/me", headers=auth_headers)
    assert me_res.json()["xp"] > 0
    assert me_res.json()["total_carbon_saved"] > 0

def test_get_roadmap(client, auth_headers):
    response = client.get("/api/roadmap", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 30  # 30-Day Roadmap has 30 items
    assert data[0]["day_number"] == 1

def test_complete_roadmap_item(client, auth_headers):
    # Fetch list to get an ID
    list_res = client.get("/api/roadmap", headers=auth_headers)
    item_id = list_res.json()[0]["id"]
    
    # Complete it
    comp_res = client.post(f"/api/roadmap/{item_id}/complete", headers=auth_headers)
    assert comp_res.status_code == 200
    assert comp_res.json()["completed"] is True

def test_get_dashboard_stats(client, auth_headers):
    response = client.get("/api/dashboard/stats", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert "user" in data
    assert "recent_activities" in data
    assert "badges" in data
    assert "daily_challenges" in data
    assert "weekly_missions" in data
    assert "carbon_savings_by_category" in data
    assert "habit_insights" in data
    assert "leaderboard" in data
