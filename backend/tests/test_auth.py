def test_register_user(client):
    response = client.post("/api/auth/register", json={
        "username": "newuser",
        "password": "newpassword",
        "persona": "commuter"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["username"] == "newuser"
    assert data["persona"] == "commuter"
    assert "id" in data

def test_register_duplicate_user(client):
    user_data = {
        "username": "dupuser",
        "password": "password",
        "persona": "student"
    }
    res1 = client.post("/api/auth/register", json=user_data)
    assert res1.status_code == 200
    
    res2 = client.post("/api/auth/register", json=user_data)
    assert res2.status_code == 400
    assert res2.json()["detail"] == "Username already registered"

def test_login_user(client):
    # Register
    client.post("/api/auth/register", json={
        "username": "loginuser",
        "password": "loginpassword",
        "persona": "family"
    })
    
    # Login
    response = client.post("/api/auth/login", json={
        "username": "loginuser",
        "password": "loginpassword"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"

def test_login_invalid_credentials(client):
    response = client.post("/api/auth/login", json={
        "username": "nonexistent",
        "password": "wrongpassword"
    })
    assert response.status_code == 401
    assert response.json()["detail"] == "Incorrect username or password"

def test_get_current_user(client, auth_headers):
    response = client.get("/api/auth/me", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["username"] == "testuser"
    assert data["persona"] == "student"

def test_get_current_user_unauthorized(client):
    response = client.get("/api/auth/me")
    assert response.status_code == 401

def test_update_persona(client, auth_headers):
    # Update to family
    response = client.put("/api/auth/persona", json={"persona": "family"}, headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["persona"] == "family"

def test_update_persona_invalid(client, auth_headers):
    # Invalid persona
    response = client.put("/api/auth/persona", json={"persona": "astronaut"}, headers=auth_headers)
    assert response.status_code == 400
    assert "Invalid persona" in response.json()["detail"]
