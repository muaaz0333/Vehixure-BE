# Warranty Management System - Final Documentation

This document describes the comprehensive warranty management system implemented for admin users.

## Overview

The warranty management system allows administrators to:
- Create and manage warranty terms and conditions with replacement functionality
- Create warranties by selecting agents
- Manage existing warranties (view, edit, delete, restore)
- Handle corrosion warranties separately
- Track warranty status and details

## Database Schema

### Warranty Terms Table (`warranty_terms`)
Stores the different warranty terms and conditions available for products.

**Fields:**
- `id` - UUID primary key
- `warranty_name` - Name of the warranty (e.g., "ECO-PRO - 10 Year Corrosion, 5 Year Product - Rev 8")
- `description` - Optional description
- `revision` - Revision number (e.g., "Rev 8")
- `generator_light_colour` - Color of the generator light (e.g., "Blue", "Green", "Red")
- `terms_and_conditions` - Full terms and conditions text
- `add_type` - Type of warranty addition: 'ADD_WARRANTY' or 'REPLACE_WARRANTY'
- `warranty_to_replace_id` - ID of warranty being replaced (if add_type is REPLACE_WARRANTY)
- `inspection_instructions` - Instructions for warranty inspections
- `is_active` - Whether the terms are currently active
- `is_deleted` - Soft delete flag
- `created`, `modified`, `deleted_at` - Timestamps

### Warranties Table (`warranties`)
Stores individual warranty records created by admins.

**Fields:**
- `id` - UUID primary key
- `ref_stock_id` - Reference/Stock ID (optional)
- `agent_id` - Foreign key to users table (agent)
- `warranty_terms_id` - Foreign key to warranty_terms table

**Vehicle Owner Details:**
- `company_name` - Company name (optional)
- `first_name` - First name (required)
- `last_name` - Last name (required)
- `phone_number` - Phone number (required)
- `email` - Email address (required for inspection notifications)

**Vehicle Details:**
- `make` - Vehicle make (required)
- `model` - Vehicle model (required)
- `registration_number` - Registration number (optional)
- `build_date` - Build date (required)
- `vin_number` - VIN number (required)

**Installation Details:**
- `installers_name` - Installer's name (required)
- `date_installed` - Installation date (required)
- `generator_serial_number` - Generator serial number (required)
- `number_of_couplers_installed` - Number of couplers installed (optional)
- `voltage_in_coupler_supply_line` - Voltage in coupler supply line (optional)
- `position_of_couplers` - Position of couplers (optional)

**Corrosion Details:**
- `corrosion_found` - Boolean flag for corrosion found
- `corrosion_details` - Details if corrosion found (optional)

**Other Fields:**
- `installation_confirmed` - Installation confirmation checkbox
- `status` - Warranty status (DRAFT, ACTIVE, EXPIRED, CANCELLED)
- `is_deleted` - Soft delete flag
- `created`, `modified`, `deleted_at` - Timestamps

## API Endpoints

### Warranty Terms Management

#### Create Warranty Terms
```
POST /admin/warranty-terms
```
**Body for New Warranty:**
```json
{
  "warrantyName": "ECO-PRO - 10 Year Corrosion, 5 Year Product - Rev 9",
  "description": "Electronic Corrosion Protection System with 10 year corrosion and 5 year product warranty",
  "revision": "Rev 9",
  "generatorLightColour": "Blue",
  "termsAndConditions": "Standard terms and conditions for ECO-PRO system...",
  "addType": "ADD_WARRANTY",
  "inspectionInstructions": "Standard inspection procedures for ECO-PRO system",
  "isActive": true
}
```

**Body for Replacement Warranty:**
```json
{
  "warrantyName": "ECO-PRO - 10 Year Corrosion, 5 Year Product - Rev 10",
  "description": "Updated Electronic Corrosion Protection System",
  "revision": "Rev 10",
  "generatorLightColour": "Blue",
  "termsAndConditions": "Updated terms and conditions...",
  "addType": "REPLACE_WARRANTY",
  "warrantyToReplaceId": "existing-warranty-uuid",
  "inspectionInstructions": "Updated inspection procedures",
  "isActive": true
}
```

#### Get All Warranty Terms
```
GET /admin/warranty-terms?page=1&limit=10&isActive=true&search=ECO-PRO
```

