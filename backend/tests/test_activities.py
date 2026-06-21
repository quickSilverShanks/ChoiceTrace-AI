def test_get_nudge_recommendation(client, auth_headers):
    response = client.post(
        "/api/activities/nudge?activity_type=commute&current_choice=Drive+10km+to+office",
        headers=auth_headers
    )
    assert response.status_code == 200
    data = response.json()
    assert data["activity_type"] == "commute"
    assert data["original_action"] == "Drive 10km to office"
    assert "recommended_alternative" in data
    assert data["carbon_saved"] > 0
    assert data["chosen"] is False

def test_get_activities_feed(client, auth_headers):
    # Log an activity first
    client.post(
        "/api/activities/nudge?activity_type=food&current_choice=Beef+burger",
        headers=auth_headers
    )
    
    response = client.get("/api/activities", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 1
    assert data[0]["activity_type"] == "food"

def test_choose_alternative(client, auth_headers):
    # Log an activity
    nudge_res = client.post(
        "/api/activities/nudge?activity_type=energy&current_choice=AC+at+19C",
        headers=auth_headers
    )
    activity_id = nudge_res.json()["id"]
    
    # Choose the alternative
    choose_res = client.post(
        f"/api/activities/{activity_id}/choose",
        json={"chosen": True},
        headers=auth_headers
    )
    assert choose_res.status_code == 200
    assert choose_res.json()["chosen"] is True
    
    # Check that user stats (like total_carbon_saved and xp) were updated
    me_res = client.get("/api/auth/me", headers=auth_headers)
    assert me_res.status_code == 200
    assert me_res.json()["total_carbon_saved"] > 0
    assert me_res.json()["xp"] > 0
