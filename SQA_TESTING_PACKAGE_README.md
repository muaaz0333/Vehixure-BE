# 🧪 ERPS System - SQA Testing Package

## 📦 Package Contents

This testing package contains everything needed for comprehensive SQA validation of the Electronic Rust Protection System (ERPS):

### 📁 Files Included

1. **`ERPS_COMPLETE_SQA_POSTMAN_COLLECTION.json`** - Complete Postman collection with all API endpoints
2. **`ERPS_SQA_USE_CASES_DOCUMENTATION.md`** - Comprehensive use cases and test scenarios
3. **`SQA_TESTING_PACKAGE_README.md`** - This file (setup instructions)

### 🗄️ Sample Data Overview

The system has been populated with realistic test data:

- **1 ERPS Admin** - Full system access
- **3 Partner Accounts** - Sydney Auto Protection, Melbourne Vehicle Services, Brisbane Corrosion Control
- **7 Partner Users** - 3 Account Admins, 2 Installers, 1 Inspector, 1 Staff member
- **3 Warranty Terms** - ECO-PRO and ERPS warranty types with different coverage periods
- **5 Sample Warranties** - Various statuses (2 verified, 1 submitted, 1 draft, 1 rejected)
- **3 Sample Inspections** - Different verification states (1 verified, 1 submitted, 1 draft)

## 🚀 Quick Start Guide

### Step 1: Import Postman Collection
1. Open Postman
2. Click "Import" button
3. Select `ERPS_COMPLETE_SQA_POSTMAN_COLLECTION.json`
4. Collection will be imported with all endpoints and test scripts

### Step 2: Configure Environment
1. Set the `baseUrl` variable to your server URL (default: `http://localhost:5050`)
2. All other variables will be automatically populated during testing

### Step 3: Start Testing
1. Begin with the "🔐 Authentication" folder
2. Run "1. Admin Login" to get admin token
3. Continue with other authentication tests
4. Proceed through folders in order

## 🔑 Test Credentials

### ERPS Admin
- **Email**: `admin@erps.com`
- **Password**: `admin123`
- **Access**: Full system administration

### Partner Account Admins
- **Sydney**: `admin@sydneyauto.com.au` / `password123`
- **Melbourne**: `admin@melbournevehicle.com.au` / `password123`
- **Brisbane**: `admin@brisbanecorrosion.com.au` / `password123`

### Installers
- **David Brown (Sydney)**: `installer1@sydneyauto.com.au` / `password123`
- **Robert Taylor (Melbourne)**: `installer2@melbournevehicle.com.au` / `password123`

### Inspector
- **Lisa Anderson (Brisbane)**: `inspector1@brisbanecorrosion.com.au` / `password123`

### Staff
- **Emma Wilson (Sydney)**: `staff1@sydneyauto.com.au` / `password123`

## 📋 Testing Checklist

### ✅ Core Functionality Tests
- [ ] User authentication for all roles
- [ ] Admin dashboard and user management
- [ ] Warranty terms management
- [ ] Warranty registration workflow
- [ ] Annual inspection workflow
- [ ] SMS verification simulation
- [ ] Data integrity validation

### ✅ User Role Tests
- [ ] ERPS Admin - Full system access
- [ ] Partner Admin - Account management
- [ ] Installer - Warranty creation
- [ ] Inspector - Inspection creation
- [ ] Staff - Limited access validation

### ✅ Workflow Tests
- [ ] Complete warranty lifecycle (Draft → Submitted → Verified)
- [ ] Complete inspection lifecycle (Draft → Submitted → Verified)
- [ ] Rejection and resubmission flows
- [ ] Admin login-as functionality

### ✅ Data Validation Tests
- [ ] Sample data integrity
- [ ] Status transitions
- [ ] Corrosion tracking
- [ ] Relationship consistency

## 🎯 Key Test Scenarios

### Scenario 1: New Warranty Registration
1. Login as installer
2. Create draft warranty with complete vehicle and installation details
3. Submit warranty for verification
4. Simulate SMS verification (confirm/decline)
5. Verify warranty status changes appropriately

