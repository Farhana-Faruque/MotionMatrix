"""
Enumeration types for type safety and consistency.

This module defines all enumeration types used throughout the application.
Enums provide type safety, prevent invalid values, and serve as a single
source of truth for allowed values.

Benefits:
- Type safety at compile time
- Auto-completion in IDEs
- Prevent typos and invalid values
- Self-documenting code
- Easy to extend and maintain

Example:
    from app.utils.enums import UserRole, UserStatus
    
    # Type-safe assignment
    user.role = UserRole.ADMIN
    user.status = UserStatus.ACTIVE
    
    # Comparison
    if user.role == UserRole.ADMIN:
        print("User is admin")
    
    # Get string value
    print(user.role.value)  # "ADMIN"
    
    # Get description
    print(user.role.description)  # "System administrator with full access"
"""

from enum import Enum
from typing import List


# ============================================================================
# Base Enum with Description
# ============================================================================

class DescriptiveEnum(str, Enum):
    """
    Base enum class that supports descriptions.
    
    This class extends both str and Enum to provide:
    - String comparison capabilities
    - JSON serialization support
    - Description property for each enum value
    
    All application enums should inherit from this class.
    """
    
    def __new__(cls, value: str, description: str = ""):
        """
        Create a new enum member with value and description.
        
        Args:
            value: The enum value (e.g., "ADMIN")
            description: Human-readable description
        """
        obj = str.__new__(cls, value)
        obj._value_ = value
        obj._description = description
        return obj
    
    @property
    def description(self) -> str:
        """
        Get the human-readable description of this enum value.
        
        Returns:
            str: Description of the enum value
            
        Example:
            >>> UserRole.ADMIN.description
            "System administrator with full access"
        """
        return self._description
    
    @classmethod
    def values(cls) -> List[str]:
        """
        Get list of all enum values.
        
        Returns:
            List[str]: All possible enum values
            
        Example:
            >>> UserRole.values()
            ["ADMIN", "OWNER", "MANAGER", "FLOOR_MANAGER", "WORKER"]
        """
        return [member.value for member in cls]
    
    @classmethod
    def choices(cls) -> List[tuple]:
        """
        Get list of (value, description) tuples for forms/dropdowns.
        
        Returns:
            List[tuple]: List of (value, description) tuples
            
        Example:
            >>> UserRole.choices()
            [
                ("ADMIN", "System administrator with full access"),
                ("OWNER", "Business owner with complete control"),
                ...
            ]
        """
        return [(member.value, member.description) for member in cls]
    
    @classmethod
    def has_value(cls, value: str) -> bool:
        """
        Check if a value exists in this enum.
        
        Args:
            value: Value to check
            
        Returns:
            bool: True if value exists, False otherwise
            
        Example:
            >>> UserRole.has_value("ADMIN")
            True
            >>> UserRole.has_value("INVALID")
            False
        """
        return value in cls._value2member_map_
    
    def __str__(self) -> str:
        """String representation returns the value."""
        return self.value


# ============================================================================
# User Role Enum
# ============================================================================

class UserRole(DescriptiveEnum):
    """
    User role enumeration defining permission levels.
    
    Roles are hierarchical with the following access levels:
    ADMIN > OWNER > MANAGER > FLOOR_MANAGER > WORKER
    
    Each role has specific permissions and responsibilities in the system.
    
    Usage:
        user.role = UserRole.ADMIN
        if user.role == UserRole.ADMIN:
            allow_full_access()
    """
    
    ADMIN = (
        "ADMIN",
        "System administrator with full access to all features and settings"
    )
    
    OWNER = (
        "OWNER",
        "Business owner with complete control over organization and employees"
    )
    
    MANAGER = (
        "MANAGER",
        "Department manager with access to team management and reporting"
    )
    
    FLOOR_MANAGER = (
        "FLOOR_MANAGER",
        "Floor manager responsible for daily operations and attendance"
    )
    
    WORKER = (
        "WORKER",
        "Regular employee with access to personal attendance and leave requests"
    )
    
    @classmethod
    def get_hierarchical_roles(cls, role: 'UserRole') -> List['UserRole']:
        """
        Get all roles at or below the given role in hierarchy.
        
        Args:
            role: The role to get hierarchy for
            
        Returns:
            List[UserRole]: Roles at or below the given role
            
        Example:
            >>> UserRole.get_hierarchical_roles(UserRole.MANAGER)
            [UserRole.MANAGER, UserRole.FLOOR_MANAGER, UserRole.WORKER]
        """
        hierarchy = {
            cls.ADMIN: [cls.ADMIN, cls.OWNER, cls.MANAGER, cls.FLOOR_MANAGER, cls.WORKER],
            cls.OWNER: [cls.OWNER, cls.MANAGER, cls.FLOOR_MANAGER, cls.WORKER],
            cls.MANAGER: [cls.MANAGER, cls.FLOOR_MANAGER, cls.WORKER],
            cls.FLOOR_MANAGER: [cls.FLOOR_MANAGER, cls.WORKER],
            cls.WORKER: [cls.WORKER],
        }
        return hierarchy.get(role, [])
    
    @classmethod
    def can_manage(cls, manager_role: 'UserRole', target_role: 'UserRole') -> bool:
        """
        Check if a manager role can manage a target role.
        
        Args:
            manager_role: Role of the manager
            target_role: Role being managed
            
        Returns:
            bool: True if manager can manage target
            
        Example:
            >>> UserRole.can_manage(UserRole.MANAGER, UserRole.WORKER)
            True
            >>> UserRole.can_manage(UserRole.WORKER, UserRole.MANAGER)
            False
        """
        manageable_roles = cls.get_hierarchical_roles(manager_role)
        return target_role in manageable_roles and manager_role != target_role


