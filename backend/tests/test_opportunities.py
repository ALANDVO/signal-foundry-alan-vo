import pytest
from httpx import AsyncClient
from app.models.opportunity import Opportunity, OpportunityStage
from app.models.account import Account
from app.models.contact import Contact
from app.models.audit_log import AuditLog, AuditAction
from sqlalchemy import select
from datetime import datetime, timedelta


@pytest.mark.asyncio
async def setup_test_data(client: AsyncClient):
    contact_resp = await client.post("/contacts", json={"email": "opp@test.com", "first_name": "Opp", "last_name": "Contact"})
    account_resp = await client.post("/accounts", json={"name": "Opp Account", "type": "customer"})
    return contact_resp.json()["id"], account_resp.json()["id"]


@pytest.mark.asyncio
async def test_create_opportunity(client: AsyncClient):
    contact_id, account_id = await setup_test_data(client)
    response = await client.post("/opportunities", json={
        "name": "Big Deal",
        "stage": "prospecting",
        "amount": 50000.0,
        "probability": 10,
        "account_id": account_id,
        "contact_id": contact_id
    })
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Big Deal"
    assert data["stage"] == "prospecting"
    assert data["amount"] == 50000.0
    assert data["id"] == 1


@pytest.mark.asyncio
async def test_create_opportunity_invalid_account(client: AsyncClient):
    contact_resp = await client.post("/contacts", json={"email": "inv@test.com", "first_name": "Inv", "last_name": "Contact"})
    response = await client.post("/opportunities", json={
        "name": "Bad Opp",
        "account_id": 999,
        "contact_id": contact_resp.json()["id"]
    })
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_create_opportunity_invalid_contact(client: AsyncClient):
    account_resp = await client.post("/accounts", json={"name": "Inv Account"})
    response = await client.post("/opportunities", json={
        "name": "Bad Opp",
        "account_id": account_resp.json()["id"],
        "contact_id": 999
    })
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_list_opportunities(client: AsyncClient):
    contact_id, account_id = await setup_test_data(client)
    await client.post("/opportunities", json={"name": "Opp 1", "account_id": account_id, "contact_id": contact_id})
    await client.post("/opportunities", json={"name": "Opp 2", "account_id": account_id, "contact_id": contact_id})
    response = await client.get("/opportunities")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 2
    assert len(data["items"]) == 2


@pytest.mark.asyncio
async def test_filter_opportunities_by_stage(client: AsyncClient):
    contact_id, account_id = await setup_test_data(client)
    await client.post("/opportunities", json={"name": "Prospecting", "stage": "prospecting", "account_id": account_id, "contact_id": contact_id})
    await client.post("/opportunities", json={"name": "Proposal", "stage": "proposal", "account_id": account_id, "contact_id": contact_id})
    response = await client.get("/opportunities?stage=prospecting")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1
    assert data["items"][0]["stage"] == "prospecting"


