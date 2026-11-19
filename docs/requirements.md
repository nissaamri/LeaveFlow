# LeaveFlow — System Requirements

**Project:** Employee Leave & Workforce Management System  
**Version:** 1.0  
**Status:** Initial Planning  
**Document Type:** Software Requirements Specification (SRS)

## 1. Purpose

LeaveFlow aims to replace manual employee leave management processes with a centralised digital system.

In many organisations, leave applications may be handled through emails, spreadsheets, or paper forms. These methods can make it difficult to track leave balances, monitor approval status, and maintain accurate records.

LeaveFlow will provide a platform where employees can submit leave applications, managers can review requests, and HR administrators can manage leave records and policies.

The main goal is to make leave management more organised, transparent, accurate, and efficient.

## 2. Project Scope

### 2.1 In Scope

The LeaveFlow system will include:

1. Employee account registration and login.
2. Role-based access for Employees, Managers, and HR Administrators.
3. Employee leave applications.
4. Leave balance tracking and calculation.
5. Manager leave approval and rejection.
6. HR employee and leave policy management.
7. Leave schedule and calendar views.
8. Leave overlap detection.
9. Email or in-app notifications.
10. Audit logs for important system activities.
11. Public holiday integration.
12. Reporting and leave analytics.

### 2.2 Out of Scope

The initial version will not include:

1. Payroll processing.
2. Employee salary management.
3. Recruitment and applicant tracking.
4. Employee performance evaluation.
5. Biometric attendance tracking.
6. Full employee onboarding management.

## 3. User Roles and Responsibilities

### 3.1 Employee

Employees are the staff members who use the system to manage their own leave.

Responsibilities:
- Log in to their account.
- View available leave balances.
- Submit leave applications.
- View application status.
- Cancel eligible leave applications.
- View personal leave history.
- View team leave calendar where permitted.

### 3.2 Manager

Managers are responsible for reviewing leave applications submitted by their team members.

Responsibilities:
- Log in to their account.
- View pending leave applications.
- Review employee leave details.
- Approve or reject leave applications.
- Provide rejection reasons.
- View team leave schedules.
- Monitor team availability.

### 3.3 HR Administrator

HR Administrators manage employee information and organisation-wide leave settings.

Responsibilities:
- Log in to their account.
- Create and manage employee records.
- Assign employee roles and managers.
- Configure leave types and policies.
- Manage leave entitlements.
- View organisation-wide leave records.
- Review audit logs.
- Generate leave reports.

## 4. Functional Requirements

### 4.1 Authentication and Access Control

| ID | Requirement |
|---|---|
| FR-001 | The system shall allow registered users to log in securely. |
| FR-002 | The system shall identify users based on their assigned roles. |
| FR-003 | The system shall restrict access according to user permissions. |
| FR-004 | The system shall allow users to log out. |

### 4.2 Employee Functions

| ID | Requirement |
|---|---|
| FR-005 | Employees shall be able to view their leave balances. |
| FR-006 | Employees shall be able to submit leave applications. |
| FR-007 | Employees shall be able to view their application status. |
| FR-008 | Employees shall be able to view their leave history. |
| FR-009 | Employees shall be able to cancel eligible pending applications. |

### 4.3 Manager Functions

| ID | Requirement |
|---|---|
| FR-010 | Managers shall be able to view leave applications assigned to them. |
| FR-011 | Managers shall be able to approve leave applications. |
| FR-012 | Managers shall be able to reject leave applications with a reason. |
| FR-013 | Managers shall be able to view team leave schedules. |

### 4.4 HR Administrator Functions

| ID | Requirement |
|---|---|
| FR-014 | HR shall be able to create and update employee records. |
| FR-015 | HR shall be able to assign managers to employees. |
| FR-016 | HR shall be able to create and manage leave types. |
| FR-017 | HR shall be able to configure leave entitlements. |
| FR-018 | HR shall be able to view organisation-wide leave records. |
| FR-019 | HR shall be able to access system audit logs. |

### 4.5 System Functions

| ID | Requirement |
|---|---|
| FR-020 | The system shall calculate leave duration based on applicable working days. |
| FR-021 | The system shall check leave balances before processing applications. |
| FR-022 | The system shall detect overlapping leave applications. |
| FR-023 | The system shall prevent unauthorised approval actions. |
| FR-024 | The system shall record important approval activities. |
| FR-025 | The system shall provide leave calendar views. |
| FR-026 | The system shall generate leave reports. |

## 5. Non-Functional Requirements

### 5.1 Security

| ID | Requirement |
|---|---|
| NFR-001 | User passwords shall be securely hashed before storage. |
| NFR-002 | The system shall enforce role-based access control. |
| NFR-003 | Sensitive configuration and credentials shall not be stored in source code. |
| NFR-004 | The system shall validate user input to reduce security risks. |