# ============================================================================
# User Status Enum
# ============================================================================

class UserStatus(DescriptiveEnum):
    """
    User account status enumeration.
    
    Tracks the current state of a user account for access control
    and security purposes.
    
    Status Flow:
    PENDING_PASSWORD_CHANGE -> ACTIVE -> INACTIVE
    
    Usage:
        user.status = UserStatus.ACTIVE
        if user.status == UserStatus.INACTIVE:
            deny_access()
    """
    
    ACTIVE = (
        "ACTIVE",
        "Active user with full system access"
    )
    
    INACTIVE = (
        "INACTIVE",
        "Inactive user account with no system access"
    )
    
    PENDING_PASSWORD_CHANGE = (
        "PENDING_PASSWORD_CHANGE",
        "User must change password before accessing the system"
    )
    
    SUSPENDED = (
        "SUSPENDED",
        "Temporarily suspended account pending investigation"
    )
    
    LOCKED = (
        "LOCKED",
        "Account locked due to security concerns or multiple failed login attempts"
    )
    
    @classmethod
    def active_statuses(cls) -> List['UserStatus']:
        """
        Get list of statuses that allow system access.
        
        Returns:
            List[UserStatus]: Statuses that allow login
        """
        return [cls.ACTIVE, cls.PENDING_PASSWORD_CHANGE]
    
    @classmethod
    def is_active(cls, status: 'UserStatus') -> bool:
        """
        Check if a status allows system access.
        
        Args:
            status: Status to check
            
        Returns:
            bool: True if status allows access
        """
        return status in cls.active_statuses()


# ============================================================================
# Leave Status Enum
# ============================================================================

class LeaveStatus(DescriptiveEnum):
    """
    Leave request status enumeration.
    
    Tracks the approval status of employee leave requests.
    
    Status Flow:
    PENDING -> APPROVED or REJECTED -> CANCELLED (optional)
    
    Usage:
        leave.status = LeaveStatus.PENDING
        if leave.status == LeaveStatus.APPROVED:
            grant_leave()
    """
    
    PENDING = (
        "PENDING",
        "Leave request awaiting manager approval"
    )
    
    APPROVED = (
        "APPROVED",
        "Leave request has been approved by manager"
    )
    
    REJECTED = (
        "REJECTED",
        "Leave request has been rejected by manager"
    )
    
    CANCELLED = (
        "CANCELLED",
        "Leave request cancelled by employee"
    )
    
    @classmethod
    def final_statuses(cls) -> List['LeaveStatus']:
        """
        Get list of final statuses (no further changes allowed).
        
        Returns:
            List[LeaveStatus]: Statuses that are final
        """
        return [cls.APPROVED, cls.REJECTED, cls.CANCELLED]
    
    @classmethod
    def is_final(cls, status: 'LeaveStatus') -> bool:
        """
        Check if a status is final (no changes allowed).
        
        Args:
            status: Status to check
            
        Returns:
            bool: True if status is final
        """
        return status in cls.final_statuses()
    
    @classmethod
    def can_transition_to(cls, from_status: 'LeaveStatus', to_status: 'LeaveStatus') -> bool:
        """
        Check if status transition is valid.
        
        Args:
            from_status: Current status
            to_status: Target status
            
        Returns:
            bool: True if transition is valid
            
        Example:
            >>> LeaveStatus.can_transition_to(LeaveStatus.PENDING, LeaveStatus.APPROVED)
            True
            >>> LeaveStatus.can_transition_to(LeaveStatus.APPROVED, LeaveStatus.PENDING)
            False
        """
        valid_transitions = {
            cls.PENDING: [cls.APPROVED, cls.REJECTED, cls.CANCELLED],
            cls.APPROVED: [cls.CANCELLED],
            cls.REJECTED: [],
            cls.CANCELLED: [],
        }
        return to_status in valid_transitions.get(from_status, [])


