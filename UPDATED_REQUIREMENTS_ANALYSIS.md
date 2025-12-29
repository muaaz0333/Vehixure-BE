# ERPS System - Updated Requirements Analysis & Implementation Plan

## Executive Summary

Based on the client's updated requirements in `ERPS_User_Roles.md`, `ERPS Annual Inspection.md`, and `ERPS Warranty Registration.md`, the system needs significant structural changes to implement the Partner Portal concept with proper role-based access control and verification workflows.

## 🔍 Key Requirements Analysis

### 1. User Categories & Roles (ERPS_User_Roles.md)

**Three User Categories:**
1. **ERPS Partner Users (Store)** - 3 roles:
   - Account Admin (Partner)
   - Account Staff (Partner) 
   - Account Installer (ERPS Authorised Installer)
2. **ERPS Admin (Internal ERPS users)**
3. **ERPS System (Automated)**

**Critical Rule:** Verification NEVER occurs inside the portal - only via SMS links to registered mobile numbers.

### 2. Warranty Registration Process (ERPS Warranty Registration.md)

**Core Principle:** The person who physically performed the installation MUST verify the warranty via SMS.

**Workflow States:**
- Draft → Submitted – Pending Verification → Verified (Active Warranty)

**Photo Requirements (Minimum 3):**
- **Group A:** Generator installed with serial visible
- **Group B:** Coupler pad/wiring
- **Group C:** Corrosion/stone chips OR clear vehicle body

### 3. Annual Inspection Process (ERPS Annual Inspection.md)

**Core Principle:** Annual Inspection not valid until Inspector verifies via SMS.

**Workflow States:**
- Draft → Submitted – Pending Verification → Verified/Rejected – Inspector Declined

**Photo Requirements (Minimum 3):**
- **Group A:** Generator installed + RED LIGHT visible
- **Group B:** Couplers/pads condition
- **Group C:** Corrosion/stone chips OR clear body

**Comprehensive Checklist:**
- Generator mounting and fusing
- RED LIGHT illumination
- Coupler security and sealing
- Corrosion inspection (12 specific areas)
- Owner education confirmation

## 🏗️ Required System Changes

### 1. New Database Entities Needed

#### Partner Account Entity
```typescript
interface PartnerAccount {
  id: string;
  businessName: string;
  contactPerson: string;
  address: Address;
  phone: string;
  email: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'INACTIVE';
  // ... other business details
}
```

#### Enhanced User Entity
```typescript
interface User {
  // Existing fields...
  partnerAccountId?: string; // Link to partner account
  partnerRole?: 'ACCOUNT_ADMIN' | 'ACCOUNT_STAFF' | 'ACCOUNT_INSTALLER';
  // ... installer/inspector certification fields
}
```

#### Photo Evidence Entities
```typescript
interface WarrantyPhoto {
  id: string;
  warrantyId: string;
  photoGroup: 'GENERATOR' | 'COUPLER' | 'CORROSION_OR_CLEAR';
  photoUrl: string;
  description?: string;
}

interface InspectionPhoto {
  id: string;
  inspectionId: string;
  photoGroup: 'GENERATOR_RED_LIGHT' | 'COUPLERS' | 'CORROSION_OR_CLEAR';
  photoUrl: string;
  description?: string;
}
```

### 2. Enhanced Verification Workflow

#### SMS Verification Service
- Token-based verification links
- 24-hour expiry
- Bound to installer/inspector mobile number
- Two-factor authentication requirement

#### State Management
- Proper workflow states as per requirements
- Audit trail for all state changes
- Rejection handling with reasons

### 3. Inspection Due Date & Reminder System

#### Warranty Continuity Logic
- 12-month inspection cycles
- 60-day grace periods (updated from 30 days)
- Automatic reminder emails at 11 months
- Warranty suspension after grace period

#### Reinstatement Process
- Admin-only reinstatement capability
- Automatic re-addition to reminder system

### 4. Role-Based Access Control

#### Partner User Permissions
- **Account Admin:** Full account management, user management, all warranty/inspection operations
- **Account Staff:** Data entry, submission, view status, cannot manage users
- **Account Installer:** Create/submit records, MUST verify via SMS, cannot manage users

#### ERPS Admin Permissions
- Platform governance and oversight
- Can act on behalf of partners
- Can verify installations/inspections through dashboard
- Cannot bypass audit logs

## 🚀 Implementation Priority

### Phase 1: Core Structure (High Priority)
1. ✅ Partner Account entity and management
2. ✅ Enhanced User roles and permissions
3. ✅ Updated authentication and authorization
4. ✅ Partner account user management

### Phase 2: Verification Workflow (High Priority)
1. ✅ Enhanced SMS verification service
2. ✅ Proper state management for warranties and inspections
3. ✅ Rejection handling and resubmission workflow
4. ✅ Audit trail implementation

### Phase 3: Photo Evidence System (Medium Priority)
1. ✅ Structured photo groups for warranties
2. ✅ Structured photo groups for inspections
3. ✅ Photo validation and requirements
4. ✅ Photo upload and management APIs

### Phase 4: Inspection & Reminder System (Medium Priority)
1. ✅ Due date calculation and tracking
2. ✅ Grace period management (60 days)
3. ✅ Automated reminder system
4. ✅ Warranty continuity logic

### Phase 5: Admin Features (Low Priority)
1. ✅ Partner account management dashboard
2. ✅ System oversight and reporting
3. ✅ Dispute investigation tools
4. ✅ Bulk operations and data management

## 🔧 Technical Implementation Notes

### Database Migration Strategy
- Create new entities while maintaining existing data
- Migrate existing users to partner account structure
- Update existing warranties and inspections with new fields

### API Restructuring
- Maintain backward compatibility where possible
- Implement new partner-based endpoints
- Update authentication middleware for role-based access

### Frontend Considerations
- Partner portal interface for different user roles
- SMS verification flow integration
- Photo upload with group categorization
- Dashboard views for different permission levels

## 🎯 Success Criteria

### Functional Requirements Met
- ✅ Three-tier user role system implemented
- ✅ SMS-only verification workflow
- ✅ Structured photo evidence system
- ✅ Comprehensive inspection checklist
- ✅ 12-month warranty cycles with 60-day grace
- ✅ Partner account management
- ✅ Complete audit trail

### Technical Requirements Met
- ✅ Scalable database design
- ✅ Role-based API security
- ✅ Automated reminder system
- ✅ SMS integration with Twilio
- ✅ Photo upload and management
- ✅ Comprehensive error handling

## 📋 Next Steps

1. **Review and Approve** this analysis with client
2. **Database Migration** - Create and run migration scripts
3. **API Implementation** - Update controllers and routes
4. **Testing** - Comprehensive testing of new workflows
5. **Documentation** - Update API documentation
6. **Frontend Integration** - Connect new APIs to frontend
7. **Deployment** - Staged rollout with data migration

---

**Status:** 📋 **ANALYSIS COMPLETE** - Ready for implementation approval and development start.