# ERPS Warranty Registration – UX & Verification Specification

## Purpose
Defines the UX structure and verification model for ERPS Warranty Registration.

Designed to:
- Reflect real workshop workflows
- Allow store staff administration
- Ensure installer verification
- Capture defensible evidence
- Reduce disputes and warranty risk

---

## Core Principle (Locked)
The person who physically performed the installation **must verify** the warranty, regardless of who entered the data.

---

## User Roles

### Account (User)
- Create registrations
- Enter data
- Upload photos
- Save drafts
- Submit registrations
- **Cannot verify**

### Account (Installer)
- Setup only by ERPS
- Performs installation
- Accountable for accuracy
- Must verify via SMS (two-factor)
- Can create, submit, and upload
- Still must verify even if they submitted

---

## Warranty Registration UX Structure

### Section 1 – Administrative Details
Includes:
- Store name (auto)
- Vehicle owner details
- Vehicle info (VIN, model, rego, build date)
- Product installed
- Installer name
- Generator serial number
- Installation date
- Pads installed
- Generator voltage
- Pad locations
- Corrosion or chips notes

---

### Section 2 – Installer Attribution (Critical)
**Installation Performed By**
- Required
- Dropdown of Accredited Installers
- Locked after submission

Determines:
- Who verifies
- Accountability

---

### Section 3 – Mandatory Photo Evidence
Minimum **3 photos required**

**Photo Group A**
- Generator installed
- Serial visible

**Photo Group B**
- Coupler pad / wiring

**Photo Group C**
- Corrosion or stone chips  
  **OR**
- Clear vehicle body

---

### Section 4 – Condition Declaration
- Existing corrosion found? Yes / No (required)

If Yes:
- Structured notes
- Photos mandatory

---

### Section 5 – Submission State
Notice shown:
> “This warranty will not be active until verified by the installer.”

---

## Record States (Locked)
1. Draft
2. Submitted – Pending Verification
3. Verified (Active Warranty)

---

## Draft State
- Missing fields allowed
- Photos optional
- No SMS
- Warranty inactive

Banner:
> “This warranty is saved as a draft and is not active.”

---

## Submission Rules
Submission allowed only when:
- Installer selected
- VIN present
- Product and generator serial present
- Installation date set
- Minimum photos uploaded
- Corrosion declaration complete

On submission:
- Record locks
- Status → Submitted – Pending Verification
- Verification SMS sent

---

## Verification Workflow

### Identity Rule (Locked)
Verification must be completed by the installer selected as **Installation Performed By**.

### Two-Factor Requirement
- Secure SMS link
- Bound to installer mobile
- Required even if installer submitted

---

## Installer Verification Experience
Installer sees:
- All data (read-only)
- Photos

Actions:
- Confirm
- Decline (reason required)

Confirmation statement:
> “I confirm I personally performed this installation and that the information and photos accurately reflect the vehicle at the time of installation.”

---

## Declined Verification Handling
If declined:
- Warranty not active
- Status → Rejected – Installer Declined
- Reason mandatory
- Record unlocks for correction

Dashboard shows:
- Status badge
- Installer name
- Decline timestamp
- Action required notice

---

## Resubmission
- Account edits and resubmits
- New SMS sent
- Decline history retained
- Only latest submission verifiable

---

## Audit & Compliance
Each record retains:
- Submitted by
- Installed by
- Verified by
- Timestamp
- Outcome

---

## Definition (Locked)
The ERPS Warranty Registration process allows stores to enter data, but only the installer who performed the work can verify and activate the warranty.
