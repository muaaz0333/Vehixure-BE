# ERPS Partner Portal – Users, Roles & Responsibilities

## Purpose

This document defines all users of the ERPS Partner Portal, their roles, and their responsibilities across the entire ERPS platform.

It is the authoritative reference for:
- Developers implementing permissions and access control
- ERPS internal governance and support
- Partner (store) onboarding and training

This document covers:
- Warranty Registration
- Annual Inspections
- Compliance lifecycle
- Verification and reminder enforcement

Customers do not log in to the ERPS Partner Portal.

---

## System Scope (Locked)

The ERPS Partner Portal is used to:
- Register ERPS installations
- Manage annual inspections
- Enforce verification, reminders, and compliance rules

Verification never occurs inside the portal and can only be overridden by ERPS Admin.

---

## User Categories (Complete List)

There are three categories of users in the ERPS ecosystem:
1. ERPS Partner Users (Stores)
2. ERPS Admin (Internal ERPS users)
3. ERPS System (Automated)

No other user categories exist.

---

## 1. ERPS Partner Users (Store)

All ERPS Partner Users:
- Belong to one ERPS Partner Account (Store)
- Log in via the ERPS Partner Portal
- Are subject to system-enforced rules

Each Partner User is assigned one role.

### Partner User Roles
1. Account Admin  
2. Account Staff  
3. Account Installer (ERPS Authorised Installer)

---

### 1.1 Account Admin (Partner)

**Role Purpose**  
Overall business and compliance oversight for the Partner Account.

**Responsibilities**
- Ensure warranties and inspections are submitted correctly and on time
- Ensure ERPS Authorised Installers are assigned and contactable
- Ensure rejected records are corrected and resubmitted

**Capabilities**

**May:**
- Manage Partner Account details
- Add, edit, and deactivate Partner users (Admin, Staff)
- Assign Partner roles (Admin, Staff)
- View all customers, warranty registrations, and inspections
- Create, edit, save, and submit warranty registrations
- Create, edit, save, and submit annual inspections
- View inspection due dates, grace periods, and reminder status
- View rejection reasons
- Correct and resubmit rejected records

**May NOT:**
- Verify installations
- Verify annual inspections
- Activate warranties
- Extend warranty validity
- Override system decisions

---

### 1.2 Account Staff (Partner)

**Role Purpose**  
Day-to-day administration and data entry.

**Responsibilities**
- Enter accurate customer, vehicle, and product data
- Upload required photos
- Submit records for verification
- Respond to rejected submissions

**Capabilities**

**May:**
- Create warranty registrations
- Create annual inspections
- Enter and edit data prior to submission
- Upload photos
- Save drafts
- Submit records for verification
- View warranty and inspection status
- View rejection reasons

**May NOT:**
- Manage users or roles
- Verify installations
- Verify inspections
- Override system outcomes

---

### 1.3 Account Installer (Partner)

**Role Purpose**  
Physical execution of work and formal attestation of reality.  
This is the only role permitted to verify ERPS work.

**Responsibilities**
- Perform ERPS installations
- Perform annual inspections
- Ensure submitted data and photos accurately reflect reality
- Complete verification promptly

**Capabilities**

**May:**
- Create warranty registrations
- Create annual inspections
- Upload photos
- Save drafts
- Submit records

**Must:**
- Verify installations they performed via secure SMS only
- Verify annual inspections they performed via secure SMS only
- Complete verification using their registered mobile number (two-factor)

**May NOT:**
- Verify via portal login or dashboard
- Verify work they did not perform
- Delegate verification to others
- Bypass SMS verification
- Override system rules

---

## 2. ERPS Admin (Internal ERPS Users)

**Role Purpose**  
Platform governance, partner management, and system integrity.

ERPS Admin users provide oversight only and do not operate Partner workflows.

**Responsibilities**
- Setup and manage ERPS Partner Accounts
- Ensure platform integrity and compliance
- Provide support and oversight
- Maintain ERPS Authorised Installer accreditation

**Capabilities**

**May:**
- Create, approve, suspend, or deactivate Partner Accounts
- View all Partner data across the platform
- View all warranties and inspections
- View verification outcomes and audit trails
- View reminder and compliance status
- Manage Installer accreditation and access
- Assist with dispute investigation (read-only)
- Submit warranties or inspections on behalf of Partners
- Verify installations or inspections on behalf of Partners through the dashboard
- Activate or extend warranties manually

**May NOT:**
- Bypass system audit logs

---

## 3. ERPS System (Automated)

**Role Purpose**  
Enforcement, communication, and compliance control.

**Responsibilities**
- Send SMS verification links to ERPS Authorised Installers
- Send annual inspection reminder emails to customers
- Enforce warranty activation and continuation rules
- Apply 12-month inspection cycles and 60-day grace periods
- Lock and unlock records based on state
- Maintain immutable audit history

The system cannot be overridden by any user.

---

## Verification Authority (Global Rule – Locked)

- Verification is never performed inside the ERPS Partner Portal
- Verification is never performed via dashboards
- Verification occurs only via secure, time-limited SMS links
- Verification is bound to the Installer’s registered mobile number

Applies to:
- Warranty Registration
- Annual Inspections

---

## Responsibility Boundary (Plain English)

- Partners manage data and workflow
- ERPS Authorised Installers confirm reality
- ERPS Admin governs, not operates
- The system enforces outcomes

ERPS Admin must have the ability to log in and act on behalf of partners.

---

## One-Sentence Summary

The ERPS Partner Portal is used by authorised ERPS Partner stores to register installations and manage inspections, with ERPS Authorised Installers verifying work via SMS, ERPS Admin providing governance and oversight, and the system enforcing all warranty and compliance rules.

---

End of Document