# ============================================================================
# Notification Type Enum
# ============================================================================

class NotificationType(DescriptiveEnum):
    """
    Notification type enumeration for system notifications.
    
    Defines different types of notifications sent to users.
    Each type may have different priority and handling.
    
    Usage:
        notification.type = NotificationType.IDLENESS_ALERT
        if notification.type == NotificationType.IDLENESS_ALERT:
            send_urgent_notification()
    """
    
    IDLENESS_ALERT = (
        "IDLENESS_ALERT",
        "Alert for employee idleness or inactivity during work hours"
    )
    
    LEAVE_REQUEST = (
        "LEAVE_REQUEST",
        "Notification about new leave request requiring approval"
    )
    
    LEAVE_APPROVED = (
        "LEAVE_APPROVED",
        "Notification that leave request has been approved"
    )
    
    LEAVE_REJECTED = (
        "LEAVE_REJECTED",
        "Notification that leave request has been rejected"
    )
    
    GENERAL = (
        "GENERAL",
        "General system notification or announcement"
    )
    
    ATTENDANCE_REMINDER = (
        "ATTENDANCE_REMINDER",
        "Reminder to clock in or clock out"
    )
    
    SALARY_PROCESSED = (
        "SALARY_PROCESSED",
        "Notification that salary has been processed"
    )
    
    SYSTEM_ALERT = (
        "SYSTEM_ALERT",
        "Important system-level alert or announcement"
    )
    
    @classmethod
    def urgent_types(cls) -> List['NotificationType']:
        """
        Get list of notification types that are urgent.
        
        Returns:
            List[NotificationType]: Urgent notification types
        """
        return [cls.IDLENESS_ALERT, cls.SYSTEM_ALERT]
    
    @classmethod
    def is_urgent(cls, notification_type: 'NotificationType') -> bool:
        """
        Check if a notification type is urgent.
        
        Args:
            notification_type: Type to check
            
        Returns:
            bool: True if notification is urgent
        """
        return notification_type in cls.urgent_types()


# ============================================================================
# Leave Type Enum
# ============================================================================

class LeaveType(DescriptiveEnum):
    """
    Leave type enumeration for different types of leave.
    
    Defines various types of leave that employees can request.
    Each type may have different policies and approval requirements.
    
    Usage:
        leave.type = LeaveType.SICK_LEAVE
        if leave.type == LeaveType.ANNUAL_LEAVE:
            check_annual_leave_balance()
    """
    
    ANNUAL_LEAVE = (
        "ANNUAL_LEAVE",
        "Annual vacation leave with full pay"
    )
    
    SICK_LEAVE = (
        "SICK_LEAVE",
        "Sick leave for health-related absences"
    )
    
    CASUAL_LEAVE = (
        "CASUAL_LEAVE",
        "Casual leave for personal matters"
    )
    
    EMERGENCY_LEAVE = (
        "EMERGENCY_LEAVE",
        "Emergency leave for urgent situations"
    )
    
    MATERNITY_LEAVE = (
        "MATERNITY_LEAVE",
        "Maternity leave for childbirth"
    )
    
    PATERNITY_LEAVE = (
        "PATERNITY_LEAVE",
        "Paternity leave for new fathers"
    )
    
    UNPAID_LEAVE = (
        "UNPAID_LEAVE",
        "Unpaid leave without salary"
    )
    
    COMPENSATORY_LEAVE = (
        "COMPENSATORY_LEAVE",
        "Compensatory leave for overtime work"
    )
    
    @classmethod
    def paid_leave_types(cls) -> List['LeaveType']:
        """
        Get list of leave types that are paid.
        
        Returns:
            List[LeaveType]: Paid leave types
        """
        return [
            cls.ANNUAL_LEAVE,
            cls.SICK_LEAVE,
            cls.CASUAL_LEAVE,
            cls.EMERGENCY_LEAVE,
            cls.MATERNITY_LEAVE,
            cls.PATERNITY_LEAVE,
            cls.COMPENSATORY_LEAVE,
        ]
    
    @classmethod
    def is_paid(cls, leave_type: 'LeaveType') -> bool:
        """
        Check if a leave type is paid.
        
        Args:
            leave_type: Type to check
            
        Returns:
            bool: True if leave is paid
        """
        return leave_type in cls.paid_leave_types()


