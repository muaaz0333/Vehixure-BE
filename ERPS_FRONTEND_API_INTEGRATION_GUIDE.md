# ERPS Frontend API Integration Guide

## Overview

This comprehensive guide provides all API endpoints, request payloads, and response formats for integrating the ERPS Partner Portal frontend with the backend API.

## Base Configuration

### Base URL
```
https://your-api-domain.com/api/v1
```

### Authentication
All endpoints (except verification) require JWT token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

### Content Type
For POST/PUT requests with JSON body:
```
Content-Type: application/json
```

---

## 🔐 Authentication & User Management

### 1. Register New Partner User

**Endpoint:** `POST /api/v1/auth/register`

**Access:** Public (for partner user registration)

#### Request Payload
```json
{
  "email": "installer@test.com",
  "password": "SecurePass123!",
  "fullName": "Test Account Installer",
  "role": "PARTNER_USER",
  "partnerRole": "ACCOUNT_INSTALLER",
  "mobileNumber": "+1234567890",
  "isAccreditedInstaller": true,
  "installerCertificationNumber": "INST-2024-001",
  "isAuthorisedInspector": false,
  "inspectorCertificationNumber": null
}
```

#### Field Descriptions
| Field | Type | Required | Description | Valid Values |
|-------|------|----------|-------------|--------------|
| `email` | string | ✅ | User email (must be unique) | Valid email format |
| `password` | string | ✅ | User password | Minimum 6 characters |
| `fullName` | string | ❌ | User's full name | Any name |
| `role` | string | ✅ | System role | `PARTNER_USER` |
| `partnerRole` | string | ✅ | Partner role | `ACCOUNT_ADMIN`, `ACCOUNT_STAFF`, `ACCOUNT_INSTALLER` |
| `mobileNumber` | string | ❌ | Mobile number (required for installers) | Valid phone format |
| `isAccreditedInstaller` | boolean | ❌ | Is accredited installer | `true`, `false` |
| `installerCertificationNumber` | string | ❌ | Installer certification | Any certification number |
| `isAuthorisedInspector` | boolean | ❌ | Is authorized inspector | `true`, `false` |
| `inspectorCertificationNumber` | string | ❌ | Inspector certification | Any certification number |

#### Success Response (201)
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "uuid-user-id",
      "email": "installer@test.com",
      "fullName": "Test Account Installer",
      "role": "PARTNER_USER",
      "partnerRole": "ACCOUNT_INSTALLER",
      "mobileNumber": "+1234567890",
      "isAccreditedInstaller": true,
      "installerCertificationNumber": "INST-2024-001",
      "isAuthorisedInspector": false,
      "inspectorCertificationNumber": null,
      "isVerified": true,
      "accountStatus": "Active",
      "created": "2024-01-15T10:30:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### Error Response (400)
```json
{
  "success": false,
  "message": "User with this email already exists",
  "errors": [
    {
      "field": "email",
      "message": "Email already registered"
    }
  ]
}
```

---

### 2. User Login

**Endpoint:** `POST /api/v1/auth/login`

**Access:** Public

#### Request Payload
```json
{
  "email": "installer@test.com",
  "password": "SecurePass123!"
}
```

#### Success Response (200)
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "uuid-user-id",
      "email": "installer@test.com",
      "fullName": "Test Account Installer",
      "role": "PARTNER_USER",
      "partnerRole": "ACCOUNT_INSTALLER",
      "partnerAccountId": "uuid-partner-account-id",
      "mobileNumber": "+1234567890",
      "isAccreditedInstaller": true,
      "isAuthorisedInspector": false
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": "24h"
  }
}
```

#### Error Response (401)
```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

---

### 3. Get Current User

**Endpoint:** `GET /api/v1/auth/me`

**Access:** Authenticated users only

#### Request Headers
```
Authorization: Bearer <jwt_token>
```

