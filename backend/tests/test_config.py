"""
Tests for configuration management.

Tests cover:
- Settings load correctly from environment
- Default values when env vars missing
- Validation for required fields
- Computed properties work correctly
"""

import os
import pytest
from pathlib import Path
from pydantic import ValidationError
from app.core.config import Settings, get_settings


@pytest.fixture
def clean_env(monkeypatch):
    """Remove all environment variables to test defaults."""
    for key in os.environ.keys():
        if key.startswith(("DB_", "JWT_", "SMTP_", "CORS_", "AWS_")):
            monkeypatch.delenv(key, raising=False)


@pytest.fixture
def minimal_env(monkeypatch):
    """Set minimal required environment variables."""
    monkeypatch.setenv("DB_USER", "testuser")
    monkeypatch.setenv("DB_PASSWORD", "testpass123")
    monkeypatch.setenv("DB_NAME", "testdb")
    monkeypatch.setenv("JWT_SECRET_KEY", "a" * 32)  # 32 chars minimum


@pytest.fixture
def full_env(monkeypatch):
    """Set all environment variables for comprehensive testing."""
    # Database
    monkeypatch.setenv("DB_USER", "testuser")
    monkeypatch.setenv("DB_PASSWORD", "testpass123")
    monkeypatch.setenv("DB_HOST", "db.example.com")
    monkeypatch.setenv("DB_PORT", "5433")
    monkeypatch.setenv("DB_NAME", "testdb")
    
    # JWT
    monkeypatch.setenv("JWT_SECRET_KEY", "supersecretkey" * 2)
    monkeypatch.setenv("JWT_ALGORITHM", "HS512")
    monkeypatch.setenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60")
    monkeypatch.setenv("REFRESH_TOKEN_EXPIRE_DAYS", "14")
    
    # SMTP
    monkeypatch.setenv("SMTP_HOST", "smtp.example.com")
    monkeypatch.setenv("SMTP_PORT", "465")
    monkeypatch.setenv("SMTP_USER", "user@example.com")
    monkeypatch.setenv("SMTP_PASSWORD", "emailpass")
    monkeypatch.setenv("FROM_EMAIL", "noreply@example.com")
    
    # CORS
    monkeypatch.setenv("CORS_ORIGINS", "http://localhost:3000,https://example.com")
    
    # Pagination
    monkeypatch.setenv("DEFAULT_PAGE_SIZE", "25")
    monkeypatch.setenv("MAX_PAGE_SIZE", "200")
    
    # System constants
    monkeypatch.setenv("IDLENESS_THRESHOLD_MINUTES", "45")
    monkeypatch.setenv("SHIFT_START_TIME", "08:00")
    monkeypatch.setenv("SHIFT_END_TIME", "16:00")
    monkeypatch.setenv("OVERTIME_RATE_MULTIPLIER", "2.0")


class TestSettingsLoading:
    """Test settings load correctly from environment."""
    
    def test_settings_load_with_minimal_env(self, minimal_env):
        """Test that settings load with only required variables."""
        settings = Settings()
        
        assert settings.DB_USER == "testuser"
        assert settings.DB_PASSWORD == "testpass123"
        assert settings.DB_NAME == "testdb"
        assert settings.JWT_SECRET_KEY == "a" * 32
        
    def test_settings_load_with_full_env(self, full_env):
        """Test that all settings load correctly from environment."""
        settings = Settings()
        
        # Database
        assert settings.DB_USER == "testuser"
        assert settings.DB_HOST == "db.example.com"
        assert settings.DB_PORT == 5433
        assert settings.DB_NAME == "testdb"
        
        # JWT
        assert settings.JWT_ALGORITHM == "HS512"
        assert settings.ACCESS_TOKEN_EXPIRE_MINUTES == 60
        assert settings.REFRESH_TOKEN_EXPIRE_DAYS == 14
        
        # SMTP
        assert settings.SMTP_HOST == "smtp.example.com"
        assert settings.SMTP_PORT == 465
        assert settings.SMTP_USER == "user@example.com"
        
        # System constants
        assert settings.IDLENESS_THRESHOLD_MINUTES == 45
        assert settings.SHIFT_START_TIME == "08:00"
        assert settings.OVERTIME_RATE_MULTIPLIER == 2.0
    
    def test_cors_origins_parse_from_string(self, minimal_env, monkeypatch):
        """Test CORS origins can be parsed from comma-separated string."""
        monkeypatch.setenv("CORS_ORIGINS", "http://localhost:3000,https://example.com,https://api.example.com")
        settings = Settings()
        
        assert len(settings.CORS_ORIGINS) == 3
        assert "http://localhost:3000" in settings.CORS_ORIGINS
        assert "https://example.com" in settings.CORS_ORIGINS
        assert "https://api.example.com" in settings.CORS_ORIGINS


