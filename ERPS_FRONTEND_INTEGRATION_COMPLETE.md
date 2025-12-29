# ERPS Frontend Integration Guide - Complete API Documentation

## Table of Contents
1. [Overview](#overview)
2. [Authentication](#authentication)
3. [User Roles & Permissions](#user-roles--permissions)
4. [Warranty Registration Flow](#warranty-registration-flow)
5. [Annual Inspection Flow](#annual-inspection-flow)
6. [Customer Activation Flow](#customer-activation-flow)
7. [ERPS Admin Override Functions](#erps-admin-override-functions)
8. [API Endpoints Reference](#api-endpoints-reference)
9. [Status Codes & States](#status-codes--states)
10. [Error Handling](#error-handling)

---

## Overview

The ERPS Partner Portal API supports the complete warranty registration and annual inspection lifecycle with the following key features:

- **Role-based access control** (ERPS Admin, Account Admin, Account Staff, Account Installer)
- **SMS-based verification** for installers (60-day token expiry)
- **Customer terms acceptance** workflow after installer verification
- **ERPS Admin override** capabilities for manual interventions
- **Complete audit trail** for all actions

### Base URL
```
Production: https://api.erps.com.au/api/v1
Development: http://localhost:5050/api/v1
```

---

## Authentication

### Login
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "fullName": "John Doe",
      "role": "PARTNER_USER",
      "partnerRole": "ACCOUNT_ADMIN",
      "partnerAccountId": "uuid"
    }
  }
}
```

### Authorization Header
```http
Authorization: Bearer <token>
```

---

## User Roles & Permissions

### Role Hierarchy

| Role | System Role | Partner Role | Description |
|------|-------------|--------------|-------------|
| ERPS Admin | `ERPS_ADMIN` | N/A | Full system access, can override all actions |
| Account Admin | `PARTNER_USER` | `ACCOUNT_ADMIN` | Manages partner account and users |
| Account Staff | `PARTNER_USER` | `ACCOUNT_STAFF` | Creates warranties/inspections, cannot verify |
| Account Installer | `PARTNER_USER` | `ACCOUNT_INSTALLER` | Same as Staff + can verify via SMS |

### Permission Matrix

| Action | ERPS Admin | Account Admin | Account Staff | Account Installer |
|--------|------------|---------------|---------------|-------------------|
| Create Warranty | ✅ | ✅ | ✅ | ✅ |
| Submit Warranty | ✅ | ✅ | ✅ | ✅ |
| Verify via SMS | ✅ (Override) | ❌ | ❌ | ✅ |
| Manual Override | ✅ | ❌ | ❌ | ❌ |
| View Audit Trail | ✅ | ❌ | ❌ | ❌ |
| Manage Users | ✅ | ✅ (Own Account) | ❌ | ❌ |
| Change User Roles | ✅ | ❌ | ❌ | ❌ |

---

## Warranty Registration Flow

### Complete Workflow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        WARRANTY REGISTRATION FLOW                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. CREATE DRAFT                                                             │
│     └─► Staff/Installer creates warranty → Status: DRAFT                     │
│                                                                              │
│  2. SUBMIT FOR VERIFICATION                                                  │
│     └─► Submit warranty → Status: SUBMITTED                                  │
│         └─► SMS sent to installer (60-day expiry)                           │
│                                                                              │
│  3. INSTALLER VERIFICATION (via SMS link)                                    │
│     ├─► CONFIRM → Status: PENDING_CUSTOMER_ACTIVATION                        │
│     │   └─► Email + SMS sent to customer                                    │
│     └─► DECLINE → Status: REJECTED                                          │
│         └─► Record unlocked for correction                                  │
│                                                                              │
│  4. CUSTOMER ACTIVATION (via email link)                                     │
│     └─► Customer accepts terms → Status: ACTIVE                              │
│         └─► Warranty fully activated                                        │
│         └─► Inspection due date set (12 months)                             │
│                                                                              │
│  ALTERNATIVE: ERPS ADMIN OVERRIDE                                            │
│     └─► Admin manually verifies/activates → Logged in audit trail           │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Step 1: Create Warranty (Draft)

```http
POST /api/v1/warranties
Authorization: Bearer <token>
Content-Type: application/json

{
  "companyName": "ABC Motors",
  "firstName": "John",
  "lastName": "Smith",
  "phoneNumber": "+61400123456",
  "email": "john.smith@email.com",
  "make": "Toyota",
  "model": "Camry",
  "registrationNumber": "ABC123",
  "buildDate": "2023-01-15",
  "vinNumber": "1HGBH41JXMN109186",
  "installersName": "Mike Johnson",
  "installerId": "installer-uuid",
  "dateInstalled": "2024-12-20",
  "generatorSerialNumber": "GEN123456",
  "numberOfCouplersInstalled": 4,
  "voltageInCouplerSupplyLine": 12.5,
  "positionOfCouplers": "Front and rear guards",
  "corrosionFound": false,
  "warrantyTermsId": "terms-uuid",
  "photos": [
    {
      "photoGroup": "GENERATOR",
      "photoUrl": "https://storage.example.com/photo1.jpg",
      "description": "Generator with serial number visible"
    }
  ]
}
```

**Response:**
```json
{
  "message": "Warranty registration created successfully",
  "warranty": {
    "id": "warranty-uuid",
    "verificationStatus": "DRAFT",
    "status": "DRAFT",
    "customerName": "John Smith",
    "vehicle": "Toyota Camry",
    "vinNumber": "1HGBH41JXMN109186",
    "installerName": "Mike Johnson",
    "created": "2024-12-29T10:00:00Z"
  },
  "photoCount": 1
}
```

### Step 2: Validate Before Submission

```http
GET /api/v1/warranties/{warrantyId}/validate
Authorization: Bearer <token>
```

**Response:**
```json
{
  "isReadyForSubmission": true,
  "validation": {
    "photos": {
      "current": 3,
      "required": 3,
      "missing": 0,
      "valid": true
    }
  },
  "message": "Warranty is ready for submission",
  "requiredPhotos": [
    "Generator installed with serial number visible",
    "Coupler pad/wiring",
    "Corrosion/stone chips OR clear vehicle body"
  ]
}
```

### Step 3: Submit for Verification

```http
POST /api/v1/warranties/{warrantyId}/submit
Authorization: Bearer <token>
Content-Type: application/json

{
  "submissionNotes": "Installation completed as per specifications"
}
```

**Response:**
```json
{
  "message": "Warranty submitted for verification. SMS sent to installer.",
  "warranty": {
    "id": "warranty-uuid",
    "verificationStatus": "SUBMITTED",
    "status": "SUBMITTED",
    "installerName": "Mike Johnson",
    "submittedAt": "2024-12-29T10:30:00Z"
  }
}
```

### Step 4: Installer Verification (Public Endpoint)

**Get Verification Details:**
```http
GET /api/v1/verify-warranty/{token}
```

**Confirm/Decline Verification:**
```http
POST /api/v1/verify-warranty/{token}
Content-Type: application/json

{
  "action": "CONFIRM"
}
```

Or decline:
```json
{
  "action": "DECLINE",
  "rejectionReason": "Photos do not match actual installation"
}
```

**Response (Confirm):**
```json
{
  "message": "Warranty verified by installer. Customer notification sent for terms acceptance.",
  "warranty": {
    "id": "warranty-uuid",
    "verificationStatus": "PENDING_CUSTOMER_ACTIVATION",
    "status": "PENDING_CUSTOMER_ACTIVATION",
    "verifiedAt": "2024-12-29T11:00:00Z",
    "customerName": "John Smith",
    "vehicle": "Toyota Camry",
    "nextStep": "CUSTOMER_TERMS_ACCEPTANCE"
  }
}
```

---

## Customer Activation Flow

### Public Endpoints (No Authentication Required)

These endpoints are accessed by customers via the activation link sent to their email.

### Get Activation Details

```http
GET /api/v1/customer/activate/{token}
```

**Response:**
```json
{
  "success": true,
  "message": "Activation details retrieved successfully",
  "data": {
    "alreadyActivated": false,
    "warranty": {
      "id": "warranty-uuid",
      "customerName": "John Smith",
      "companyName": "ABC Motors",
      "vehicle": "Toyota Camry",
      "vinNumber": "1HGBH41JXMN109186",
      "registrationNumber": "ABC123",
      "installationDate": "2024-12-20",
      "installerName": "Mike Johnson",
      "generatorSerialNumber": "GEN123456",
      "status": "PENDING_CUSTOMER_ACTIVATION"
    },
    "tokenExpiresAt": "2025-01-28T10:00:00Z"
  }
}
```

### Get Warranty Terms

```http
GET /api/v1/customer/activate/{token}/terms
```

**Response:**
```json
{
  "success": true,
  "message": "Warranty terms retrieved successfully",
  "data": {
    "warrantyId": "warranty-uuid",
    "terms": {
      "warrantyName": "ERPS Standard Warranty",
      "description": "Electronic Rust Protection System Warranty",
      "termsAndConditions": "Full terms and conditions text...",
      "revision": "1.0"
    }
  }
}
```

### Accept Terms and Activate

```http
POST /api/v1/customer/activate/{token}/accept
Content-Type: application/json

{
  "acceptTerms": true,
  "customerSignature": "John Smith"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Warranty activated successfully! Your ERPS warranty is now active.",
  "data": {
    "warranty": {
      "id": "warranty-uuid",
      "customerName": "John Smith",
      "vehicle": "Toyota Camry",
      "vinNumber": "1HGBH41JXMN109186",
      "status": "ACTIVE",
      "isActive": true,
      "activatedAt": "2024-12-29T12:00:00Z",
      "inspectionDueDate": "2025-12-20"
    },
    "nextSteps": {
      "message": "Your warranty is now active. Remember to complete your annual inspection to maintain coverage.",
      "inspectionDueDate": "2025-12-20",
      "reminderNote": "You will receive a reminder email 30 days before your inspection is due."
    }
  }
}
```

### Resend Activation Email (Authenticated)

```http
POST /api/v1/customer/warranties/{warrantyId}/resend-activation
Authorization: Bearer <token>
```

---

## ERPS Admin Override Functions

### Manual Warranty Verification

Used when installer has left the organization before verifying.

```http
POST /api/v1/erps-admin/warranties/{warrantyId}/verify
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "reason": "Installer Mike Johnson has left the organization",
  "notes": "Verified based on photo evidence and customer confirmation",
  "skipCustomerNotification": false
}
```

**Response:**
```json
{
  "success": true,
  "message": "Warranty manually verified by ERPS Admin. Customer notification sent.",
  "data": {
    "warranty": { ... },
    "override": {
      "performedBy": "admin@erps.com.au",
      "performedAt": "2024-12-29T14:00:00Z",
      "reason": "Installer Mike Johnson has left the organization",
      "isManualOverride": true
    }
  }
}
```

### Manual Warranty Activation

Skip customer terms acceptance.

```http
POST /api/v1/erps-admin/warranties/{warrantyId}/activate
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "reason": "Customer unable to access email, verified via phone",
  "notes": "Customer confirmed acceptance verbally"
}
```

### Manual Inspection Verification

```http
POST /api/v1/erps-admin/inspections/{inspectionId}/verify
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "reason": "Inspector has left the organization",
  "notes": "Verified based on inspection photos and checklist"
}
```

### Update User Role

Change user from Staff to Installer or vice versa.

```http
PUT /api/v1/erps-admin/users/{userId}/role
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "partnerRole": "ACCOUNT_INSTALLER",
  "mobileNumber": "+61400123456",
  "isAccreditedInstaller": true,
  "reason": "User completed installer training"
}
```

### Reassign User to Different Account

```http
PUT /api/v1/erps-admin/users/{userId}/reassign
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "newPartnerAccountId": "new-account-uuid",
  "reason": "User transferred to new store location"
}
```

### Get Audit History

```http
GET /api/v1/erps-admin/warranties/{warrantyId}/audit-history
Authorization: Bearer <admin-token>
```

**Response:**
```json
{
  "success": true,
  "message": "Audit history retrieved successfully",
  "data": {
    "warrantyId": "warranty-uuid",
    "totalEntries": 5,
    "auditHistory": [
      {
        "id": "audit-uuid",
        "actionType": "ADMIN_OVERRIDE_VERIFY",
        "recordType": "WARRANTY",
        "statusBefore": "SUBMITTED",
        "statusAfter": "PENDING_CUSTOMER_ACTIVATION",
        "performedAt": "2024-12-29T14:00:00Z",
        "reason": "Installer has left the organization",
        "performedByUser": {
          "id": "admin-uuid",
          "email": "admin@erps.com.au",
          "fullName": "Admin User",
          "role": "ERPS_ADMIN"
        }
      }
    ]
  }
}
```

---

## Annual Inspection Flow

### Create Inspection

```http
POST /api/v1/inspections
Authorization: Bearer <token>
Content-Type: application/json

{
  "warrantyId": "warranty-uuid",
  "inspectorId": "inspector-uuid",
  "inspectionDate": "2024-12-29",
  "checklist": {
    "generatorMountedCorrectly": true,
    "redLightIlluminated": true,
    "couplersSecure": true,
    "roofTurretInspected": true,
    "pillarsInspected": true,
    "sillsInspected": true,
    "guardsInspected": true,
    "innerGuardsInspected": true,
    "underBonnetInspected": true,
    "firewallInspected": true,
    "bootInspected": true,
    "underBodyInspected": true,
    "ownerAdvisedOfDamage": true,
    "ownerUnderstandsOperation": true
  },
  "corrosionFound": false,
  "photos": [...]
}
```

### Submit Inspection

```http
POST /api/v1/inspections/{inspectionId}/submit
Authorization: Bearer <token>
```

### Inspector Verification (Public)

```http
POST /api/v1/verify-inspection/{token}
Content-Type: application/json

{
  "action": "CONFIRM"
}
```

---

## API Endpoints Reference

### Authentication
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/login` | No | User login |
| POST | `/auth/register` | No | User registration |
| POST | `/auth/forgot-password` | No | Request password reset |
| POST | `/auth/reset-password` | No | Reset password |

### Warranties
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/warranties` | Yes | Create warranty draft |
| GET | `/warranties` | Yes | List warranties |
| GET | `/warranties/{id}` | Yes | Get warranty details |
| PUT | `/warranties/{id}` | Yes | Update warranty draft |
| GET | `/warranties/{id}/validate` | Yes | Validate for submission |
| POST | `/warranties/{id}/submit` | Yes | Submit for verification |
| DELETE | `/warranties/{id}` | Yes | Delete warranty |

### Warranty Verification (Public)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/verify-warranty/{token}` | No | Get verification details |
| POST | `/verify-warranty/{token}` | No | Confirm/decline verification |

### Customer Activation (Public)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/customer/activate/{token}` | No | Get activation details |
| GET | `/customer/activate/{token}/terms` | No | Get warranty terms |
| POST | `/customer/activate/{token}/accept` | No | Accept terms & activate |
| POST | `/customer/warranties/{id}/resend-activation` | Yes | Resend activation email |

### Inspections
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/inspections` | Yes | Create inspection |
| GET | `/inspections` | Yes | List inspections |
| GET | `/inspections/{id}` | Yes | Get inspection details |
| POST | `/inspections/{id}/submit` | Yes | Submit for verification |

### Inspection Verification (Public)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/verify-inspection/{token}` | No | Get verification details |
| POST | `/verify-inspection/{token}` | No | Confirm/decline verification |

### ERPS Admin
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/erps-admin/warranties/{id}/verify` | Admin | Manual warranty verification |
| POST | `/erps-admin/warranties/{id}/activate` | Admin | Manual warranty activation |
| POST | `/erps-admin/inspections/{id}/verify` | Admin | Manual inspection verification |
| PUT | `/erps-admin/users/{id}/role` | Admin | Update user role |
| PUT | `/erps-admin/users/{id}/reassign` | Admin | Reassign user to account |
| GET | `/erps-admin/warranties/{id}/audit-history` | Admin | Get warranty audit trail |
| GET | `/erps-admin/inspections/{id}/audit-history` | Admin | Get inspection audit trail |

### Partner Account Management
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/admin/partner-accounts` | Admin | Create partner account |
| GET | `/admin/partner-accounts` | Admin | List partner accounts |
| GET | `/admin/partner-accounts/{id}` | Yes | Get partner account |
| PUT | `/admin/partner-accounts/{id}` | Yes | Update partner account |
| POST | `/admin/partner-accounts/{id}/users` | Yes | Create partner user |
| GET | `/admin/partner-accounts/{id}/users` | Yes | List partner users |

---

## Status Codes & States

### Warranty Status Flow

```
DRAFT → SUBMITTED → PENDING_CUSTOMER_ACTIVATION → ACTIVE
                  ↘ REJECTED (can resubmit)
```

| Status | Description | Next Actions |
|--------|-------------|--------------|
| `DRAFT` | Being created, incomplete | Edit, Upload Photos, Submit |
| `SUBMITTED` | Awaiting installer verification | Installer: Confirm/Decline |
| `PENDING_CUSTOMER_ACTIVATION` | Installer verified, awaiting customer | Customer: Accept Terms |
| `ACTIVE` | Fully activated warranty | View, Schedule Inspection |
| `REJECTED` | Installer declined | Edit, Resubmit |
| `EXPIRED` | Warranty expired | N/A |
| `CANCELLED` | Warranty cancelled | N/A |

### Inspection Status Flow

```
DRAFT → SUBMITTED → VERIFIED
                  ↘ REJECTED (can resubmit)
```

---

## Error Handling

### Error Response Format

```json
{
  "success": false,
  "message": "Error description",
  "error": "ERROR_CODE",
  "details": ["Additional details if available"]
}
```

### Common Error Codes

| HTTP Code | Error | Description |
|-----------|-------|-------------|
| 400 | `VALIDATION_ERROR` | Invalid request data |
| 401 | `UNAUTHORIZED` | Missing or invalid token |
| 403 | `FORBIDDEN` | Insufficient permissions |
| 404 | `NOT_FOUND` | Resource not found |
| 409 | `CONFLICT` | Resource already exists |
| 422 | `UNPROCESSABLE_ENTITY` | Business rule violation |
| 500 | `INTERNAL_ERROR` | Server error |

### Validation Errors

```json
{
  "success": false,
  "message": "Submission requirements not met",
  "details": [
    "Installer must be selected",
    "Minimum 3 photos required for submission"
  ]
}
```

---

## Token Expiry Times

| Token Type | Expiry | Purpose |
|------------|--------|---------|
| JWT Auth Token | 24 hours | API authentication |
| Installer Verification | 60 days | SMS verification link |
| Customer Activation | 30 days | Email activation link |

---

## Frontend Implementation Notes

### 1. Warranty Creation Page
- Form with all required fields
- Photo upload (minimum 3 photos)
- Installer dropdown (filtered by partner account)
- Corrosion declaration checkbox
- Save as draft functionality

### 2. Warranty Submission
- Validate before submission
- Show validation errors
- Confirm submission dialog
- Display "SMS sent to installer" message

### 3. Installer Verification Page (Public)
- No login required
- Display warranty details (read-only)
- Show photos
- Confirm/Decline buttons
- Decline requires reason

### 4. Customer Activation Page (Public)
- No login required
- Display warranty summary
- Show terms and conditions
- Accept checkbox
- Activate button
- Success confirmation with next steps

### 5. ERPS Admin Dashboard
- Override buttons on warranty/inspection detail pages
- Require reason for all overrides
- Display audit history
- User role management interface

---

## Webhook Events (Future)

For real-time updates, the following webhook events can be implemented:

| Event | Trigger |
|-------|---------|
| `warranty.submitted` | Warranty submitted for verification |
| `warranty.verified` | Installer verified warranty |
| `warranty.activated` | Customer activated warranty |
| `warranty.rejected` | Installer declined warranty |
| `inspection.submitted` | Inspection submitted |
| `inspection.verified` | Inspector verified inspection |
| `reminder.sent` | Reminder email sent |

---

## Support

For API support or questions:
- Email: support@erps.com.au
- Phone: 1800 ERPS (1800 3777)

---

*Document Version: 2.0*
*Last Updated: December 29, 2024*