#### Get Active Warranty Terms (for dropdown)
```
GET /admin/warranty-terms/active
```

#### Get Warranty Terms for Replacement Dropdown
```
GET /admin/warranty-terms/replacement-options
```
Returns warranty terms formatted for "Warranty to Replace" dropdown with "None" as first option:
```json
{
  "success": true,
  "message": "Warranty terms for replacement retrieved successfully",
  "data": [
    { "id": null, "name": "None", "value": "none" },
    { "id": "uuid1", "name": "ECO-PRO - 10 Year Corrosion, 5 Year Product - Rev 8", "value": "uuid1" },
    { "id": "uuid2", "name": "ERPS - 10 Year Corrosion, 10 Year Product - Rev 6", "value": "uuid2" }
  ]
}
```

#### Get Warranty Terms by ID
```
GET /admin/warranty-terms/:warrantyTermsId
```

#### Update Warranty Terms
```
PUT /admin/warranty-terms/:warrantyTermsId
```

#### Delete Warranty Terms
```
DELETE /admin/warranty-terms/:warrantyTermsId
```

#### Toggle Warranty Terms Status
```
PATCH /admin/warranty-terms/:warrantyTermsId/status
```
**Body:**
```json
{
  "isActive": false
}
```

### Warranty Management

#### Create Warranty
```
POST /admin/warranties
```
**Body:**
```json
{
  "refStockId": "REF001",
  "agentId": "agent-uuid",
  "warrantyTermsId": "warranty-terms-uuid",
  "companyName": "ABC Company",
  "firstName": "John",
  "lastName": "Doe",
  "phoneNumber": "+1234567890",
  "email": "john.doe@example.com",
  "make": "Toyota",
  "model": "Camry",
  "registrationNumber": "ABC123",
  "buildDate": "2023-01-15",
  "vinNumber": "1HGBH41JXMN109186",
  "installersName": "Mike Johnson",
  "dateInstalled": "2023-12-01",
  "generatorSerialNumber": "GEN123456",
  "numberOfCouplersInstalled": 4,
  "voltageInCouplerSupplyLine": 12.5,
  "positionOfCouplers": "Front and rear bumpers",
  "corrosionFound": false,
  "corrosionDetails": "",
  "installationConfirmed": true,
  "status": "ACTIVE"
}
```

#### Get All Warranties
```
GET /admin/warranties?page=1&limit=10&status=ACTIVE&agentId=agent-uuid&corrosionFound=false&search=john
```

#### Get Warranty by ID
```
GET /admin/warranties/:warrantyId
```

#### Update Warranty
```
PUT /admin/warranties/:warrantyId
```

#### Delete Warranty (Soft Delete)
```
DELETE /admin/warranties/:warrantyId
```

#### Get Corrosion Warranties
```
GET /admin/warranties/corrosion?page=1&limit=10&agentId=agent-uuid
```

#### Get Deleted Warranties
```
GET /admin/warranties/deleted?page=1&limit=10
```

#### Restore Deleted Warranty
```
POST /admin/warranties/:warrantyId/restore
```

### Agent Management

#### Get Agents for Dropdown
```
GET /admin/agents/dropdown
```
Returns list of active agents for warranty creation dropdown.

## Form Fields Implementation

### Warranty Terms Creation Form

**Add Type Dropdown:**
- "Add Warranty" (value: ADD_WARRANTY)
- "Replace Warranty - Select Warranty to Replace below" (value: REPLACE_WARRANTY)

**Warranty to Replace Section:**
- Radio buttons with "None" selected by default
- Dynamic list of existing warranty terms from `/admin/warranty-terms/replacement-options`
- Note: "Please note that Replacing an Existing Warranty will make it in-active"

**Warranty Details:**
- Warranty Name (required) - Text input
- Description (optional) - Text input
- Revision (required) - Text input
- Generator Light Colour (optional) - Text input

**Terms and Conditions:**
- Large text area for full terms and conditions

**Inspection Instructions:**
- Large text area for inspection procedures

### Warranty Creation Form

**Agent Selection:**
- Dropdown populated from `/admin/agents/dropdown`

**Vehicle Owner:**
- Company Name (optional)
- First Name (required)
- Last Name (required)
- Phone Number (required)
- Email (required for inspection notifications)