class TestDefaultValues:
    """Test default values when env vars are missing."""
    
    def test_database_defaults(self, minimal_env):
        """Test database configuration defaults."""
        settings = Settings()
        
        assert settings.DB_HOST == "localhost"
        assert settings.DB_PORT == 5432
        assert settings.DB_POOL_SIZE == 5
        assert settings.DB_MAX_OVERFLOW == 10
        assert settings.DB_ECHO is False
    
    def test_jwt_defaults(self, minimal_env):
        """Test JWT configuration defaults."""
        settings = Settings()
        
        assert settings.JWT_ALGORITHM == "HS256"
        assert settings.ACCESS_TOKEN_EXPIRE_MINUTES == 30
        assert settings.REFRESH_TOKEN_EXPIRE_DAYS == 7
    
    def test_smtp_defaults(self, minimal_env):
        """Test SMTP configuration defaults."""
        settings = Settings()
        
        assert settings.SMTP_HOST == "smtp.gmail.com"
        assert settings.SMTP_PORT == 587
        assert settings.SMTP_TLS is True
        assert settings.SMTP_SSL is False
        assert settings.FROM_EMAIL == "noreply@example.com"
        assert settings.EMAILS_ENABLED is True
    
    def test_pagination_defaults(self, minimal_env):
        """Test pagination defaults."""
        settings = Settings()
        
        assert settings.DEFAULT_PAGE_SIZE == 50
        assert settings.MAX_PAGE_SIZE == 100
    
    def test_system_constants_defaults(self, minimal_env):
        """Test system constants defaults."""
        settings = Settings()
        
        assert settings.IDLENESS_THRESHOLD_MINUTES == 30
        assert settings.SHIFT_START_TIME == "09:00"
        assert settings.SHIFT_END_TIME == "17:00"
        assert settings.STANDARD_WORK_HOURS == 8.0
        assert settings.OVERTIME_RATE_MULTIPLIER == 1.5
        assert settings.LATE_ARRIVAL_GRACE_MINUTES == 15
    
    def test_security_defaults(self, minimal_env):
        """Test security settings defaults."""
        settings = Settings()
        
        assert settings.PASSWORD_MIN_LENGTH == 8
        assert settings.PASSWORD_REQUIRE_UPPERCASE is True
        assert settings.PASSWORD_REQUIRE_LOWERCASE is True
        assert settings.PASSWORD_REQUIRE_DIGIT is True
        assert settings.PASSWORD_REQUIRE_SPECIAL is True


