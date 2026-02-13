# Two-Phase Driver Approval System

## Overview

NeuroFleetX implements a two-phase approval system for drivers to ensure both account legitimacy and ride eligibility before drivers can accept ride requests.

## Phase 1: Account Approval

### Purpose

Verify the identity and basic credentials of driver accounts upon registration.

### Workflow

1. **Driver Registration**
   - Driver registers through the registration page
   - Account is created with status `PENDING_ACCOUNT_APPROVAL`
   - Account is set to inactive (`isActive = false`)
   - Driver **cannot log in** until approved

2. **Admin Review**
   - Admin accesses "Account Approvals (Phase 1)" tab in Admin Dashboard
   - Reviews driver registration details (name, email, phone)
   - Options:
     - **Approve**: Changes status to `ACCOUNT_APPROVED`, sets `isActive = true`
     - **Reject**: Changes status to `REJECTED`, account remains inactive

3. **Driver Login**
   - After approval, driver can log in to the driver dashboard
   - Driver sees Phase 1 status as "Approved" ✓
   - Driver can now proceed to Phase 2

### Status Values (Phase 1)

- `PENDING_ACCOUNT_APPROVAL` - Just registered, waiting for admin approval
- `ACCOUNT_APPROVED` - Account approved, can login but cannot accept rides yet
- `REJECTED` - Account rejected by admin
- `SUSPENDED` - Account suspended by admin
- `APPROVED` - Legacy status for fully approved (both phases)

## Phase 2: Ride Eligibility Approval

### Purpose

Verify driver's license, vehicle details, insurance, and supporting documents before allowing them to accept ride requests.

### Workflow

1. **Driver Submission**
   - After Phase 1 approval and login, driver navigates to "Verification" tab
   - Submits comprehensive verification form including:
     - **License Information**: License number, expiry date, state, country
     - **Vehicle Details**: Make, model, year, color, plate number, type, capacity
     - **Insurance**: Company, policy number, expiry date
     - **Documents**: License scan, vehicle RC, insurance certificate, driver photo
     - **Additional Info**: Experience years, emergency contact
   - Status changes to `PENDING_APPROVAL` in `driver_verifications` table

2. **Admin Review**
   - Admin accesses "Ride Eligibility (Phase 2)" tab in Admin Dashboard
   - Reviews all submitted verification details and documents
   - Options:
     - **Approve**: Sets `verificationStatus = APPROVED`, driver can now accept rides
     - **Reject**: Sets `verificationStatus = REJECTED`, driver can resubmit
     - **Request Resubmission**: Sets `verificationStatus = RESUBMISSION_REQUIRED`

3. **Ride Acceptance**
   - Only after **both Phase 1 and Phase 2 approvals**, driver can:
     - View "Ride Requests" tab
     - Accept pending ride requests
     - Access the full ride lifecycle workflow

### Status Values (Phase 2)

- `PENDING_SUBMISSION` - Driver has not yet submitted verification
- `PENDING_APPROVAL` - Verification submitted, waiting for admin review
- `APPROVED` - Verification approved, driver can accept rides ✓
- `REJECTED` - Verification rejected, driver can resubmit
- `RESUBMISSION_REQUIRED` - Admin requested changes/updates

## Backend Implementation

### Models

#### User.java

```java
public enum ApprovalStatus {
    PENDING_ACCOUNT_APPROVAL,  // Phase 1: Awaiting account approval
    ACCOUNT_APPROVED,           // Phase 1 complete: Can login
    APPROVED,                   // Legacy: Fully approved
    REJECTED,                   // Account rejected
    SUSPENDED                   // Account suspended
}
```

#### DriverVerification.java

```java
public enum VerificationStatus {
    PENDING_SUBMISSION,         // Not yet submitted
    PENDING_APPROVAL,           // Phase 2: Awaiting verification approval
    APPROVED,                   // Phase 2 complete: Can accept rides
    REJECTED,                   // Verification rejected
    RESUBMISSION_REQUIRED       // Needs resubmission
}
```

### Controllers