#### Success Response (200)
```json
{
  "success": true,
  "message": "Current user retrieved successfully",
  "data": {
    "user": {
      "id": "uuid-user-id",
      "email": "installer@test.com",
      "fullName": "Test Account Installer",
      "dob": "1990-01-15T00:00:00.000Z",
      "phone": "+1234567890",
      "mobileNumber": "+1234567890",
      "role": "PARTNER_USER",
      "partnerRole": "ACCOUNT_INSTALLER",
      "partnerAccountId": "uuid-partner-account-id",
      "isVerified": true,
      "isEmailVerified": true,
      "isPhoneVerified": true,
      "isBlocked": false,
      "accountStatus": "Active",
      "isAccreditedInstaller": true,
      "isAuthorisedInspector": false,
      "installerCertificationNumber": "INST-2024-001",
      "inspectorCertificationNumber": null,
      "installerCertificationDate": "2024-01-01T00:00:00.000Z",
      "inspectorCertificationDate": null,
      "languagePreference": "en",
      "isAllowedNotification": true,
      "created": "2024-01-15T10:30:00.000Z",
      "modified": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

#### Error Response (401)
```json
{
  "success": false,
  "message": "User not authenticated"
}
```

#### Error Response (403)
```json
{
  "success": false,
  "message": "User account is blocked"
}
```

#### Error Response (404)
```json
{
  "success": false,
  "message": "User not found"
}
```

---

### 4. Get All Partner Users (ERPS Admin Only)

**Endpoint:** `GET /api/v1/auth/admin/partner-users`

**Access:** ERPS Admin only

#### Query Parameters
```
GET /api/v1/auth/admin/partner-users?page=1&limit=10&search=installer&role=ACCOUNT_INSTALLER
```

| Parameter | Type | Required | Description | Default |
|-----------|------|----------|-------------|---------|
| `page` | number | ❌ | Page number | 1 |
| `limit` | number | ❌ | Items per page (max 100) | 10 |
| `search` | string | ❌ | Search in name, email | - |
| `role` | string | ❌ | Filter by partner role | - |

#### Success Response (200)
```json
{
  "success": true,
  "message": "Partner users retrieved successfully",
  "data": [
    {
      "id": "uuid-user-id-1",
      "email": "admin@partner1.com",
      "fullName": "John Smith",
      "role": "PARTNER_USER",
      "partnerRole": "ACCOUNT_ADMIN",
      "partnerAccountId": "uuid-partner-account-1",
      "partnerAccount": {
        "id": "uuid-partner-account-1",
        "businessName": "ABC Auto Services"
      },
      "accountStatus": "Active",
      "created": "2024-01-15T10:30:00.000Z"
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

### 5. Admin Impersonation (Login As)

**Endpoint:** `POST /api/v1/auth/admin/login-as`

**Access:** ERPS Admin only

#### Request Payload
```json
{
  "userId": "uuid-user-id"
}
```

#### Success Response (200)
```json
{
  "success": true,
  "message": "Impersonation successful",
  "data": {
    "user": {
      "id": "uuid-user-id",
      "email": "partner@test.com",
      "fullName": "Partner User",
      "role": "PARTNER_USER",
      "partnerRole": "ACCOUNT_ADMIN",
      "partnerAccountId": "uuid-partner-account-id"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "impersonatedBy": "admin@erps.com"
  }
}
```

---

## 🏢 Partner Account Management

### 1. Create Partner Account

**Endpoint:** `POST /api/v1/admin/partner-accounts`

**Access:** ERPS Admin only

#### Request Payload
```json
{
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
  "adminUserEmail": "admin@abcauto.com.au",
  "adminUserPassword": "SecurePassword123!",
  "adminUserFullName": "John Smith",
  "adminUserPhone": "+61 2 1234 5678",
  "adminUserMobile": "+61 412 345 678"
}
```

#### Field Descriptions
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `businessName` | string | ✅ | Business/company name |
| `contactPerson` | string | ✅ | Primary business contact |
| `streetAddress` | string | ❌ | Business street address |
| `city` | string | ❌ | Business city |
| `state` | string | ❌ | Business state/province |
| `postcode` | string | ❌ | Business postal code |
| `country` | string | ❌ | Business country |
| `phone` | string | ❌ | Business phone number |
| `faxNumber` | string | ❌ | Business fax number |
| `email` | string | ❌ | Business email address |
| `productsSold` | string | ❌ | Description of products sold |
| `buyPrice` | string | ❌ | Price category (`E1`, `E2`, `Distributor`, etc.) |
| `adminUserEmail` | string | ✅ | Admin login email (must be unique) |
| `adminUserPassword` | string | ✅ | Admin login password |
| `adminUserFullName` | string | ❌ | Admin user's full name |
| `adminUserPhone` | string | ❌ | Admin user's phone number |
| `adminUserMobile` | string | ❌ | Admin user's mobile number |

#### Success Response (201)
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
      "modified": "2024-01-15T10:30:00.000Z"
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

---

### 2. Get All Partner Accounts

**Endpoint:** `GET /api/v1/admin/partner-accounts`

**Access:** ERPS Admin only

#### Query Parameters
```
GET /api/v1/admin/partner-accounts?page=1&limit=10&search=ABC&status=Active
```

| Parameter | Type | Required | Description | Default |
|-----------|------|----------|-------------|---------|
| `page` | number | ❌ | Page number | 1 |
| `limit` | number | ❌ | Items per page (max 100) | 10 |
| `search` | string | ❌ | Search in business name, contact person | - |
| `status` | string | ❌ | Filter by account status | - |

#### Success Response (200)
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

### 3. Get Partner Account by ID

**Endpoint:** `GET /api/v1/admin/partner-accounts/:accountId`

**Access:** ERPS Admin (any account) | Partner Users (own account only)

#### Success Response (200)
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
    "modified": "2024-01-15T10:30:00.000Z"
  }
}
```

---

### 4. Update Partner Account

**Endpoint:** `PUT /api/v1/admin/partner-accounts/:accountId`

**Access:** ERPS Admin (any account) | Account Admin (own account only)

#### Request Payload
```json
{
  "businessName": "ABC Auto Services Updated Pty Ltd",
  "contactPerson": "John Smith Jr",
  "streetAddress": "456 New Street",
  "city": "Melbourne",
  "state": "VIC",
  "postcode": "3000",
  "phone": "+61 3 9876 5432",
  "email": "newcontact@abcauto.com.au",
  "accountStatus": "Active"
}
```

#### Success Response (200)
```json
{
  "success": true,
  "message": "Partner account updated successfully",
  "data": {
    "id": "uuid-partner-account-id",
    "businessName": "ABC Auto Services Updated Pty Ltd",
    "contactPerson": "John Smith Jr",
    "streetAddress": "456 New Street",
    "city": "Melbourne",
    "state": "VIC",
    "postcode": "3000",
    "phone": "+61 3 9876 5432",
    "email": "newcontact@abcauto.com.au",
    "accountStatus": "Active",
    "modified": "2024-01-15T11:45:00.000Z"
  }
}
```

---

### 5. Create Partner User

**Endpoint:** `POST /api/v1/admin/partner-accounts/:accountId/users`

**Access:** ERPS Admin (any account) | Account Admin (own account only)

#### Request Payload
```json
{
  "email": "staff@abcauto.com.au",
  "password": "SecurePassword123!",
  "partnerRole": "ACCOUNT_STAFF",
  "fullName": "Jane Doe",
  "phone": "+61 2 1234 5680",
  "mobileNumber": "+61 412 345 680",
  "isAccreditedInstaller": false,
  "isAuthorisedInspector": false,
  "installerCertificationNumber": null,
  "inspectorCertificationNumber": null
}
```

#### Success Response (201)
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
    "accountStatus": "Active",
    "created": "2024-01-15T12:00:00.000Z"
  }
}
```

---

### 6. Get Partner Users

**Endpoint:** `GET /api/v1/admin/partner-accounts/:accountId/users`

**Access:** ERPS Admin (any account) | Account Admin (own account only)

#### Query Parameters
```
GET /api/v1/admin/partner-accounts/:accountId/users?role=ACCOUNT_STAFF
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `role` | string | ❌ | Filter by partner role |

#### Success Response (200)
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
    }
  ]
}
```

---

## 📋 Warranty Management

### 1. Create Warranty Registration

**Endpoint:** `POST /api/v1/warranties`

**Access:** Account Admin | Account Staff

#### Request Payload
```json
{
  "vehicleVin": "1HGBH41JXMN109186",
  "vehicleMake": "Toyota",
  "vehicleModel": "Camry",
  "vehicleYear": 2024,
  "vehicleColor": "White",
  "ownerName": "Michael Johnson",
  "ownerEmail": "michael@example.com",
  "ownerPhone": "+61 412 345 678",
  "ownerAddress": "456 Oak Street, Melbourne, VIC 3000",
  "installationDate": "2024-01-15",
  "installerName": "John Smith",
  "installerId": "uuid-installer-user-id",
  "installationLocation": "ABC Auto Services",
  "warrantyPeriod": 12,
  "notes": "Standard installation completed successfully"
}
```

#### Field Descriptions
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `vehicleVin` | string | ✅ | Vehicle identification number |
| `vehicleMake` | string | ✅ | Vehicle manufacturer |
| `vehicleModel` | string | ✅ | Vehicle model |
| `vehicleYear` | number | ✅ | Vehicle year |
| `vehicleColor` | string | ❌ | Vehicle color |
| `ownerName` | string | ✅ | Vehicle owner name |
| `ownerEmail` | string | ✅ | Vehicle owner email |
| `ownerPhone` | string | ✅ | Vehicle owner phone |
| `ownerAddress` | string | ❌ | Vehicle owner address |
| `installationDate` | string | ✅ | Installation date (YYYY-MM-DD) |
| `installerName` | string | ✅ | Name of installer |
| `installerId` | string | ✅ | UUID of installer user |
| `installationLocation` | string | ❌ | Installation location |
| `warrantyPeriod` | number | ❌ | Warranty period in months (default: 12) |
| `notes` | string | ❌ | Additional notes |

#### Success Response (201)
```json
{
  "success": true,
  "message": "Warranty registration created successfully",
  "data": {
    "id": "uuid-warranty-id",
    "vehicleVin": "1HGBH41JXMN109186",
    "vehicleMake": "Toyota",
    "vehicleModel": "Camry",
    "vehicleYear": 2024,
    "vehicleColor": "White",
    "ownerName": "Michael Johnson",
    "ownerEmail": "michael@example.com",
    "ownerPhone": "+61 412 345 678",
    "ownerAddress": "456 Oak Street, Melbourne, VIC 3000",
    "installationDate": "2024-01-15T00:00:00.000Z",
    "installerName": "John Smith",
    "installerId": "uuid-installer-user-id",
    "installationLocation": "ABC Auto Services",
    "warrantyPeriod": 12,
    "warrantyExpiryDate": "2025-01-15T00:00:00.000Z",
    "verificationStatus": "DRAFT",
    "notes": "Standard installation completed successfully",
    "partnerAccountId": "uuid-partner-account-id",
    "submittedBy": "uuid-user-id",
    "created": "2024-01-15T10:30:00.000Z",
    "modified": "2024-01-15T10:30:00.000Z"
  }
}
```

---

### 2. Get Warranties List

**Endpoint:** `GET /api/v1/warranties`

**Access:** Account Admin | Account Staff (own account only)

#### Query Parameters
```
GET /api/v1/warranties?page=1&limit=10&status=VERIFIED_ACTIVE&search=Toyota
```

| Parameter | Type | Required | Description | Default |
|-----------|------|----------|-------------|---------|
| `page` | number | ❌ | Page number | 1 |
| `limit` | number | ❌ | Items per page (max 100) | 10 |
| `status` | string | ❌ | Filter by verification status | - |
| `search` | string | ❌ | Search in VIN, make, model, owner name | - |

#### Success Response (200)
```json
{
  "success": true,
  "message": "Warranties retrieved successfully",
  "data": [
    {
      "id": "uuid-warranty-id",
      "vehicleVin": "1HGBH41JXMN109186",
      "vehicleMake": "Toyota",
      "vehicleModel": "Camry",
      "vehicleYear": 2024,
      "ownerName": "Michael Johnson",
      "ownerEmail": "michael@example.com",
      "installationDate": "2024-01-15T00:00:00.000Z",
      "installerName": "John Smith",
      "verificationStatus": "VERIFIED_ACTIVE",
      "warrantyExpiryDate": "2025-01-15T00:00:00.000Z",
      "created": "2024-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5
  }
}
```

---

### 3. Get Warranty by ID

**Endpoint:** `GET /api/v1/warranties/:id`

**Access:** Account Admin | Account Staff (own account only)

#### Success Response (200)
```json
{
  "success": true,
  "message": "Warranty retrieved successfully",
  "data": {
    "id": "uuid-warranty-id",
    "vehicleVin": "1HGBH41JXMN109186",
    "vehicleMake": "Toyota",
    "vehicleModel": "Camry",
    "vehicleYear": 2024,
    "vehicleColor": "White",
    "ownerName": "Michael Johnson",
    "ownerEmail": "michael@example.com",
    "ownerPhone": "+61 412 345 678",
    "ownerAddress": "456 Oak Street, Melbourne, VIC 3000",
    "installationDate": "2024-01-15T00:00:00.000Z",
    "installerName": "John Smith",
    "installerId": "uuid-installer-user-id",
    "installationLocation": "ABC Auto Services",
    "warrantyPeriod": 12,
    "warrantyExpiryDate": "2025-01-15T00:00:00.000Z",
    "verificationStatus": "VERIFIED_ACTIVE",
    "verificationToken": null,
    "verificationTokenExpires": null,
    "verifiedBy": "uuid-installer-user-id",
    "verifiedAt": "2024-01-15T11:00:00.000Z",
    "rejectionReason": null,
    "notes": "Standard installation completed successfully",
    "partnerAccountId": "uuid-partner-account-id",
    "submittedBy": "uuid-user-id",
    "photos": [
      {
        "id": "uuid-photo-id",
        "url": "https://cloudinary.com/photo1.jpg",
        "category": "INSTALLATION_OVERVIEW",
        "description": "Overview of installation"
      }
    ],
    "created": "2024-01-15T10:30:00.000Z",
    "modified": "2024-01-15T11:00:00.000Z"
  }
}
```

---

### 4. Update Warranty

**Endpoint:** `PUT /api/v1/warranties/:id`

**Access:** Account Admin | Account Staff (only if status is DRAFT)

#### Request Payload
```json
{
  "vehicleColor": "Blue",
  "ownerPhone": "+61 412 999 888",
  "notes": "Updated installation notes"
}
```

#### Success Response (200)
```json
{
  "success": true,
  "message": "Warranty updated successfully",
  "data": {
    "id": "uuid-warranty-id",
    "vehicleColor": "Blue",
    "ownerPhone": "+61 412 999 888",
    "notes": "Updated installation notes",
    "modified": "2024-01-15T12:00:00.000Z"
  }
}
```

---

### 5. Submit Warranty for Verification

**Endpoint:** `POST /api/v1/warranties/:id/submit`

**Access:** Account Admin | Account Staff

#### Request Payload
```json
{
  "installerId": "uuid-installer-user-id"
}
```

#### Success Response (200)
```json
{
  "success": true,
  "message": "Warranty submitted for verification. SMS sent to installer.",
  "data": {
    "id": "uuid-warranty-id",
    "verificationStatus": "SUBMITTED_PENDING_VERIFICATION",
    "verificationToken": "secure-random-token",
    "verificationTokenExpires": "2024-01-16T11:00:00.000Z",
    "installerMobile": "+61 412 345 678",
    "smsDeliveryStatus": "SENT"
  }
}
```

---

### 6. Upload Warranty Photos

**Endpoint:** `POST /api/v1/warranties/:id/photos`

**Access:** Account Admin | Account Staff

#### Request Payload (multipart/form-data)
```
Content-Type: multipart/form-data

photos: [File, File, File]  // Multiple image files
categories: ["INSTALLATION_OVERVIEW", "COMPONENT_DETAIL", "WIRING_DETAIL"]
descriptions: ["Overview of installation", "Component detail", "Wiring detail"]
```

#### Success Response (201)
```json
{
  "success": true,
  "message": "Photos uploaded successfully",
  "data": {
    "uploadedPhotos": [
      {
        "id": "uuid-photo-id-1",
        "url": "https://cloudinary.com/photo1.jpg",
        "category": "INSTALLATION_OVERVIEW",
        "description": "Overview of installation",
        "uploadedAt": "2024-01-15T10:45:00.000Z"
      },
      {
        "id": "uuid-photo-id-2",
        "url": "https://cloudinary.com/photo2.jpg",
        "category": "COMPONENT_DETAIL",
        "description": "Component detail",
        "uploadedAt": "2024-01-15T10:45:00.000Z"
      }
    ],
    "totalPhotos": 2
  }
}
```

---

## 🔍 Annual Inspection Management

### 1. Create Annual Inspection

**Endpoint:** `POST /api/v1/inspections`

**Access:** Account Admin | Account Staff

#### Request Payload
```json
{
  "warrantyId": "uuid-warranty-id",
  "inspectionDate": "2025-01-15",
  "inspectorName": "John Smith",
  "inspectorId": "uuid-inspector-user-id",
  "corrosionFound": false,
  "corrosionNotes": null,
  "checklist": {
    "systemOperational": true,
    "connectionsSecure": true,
    "wiringIntact": true,
    "componentsClean": true,
    "noVisibleDamage": true,
    "properGrounding": true,
    "voltageCorrect": true,
    "currentFlow": true,
    "temperatureNormal": true,
    "moistureProtection": true,
    "installationSecure": true,
    "documentationComplete": true,
    "customerSatisfied": true,
    "warrantyValid": true,
    "recommendContinuation": true,
    "additionalWork": false,
    "systemUpgrade": false
  },
  "notes": "Annual inspection completed successfully"
}
```

#### Field Descriptions
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `warrantyId` | string | ✅ | UUID of associated warranty |
| `inspectionDate` | string | ✅ | Inspection date (YYYY-MM-DD) |
| `inspectorName` | string | ✅ | Name of inspector |
| `inspectorId` | string | ✅ | UUID of inspector user |
| `corrosionFound` | boolean | ✅ | Whether corrosion was found |
| `corrosionNotes` | string | ❌ | Notes about corrosion (if found) |
| `checklist` | object | ✅ | 17-item inspection checklist |
| `notes` | string | ❌ | Additional inspection notes |

#### Success Response (201)
```json
{
  "success": true,
  "message": "Annual inspection created successfully",
  "data": {
    "id": "uuid-inspection-id",
    "warrantyId": "uuid-warranty-id",
    "inspectionDate": "2025-01-15T00:00:00.000Z",
    "inspectorName": "John Smith",
    "inspectorId": "uuid-inspector-user-id",
    "corrosionFound": false,
    "corrosionNotes": null,
    "checklistComplete": true,
    "verificationStatus": "DRAFT",
    "warrantyExtendedUntil": null,
    "notes": "Annual inspection completed successfully",
    "partnerAccountId": "uuid-partner-account-id",
    "submittedBy": "uuid-user-id",
    "created": "2024-01-15T10:30:00.000Z"
  }
}
```

---

### 2. Get Inspections List

**Endpoint:** `GET /api/v1/inspections`

**Access:** Account Admin | Account Staff (own account only)

#### Query Parameters
```
GET /api/v1/inspections?page=1&limit=10&status=VERIFIED_ACTIVE&warrantyId=uuid-warranty-id
```

| Parameter | Type | Required | Description | Default |
|-----------|------|----------|-------------|---------|
| `page` | number | ❌ | Page number | 1 |
| `limit` | number | ❌ | Items per page (max 100) | 10 |
| `status` | string | ❌ | Filter by verification status | - |
| `warrantyId` | string | ❌ | Filter by warranty ID | - |

#### Success Response (200)
```json
{
  "success": true,
  "message": "Inspections retrieved successfully",
  "data": [
    {
      "id": "uuid-inspection-id",
      "warrantyId": "uuid-warranty-id",
      "warranty": {
        "vehicleVin": "1HGBH41JXMN109186",
        "vehicleMake": "Toyota",
        "vehicleModel": "Camry",
        "ownerName": "Michael Johnson"
      },
      "inspectionDate": "2025-01-15T00:00:00.000Z",
      "inspectorName": "John Smith",
      "corrosionFound": false,
      "verificationStatus": "VERIFIED_ACTIVE",
      "warrantyExtendedUntil": "2026-01-15T00:00:00.000Z",
      "created": "2024-01-15T10:30:00.000Z"
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

### 3. Submit Inspection for Verification

**Endpoint:** `POST /api/v1/inspections/:id/submit`

**Access:** Account Admin | Account Staff

#### Request Payload
```json
{
  "inspectorId": "uuid-inspector-user-id"
}
```

#### Success Response (200)
```json
{
  "success": true,
  "message": "Inspection submitted for verification. SMS sent to inspector.",
  "data": {
    "id": "uuid-inspection-id",
    "verificationStatus": "SUBMITTED_PENDING_VERIFICATION",
    "verificationToken": "secure-random-token",
    "verificationTokenExpires": "2024-01-16T11:00:00.000Z",
    "inspectorMobile": "+61 412 345 678",
    "smsDeliveryStatus": "SENT"
  }
}
```

---

## ✅ Verification Endpoints (Public - No Auth Required)

### 1. Get Verification Details

**Endpoint:** `GET /api/v1/verify/:token`

**Access:** Public (token-based)

#### Success Response (200)
```json
{
  "success": true,
  "message": "Verification details retrieved successfully",
  "data": {
    "type": "WARRANTY", // or "INSPECTION"
    "token": "secure-random-token",
    "expiresAt": "2024-01-16T11:00:00.000Z",
    "isExpired": false,
    "record": {
      "id": "uuid-warranty-id",
      "vehicleVin": "1HGBH41JXMN109186",
      "vehicleMake": "Toyota",
      "vehicleModel": "Camry",
      "ownerName": "Michael Johnson",
      "installationDate": "2024-01-15T00:00:00.000Z",
      "installerName": "John Smith",
      "partnerAccount": {
        "businessName": "ABC Auto Services"
      },
      "photos": [
        {
          "url": "https://cloudinary.com/photo1.jpg",
          "category": "INSTALLATION_OVERVIEW",
          "description": "Overview of installation"
        }
      ]
    }
  }
}
```

---

### 2. Process Warranty Verification

**Endpoint:** `POST /api/v1/verify/warranty/:token`

**Access:** Public (token-based)

#### Request Payload
```json
{
  "action": "CONFIRM", // or "DECLINE"
  "rejectionReason": null // Required if action is "DECLINE"
}
```

#### Success Response (200)
```json
{
  "success": true,
  "message": "Warranty verification completed successfully",
  "data": {
    "warrantyId": "uuid-warranty-id",
    "verificationStatus": "VERIFIED_ACTIVE",
    "verifiedBy": "uuid-installer-user-id",
    "verifiedAt": "2024-01-15T11:30:00.000Z",
    "warrantyExpiryDate": "2025-01-15T00:00:00.000Z"
  }
}
```

#### Decline Response (200)
```json
{
  "success": true,
  "message": "Warranty verification declined",
  "data": {
    "warrantyId": "uuid-warranty-id",
    "verificationStatus": "REJECTED_INSTALLER_DECLINED",
    "rejectionReason": "Installation details incorrect",
    "rejectedBy": "uuid-installer-user-id",
    "rejectedAt": "2024-01-15T11:30:00.000Z"
  }
}
```

---

### 3. Process Inspection Verification

**Endpoint:** `POST /api/v1/verify/inspection/:token`

**Access:** Public (token-based)

#### Request Payload
```json
{
  "action": "CONFIRM", // or "DECLINE"
  "rejectionReason": null // Required if action is "DECLINE"
}
```

#### Success Response (200)
```json
{
  "success": true,
  "message": "Inspection verification completed successfully",
  "data": {
    "inspectionId": "uuid-inspection-id",
    "warrantyId": "uuid-warranty-id",
    "verificationStatus": "VERIFIED_ACTIVE",
    "verifiedBy": "uuid-inspector-user-id",
    "verifiedAt": "2024-01-15T11:30:00.000Z",
    "warrantyExtendedUntil": "2026-01-15T00:00:00.000Z"
  }
}
```

---

## 🔧 Admin Verification Management

### 1. Resend Verification SMS

**Endpoint:** `POST /api/v1/verify/resend`

**Access:** ERPS Admin only

#### Request Payload
```json
{
  "recordId": "uuid-warranty-or-inspection-id",
  "recordType": "WARRANTY" // or "INSPECTION"
}
```

#### Success Response (200)
```json
{
  "success": true,
  "message": "Verification SMS resent successfully",
  "data": {
    "recordId": "uuid-warranty-id",
    "recordType": "WARRANTY",
    "newToken": "new-secure-random-token",
    "expiresAt": "2024-01-16T12:00:00.000Z",
    "installerMobile": "+61 412 345 678",
    "smsDeliveryStatus": "SENT"
  }
}
```

---

### 2. Reinstate Lapsed Warranty

**Endpoint:** `POST /api/v1/verify/reinstate`

**Access:** ERPS Admin only

#### Request Payload
```json
{
  "warrantyId": "uuid-warranty-id",
  "reinstatementReason": "Customer completed overdue inspection"
}
```

#### Success Response (200)
```json
{
  "success": true,
  "message": "Warranty reinstated successfully",
  "data": {
    "warrantyId": "uuid-warranty-id",
    "reinstatedBy": "uuid-admin-user-id",
    "reinstatementReason": "Customer completed overdue inspection",
    "reinstatedAt": "2024-01-15T12:00:00.000Z",
    "newExpiryDate": "2025-01-15T00:00:00.000Z",
    "previousLapseDate": "2024-12-15T00:00:00.000Z"
  }
}
```

---

## 📧 Reminder System

### 1. Get Reminder Statistics

**Endpoint:** `GET /api/v1/reminders`

**Access:** ERPS Admin only

#### Success Response (200)
```json
{
  "success": true,
  "message": "Reminder statistics retrieved successfully",
  "data": {
    "summary": {
      "totalActiveWarranties": 150,
      "pendingReminders": 25,
      "inGracePeriod": 8,
      "expiredWarranties": 12
    },
    "reminderBreakdown": {
      "11_MONTH": {
        "pending": 10,
        "sent": 45,
        "failed": 2
      },
      "30_DAY": {
        "pending": 8,
        "sent": 32,
        "failed": 1
      },
      "DUE_DATE": {
        "pending": 7,
        "sent": 28,
        "failed": 0
      }
    },
    "gracePeriodWarranties": [
      {
        "warrantyId": "uuid-warranty-id",
        "vehicleVin": "1HGBH41JXMN109186",
        "ownerName": "Michael Johnson",
        "dueDate": "2024-01-15T00:00:00.000Z",
        "gracePeriodEnds": "2024-02-14T00:00:00.000Z",
        "daysRemaining": 15
      }
    ]
  }
}
```

---

### 2. Manually Process Reminders

**Endpoint:** `POST /api/v1/reminders/process`

**Access:** ERPS Admin only

#### Success Response (200)
```json
{
  "success": true,
  "message": "Reminder processing completed successfully",
  "data": {
    "processedAt": "2024-01-15T12:00:00.000Z",
    "remindersSent": {
      "11_MONTH": 5,
      "30_DAY": 3,
      "DUE_DATE": 2
    },
    "failedDeliveries": 0,
    "warrantiesLapsed": 1,
    "totalProcessed": 10
  }
}
```

---

## 📊 Dashboard Management

### 1. Get Dashboard Summary

**Endpoint:** `GET /api/v1/dashboard/summary`

**Access:** Authenticated users (data filtered by partner account for non-admin users)

#### Success Response (200)
```json
{
  "success": true,
  "message": "Dashboard summary retrieved successfully",
  "data": {
    "warranties": {
      "total": 21,
      "active": 4,
      "withCorrosion": 2,
      "pendingVerification": 3
    },
    "inspections": {
      "total": 14,
      "completed": 3,
      "pendingVerification": 5
    },
    "users": {
      "totalPartnerUsers": 10,
      "totalInstallers": 4
    },
    "partnerAccounts": 4,
    "pendingVerifications": 8
  }
}
```

---

### 2. Get Comprehensive Dashboard Statistics

**Endpoint:** `GET /api/v1/dashboard/stats`

**Access:** Authenticated users (data filtered by partner account for non-admin users)

#### Success Response (200)
```json
{
  "success": true,
  "message": "Dashboard statistics retrieved successfully",
  "data": {
    "summary": {
      "totalWarranties": 21,
      "totalInspections": 14,
      "totalCorrosionCases": 2,
      "pendingVerifications": 8
    },
    "lastWarranties": [
      {
        "id": "uuid-warranty-id",
        "ownerName": "John Smith",
        "vehicle": "Toyota Camry",
        "vinNumber": "1HGBH41JXMN109186",
        "installerName": "David Brown",
        "dateInstalled": "2024-12-25",
        "verificationStatus": "VERIFIED",
        "status": "ACTIVE",
        "corrosionFound": false,
        "created": "2025-12-25T09:22:29.527Z"
      }
    ],
    "corrosionWarranties": [
      {
        "id": "uuid-warranty-id",
        "ownerName": "Robert Johnson",
        "vehicle": "Mazda BT-50",
        "vinNumber": "MM1XXXTTGXDA34567",
        "installerName": "David Brown",
        "dateInstalled": "2024-02-28",
        "corrosionDetails": "Significant rust damage on multiple panels",
        "created": "2025-12-25T03:18:20.185Z"
      }
    ],
    "lastInspections": [
      {
        "id": "uuid-inspection-id",
        "warrantyId": "uuid-warranty-id",
        "inspectionDate": "2024-12-25",
        "corrosionFound": true,
        "verificationStatus": "VERIFIED",
        "verifiedAt": "2025-12-25T11:49:36.989Z",
        "warrantyExtendedUntil": "2025-12-25",
        "warranty": {
          "ownerName": "Muaaz Ahmad",
          "vehicle": "Toyota Camry",
          "vinNumber": "SQA1234567890TEST"
        }
      }
    ],
    "topAccountStaff": [
      {
        "id": "uuid-user-id",
        "fullName": "Emma Wilson",
        "email": "staff1@sydneyauto.com.au",
        "partnerBusinessName": "Sydney Auto Protection",
        "warrantyCount": 15
      }
    ],
    "topInstallers": [
      {
        "id": "uuid-user-id",
        "fullName": "David Brown",
        "email": "installer1@sydneyauto.com.au",
        "mobileNumber": "+61-400-234-567",
        "isAccreditedInstaller": true,
        "isAuthorisedInspector": true,
        "partnerBusinessName": "Sydney Auto Protection",
        "installationCount": 18,
        "inspectionCount": 3,
        "totalWork": 21
      }
    ]
  }
}
```

---

### 3. Get Recent Activity

**Endpoint:** `GET /api/v1/dashboard/activity`

**Access:** Authenticated users (data filtered by partner account for non-admin users)

#### Query Parameters
```
GET /api/v1/dashboard/activity?limit=20
```

| Parameter | Type | Required | Description | Default |
|-----------|------|----------|-------------|---------|
| `limit` | number | ❌ | Number of activities to return (max 50) | 20 |

#### Success Response (200)
```json
{
  "success": true,
  "message": "Recent activity retrieved successfully",
  "data": {
    "activities": [
      {
        "type": "WARRANTY",
        "id": "uuid-warranty-id",
        "title": "John Smith - Toyota Camry",
        "subtitle": "VIN: 1HGBH41JXMN109186",
        "status": "VERIFIED",
        "created": "2025-12-25T09:22:29.527Z",
        "modified": "2025-12-25T11:30:00.000Z"
      },
      {
        "type": "INSPECTION",
        "id": "uuid-inspection-id",
        "title": "Annual Inspection",
        "subtitle": "Warranty ID: uuid-warranty-id",
        "status": "VERIFIED",
        "corrosionFound": false,
        "created": "2025-12-25T10:15:00.000Z",
        "modified": "2025-12-25T11:45:00.000Z"
      }
    ],
    "total": 2
  }
}
```

---

## ✔️ Validation Endpoints

### 1. Validate Photos

**Endpoint:** `POST /api/v1/validation/photos`

**Access:** Account Admin | Account Staff

#### Request Payload
```json
{
  "photos": [
    {
      "category": "INSTALLATION_OVERVIEW",
      "fileSize": 2048576,
      "fileType": "image/jpeg"
    },
    {
      "category": "COMPONENT_DETAIL",
      "fileSize": 1536000,
      "fileType": "image/png"
    }
  ]
}
```

#### Success Response (200)
```json
{
  "success": true,
  "message": "Photo validation completed",
  "data": {
    "validPhotos": 2,
    "invalidPhotos": 0,
    "validationResults": [
      {
        "category": "INSTALLATION_OVERVIEW",
        "isValid": true,
        "errors": []
      },
      {
        "category": "COMPONENT_DETAIL",
        "isValid": true,
        "errors": []
      }
    ],
    "requirements": {
      "minimumPhotos": 3,
      "maxFileSize": 5242880,
      "allowedTypes": ["image/jpeg", "image/png", "image/webp"],
      "requiredCategories": ["INSTALLATION_OVERVIEW", "COMPONENT_DETAIL", "WIRING_DETAIL"]
    }
  }
}
```

---

### 2. Validate Inspection Checklist

**Endpoint:** `POST /api/v1/validation/checklist`

**Access:** Account Admin | Account Staff

#### Request Payload
```json
{
  "checklist": {
    "systemOperational": true,
    "connectionsSecure": true,
    "wiringIntact": true,
    "componentsClean": true,
    "noVisibleDamage": true,
    "properGrounding": true,
    "voltageCorrect": true,
    "currentFlow": true,
    "temperatureNormal": true,
    "moistureProtection": true,
    "installationSecure": true,
    "documentationComplete": true,
    "customerSatisfied": true,
    "warrantyValid": true,
    "recommendContinuation": true,
    "additionalWork": false,
    "systemUpgrade": false
  }
}
```

#### Success Response (200)
```json
{
  "success": true,
  "message": "Checklist validation completed",
  "data": {
    "isValid": true,
    "completedItems": 17,
    "totalItems": 17,
    "missingItems": [],
    "validationErrors": []
  }
}
```

---

## 🚨 Error Handling

### Common HTTP Status Codes

| Status Code | Description | Example Response |
|-------------|-------------|------------------|
| `200` | Success | Request completed successfully |
| `201` | Created | Resource created successfully |
| `400` | Bad Request | Validation errors, missing fields |
| `401` | Unauthorized | Invalid or missing JWT token |
| `403` | Forbidden | Insufficient permissions |
| `404` | Not Found | Resource doesn't exist |
| `409` | Conflict | Duplicate resource (email, VIN, etc.) |
| `422` | Unprocessable Entity | Business logic validation failed |
| `500` | Internal Server Error | Server-side error |

### Error Response Format

#### Validation Error (400)
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Email is required"
    },
    {
      "field": "password",
      "message": "Password must be at least 6 characters"
    }
  ]
}
```

#### Authorization Error (401)
```json
{
  "success": false,
  "message": "Invalid or expired token"
}
```

#### Permission Error (403)
```json
{
  "success": false,
  "message": "Insufficient permissions to access this resource"
}
```

#### Not Found Error (404)
```json
{
  "success": false,
  "message": "Warranty not found"
}
```

#### Business Logic Error (422)
```json
{
  "success": false,
  "message": "Cannot update warranty in VERIFIED_ACTIVE status"
}
```

---

## 🔐 Security Considerations

### JWT Token Structure
```json
{
  "userId": "uuid-user-id",
  "email": "user@example.com",
  "role": "PARTNER_USER",
  "partnerRole": "ACCOUNT_ADMIN",
  "partnerAccountId": "uuid-partner-account-id",
  "iat": 1642248000,
  "exp": 1642334400
}
```

### Rate Limiting
- **Authentication endpoints**: 5 requests per minute per IP
- **General API endpoints**: 100 requests per minute per user
- **File upload endpoints**: 10 requests per minute per user

### Input Validation
- All string inputs are sanitized to prevent XSS
- SQL injection protection via parameterized queries
- File upload validation (type, size, content)
- Email format validation
- Phone number format validation

---

## 📱 Frontend Integration Examples

### React/JavaScript Example

#### Authentication Hook
```javascript
// useAuth.js
import { useState, useEffect } from 'react';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('authToken'));

  const login = async (email, password) => {
    try {
      const response = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setToken(data.data.token);
        setUser(data.data.user);
        localStorage.setItem('authToken', data.data.token);
        return { success: true, user: data.data.user };
      } else {
        return { success: false, message: data.message };
      }
    } catch (error) {
      return { success: false, message: 'Network error' };
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('authToken');
  };

  const getCurrentUser = async () => {
    if (!token) return { success: false, message: 'No token available' };
    
    try {
      const response = await fetch('/api/v1/auth/me', {
        method: 'GET',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setUser(data.data.user);
        return { success: true, user: data.data.user };
      } else {
        return { success: false, message: data.message };
      }
    } catch (error) {
      return { success: false, message: 'Network error' };
    }
  };

  return { user, token, login, logout, getCurrentUser };
};
```

#### API Service
```javascript
// apiService.js
class ApiService {
  constructor(baseURL = '/api/v1') {
    this.baseURL = baseURL;
  }

  async request(endpoint, options = {}) {
    const token = localStorage.getItem('authToken');
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers
      },
      ...options
    };

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, config);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'API request failed');
      }
      
      return data;
    } catch (error) {
      throw error;
    }
  }

  // Warranty methods
  async createWarranty(warrantyData) {
    return this.request('/warranties', {
      method: 'POST',
      body: JSON.stringify(warrantyData)
    });
  }

  async getWarranties(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/warranties?${queryString}`);
  }

  async submitWarranty(warrantyId, installerId) {
    return this.request(`/warranties/${warrantyId}/submit`, {
      method: 'POST',
      body: JSON.stringify({ installerId })
    });
  }

  // Partner account methods
  async createPartnerAccount(accountData) {
    return this.request('/admin/partner-accounts', {
      method: 'POST',
      body: JSON.stringify(accountData)
    });
  }

  async getPartnerAccounts(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/admin/partner-accounts?${queryString}`);
  }

  // User methods
  async getCurrentUser() {
    return this.request('/auth/me');
  }
}

export default new ApiService();
```

#### Warranty Form Component
```javascript
// WarrantyForm.jsx
import React, { useState } from 'react';
import ApiService from './apiService';

const WarrantyForm = () => {
  const [formData, setFormData] = useState({
    vehicleVin: '',
    vehicleMake: '',
    vehicleModel: '',
    vehicleYear: '',
    ownerName: '',
    ownerEmail: '',
    ownerPhone: '',
    installationDate: '',
    installerName: '',
    installerId: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await ApiService.createWarranty(formData);
      console.log('Warranty created:', result.data);
      // Handle success (redirect, show message, etc.)
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="error">{error}</div>}
      
      <input
        type="text"
        name="vehicleVin"
        placeholder="Vehicle VIN"
        value={formData.vehicleVin}
        onChange={handleChange}
        required
      />
      
      <input
        type="text"
        name="vehicleMake"
        placeholder="Vehicle Make"
        value={formData.vehicleMake}
        onChange={handleChange}
        required
      />
      
      {/* Add other form fields */}
      
      <button type="submit" disabled={loading}>
        {loading ? 'Creating...' : 'Create Warranty'}
      </button>
    </form>
  );
};

export default WarrantyForm;
```

---

This comprehensive integration guide provides all the necessary information to integrate your frontend with the ERPS API, including detailed request payloads, response formats, error handling, and practical implementation examples.