@pytest.mark.asyncio
async def test_filter_opportunities_by_account(client: AsyncClient):
    contact_id, account_id = await setup_test_data(client)
    account2_resp = await client.post("/accounts", json={"name": "Account 2"})
    account2_id = account2_resp.json()["id"]
    await client.post("/opportunities", json={"name": "Opp 1", "account_id": account_id, "contact_id": contact_id})
    await client.post("/opportunities", json={"name": "Opp 2", "account_id": account2_id, "contact_id": contact_id})
    response = await client.get(f"/opportunities?account_id={account_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1
    assert data["items"][0]["account_id"] == account_id


@pytest.mark.asyncio
async def test_get_opportunity(client: AsyncClient):
    contact_id, account_id = await setup_test_data(client)
    create_resp = await client.post("/opportunities", json={"name": "Get Opp", "account_id": account_id, "contact_id": contact_id})
    opp_id = create_resp.json()["id"]
    response = await client.get(f"/opportunities/{opp_id}")
    assert response.status_code == 200
    assert response.json()["name"] == "Get Opp"


@pytest.mark.asyncio
async def test_update_opportunity(client: AsyncClient):
    contact_id, account_id = await setup_test_data(client)
    create_resp = await client.post("/opportunities", json={"name": "Old", "stage": "prospecting", "amount": 10000, "account_id": account_id, "contact_id": contact_id})
    opp_id = create_resp.json()["id"]
    response = await client.patch(f"/opportunities/{opp_id}", json={"name": "New", "stage": "proposal", "amount": 25000, "probability": 50})
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "New"
    assert data["stage"] == "proposal"
    assert data["amount"] == 25000
    assert data["probability"] == 50


@pytest.mark.asyncio
async def test_update_opportunity_stage_to_closed_won(client: AsyncClient):
    contact_id, account_id = await setup_test_data(client)
    create_resp = await client.post("/opportunities", json={"name": "Win", "stage": "proposal", "account_id": account_id, "contact_id": contact_id})
    opp_id = create_resp.json()["id"]
    response = await client.patch(f"/opportunities/{opp_id}", json={"stage": "closed_won", "probability": 100})
    assert response.status_code == 200
    assert response.json()["stage"] == "closed_won"
    assert response.json()["probability"] == 100


@pytest.mark.asyncio
async def test_delete_opportunity(client: AsyncClient):
    contact_id, account_id = await setup_test_data(client)
    create_resp = await client.post("/opportunities", json={"name": "Delete Me", "account_id": account_id, "contact_id": contact_id})
    opp_id = create_resp.json()["id"]
    response = await client.delete(f"/opportunities/{opp_id}")
    assert response.status_code == 204
    get_resp = await client.get(f"/opportunities/{opp_id}")
    assert get_resp.status_code == 404


@pytest.mark.asyncio
async def test_audit_log_opportunity(client: AsyncClient, db_session):
    contact_id, account_id = await setup_test_data(client)
    await client.post("/opportunities", json={"name": "Audit Opp", "account_id": account_id, "contact_id": contact_id})
    result = await db_session.execute(select(AuditLog).where(AuditLog.entity_type == "opportunity"))
    logs = result.scalars().all()
    assert len(logs) == 1
    assert logs[0].action == AuditAction.CREATE
@pytest.mark.asyncio
async def test_pipeline_summary(client: AsyncClient):
    contact_id, account_id = await setup_test_data(client)
    
    # Create opportunities in different stages
    await client.post("/opportunities", json={"name": "Opp 1", "stage": "prospecting", "amount": 10000, "probability": 10, "account_id": account_id, "contact_id": contact_id})
    await client.post("/opportunities", json={"name": "Opp 2", "stage": "qualification", "amount": 20000, "probability": 30, "account_id": account_id, "contact_id": contact_id})
    await client.post("/opportunities", json={"name": "Opp 3", "stage": "proposal", "amount": 30000, "probability": 50, "account_id": account_id, "contact_id": contact_id})
    await client.post("/opportunities", json={"name": "Opp 4", "stage": "negotiation", "amount": 40000, "probability": 80, "account_id": account_id, "contact_id": contact_id})
    await client.post("/opportunities", json={"name": "Opp 5", "stage": "closed_won", "amount": 50000, "probability": 100, "account_id": account_id, "contact_id": contact_id})
    await client.post("/opportunities", json={"name": "Opp 6", "stage": "closed_lost", "amount": 5000, "probability": 0, "account_id": account_id, "contact_id": contact_id})
    
    response = await client.get("/opportunities/pipeline/summary")
    assert response.status_code == 200
    data = response.json()
    
    assert "stages" in data
    assert len(data["stages"]) == 6
    
    # Check open opportunities
    assert data["total_open_count"] == 4
    assert data["total_open_amount"] == 100000
    assert data["total_weighted_amount"] == 54000  # 10000*0.1 + 20000*0.3 + 30000*0.5 + 40000*0.8
    
    # Check won
    assert data["total_won_count"] == 1
    assert data["total_won_amount"] == 50000
    
    # Check lost
    assert data["total_lost_count"] == 1
    assert data["total_lost_amount"] == 5000
    
    # Verify each stage
    stages = {s["stage"]: s for s in data["stages"]}
    assert stages["prospecting"]["count"] == 1
    assert stages["prospecting"]["total_amount"] == 10000
    assert stages["prospecting"]["weighted_amount"] == 1000
    assert stages["qualification"]["count"] == 1
    assert stages["qualification"]["total_amount"] == 20000
    assert stages["qualification"]["weighted_amount"] == 6000
    assert stages["proposal"]["count"] == 1
    assert stages["proposal"]["total_amount"] == 30000
    assert stages["proposal"]["weighted_amount"] == 15000
    assert stages["negotiation"]["count"] == 1
    assert stages["negotiation"]["total_amount"] == 40000
    assert stages["negotiation"]["weighted_amount"] == 32000
    assert stages["closed_won"]["count"] == 1
    assert stages["closed_won"]["total_amount"] == 50000
    assert stages["closed_won"]["weighted_amount"] == 50000
    assert stages["closed_lost"]["count"] == 1
    assert stages["closed_lost"]["total_amount"] == 5000
    assert stages["closed_lost"]["weighted_amount"] == 0