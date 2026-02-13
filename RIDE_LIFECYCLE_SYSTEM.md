# Ride Lifecycle & Driver Verification System

## Overview

Complete implementation of a ride lifecycle system with driver verification and approval workflow. This system ensures only verified and approved drivers can accept rides, and provides full tracking from booking to completion.

## System Components

### 1. Driver Verification System

#### Backend Components

- **Model**: `DriverVerification.java` - Stores driver verification details
- **Repository**: `DriverVerificationRepository.java` - Database access layer
- **Controller**: `DriverVerificationController.java` - API endpoints
- **DTO**: `DriverVerificationRequest.java` - Data transfer object

#### Frontend Components

- **DriverVerificationForm.jsx** - Driver submission form
- **AdminDriverApprovals.jsx** - Admin review interface

#### Workflow

1. **Driver Submits Details** (`PENDING_SUBMISSION` → `PENDING_APPROVAL`)
   - License information (number, expiry, state, country)
   - Vehicle details (make, model, year, color, plate, type, capacity)
   - Insurance information (company, policy number, expiry)
   - Additional info (experience, emergency contact)
   - Documents (license, RC, insurance, photo)

2. **Admin Reviews** (`PENDING_APPROVAL`)
   - View all submitted details
   - Approve or reject with remarks
   - Can request resubmission

3. **Driver Status Updated**
   - Approved → Can accept rides
   - Rejected → Cannot accept rides, can view rejection reason
   - Resubmission Required → Can update and resubmit

#### API Endpoints

**Driver Endpoints:**

```
GET    /api/driver/verification/status     - Get verification status
POST   /api/driver/verification/submit     - Submit verification details
```

**Admin Endpoints:**

```
GET    /api/driver/verification/pending    - Get pending verifications
GET    /api/driver/verification/all        - Get all verifications
POST   /api/driver/verification/{id}/approve - Approve driver
POST   /api/driver/verification/{id}/reject  - Reject driver
```

### 2. Ride Lifecycle System

#### Ride Statuses

```
REQUESTED (BROADCASTED)  → Ride created, visible to drivers
    ↓
ACCEPTED                 → Driver accepted the ride
    ↓
ARRIVED                  → Driver arrived at pickup (optional)
    ↓
STARTED (IN_PROGRESS)   → Trip started
    ↓
COMPLETED               → Trip completed successfully

CANCELLED_BY_DRIVER     → Driver cancelled before/during trip
CANCELLED_BY_CUSTOMER   → Customer cancelled the ride
CANCELLED_BY_ADMIN      → Admin intervention
```

#### Backend Components

- **Existing RideLifecycleController.java** - Updated with driver verification check
- **Existing RideLifecycleService.java** - Updated to enforce approval requirement
- **Existing Booking model** - Has all lifecycle fields

#### Frontend Components

- **DriverRideRequests.jsx** - Driver ride request interface
  - View pending rides by vehicle type
  - Accept/reject rides
  - View current active ride
  - Start/complete rides
  - Cancel rides with reason

#### Workflow

**For Customers:**

1. Book a ride → Status: BROADCASTED
2. Wait for driver acceptance
3. Track driver arrival and trip progress
4. Rate and provide feedback after completion

**For Drivers:**

1. Must be APPROVED to see ride requests
2. View pending rides filtered by vehicle type
3. Accept a ride → Status: ACCEPTED
4. Mark arrived (optional) → Status: ARRIVED
5. Start trip → Status: STARTED
6. Complete trip → Status: COMPLETED
7. Can cancel before completion with reason

**For Admins:**

1. View all rides and their statuses
2. Monitor driver performance
3. Review driver verifications
4. Approve/reject driver applications

#### API Endpoints (Existing)

**Driver Operations:**

```
GET    /api/rides/pending?vehicleType={type}  - Get pending rides
GET    /api/rides/active                      - Get driver's active ride
PUT    /api/rides/{id}/accept                 - Accept a ride
PUT    /api/rides/{id}/arrived                - Mark arrived at pickup
PUT    /api/rides/{id}/start                  - Start the trip
PUT    /api/rides/{id}/complete               - Complete the trip
PUT    /api/rides/{id}/cancel                 - Cancel ride
GET    /api/rides/driver/history              - Get driver ride history
```

**Customer Operations:**

```
GET    /api/rides/customer/active             - Get customer's active ride
GET    /api/rides/customer/history            - Get ride history
PUT    /api/rides/{id}/customer-cancel        - Cancel ride
```

### 3. Dashboard Updates

#### Driver Dashboard

New tabs added:

- **Verification** - Submit and track verification status
- **Ride Requests** - Accept/manage pending rides
- **Overview** - Current ride and statistics
- **My Trips** - Historical rides
- **Vehicle Details** - Vehicle information
- **Earnings** - Revenue tracking

#### Admin Dashboard

New tab added:

- **Driver Verifications** - Review and approve driver applications
  - Filter by status (All, Pending, Approved, Rejected)
  - View complete driver details
  - Approve with optional remarks
  - Reject with mandatory reason

### 4. Database Schema

#### driver_verifications Table