### Scenario 2: Annual Inspection
1. Login as inspector
2. Create inspection for existing verified warranty
3. Complete comprehensive inspection checklist
4. Submit inspection for verification
5. Verify warranty extension upon approval

### Scenario 3: Admin Operations
1. Login as ERPS admin
2. View dashboard statistics
3. Manage partner users
4. Create new warranty terms
5. Use login-as functionality

### Scenario 4: Rejection Handling
1. Submit warranty/inspection
2. Reject with specific reason
3. Verify rejection is recorded
4. Test resubmission process

## 📊 Expected Results Summary

### User Counts
- **Total Users**: 8 (1 admin + 7 partner users)
- **ERPS Admins**: 1
- **Partner Users**: 7

### Data Distribution
- **Partner Accounts**: 3
- **Active Warranty Terms**: 3
- **Total Warranties**: 5 (2 verified, 1 submitted, 1 draft, 1 rejected)
- **Total Inspections**: 3 (1 verified, 1 submitted, 1 draft)

### Status Verification
- **Verified Warranties**: 2 (should be ACTIVE status)
- **Submitted Warranties**: 1 (awaiting verification)
- **Draft Warranties**: 1 (incomplete)
- **Rejected Warranties**: 1 (with rejection reason)

## 🔧 API Endpoints Overview

### Authentication
- `POST /auth/login` - User login
- `POST /auth/admin/login-as` - Admin login as user

### Admin Operations
- `GET /admin/dashboard/stats` - Dashboard statistics
- `GET /auth/admin/partner-users` - List partner users
- `GET /admin/warranty-terms/active` - Active warranty terms

### Warranty Management
- `POST /warranty-registration/warranties` - Create warranty
- `GET /warranty-registration/warranties` - List warranties
- `POST /warranty-registration/warranties/{id}/submit` - Submit for verification
- `POST /warranty-registration/verify-warranty/{token}` - SMS verification

### Inspection Management
- `POST /annual-inspection/inspections` - Create inspection
- `GET /annual-inspection/inspections` - List inspections
- `POST /annual-inspection/inspections/{id}/submit` - Submit for verification
- `POST /annual-inspection/verify-inspection/{token}` - SMS verification

## 🚨 Important Notes

### SMS Verification Simulation
- Real SMS tokens are not sent in test environment
- Use sample tokens like `SAMPLE_TOKEN_123` for testing
- Verification endpoints work without authentication (token-based)

### Data Persistence
- All test data persists between API calls
- Sample data provides realistic scenarios
- Database can be reset if needed

### Error Handling
- API returns proper HTTP status codes
- Error messages are descriptive
- Validation errors include field-specific details

## 🎯 Success Criteria

### Functional Requirements ✅
- All user roles can authenticate successfully
- Warranty registration workflow functions end-to-end
- Annual inspection workflow functions end-to-end
- Admin operations work as expected
- SMS verification simulation works

### Technical Requirements ✅
- API endpoints return correct status codes
- Data validation works properly
- User permissions are enforced
- Error handling is appropriate
- Sample data demonstrates all features

### Business Requirements ✅
- Partner account isolation works
- Role-based access control functions
- Warranty and inspection lifecycles are complete
- Corrosion tracking is functional
- Audit trails are maintained

## 📞 Support & Documentation

### Additional Resources
- **API Documentation**: Available at `/docs` endpoint (Swagger UI)
- **Use Cases Document**: `ERPS_SQA_USE_CASES_DOCUMENTATION.md`
- **Sample Data**: Pre-loaded and verified

### Testing Tips
1. Start with authentication tests to get tokens
2. Use the automated test scripts in Postman
3. Check response status codes and data structure
4. Verify business logic with sample data
5. Test error scenarios with invalid data

---

## 🎉 Ready for Testing!

This package provides comprehensive testing coverage for the ERPS system. The combination of realistic sample data, complete API collection, and detailed use cases ensures thorough SQA validation.

**Happy Testing! 🧪✨**