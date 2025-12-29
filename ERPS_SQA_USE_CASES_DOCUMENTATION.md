# ERPS System - SQA Use Cases Documentation

## 📋 Overview

This document provides comprehensive use cases for testing the Electronic Rust Protection System (ERPS) with the provided sample data and Postman collection. The system has been populated with realistic test data to validate all functionality.

## 🎯 System Architecture

### User Roles
1. **ERPS Admin** - System administrator with full access
2. **Partner Account Admin** - Manages partner account and users
3. **Account Staff** - General partner staff member
4. **Account Installer** - Certified installer who can create warranties
5. **Account Inspector** - Certified inspector who can perform annual inspections

### Data Structure
- **3 Partner Accounts** (Sydney, Melbourne, Brisbane)
- **7 Partner Users** (3 Admins, 2 Installers, 1 Inspector, 1 Staff)
- **3 Warranty Terms** (ECO-PRO 10yr, ECO-PRO Lifetime, ERPS 10yr)
- **5 Sample Warranties** (2 verified, 1 submitted, 1 draft, 1 rejected)
- **3 Sample Inspections** (1 verified, 1 submitted, 1 draft)

## 🔐 Authentication Test Cases

### UC-AUTH-001: ERPS Admin Login
**Objective**: Verify ERPS admin can login and access admin functions
**Credentials**: 
- Email: `admin@erps.com`
- Password: `admin123`

**Expected Results**:
- Successful login with JWT token
- Access to admin dashboard
- Ability to view all partner users
- Permission to login as any partner user

### UC-AUTH-002: Partner Admin Login
**Objective**: Verify partner account admin can login and manage their account
**Credentials**:
- Email: `admin@sydneyauto.com.au`
- Password: `password123`

**Expected Results**:
- Successful login with JWT token
- Access to partner account management
- Ability to view account users
- Limited to own partner account data

### UC-AUTH-003: Installer Login
**Objective**: Verify installer can login and create warranties
**Credentials**:
- Email: `installer1@sydneyauto.com.au`
- Password: `password123`

**Expected Results**:
- Successful login with JWT token
- Access to warranty creation
- Ability to submit warranties for verification
- View own created warranties

### UC-AUTH-004: Inspector Login
**Objective**: Verify inspector can login and perform inspections
**Credentials**:
- Email: `inspector1@brisbanecorrosion.com.au`
- Password: `password123`

**Expected Results**:
- Successful login with JWT token
- Access to inspection creation
- Ability to submit inspections for verification
- View own performed inspections

## 👑 Admin Operations Test Cases

### UC-ADMIN-001: Dashboard Statistics
**Objective**: Verify admin dashboard shows correct system statistics
**Prerequisites**: Login as ERPS admin
**Test Steps**:
1. Call GET `/admin/dashboard/stats`
2. Verify response contains user counts and statistics

**Expected Results**:
- Total users count
- Partner users breakdown
- System health metrics

### UC-ADMIN-002: Partner User Management
**Objective**: Verify admin can view and manage all partner users
**Prerequisites**: Login as ERPS admin
**Test Steps**:
1. Call GET `/auth/admin/partner-users`
2. Verify all 7 partner users are returned
3. Check user details and roles

**Expected Results**:
- List of all partner users
- Correct role assignments
- User status information

### UC-ADMIN-003: Admin Login As Feature
**Objective**: Verify admin can login as any partner user
**Prerequisites**: Login as ERPS admin
**Test Steps**:
1. Get partner user ID from user list
2. Call POST `/auth/admin/login-as` with target user ID
3. Verify new token is returned for target user

**Expected Results**:
- New JWT token for target user
- Token allows access to target user's resources
- Audit trail of admin login action

## 📋 Warranty Terms Management Test Cases

### UC-TERMS-001: View Active Warranty Terms
**Objective**: Verify system returns active warranty terms for selection
**Prerequisites**: Login as ERPS admin
**Test Steps**:
1. Call GET `/admin/warranty-terms/active`
2. Verify 3 warranty terms are returned
3. Check each term has required fields

**Expected Results**:
- ECO-PRO - 10 Year Corrosion, 5 Year Product - Rev 8
- ECO-PRO - Limited Lifetime Corrosion, 5 Year Product - Rev 8
- ERPS - 10 Year Corrosion, 10 Year Product - Rev 6

### UC-TERMS-002: Create New Warranty Terms
**Objective**: Verify admin can create new warranty terms
**Prerequisites**: Login as ERPS admin
**Test Steps**:
1. Call POST `/admin/warranty-terms` with new terms data
2. Verify terms are created successfully
3. Check terms appear in active list