```sql
CREATE TABLE driver_verifications (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    driver_id BIGINT NOT NULL UNIQUE,

    -- License Info
    license_number VARCHAR(100) NOT NULL,
    license_expiry_date DATE,
    license_state VARCHAR(100),
    license_country VARCHAR(100) DEFAULT 'India',

    -- Vehicle Info
    vehicle_make VARCHAR(100),
    vehicle_model VARCHAR(100),
    vehicle_year INT,
    vehicle_color VARCHAR(50),
    vehicle_plate_number VARCHAR(50),
    vehicle_type VARCHAR(50),
    vehicle_capacity INT,

    -- Insurance Info
    insurance_company VARCHAR(200),
    insurance_policy_number VARCHAR(100),
    insurance_expiry_date DATE,

    -- Documents
    license_document_url VARCHAR(500),
    vehicle_rc_document_url VARCHAR(500),
    insurance_document_url VARCHAR(500),
    photo_url VARCHAR(500),

    -- Additional Info
    experience_years INT,
    emergency_contact_name VARCHAR(100),
    emergency_contact_number VARCHAR(20),
    notes TEXT,

    -- Verification Status
    verification_status VARCHAR(50) NOT NULL DEFAULT 'PENDING_SUBMISSION',
    admin_remarks TEXT,
    approved_by_id BIGINT,
    approved_at TIMESTAMP NULL,
    rejected_at TIMESTAMP NULL,

    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (driver_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (approved_by_id) REFERENCES users(id) ON DELETE SET NULL
);
```

#### Existing bookings Table Fields

Already has all necessary ride lifecycle fields:

- `driver_id` - Assigned driver
- `status` - Current ride status
- `broadcasted_at` - When ride was broadcasted
- `accepted_at` - When driver accepted
- `arrived_at` - When driver arrived
- `started_at` - When trip started
- `completed_at` - When trip completed
- `cancelled_at` - When cancelled
- `cancelled_by` - Who cancelled (driver/customer/admin)
- `cancellation_reason` - Reason for cancellation

## Setup Instructions

### 1. Database Migration

Run the migration script:

```bash
mysql -u root -p neurofleetx < database/migrations/004_add_driver_verification_system.sql
```

### 2. Backend

The backend is already updated with:

- DriverVerification model
- DriverVerificationRepository
- DriverVerificationController
- Updated RideLifecycleService with approval checks

### 3. Frontend

New components created:

- DriverVerificationForm.jsx
- DriverRideRequests.jsx
- AdminDriverApprovals.jsx

Dashboards updated:

- DriverDashboard.jsx - Added Verification and Ride Requests tabs
- AdminDashboard.jsx - Added Driver Verifications tab

### 4. Testing the Flow

**As a Driver:**

1. Login to driver dashboard
2. Go to "Verification" tab
3. Fill in all required details
4. Submit for approval
5. Wait for admin approval
6. Once approved, go to "Ride Requests" tab
7. Select vehicle type and view pending rides
8. Accept a ride
9. Use Start/Complete buttons to manage the ride

**As an Admin:**

1. Login to admin dashboard
2. Go to "Driver Verifications" tab
3. Review pending driver submissions
4. Approve or reject with remarks
5. Monitor all rides in "Bookings" tab

**As a Customer:**

1. Book a ride from customer dashboard
2. Ride is broadcasted to eligible drivers
3. Receive notification when driver accepts
4. Track ride status in real-time
5. Rate driver after completion

## Security Features

1. **Driver Verification Required** - Drivers must be approved before accepting rides
2. **JWT Authentication** - All endpoints protected with JWT tokens
3. **Role-Based Access** - RBAC enforced on all endpoints
4. **Approval Status Check** - Double verification (User.approvalStatus + DriverVerification.status)
5. **Atomic Operations** - Race condition prevention in ride acceptance

## Real-time Updates

The system supports real-time updates via WebSocket for:

- Ride status changes
- Driver acceptance notifications
- Trip progress updates

## Future Enhancements

1. **Document Upload** - Actual file upload for license, RC, insurance
2. **Background Verification** - Integration with license verification APIs
3. **Expiry Reminders** - Notifications for expiring documents
4. **Automated Suspension** - Auto-suspend drivers with expired documents
5. **Rating System** - Customer ratings affect driver approval
6. **Performance Metrics** - Track driver acceptance rate, cancellations, etc.

## File Structure

```
backend/
├── src/main/java/com/neurofleetx/
│   ├── model/
│   │   └── DriverVerification.java          (NEW)
│   ├── repository/
│   │   └── DriverVerificationRepository.java (NEW)
│   ├── controller/
│   │   ├── DriverVerificationController.java (NEW)
│   │   └── RideLifecycleController.java      (EXISTING)
│   ├── service/
│   │   └── RideLifecycleService.java         (UPDATED)
│   └── dto/
│       └── DriverVerificationRequest.java    (NEW)

frontend/
├── src/
│   ├── components/
│   │   ├── DriverVerificationForm.jsx        (NEW)
│   │   ├── DriverRideRequests.jsx            (NEW)
│   │   └── AdminDriverApprovals.jsx          (NEW)
│   └── pages/
│       ├── DriverDashboard.jsx               (UPDATED)
│       └── AdminDashboard.jsx                (UPDATED)

database/
└── migrations/
    └── 004_add_driver_verification_system.sql (NEW)
```

## Status Codes & Error Handling

### HTTP Status Codes

- `200 OK` - Success
- `204 No Content` - No active ride found (normal)
- `400 Bad Request` - Validation error or business rule violation
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not authorized (e.g., driver not approved)
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

### Common Error Messages

- "Driver is not approved. Please complete verification and wait for admin approval."
- "Driver verification is not approved. Please complete your verification details."
- "Booking not available for acceptance. Current status: ACCEPTED"
- "Booking already accepted by another driver"
- "Ride can only start after driver arrival"

## Support

For issues or questions:

1. Check backend logs for detailed error messages
2. Verify database migration was successful
3. Ensure driver has APPROVED status in both User and DriverVerification tables
4. Check JWT token validity and user roles