#### AdminController.java

- **Phase 1 Endpoints**:
  - `GET /api/admin/pending-approvals` - List drivers pending account approval
  - `POST /api/admin/approve-user/{userId}` - Approve account (Phase 1)
  - `POST /api/admin/reject-user/{userId}` - Reject account

#### DriverVerificationController.java

- **Phase 2 Endpoints**:
  - `GET /api/driver/verification/status` - Get verification status
  - `POST /api/driver/verification/submit` - Submit verification details
  - `GET /api/driver/verification/pending` - Admin: List pending verifications
  - `GET /api/driver/verification/all` - Admin: List all verifications
  - `POST /api/driver/verification/{id}/approve` - Admin: Approve verification (Phase 2)
  - `POST /api/driver/verification/{id}/reject` - Admin: Reject verification

#### RideLifecycleService.java

- **Ride Acceptance Validation**:

  ```java
  // Phase 1: Check account approval
  if (driver.getApprovalStatus() != ACCOUNT_APPROVED &&
      driver.getApprovalStatus() != APPROVED) {
      throw new RuntimeException("Account not approved");
  }

  // Phase 2: Check ride eligibility
  DriverVerification verification = findByDriverId(driverId);
  if (verification.getVerificationStatus() != APPROVED) {
      throw new RuntimeException("Verification not approved");
  }
  ```

## Frontend Implementation

### Driver Dashboard

#### Status Display

Two status banners showing:

1. **Phase 1: Account Approval**
   - ✓ Green if account approved
   - ⏳ Yellow if pending
   - Shows message: "Account approved, can now submit verification"

2. **Phase 2: Ride Eligibility**
   - ✓ Green if verification approved
   - ⏳ Yellow if pending/not submitted
   - Shows message: "Verification approved, can accept rides"

#### Tabs

1. **Overview** - Always visible
2. **Verification**
   - Blocked if account not approved (Phase 1 incomplete)
   - Shows verification form if account approved
3. **Ride Requests**
   - Blocked if account not approved (Phase 1 incomplete)
   - Blocked if verification not approved (Phase 2 incomplete)
   - Only visible when both phases complete

### Admin Dashboard

#### Tabs

1. **Overview** - System stats
2. **User Management** - All users
3. **Account Approvals (Phase 1)** - Pending account registrations
   - Shows badge with count of pending approvals
   - Approve/Reject buttons for each driver
4. **Ride Eligibility (Phase 2)** - Pending verifications
   - Filter by status: All, Pending, Approved, Rejected
   - View full verification details
   - Approve/Reject with optional remarks
5. **Driver Management** - All drivers
6. **Bookings** - All bookings

## Database Migration

### Migration File: `005_two_phase_approval_system.sql`

```sql
-- Update existing PENDING to PENDING_ACCOUNT_APPROVAL
UPDATE users
SET approval_status = 'PENDING_ACCOUNT_APPROVAL'
WHERE approval_status = 'PENDING';

-- Update existing PENDING_APPROVAL to ACCOUNT_APPROVED
UPDATE users
SET approval_status = 'ACCOUNT_APPROVED'
WHERE approval_status = 'PENDING_APPROVAL';
```

### To Execute Migration

```bash
mysql -u root -p neurofleetx_db < database/migrations/005_two_phase_approval_system.sql
```

Or via MySQL Workbench:

1. Open the SQL file
2. Select neurofleetx_db database
3. Execute the script

## User Experience Flow

### Driver Journey

```
1. Register → PENDING_ACCOUNT_APPROVAL
   ↓
2. Wait for Admin Phase 1 Approval
   ↓
3. Login Enabled → ACCOUNT_APPROVED
   ↓
4. Submit Verification Details → PENDING_APPROVAL
   ↓
5. Wait for Admin Phase 2 Approval
   ↓
6. Ride Requests Enabled → VERIFICATION: APPROVED
   ↓
7. Accept and Complete Rides ✓
```

### Admin Journey