class TestValidation:
    """Test validation for required fields and invalid values."""
    
    def test_missing_required_db_user(self, clean_env, monkeypatch):
        """Test that missing DB_USER raises validation error."""
        monkeypatch.setenv("DB_PASSWORD", "testpass")
        monkeypatch.setenv("DB_NAME", "testdb")
        monkeypatch.setenv("JWT_SECRET_KEY", "a" * 32)
        
        with pytest.raises(ValidationError) as exc_info:
            Settings()
        
        assert "DB_USER" in str(exc_info.value)
    
    def test_missing_required_jwt_secret(self, clean_env, monkeypatch):
        """Test that missing JWT_SECRET_KEY raises validation error."""
        monkeypatch.setenv("DB_USER", "testuser")
        monkeypatch.setenv("DB_PASSWORD", "testpass")
        monkeypatch.setenv("DB_NAME", "testdb")
        
        with pytest.raises(ValidationError) as exc_info:
            Settings()
        
        assert "JWT_SECRET_KEY" in str(exc_info.value)
    
    def test_jwt_secret_too_short(self, minimal_env, monkeypatch):
        """Test that JWT secret key must be at least 32 characters."""
        monkeypatch.setenv("JWT_SECRET_KEY", "short")
        
        with pytest.raises(ValidationError) as exc_info:
            Settings()
        
        assert "JWT_SECRET_KEY" in str(exc_info.value)
    
    def test_invalid_db_port(self, minimal_env, monkeypatch):
        """Test that invalid DB port raises validation error."""
        monkeypatch.setenv("DB_PORT", "99999")
        
        with pytest.raises(ValidationError) as exc_info:
            Settings()
        
        assert "DB_PORT" in str(exc_info.value)
    
    def test_invalid_environment(self, minimal_env, monkeypatch):
        """Test that invalid environment value raises validation error."""
        monkeypatch.setenv("ENVIRONMENT", "invalid")
        
        with pytest.raises(ValidationError) as exc_info:
            Settings()
        
        assert "ENVIRONMENT" in str(exc_info.value)
    
    def test_max_page_size_less_than_default(self, minimal_env, monkeypatch):
        """Test that MAX_PAGE_SIZE must be >= DEFAULT_PAGE_SIZE."""
        monkeypatch.setenv("DEFAULT_PAGE_SIZE", "100")
        monkeypatch.setenv("MAX_PAGE_SIZE", "50")
        
        with pytest.raises(ValidationError) as exc_info:
            Settings()
        
        assert "MAX_PAGE_SIZE" in str(exc_info.value)
    
    def test_invalid_shift_time_format(self, minimal_env, monkeypatch):
        """Test that invalid shift time format raises validation error."""
        monkeypatch.setenv("SHIFT_START_TIME", "25:00")
        
        with pytest.raises(ValidationError) as exc_info:
            Settings()
        
        assert "SHIFT_START_TIME" in str(exc_info.value)
    
    def test_shift_end_before_start(self, minimal_env, monkeypatch):
        """Test that shift end time must be after start time."""
        monkeypatch.setenv("SHIFT_START_TIME", "17:00")
        monkeypatch.setenv("SHIFT_END_TIME", "09:00")
        
        with pytest.raises(ValidationError) as exc_info:
            Settings()
        
        assert "SHIFT_END_TIME" in str(exc_info.value)
    
    def test_smtp_password_required_when_user_provided(self, minimal_env, monkeypatch):
        """Test SMTP password is required when SMTP user is provided."""
        monkeypatch.setenv("SMTP_USER", "user@example.com")
        monkeypatch.setenv("EMAILS_ENABLED", "true")
        # Not setting SMTP_PASSWORD
        
        with pytest.raises(ValidationError) as exc_info:
            Settings()
        
        assert "SMTP_PASSWORD" in str(exc_info.value)


class TestComputedProperties:
    """Test computed properties work correctly."""
    
    def test_database_url_construction(self, minimal_env):
        """Test DATABASE_URL is correctly constructed from components."""
        settings = Settings()
        
        expected = "postgresql://testuser:testpass123@localhost:5432/testdb"
        assert settings.DATABASE_URL == expected
    
    def test_database_url_with_custom_host_port(self, minimal_env, monkeypatch):
        """Test DATABASE_URL with custom host and port."""
        monkeypatch.setenv("DB_HOST", "db.example.com")
        monkeypatch.setenv("DB_PORT", "5433")
        settings = Settings()
        
        expected = "postgresql://testuser:testpass123@db.example.com:5433/testdb"
        assert settings.DATABASE_URL == expected
    
    def test_async_database_url(self, minimal_env):
        """Test ASYNC_DATABASE_URL uses asyncpg driver."""
        settings = Settings()
        
        expected = "postgresql+asyncpg://testuser:testpass123@localhost:5432/testdb"
        assert settings.ASYNC_DATABASE_URL == expected
    
    def test_access_token_expire_seconds(self, minimal_env):
        """Test ACCESS_TOKEN_EXPIRE_SECONDS conversion."""
        settings = Settings()
        
        # Default is 30 minutes = 1800 seconds
        assert settings.ACCESS_TOKEN_EXPIRE_SECONDS == 1800
    
    def test_refresh_token_expire_seconds(self, minimal_env):
        """Test REFRESH_TOKEN_EXPIRE_SECONDS conversion."""
        settings = Settings()
        
        # Default is 7 days = 604800 seconds
        assert settings.REFRESH_TOKEN_EXPIRE_SECONDS == 604800
    
    def test_idleness_threshold_seconds(self, minimal_env):
        """Test IDLENESS_THRESHOLD_SECONDS conversion."""
        settings = Settings()
        
        # Default is 30 minutes = 1800 seconds
        assert settings.IDLENESS_THRESHOLD_SECONDS == 1800
    
    def test_max_upload_size_bytes(self, minimal_env):
        """Test MAX_UPLOAD_SIZE_BYTES conversion."""
        settings = Settings()
        
        # Default is 10 MB = 10485760 bytes
        assert settings.MAX_UPLOAD_SIZE_BYTES == 10485760
    
    def test_custom_token_expiration(self, minimal_env, monkeypatch):
        """Test computed properties with custom token expiration."""
        monkeypatch.setenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60")
        monkeypatch.setenv("REFRESH_TOKEN_EXPIRE_DAYS", "14")
        settings = Settings()
        
        assert settings.ACCESS_TOKEN_EXPIRE_SECONDS == 3600  # 60 minutes
        assert settings.REFRESH_TOKEN_EXPIRE_SECONDS == 1209600  # 14 days