**Expected Results**:
- New warranty terms created with unique ID
- Terms marked as active
- Available for warranty creation

### UC-TERMS-003: Warranty Terms Pagination
**Objective**: Verify warranty terms list supports pagination
**Prerequisites**: Login as ERPS admin
**Test Steps**:
1. Call GET `/admin/warranty-terms?page=1&limit=2`
2. Verify pagination metadata
3. Test different page numbers

**Expected Results**:
- Correct pagination metadata
- Limited results per page
- Consistent total counts

## 🚗 Warranty Registration Test Cases

### UC-WARRANTY-001: Create Draft Warranty
**Objective**: Verify installer can create warranty in draft status
**Prerequisites**: Login as installer
**Test Steps**:
1. Get active warranty terms ID
2. Call POST `/warranty-registration/warranties` with complete warranty data
3. Verify warranty is created in DRAFT status

**Expected Results**:
- Warranty created with unique ID
- Status set to DRAFT
- All provided data saved correctly
- Installer assigned as agent

**Sample Data**:
```json
{
  "companyName": "SQA Test Company Ltd",
  "firstName": "John",
  "lastName": "TestUser",
  "phoneNumber": "+61-400-123-999",
  "email": "john.testuser@sqatest.com",
  "make": "Toyota",
  "model": "Camry",
  "registrationNumber": "SQA123",
  "buildDate": "2024-01-01",
  "vinNumber": "SQA1234567890TEST",
  "installersName": "David Brown",
  "dateInstalled": "2024-12-25",
  "generatorSerialNumber": "SQA-TEST-001",
  "numberOfCouplersInstalled": 4,
  "voltageInCouplerSupplyLine": 12.5,
  "positionOfCouplers": "Front and rear chassis rails",
  "corrosionFound": false,
  "warrantyTermsId": "{{warrantyTermsId}}"
}
```

### UC-WARRANTY-002: Submit Warranty for Verification
**Objective**: Verify installer can submit warranty for verification
**Prerequisites**: 
- Login as installer
- Have draft warranty created
**Test Steps**:
1. Call POST `/warranty-registration/warranties/{id}/submit`
2. Verify warranty status changes to SUBMITTED
3. Check submission timestamp is recorded

**Expected Results**:
- Warranty status updated to SUBMITTED
- Submission notes saved
- SMS verification token generated (in real system)
- Installer notified of submission

### UC-WARRANTY-003: View Warranty Details
**Objective**: Verify warranty details can be retrieved
**Prerequisites**: Login as installer with warranty access
**Test Steps**:
1. Call GET `/warranty-registration/warranties/{id}`
2. Verify all warranty data is returned
3. Check related data (terms, installer info)

**Expected Results**:
- Complete warranty information
- Related warranty terms details
- Installer information
- Status and verification details

### UC-WARRANTY-004: List User Warranties
**Objective**: Verify installer can view their warranties
**Prerequisites**: Login as installer
**Test Steps**:
1. Call GET `/warranty-registration/warranties`
2. Verify only user's warranties are returned
3. Check warranty summary information

**Expected Results**:
- List of warranties created by current user
- Summary information for each warranty
- Proper filtering by user

## 🔍 Annual Inspection Test Cases

### UC-INSPECTION-001: Create Draft Inspection
**Objective**: Verify inspector can create annual inspection
**Prerequisites**: 
- Login as inspector
- Have verified warranty available
**Test Steps**:
1. Call POST `/annual-inspection/inspections` with inspection data
2. Verify inspection is created in DRAFT status
3. Check all inspection checklist items are saved

**Expected Results**:
- Inspection created with unique ID
- Status set to DRAFT
- All checklist items recorded
- Inspector assigned correctly

**Sample Data**:
```json
{
  "warrantyId": "{{warrantyId}}",
  "inspectorId": "{{userId}}",
  "inspectionDate": "2024-12-25",
  "generatorMountedCorrectly": true,
  "redLightIlluminated": true,
  "couplersSecureSealed": true,
  "roofTurretCondition": "PASS",
  "pillarsCondition": "PASS",
  "sillsCondition": "PASS",
  "guardsLfCondition": "PASS",
  "guardsRfCondition": "PASS",
  "guardsLrCondition": "PASS",
  "guardsRrCondition": "PASS",
  "innerGuardsCondition": "PASS",
  "underBonnetCondition": "PASS",
  "firewallCondition": "PASS",
  "bootWaterIngressCondition": "PASS",
  "underbodySeamsCondition": "ISSUE",
  "underbodySeamsNotes": "Minor surface rust treated during inspection",
  "ownerAdvisedPaintDamage": true,
  "ownerUnderstandsOperation": true,
  "corrosionFound": true,
  "corrosionDetails": "Minor surface corrosion on underbody seams, treated and sealed during inspection"
}
```