### 5.2 Performance

| ID | Requirement |
|---|---|
| NFR-005 | Normal application pages should load within 3 seconds under the defined test environment. |
| NFR-006 | The system should support at least 50 concurrent test users in a controlled performance test. |

### 5.3 Reliability and Data Integrity

| ID | Requirement |
|---|---|
| NFR-007 | The system shall prevent invalid leave balance updates. |
| NFR-008 | Approval and rejection actions shall be recorded consistently. |
| NFR-009 | The system shall handle invalid requests without crashing. |

### 5.4 Usability

| ID | Requirement |
|---|---|
| NFR-010 | The interface shall provide clear navigation for all three user roles. |
| NFR-011 | The system shall display understandable validation and error messages. |
| NFR-012 | The system shall be usable on desktop and tablet screen sizes. |

### 5.5 Maintainability

| ID | Requirement |
|---|---|
| NFR-013 | The application shall use a structured and modular codebase. |
| NFR-014 | The backend shall expose documented REST API endpoints. |
| NFR-015 | Important business rules shall have automated tests. |

## 6. Business Rules

### BR-001: Leave Balance
Employees shall not be allowed to submit annual leave applications that exceed their available leave balance.

### BR-002: Working Days
Leave duration shall be calculated using the organisation's configured working days.

### BR-003: Weekends
Weekends shall not be counted as leave days when they are configured as non-working days.

### BR-004: Public Holidays
Public holidays shall not be counted as leave days when they fall within an employee's leave period and are configured as non-working days.

### BR-005: Leave Approval
Leave applications must be approved by an authorised manager before they become approved leave.

### BR-006: Approval Separation
Employees shall not be allowed to approve their own leave applications.

### BR-007: Overlapping Leave
The system shall detect overlapping leave applications for the same employee.

### BR-008: Rejection Reason
Managers must provide a reason when rejecting a leave application.

### BR-009: Leave Balance Deduction
Leave balance shall only be deducted after the application reaches the approved status.

### BR-010: Cancellation
Employees may cancel eligible pending applications. Approved leave cancellation shall follow the organisation's configured cancellation process.

### BR-011: Audit Trail
Important actions, including submission, approval, rejection, and cancellation, shall be recorded in the audit log.

### BR-012: Leave Types
Leave entitlements and rules shall depend on the leave type configured by HR.

## 7. Project Success Criteria

The project will be evaluated using the following measurable targets:

| Metric | Target | Measurement Method |
|---|---|---|
| Leave calculation accuracy | 100% | Compare results against predefined test cases. |
| Approval integrity | 0 duplicate approvals | Test repeated approval requests. |
| Role-based access control | 100% of defined unauthorised-access tests blocked | Execute permission test cases. |
| Leave overlap detection | 100% of predefined overlap test cases detected | Test overlapping date ranges. |
| API response time | Below 3 seconds for normal requests | Measure API response times under defined test conditions. |
| Automated test coverage | At least 80% of backend code | Generate a code coverage report. |

### Qualitative Success Criteria

The system should:

- Make leave applications easier to submit.
- Improve visibility of employee leave balances.
- Help managers monitor team availability.
- Reduce confusion about application status.
- Provide HR with centralised leave records.
- Improve accountability through audit logs.

### Before-and-After Evaluation

A controlled comparison will be conducted between a simulated manual leave management process and the LeaveFlow application.

The comparison will consider:

1. Time required to submit a leave request.
2. Time required to review a leave request.
3. Accuracy of leave balance calculations.
4. Ability to identify overlapping leave requests.
5. Visibility of leave application status.

Actual results will be recorded during testing. No performance improvements will be claimed without supporting evidence.

## 8. Assumptions and Constraints

### 8.1 Assumptions

1. Each employee has one assigned manager.
2. Employees have an active account before submitting leave applications.
3. HR administrators are responsible for configuring leave policies.
4. The organisation has a defined working-day calendar.
5. Public holiday information will come from a reliable external source or HR configuration.
6. Employees must provide a valid reason when submitting leave applications.
7. Managers can only review applications assigned to them.

### 8.2 Constraints

1. The initial application will be designed primarily for desktop and tablet use.
2. The system will use React, TypeScript, Python, FastAPI, and PostgreSQL.
3. Internet connectivity is required to access the web application.
4. The initial version will focus on leave management rather than payroll or attendance management.
5. The project will be developed and tested within a controlled portfolio environment.

### 8.3 Items Requiring Further Design

1. Detailed leave entitlement calculation rules.
2. Whether multiple approval levels are required.
3. Rules for half-day leave.
4. Rules for cancelling approved leave.
5. Handling employees with different working schedules.
6. Handling public holidays across different locations.