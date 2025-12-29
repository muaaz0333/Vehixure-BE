# ERPS Annual Inspection – UX & Verification Specification

## Scope
This document applies **only** to the ERPS Annual Inspection process.  
It does **not** apply to Warranty Registration.

All annual inspections must be carried out by an **ERPS Authorised Installer**, referred to as the **Inspector** in this document.

---

## Purpose
This document defines the UX structure, roles, responsibilities, and verification model for ERPS Annual Inspections.

The Annual Inspection exists to:
- Confirm the ERPS system remains correctly installed and operational
- Identify corrosion, stone chips, or paint damage
- Maintain ongoing warranty eligibility
- Create a defensible inspection record tied to the authorised Inspector

This document focuses on UX, responsibility boundaries, and verification logic, not backend implementation.

---

## Core Principle (Locked)
An Annual Inspection is **not valid** until the Inspector verifies it via their registered mobile number (two-factor).

- Who entered the inspection data is irrelevant
- Verification is an attestation of reality, not an administrative approval

---

## User Roles (Annual Inspection Only)

### Account (Store / Admin)
- May create an annual inspection
- May enter inspection data
- May upload inspection photos
- May save the inspection as a draft
- May submit the inspection
- **May not verify** the inspection

### ERPS Authorised Installer (Inspector)
- Physically performs the inspection
- Accountable for inspection accuracy
- May create, edit, save, and submit inspections
- **Must verify via SMS** sent to their registered mobile number
- Verification required even if the inspector submitted the inspection

---

## Annual Inspection Record States (Locked)
Only the following states are permitted:
1. Draft
2. Submitted – Pending Verification
3. Rejected – Inspector Declined
4. Verified – Inspection Complete

No other states are allowed.

---

## Annual Inspection UX Structure

### Section 1 – Inspection Context (Read-Only)
Auto-populated:
- Warranty ID
- Vehicle details (VIN, make, model)
- Generator serial number
- Installation date
- Previous inspection history

---

### Section 2 – Inspection Attribution (Critical)
**Inspection Performed By (ERPS Authorised Installer)**  
- Required
- Dropdown linked to the Account
- Locked after submission

Determines:
- Verification SMS recipient
- Who can verify
- Accountability

---

### Section 3 – Inspection Checklist
Pass / Issue Observed toggles.  
Notes required when an issue is observed.

Checklist includes:
- Generator mounted correctly and fused
- RED LIGHT illuminated
- Couplers secure and sealed
- Corrosion inspection of:
  - Roof turret
  - Pillars
  - Sills
  - Guards (LF, RF, LR, RR)
  - Inner guards
  - Under bonnet
  - Firewall
  - Boot (water ingress)
  - Under-body, seams, sharp edges
- Owner advised of paint damage
- Owner understands system operation and monthly RED LIGHT check

---

### Section 4 – Mandatory Photo Evidence
Minimum **3 photos** required.

**Photo Group A**
- Generator installed
- RED LIGHT visible

**Photo Group B**
- Couplers / pads condition

**Photo Group C**
- Corrosion or stone chips  
  **OR**
- Clear body if no corrosion

---

### Section 5 – Corrosion Declaration
- Existing corrosion found? Yes / No (required)

If Yes:
- Structured notes required
- Corrosion photos mandatory

---

## Draft & Submission Behaviour

### Draft
- May be incomplete
- Photos optional
- No SMS sent
- Not valid

Banner:
> “This inspection is saved as a draft and is not valid until submitted and verified.”

---

### Submission
Submission allowed only when:
- Inspector selected
- Checklist complete
- Minimum photos met
- Corrosion declaration complete

On submission:
- Record locks
- Status → Submitted – Pending Verification
- Verification SMS sent to Inspector

---

## Inspector Verification
Inspector verifies via secure, time-limited SMS link.

They see:
- All data (read-only)
- Checklist
- Photos

Actions:
- Confirm inspection
- Decline inspection (reason required)

Confirmation statement:
> “I confirm I personally performed this annual inspection and that the information and photos accurately reflect the vehicle condition at the time of inspection.”

---

## Declined Inspection Handling
If declined:
- Status → Rejected – Inspector Declined
- Record unlocks
- Decline reason mandatory and permanent
- Dashboard shows action required

---

## Resubmission
- Correct and resubmit
- Status → Submitted – Pending Verification
- New SMS sent
- Decline history retained

---

## Warranty Continuity (Locked)

- Warranty valid only when inspection is **Verified**
- Each verification extends warranty **12 months**
- Reminder email sent at **11 months**

---

## Due Date & Grace Period
- Due Date = Installation date + 12 months
- Grace Period = Due Date + 30 days

After grace period:
- Warranty not extended
- Customer removed from reminders

---

## Reinstatement
If inspection later verified:
- Warranty resumes
- Customer re-added to reminders
- Admin-only action

---

## Audit & Compliance
**Definition (Locked):**  
The ERPS Annual Inspection process allows inspection data entry by the store or installer, but only the installer who performed the inspection can verify it via their registered mobile number.
