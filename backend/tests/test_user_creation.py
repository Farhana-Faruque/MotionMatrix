
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from backend.app.core.config import settings
from backend.app.schemas.user import UserCreate
from backend.app.services.user_service import create_user
from backend.app.utils.enums import UserRole

@pytest.fixture
def db_session(mocker):
    """Mocks a database session."""
    db = mocker.MagicMock(spec=Session)
    return db

def test_create_user_is_first_login_true(db_session):
    """
    Test that a newly created user has is_first_login set to True.
    """
    user_data = UserCreate(
        email="test@example.com",
        password="password",
        full_name="Test User",
        role=UserRole.WORKER
    )

    # Mock the query to simulate that the user does not exist yet
    db_session.query.return_value.filter.return_value.first.return_value = None

    # Call the create_user service function
    new_user_response = create_user(db_session, user_data)

    # Assert that is_first_login is True
    assert new_user_response.is_first_login is True
