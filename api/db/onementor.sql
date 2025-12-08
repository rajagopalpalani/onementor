-- MySQL dump 10.13  Distrib 9.5.0, for macos15.7 (arm64)
--
-- Host: localhost    Database: onementor
-- ------------------------------------------------------
-- Server version	9.5.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
SET @MYSQLDUMP_TEMP_LOG_BIN = @@SESSION.SQL_LOG_BIN;
SET @@SESSION.SQL_LOG_BIN= 0;

--
-- GTID state at the beginning of the backup 
--

SET @@GLOBAL.GTID_PURGED=/*!80000 '+'*/ '3dfe8722-d07f-11f0-ad14-2afb7143fb22:1-173';

--
-- Table structure for table `bookings`
--

DROP TABLE IF EXISTS `bookings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bookings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL COMMENT 'References users.id where role=user',
  `mentor_id` int NOT NULL COMMENT 'References users.id where role=mentor',
  `slots` json NOT NULL COMMENT 'Array of slot IDs: [1, 2, 3]',
  `slot_id` int DEFAULT NULL COMMENT 'Deprecated: Use booking_slots table instead',
  `status` enum('pending','confirmed','completed','cancelled','rejected') DEFAULT 'pending' COMMENT 'Booking status',
  `session_date` date DEFAULT NULL COMMENT 'Date of the first session (for single slot bookings)',
  `session_start_time` time DEFAULT NULL COMMENT 'Start time of the first session (for single slot bookings)',
  `session_end_time` time DEFAULT NULL COMMENT 'End time of the last session (for single slot bookings)',
  `amount` decimal(10,2) NOT NULL COMMENT 'Total amount for the booking',
  `payment_status` enum('pending','paid','failed','refunded') DEFAULT 'pending' COMMENT 'Payment status',
  `payout_order_id` varchar(255) DEFAULT NULL COMMENT 'JUSPAY payout order ID',
  `payout_order_status` varchar(50) DEFAULT NULL COMMENT 'JUSPAY payout order status',
  `payout_order_data` json DEFAULT NULL COMMENT 'Full JUSPAY payout order response data',
  `meeting_link` varchar(500) DEFAULT NULL COMMENT 'Video meeting link (Zoom, Google Meet, etc.)',
  `notes` text COMMENT 'Additional notes for the session',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `mentor_id` (`mentor_id`),
  KEY `slot_id` (`slot_id`),
  KEY `idx_status` (`status`),
  KEY `idx_payment_status` (`payment_status`),
  KEY `idx_session_date` (`session_date`),
  KEY `idx_payout_order_id` (`payout_order_id`),
  CONSTRAINT `bookings_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `bookings_ibfk_2` FOREIGN KEY (`mentor_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `interactions`
--

DROP TABLE IF EXISTS `interactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `interactions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL COMMENT 'References users.id',
  `question` text COMMENT 'User question',
  `response` text COMMENT 'AI/system response',
  `interaction_type` varchar(50) DEFAULT NULL COMMENT 'Type of interaction',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `interactions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `mentor_profiles`
--

DROP TABLE IF EXISTS `mentor_profiles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mentor_profiles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL COMMENT 'References users.id where role=mentor',
  `username` varchar(100) DEFAULT NULL,
  `category` varchar(50) DEFAULT NULL COMMENT 'e.g., fitness, career, tech',
  `bio` text COMMENT 'Mentor biography',
  `skills` json DEFAULT NULL COMMENT 'Array of skills',
  `other_skills` json DEFAULT NULL COMMENT 'Additional skills',
  `resume` varchar(255) DEFAULT NULL COMMENT 'Resume file path',
  `rating` decimal(3,2) DEFAULT '0.00' COMMENT 'Average rating from reviews',
  `total_sessions` int DEFAULT '0' COMMENT 'Total completed sessions',
  `beneficiary_id` varchar(45) DEFAULT NULL,
  `hourly_rate` decimal(10,2) DEFAULT NULL COMMENT 'Hourly rate for sessions',
  `vpa_id` varchar(255) DEFAULT NULL COMMENT 'UPI VPA ID (e.g., name@upi)',
  `vpa_status` enum('pending','valid','invalid','verified','failed') DEFAULT 'pending' COMMENT 'VPA validation status',
  `vpa_validated_at` datetime DEFAULT NULL COMMENT 'When VPA was validated',
  `vpa_name_at_bank` varchar(255) DEFAULT NULL COMMENT 'Name as per bank records',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`),
  KEY `idx_category` (`category`),
  KEY `idx_beneficiary_id` (`beneficiary_id`),
  KEY `idx_vpa_status` (`vpa_status`),
  CONSTRAINT `mentor_profiles_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `mentor_slots`
--

DROP TABLE IF EXISTS `mentor_slots`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mentor_slots` (
  `id` int NOT NULL AUTO_INCREMENT,
  `mentor_id` int NOT NULL COMMENT 'References users.id where role=mentor',
  `date` date NOT NULL COMMENT 'Date of the slot',
  `start_time` time NOT NULL COMMENT 'Start time of the slot',
  `end_time` time NOT NULL COMMENT 'End time of the slot',
  `amount` decimal(10,2) DEFAULT NULL COMMENT 'Price for this specific slot (if different from mentor hourly rate)',
  `currency` varchar(45) DEFAULT 'INR',
  `is_booked` tinyint(1) DEFAULT '0' COMMENT 'Whether the slot is booked',
  `is_active` tinyint(1) DEFAULT '1' COMMENT 'Whether the slot is active/available',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `mentor_id` (`mentor_id`),
  KEY `idx_date_time` (`date`,`start_time`,`end_time`),
  KEY `idx_is_booked` (`is_booked`,`is_active`),
  KEY `idx_amount` (`amount`),
  CONSTRAINT `mentor_slots_ibfk_1` FOREIGN KEY (`mentor_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `otps`
--

DROP TABLE IF EXISTS `otps`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `otps` (
  `id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `otp_hash` varchar(255) NOT NULL,
  `expires_at` datetime NOT NULL,
  `used` tinyint DEFAULT '0',
  `purpose` enum('verification','password_reset','login') DEFAULT 'verification' COMMENT 'Purpose of OTP',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `email` (`email`),
  KEY `idx_expires_at` (`expires_at`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `payments`
--

DROP TABLE IF EXISTS `payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `booking_id` int NOT NULL COMMENT 'References bookings.id',
  `user_id` int NOT NULL COMMENT 'References users.id (who made the payment)',
  `mentor_id` int NOT NULL COMMENT 'References users.id (who receives the payment)',
  `amount` decimal(10,2) NOT NULL COMMENT 'Payment amount',
  `currency` varchar(3) DEFAULT 'USD' COMMENT 'Currency code',
  `payment_method` varchar(50) DEFAULT NULL COMMENT 'Payment method (stripe, paypal, etc.)',
  `transaction_id` varchar(255) DEFAULT NULL COMMENT 'Payment gateway transaction ID',
  `status` enum('pending','processing','completed','failed','refunded') DEFAULT 'pending' COMMENT 'Payment status',
  `payment_date` datetime DEFAULT NULL COMMENT 'When payment was completed',
  `refund_amount` decimal(10,2) DEFAULT NULL COMMENT 'Refund amount if applicable',
  `refund_date` datetime DEFAULT NULL COMMENT 'When refund was processed',
  `metadata` json DEFAULT NULL COMMENT 'Additional payment metadata',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `booking_id` (`booking_id`),
  KEY `user_id` (`user_id`),
  KEY `mentor_id` (`mentor_id`),
  KEY `idx_transaction_id` (`transaction_id`),
  KEY `idx_status` (`status`),
  KEY `idx_payment_date` (`payment_date`),
  CONSTRAINT `payments_ibfk_1` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`) ON DELETE CASCADE,
  CONSTRAINT `payments_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `payments_ibfk_3` FOREIGN KEY (`mentor_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `progress`
--

DROP TABLE IF EXISTS `progress`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `progress` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL COMMENT 'References users.id',
  `booking_id` int DEFAULT NULL COMMENT 'References bookings.id (optional)',
  `notes` text COMMENT 'Progress notes',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `booking_id` (`booking_id`),
  CONSTRAINT `progress_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `progress_ibfk_2` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `session_reports`
--

DROP TABLE IF EXISTS `session_reports`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `session_reports` (
  `id` int NOT NULL AUTO_INCREMENT,
  `booking_id` int NOT NULL COMMENT 'References bookings.id',
  `user_id` int NOT NULL COMMENT 'References users.id (who gave feedback)',
  `mentor_id` int NOT NULL COMMENT 'References users.id (who received feedback)',
  `rating` int DEFAULT NULL COMMENT 'Rating from 1 to 5',
  `comments` text COMMENT 'Feedback comments',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `booking_id` (`booking_id`),
  KEY `user_id` (`user_id`),
  KEY `mentor_id` (`mentor_id`),
  CONSTRAINT `session_reports_ibfk_1` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`) ON DELETE CASCADE,
  CONSTRAINT `session_reports_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `session_reports_ibfk_3` FOREIGN KEY (`mentor_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_profiles`
--

DROP TABLE IF EXISTS `user_profiles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_profiles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL COMMENT 'References users.id where role=user',
  `skills` json DEFAULT NULL COMMENT 'Array of user skills',
  `interests` json DEFAULT NULL COMMENT 'Array of user interests',
  `resume` varchar(255) DEFAULT NULL COMMENT 'Resume file path',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`),
  CONSTRAINT `user_profiles_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `password_hash` varchar(255) NOT NULL COMMENT 'Hashed password for authentication',
  `role` enum('user','mentor') NOT NULL DEFAULT 'user' COMMENT 'Role: user or mentor',
  `is_verified` tinyint(1) DEFAULT '0' COMMENT 'Email verification status',
  `is_active` tinyint(1) DEFAULT '1' COMMENT 'Account active status',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_role` (`role`),
  KEY `idx_email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
SET @@SESSION.SQL_LOG_BIN = @MYSQLDUMP_TEMP_LOG_BIN;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-12-09  0:25:15
