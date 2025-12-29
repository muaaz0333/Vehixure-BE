# ERPS Partner Account API Endpoints

## Overview

This document provides complete API endpoint documentation for managing partner accounts in the ERPS Partner Portal. All endpoints require proper authentication and authorization based on user roles.

## Base URL
```
https://your-api-domain.com/api/v1
```

## Authentication

All endpoints require a valid JWT token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

---

## 1. Create Partner Account

**Endpoint:** `POST /api/v1/admin/partner-accounts`

**Access:** ERPS Admin only

**Description:** Creates a new partner account with an admin user. Automatically sends welcome email via SMTP to the admin user.

### Request Headers
```
Authorization: Bearer <erps_admin_jwt_token>
Content-Type: application/json
```

### Request Body
```json
{
  // PARTNER ACCOUNT INFORMATION (Business Details)
  "businessName": "ABC Auto Services Pty Ltd",
  "contactPerson": "John Smith",
  "streetAddress": "123 Main Street",
  "city": "Sydney", 
  "state": "NSW",
  "postcode": "2000",
  "country": "Australia",
  "phone": "+61 2 1234 5678",           // Business phone number
  "faxNumber": "+61 2 1234 5679",       // Business fax number
  "email": "contact@abcauto.com.au",    // Business email address
  "productsSold": "ERPS Systems, Vehicle Protection Products",
  "buyPrice": "E1",
  
  // ADMIN USER ACCOUNT (Login Account for the Business)
  "adminUserEmail": "admin@abcauto.com.au",     // Admin login email (MUST be unique)
  "adminUserPassword": "SecurePassword123!",    // Admin login password
  "adminUserFullName": "John Smith",            // Admin user's full name
  "adminUserPhone": "+61 2 1234 5678",          // Admin user's phone number
  "adminUserMobile": "+61 412 345 678"          // Admin user's mobile number (for SMS)
}
```

### Field Purpose Explanation

| Field Category | Field Name | Purpose | Example |
|----------------|------------|---------|---------|
| **Business Info** | `businessName` | Company/business name | "ABC Auto Services Pty Ltd" |
| **Business Info** | `contactPerson` | Primary business contact | "John Smith" |
| **Business Info** | `email` | Business email address | "contact@abcauto.com.au" |
| **Business Info** | `phone` | Business phone number | "+61 2 1234 5678" |
| **Admin User** | `adminUserEmail` | Login email for admin user | "admin@abcauto.com.au" |
| **Admin User** | `adminUserPassword` | Login password for admin user | "SecurePassword123!" |
| **Admin User** | `adminUserFullName` | Admin user's personal name | "John Smith" |
| **Admin User** | `adminUserPhone` | Admin user's phone number | "+61 2 1234 5678" |
| **Admin User** | `adminUserMobile` | Admin user's mobile (for SMS) | "+61 412 345 678" |

### Why Two Sets of Contact Information?

1. **Business Information** (`email`, `phone`, `contactPerson`):
   - Stored in `partner_accounts` table
   - Used for business records and customer communication
   - Can be different from admin user's personal details

2. **Admin User Information** (`adminUserEmail`, `adminUserPhone`, `adminUserMobile`):
   - Stored in `users` table
   - Used for login and personal account management
   - Admin user's personal contact details

### Common Scenarios:

**Scenario 1: Same Person, Different Contacts**
```json
{
  "businessName": "Smith Auto Repair",
  "contactPerson": "John Smith",
  "email": "info@smithauto.com.au",        // Business email
  "phone": "+61 2 1234 5678",              // Business phone
  
  "adminUserEmail": "john@smithauto.com.au",  // Personal login email
  "adminUserPhone": "+61 2 1234 5678",        // Same as business phone
  "adminUserMobile": "+61 412 345 678"        // Personal mobile for SMS
}
```

**Scenario 2: Different Person Managing Account**
```json
{
  "businessName": "ABC Auto Services",
  "contactPerson": "John Smith (Owner)",
  "email": "info@abcauto.com.au",          // Business email
  "phone": "+61 2 1234 5678",              // Business phone
  
  "adminUserEmail": "manager@abcauto.com.au", // Manager's login email
  "adminUserFullName": "Jane Doe",            // Manager's name
  "adminUserPhone": "+61 2 9876 5432",        // Manager's phone
  "adminUserMobile": "+61 412 987 654"        // Manager's mobile for SMS
}
```

