# ERPS Postman Collection - Usage Guide

## 📋 Overview

This Postman collection provides complete API testing coverage for the ERPS (Electronic Rust Protection System) Partner Portal, implementing all functionality specified in the ERPS requirements documents.

## 🎯 Collection Features

### ✅ Complete ERPS Workflow Coverage
- **Authentication**: All 4 user role types (ERPS Admin, Account Admin, Account Staff, Account Installer)
- **Partner Management**: Account creation, user management, role-based access control
- **Warranty Registration**: Complete workflow from draft to verification
- **Annual Inspections**: Full inspection process with SMS verification
- **SMS Verification**: Public endpoints for installer/inspector verification
- **Admin Management**: ERPS Admin oversight and governance tools
- **Access Control Testing**: Role-based permission enforcement tests

### 🔐 ERPS Security Compliance
- **Core Principle**: Only installer who performed work can verify via SMS
- **Verification Authority**: SMS-only verification (never through portal)
- **Role Hierarchy**: ERPS Admin > Account Admin > Account Staff/Installer
- **Data Isolation**: Partner account data separation
- **Audit Trail**: Complete verification history tracking

## 📁 Collection Structure

### 1. 🔐 Authentication
- Login endpoints for all user roles
- JWT token management with automatic variable storage
- Role-based authentication testing

### 2. 👑 ERPS Admin Management
- Platform governance endpoints (ERPS Admin only)
- Get all partner users and installers
- Admin impersonation capabilities

### 3. 🏢 Partner Account Management
- Create and manage partner accounts
- User creation and role assignment
- Partner account data management

### 4. 📋 Warranty Registration Workflow
- Complete warranty registration process
- Draft → Submit → Verify workflow
- Photo upload requirements
- Status tracking and validation

### 5. 🔍 Annual Inspection Workflow
- Complete inspection checklist process
- Inspector assignment and verification
- Warranty extension on verification
- Inspection photo requirements

### 6. 📱 SMS Verification (Public Endpoints)
- Public verification endpoints (no auth required)
- Installer/Inspector confirmation process
- Decline workflow with reason tracking
- Token-based secure verification

### 7. 🔧 Admin Verification Management
- Resend verification SMS
- Installer verification history
- Admin oversight tools

### 8. 🧪 Access Control Tests
- Role-based permission testing
- Security boundary validation
- Access denial verification

### 9. 📊 System Status & Reports
- System statistics and health metrics
- Compliance reporting
- Pending verification tracking

## 🚀 Quick Start Guide

### Step 1: Import Collection
1. Open Postman
2. Click "Import" 
3. Select `ERPS_Complete_Postman_Collection.json`
4. Collection will be imported with all endpoints and variables

### Step 2: Set Base URL
1. Go to collection variables
2. Set `baseUrl` to your API server (default: `http://localhost:5050/api/v1`)

### Step 3: Login Users
Run the authentication requests in order:
1. **Login - ERPS Admin** (saves `adminToken`)
2. **Login - Account Admin** (saves `accountAdminToken`) 
3. **Login - Account Staff** (saves `accountStaffToken`)
4. **Login - Account Installer** (saves `accountInstallerToken`)

### Step 4: Test Complete Workflow
Follow the folder structure to test complete workflows:
1. Create partner account (saves `partnerAccountId`)
2. Create partner users
3. Create warranty registration
4. Submit for verification
5. Test SMS verification process
6. Create annual inspection
7. Test inspection verification

## 🔧 Environment Variables

The collection uses these variables (automatically managed):

| Variable | Description | Auto-Set By |
|----------|-------------|-------------|
| `baseUrl` | API base URL | Manual setup |
| `adminToken` | ERPS Admin JWT token | Login - ERPS Admin |
| `accountAdminToken` | Account Admin JWT token | Login - Account Admin |
| `accountStaffToken` | Account Staff JWT token | Login - Account Staff |
| `accountInstallerToken` | Account Installer JWT token | Login - Account Installer |
| `partnerAccountId` | Partner account ID | Create Partner Account |
| `warrantyId` | Warranty registration ID | Create Warranty |
| `inspectionId` | Inspection ID | Create Inspection |
| `verificationToken` | SMS verification token | Manual for testing |

## 📱 SMS Verification Testing

Since SMS verification uses public endpoints accessed via mobile links:

1. **Get Verification Token**: Extract from database or API response
2. **Set Token Variable**: Update `verificationToken` in collection variables
3. **Test Verification**: Use "SMS Verification" folder endpoints
4. **Verify Results**: Check warranty/inspection status changes

## 🧪 Testing Scenarios

