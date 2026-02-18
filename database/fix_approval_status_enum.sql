-- Fix approval_status enum mismatch
-- Update old values to new enum values

USE neurofleetx;

-- Update old enum values to match new User.ApprovalStatus enum
UPDATE users 
SET approval_status = CASE 
    WHEN approval_status = 'APPROVED_DRIVER' THEN 'APPROVED'
    WHEN approval_status = 'PENDING' THEN 'PENDING_ACCOUNT_APPROVAL'
    WHEN approval_status = 'WAITING' THEN 'PENDING_ACCOUNT_APPROVAL'
    WHEN approval_status = 'APPROVED' THEN 'APPROVED'
    WHEN approval_status = 'REJECTED' THEN 'REJECTED'
    WHEN approval_status = 'SUSPENDED' THEN 'SUSPENDED'
    WHEN approval_status = 'ACCOUNT_APPROVED' THEN 'ACCOUNT_APPROVED'
    WHEN approval_status = 'PENDING_ACCOUNT_APPROVAL' THEN 'PENDING_ACCOUNT_APPROVAL'
    ELSE 'PENDING_ACCOUNT_APPROVAL'
END;

-- Verify the changes
SELECT approval_status, COUNT(*) as count 
FROM users 
GROUP BY approval_status;
