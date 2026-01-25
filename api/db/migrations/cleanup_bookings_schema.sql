ALTER TABLE bookings DROP COLUMN slot_id;
ALTER TABLE bookings CHANGE COLUMN amount total_amount decimal(10,2) NOT NULL COMMENT 'Total amount paid by user';
ALTER TABLE bookings CHANGE COLUMN session_fee session_amount decimal(10,2) DEFAULT NULL COMMENT 'Amount for the mentor';
