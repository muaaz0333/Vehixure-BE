# ERPS Partner Portal - Complete Roles and Access Documentation

## Document Purpose

This document provides the definitive reference for all user roles, permissions, and access controls in the ERPS Partner Portal system. It serves as the authoritative guide for:

- **Developers**: Implementing authentication, authorization, and access control
- **System Administrators**: Managing users, roles, and permissions
- **Business Stakeholders**: Understanding system capabilities and limitations
- **Support Teams**: Troubleshooting access issues and user management

---

## System Overview

The ERPS Partner Portal is a role-based system that manages:
- **Warranty Registrations** - Initial ERPS installation documentation
- **Annual Inspections** - Yearly compliance verification
- **Partner Account Management** - Store/business administration
- **Verification Workflows** - SMS-based work confirmation
- **Compliance Enforcement** - Automated reminders and grace periods

### Core Security Principles

1. **Role-Based Access Control (RBAC)** - All permissions are role-based
2. **Partner Account Isolation** - Users can only access their own partner data
3. **SMS-Only Verification** - Critical verifications happen outside the portal
4. **Audit Trail** - All actions are logged and traceable
5. **Principle of Least Privilege** - Users have minimum necessary permissions

---

## User Roles and Hierarchy

```
ERPS System
├── ERPS_ADMIN (Internal ERPS Staff)
│   └── Full system access and governance
│
└── PARTNER_USER (Store/Business Users)
    ├── ACCOUNT_ADMIN (Business Owner/Manager)
    ├── ACCOUNT_STAFF (Data Entry/Administrative)
    └── ACCOUNT_INSTALLER (Field Technician/Installer)
```

---

## Role Definitions and Access Matrix

### 1. ERPS_ADMIN (Internal ERPS Users)

**Purpose**: Platform governance, oversight, and partner management

#### Core Responsibilities
- Setup and manage ERPS Partner Accounts
- Ensure platform integrity and compliance
- Provide technical support and dispute resolution
- Maintain installer/inspector accreditation standards

#### Full Access Permissions

| **Category** | **Permissions** | **Details** |
|--------------|-----------------|-------------|
| **Partner Management** | ✅ Create, Edit, Suspend, Delete | Full CRUD operations on partner accounts |
| **User Management** | ✅ Create, Edit, Block, Delete | Manage all users across all partner accounts |
| **Data Access** | ✅ View All Data | Access warranties, inspections, photos across all partners |
| **Verification Override** | ✅ Manual Verification | Can verify installations/inspections through dashboard |
| **Warranty Control** | ✅ Activate, Extend, Cancel | Manual warranty lifecycle management |
| **System Administration** | ✅ Settings, Configuration | Manage system settings and business rules |
| **Audit Access** | ✅ Full Audit Trail | View all system logs and user activities |
| **Support Functions** | ✅ Login As Any User | Impersonate partner users for support |

#### API Endpoints (ERPS_ADMIN Only)

```
POST   /api/v1/partners                    # Create partner account
GET    /api/v1/partners                    # List all partner accounts  
GET    /api/v1/partners/:id                # Get partner account details
PATCH  /api/v1/partners/:id                # Update partner account
PATCH  /api/v1/partners/:id/status         # Suspend/activate partner
DELETE /api/v1/partners/:id                # Delete partner account

POST   /api/v1/partners/:id/users          # Create partner user
GET    /api/v1/partners/:id/users          # List partner users
PUT    /api/v1/admin/users/:userId         # Edit any user
DELETE /api/v1/admin/users/:userId         # Delete any user
PATCH  /api/v1/admin/users/:userId/block   # Block/unblock users

GET    /api/v1/auth/admin/partner-users    # List all partner users
GET    /api/v1/auth/admin/installers       # List all installers
POST   /api/v1/auth/admin/login-as         # Login as partner user

GET    /api/v1/admin/dashboard/stats       # System statistics
POST   /api/v1/verify/resend               # Resend verification SMS
GET    /api/v1/verify/history/:installerId # Verification history
```

#### Restrictions
- **Cannot** bypass system audit logs
- **Cannot** delete audit trail records
- **Must** maintain verification token security

---

### 2. PARTNER_USER Roles (Store/Business Users)

