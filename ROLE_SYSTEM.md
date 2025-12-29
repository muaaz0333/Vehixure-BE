# ERPS Role-Based Authentication System

This project implements the ERPS Partner Portal role-based authentication system as defined in the ERPS requirements documents.

## System Overview

The ERPS Partner Portal is used by:
- **ERPS Partner Users (Stores)** - Manage warranty registrations and annual inspections
- **ERPS Admin (Internal ERPS users)** - Platform governance and partner management  
- **ERPS System (Automated)** - Enforcement, communication, and compliance control

## User Roles

### 1. ERPS_ADMIN (Internal ERPS Users)
- **Full platform access** and governance
- Can create, approve, suspend, or deactivate Partner Accounts
- Can view all Partner data across the platform
- Can manage Installer accreditation and access
- Can login as any Partner User for support purposes
- Can manually verify installations or inspections through dashboard
- Can activate or extend warranties manually
- **Cannot** bypass system audit logs

### 2. PARTNER_USER (Store Users)
All Partner Users belong to one ERPS Partner Account and have one of three sub-roles:

#### 2.1 ACCOUNT_ADMIN (Partner)
- **Business and compliance oversight** for the Partner Account
- Can manage Partner Account details
- Can add, edit, and deactivate Partner users (Admin, Staff)
- Can assign Partner roles (Admin, Staff)
- Can view all customers, warranty registrations, and inspections
- Can create, edit, save, and submit warranty registrations and inspections
- **Cannot** verify installations or inspections
- **Cannot** activate warranties or override system decisions

#### 2.2 ACCOUNT_STAFF (Partner)  
- **Day-to-day administration** and data entry
- Can create warranty registrations and annual inspections
- Can enter and edit data prior to submission
- Can upload photos and save drafts
- Can submit records for verification
- **Cannot** manage users or roles
- **Cannot** verify installations or inspections

#### 2.3 ACCOUNT_INSTALLER (Partner)
- **Physical execution** of work and formal attestation of reality
- **Only role permitted** to verify ERPS work
- Can create warranty registrations and annual inspections
- Can upload photos, save drafts, and submit records
- **Must verify** installations they performed via secure SMS only
- **Must verify** annual inspections they performed via secure SMS only
- **Cannot** verify work they did not perform
- **Cannot** bypass SMS verification or delegate verification

## Verification Authority (Global Rule)

- **Verification is NEVER performed inside the ERPS Partner Portal**
- **Verification is NEVER performed via dashboards**  
- **Verification occurs ONLY via secure, time-limited SMS links**
- **Verification is bound to the Installer's registered mobile number**

This applies to:
- Warranty Registration
- Annual Inspections

## API Endpoints

### Authentication Endpoints
- `POST /api/v1/auth/register` - Register new user (defaults to PARTNER_USER role)
- `POST /api/v1/auth/login` - Login with email/password
- `GET /api/v1/auth/partner-users` - Get all partner users (ERPS Admin only)
- `GET /api/v1/auth/installers` - Get all installers (ERPS Admin only)
- `POST /api/v1/auth/admin/login-as` - ERPS Admin login as partner user

### Partner Account Management (ERPS Admin)
- `POST /api/v1/partners` - Create new partner account with admin user
- `GET /api/v1/partners` - Get all partner accounts
- `GET /api/v1/partners/:id` - Get partner account details
- `PATCH /api/v1/partners/:id` - Update partner account
- `PATCH /api/v1/partners/:id/status` - Suspend/activate partner account
- `GET /api/v1/partners/:id/users` - Get partner users
- `POST /api/v1/partners/:id/users` - Create partner user

### Verification Endpoints
- `GET /api/v1/verify/:token` - Get verification details (public)
- `POST /api/v1/verify/warranty/:token` - Process warranty verification
- `POST /api/v1/verify/inspection/:token` - Process inspection verification
- `POST /api/v1/verify/resend` - Resend verification SMS (ERPS Admin)
- `GET /api/v1/verify/history/:installerId` - Get installer verification history