### Field Descriptions

#### Partner Account Fields (Business Information)
| Field | Type | Required | Description | Purpose |
|-------|------|----------|-------------|---------|
| `businessName` | string | ✅ | Business/company name | Stored in partner_accounts table |
| `contactPerson` | string | ✅ | Primary business contact person | Business records |
| `streetAddress` | string | ❌ | Business street address | Business location |
| `city` | string | ❌ | Business city | Business location |
| `state` | string | ❌ | Business state/province | Business location |
| `postcode` | string | ❌ | Business postal/ZIP code | Business location |
| `country` | string | ❌ | Business country (defaults to Australia) | Business location |
| `phone` | string | ❌ | **Business phone number** | Customer contact |
| `faxNumber` | string | ❌ | Business fax number | Business communication |
| `email` | string | ❌ | **Business email address** | Customer communication |
| `productsSold` | string | ❌ | Description of products sold | Business records |
| `buyPrice` | string | ❌ | Price category | `Aftermart`, `Distributor`, `E1`, `E2`, `Less 15%`, `Rob`, `EquipIT`, `Installer`, `Inspector` |

#### Admin User Fields (Login Account Information)
| Field | Type | Required | Description | Purpose |
|-------|------|----------|-------------|---------|
| `adminUserEmail` | string | ✅ | **Admin login email** (must be unique) | User authentication |
| `adminUserPassword` | string | ✅ | Admin login password (min 6 chars) | User authentication |
| `adminUserFullName` | string | ❌ | **Admin user's personal name** | User profile |
| `adminUserPhone` | string | ❌ | **Admin user's phone number** | User contact |
| `adminUserMobile` | string | ❌ | **Admin user's mobile number** | SMS verification |

### Success Response (201)
```json
{
  "success": true,
  "message": "Partner account created successfully",
  "data": {
    "partnerAccount": {
      "id": "uuid-partner-account-id",
      "businessName": "ABC Auto Services Pty Ltd",
      "contactPerson": "John Smith",
      "streetAddress": "123 Main Street",
      "city": "Sydney",
      "state": "NSW",
      "postcode": "2000",
      "country": "Australia",
      "phone": "+61 2 1234 5678",
      "faxNumber": "+61 2 1234 5679",
      "email": "contact@abcauto.com.au",
      "productsSold": "ERPS Systems, Vehicle Protection Products",
      "buyPrice": "E1",
      "accountStatus": "Active",
      "isDeleted": false,
      "created": "2024-01-15T10:30:00.000Z",
      "modified": "2024-01-15T10:30:00.000Z",
      "deletedAt": null
    },
    "adminUser": {
      "id": "uuid-admin-user-id",
      "email": "admin@abcauto.com.au",
      "fullName": "John Smith",
      "partnerRole": "ACCOUNT_ADMIN"
    }
  }
}
```

### Error Responses
```json
// 400 - Business name already exists
{
  "success": false,
  "message": "Partner account with this business name already exists"
}

// 400 - Admin email already exists
{
  "success": false,
  "message": "User with this email already exists"
}

// 403 - Insufficient permissions
{
  "success": false,
  "message": "ERPS Admin access required"
}
```

### Email Notification
✅ **Automatic Email Sent**: When a partner account is created, a comprehensive welcome email is automatically sent to the `adminUserEmail` via SMTP containing:
- Login credentials and portal access link
- Business account information
- Getting started guide
- Security reminders
- Support contact information

---

## 2. Get All Partner Accounts

**Endpoint:** `GET /api/v1/admin/partner-accounts`

**Access:** ERPS Admin only

**Description:** Retrieves a paginated list of all partner accounts with optional filtering.

### Request Headers
```
Authorization: Bearer <erps_admin_jwt_token>
```

### Query Parameters
```
GET /api/v1/admin/partner-accounts?page=1&limit=10&search=ABC&status=Active
```

| Parameter | Type | Required | Description | Default |
|-----------|------|----------|-------------|---------|
| `page` | number | ❌ | Page number (1-based) | 1 |
| `limit` | number | ❌ | Items per page (max 100) | 10 |
| `search` | string | ❌ | Search in business name, contact person, email | - |
| `status` | string | ❌ | Filter by account status | - |