All Partner Users:
- Belong to exactly **one** Partner Account (business/store)
- Can only access data within their Partner Account
- Are subject to system-enforced business rules
- Cannot access other Partner Accounts' data

---

#### 2.1 ACCOUNT_ADMIN (Partner Business Owner/Manager)

**Purpose**: Business oversight and compliance management for the Partner Account

##### Core Responsibilities
- Ensure warranties and inspections are submitted correctly and on time
- Manage Partner Account users and roles
- Ensure ERPS Installers are properly assigned and contactable
- Handle rejected submissions and compliance issues

##### Permissions Matrix

| **Category** | **Permissions** | **Scope** | **Details** |
|--------------|-----------------|-----------|-------------|
| **Partner Account** | ✅ View, Edit | Own Account Only | Business details, contact info, settings |
| **User Management** | ✅ Create, Edit, Deactivate | Own Account Only | Add/manage Staff and Installers |
| **Role Assignment** | ✅ Assign Partner Roles | Own Account Only | Set Staff/Installer roles |
| **Warranty Management** | ✅ Create, Edit, Submit | Own Account Only | Full warranty lifecycle management |
| **Inspection Management** | ✅ Create, Edit, Submit | Own Account Only | Full inspection lifecycle management |
| **Data Viewing** | ✅ View All Records | Own Account Only | All customers, warranties, inspections |
| **Photo Management** | ✅ Upload, View, Delete | Own Account Only | Manage photo evidence |
| **Compliance Monitoring** | ✅ View Status, Reminders | Own Account Only | Due dates, grace periods, rejections |
| **Submission Control** | ✅ Submit for Verification | Own Account Only | Send to installers for verification |

##### API Endpoints (ACCOUNT_ADMIN)

```
# Partner Account Management
GET    /api/v1/partner-accounts/:accountId        # View own account
PUT    /api/v1/partner-accounts/:accountId        # Update own account

# User Management (within own partner account)
POST   /api/v1/partner-accounts/:accountId/users  # Create partner user
GET    /api/v1/partner-accounts/:accountId/users  # List partner users
PUT    /api/v1/users/:userId                      # Edit partner user
PATCH  /api/v1/users/:userId/deactivate          # Deactivate partner user

# Warranty and Inspection Management
POST   /api/v1/warranties                         # Create warranty
GET    /api/v1/warranties                         # List own warranties
PUT    /api/v1/warranties/:id                     # Edit warranty
POST   /api/v1/warranties/:id/submit              # Submit for verification
POST   /api/v1/warranties/:id/photos              # Upload photos

POST   /api/v1/inspections                        # Create inspection
GET    /api/v1/inspections                        # List own inspections
PUT    /api/v1/inspections/:id                    # Edit inspection
POST   /api/v1/inspections/:id/submit             # Submit for verification
POST   /api/v1/inspections/:id/photos             # Upload photos
```

##### Restrictions
- **Cannot** verify installations or inspections
- **Cannot** activate warranties or extend validity
- **Cannot** override system decisions or business rules
- **Cannot** access other Partner Accounts' data
- **Cannot** manage ERPS Admin users

---

#### 2.2 ACCOUNT_STAFF (Partner Data Entry/Administrative)

**Purpose**: Day-to-day data entry and administrative tasks

##### Core Responsibilities
- Enter accurate customer, vehicle, and product data
- Upload required photos and documentation
- Submit records for verification
- Respond to rejected submissions with corrections

##### Permissions Matrix

| **Category** | **Permissions** | **Scope** | **Details** |
|--------------|-----------------|-----------|-------------|
| **Warranty Management** | ✅ Create, Edit, Submit | Own Account Only | Create and manage warranty registrations |
| **Inspection Management** | ✅ Create, Edit, Submit | Own Account Only | Create and manage annual inspections |
| **Data Entry** | ✅ Customer/Vehicle Data | Own Account Only | Enter all required form data |
| **Photo Management** | ✅ Upload, View | Own Account Only | Upload required photo evidence |
| **Draft Management** | ✅ Save, Edit Drafts | Own Account Only | Work with incomplete records |
| **Status Viewing** | ✅ View Status | Own Account Only | Check verification status |
| **Rejection Handling** | ✅ View Reasons | Own Account Only | See rejection reasons for corrections |

