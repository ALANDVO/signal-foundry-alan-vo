import pytest
from httpx import AsyncClient
from app.models.contact import Contact
from app.models.audit_log import AuditLog, AuditAction
from sqlalchemy import select


@pytest.mark.asyncio
async def test_create_contact(client: AsyncClient):
    response = await client.post("/contacts", json={
        "email": "test@example.com",
        "first_name": "John",
        "last_name": "Doe",
        "phone": "+1-555-1234",
        "company": "Acme Corp",
        "title": "Engineer"
    })
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "test@example.com"
    assert data["first_name"] == "John"
    assert data["last_name"] == "Doe"
    assert data["id"] == 1


@pytest.mark.asyncio
async def test_create_duplicate_email(client: AsyncClient):
    await client.post("/contacts", json={
        "email": "dup@example.com",
        "first_name": "Jane",
        "last_name": "Smith"
    })
    response = await client.post("/contacts", json={
        "email": "dup@example.com",
        "first_name": "John",
        "last_name": "Doe"
    })
    assert response.status_code == 400
    assert "already exists" in response.json()["detail"]


@pytest.mark.asyncio
async def test_list_contacts(client: AsyncClient):
    await client.post("/contacts", json={"email": "a@test.com", "first_name": "A", "last_name": "User"})
    await client.post("/contacts", json={"email": "b@test.com", "first_name": "B", "last_name": "User"})
    response = await client.get("/contacts")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 2
    assert len(data["items"]) == 2
    assert data["page"] == 1
    assert data["page_size"] == 20


@pytest.mark.asyncio
async def test_list_contacts_pagination(client: AsyncClient):
    for i in range(25):
        await client.post("/contacts", json={"email": f"user{i}@test.com", "first_name": f"User{i}", "last_name": "Test"})
    response = await client.get("/contacts?page=2&page_size=10")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 25
    assert data["page"] == 2
    assert data["page_size"] == 10
    assert len(data["items"]) == 10


@pytest.mark.asyncio
async def test_search_contacts(client: AsyncClient):
    await client.post("/contacts", json={"email": "alice@test.com", "first_name": "Alice", "last_name": "Wonder", "company": "Acme"})
    await client.post("/contacts", json={"email": "bob@test.com", "first_name": "Bob", "last_name": "Builder", "company": "Beta"})
    response = await client.get("/contacts?search=alice")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1
    assert data["items"][0]["first_name"] == "Alice"


@pytest.mark.asyncio
async def test_filter_by_company(client: AsyncClient):
    await client.post("/contacts", json={"email": "a@test.com", "first_name": "A", "last_name": "User", "company": "Acme"})
    await client.post("/contacts", json={"email": "b@test.com", "first_name": "B", "last_name": "User", "company": "Beta"})
    response = await client.get("/contacts?company=Acme")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1
    assert data["items"][0]["company"] == "Acme"


@pytest.mark.asyncio
async def test_get_contact(client: AsyncClient):
    create_resp = await client.post("/contacts", json={"email": "get@test.com", "first_name": "Get", "last_name": "Me"})
    contact_id = create_resp.json()["id"]
    response = await client.get(f"/contacts/{contact_id}")
    assert response.status_code == 200
    assert response.json()["email"] == "get@test.com"


@pytest.mark.asyncio
async def test_get_nonexistent_contact(client: AsyncClient):
    response = await client.get("/contacts/999")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_update_contact(client: AsyncClient):
    create_resp = await client.post("/contacts", json={"email": "update@test.com", "first_name": "Old", "last_name": "Name"})
    contact_id = create_resp.json()["id"]
    response = await client.patch(f"/contacts/{contact_id}", json={"first_name": "New", "title": "Manager"})
    assert response.status_code == 200
    data = response.json()
    assert data["first_name"] == "New"
    assert data["title"] == "Manager"
    assert data["last_name"] == "Name"


@pytest.mark.asyncio
async def test_update_contact_email_conflict(client: AsyncClient):
    await client.post("/contacts", json={"email": "existing@test.com", "first_name": "A", "last_name": "User"})
    create_resp = await client.post("/contacts", json={"email": "update@test.com", "first_name": "B", "last_name": "User"})
    contact_id = create_resp.json()["id"]
    response = await client.patch(f"/contacts/{contact_id}", json={"email": "existing@test.com"})
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_delete_contact(client: AsyncClient):
    create_resp = await client.post("/contacts", json={"email": "delete@test.com", "first_name": "Delete", "last_name": "Me"})
    contact_id = create_resp.json()["id"]
    response = await client.delete(f"/contacts/{contact_id}")
    assert response.status_code == 204
    get_resp = await client.get(f"/contacts/{contact_id}")
    assert get_resp.status_code == 404


@pytest.mark.asyncio
async def test_audit_log_on_create(client: AsyncClient, db_session):
    await client.post("/contacts", json={"email": "audit@test.com", "first_name": "Audit", "last_name": "Test"})
    result = await db_session.execute(select(AuditLog).where(AuditLog.entity_type == "contact"))
    logs = result.scalars().all()
    assert len(logs) == 1
    assert logs[0].action == AuditAction.CREATE
    assert logs[0].entity_id == 1


@pytest.mark.asyncio
async def test_audit_log_on_update(client: AsyncClient, db_session):
    create_resp = await client.post("/contacts", json={"email": "audit2@test.com", "first_name": "Audit", "last_name": "Test2"})
    contact_id = create_resp.json()["id"]
    await client.patch(f"/contacts/{contact_id}", json={"first_name": "Updated"})
    result = await db_session.execute(select(AuditLog).where(AuditLog.entity_type == "contact").order_by(AuditLog.id))
    logs = result.scalars().all()
    assert len(logs) == 2
    assert logs[1].action == AuditAction.UPDATE


@pytest.mark.asyncio
async def test_audit_log_on_delete(client: AsyncClient, db_session):
    create_resp = await client.post("/contacts", json={"email": "audit3@test.com", "first_name": "Audit", "last_name": "Test3"})
    contact_id = create_resp.json()["id"]
    await client.delete(f"/contacts/{contact_id}")
    result = await db_session.execute(select(AuditLog).where(AuditLog.entity_type == "contact").order_by(AuditLog.id))
    logs = result.scalars().all()
    assert len(logs) == 2
    assert logs[1].action == AuditAction.DELETE