### UC-INSPECTION-002: Submit Inspection for Verification
**Objective**: Verify inspector can submit inspection for verification
**Prerequisites**: 
- Login as inspector
- Have draft inspection created
**Test Steps**:
1. Call POST `/annual-inspection/inspections/{id}/submit`
2. Verify inspection status changes to SUBMITTED
3. Check submission is recorded

**Expected Results**:
- Inspection status updated to SUBMITTED
- Submission timestamp recorded
- SMS verification process initiated
- Inspector notified of submission

### UC-INSPECTION-003: View Inspection Details
**Objective**: Verify inspection details can be retrieved
**Prerequisites**: Login as inspector with inspection access
**Test Steps**:
1. Call GET `/annual-inspection/inspections/{id}`
2. Verify all inspection data is returned
3. Check related warranty information

**Expected Results**:
- Complete inspection checklist data
- Related warranty information
- Inspector details
- Status and verification information

### UC-INSPECTION-004: Warranty Inspection History
**Objective**: Verify inspection history for warranty can be viewed
**Prerequisites**: Login as inspector
**Test Steps**:
1. Call GET `/annual-inspection/warranties/{warrantyId}/inspections`
2. Verify inspection history is returned
3. Check chronological ordering

**Expected Results**:
- List of inspections for the warranty
- Chronological order (newest first)
- Summary information for each inspection

## ✅ Verification Workflow Test Cases

### UC-VERIFY-001: Warranty Verification (Confirm)
**Objective**: Verify installer can confirm warranty via SMS token
**Prerequisites**: Warranty submitted for verification
**Test Steps**:
1. Call POST `/warranty-registration/verify-warranty/{token}` with action "CONFIRM"
2. Verify warranty status changes to VERIFIED
3. Check verification timestamp

**Expected Results**:
- Warranty status updated to VERIFIED
- Verification timestamp recorded
- Installer confirmation logged
- System notifications sent

### UC-VERIFY-002: Warranty Verification (Decline)
**Objective**: Verify installer can decline warranty via SMS token
**Prerequisites**: Warranty submitted for verification
**Test Steps**:
1. Call POST `/warranty-registration/verify-warranty/{token}` with action "DECLINE"
2. Provide rejection reason
3. Verify warranty status changes to REJECTED

**Expected Results**:
- Warranty status updated to REJECTED
- Rejection reason recorded
- Rejection timestamp logged
- System notifications sent

### UC-VERIFY-003: Inspection Verification (Confirm)
**Objective**: Verify inspector can confirm inspection via SMS token
**Prerequisites**: Inspection submitted for verification
**Test Steps**:
1. Call POST `/annual-inspection/verify-inspection/{token}` with action "CONFIRM"
2. Verify inspection status changes to VERIFIED
3. Check warranty extension is applied

**Expected Results**:
- Inspection status updated to VERIFIED
- Verification timestamp recorded
- Warranty extended for another year
- System notifications sent

### UC-VERIFY-004: Inspection Verification (Decline)
**Objective**: Verify inspector can decline inspection via SMS token
**Prerequisites**: Inspection submitted for verification
**Test Steps**:
1. Call POST `/annual-inspection/verify-inspection/{token}` with action "DECLINE"
2. Provide rejection reason
3. Verify inspection status changes to REJECTED

**Expected Results**:
- Inspection status updated to REJECTED
- Rejection reason recorded
- No warranty extension applied
- System notifications sent

## 📊 Data Validation Test Cases

### UC-DATA-001: Sample Data Verification
**Objective**: Verify all sample data is correctly loaded
**Prerequisites**: Database populated with sample data
**Test Steps**:
1. Login as admin
2. Query various endpoints to verify data
3. Check data relationships and integrity

**Expected Sample Data**:
- **Users**: 8 total (1 admin + 7 partner users)
- **Partner Accounts**: 3 (Sydney, Melbourne, Brisbane)
- **Warranty Terms**: 3 active terms
- **Warranties**: 5 total (2 verified, 1 submitted, 1 draft, 1 rejected)
- **Inspections**: 3 total (1 verified, 1 submitted, 1 draft)

### UC-DATA-002: Warranty Status Distribution
**Objective**: Verify warranty status distribution in sample data
**Test Steps**:
1. Query warranties by status
2. Verify correct counts for each status

**Expected Results**:
- VERIFIED: 2 warranties
- SUBMITTED: 1 warranty
- DRAFT: 1 warranty
- REJECTED: 1 warranty

### UC-DATA-003: Inspection Status Distribution
**Objective**: Verify inspection status distribution in sample data
**Test Steps**:
1. Query inspections by status
2. Verify correct counts for each status