### Success Response (200)
```json
{
  "success": true,
  "message": "Partner accounts retrieved successfully",
  "data": [
    {
      "id": "uuid-partner-account-id",
      "businessName": "ABC Auto Services Pty Ltd",
      "contactPerson": "John Smith",
      "streetAddress": "123 Main Street",
      "city": "Sydney",
      "state": "NSW",
      "postcode": "2000",
      "country": "Australia",
      "phone": "+61 2 1234 5678",
      "email": "contact@abcauto.com.au",
      "accountStatus": "Active",
      "created": "2024-01-15T10:30:00.000Z",
      "modified": "2024-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

---

## 3. Get Partner Account by ID

**Endpoint:** `GET /api/v1/admin/partner-accounts/:accountId`

**Access:** 
- ERPS Admin (can access any account)
- Partner Users (can only access their own account)

**Description:** Retrieves details of a specific partner account.

### Request Headers
```
Authorization: Bearer <jwt_token>
```

### URL Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `accountId` | string | ✅ | UUID of the partner account |

### Success Response (200)
```json
{
  "success": true,
  "message": "Partner account retrieved successfully",
  "data": {
    "id": "uuid-partner-account-id",
    "businessName": "ABC Auto Services Pty Ltd",
    "contactPerson": "John Smith",
    "streetAddress": "123 Main Street",
    "city": "Sydney",
    "state": "NSW",
    "postcode": "2000",
    "country": "Australia",
    "phone": "+61 2 1234 5678",
    "faxNumber": "+61 2 1234 5679",
    "email": "contact@abcauto.com.au",
    "productsSold": "ERPS Systems, Vehicle Protection Products",
    "buyPrice": "E1",
    "accountStatus": "Active",
    "isDeleted": false,
    "created": "2024-01-15T10:30:00.000Z",
    "modified": "2024-01-15T10:30:00.000Z",
    "deletedAt": null
  }
}
```

---

## 4. Update Partner Account

**Endpoint:** `PUT /api/v1/admin/partner-accounts/:accountId`

**Access:** 
- ERPS Admin (can update any account)
- Account Admin (can only update their own account)

**Description:** Updates partner account information.

### Request Headers
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### URL Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `accountId` | string | ✅ | UUID of the partner account |

### Request Body
```json
{
  // All fields are optional - only include fields you want to update
  "businessName": "ABC Auto Services Updated Pty Ltd",
  "contactPerson": "John Smith Jr",
  "streetAddress": "456 New Street",
  "city": "Melbourne",
  "state": "VIC",
  "postcode": "3000",
  "country": "Australia",
  "phone": "+61 3 9876 5432",
  "faxNumber": "+61 3 9876 5433",
  "email": "newcontact@abcauto.com.au",
  "productsSold": "ERPS Systems, Extended Vehicle Protection",
  "buyPrice": "E2",
  "accountStatus": "Active"
}
```

### Field Descriptions
| Field | Type | Description | Valid Values |
|-------|------|-------------|--------------|
| `accountStatus` | string | Account status | `Active`, `InActive`, `Suspended` |
| All other fields | - | Same as create partner account | - |

### Success Response (200)
```json
{
  "success": true,
  "message": "Partner account updated successfully",
  "data": {
    "id": "uuid-partner-account-id",
    "businessName": "ABC Auto Services Updated Pty Ltd",
    "contactPerson": "John Smith Jr",
    // ... updated fields
    "modified": "2024-01-15T11:45:00.000Z"
  }
}
```

---

## 5. Create Partner User

**Endpoint:** `POST /api/v1/admin/partner-accounts/:accountId/users`

**Access:** 
- ERPS Admin (can create users in any account)
- Account Admin (can only create users in their own account)

**Description:** Creates a new user within a partner account. Automatically sends welcome email to the new user.

### Request Headers
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### URL Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `accountId` | string | ✅ | UUID of the partner account |

### Request Body
```json
{
  // Required Fields
  "email": "staff@abcauto.com.au",
  "password": "SecurePassword123!",
  "partnerRole": "ACCOUNT_STAFF",
  
  // Optional Fields
  "fullName": "Jane Doe",
  "phone": "+61 2 1234 5680",
  "mobileNumber": "+61 412 345 680",
  
  // Installer/Inspector Fields (optional)
  "isAccreditedInstaller": false,
  "isAuthorisedInspector": false,
  "installerCertificationNumber": "ERPS-INST-2024-001",
  "inspectorCertificationNumber": "ERPS-INSP-2024-001"
}
```

### Field Descriptions
| Field | Type | Required | Description | Valid Values |
|-------|------|----------|-------------|--------------|
| `email` | string | ✅ | User email (must be unique) | Valid email format |
| `password` | string | ✅ | User password | Minimum 6 characters |
| `partnerRole` | string | ✅ | Partner role | `ACCOUNT_ADMIN`, `ACCOUNT_STAFF`, `ACCOUNT_INSTALLER` |
| `fullName` | string | ❌ | User's full name | Any name |
| `phone` | string | ❌ | User's phone number | Valid phone format |
| `mobileNumber` | string | ❌ | User's mobile number | Valid mobile format |
| `isAccreditedInstaller` | boolean | ❌ | Is accredited installer | `true`, `false` |
| `isAuthorisedInspector` | boolean | ❌ | Is authorized inspector | `true`, `false` |
| `installerCertificationNumber` | string | ❌ | Installer certification number | Any certification number |
| `inspectorCertificationNumber` | string | ❌ | Inspector certification number | Any certification number |

### Partner Role Descriptions
| Role | Description | Capabilities |
|------|-------------|--------------|
| `ACCOUNT_ADMIN` | Account Administrator | Full account management, user management, all operations |
| `ACCOUNT_STAFF` | Account Staff | Data entry, warranty/inspection creation, limited access |
| `ACCOUNT_INSTALLER` | Account Installer | Field work, SMS verification authority, installation/inspection |

### Success Response (201)
```json
{
  "success": true,
  "message": "Partner user created successfully",
  "data": {
    "id": "uuid-user-id",
    "email": "staff@abcauto.com.au",
    "fullName": "Jane Doe",
    "phone": "+61 2 1234 5680",
    "mobileNumber": "+61 412 345 680",
    "role": "PARTNER_USER",
    "partnerRole": "ACCOUNT_STAFF",
    "partnerAccountId": "uuid-partner-account-id",
    "isAccreditedInstaller": false,
    "isAuthorisedInspector": false,
    "installerCertificationNumber": null,
    "inspectorCertificationNumber": null,
    "isVerified": true,
    "isEmailVerified": true,
    "accountStatus": "Active",
    "isDeleted": false,
    "created": "2024-01-15T12:00:00.000Z",
    "modified": "2024-01-15T12:00:00.000Z"
  }
}
```

### Email Notification
✅ **Automatic Email Sent**: When a partner user is created, a welcome email is automatically sent to the user's email containing:
- Login credentials and role information
- Business context (partner account name)
- Portal access link
- Security reminders
- Support contact information

---

## 6. Get Partner Users

**Endpoint:** `GET /api/v1/admin/partner-accounts/:accountId/users`

**Access:** 
- ERPS Admin (can access users in any account)
- Account Admin (can only access users in their own account)

**Description:** Retrieves all users within a partner account with optional role filtering.

### Request Headers
```
Authorization: Bearer <jwt_token>
```

### URL Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `accountId` | string | ✅ | UUID of the partner account |

### Query Parameters
```
GET /api/v1/admin/partner-accounts/:accountId/users?role=ACCOUNT_STAFF
```

| Parameter | Type | Required | Description | Valid Values |
|-----------|------|----------|-------------|--------------|
| `role` | string | ❌ | Filter by partner role | `ACCOUNT_ADMIN`, `ACCOUNT_STAFF`, `ACCOUNT_INSTALLER` |

### Success Response (200)
```json
{
  "success": true,
  "message": "Partner users retrieved successfully",
  "data": [
    {
      "id": "uuid-user-id-1",
      "email": "admin@abcauto.com.au",
      "fullName": "John Smith",
      "phone": "+61 2 1234 5678",
      "mobileNumber": "+61 412 345 678",
      "role": "PARTNER_USER",
      "partnerRole": "ACCOUNT_ADMIN",
      "partnerAccountId": "uuid-partner-account-id",
      "isAccreditedInstaller": false,
      "isAuthorisedInspector": false,
      "accountStatus": "Active",
      "created": "2024-01-15T10:30:00.000Z"
    },
    {
      "id": "uuid-user-id-2",
      "email": "installer@abcauto.com.au",
      "fullName": "Mike Johnson",
      "phone": "+61 2 1234 5681",
      "mobileNumber": "+61 412 345 681",
      "role": "PARTNER_USER",
      "partnerRole": "ACCOUNT_INSTALLER",
      "partnerAccountId": "uuid-partner-account-id",
      "isAccreditedInstaller": true,
      "isAuthorisedInspector": true,
      "installerCertificationNumber": "ERPS-INST-2024-001",
      "inspectorCertificationNumber": "ERPS-INSP-2024-001",
      "accountStatus": "Active",
      "created": "2024-01-15T12:00:00.000Z"
    }
  ]
}
```

---

## 7. Delete Partner Account

**Endpoint:** `DELETE /api/v1/admin/partner-accounts/:accountId`

**Access:** ERPS Admin only

**Description:** Soft deletes a partner account and all associated users.

### Request Headers
```
Authorization: Bearer <erps_admin_jwt_token>
```

### URL Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `accountId` | string | ✅ | UUID of the partner account |

### Success Response (200)
```json
{
  "success": true,
  "message": "Partner account deleted successfully"
}
```

---

## Complete Example Workflow

### Step 1: Login as ERPS Admin
```bash
curl -X POST https://your-api-domain.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@erps.com",
    "password": "admin123"
  }'