**Vehicle Details:**
- Make (required)
- Model (required)
- Registration Number (optional)
- Build Date (required) - Month/Year dropdowns
- VIN Number (required)

**Installation Details:**
- Product Installed (dropdown from `/admin/warranty-terms/active`)
- Installer's Name (required)
- Date Installed (required) - Day/Month/Year dropdowns
- Generator Serial Number (required)
- Number of Couplers Installed (optional)
- Voltage in Coupler Supply Line (optional)
- Position of Couplers (optional text area)

**Corrosion Details:**
- Corrosion Found (Yes/No dropdown)
- Corrosion Details (text area if Yes selected)

**Confirmation:**
- Installation confirmation checkbox

**Actions:**
- Save Information to complete later
- Create Warranty

## Features

### Admin Capabilities

1. **Warranty Terms Management:**
   - Create new warranty terms and conditions
   - Replace existing warranty terms (deactivates old one)
   - View all warranty terms with pagination and search
   - Edit existing warranty terms
   - Activate/deactivate warranty terms
   - Delete warranty terms (if not in use)

2. **Warranty Creation:**
   - Select agent from dropdown
   - Fill comprehensive warranty form with all required details
   - Choose from active warranty terms
   - Handle corrosion inspection details
   - Confirm installation

3. **Warranty Management:**
   - View all warranties with filters (status, agent, corrosion, search)
   - Edit existing warranties
   - Soft delete warranties
   - View deleted warranties
   - Restore deleted warranties

4. **Specialized Views:**
   - Corrosion warranties - separate view for warranties with corrosion found
   - Deleted warranties - manage soft-deleted warranties

## Installation

1. **Run Database Migration:**
   ```bash
   # Execute the migration SQL file
   psql -d your_database -f migration-create-warranty-tables.sql
   ```

2. **Update TypeORM Configuration:**
   The warranty entities are already added to the TypeORM configuration in `src/plugins/typeorm.ts`.

3. **API Routes:**
   All warranty routes are added to the admin routes in `src/routes/admin.ts`.

## Security

- All warranty endpoints require admin authentication
- Soft delete is used for data integrity
- Foreign key constraints ensure data consistency
- Input validation on all endpoints
- Proper error handling and logging
- Warranty replacement automatically deactivates old warranty

## Usage Examples

### Creating Warranty Terms

1. **New Warranty Terms:**
   ```bash
   POST /admin/warranty-terms
   {
     "warrantyName": "New Product - 5 Year Warranty",
     "revision": "Rev 1",
     "addType": "ADD_WARRANTY",
     "isActive": true
   }
   ```

2. **Replacement Warranty Terms:**
   ```bash
   # First get replacement options
   GET /admin/warranty-terms/replacement-options
   
   # Then create replacement
   POST /admin/warranty-terms
   {
     "warrantyName": "Updated Product - 5 Year Warranty",
     "revision": "Rev 2",
     "addType": "REPLACE_WARRANTY",
     "warrantyToReplaceId": "old-warranty-uuid",
     "isActive": true
   }
   ```

### Creating a Warranty

1. Get list of active agents: `GET /admin/agents/dropdown`
2. Get active warranty terms: `GET /admin/warranty-terms/active`
3. Create warranty with selected agent and terms: `POST /admin/warranties`

### Managing Warranties

1. View all warranties: `GET /admin/warranties`
2. Filter by corrosion: `GET /admin/warranties/corrosion`
3. Search warranties: `GET /admin/warranties?search=john`
4. Edit warranty: `PUT /admin/warranties/:id`
5. Delete warranty: `DELETE /admin/warranties/:id`
6. View deleted: `GET /admin/warranties/deleted`
7. Restore warranty: `POST /admin/warranties/:id/restore`

## Sample Data

The migration includes sample warranty terms matching your images:
- ECO-PRO - 10 Year Corrosion, 5 Year Product - Rev 8
- ECO-PRO - Limited Lifetime Corrosion, 5 Year Product - Rev 8
- ERPS - 10 Year Corrosion, 10 Year Product - Rev 6

This comprehensive warranty management system provides all the functionality described in your requirements, with proper database design, API endpoints, and admin controls matching the form structure shown in your images.