**Expected Results**:
- VERIFIED: 1 inspection
- SUBMITTED: 1 inspection
- DRAFT: 1 inspection

### UC-DATA-004: Corrosion Tracking
**Objective**: Verify corrosion data is properly tracked
**Test Steps**:
1. Query warranties with corrosion found
2. Query inspections with corrosion found
3. Verify corrosion details are recorded

**Expected Results**:
- Some warranties have corrosion_found = true
- Corrosion details are provided where applicable
- Inspection corrosion findings are recorded

## 🧪 End-to-End Test Scenarios

### E2E-001: Complete Warranty Lifecycle
**Objective**: Test complete warranty process from creation to verification
**Steps**:
1. Login as installer
2. Create draft warranty
3. Submit warranty for verification
4. Verify warranty via SMS token
5. Confirm warranty is active

**Expected Flow**:
DRAFT → SUBMITTED → VERIFIED → ACTIVE

### E2E-002: Complete Inspection Lifecycle
**Objective**: Test complete inspection process from creation to verification
**Steps**:
1. Login as inspector
2. Create draft inspection for verified warranty
3. Submit inspection for verification
4. Verify inspection via SMS token
5. Confirm warranty is extended

**Expected Flow**:
DRAFT → SUBMITTED → VERIFIED → WARRANTY_EXTENDED

### E2E-003: Rejection and Resubmission Flow
**Objective**: Test rejection and resubmission process
**Steps**:
1. Submit warranty/inspection
2. Reject via SMS token with reason
3. Edit and resubmit
4. Verify successful resubmission

**Expected Flow**:
SUBMITTED → REJECTED → DRAFT → SUBMITTED → VERIFIED

## 🔧 Technical Validation

### TV-001: Authentication Token Validation
**Objective**: Verify JWT tokens work correctly
**Test Cases**:
- Valid token allows access
- Expired token is rejected
- Invalid token is rejected
- Role-based access control works

### TV-002: Data Validation
**Objective**: Verify input validation works correctly
**Test Cases**:
- Required fields are enforced
- Email format validation
- Date format validation
- Enum value validation

### TV-003: Error Handling
**Objective**: Verify proper error responses
**Test Cases**:
- 400 for bad requests
- 401 for unauthorized access
- 403 for forbidden operations
- 404 for not found resources
- 500 for server errors

## 📝 Test Execution Instructions

### Prerequisites
1. Start the ERPS backend server on `http://localhost:5050`
2. Ensure database is populated with sample data
3. Import the Postman collection
4. Set the `baseUrl` variable to your server URL

### Execution Order
1. **Authentication Tests** - Verify all user roles can login
2. **Admin Operations** - Test admin functionality
3. **Warranty Management** - Test warranty creation and management
4. **Inspection Management** - Test inspection creation and management
5. **Verification Workflows** - Test SMS verification processes
6. **Data Validation** - Verify sample data integrity
7. **End-to-End Scenarios** - Test complete workflows

### Success Criteria
- All API endpoints return expected status codes
- Data is correctly saved and retrieved
- User roles and permissions work as expected
- Verification workflows function properly
- Sample data demonstrates all system capabilities

## 📋 Test Checklist

### Authentication ✅
- [ ] ERPS Admin login
- [ ] Partner Admin login
- [ ] Installer login
- [ ] Inspector login
- [ ] Admin login-as functionality

### Warranty Management ✅
- [ ] Create draft warranty
- [ ] Submit warranty for verification
- [ ] View warranty details
- [ ] List user warranties
- [ ] Warranty verification (confirm/decline)

### Inspection Management ✅
- [ ] Create draft inspection
- [ ] Submit inspection for verification
- [ ] View inspection details
- [ ] List user inspections
- [ ] Inspection verification (confirm/decline)
- [ ] Warranty inspection history

### Admin Operations ✅
- [ ] Dashboard statistics
- [ ] Partner user management
- [ ] Warranty terms management
- [ ] System reporting

### Data Integrity ✅
- [ ] Sample data loaded correctly
- [ ] Relationships maintained
- [ ] Status transitions work
- [ ] Corrosion tracking functional

---

## 📞 Support Information

For questions about this test documentation or the ERPS system:

- **System**: Electronic Rust Protection System (ERPS)
- **Version**: 1.0.0
- **Test Data**: Complete sample dataset included
- **API Documentation**: Available via Swagger UI at `/docs`
- **Collection**: ERPS_COMPLETE_SQA_POSTMAN_COLLECTION.json

This documentation provides comprehensive test coverage for SQA validation of the ERPS system with realistic sample data and complete API testing scenarios.