### Complete Warranty Registration Flow
```
1. Login - Account Staff
2. Create Warranty Registration (Draft)
3. Upload Warranty Photos
4. Submit Warranty for Verification
5. Get Verification Details (public)
6. Confirm Warranty Verification (public)
7. Verify warranty status = VERIFIED
```

### Complete Annual Inspection Flow
```
1. Login - Account Staff  
2. Create Annual Inspection (Draft)
3. Upload Inspection Photos
4. Submit Inspection for Verification
5. Get Verification Details (public)
6. Confirm Inspection Verification (public)
7. Verify inspection status = VERIFIED
8. Verify warranty extended 12 months
```

### Access Control Testing
```
1. Login - Account Staff
2. Test: Account Staff Access Admin Endpoint (Should Fail - 403)
3. Test: Account Staff Access Own Partner Account (Should Pass - 200)
4. Login - Account Installer
5. Test: Account Installer Access Admin Endpoint (Should Fail - 403)
```

### Decline Workflow Testing
```
1. Create warranty/inspection
2. Submit for verification
3. Get verification details
4. Decline with reason
5. Verify status = REJECTED
6. Verify record unlocked for correction
```

## 🔐 Security Testing

The collection includes comprehensive security tests:

- **Role-based Access Control**: Verify users can only access appropriate endpoints
- **Data Isolation**: Ensure partner users can only see their own data
- **Verification Authority**: Confirm only installers can verify their work
- **SMS-only Verification**: Validate no portal-based verification possible
- **Token Security**: Test JWT token validation and expiry

## 📊 Expected Results

### Successful Authentication
- All 4 user types should login successfully
- JWT tokens automatically saved to variables
- Role information included in token payload

### Access Control Enforcement
- ERPS Admin: Access to all endpoints ✅
- Account Admin: Access to own partner account management ✅
- Account Staff: Access to data entry, denied admin functions ✅
- Account Installer: Access to own work, denied admin functions ✅

### Verification Workflow
- Warranties: DRAFT → SUBMITTED → VERIFIED ✅
- Inspections: DRAFT → SUBMITTED → VERIFIED ✅
- SMS verification: Public endpoints accessible ✅
- Decline workflow: SUBMITTED → REJECTED → Unlocked ✅

### Compliance Requirements
- Only installer who performed work can verify ✅
- Verification via SMS only (never portal) ✅
- Complete audit trail maintained ✅
- Role hierarchy enforced ✅
- Partner data isolation ✅

## 🚨 Troubleshooting

### Common Issues

**401 Unauthorized**
- Check if user is logged in
- Verify JWT token is valid and not expired
- Ensure correct token variable is used

**403 Forbidden** 
- Verify user has correct role for endpoint
- Check partner account access permissions
- Confirm ERPS Admin role for admin endpoints

**404 Not Found**
- Verify API server is running
- Check base URL is correct
- Ensure endpoint paths match implementation

**Verification Token Issues**
- Tokens expire after 24 hours
- Extract fresh token from database/API
- Update `verificationToken` variable

## 📋 ERPS Requirements Compliance

This collection validates complete compliance with ERPS requirements:

### ✅ Core Principle Compliance
> "The person who physically performed the installation must verify the warranty, regardless of who entered the data."

**Validation**: SMS verification endpoints bound to installer ID

### ✅ Verification Authority
> "Verification never occurs inside the portal and can only be overridden by ERPS Admin."

**Validation**: Public verification endpoints, no portal-based verification

### ✅ Role Hierarchy
> "ERPS Admin > Account Admin > Account Staff/Installer"

**Validation**: Access control tests enforce proper role boundaries

### ✅ Record States
> "Draft → Submitted → Verified/Rejected"

**Validation**: Workflow tests validate proper state transitions

### ✅ Audit & Compliance
> "Complete verification history and audit trail"

**Validation**: Admin endpoints provide verification history tracking

## 🎉 Success Criteria

The collection successfully validates:
- ✅ All 4 user roles authenticate correctly
- ✅ Role-based access control enforced
- ✅ Complete warranty registration workflow
- ✅ Complete annual inspection workflow  
- ✅ SMS verification process (public endpoints)
- ✅ Decline and resubmission workflows
- ✅ Admin oversight and management tools
- ✅ Partner account data isolation
- ✅ ERPS security requirements compliance

## 📞 Support

For issues with the collection:
1. Verify API server is running and accessible
2. Check all environment variables are set correctly
3. Ensure test data exists (users, partner accounts, warranty terms)
4. Review API server logs for detailed error information
5. Validate database schema matches ERPS requirements

---

**Collection Status: ✅ COMPLETE AND READY FOR TESTING**

This Postman collection provides comprehensive coverage of all ERPS Partner Portal functionality and validates complete compliance with ERPS requirements documents.