```

### Step 2: Create Partner Account (Triggers Email)
```bash
curl -X POST https://your-api-domain.com/api/v1/admin/partner-accounts \
  -H "Authorization: Bearer <admin_jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "businessName": "ABC Auto Services Pty Ltd",
    "contactPerson": "John Smith",
    "streetAddress": "123 Main Street",
    "city": "Sydney",
    "state": "NSW",
    "postcode": "2000",
    "phone": "+61 2 1234 5678",
    "email": "contact@abcauto.com.au",
    "productsSold": "ERPS Systems",
    "buyPrice": "E1",
    "adminUserEmail": "admin@abcauto.com.au",
    "adminUserPassword": "SecurePassword123!",
    "adminUserFullName": "John Smith",
    "adminUserMobile": "+61 412 345 678"
  }'
```

### Step 3: Create Additional Partner Users (Triggers Email)
```bash
curl -X POST https://your-api-domain.com/api/v1/admin/partner-accounts/<account_id>/users \
  -H "Authorization: Bearer <admin_jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "installer@abcauto.com.au",
    "password": "SecurePassword456!",
    "fullName": "Mike Johnson",
    "mobileNumber": "+61 412 345 679",
    "partnerRole": "ACCOUNT_INSTALLER",
    "isAccreditedInstaller": true,
    "installerCertificationNumber": "ERPS-INST-2024-001"
  }'
