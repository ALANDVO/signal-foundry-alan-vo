from fastapi import APIRouter, Depends, HTTPException, Request, Query, status
from fastapi.responses import RedirectResponse, JSONResponse
from urllib.parse import urlencode, parse_qs
import secrets
import base64
import hashlib
import asyncio

from app.core.config import settings
from app.core.database import get_db
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.account import Account, AccountType

router = APIRouter(tags=["auth"])


# PKCE helper functions
def generate_code_verifier() -> str:
    """Generate a random code verifier for PKCE."""
    return base64.urlsafe_b64encode(secrets.token_bytes(32)).rstrip(b"=").decode("ascii")


def generate_code_challenge(code_verifier: str) -> str:
    """Generate a code challenge from the code verifier using S256 method."""
    challenge = hashlib.sha256(code_verifier.encode("ascii")).digest()
    return base64.urlsafe_b64encode(challenge).rstrip(b"=").decode("ascii")


# In-memory storage for PKCE states (in production use Redis or DB)
# Maps code_verifier -> (code_challenge, expires_at)
_pkce_states: dict = {}


try:
    from keycloak import KeycloakOpenID
except ImportError:
    KeycloakOpenID = None


@router.get("/login")
async def login(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> JSONResponse:
    """Initiate OIDC authorization code flow with PKCE.
    
    Keycloak endpoint that generates PKCE parameters and redirects
    to the Keycloak authorization server.
    """
    if not settings.oidc_enabled:
        raise HTTPException(
            status_code=status.HTTP_503_NOT_AVAILABLE,
            detail="OIDC authentication is not configured. Set oidc_enabled=true in config.",
        )
    
    # Generate PKCE code verifier and challenge
    code_verifier = generate_code_verifier()
    code_challenge = generate_code_challenge(code_verifier)
    
    # Store verifier with challenge (short-lived, in-memory)
    _pkce_states[code_verifier] = {
        "code_challenge": code_challenge,
        "expires_at": asyncio.get_event_loop().time() + 300,  # 5 minutes
    }
    
    # Build authorization URL for Keycloak
    auth_params = {
        "response_type": "code",
        "client_id": settings.oidc_client_id,
        "redirect_uri": settings.oidc_redirect_uri,
        "scope": "openid profile email",
        "code_challenge": code_challenge,
        "code_challenge_method": "S256",
        "state": secrets.token_urlsafe(16),
    }
    
    realm = settings.oidc_realm_name or "master"
    auth_url = f"{settings.oidc_issuer_url}/auth/realms/{realm}/protocol/openid-connect/auth?{urlencode(auth_params)}"
    
    return JSONResponse({
        "authorization_url": auth_url,
        "code_verifier": code_verifier,  # Return to client for later use
    })


@router.get("/auth/callback")
async def auth_callback(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> JSONResponse:
    """Handle Keycloak OAuth2 callback with PKCE code exchange.
    
    Exchanges the authorization code for tokens and creates session.
    """
    if not settings.oidc_enabled:
        raise HTTPException(
            status_code=status.HTTP_503_NOT_AVAILABLE,
            detail="OIDC authentication is not configured.",
        )
    
    # Get the authorization code from query params
    code = request.query_params.get("code")
    state = request.query_params.get("state")
    code_verifier = request.query_params.get("code_verifier")
    
    if not code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing authorization code",
        )
    
    # Look up stored PKCE state
    stored = _pkce_states.pop(code_verifier, None) if code_verifier else None
    if not stored:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired PKCE state",
        )
    
    code_challenge = stored["code_challenge"]
    
    # Exchange authorization code for tokens using Keycloak
    if KeycloakOpenID is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Keycloak package not available",
        )
    
    try:
        keycloak = KeycloakOpenID(
            server_url=settings.oidc_issuer_url,
            realm_name=settings.oidc_realm_name or "master",
            client_id=settings.oidc_client_id,
            client_secret_key=settings.oidc_client_secret or "",
        )
        
        # Exchange code for tokens
        token_data = keycloak.token(
            grant_type="authorization_code",
            code=code,
            redirect_uri=settings.oidc_redirect_uri,
            code_verifier=code_verifier,
        )
        
        # Get user info from Keycloak
        user_info = keycloak.userinfo(token_data["access_token"])
        
        # Look up or create user in local database
        stmt = select(Account).where(Account.email == user_info.get('email', ''))
        result = await db.execute(stmt)
        user = result.scalar_one_or_none()
        
        if not user:
            # Create new account from Keycloak user info
            user = Account(
                name=user_info.get('name', ''),
                email=user_info.get('email', ''),
                type=AccountType.PROSPECT,
            )
            db.add(user)
            await db.commit()
            await db.refresh(user)
        
        # Store user ID in session via cookie
        
        # Set HttpOnly cookie with access token
        response = JSONResponse({
            "access_token": token_data["access_token"],
            "token_type": token_data["token_type"],
            "expires_in": token_data["expires_in"],
            "user_info": dict(user_info) if hasattr(user_info, 'items') else user_info,
        })
        
        # Set HttpOnly, Secure cookie for session
        response.set_cookie(
            key="access_token",
            value=token_data["access_token"],
            httponly=True,
            secure=settings.environment == "production",
            samesite="strict",
            path="/",
        )
        
        return response
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Token exchange failed: {str(e)}",
        )


@router.post("/logout")
async def logout(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> JSONResponse:
    """Handle user logout.
    
    Invalidate session cookie and redirect to Keycloak logout.
    """
    if not settings.oidc_enabled:
        raise HTTPException(
            status_code=status.HTTP_503_NOT_AVAILABLE,
            detail="OIDC authentication is not configured.",
        )
    
    # Clear the access token cookie
    response = JSONResponse({"status": "logged out"})
    response.delete_cookie(
        key="access_token",
        httponly=True,
        secure=settings.environment == "production",
        samesite="strict",
        path="/",
    )
    
    # Get the access cookie to get user info for Keycloak logout
    access_token = request.cookies.get("access_token")
    
    try:
        keycloak = KeycloakOpenID(
            server_url=settings.oidc_issuer_url,
            realm_name=settings.oidc_realm_name or "master",
            client_id=settings.oidc_client_id,
            client_secret_key=settings.oidc_client_secret or "",
        )
        
        # Even if Keycloak logout fails, clear local session
        # The end_session_url would require ID token parsing
        
    except Exception:
        pass
    
    return response