##### API Endpoints (ACCOUNT_STAFF)

```
# Warranty Management
POST   /api/v1/warranties                         # Create warranty
GET    /api/v1/warranties                         # List own warranties
PUT    /api/v1/warranties/:id                     # Edit warranty (if not submitted)
POST   /api/v1/warranties/:id/submit              # Submit for verification
POST   /api/v1/warranties/:id/photos              # Upload photos
GET    /api/v1/warranties/:id/status              # Check status

# Inspection Management  
POST   /api/v1/inspections                        # Create inspection
GET    /api/v1/inspections                        # List own inspections
PUT    /api/v1/inspections/:id                    # Edit inspection (if not submitted)
POST   /api/v1/inspections/:id/submit             # Submit for verification
POST   /api/v1/inspections/:id/photos             # Upload photos
GET    /api/v1/inspections/:id/status             # Check status
```

##### Restrictions
- **Cannot** manage users or assign roles
- **Cannot** verify installations or inspections
- **Cannot** override system outcomes or business rules
- **Cannot** access Partner Account management functions
- **Cannot** view other users' draft records

---

#### 2.3 ACCOUNT_INSTALLER (Partner Field Technician/Installer)

**Purpose**: Physical execution of ERPS work and formal attestation of reality

**⚠️ CRITICAL**: This is the **ONLY** role permitted to verify ERPS installations and inspections

##### Core Responsibilities
- Perform ERPS installations in the field
- Perform annual inspections on existing systems
- Ensure submitted data and photos accurately reflect physical reality
- Complete SMS verification promptly and accurately
- Maintain installer certification and accreditation

##### Permissions Matrix

| **Category** | **Permissions** | **Scope** | **Details** |
|--------------|-----------------|-----------|-------------|
| **Warranty Creation** | ✅ Create, Edit, Submit | Own Account Only | Create warranty registrations |
| **Inspection Creation** | ✅ Create, Edit, Submit | Own Account Only | Create annual inspections |
| **Photo Management** | ✅ Upload, View | Own Account Only | Upload photo evidence |
| **Draft Management** | ✅ Save, Edit Drafts | Own Account Only | Work with incomplete records |
| **SMS Verification** | ✅ **EXCLUSIVE ACCESS** | Own Work Only | **ONLY** role that can verify work |
| **Mobile Verification** | ✅ **REQUIRED** | Own Mobile Only | Must use registered mobile number |

##### Verification Authority (EXCLUSIVE)

| **Verification Type** | **Method** | **Requirements** | **Restrictions** |
|----------------------|------------|------------------|------------------|
| **Warranty Registration** | SMS Link Only | Own registered mobile | Cannot verify work they didn't perform |
| **Annual Inspection** | SMS Link Only | Own registered mobile | Cannot verify work they didn't perform |
| **Token Security** | Time-limited | 24-hour expiry | Cannot share or delegate tokens |
| **Two-Factor Auth** | Mobile + Portal | Must be logged in | Cannot bypass SMS verification |

##### API Endpoints (ACCOUNT_INSTALLER)

```
# Standard Creation (same as Staff)
POST   /api/v1/warranties                         # Create warranty
GET    /api/v1/warranties                         # List own warranties  
PUT    /api/v1/warranties/:id                     # Edit warranty (if not submitted)
POST   /api/v1/warranties/:id/submit              # Submit for verification
POST   /api/v1/warranties/:id/photos              # Upload photos

POST   /api/v1/inspections                        # Create inspection
GET    /api/v1/inspections                        # List own inspections
PUT    /api/v1/inspections/:id                    # Edit inspection (if not submitted)
POST   /api/v1/inspections/:id/submit             # Submit for verification
POST   /api/v1/inspections/:id/photos             # Upload photos

# EXCLUSIVE Verification Endpoints
GET    /api/v1/verify/:token                      # Get verification details (SMS link)
POST   /api/v1/verify/warranty/:token             # Verify warranty installation
POST   /api/v1/verify/inspection/:token           # Verify annual inspection
```

##### Critical Restrictions
- **Cannot** verify via portal login or dashboard
- **Cannot** verify work they did not personally perform
- **Cannot** delegate verification to others
- **Cannot** bypass SMS verification process
- **Cannot** override system rules or business logic
- **Must** use their registered mobile number for all verifications
- **Cannot** share verification tokens or links

