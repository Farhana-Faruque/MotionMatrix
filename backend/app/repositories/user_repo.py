"""
User repository with user-specific database operations.

This module provides specialized database operations for the User model,
extending the base repository with user-specific queries and operations.

Example:
    from app.repositories.user_repo import UserRepository
    
    user_repo = UserRepository()
    user = user_repo.get_by_email(db, "user@example.com")
    active_users = user_repo.get_active_users(db)
"""

import logging
from typing import List, Optional
from uuid import UUID

from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError

from backend.app.models.user import User
from backend.app.repositories.base import BaseRepository
from backend.app.utils.enums import UserRole, UserStatus


# Configure logging
logger = logging.getLogger(__name__)


# ============================================================================
# User Repository
# ============================================================================

class UserRepository(BaseRepository[User]):
    """
    Repository for User model with specialized operations.
    
    This repository extends BaseRepository with user-specific queries and
    business logic. It provides convenient methods for common user operations
    such as authentication, role-based queries, and status management.
    
    Features:
        - Email-based user lookup (for authentication)
        - Role-based filtering
        - Active user queries (automatic status filtering)
        - Password management
        - Status transitions
        - First login tracking
        
    Example:
        user_repo = UserRepository()
        
        # Get user by email (for login)
        user = user_repo.get_by_email(db, "user@example.com")
        
        # Get all admins
        admins = user_repo.get_by_role(db, UserRole.ADMIN)
        
        # Update password
        user_repo.update_password(db, user_id, new_hashed_password)
        
    Notes:
        - Most query methods filter out inactive users by default
        - Use explicit methods to query inactive/all users
        - All write operations commit transactions automatically
    """
    
    def __init__(self):
        """Initialize UserRepository with User model."""
        super().__init__(User)
        logger.debug("UserRepository initialized")
    
    # ========================================================================
    # Authentication & Lookup Methods
    # ========================================================================
    
    def get_by_email(self, db: Session, email: str) -> Optional[User]:
        """
        Get user by email address.
        
        This is the primary method for user authentication and lookup.
        Email is case-insensitive and normalized.
        
        Args:
            db: Database session
            email: User's email address
            
        Returns:
            User: User instance if found, None otherwise
            
        Example:
            # For login
            user = user_repo.get_by_email(db, "user@example.com")
            if user and verify_password(password, user.hashed_password):
                return create_token(user)
                
        Notes:
            - Email is unique in database (enforced by constraint)
            - Returns None if user not found (doesn't raise exception)
            - Does NOT filter by status (allows checking inactive users)
        """
        try:
            # Normalize email (should already be lowercase in DB)
            email = email.lower().strip()
            
            logger.debug(f"Looking up user by email: {email}")
            
            user = db.query(User).filter(User.email == email).first()
            
            if user:
                logger.debug(f"Found user with email: {email}")
            else:
                logger.debug(f"No user found with email: {email}")
            
            return user
            
        except SQLAlchemyError as e:
            logger.error(f"Error getting user by email {email}: {str(e)}")
            raise
    
    def email_exists(self, db: Session, email: str) -> bool:
        """
        Check if email already exists in database.
        
        Useful for registration validation before creating user.
        
        Args:
            db: Database session
            email: Email to check
            
        Returns:
            bool: True if email exists, False otherwise
            
        Example:
            if user_repo.email_exists(db, new_email):
                raise EmailAlreadyExistsException()
        """
        try:
            email = email.lower().strip()
            exists = db.query(User).filter(User.email == email).count() > 0
            
            logger.debug(f"Email {email} {'exists' if exists else 'does not exist'}")
            return exists
            
        except SQLAlchemyError as e:
            logger.error(f"Error checking email existence: {str(e)}")
            raise
    
    # ========================================================================
    # Role-Based Queries
    # ========================================================================
    
    def get_by_role(
        self,
        db: Session,
        role: UserRole,
        *,
        include_inactive: bool = False,
        skip: int = 0,
        limit: int = 100
    ) -> List[User]:
        """
        Get users by role.
        
        Retrieves all users with a specific role. By default, only returns
        active users unless explicitly requested.
        
        Args:
            db: Database session
            role: User role to filter by
            include_inactive: If True, include inactive users
            skip: Number of records to skip (pagination)
            limit: Maximum number of records to return
            
        Returns:
            List[User]: List of users with specified role
            
        Example:
            # Get all active admins
            admins = user_repo.get_by_role(db, UserRole.ADMIN)
            
            # Get all managers (including inactive)
            all_managers = user_repo.get_by_role(
                db,
                UserRole.MANAGER,
                include_inactive=True
            )
            
        Notes:
            - Returns empty list if no users found
            - Supports pagination with skip/limit
            - By default filters out inactive users
        """
        try:
            logger.debug(
                f"Getting users by role: {role.value}, "
                f"include_inactive={include_inactive}"
            )
            
            query = db.query(User).filter(User.role == role.value)
            
            # Filter by status unless including inactive
            if not include_inactive:
                active_statuses = [s.value for s in UserStatus.active_statuses()]
                query = query.filter(User.status.in_(active_statuses))
            
            # Apply pagination
            users = query.offset(skip).limit(limit).all()
            
            logger.debug(f"Found {len(users)} users with role {role.value}")
            return users
            
        except SQLAlchemyError as e:
            logger.error(f"Error getting users by role {role.value}: {str(e)}")
            raise
    
    def get_manageable_users(
        self,
        db: Session,
        manager_role: UserRole,
        *,
        skip: int = 0,
        limit: int = 100
    ) -> List[User]:
        """
        Get users that a manager role can manage.
        
        Uses role hierarchy to determine which users can be managed by
        a given manager role.
        
        Args:
            db: Database session
            manager_role: Role of the manager
            skip: Number of records to skip
            limit: Maximum number of records
            
        Returns:
            List[User]: Users manageable by this role
            
        Example:
            # Get all users a manager can manage
            manageable = user_repo.get_manageable_users(
                db,
                UserRole.MANAGER
            )
            
        Notes:
            - Uses UserRole.get_hierarchical_roles() for hierarchy
            - Only returns active users
            - Excludes users with same or higher role
        """
        try:
            # Get roles this manager can manage
            manageable_roles = UserRole.get_hierarchical_roles(manager_role)
            
            # Exclude the manager's own role
            manageable_roles = [
                r for r in manageable_roles if r != manager_role
            ]
            
            role_values = [r.value for r in manageable_roles]
            active_statuses = [s.value for s in UserStatus.active_statuses()]
            
            logger.debug(
                f"Getting users manageable by {manager_role.value}: {role_values}"
            )
            
            users = db.query(User).filter(
                User.role.in_(role_values),
                User.status.in_(active_statuses)
            ).offset(skip).limit(limit).all()
            
            logger.debug(f"Found {len(users)} manageable users")
            return users
            
        except SQLAlchemyError as e:
            logger.error(
                f"Error getting manageable users for {manager_role.value}: {str(e)}"
            )
            raise
    
    # ========================================================================
    # Status-Based Queries
    # ========================================================================
    
    def get_active_users(
        self,
        db: Session,
        *,
        skip: int = 0,
        limit: int = 100,
        role: Optional[UserRole] = None
    ) -> List[User]:
        """
        Get all active users.
        
        Returns users with active statuses (ACTIVE, PENDING_PASSWORD_CHANGE).
        Optionally filter by role.
        
        Args:
            db: Database session
            skip: Number of records to skip
            limit: Maximum number of records
            role: Optional role filter
            
        Returns:
            List[User]: Active users
            
        Example:
            # Get all active users
            active_users = user_repo.get_active_users(db)
            
            # Get active workers only
            active_workers = user_repo.get_active_users(
                db,
                role=UserRole.WORKER
            )
            
        Notes:
            - Active means ACTIVE or PENDING_PASSWORD_CHANGE status
            - Excludes INACTIVE, SUSPENDED, LOCKED users
            - Supports pagination and role filtering
        """
        try:
            logger.debug(f"Getting active users, role filter: {role}")
            
            active_statuses = [s.value for s in UserStatus.active_statuses()]
            query = db.query(User).filter(User.status.in_(active_statuses))
            
            # Apply role filter if provided
            if role:
                query = query.filter(User.role == role.value)
            
            users = query.offset(skip).limit(limit).all()
            
            logger.debug(f"Found {len(users)} active users")
            return users
            
        except SQLAlchemyError as e:
            logger.error(f"Error getting active users: {str(e)}")
            raise
    
    def get_by_status(
        self,
        db: Session,
        status: UserStatus,
        *,
        skip: int = 0,
        limit: int = 100
    ) -> List[User]:
        """
        Get users by specific status.
        
        Args:
            db: Database session
            status: Status to filter by
            skip: Number of records to skip
            limit: Maximum number of records
            
        Returns:
            List[User]: Users with specified status
            
        Example:
            # Get all suspended users
            suspended = user_repo.get_by_status(db, UserStatus.SUSPENDED)
            
            # Get users needing password change
            need_change = user_repo.get_by_status(
                db,
                UserStatus.PENDING_PASSWORD_CHANGE
            )
        """
        try:
            logger.debug(f"Getting users by status: {status.value}")
            
            users = db.query(User).filter(
                User.status == status.value
            ).offset(skip).limit(limit).all()
            
            logger.debug(f"Found {len(users)} users with status {status.value}")
            return users
            
        except SQLAlchemyError as e:
            logger.error(f"Error getting users by status {status.value}: {str(e)}")
            raise
    
    def count_by_status(self, db: Session, status: UserStatus) -> int:
        """
        Count users by status.
        
        Args:
            db: Database session
            status: Status to count
            
        Returns:
            int: Number of users with status
            
        Example:
            active_count = user_repo.count_by_status(db, UserStatus.ACTIVE)
        """
        try:
            count = db.query(User).filter(
                User.status == status.value
            ).count()
            
            logger.debug(f"Count for status {status.value}: {count}")
            return count
            
        except SQLAlchemyError as e:
            logger.error(f"Error counting users by status: {str(e)}")
            raise
    
    # ========================================================================
    # Password Management
    # ========================================================================
    
    def update_password(
        self,
        db: Session,
        user_id: UUID,
        hashed_password: str
    ) -> Optional[User]:
        """
        Update user's password.
        
        Updates the hashed password and optionally clears first login flag.
        
        Args:
            db: Database session
            user_id: User's ID
            hashed_password: New bcrypt hashed password
            
        Returns:
            User: Updated user or None if not found
            
        Example:
            # After password validation
            from app.core.security import hash_password
            
            new_hash = hash_password(new_password)
            user = user_repo.update_password(db, user_id, new_hash)
            
        Notes:
            - Does NOT validate password (do this before calling)
            - Commits transaction automatically
            - Use with update_status to clear PENDING_PASSWORD_CHANGE
        """
        try:
            user = self.get(db, user_id)
            if not user:
                logger.warning(f"Cannot update password: User {user_id} not found")
                return None
            
            logger.info(f"Updating password for user {user_id}")
            
            user.hashed_password = hashed_password
            db.add(user)
            db.commit()
            db.refresh(user)
            
            logger.info(f"Password updated for user {user_id}")
            return user
            
        except SQLAlchemyError as e:
            logger.error(f"Error updating password for user {user_id}: {str(e)}")
            db.rollback()
            raise
    
    # ========================================================================
    # Status Management
    # ========================================================================
    
    def update_status(
        self,
        db: Session,
        user_id: UUID,
        status: UserStatus
    ) -> Optional[User]:
        """
        Update user's account status.
        
        Changes user status for account management (activate, deactivate,
        suspend, lock, etc.).
        
        Args:
            db: Database session
            user_id: User's ID
            status: New status to set
            
        Returns:
            User: Updated user or None if not found
            
        Example:
            # Deactivate user
            user_repo.update_status(db, user_id, UserStatus.INACTIVE)
            
            # Suspend user
            user_repo.update_status(db, user_id, UserStatus.SUSPENDED)
            
            # Reactivate user
            user_repo.update_status(db, user_id, UserStatus.ACTIVE)
            
        Notes:
            - Validates status transition at application level
            - Commits transaction automatically
            - Use for administrative status changes
        """
        try:
            user = self.get(db, user_id)
            if not user:
                logger.warning(f"Cannot update status: User {user_id} not found")
                return None
            
            logger.info(
                f"Updating status for user {user_id}: "
                f"{user.status} -> {status.value}"
            )
            
            user.status = status.value
            db.add(user)
            db.commit()
            db.refresh(user)
            
            logger.info(f"Status updated for user {user_id} to {status.value}")
            return user
            
        except SQLAlchemyError as e:
            logger.error(f"Error updating status for user {user_id}: {str(e)}")
            db.rollback()
            raise
    
    def update_role(
        self,
        db: Session,
        user_id: UUID,
        role: UserRole
    ) -> Optional[User]:
        """
        Update user's role.
        
        Changes user role for permission management. Should be restricted
        to administrators.
        
        Args:
            db: Database session
            user_id: User's ID
            role: New role to assign
            
        Returns:
            User: Updated user or None if not found
            
        Example:
            # Promote to manager
            user_repo.update_role(db, user_id, UserRole.MANAGER)
            
        Notes:
            - Requires admin authorization (check at endpoint level)
            - Commits transaction automatically
        """
        try:
            user = self.get(db, user_id)
            if not user:
                logger.warning(f"Cannot update role: User {user_id} not found")
                return None
            
            logger.info(
                f"Updating role for user {user_id}: "
                f"{user.role} -> {role.value}"
            )
            
            user.role = role.value
            db.add(user)
            db.commit()
            db.refresh(user)
            
            logger.info(f"Role updated for user {user_id} to {role.value}")
            return user
            
        except SQLAlchemyError as e:
            logger.error(f"Error updating role for user {user_id}: {str(e)}")
            db.rollback()
            raise
    
    # ========================================================================
    # First Login Management
    # ========================================================================
    
    def mark_first_login_complete(
        self,
        db: Session,
        user_id: UUID
    ) -> Optional[User]:
        """
        Mark user's first login as complete.
        
        Clears the first login flag after user successfully changes their
        temporary password.
        
        Args:
            db: Database session
            user_id: User's ID
            
        Returns:
            User: Updated user or None if not found
            
        Example:
            # After successful password change on first login
            user = user_repo.mark_first_login_complete(db, user_id)
            
            # Also update status if needed
            if user.status == UserStatus.PENDING_PASSWORD_CHANGE.value:
                user_repo.update_status(db, user_id, UserStatus.ACTIVE)
                
        Notes:
            - Call this after first successful password change
            - Consider also updating status to ACTIVE
            - Commits transaction automatically
        """
        try:
            user = self.get(db, user_id)
            if not user:
                logger.warning(
                    f"Cannot mark first login complete: User {user_id} not found"
                )
                return None
            
            logger.info(f"Marking first login complete for user {user_id}")
            
            user.is_first_login = False
            db.add(user)
            db.commit()
            db.refresh(user)
            
            logger.info(f"First login marked complete for user {user_id}")
            return user
            
        except SQLAlchemyError as e:
            logger.error(
                f"Error marking first login complete for user {user_id}: {str(e)}"
            )
            db.rollback()
            raise
    
    def get_first_login_users(
        self,
        db: Session,
        *,
        skip: int = 0,
        limit: int = 100
    ) -> List[User]:
        """
        Get users who haven't completed first login.
        
        Useful for administrative monitoring of new users.
        
        Args:
            db: Database session
            skip: Number of records to skip
            limit: Maximum number of records
            
        Returns:
            List[User]: Users needing first login
            
        Example:
            # Get all users needing password change
            pending_users = user_repo.get_first_login_users(db)
        """
        try:
            logger.debug("Getting users with pending first login")
            
            users = db.query(User).filter(
                User.is_first_login == True
            ).offset(skip).limit(limit).all()
            
            logger.debug(f"Found {len(users)} users with pending first login")
            return users
            
        except SQLAlchemyError as e:
            logger.error(f"Error getting first login users: {str(e)}")
            raise
    
    # ========================================================================
    # Bulk Operations
    # ========================================================================
    
    def bulk_update_status(
        self,
        db: Session,
        user_ids: List[UUID],
        status: UserStatus
    ) -> int:
        """
        Update status for multiple users at once.
        
        Args:
            db: Database session
            user_ids: List of user IDs to update
            status: New status to set
            
        Returns:
            int: Number of users updated
            
        Example:
            # Deactivate multiple users
            count = user_repo.bulk_update_status(
                db,
                [id1, id2, id3],
                UserStatus.INACTIVE
            )
            
        Notes:
            - All updates in single transaction (atomic)
            - Non-existent IDs are silently skipped
            - Returns count of actually updated users
        """
        try:
            logger.info(
                f"Bulk updating status to {status.value} for {len(user_ids)} users"
            )
            
            updated_count = db.query(User).filter(
                User.id.in_(user_ids)
            ).update(
                {User.status: status.value},
                synchronize_session=False
            )
            
            db.commit()
            
            logger.info(f"Bulk updated {updated_count} users to status {status.value}")
            return updated_count
            
        except SQLAlchemyError as e:
            logger.error(f"Error bulk updating status: {str(e)}")
            db.rollback()
            raise
    
    # ========================================================================
    # Statistics & Reporting
    # ========================================================================
    
    def get_user_statistics(self, db: Session) -> dict:
        """
        Get user statistics for reporting.
        
        Args:
            db: Database session
            
        Returns:
            dict: Statistics including counts by role and status
            
        Example:
            stats = user_repo.get_user_statistics(db)
            print(f"Total users: {stats['total']}")
            print(f"Active users: {stats['by_status']['ACTIVE']}")
        """
        try:
            logger.debug("Calculating user statistics")
            
            # Total count
            total = self.count(db)
            
            # Count by status
            by_status = {}
            for status in UserStatus:
                by_status[status.value] = self.count_by_status(db, status)
            
            # Count by role
            by_role = {}
            for role in UserRole:
                count = db.query(User).filter(User.role == role.value).count()
                by_role[role.value] = count
            
            stats = {
                "total": total,
                "by_status": by_status,
                "by_role": by_role,
                "active": sum(
                    by_status.get(s.value, 0)
                    for s in UserStatus.active_statuses()
                ),
                "first_login_pending": db.query(User).filter(
                    User.is_first_login == True
                ).count()
            }
            
            logger.debug(f"User statistics: {stats}")
            return stats
            
        except SQLAlchemyError as e:
            logger.error(f"Error calculating user statistics: {str(e)}")
            raise


# ============================================================================
# Module Initialization
# ============================================================================

logger.info("UserRepository module initialized")