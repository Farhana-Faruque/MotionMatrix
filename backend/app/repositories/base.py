"""
Base repository with common CRUD operations.

This module provides a generic repository pattern implementation for database
operations. It encapsulates common CRUD operations and provides a consistent
interface for data access across the application.

Benefits:
- DRY principle: Common operations defined once
- Type safety: Generic typing for model classes
- Transaction management: Automatic commit/rollback
- Consistency: Uniform interface for all repositories
- Testability: Easy to mock and test

Example:
    from app.repositories.base import BaseRepository
    from app.models.user import User
    
    class UserRepository(BaseRepository[User]):
        def __init__(self):
            super().__init__(User)
    
    # Usage
    user_repo = UserRepository()
    user = user_repo.get(db, user_id)
    users = user_repo.get_multi(db, skip=0, limit=10)
"""

import logging
from typing import Any, Dict, Generic, List, Optional, Type, TypeVar, Union
from uuid import UUID

from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError

from backend.app.core.database import Base


# ============================================================================
# Type Variables
# ============================================================================

# Generic type variable for SQLAlchemy models
# Bound to Base ensures only SQLAlchemy models can be used
ModelType = TypeVar("ModelType", bound=Base)

# Configure logging
logger = logging.getLogger(__name__)


# ============================================================================
# Base Repository Class
# ============================================================================