```

## Email Notifications

### SMTP Configuration
The system uses SMTP for reliable email delivery:
- **Host**: smtp.eu.mailgun.org
- **Port**: 587
- **Authentication**: Username/Password
- **Security**: TLS encryption

### Automatic Email Sending

1. **Partner Account Creation**: Sends comprehensive onboarding email to admin user
2. **Partner User Creation**: Sends welcome email with login credentials to new user

### Email Content Includes

- **Login credentials** (email and password)
- **Portal access links**
- **Getting started instructions**
- **Security reminders**
- **Support contact information**
- **Business-specific context**

## Error Handling

### Common HTTP Status Codes

- `200` - Success
- `201` - Created successfully
- `400` - Bad request (validation errors, duplicates)
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not found (account/user doesn't exist)
- `500` - Internal server error

### Validation Rules

- **Business names** must be unique
- **Email addresses** must be unique across all users
- **Passwords** must be at least 6 characters
- **Partner roles** must be valid enum values
- **Account status** must be valid enum values

## Database Schema Changes

### Cleaned Up Users Table
The users table has been optimized and now contains only essential fields:

**Removed Unnecessary Columns:**
- ❌ Business information (moved to partner_accounts table)
- ❌ Social/profile fields (gender, bio, images)
- ❌ Legacy fields (agentType, username)
- ❌ Duplicate contact information

**Kept Essential Columns:**
- ✅ Core user fields (id, email, password, fullName)
- ✅ Authentication fields (role, isVerified, isBlocked)
- ✅ Partner system fields (partnerAccountId, partnerRole)
- ✅ Installer fields (mobileNumber, certifications)
- ✅ Audit fields (created, modified, isDeleted)

This comprehensive API documentation provides all the information needed to create and manage partner accounts in the ERPS Partner Portal system with automatic email notifications.