class TestSingletonBehavior:
    """Test get_settings() returns singleton instance."""
    
    def test_get_settings_returns_same_instance(self, minimal_env):
        """Test that get_settings() returns the same instance."""
        settings1 = get_settings()
        settings2 = get_settings()
        
        assert settings1 is settings2
    
    def test_settings_cache_persists(self, minimal_env):
        """Test that settings values are cached."""
        settings1 = get_settings()
        db_user1 = settings1.DB_USER
        
        settings2 = get_settings()
        db_user2 = settings2.DB_USER
        
        assert db_user1 == db_user2
        assert settings1 is settings2


class TestDirectoryCreation:
    """Test that required directories are created."""
    
    def test_upload_directories_created(self, minimal_env, tmp_path, monkeypatch):
        """Test that upload directories are created automatically."""
        upload_dir = tmp_path / "uploads"
        reports_dir = tmp_path / "uploads" / "reports"
        
        monkeypatch.setenv("UPLOAD_DIR", str(upload_dir))
        monkeypatch.setenv("REPORTS_DIR", str(reports_dir))
        
        settings = Settings()
        
        assert settings.UPLOAD_DIR.exists()
        assert settings.REPORTS_DIR.exists()
    
    def test_log_directory_created(self, minimal_env, tmp_path, monkeypatch):
        """Test that log directory is created automatically."""
        log_file = tmp_path / "logs" / "app.log"
        
        monkeypatch.setenv("LOG_FILE", str(log_file))
        
        settings = Settings()
        
        assert settings.LOG_FILE.parent.exists()


class TestEdgeCases:
    """Test edge cases and boundary conditions."""
    
    def test_minimum_password_length(self, minimal_env, monkeypatch):
        """Test minimum password length validation."""
        monkeypatch.setenv("PASSWORD_MIN_LENGTH", "6")
        settings = Settings()
        
        assert settings.PASSWORD_MIN_LENGTH == 6
    
    def test_maximum_access_token_expiration(self, minimal_env, monkeypatch):
        """Test maximum access token expiration (24 hours)."""
        monkeypatch.setenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440")
        settings = Settings()
        
        assert settings.ACCESS_TOKEN_EXPIRE_MINUTES == 1440
    
    def test_overtime_rate_minimum(self, minimal_env, monkeypatch):
        """Test overtime rate at minimum value (1.0x)."""
        monkeypatch.setenv("OVERTIME_RATE_MULTIPLIER", "1.0")
        settings = Settings()
        
        assert settings.OVERTIME_RATE_MULTIPLIER == 1.0
    
    def test_empty_cors_origins(self, minimal_env, monkeypatch):
        """Test handling of empty CORS origins."""
        monkeypatch.setenv("CORS_ORIGINS", "")
        settings = Settings()
        
        # Should result in empty list, not default
        assert settings.CORS_ORIGINS == []
    
    def test_storage_type_validation(self, minimal_env, monkeypatch):
        """Test storage type must be 'local' or 's3'."""
        monkeypatch.setenv("STORAGE_TYPE", "invalid")
        
        with pytest.raises(ValidationError) as exc_info:
            Settings()
        
        assert "STORAGE_TYPE" in str(exc_info.value)