# ============================================================================
# Attendance Status Enum
# ============================================================================

class AttendanceStatus(DescriptiveEnum):
    """
    Attendance status enumeration for daily attendance records.
    
    Tracks the attendance status of employees for each day.
    
    Usage:
        attendance.status = AttendanceStatus.PRESENT
        if attendance.status == AttendanceStatus.ABSENT:
            mark_absent()
    """
    
    PRESENT = (
        "PRESENT",
        "Employee is present and has clocked in"
    )
    
    ABSENT = (
        "ABSENT",
        "Employee is absent without leave"
    )
    
    ON_LEAVE = (
        "ON_LEAVE",
        "Employee is on approved leave"
    )
    
    HALF_DAY = (
        "HALF_DAY",
        "Employee worked half day"
    )
    
    LATE = (
        "LATE",
        "Employee arrived late"
    )
    
    EARLY_DEPARTURE = (
        "EARLY_DEPARTURE",
        "Employee left early"
    )
    
    WEEKEND = (
        "WEEKEND",
        "Weekend day (no attendance required)"
    )
    
    HOLIDAY = (
        "HOLIDAY",
        "Public holiday (no attendance required)"
    )
    
    @classmethod
    def working_statuses(cls) -> List['AttendanceStatus']:
        """
        Get list of statuses that count as working.
        
        Returns:
            List[AttendanceStatus]: Statuses that count as work
        """
        return [
            cls.PRESENT,
            cls.HALF_DAY,
            cls.LATE,
            cls.EARLY_DEPARTURE,
        ]
    
    @classmethod
    def is_working(cls, status: 'AttendanceStatus') -> bool:
        """
        Check if status counts as working.
        
        Args:
            status: Status to check
            
        Returns:
            bool: True if status counts as work
        """
        return status in cls.working_statuses()


# ============================================================================
# Salary Component Type Enum
# ============================================================================

class SalaryComponentType(DescriptiveEnum):
    """
    Salary component type enumeration.
    
    Defines different components that make up an employee's salary.
    
    Usage:
        component.type = SalaryComponentType.BASIC_SALARY
        if component.type == SalaryComponentType.DEDUCTION:
            subtract_from_total()
    """
    
    BASIC_SALARY = (
        "BASIC_SALARY",
        "Base salary amount"
    )
    
    ALLOWANCE = (
        "ALLOWANCE",
        "Additional allowance (housing, transport, etc.)"
    )
    
    BONUS = (
        "BONUS",
        "Performance or seasonal bonus"
    )
    
    OVERTIME = (
        "OVERTIME",
        "Overtime payment"
    )
    
    COMMISSION = (
        "COMMISSION",
        "Sales or performance commission"
    )
    
    DEDUCTION = (
        "DEDUCTION",
        "Deduction from salary (tax, insurance, etc.)"
    )
    
    @classmethod
    def addition_types(cls) -> List['SalaryComponentType']:
        """
        Get list of component types that add to salary.
        
        Returns:
            List[SalaryComponentType]: Addition component types
        """
        return [
            cls.BASIC_SALARY,
            cls.ALLOWANCE,
            cls.BONUS,
            cls.OVERTIME,
            cls.COMMISSION,
        ]
    
    @classmethod
    def is_addition(cls, component_type: 'SalaryComponentType') -> bool:
        """
        Check if component adds to salary.
        
        Args:
            component_type: Type to check
            
        Returns:
            bool: True if component adds to salary
        """
        return component_type in cls.addition_types()


# ============================================================================
# Report Type Enum
# ============================================================================