---

## Verification Workflow (Critical Business Process)

### Global Verification Rules (LOCKED)

1. **Verification NEVER occurs inside the ERPS Partner Portal**
2. **Verification NEVER occurs via dashboards or web interfaces**
3. **Verification occurs ONLY via secure, time-limited SMS links**
4. **Verification is bound to the Installer's registered mobile number**
5. **Only ACCOUNT_INSTALLER role can verify work**
6. **Installers can ONLY verify work they personally performed**

### Warranty Registration Verification Process

```
1. ACCOUNT_STAFF/ADMIN creates warranty registration
2. ACCOUNT_STAFF/ADMIN selects which ACCOUNT_INSTALLER performed work
3. ACCOUNT_STAFF/ADMIN submits warranty for verification
4. SYSTEM sends SMS verification link to installer's mobile
5. ACCOUNT_INSTALLER clicks SMS link (outside portal)
6. ACCOUNT_INSTALLER confirms/declines via secure form
7. SYSTEM activates warranty ONLY after installer confirmation
```

### Annual Inspection Verification Process

```
1. ACCOUNT_STAFF/ADMIN creates annual inspection
2. ACCOUNT_STAFF/ADMIN selects which ACCOUNT_INSTALLER performed inspection  
3. ACCOUNT_STAFF/ADMIN submits inspection for verification
4. SYSTEM sends SMS verification link to inspector's mobile
5. ACCOUNT_INSTALLER clicks SMS link (outside portal)
6. ACCOUNT_INSTALLER confirms/declines via secure form
7. SYSTEM extends warranty 12 months ONLY after inspector confirmation
```

---

## Record States and Permissions

### Warranty Registration States

| **State** | **Description** | **Who Can Edit** | **Actions Available** |
|-----------|-----------------|------------------|----------------------|
| **DRAFT** | Incomplete, being created | Creator, Account Admin | Edit, Save, Delete, Submit |
| **SUBMITTED** | Locked, SMS sent to installer | ERPS Admin Only | View, Resend SMS, Admin Override |
| **VERIFIED** | Installer confirmed, warranty active | ERPS Admin Only | View, Admin Actions |
| **REJECTED** | Installer declined | Creator, Account Admin | Edit, Resubmit |

### Annual Inspection States

| **State** | **Description** | **Who Can Edit** | **Actions Available** |
|-----------|-----------------|------------------|----------------------|
| **DRAFT** | Incomplete, being created | Creator, Account Admin | Edit, Save, Delete, Submit |
| **SUBMITTED** | Locked, SMS sent to inspector | ERPS Admin Only | View, Resend SMS, Admin Override |
| **VERIFIED** | Inspector confirmed, warranty extended | ERPS Admin Only | View, Admin Actions |
| **REJECTED** | Inspector declined | Creator, Account Admin | Edit, Resubmit |

---

## API Authentication and Authorization

### Authentication Methods

1. **JWT Bearer Tokens** - All API requests require valid JWT
2. **Role-based Middleware** - Endpoints enforce role requirements
3. **Partner Account Isolation** - Users can only access own account data
4. **Admin Impersonation** - ERPS Admin can login as partner users

### Authorization Middleware

```typescript
// Authentication Required
requireAuth()                    // Valid JWT token required

// Role-based Access
requireERPSAdmin()              // ERPS_ADMIN role only
requirePartnerUser()            // PARTNER_USER role only  
requireAccountAdmin()           // ACCOUNT_ADMIN or ERPS_ADMIN
requireAccountInstaller()       // ACCOUNT_INSTALLER only

// Data Access Control
requirePartnerAccess()          // Own partner account only
requireUserManagement()         // User management permissions
requireVerificationAccess()    // Verification permissions only
```

### Security Headers Required