## Security Features

1. **Role-based middleware**: Enforces proper access control for each role
2. **Partner account isolation**: Users can only access their own partner account data
3. **SMS-only verification**: Installers must verify via mobile SMS, never through portal
4. **Admin impersonation**: ERPS Admin can login as partner users with audit trail
5. **Verification tracking**: System tracks SMS attempts and verification history
6. **Soft deletion**: Users and accounts are marked as deleted rather than permanently removed

## Verification Workflow

### Warranty Registration
1. **Account Staff/Admin** creates warranty registration
2. **Account Staff/Admin** selects which **Account Installer** performed the work
3. **Account Staff/Admin** submits warranty for verification
4. **System** sends SMS verification link to selected installer's mobile
5. **Account Installer** clicks SMS link and confirms/declines via secure form
6. **System** activates warranty only after installer confirmation

### Annual Inspection  
1. **Account Staff/Admin** creates annual inspection
2. **Account Staff/Admin** selects which **Account Installer** performed the inspection
3. **Account Staff/Admin** submits inspection for verification
4. **System** sends SMS verification link to selected installer's mobile
5. **Account Installer** clicks SMS link and confirms/declines via secure form
6. **System** extends warranty only after installer confirmation

## Record States

### Warranty Registration States
1. **Draft** - Incomplete, can be edited
2. **Submitted – Pending Verification** - Locked, SMS sent to installer
3. **Verified (Active Warranty)** - Installer confirmed, warranty active
4. **Rejected – Installer Declined** - Installer declined, record unlocked for correction

### Annual Inspection States  
1. **Draft** - Incomplete, can be edited
2. **Submitted – Pending Verification** - Locked, SMS sent to inspector
3. **Verified – Inspection Complete** - Inspector confirmed, warranty extended 12 months
4. **Rejected – Inspector Declined** - Inspector declined, record unlocked for correction

## Migration from Legacy System

Run the migration script to update existing data:
```sql
-- Execute migration-update-role-system.sql
-- This will:
-- 1. Convert ADMIN/SUPER_ADMIN → ERPS_ADMIN
-- 2. Convert AGENT/INSPECTOR → PARTNER_USER with appropriate sub-roles
-- 3. Create partner accounts for existing businesses
-- 4. Associate users with partner accounts
-- 5. Set installer flags and mobile numbers
-- 6. Update warranty/inspection references
```

## Usage Examples

### ERPS Admin Creates Partner Account
```bash
POST /api/v1/partners
Authorization: Bearer <erps_admin_token>
{
  "businessName": "ABC Auto Services",
  "contactPerson": "John Smith", 
  "adminEmail": "admin@abcauto.com",
  "adminPassword": "securepassword",
  "adminFullName": "John Smith",
  "adminPhone": "+61412345678"
}
```

### Account Admin Creates Installer
```bash
POST /api/v1/partners/partner-id/users
Authorization: Bearer <account_admin_token>
{
  "email": "installer@abcauto.com",
  "password": "securepassword",
  "fullName": "Mike Johnson",
  "mobileNumber": "+61498765432",
  "partnerRole": "ACCOUNT_INSTALLER",
  "isAccreditedInstaller": true,
  "installerCertificationNumber": "ERPS-INST-2024-001"
}
```

### Submit Warranty for Verification
```bash
POST /api/v1/warranties/:id/submit
Authorization: Bearer <partner_user_token>
{
  "installedBy": "installer-user-id"
}
# System automatically sends SMS to installer's mobile
```

## Responsibility Boundary

- **Partners** manage data and workflow
- **ERPS Authorised Installers** confirm reality via SMS
- **ERPS Admin** governs, not operates  
- **The System** enforces outcomes

## One-Sentence Summary

The ERPS Partner Portal is used by authorised ERPS Partner stores to register installations and manage inspections, with ERPS Authorised Installers verifying work via SMS, ERPS Admin providing governance and oversight, and the system enforcing all warranty and compliance rules.