class ReportType(DescriptiveEnum):
    """
    Report type enumeration for different report categories.
    
    Defines various types of reports that can be generated.
    
    Usage:
        report.type = ReportType.ATTENDANCE_REPORT
        if report.type == ReportType.SALARY_REPORT:
            include_salary_details()
    """
    
    ATTENDANCE_REPORT = (
        "ATTENDANCE_REPORT",
        "Daily, weekly, or monthly attendance report"
    )
    
    SALARY_REPORT = (
        "SALARY_REPORT",
        "Employee salary and payroll report"
    )
    
    LEAVE_REPORT = (
        "LEAVE_REPORT",
        "Leave balance and history report"
    )
    
    PERFORMANCE_REPORT = (
        "PERFORMANCE_REPORT",
        "Employee performance and productivity report"
    )
    
    IDLENESS_REPORT = (
        "IDLENESS_REPORT",
        "Employee idleness and activity report"
    )
    
    DEPARTMENT_REPORT = (
        "DEPARTMENT_REPORT",
        "Department-wise analytics and statistics"
    )


# ============================================================================
# Activity Status Enum
# ============================================================================

class ActivityStatus(DescriptiveEnum):
    """
    Employee activity status enumeration for real-time monitoring.
    
    Tracks the current activity status of employees during work hours.
    
    Usage:
        activity.status = ActivityStatus.ACTIVE
        if activity.status == ActivityStatus.IDLE:
            send_idleness_alert()
    """
    
    ACTIVE = (
        "ACTIVE",
        "Employee is actively working"
    )
    
    IDLE = (
        "IDLE",
        "Employee is idle (no activity detected)"
    )
    
    BREAK = (
        "BREAK",
        "Employee is on scheduled break"
    )
    
    AWAY = (
        "AWAY",
        "Employee is temporarily away from workstation"
    )
    
    OFFLINE = (
        "OFFLINE",
        "Employee is not logged in or offline"
    )


# ============================================================================
# Gender Enum
# ============================================================================

class Gender(DescriptiveEnum):
    """
    Gender enumeration for employee records.
    
    Usage:
        user.gender = Gender.MALE
    """
    
    MALE = ("MALE", "Male")
    FEMALE = ("FEMALE", "Female")
    OTHER = ("OTHER", "Other")
    PREFER_NOT_TO_SAY = ("PREFER_NOT_TO_SAY", "Prefer not to say")


# ============================================================================
# Payment Method Enum
# ============================================================================

class PaymentMethod(DescriptiveEnum):
    """
    Payment method enumeration for salary disbursement.
    
    Usage:
        salary.payment_method = PaymentMethod.BANK_TRANSFER
    """
    
    BANK_TRANSFER = (
        "BANK_TRANSFER",
        "Direct bank transfer"
    )
    
    CASH = (
        "CASH",
        "Cash payment"
    )
    
    CHEQUE = (
        "CHEQUE",
        "Payment by cheque"
    )
    
    MOBILE_WALLET = (
        "MOBILE_WALLET",
        "Mobile wallet payment"
    )


# ============================================================================
# Module Level Utilities
# ============================================================================

def get_all_enums() -> dict:
    """
    Get dictionary of all enum classes in this module.
    
    Returns:
        dict: Dictionary mapping enum names to enum classes
        
    Example:
        >>> enums = get_all_enums()
        >>> print(enums.keys())
        dict_keys(['UserRole', 'UserStatus', 'LeaveStatus', ...])
    """
    import sys
    import inspect
    
    current_module = sys.modules[__name__]
    enums = {}
    
    for name, obj in inspect.getmembers(current_module):
        if (inspect.isclass(obj) and 
            issubclass(obj, DescriptiveEnum) and 
            obj != DescriptiveEnum):
            enums[name] = obj
    
    return enums


def validate_enum_value(enum_class: type, value: str) -> bool:
    """
    Validate if a value is valid for an enum class.
    
    Args:
        enum_class: The enum class to validate against
        value: The value to validate
        
    Returns:
        bool: True if value is valid for the enum
        
    Example:
        >>> validate_enum_value(UserRole, "ADMIN")
        True
        >>> validate_enum_value(UserRole, "INVALID")
        False
    """
    try:
        return enum_class.has_value(value)
    except:
        return False

#APICHECKPOINT

class APIEndpoint(str, Enum):
    REGISTER_USER = "register_user"
    DELETE_USER = "delete_user"
    UPDATE_USER = "update_user"
    VIEW_USERS = "view_users"
    CREATE_POST = "create_post"
    DELETE_POST = "delete_post"


# ============================================================================
# Module Initialization
# ============================================================================

# Log available enums on import
import logging
logger = logging.getLogger(__name__)

_enum_count = len(get_all_enums())
logger.info(f"Enums module initialized with {_enum_count} enum types")