```
1. Review Account Registrations (Phase 1)
   → Approve → Driver can login
   → Reject → Driver cannot login

2. Review Verification Submissions (Phase 2)
   → Approve → Driver can accept rides
   → Reject → Driver can resubmit
```

## Security & Validation

### Authentication Layer (AuthController)

- Blocks login if `status == PENDING_ACCOUNT_APPROVAL`
- Blocks login if `status == REJECTED`
- Blocks login if `status == SUSPENDED`
- Allows login if `status == ACCOUNT_APPROVED` or `APPROVED`

### Ride Acceptance Layer (RideLifecycleService)

- Checks `User.approvalStatus` for account approval
- Checks `DriverVerification.verificationStatus` for ride eligibility
- Both must be approved to accept rides
- Returns clear error messages for each missing approval

### API Endpoints

- `/api/driver/*` - Requires `ROLE_DRIVER`
- `/api/admin/*` - Requires `ROLE_ADMIN` or `ROLE_FLEET_MANAGER`
- All protected by JWT authentication

## Benefits

### For Admins

- **Granular Control**: Separate account verification from ride eligibility
- **Reduced Risk**: Review documents before allowing ride acceptance
- **Better Tracking**: Clear visibility into which phase each driver is in
- **Flexibility**: Can approve accounts quickly, review verification later

### For Drivers

- **Clear Process**: Know exactly what's needed at each step
- **Progress Visibility**: See status of both approval phases
- **Faster Onboarding**: Can log in after Phase 1, prepare documents for Phase 2

### For System

- **Data Integrity**: Ensures all drivers have verified credentials
- **Compliance**: Meet regulatory requirements for driver verification
- **Safety**: Only verified drivers can accept ride requests

## Testing Checklist

### Backend

- [ ] New driver registration creates `PENDING_ACCOUNT_APPROVAL` status
- [ ] Login blocked for `PENDING_ACCOUNT_APPROVAL` drivers
- [ ] Phase 1 approval sets `ACCOUNT_APPROVED` and allows login
- [ ] Phase 2 approval sets verification `APPROVED`
- [ ] Ride acceptance blocked without both approvals
- [ ] Ride acceptance allowed with both approvals
- [ ] Admin can view pending accounts and verifications separately

### Frontend

- [ ] Driver dashboard shows both approval status banners
- [ ] Verification tab blocked if account not approved
- [ ] Ride requests tab blocked if verification not approved
- [ ] Admin sees two separate tabs for Phase 1 and Phase 2 approvals
- [ ] Pending count badge shows on Phase 1 tab

## Troubleshooting

### Driver Cannot Login

- Check `User.approvalStatus` in database
- Should be `ACCOUNT_APPROVED` or `APPROVED`, not `PENDING_ACCOUNT_APPROVAL`

### Driver Cannot Accept Rides

- Check Phase 1: `User.approvalStatus` should be `ACCOUNT_APPROVED` or `APPROVED`
- Check Phase 2: `DriverVerification.verificationStatus` should be `APPROVED`
- Check backend logs for detailed error messages

### Migration Issues

- If migration fails, manually update approval statuses in database
- Use SQL queries from migration file individually
- Verify with: `SELECT approval_status, COUNT(*) FROM users GROUP BY approval_status;`

## Future Enhancements

1. **Email Notifications**
   - Notify driver when Phase 1 approved (can now login)
   - Notify driver when Phase 2 approved (can now accept rides)
   - Notify driver if rejected with reason

2. **Document Upload**
   - Direct file upload to cloud storage (S3, CloudFlare R2)
   - Image preview in admin review interface
   - Document expiry tracking and renewal reminders

3. **Automated Verification**
   - License number validation via DMV API integration
   - Insurance policy verification
   - Vehicle registration cross-check

4. **Re-verification**
   - Periodic reverification for expired licenses/insurance
   - Automatic status update when documents expire
   - Driver notification before expiry

5. **Analytics Dashboard**
   - Phase 1 approval time metrics
   - Phase 2 approval time metrics
   - Rejection rate and common rejection reasons
   - Driver onboarding funnel visualization