class BaseRepository(Generic[ModelType]):
    """
    Base repository providing common CRUD operations for any model.
    
    This generic repository implements the Repository pattern, providing
    a consistent interface for database operations. It handles transactions,
    error logging, and common query patterns.
    
    Type Parameters:
        ModelType: The SQLAlchemy model class this repository manages
        
    Attributes:
        model: The SQLAlchemy model class
        
    Example:
        # Create a repository for User model
        class UserRepository(BaseRepository[User]):
            def __init__(self):
                super().__init__(User)
        
        # Use the repository
        repo = UserRepository()
        user = repo.get(db, user_id)
        users = repo.get_multi(db, skip=0, limit=10)
        new_user = repo.create(db, user_data)
        
    Notes:
        - All methods require a database session as first parameter
        - Methods handle transactions internally (commit/rollback)
        - Exceptions are logged and re-raised for proper error handling
        - The session is NOT closed by repository methods
    """
    
    def __init__(self, model: Type[ModelType]):
        """
        Initialize repository with a model class.
        
        Args:
            model: SQLAlchemy model class (must inherit from Base)
            
        Example:
            repo = BaseRepository(User)
        """
        self.model = model
        logger.debug(f"Initialized {self.__class__.__name__} for {model.__name__}")
    
    # ========================================================================
    # READ Operations
    # ========================================================================
    
    def get(self, db: Session, id: UUID) -> Optional[ModelType]:
        """
        Get a single record by ID.
        
        Args:
            db: Database session
            id: Primary key (UUID) of the record
            
        Returns:
            ModelType: The model instance if found, None otherwise
            
        Example:
            user = user_repo.get(db, user_id)
            if user:
                print(f"Found user: {user.email}")
            else:
                print("User not found")
                
        Notes:
            - Returns None if record doesn't exist (doesn't raise exception)
            - Uses primary key lookup (efficient query)
            - No transaction needed (read-only operation)
        """
        try:
            logger.debug(f"Getting {self.model.__name__} with id: {id}")
            instance = db.query(self.model).filter(self.model.id == id).first()
            
            if instance:
                logger.debug(f"Found {self.model.__name__} with id: {id}")
            else:
                logger.debug(f"No {self.model.__name__} found with id: {id}")
            
            return instance
            
        except SQLAlchemyError as e:
            logger.error(
                f"Error getting {self.model.__name__} with id {id}: {str(e)}"
            )
            raise
    
    def get_multi(
        self,
        db: Session,
        *,
        skip: int = 0,
        limit: int = 100,
        filters: Optional[Dict[str, Any]] = None,
        order_by: Optional[str] = None
    ) -> List[ModelType]:
        """
        Get multiple records with pagination and optional filtering.
        
        Args:
            db: Database session
            skip: Number of records to skip (for pagination)
            limit: Maximum number of records to return
            filters: Optional dictionary of field:value pairs for filtering
            order_by: Optional field name to order results by
            
        Returns:
            List[ModelType]: List of model instances (may be empty)
            
        Example:
            # Get first 10 users
            users = user_repo.get_multi(db, skip=0, limit=10)
            
            # Get users with filtering
            active_users = user_repo.get_multi(
                db,
                skip=0,
                limit=10,
                filters={"status": "ACTIVE"},
                order_by="created_at"
            )
            
        Notes:
            - Always returns a list (empty if no results)
            - skip and limit enable pagination
            - filters apply exact match on specified fields
            - order_by sorts results ascending
        """
        try:
            logger.debug(
                f"Getting {self.model.__name__} records: "
                f"skip={skip}, limit={limit}, filters={filters}"
            )
            
            # Start with base query
            query = db.query(self.model)
            
            # Apply filters if provided
            if filters:
                for field, value in filters.items():
                    if hasattr(self.model, field):
                        query = query.filter(getattr(self.model, field) == value)
                    else:
                        logger.warning(
                            f"Field {field} not found in {self.model.__name__}, "
                            f"skipping filter"
                        )
            
            # Apply ordering if provided
            if order_by and hasattr(self.model, order_by):
                query = query.order_by(getattr(self.model, order_by))
            
            # Apply pagination
            results = query.offset(skip).limit(limit).all()
            
            logger.debug(f"Retrieved {len(results)} {self.model.__name__} records")
            return results
            
        except SQLAlchemyError as e:
            logger.error(
                f"Error getting multiple {self.model.__name__} records: {str(e)}"
            )
            raise
    
    def get_by_field(
        self,
        db: Session,
        field_name: str,
        field_value: Any
    ) -> Optional[ModelType]:
        """
        Get a single record by a specific field value.
        
        Args:
            db: Database session
            field_name: Name of the field to filter by
            field_value: Value to match
            
        Returns:
            ModelType: First matching instance or None
            
        Example:
            # Get user by email
            user = user_repo.get_by_field(db, "email", "user@example.com")
            
        Notes:
            - Returns first match only
            - Returns None if field doesn't exist or no match found
            - Use for fields with unique constraints
        """
        try:
            if not hasattr(self.model, field_name):
                logger.warning(
                    f"Field {field_name} not found in {self.model.__name__}"
                )
                return None
            
            logger.debug(
                f"Getting {self.model.__name__} by {field_name}={field_value}"
            )
            
            instance = db.query(self.model).filter(
                getattr(self.model, field_name) == field_value
            ).first()
            
            return instance
            
        except SQLAlchemyError as e:
            logger.error(
                f"Error getting {self.model.__name__} by {field_name}: {str(e)}"
            )
            raise
    
    def count(
        self,
        db: Session,
        filters: Optional[Dict[str, Any]] = None
    ) -> int:
        """
        Get total count of records, optionally filtered.
        
        Args:
            db: Database session
            filters: Optional dictionary of field:value pairs for filtering
            
        Returns:
            int: Total count of matching records
            
        Example:
            # Total users
            total = user_repo.count(db)
            
            # Count active users
            active_count = user_repo.count(
                db,
                filters={"status": "ACTIVE"}
            )
            
        Notes:
            - Efficient count query (doesn't load records)
            - Returns 0 if no matches
            - Useful for pagination (total pages calculation)
        """
        try:
            logger.debug(f"Counting {self.model.__name__} records")
            
            query = db.query(self.model)
            
            # Apply filters if provided
            if filters:
                for field, value in filters.items():
                    if hasattr(self.model, field):
                        query = query.filter(getattr(self.model, field) == value)
            
            count = query.count()
            logger.debug(f"Found {count} {self.model.__name__} records")
            
            return count
            
        except SQLAlchemyError as e:
            logger.error(f"Error counting {self.model.__name__} records: {str(e)}")
            raise
    
    def exists(self, db: Session, id: UUID) -> bool:
        """
        Check if a record exists by ID.
        
        Args:
            db: Database session
            id: Primary key (UUID) of the record
            
        Returns:
            bool: True if record exists, False otherwise
            
        Example:
            if user_repo.exists(db, user_id):
                print("User exists")
            else:
                raise UserNotFoundException()
                
        Notes:
            - More efficient than get() when you only need existence check
            - Uses COUNT query (doesn't load the record)
        """
        try:
            exists = db.query(self.model).filter(
                self.model.id == id
            ).count() > 0
            
            logger.debug(
                f"{self.model.__name__} with id {id} "
                f"{'exists' if exists else 'does not exist'}"
            )
            
            return exists
            
        except SQLAlchemyError as e:
            logger.error(
                f"Error checking existence of {self.model.__name__} "
                f"with id {id}: {str(e)}"
            )
            raise
    
    # ========================================================================
    # CREATE Operations
    # ========================================================================
    
    def create(
        self,
        db: Session,
        *,
        obj_in: Union[Dict[str, Any], ModelType]
    ) -> ModelType:
        """
        Create a new record.
        
        Args:
            db: Database session
            obj_in: Dictionary of field values or model instance
            
        Returns:
            ModelType: Created model instance with ID assigned
            
        Raises:
            SQLAlchemyError: If creation fails (e.g., constraint violation)
            
        Example:
            # Create from dictionary
            user = user_repo.create(db, obj_in={
                "email": "new@example.com",
                "full_name": "New User",
                "hashed_password": "..."
            })
            
            # Create from Pydantic schema
            user_data = UserCreate(**request_data)
            user = user_repo.create(db, obj_in=user_data.dict())
            
        Notes:
            - Automatically commits transaction
            - Rolls back on error
            - Refreshes instance to get generated fields (ID, timestamps)
            - Validates constraints at database level
        """
        try:
            logger.debug(f"Creating new {self.model.__name__}")
            
            # Convert Pydantic model or dict to ORM model
            if isinstance(obj_in, dict):
                db_obj = self.model(**obj_in)
            else:
                # Already a model instance
                db_obj = obj_in
            
            # Add to session
            db.add(db_obj)
            
            # Commit transaction
            db.commit()
            
            # Refresh to get generated fields
            db.refresh(db_obj)
            
            logger.info(
                f"Created {self.model.__name__} with id: {db_obj.id}"
            )
            
            return db_obj
            
        except SQLAlchemyError as e:
            logger.error(f"Error creating {self.model.__name__}: {str(e)}")
            db.rollback()
            raise
    
    def create_multi(
        self,
        db: Session,
        *,
        objects_in: List[Union[Dict[str, Any], ModelType]]
    ) -> List[ModelType]:
        """
        Create multiple records in a single transaction.
        
        Args:
            db: Database session
            objects_in: List of dictionaries or model instances
            
        Returns:
            List[ModelType]: Created model instances
            
        Example:
            users = user_repo.create_multi(db, objects_in=[
                {"email": "user1@example.com", "full_name": "User 1"},
                {"email": "user2@example.com", "full_name": "User 2"},
            ])
            
        Notes:
            - All records created in single transaction (atomic)
            - If any record fails, entire transaction is rolled back
            - More efficient than multiple create() calls
        """
        try:
            logger.debug(f"Creating {len(objects_in)} {self.model.__name__} records")
            
            db_objects = []
            for obj_in in objects_in:
                if isinstance(obj_in, dict):
                    db_obj = self.model(**obj_in)
                else:
                    db_obj = obj_in
                db_objects.append(db_obj)
            
            # Add all objects
            db.add_all(db_objects)
            
            # Commit transaction
            db.commit()
            
            # Refresh all objects
            for db_obj in db_objects:
                db.refresh(db_obj)
            
            logger.info(
                f"Created {len(db_objects)} {self.model.__name__} records"
            )
            
            return db_objects
            
        except SQLAlchemyError as e:
            logger.error(
                f"Error creating multiple {self.model.__name__} records: {str(e)}"
            )
            db.rollback()
            raise
    
    # ========================================================================
    # UPDATE Operations
    # ========================================================================
    
    def update(
        self,
        db: Session,
        *,
        db_obj: ModelType,
        obj_in: Union[Dict[str, Any], ModelType]
    ) -> ModelType:
        """
        Update an existing record.
        
        Args:
            db: Database session
            db_obj: Existing model instance from database
            obj_in: Dictionary of fields to update or model instance
            
        Returns:
            ModelType: Updated model instance
            
        Raises:
            SQLAlchemyError: If update fails
            
        Example:
            # Get user
            user = user_repo.get(db, user_id)
            
            # Update user
            updated_user = user_repo.update(
                db,
                db_obj=user,
                obj_in={"full_name": "Updated Name"}
            )
            
        Notes:
            - Only updates provided fields (partial update)
            - Automatically commits transaction
            - Rolls back on error
            - Refreshes instance after update
            - db_obj must be an instance from the current session
        """
        try:
            logger.debug(
                f"Updating {self.model.__name__} with id: {db_obj.id}"
            )
            
            # Convert to dictionary if needed
            if isinstance(obj_in, dict):
                update_data = obj_in
            else:
                # Get dict from model, excluding unset fields
                update_data = obj_in.dict(exclude_unset=True)
            
            # Update fields
            for field, value in update_data.items():
                if hasattr(db_obj, field):
                    setattr(db_obj, field, value)
                else:
                    logger.warning(
                        f"Field {field} not found in {self.model.__name__}, "
                        f"skipping"
                    )
            
            # Add to session (in case it was detached)
            db.add(db_obj)
            
            # Commit transaction
            db.commit()
            
            # Refresh to get updated values
            db.refresh(db_obj)
            
            logger.info(
                f"Updated {self.model.__name__} with id: {db_obj.id}"
            )
            
            return db_obj
            
        except SQLAlchemyError as e:
            logger.error(
                f"Error updating {self.model.__name__} with id {db_obj.id}: {str(e)}"
            )
            db.rollback()
            raise
    
    def update_by_id(
        self,
        db: Session,
        *,
        id: UUID,
        obj_in: Union[Dict[str, Any], ModelType]
    ) -> Optional[ModelType]:
        """
        Update a record by ID (convenience method).
        
        Args:
            db: Database session
            id: Primary key of record to update
            obj_in: Dictionary of fields to update
            
        Returns:
            ModelType: Updated instance or None if not found
            
        Example:
            updated_user = user_repo.update_by_id(
                db,
                id=user_id,
                obj_in={"status": "INACTIVE"}
            )
            
        Notes:
            - Combines get() and update() operations
            - Returns None if record doesn't exist
            - More convenient than separate get/update calls
        """
        db_obj = self.get(db, id)
        if not db_obj:
            logger.warning(
                f"Cannot update: {self.model.__name__} with id {id} not found"
            )
            return None
        
        return self.update(db, db_obj=db_obj, obj_in=obj_in)
    
    # ========================================================================
    # DELETE Operations
    # ========================================================================
    
    def delete(self, db: Session, *, id: UUID) -> bool:
        """
        Delete a record by ID (hard delete).
        
        Args:
            db: Database session
            id: Primary key of record to delete
            
        Returns:
            bool: True if record was deleted, False if not found
            
        Example:
            if user_repo.delete(db, user_id):
                print("User deleted")
            else:
                print("User not found")
                
        Notes:
            - Performs hard delete (removes from database)
            - Use soft delete for audit trail requirements
            - Automatically commits transaction
            - Cascade deletes handled by database constraints
        """
        try:
            logger.debug(f"Deleting {self.model.__name__} with id: {id}")
            
            # Get the record
            db_obj = self.get(db, id)
            if not db_obj:
                logger.warning(
                    f"Cannot delete: {self.model.__name__} with id {id} not found"
                )
                return False
            
            # Delete from session
            db.delete(db_obj)
            
            # Commit transaction
            db.commit()
            
            logger.info(f"Deleted {self.model.__name__} with id: {id}")
            return True
            
        except SQLAlchemyError as e:
            logger.error(
                f"Error deleting {self.model.__name__} with id {id}: {str(e)}"
            )
            db.rollback()
            raise
    
    def delete_multi(
        self,
        db: Session,
        *,
        ids: List[UUID]
    ) -> int:
        """
        Delete multiple records by ID.
        
        Args:
            db: Database session
            ids: List of primary keys to delete
            
        Returns:
            int: Number of records deleted
            
        Example:
            deleted_count = user_repo.delete_multi(
                db,
                ids=[user_id1, user_id2, user_id3]
            )
            print(f"Deleted {deleted_count} users")
            
        Notes:
            - All deletes in single transaction (atomic)
            - Returns count of actually deleted records
            - Non-existent IDs are silently skipped
        """
        try:
            logger.debug(
                f"Deleting {len(ids)} {self.model.__name__} records"
            )
            
            # Delete matching records
            deleted_count = db.query(self.model).filter(
                self.model.id.in_(ids)
            ).delete(synchronize_session=False)
            
            # Commit transaction
            db.commit()
            
            logger.info(
                f"Deleted {deleted_count} {self.model.__name__} records"
            )
            
            return deleted_count
            
        except SQLAlchemyError as e:
            logger.error(
                f"Error deleting multiple {self.model.__name__} records: {str(e)}"
            )
            db.rollback()
            raise
    
    # ========================================================================
    # Utility Methods
    # ========================================================================
    
    def refresh(self, db: Session, db_obj: ModelType) -> ModelType:
        """
        Refresh a model instance from the database.
        
        Args:
            db: Database session
            db_obj: Model instance to refresh
            
        Returns:
            ModelType: Refreshed instance
            
        Example:
            # After external changes
            user = user_repo.refresh(db, user)
            
        Notes:
            - Reloads all attributes from database
            - Useful after concurrent modifications
            - Discards any uncommitted changes
        """
        db.refresh(db_obj)
        return db_obj
    
    def commit(self, db: Session) -> None:
        """
        Explicitly commit current transaction.
        
        Args:
            db: Database session
            
        Example:
            user_repo.create(db, obj_in=user_data)
            user_repo.commit(db)
            
        Notes:
            - Usually not needed (CRUD methods commit automatically)
            - Use for complex multi-operation transactions
        """
        try:
            db.commit()
            logger.debug(f"Committed transaction for {self.model.__name__}")
        except SQLAlchemyError as e:
            logger.error(f"Error committing transaction: {str(e)}")
            db.rollback()
            raise
    
    def rollback(self, db: Session) -> None:
        """
        Explicitly rollback current transaction.
        
        Args:
            db: Database session
            
        Example:
            try:
                # Multiple operations
                user_repo.create(db, obj_in=user1)
                user_repo.create(db, obj_in=user2)
                user_repo.commit(db)
            except Exception:
                user_repo.rollback(db)
                raise
                
        Notes:
            - Discards all uncommitted changes
            - Automatically called on errors in CRUD methods
        """
        db.rollback()
        logger.debug(f"Rolled back transaction for {self.model.__name__}")


# ============================================================================
# Module Initialization
# ============================================================================

logger.info("Base repository module initialized")