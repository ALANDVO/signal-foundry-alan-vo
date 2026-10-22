import pytest
from httpx import AsyncClient
from app.models.account import Account, AccountType
from app.models.contact import Contact
from app.models.audit_log import AuditLog, AuditAction
from sqlalchemy import select


@pytest.mark.asyncio
async def test_create_account(client: AsyncClient):
    response = await client.post("/accounts", json={
        "name": "Acme Corporation",
        "type": "customer",
        "industry": "Technology",
        "website": "https://acme.com",
        "phone": "+1-555-1234",
        "annual_revenue": 1000000,
        "employee_count": 50
    })
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Acme Corporation"
    assert data["type"] == "customer"
    assert data["id"] == 1


@pytest.mark.asyncio
async def test_create_account_with_contact(client: AsyncClient):
    contact_resp = await client.post("/contacts", json={"email": "contact@test.com", "first_name": "Primary", "last_name": "Contact"})
    contact_id = contact_resp.json()["id"]
    response = await client.post("/accounts", json={
        "name": "Test Account",
        "type": "prospect",
        "primary_contact_id": contact_id
    })
    assert response.status_code == 201
    assert response.json()["primary_contact_id"] == contact_id


@pytest.mark.asyncio
async def test_create_account_invalid_contact(client: AsyncClient):
    response = await client.post("/accounts", json={
        "name": "Test Account",
        "primary_contact_id": 999
    })
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_list_accounts(client: AsyncClient):
    await client.post("/accounts", json={"name": "Account A", "type": "customer"})
    await client.post("/accounts", json={"name": "Account B", "type": "prospect"})
    response = await client.get("/accounts")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 2
    assert len(data["items"]) == 2


@pytest.mark.asyncio
async def test_filter_accounts_by_type(client: AsyncClient):
    await client.post("/accounts", json={"name": "Cust", "type": "customer"})
    await client.post("/accounts", json={"name": "Prosp", "type": "prospect"})
    response = await client.get("/accounts?type=customer")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1
    assert data["items"][0]["type"] == "customer"


@pytest.mark.asyncio
async def test_filter_accounts_by_industry(client: AsyncClient):
    await client.post("/accounts", json={"name": "Tech Co", "industry": "Technology"})
    await client.post("/accounts", json={"name": "Health Co", "industry": "Healthcare"})
    response = await client.get("/accounts?industry=tech")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1
    assert data["items"][0]["industry"] == "Technology"


@pytest.mark.asyncio
async def test_search_accounts(client: AsyncClient):
    await client.post("/accounts", json={"name": "Alpha Corp", "industry": "Tech"})
    await client.post("/accounts", json={"name": "Beta Inc", "industry": "Finance"})
    response = await client.get("/accounts?search=alpha")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1
    assert data["items"][0]["name"] == "Alpha Corp"


@pytest.mark.asyncio
async def test_get_account(client: AsyncClient):
    create_resp = await client.post("/accounts", json={"name": "Get Account"})
    account_id = create_resp.json()["id"]
    response = await client.get(f"/accounts/{account_id}")
    assert response.status_code == 200
    assert response.json()["name"] == "Get Account"


@pytest.mark.asyncio
async def test_update_account(client: AsyncClient):
    create_resp = await client.post("/accounts", json={"name": "Old Name", "type": "prospect"})
    account_id = create_resp.json()["id"]
    response = await client.patch(f"/accounts/{account_id}", json={"name": "New Name", "type": "customer"})
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "New Name"
    assert data["type"] == "customer"


@pytest.mark.asyncio
async def test_delete_account(client: AsyncClient):
    create_resp = await client.post("/accounts", json={"name": "Delete Me"})
    account_id = create_resp.json()["id"]
    response = await client.delete(f"/accounts/{account_id}")
    assert response.status_code == 204
    get_resp = await client.get(f"/accounts/{account_id}")
    assert get_resp.status_code == 404


@pytest.mark.asyncio
async def test_audit_log_account(client: AsyncClient, db_session):
    await client.post("/accounts", json={"name": "Audit Account"})
    result = await db_session.execute(select(AuditLog).where(AuditLog.entity_type == "account"))
    logs = result.scalars().all()
    assert len(logs) == 1
    assert logs[0].action == AuditAction.CREATE