```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

---

## Business Rules and Compliance

### Warranty Lifecycle Rules

1. **12-Month Inspection Cycle** - Annual inspections required every 12 months
2. **60-Day Grace Period** - Grace period after inspection due date
3. **Automatic Reminders** - System sends reminders at 11 months
4. **Warranty Extension** - Verified inspections extend warranty 12 months
5. **Compliance Enforcement** - Overdue inspections affect warranty status

### Photo Requirements

| **Record Type** | **Required Photos** | **Photo Groups** |
|-----------------|-------------------|------------------|
| **Warranty Registration** | Minimum 3 photos | GENERATOR, COUPLER, CORROSION_OR_CLEAR |
| **Annual Inspection** | Minimum 3 photos | GENERATOR_RED_LIGHT, COUPLERS, CORROSION_OR_CLEAR |

### Verification Token Security

- **24-Hour Expiry** - SMS tokens expire after 24 hours
- **Single Use** - Tokens can only be used once
- **Mobile Binding** - Tokens tied to installer's mobile number
- **IP Tracking** - Verification attempts logged with IP address

---

## System Integration Points

### External Services

1. **SMS Gateway** - Verification link delivery
2. **Email Service** - Reminder notifications
3. **File Storage** - Photo evidence storage
4. **Audit Logging** - Security and compliance tracking

### Database Security

1. **Soft Deletion** - Records marked as deleted, not permanently removed
2. **Audit Trails** - All changes tracked with user and timestamp
3. **Data Encryption** - Sensitive data encrypted at rest
4. **Access Logging** - All database access logged

---

## Error Handling and Access Denied Scenarios

### Common Access Denied Responses

```json
// Insufficient Role
{
  "success": false,
  "message": "ERPS Admin access required",
  "code": 403
}

// Partner Account Access Denied  
{
  "success": false,
  "message": "Access denied to this partner account", 
  "code": 403
}

// Verification Access Denied
{
  "success": false,
  "message": "Only Account Installers can verify work",
  "code": 403
}

// Invalid Token
{
  "success": false,
  "message": "Invalid or expired token",
  "code": 401
}
```

---

## Migration and Legacy Support

### Role Migration from Legacy System

```sql
-- Legacy Role Mapping
ADMIN/SUPER_ADMIN    → ERPS_ADMIN
AGENT                → PARTNER_USER (ACCOUNT_ADMIN)  
INSPECTOR            → PARTNER_USER (ACCOUNT_INSTALLER)
```

### Data Migration Requirements

1. **Partner Account Creation** - Group users by business
2. **Role Assignment** - Map legacy roles to new structure
3. **Mobile Number Mapping** - Ensure installers have mobile numbers
4. **Verification History** - Preserve existing verification records
5. **Warranty References** - Update warranty/inspection references

---

## Troubleshooting and Support

### Common Access Issues

1. **"Access Denied to Partner Account"**
   - User trying to access different partner account
   - Solution: Verify user's partnerAccountId matches target

2. **"Only Account Installers can verify work"**
   - Non-installer trying to access verification endpoints
   - Solution: Check user's partnerRole is ACCOUNT_INSTALLER

3. **"ERPS Admin access required"**
   - Partner user trying to access admin endpoints
   - Solution: Use ERPS Admin account or admin login-as feature

4. **"Invalid or expired token"**
   - JWT token expired or malformed
   - Solution: Re-authenticate and get new token

### Admin Support Tools

```
# Check user roles and permissions
GET /api/v1/admin/users/:userId

# Login as user for support
POST /api/v1/auth/admin/login-as

# View verification history
GET /api/v1/verify/history/:installerId

# Resend verification SMS
POST /api/v1/verify/resend
```

---

## Summary

The ERPS Partner Portal implements a comprehensive role-based access control system with three main user categories:

1. **ERPS_ADMIN** - Full system governance and oversight
2. **ACCOUNT_ADMIN** - Partner business management and compliance
3. **ACCOUNT_STAFF** - Data entry and administrative tasks  
4. **ACCOUNT_INSTALLER** - Field work execution and verification authority

**Key Security Principles:**
- Role-based permissions with partner account isolation
- SMS-only verification for critical business processes
- Comprehensive audit trails and access logging
- Principle of least privilege for all user roles

**Critical Business Rule:**
Only ACCOUNT_INSTALLER users can verify ERPS work, and only via SMS links sent to their registered mobile numbers. This verification authority cannot be delegated, bypassed, or performed through the portal interface.

This system ensures data security, business process integrity, and regulatory compliance while providing appropriate access levels for each user role's responsibilities.