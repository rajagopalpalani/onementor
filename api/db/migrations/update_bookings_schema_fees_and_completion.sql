ALTER TABLE bookings
ADD COLUMN session_fee decimal(10,2) DEFAULT NULL COMMENT 'Amount for the mentor (Total - Platform Fee)',
ADD COLUMN platform_fee decimal(10,2) DEFAULT NULL COMMENT 'Platform fee charged',
ADD COLUMN mentor_completed tinyint(1) DEFAULT '0' COMMENT '1 if mentor marked as completed',
ADD COLUMN mentor_completed_at datetime DEFAULT NULL,
ADD COLUMN user_completed tinyint(1) DEFAULT '0' COMMENT '1 if user marked as completed',
ADD COLUMN user_completed_at datetime DEFAULT NULL,
ADD COLUMN completed_at datetime DEFAULT NULL COMMENT 'When both confirmed',
ADD COLUMN payout_status enum('pending','ready_for_payout','payout_initiated','paid') DEFAULT 'pending';
