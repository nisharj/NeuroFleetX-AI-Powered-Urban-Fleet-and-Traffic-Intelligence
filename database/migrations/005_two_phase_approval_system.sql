-- Migration: Two-Phase Driver Approval System
-- Updates User approval statuses to support Phase 1 (Account) and Phase 2 (Ride Eligibility)

-- Update existing PENDING status to PENDING_ACCOUNT_APPROVAL
UPDATE users 
SET approval_status = 'PENDING_ACCOUNT_APPROVAL' 
WHERE approval_status = 'PENDING';

-- Update existing PENDING_APPROVAL to ACCOUNT_APPROVED 
-- (These users have submitted details but we're separating account from verification approval)
UPDATE users 
SET approval_status = 'ACCOUNT_APPROVED' 
WHERE approval_status = 'PENDING_APPROVAL';

-- Note: 
-- APPROVED status remains unchanged - these users are fully approved for both phases
-- REJECTED, SUSPENDED statuses remain unchanged
-- Existing driver_verifications table handles Phase 2 (ride eligibility) separately

-- Verification: Check the distribution of approval statuses
SELECT approval_status, role, COUNT(*) as count
FROM users
GROUP BY approval_status, role
ORDER BY role, approval_status;
