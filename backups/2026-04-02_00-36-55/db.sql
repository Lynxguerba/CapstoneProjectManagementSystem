-- MySQL dump 10.13  Distrib 8.0.45, for Linux (x86_64)
--
-- Host: localhost    Database: cpms
-- ------------------------------------------------------
-- Server version	8.0.45

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

--
-- Table structure for table `academic_years`
--

DROP TABLE IF EXISTS `academic_years`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `academic_years` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `start_year` smallint unsigned NOT NULL,
  `end_year` smallint unsigned NOT NULL,
  `label` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_current` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `academic_years_start_year_end_year_unique` (`start_year`,`end_year`),
  UNIQUE KEY `academic_years_label_unique` (`label`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `academic_years`
--

LOCK TABLES `academic_years` WRITE;
/*!40000 ALTER TABLE `academic_years` DISABLE KEYS */;
INSERT INTO `academic_years` VALUES (1,2025,2026,'2025-2026',1,'2026-04-01 15:32:00','2026-04-01 15:32:00');
/*!40000 ALTER TABLE `academic_years` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `adviser_availabilities`
--

DROP TABLE IF EXISTS `adviser_availabilities`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `adviser_availabilities` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `adviser_id` bigint unsigned NOT NULL,
  `is_available` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `adviser_availabilities_adviser_id_unique` (`adviser_id`),
  CONSTRAINT `adviser_availabilities_adviser_id_foreign` FOREIGN KEY (`adviser_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `adviser_availabilities`
--

LOCK TABLES `adviser_availabilities` WRITE;
/*!40000 ALTER TABLE `adviser_availabilities` DISABLE KEYS */;
/*!40000 ALTER TABLE `adviser_availabilities` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `adviser_program_utilities`
--

DROP TABLE IF EXISTS `adviser_program_utilities`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `adviser_program_utilities` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `adviser_id` bigint unsigned NOT NULL,
  `program` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `max_groups` smallint unsigned NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `adviser_program_utilities_adviser_id_program_unique` (`adviser_id`,`program`),
  KEY `adviser_program_utilities_adviser_id_index` (`adviser_id`),
  CONSTRAINT `adviser_program_utilities_adviser_id_foreign` FOREIGN KEY (`adviser_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `adviser_program_utilities`
--

LOCK TABLES `adviser_program_utilities` WRITE;
/*!40000 ALTER TABLE `adviser_program_utilities` DISABLE KEYS */;
/*!40000 ALTER TABLE `adviser_program_utilities` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `adviser_recommendation_documents`
--

DROP TABLE IF EXISTS `adviser_recommendation_documents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `adviser_recommendation_documents` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `group_id` bigint unsigned NOT NULL,
  `adviser_id` bigint unsigned NOT NULL,
  `document_requirement_id` bigint unsigned NOT NULL,
  `document_submission_id` bigint unsigned DEFAULT NULL,
  `file_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_path` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `approved_titles` json NOT NULL,
  `submitted_by_names` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `signed_at` timestamp NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `adviser_recommendation_documents_adviser_id_foreign` (`adviser_id`),
  KEY `adviser_recommendation_documents_document_requirement_id_foreign` (`document_requirement_id`),
  KEY `adviser_recommendation_documents_document_submission_id_foreign` (`document_submission_id`),
  KEY `adviser_reco_group_requirement_index` (`group_id`,`document_requirement_id`),
  CONSTRAINT `adviser_recommendation_documents_adviser_id_foreign` FOREIGN KEY (`adviser_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `adviser_recommendation_documents_document_requirement_id_foreign` FOREIGN KEY (`document_requirement_id`) REFERENCES `document_requirements` (`id`) ON DELETE CASCADE,
  CONSTRAINT `adviser_recommendation_documents_document_submission_id_foreign` FOREIGN KEY (`document_submission_id`) REFERENCES `document_submissions` (`id`) ON DELETE SET NULL,
  CONSTRAINT `adviser_recommendation_documents_group_id_foreign` FOREIGN KEY (`group_id`) REFERENCES `groups` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `adviser_recommendation_documents`
--

LOCK TABLES `adviser_recommendation_documents` WRITE;
/*!40000 ALTER TABLE `adviser_recommendation_documents` DISABLE KEYS */;
/*!40000 ALTER TABLE `adviser_recommendation_documents` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `audit_logs`
--

DROP TABLE IF EXISTS `audit_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `audit_logs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned DEFAULT NULL,
  `actor_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `action` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `entity` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `severity` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'info',
  `route_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `http_method` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status_code` smallint unsigned DEFAULT NULL,
  `ip_address` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `metadata` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `audit_logs_severity_created_at_index` (`severity`,`created_at`),
  KEY `audit_logs_user_id_created_at_index` (`user_id`,`created_at`),
  KEY `audit_logs_route_name_index` (`route_name`),
  CONSTRAINT `audit_logs_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=27 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audit_logs`
--

LOCK TABLES `audit_logs` WRITE;
/*!40000 ALTER TABLE `audit_logs` DISABLE KEYS */;
INSERT INTO `audit_logs` VALUES (1,1,'Admin User','Create Users Bulk Store','Users','info','admin.users.bulk-store','POST',202,'172.18.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','POST admin/users/bulk completed with status 202','{\"path\": \"admin/users/bulk\", \"query\": {\"type\": \"student\"}, \"input_keys\": [\"type\", \"rows\"]}','2026-04-01 15:28:47','2026-04-01 15:28:47'),(2,1,'Admin User','Create Users Bulk Store','Users','info','admin.users.bulk-store','POST',202,'172.18.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','POST admin/users/bulk completed with status 202','{\"path\": \"admin/users/bulk\", \"query\": {\"type\": \"student\"}, \"input_keys\": [\"type\", \"rows\"]}','2026-04-01 15:30:56','2026-04-01 15:30:56'),(3,1,'Admin User','Update System Settings Update','System Settings','warning','admin.system-settings.update','PUT',302,'172.18.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','PUT admin/system-settings completed with status 302','{\"path\": \"admin/system-settings\", \"query\": [], \"input_keys\": [\"academicYear\"]}','2026-04-01 15:32:00','2026-04-01 15:32:00'),(4,1,'Admin User','Create Users Bulk Store','Users','info','admin.users.bulk-store','POST',202,'172.18.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','POST admin/users/bulk completed with status 202','{\"path\": \"admin/users/bulk\", \"query\": {\"type\": \"faculty\"}, \"input_keys\": [\"type\", \"rows\"]}','2026-04-01 15:32:11','2026-04-01 15:32:11'),(5,1,'Admin User','Update Users Update','Users','warning','admin.users.update','PUT',302,'172.18.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','PUT admin/users/325 completed with status 302','{\"path\": \"admin/users/325\", \"query\": {\"from\": \"faculty\"}, \"input_keys\": [\"first_name\", \"last_name\", \"email\", \"roles\", \"status\", \"program\", \"from\"]}','2026-04-01 15:33:10','2026-04-01 15:33:10'),(6,1,'Admin User','User Logout','Authentication','info','logout','POST',302,'172.18.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','User logged out successfully.','{\"active_role\": \"admin\", \"assigned_roles\": [\"admin\"]}','2026-04-01 15:33:19','2026-04-01 15:33:19'),(7,325,'Bea Uy','User Login','Authentication','info','login.store','POST',302,'172.18.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','User logged in successfully.','{\"active_role\": \"adviser\", \"assigned_roles\": [\"admin\", \"adviser\", \"instructor\", \"panelist\"]}','2026-04-01 15:33:26','2026-04-01 15:33:26'),(8,325,'Bea Uy','Create Switch Role','Switch Role','info','switch-role','POST',302,'172.18.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','POST switch-role completed with status 302','{\"path\": \"switch-role\", \"query\": [], \"input_keys\": [\"role\"]}','2026-04-01 15:33:45','2026-04-01 15:33:45'),(9,325,'Bea Uy','Create Instructor Program Sets Store','Instructor Program Sets','info','instructor.program-sets.store','POST',302,'172.18.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','POST instructor/program-sets completed with status 302','{\"path\": \"instructor/program-sets\", \"query\": [], \"input_keys\": [\"name\", \"program\", \"academic_year_id\"]}','2026-04-01 15:35:26','2026-04-01 15:35:26'),(10,325,'Bea Uy','Create Instructor Students Bulk Enroll','Instructor Students','info','instructor.students.bulk-enroll','POST',302,'172.18.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','POST instructor/students/bulk-enroll completed with status 302','{\"path\": \"instructor/students/bulk-enroll\", \"query\": [], \"input_keys\": [\"program_set_id\", \"rows\"]}','2026-04-01 15:39:35','2026-04-01 15:39:35'),(11,325,'Bea Uy','Create Instructor Program Sets Store','Instructor Program Sets','info','instructor.program-sets.store','POST',302,'172.18.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','POST instructor/program-sets completed with status 302','{\"path\": \"instructor/program-sets\", \"query\": [], \"input_keys\": [\"name\", \"program\", \"academic_year_id\"]}','2026-04-01 15:40:09','2026-04-01 15:40:09'),(12,325,'Bea Uy','Create Instructor Students Bulk Enroll','Instructor Students','info','instructor.students.bulk-enroll','POST',302,'172.18.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','POST instructor/students/bulk-enroll completed with status 302','{\"path\": \"instructor/students/bulk-enroll\", \"query\": [], \"input_keys\": [\"program_set_id\", \"rows\"]}','2026-04-01 15:40:49','2026-04-01 15:40:49'),(13,325,'Bea Uy','Create Instructor Groups Store','Instructor Groups','info','instructor.groups.store','POST',302,'172.18.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','POST instructor/groups completed with status 302','{\"path\": \"instructor/groups\", \"query\": [], \"input_keys\": [\"program_set_id\", \"members\"]}','2026-04-01 15:41:34','2026-04-01 15:41:34'),(14,325,'Bea Uy','Create Instructor Groups Store','Instructor Groups','info','instructor.groups.store','POST',302,'172.18.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','POST instructor/groups completed with status 302','{\"path\": \"instructor/groups\", \"query\": [], \"input_keys\": [\"program_set_id\", \"members\"]}','2026-04-01 15:41:52','2026-04-01 15:41:52'),(15,325,'Bea Uy','Create Instructor Groups Store','Instructor Groups','info','instructor.groups.store','POST',302,'172.18.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','POST instructor/groups completed with status 302','{\"path\": \"instructor/groups\", \"query\": [], \"input_keys\": [\"program_set_id\", \"members\"]}','2026-04-01 15:42:08','2026-04-01 15:42:08'),(16,325,'Bea Uy','Create Instructor Groups Store','Instructor Groups','info','instructor.groups.store','POST',302,'172.18.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','POST instructor/groups completed with status 302','{\"path\": \"instructor/groups\", \"query\": [], \"input_keys\": [\"program_set_id\", \"members\"]}','2026-04-01 15:42:24','2026-04-01 15:42:24'),(17,325,'Bea Uy','Create Instructor Groups Store','Instructor Groups','info','instructor.groups.store','POST',302,'172.18.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','POST instructor/groups completed with status 302','{\"path\": \"instructor/groups\", \"query\": [], \"input_keys\": [\"program_set_id\", \"members\"]}','2026-04-01 15:42:45','2026-04-01 15:42:45'),(18,325,'Bea Uy','Create Instructor Groups Store','Instructor Groups','info','instructor.groups.store','POST',302,'172.18.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','POST instructor/groups completed with status 302','{\"path\": \"instructor/groups\", \"query\": [], \"input_keys\": [\"program_set_id\", \"members\"]}','2026-04-01 15:43:05','2026-04-01 15:43:05'),(19,325,'Bea Uy','Create Instructor Groups Store','Instructor Groups','info','instructor.groups.store','POST',302,'172.18.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','POST instructor/groups completed with status 302','{\"path\": \"instructor/groups\", \"query\": [], \"input_keys\": [\"program_set_id\", \"members\"]}','2026-04-01 15:43:51','2026-04-01 15:43:51'),(20,325,'Bea Uy','User Login','Authentication','info','login.store','POST',302,'172.18.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','User logged in successfully.','{\"active_role\": \"instructor\", \"assigned_roles\": [\"admin\", \"adviser\", \"instructor\", \"panelist\"]}','2026-04-01 16:32:41','2026-04-01 16:32:41'),(21,330,'David Smith','User Login','Authentication','info','login.store','POST',302,'172.18.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','User logged in successfully.','{\"active_role\": \"instructor\", \"assigned_roles\": [\"adviser\", \"instructor\"]}','2026-04-01 16:32:50','2026-04-01 16:32:50'),(22,330,'David Smith','Create Instructor Program Sets Store','Instructor Program Sets','info','instructor.program-sets.store','POST',302,'172.18.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','POST instructor/program-sets completed with status 302','{\"path\": \"instructor/program-sets\", \"query\": [], \"input_keys\": [\"name\", \"program\", \"academic_year_id\"]}','2026-04-01 16:33:12','2026-04-01 16:33:12'),(23,330,'David Smith','Create Instructor Students Bulk Enroll','Instructor Students','info','instructor.students.bulk-enroll','POST',302,'172.18.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','POST instructor/students/bulk-enroll completed with status 302','{\"path\": \"instructor/students/bulk-enroll\", \"query\": [], \"input_keys\": [\"program_set_id\", \"rows\"]}','2026-04-01 16:33:21','2026-04-01 16:33:21'),(24,325,'Bea Uy','Delete Instructor Groups Destroy','Instructor Groups','critical','instructor.groups.destroy','DELETE',302,'172.18.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','DELETE instructor/groups/7 completed with status 302','{\"path\": \"instructor/groups/7\", \"query\": [], \"input_keys\": []}','2026-04-01 16:34:17','2026-04-01 16:34:17'),(25,325,'Bea Uy','Create Instructor Groups Store','Instructor Groups','info','instructor.groups.store','POST',302,'172.18.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','POST instructor/groups completed with status 302','{\"path\": \"instructor/groups\", \"query\": [], \"input_keys\": [\"program_set_id\", \"members\"]}','2026-04-01 16:35:18','2026-04-01 16:35:18'),(26,325,'Bea Uy','Delete Instructor Groups Destroy','Instructor Groups','critical','instructor.groups.destroy','DELETE',302,'172.18.0.1','Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36','DELETE instructor/groups/8 completed with status 302','{\"path\": \"instructor/groups/8\", \"query\": [], \"input_keys\": []}','2026-04-01 16:35:58','2026-04-01 16:35:58');
/*!40000 ALTER TABLE `audit_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cache`
--

DROP TABLE IF EXISTS `cache`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cache` (
  `key` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `value` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `expiration` int NOT NULL,
  PRIMARY KEY (`key`),
  KEY `cache_expiration_index` (`expiration`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cache`
--

LOCK TABLES `cache` WRITE;
/*!40000 ALTER TABLE `cache` DISABLE KEYS */;
INSERT INTO `cache` VALUES ('cpms-cache-bulk_user_import:251aae9e-11be-4270-8900-c5f3f095be8e','a:15:{s:9:\"import_id\";s:36:\"251aae9e-11be-4270-8900-c5f3f095be8e\";s:12:\"requested_by\";i:1;s:4:\"type\";s:7:\"student\";s:6:\"status\";s:9:\"completed\";s:10:\"total_rows\";i:81;s:14:\"processed_rows\";i:81;s:15:\"successful_rows\";i:81;s:11:\"failed_rows\";i:0;s:19:\"progress_percentage\";i:100;s:7:\"message\";s:30:\"Import completed successfully.\";s:12:\"failed_items\";a:0:{}s:16:\"cancel_requested\";b:0;s:10:\"started_at\";s:25:\"2026-04-01T15:30:57+00:00\";s:11:\"finished_at\";s:25:\"2026-04-01T15:31:32+00:00\";s:10:\"updated_at\";s:25:\"2026-04-01T15:31:32+00:00\";}',1775100692),('cpms-cache-bulk_user_import:57c4b17f-467b-49b5-b7c5-5f546a62364c','a:15:{s:9:\"import_id\";s:36:\"57c4b17f-467b-49b5-b7c5-5f546a62364c\";s:12:\"requested_by\";i:1;s:4:\"type\";s:7:\"student\";s:6:\"status\";s:9:\"completed\";s:10:\"total_rows\";i:234;s:14:\"processed_rows\";i:234;s:15:\"successful_rows\";i:234;s:11:\"failed_rows\";i:0;s:19:\"progress_percentage\";i:100;s:7:\"message\";s:30:\"Import completed successfully.\";s:12:\"failed_items\";a:0:{}s:16:\"cancel_requested\";b:0;s:10:\"started_at\";s:25:\"2026-04-01T15:28:48+00:00\";s:11:\"finished_at\";s:25:\"2026-04-01T15:30:19+00:00\";s:10:\"updated_at\";s:25:\"2026-04-01T15:30:19+00:00\";}',1775100619),('cpms-cache-bulk_user_import:88c0cd9f-f150-4bd8-add1-d1c88d1b72b8','a:15:{s:9:\"import_id\";s:36:\"88c0cd9f-f150-4bd8-add1-d1c88d1b72b8\";s:12:\"requested_by\";i:1;s:4:\"type\";s:7:\"faculty\";s:6:\"status\";s:9:\"completed\";s:10:\"total_rows\";i:33;s:14:\"processed_rows\";i:33;s:15:\"successful_rows\";i:33;s:11:\"failed_rows\";i:0;s:19:\"progress_percentage\";i:100;s:7:\"message\";s:30:\"Import completed successfully.\";s:12:\"failed_items\";a:0:{}s:16:\"cancel_requested\";b:0;s:10:\"started_at\";s:25:\"2026-04-01T15:32:12+00:00\";s:11:\"finished_at\";s:25:\"2026-04-01T15:32:25+00:00\";s:10:\"updated_at\";s:25:\"2026-04-01T15:32:25+00:00\";}',1775100745);
/*!40000 ALTER TABLE `cache` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cache_locks`
--

DROP TABLE IF EXISTS `cache_locks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cache_locks` (
  `key` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `owner` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `expiration` int NOT NULL,
  PRIMARY KEY (`key`),
  KEY `cache_locks_expiration_index` (`expiration`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cache_locks`
--

LOCK TABLES `cache_locks` WRITE;
/*!40000 ALTER TABLE `cache_locks` DISABLE KEYS */;
/*!40000 ALTER TABLE `cache_locks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cross_set_group_requests`
--

DROP TABLE IF EXISTS `cross_set_group_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cross_set_group_requests` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `group_id` bigint unsigned NOT NULL,
  `student_id` bigint unsigned NOT NULL,
  `requested_by` bigint unsigned NOT NULL,
  `requested_to` bigint unsigned NOT NULL,
  `from_program_set_id` bigint unsigned NOT NULL,
  `to_program_set_id` bigint unsigned NOT NULL,
  `status` enum('pending','approved','rejected') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `remarks` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `responded_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `cross_set_group_requests_student_id_foreign` (`student_id`),
  KEY `cross_set_group_requests_requested_by_foreign` (`requested_by`),
  KEY `cross_set_group_requests_from_program_set_id_foreign` (`from_program_set_id`),
  KEY `cross_set_group_requests_to_program_set_id_foreign` (`to_program_set_id`),
  KEY `cross_set_group_requests_requested_to_status_index` (`requested_to`,`status`),
  KEY `cross_set_group_requests_group_id_student_id_index` (`group_id`,`student_id`),
  CONSTRAINT `cross_set_group_requests_from_program_set_id_foreign` FOREIGN KEY (`from_program_set_id`) REFERENCES `program_sets` (`id`) ON DELETE CASCADE,
  CONSTRAINT `cross_set_group_requests_group_id_foreign` FOREIGN KEY (`group_id`) REFERENCES `groups` (`id`) ON DELETE CASCADE,
  CONSTRAINT `cross_set_group_requests_requested_by_foreign` FOREIGN KEY (`requested_by`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `cross_set_group_requests_requested_to_foreign` FOREIGN KEY (`requested_to`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `cross_set_group_requests_student_id_foreign` FOREIGN KEY (`student_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `cross_set_group_requests_to_program_set_id_foreign` FOREIGN KEY (`to_program_set_id`) REFERENCES `program_sets` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cross_set_group_requests`
--

LOCK TABLES `cross_set_group_requests` WRITE;
/*!40000 ALTER TABLE `cross_set_group_requests` DISABLE KEYS */;
/*!40000 ALTER TABLE `cross_set_group_requests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `defense_rooms`
--

DROP TABLE IF EXISTS `defense_rooms`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `defense_rooms` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `capacity` smallint unsigned NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `defense_rooms_name_unique` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `defense_rooms`
--

LOCK TABLES `defense_rooms` WRITE;
/*!40000 ALTER TABLE `defense_rooms` DISABLE KEYS */;
/*!40000 ALTER TABLE `defense_rooms` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `defense_schedules`
--

DROP TABLE IF EXISTS `defense_schedules`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `defense_schedules` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `group_id` bigint unsigned NOT NULL,
  `room_id` bigint unsigned NOT NULL,
  `scheduled_date` date NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `stage` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Concept',
  `status` enum('Scheduled','Completed','Pending','Cancelled') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Scheduled',
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `scheduled_by` bigint unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `defense_schedules_group_id_stage_unique` (`group_id`,`stage`),
  KEY `defense_schedules_scheduled_by_foreign` (`scheduled_by`),
  KEY `defense_schedules_room_id_scheduled_date_index` (`room_id`,`scheduled_date`),
  KEY `defense_schedules_scheduled_date_start_time_end_time_index` (`scheduled_date`,`start_time`,`end_time`),
  CONSTRAINT `defense_schedules_group_id_foreign` FOREIGN KEY (`group_id`) REFERENCES `groups` (`id`) ON DELETE CASCADE,
  CONSTRAINT `defense_schedules_room_id_foreign` FOREIGN KEY (`room_id`) REFERENCES `defense_rooms` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `defense_schedules_scheduled_by_foreign` FOREIGN KEY (`scheduled_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `defense_schedules`
--

LOCK TABLES `defense_schedules` WRITE;
/*!40000 ALTER TABLE `defense_schedules` DISABLE KEYS */;
/*!40000 ALTER TABLE `defense_schedules` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `document_requirements`
--

DROP TABLE IF EXISTS `document_requirements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `document_requirements` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `requirement_type` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `due_date` date NOT NULL,
  `stage` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Concept',
  `is_mandatory` tinyint(1) NOT NULL DEFAULT '1',
  `academic_year_id` bigint unsigned NOT NULL,
  `created_by` bigint unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `doc_requirements_ay_stage_type_unique` (`academic_year_id`,`stage`,`requirement_type`),
  KEY `document_requirements_created_by_foreign` (`created_by`),
  KEY `document_requirements_academic_year_id_stage_index` (`academic_year_id`,`stage`),
  CONSTRAINT `document_requirements_academic_year_id_foreign` FOREIGN KEY (`academic_year_id`) REFERENCES `academic_years` (`id`) ON DELETE CASCADE,
  CONSTRAINT `document_requirements_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `document_requirements`
--

LOCK TABLES `document_requirements` WRITE;
/*!40000 ALTER TABLE `document_requirements` DISABLE KEYS */;
/*!40000 ALTER TABLE `document_requirements` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `document_submissions`
--

DROP TABLE IF EXISTS `document_submissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `document_submissions` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `group_id` bigint unsigned NOT NULL,
  `document_requirement_id` bigint unsigned NOT NULL,
  `title_category_id` bigint unsigned DEFAULT NULL,
  `file_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_path` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `mime_type` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `file_size` bigint unsigned DEFAULT NULL,
  `status` enum('Submitted','Approved','Revision Required') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Submitted',
  `adviser_status` enum('Submitted','Approved','Revision Required') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Submitted',
  `adviser_reviewed_by` bigint unsigned DEFAULT NULL,
  `adviser_reviewed_at` timestamp NULL DEFAULT NULL,
  `submitted_by` bigint unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `document_submissions_document_requirement_id_foreign` (`document_requirement_id`),
  KEY `document_submissions_submitted_by_foreign` (`submitted_by`),
  KEY `document_submissions_group_requirement_index` (`group_id`,`document_requirement_id`),
  KEY `document_submissions_title_category_id_foreign` (`title_category_id`),
  KEY `document_submissions_adviser_reviewed_by_foreign` (`adviser_reviewed_by`),
  CONSTRAINT `document_submissions_adviser_reviewed_by_foreign` FOREIGN KEY (`adviser_reviewed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `document_submissions_document_requirement_id_foreign` FOREIGN KEY (`document_requirement_id`) REFERENCES `document_requirements` (`id`) ON DELETE CASCADE,
  CONSTRAINT `document_submissions_group_id_foreign` FOREIGN KEY (`group_id`) REFERENCES `groups` (`id`) ON DELETE CASCADE,
  CONSTRAINT `document_submissions_submitted_by_foreign` FOREIGN KEY (`submitted_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `document_submissions_title_category_id_foreign` FOREIGN KEY (`title_category_id`) REFERENCES `title_categories` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `document_submissions`
--

LOCK TABLES `document_submissions` WRITE;
/*!40000 ALTER TABLE `document_submissions` DISABLE KEYS */;
/*!40000 ALTER TABLE `document_submissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `e_signatures`
--

DROP TABLE IF EXISTS `e_signatures`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `e_signatures` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `signature_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `mime_type` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'image/png',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `e_signatures_user_id_foreign` (`user_id`),
  CONSTRAINT `e_signatures_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `e_signatures`
--

LOCK TABLES `e_signatures` WRITE;
/*!40000 ALTER TABLE `e_signatures` DISABLE KEYS */;
/*!40000 ALTER TABLE `e_signatures` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `failed_jobs`
--

DROP TABLE IF EXISTS `failed_jobs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `failed_jobs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `uuid` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `connection` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `queue` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `payload` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `exception` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `failed_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `failed_jobs`
--

LOCK TABLES `failed_jobs` WRITE;
/*!40000 ALTER TABLE `failed_jobs` DISABLE KEYS */;
/*!40000 ALTER TABLE `failed_jobs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `group_adviser_requests`
--

DROP TABLE IF EXISTS `group_adviser_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `group_adviser_requests` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `group_id` bigint unsigned NOT NULL,
  `adviser_id` bigint unsigned NOT NULL,
  `requested_by` bigint unsigned DEFAULT NULL,
  `request_type` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Request',
  `status` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Pending',
  `responded_by` bigint unsigned DEFAULT NULL,
  `responded_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `group_adviser_requests_requested_by_foreign` (`requested_by`),
  KEY `group_adviser_requests_responded_by_foreign` (`responded_by`),
  KEY `group_adviser_requests_adviser_id_status_index` (`adviser_id`,`status`),
  KEY `group_adviser_requests_group_id_request_type_index` (`group_id`,`request_type`),
  CONSTRAINT `group_adviser_requests_adviser_id_foreign` FOREIGN KEY (`adviser_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `group_adviser_requests_group_id_foreign` FOREIGN KEY (`group_id`) REFERENCES `groups` (`id`) ON DELETE CASCADE,
  CONSTRAINT `group_adviser_requests_requested_by_foreign` FOREIGN KEY (`requested_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `group_adviser_requests_responded_by_foreign` FOREIGN KEY (`responded_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `group_adviser_requests`
--

LOCK TABLES `group_adviser_requests` WRITE;
/*!40000 ALTER TABLE `group_adviser_requests` DISABLE KEYS */;
/*!40000 ALTER TABLE `group_adviser_requests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `group_advisers`
--

DROP TABLE IF EXISTS `group_advisers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `group_advisers` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `group_id` bigint unsigned NOT NULL,
  `adviser_id` bigint unsigned NOT NULL,
  `assigned_by` bigint unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `group_advisers_group_id_unique` (`group_id`),
  KEY `group_advisers_assigned_by_foreign` (`assigned_by`),
  KEY `group_advisers_adviser_id_assigned_by_index` (`adviser_id`,`assigned_by`),
  CONSTRAINT `group_advisers_adviser_id_foreign` FOREIGN KEY (`adviser_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `group_advisers_assigned_by_foreign` FOREIGN KEY (`assigned_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `group_advisers_group_id_foreign` FOREIGN KEY (`group_id`) REFERENCES `groups` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `group_advisers`
--

LOCK TABLES `group_advisers` WRITE;
/*!40000 ALTER TABLE `group_advisers` DISABLE KEYS */;
/*!40000 ALTER TABLE `group_advisers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `group_members`
--

DROP TABLE IF EXISTS `group_members`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `group_members` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `group_id` bigint unsigned NOT NULL,
  `student_id` bigint unsigned NOT NULL,
  `role` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_cross_set` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `group_members_group_id_student_id_unique` (`group_id`,`student_id`),
  KEY `group_members_student_id_foreign` (`student_id`),
  CONSTRAINT `group_members_group_id_foreign` FOREIGN KEY (`group_id`) REFERENCES `groups` (`id`) ON DELETE CASCADE,
  CONSTRAINT `group_members_student_id_foreign` FOREIGN KEY (`student_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `group_members`
--

LOCK TABLES `group_members` WRITE;
/*!40000 ALTER TABLE `group_members` DISABLE KEYS */;
INSERT INTO `group_members` VALUES (1,1,8,'Project Manager',0,'2026-04-01 15:41:34','2026-04-01 15:41:34'),(2,1,9,'Documentarian',0,'2026-04-01 15:41:34','2026-04-01 15:41:34'),(3,1,10,'Programmer',0,'2026-04-01 15:41:34','2026-04-01 15:41:34'),(4,2,11,'Project Manager',0,'2026-04-01 15:41:52','2026-04-01 15:41:52'),(5,2,12,'Documentarian',0,'2026-04-01 15:41:52','2026-04-01 15:41:52'),(6,2,13,'Programmer',0,'2026-04-01 15:41:52','2026-04-01 15:41:52'),(7,3,14,'Project Manager',0,'2026-04-01 15:42:08','2026-04-01 15:42:08'),(8,3,15,'Documentarian',0,'2026-04-01 15:42:08','2026-04-01 15:42:08'),(9,3,16,'Programmer',0,'2026-04-01 15:42:08','2026-04-01 15:42:08'),(10,4,17,'Project Manager',0,'2026-04-01 15:42:24','2026-04-01 15:42:24'),(11,4,18,'Documentarian',0,'2026-04-01 15:42:24','2026-04-01 15:42:24'),(12,4,19,'Programmer',0,'2026-04-01 15:42:24','2026-04-01 15:42:24'),(13,5,20,'Project Manager',0,'2026-04-01 15:42:45','2026-04-01 15:42:45'),(14,5,21,'Documentarian',0,'2026-04-01 15:42:45','2026-04-01 15:42:45'),(15,5,22,'Programmer',0,'2026-04-01 15:42:45','2026-04-01 15:42:45'),(16,6,23,'Project Manager',0,'2026-04-01 15:43:05','2026-04-01 15:43:05'),(17,6,24,'Documentarian',0,'2026-04-01 15:43:05','2026-04-01 15:43:05'),(18,6,25,'Programmer',0,'2026-04-01 15:43:05','2026-04-01 15:43:05');
/*!40000 ALTER TABLE `group_members` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `group_panelists`
--

DROP TABLE IF EXISTS `group_panelists`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `group_panelists` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `group_id` bigint unsigned NOT NULL,
  `panelist_id` bigint unsigned NOT NULL,
  `panel_slot` tinyint unsigned NOT NULL,
  `role` enum('chairman','member') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'member',
  `assigned_by` bigint unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `group_panelists_group_id_panel_slot_unique` (`group_id`,`panel_slot`),
  UNIQUE KEY `group_panelists_group_id_panelist_id_unique` (`group_id`,`panelist_id`),
  KEY `group_panelists_assigned_by_foreign` (`assigned_by`),
  KEY `group_panelists_panelist_id_assigned_by_index` (`panelist_id`,`assigned_by`),
  CONSTRAINT `group_panelists_assigned_by_foreign` FOREIGN KEY (`assigned_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `group_panelists_group_id_foreign` FOREIGN KEY (`group_id`) REFERENCES `groups` (`id`) ON DELETE CASCADE,
  CONSTRAINT `group_panelists_panelist_id_foreign` FOREIGN KEY (`panelist_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `group_panelists`
--

LOCK TABLES `group_panelists` WRITE;
/*!40000 ALTER TABLE `group_panelists` DISABLE KEYS */;
/*!40000 ALTER TABLE `group_panelists` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `groups`
--

DROP TABLE IF EXISTS `groups`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `groups` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `program_set_id` bigint unsigned NOT NULL,
  `leader_id` bigint unsigned NOT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_cross_set` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `groups_leader_id_foreign` (`leader_id`),
  KEY `groups_program_set_id_leader_id_index` (`program_set_id`,`leader_id`),
  CONSTRAINT `groups_leader_id_foreign` FOREIGN KEY (`leader_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `groups_program_set_id_foreign` FOREIGN KEY (`program_set_id`) REFERENCES `program_sets` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `groups`
--

LOCK TABLES `groups` WRITE;
/*!40000 ALTER TABLE `groups` DISABLE KEYS */;
INSERT INTO `groups` VALUES (1,1,8,'Dela Cruz',0,'2026-04-01 15:41:34','2026-04-01 15:41:34'),(2,1,11,'Cruz',0,'2026-04-01 15:41:52','2026-04-01 15:41:52'),(3,1,14,'Bautista',0,'2026-04-01 15:42:08','2026-04-01 15:42:08'),(4,1,17,'Flores',0,'2026-04-01 15:42:24','2026-04-01 15:42:24'),(5,1,20,'Navarro',0,'2026-04-01 15:42:45','2026-04-01 15:42:45'),(6,1,23,'Medina',0,'2026-04-01 15:43:05','2026-04-01 15:43:05');
/*!40000 ALTER TABLE `groups` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `job_batches`
--

DROP TABLE IF EXISTS `job_batches`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `job_batches` (
  `id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `total_jobs` int NOT NULL,
  `pending_jobs` int NOT NULL,
  `failed_jobs` int NOT NULL,
  `failed_job_ids` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `options` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `cancelled_at` int DEFAULT NULL,
  `created_at` int NOT NULL,
  `finished_at` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `job_batches`
--

LOCK TABLES `job_batches` WRITE;
/*!40000 ALTER TABLE `job_batches` DISABLE KEYS */;
/*!40000 ALTER TABLE `job_batches` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `jobs`
--

DROP TABLE IF EXISTS `jobs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `jobs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `queue` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `payload` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `attempts` tinyint unsigned NOT NULL,
  `reserved_at` int unsigned DEFAULT NULL,
  `available_at` int unsigned NOT NULL,
  `created_at` int unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `jobs_queue_index` (`queue`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `jobs`
--

LOCK TABLES `jobs` WRITE;
/*!40000 ALTER TABLE `jobs` DISABLE KEYS */;
/*!40000 ALTER TABLE `jobs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `migrations`
--

DROP TABLE IF EXISTS `migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `migrations` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `migration` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `batch` int NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=56 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `migrations`
--

LOCK TABLES `migrations` WRITE;
/*!40000 ALTER TABLE `migrations` DISABLE KEYS */;
INSERT INTO `migrations` VALUES (1,'0001_01_01_000000_create_users_table',1),(2,'0001_01_01_000001_create_cache_table',1),(3,'0001_01_01_000002_create_jobs_table',1),(4,'2026_02_13_024543_add_role_to_users_table',1),(5,'2026_02_28_120233_create_system_settings_table',1),(6,'2026_03_01_071417_add_status_to_users_table',1),(7,'2026_03_03_015529_add_first_name_and_last_name_to_users_table',1),(8,'2026_03_03_085636_create_roles_table',1),(9,'2026_03_03_085646_create_role_user_table',1),(10,'2026_03_04_064803_create_e_signatures_table',1),(11,'2026_03_06_060532_create_faculties_table',1),(12,'2026_03_06_060532_create_students_table',1),(13,'2026_03_06_063303_add_password_to_students_table',1),(14,'2026_03_06_064817_add_email_and_status_to_students_table',1),(15,'2026_03_06_071205_update_faculty_roles_enum',1),(16,'2026_03_06_074857_create_programs_table',1),(17,'2026_03_06_074858_add_program_id_to_users_table',1),(18,'2026_03_06_075500_merge_students_and_faculties_into_users',1),(19,'2026_03_06_080000_drop_faculties_and_students_tables',1),(20,'2026_03_06_083622_assign_default_program_to_existing_students',1),(21,'2026_03_06_092752_create_student_program_table',1),(22,'2026_03_06_092752_drop_program_id_and_programs_table',1),(23,'2026_03_11_075738_create_academic_years_table',1),(24,'2026_03_11_090233_create_site_wide_notifications_table',1),(25,'2026_03_11_090234_rename_site_wide_notifications_table_to_site_wide_notification',1),(26,'2026_03_12_080205_create_program_sets_table',1),(27,'2026_03_12_141448_recreate_program_sets_table',1),(28,'2026_03_14_062453_create_program_set_student_table',1),(29,'2026_03_14_083003_create_groups_table',1),(30,'2026_03_14_083005_create_group_members_table',1),(31,'2026_03_14_103341_create_group_advisers_table',1),(32,'2026_03_15_060000_create_group_panelists_table',1),(33,'2026_03_15_065121_create_defense_rooms_table',1),(34,'2026_03_15_065124_create_defense_schedules_table',1),(35,'2026_03_15_103100_add_role_to_group_panelists_table',1),(36,'2026_03_18_132322_create_document_requirements_table',1),(37,'2026_03_19_071005_create_document_submissions_table',1),(38,'2026_03_20_043559_create_group_adviser_requests_table',1),(39,'2026_03_22_152904_create_audit_logs_table',1),(40,'2026_03_23_050503_create_title_categories_table',1),(41,'2026_03_23_050503_create_title_repositories_table',1),(42,'2026_03_23_052617_alter_title_repositories_add_adviser_relation',1),(43,'2026_03_24_023828_add_title_category_id_to_document_submissions_table',1),(44,'2026_03_25_201252_add_program_to_users_table',1),(45,'2026_03_27_163644_create_adviser_availabilities_table',1),(46,'2026_03_27_163647_create_adviser_program_utilities_table',1),(47,'2026_03_28_144859_add_active_session_columns_to_users_table',1),(48,'2026_03_28_225038_create_cross_set_group_requests_table',1),(49,'2026_03_28_225041_add_is_cross_set_to_groups_table',1),(50,'2026_03_28_225044_add_is_cross_set_to_group_members_table',1),(51,'2026_03_29_084008_alter_adviser_availabilities_default_closed',1),(52,'2026_03_29_105119_create_panelist_availabilities_table',1),(53,'2026_03_29_105120_create_panelist_program_utilities_table',1),(54,'2026_03_29_164052_add_adviser_review_fields_to_document_submissions_table',1),(55,'2026_03_29_182900_create_adviser_recommendation_documents_table',1);
/*!40000 ALTER TABLE `migrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `panelist_availabilities`
--

DROP TABLE IF EXISTS `panelist_availabilities`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `panelist_availabilities` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `panelist_id` bigint unsigned NOT NULL,
  `is_available` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `panelist_availabilities_panelist_id_unique` (`panelist_id`),
  CONSTRAINT `panelist_availabilities_panelist_id_foreign` FOREIGN KEY (`panelist_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `panelist_availabilities`
--

LOCK TABLES `panelist_availabilities` WRITE;
/*!40000 ALTER TABLE `panelist_availabilities` DISABLE KEYS */;
/*!40000 ALTER TABLE `panelist_availabilities` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `panelist_program_utilities`
--

DROP TABLE IF EXISTS `panelist_program_utilities`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `panelist_program_utilities` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `panelist_id` bigint unsigned NOT NULL,
  `program` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `max_groups` smallint unsigned NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `panelist_program_utilities_panelist_id_program_unique` (`panelist_id`,`program`),
  KEY `panelist_program_utilities_panelist_id_index` (`panelist_id`),
  CONSTRAINT `panelist_program_utilities_panelist_id_foreign` FOREIGN KEY (`panelist_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `panelist_program_utilities`
--

LOCK TABLES `panelist_program_utilities` WRITE;
/*!40000 ALTER TABLE `panelist_program_utilities` DISABLE KEYS */;
/*!40000 ALTER TABLE `panelist_program_utilities` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `password_reset_tokens`
--

DROP TABLE IF EXISTS `password_reset_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `password_reset_tokens` (
  `email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `password_reset_tokens`
--

LOCK TABLES `password_reset_tokens` WRITE;
/*!40000 ALTER TABLE `password_reset_tokens` DISABLE KEYS */;
/*!40000 ALTER TABLE `password_reset_tokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `program_set_student`
--

DROP TABLE IF EXISTS `program_set_student`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `program_set_student` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `program_set_id` bigint unsigned NOT NULL,
  `student_id` bigint unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `program_set_student_program_set_id_student_id_unique` (`program_set_id`,`student_id`),
  KEY `program_set_student_student_id_foreign` (`student_id`),
  CONSTRAINT `program_set_student_program_set_id_foreign` FOREIGN KEY (`program_set_id`) REFERENCES `program_sets` (`id`) ON DELETE CASCADE,
  CONSTRAINT `program_set_student_student_id_foreign` FOREIGN KEY (`student_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=61 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `program_set_student`
--

LOCK TABLES `program_set_student` WRITE;
/*!40000 ALTER TABLE `program_set_student` DISABLE KEYS */;
INSERT INTO `program_set_student` VALUES (1,1,8,'2026-04-01 15:39:35','2026-04-01 15:39:35'),(2,1,9,'2026-04-01 15:39:35','2026-04-01 15:39:35'),(3,1,10,'2026-04-01 15:39:35','2026-04-01 15:39:35'),(4,1,11,'2026-04-01 15:39:35','2026-04-01 15:39:35'),(5,1,12,'2026-04-01 15:39:35','2026-04-01 15:39:35'),(6,1,13,'2026-04-01 15:39:35','2026-04-01 15:39:35'),(7,1,14,'2026-04-01 15:39:35','2026-04-01 15:39:35'),(8,1,15,'2026-04-01 15:39:35','2026-04-01 15:39:35'),(9,1,16,'2026-04-01 15:39:35','2026-04-01 15:39:35'),(10,1,17,'2026-04-01 15:39:35','2026-04-01 15:39:35'),(11,1,18,'2026-04-01 15:39:35','2026-04-01 15:39:35'),(12,1,19,'2026-04-01 15:39:35','2026-04-01 15:39:35'),(13,1,20,'2026-04-01 15:39:35','2026-04-01 15:39:35'),(14,1,21,'2026-04-01 15:39:35','2026-04-01 15:39:35'),(15,1,22,'2026-04-01 15:39:35','2026-04-01 15:39:35'),(16,1,23,'2026-04-01 15:39:35','2026-04-01 15:39:35'),(17,1,24,'2026-04-01 15:39:35','2026-04-01 15:39:35'),(18,1,25,'2026-04-01 15:39:35','2026-04-01 15:39:35'),(19,1,26,'2026-04-01 15:39:35','2026-04-01 15:39:35'),(20,1,27,'2026-04-01 15:39:35','2026-04-01 15:39:35'),(21,2,28,'2026-04-01 15:40:49','2026-04-01 15:40:49'),(22,2,29,'2026-04-01 15:40:49','2026-04-01 15:40:49'),(23,2,30,'2026-04-01 15:40:49','2026-04-01 15:40:49'),(24,2,31,'2026-04-01 15:40:49','2026-04-01 15:40:49'),(25,2,32,'2026-04-01 15:40:49','2026-04-01 15:40:49'),(26,2,33,'2026-04-01 15:40:49','2026-04-01 15:40:49'),(27,2,34,'2026-04-01 15:40:49','2026-04-01 15:40:49'),(28,2,35,'2026-04-01 15:40:49','2026-04-01 15:40:49'),(29,2,36,'2026-04-01 15:40:49','2026-04-01 15:40:49'),(30,2,37,'2026-04-01 15:40:49','2026-04-01 15:40:49'),(31,2,38,'2026-04-01 15:40:49','2026-04-01 15:40:49'),(32,2,39,'2026-04-01 15:40:49','2026-04-01 15:40:49'),(33,2,40,'2026-04-01 15:40:49','2026-04-01 15:40:49'),(34,2,41,'2026-04-01 15:40:49','2026-04-01 15:40:49'),(35,2,42,'2026-04-01 15:40:49','2026-04-01 15:40:49'),(36,2,43,'2026-04-01 15:40:49','2026-04-01 15:40:49'),(37,2,44,'2026-04-01 15:40:49','2026-04-01 15:40:49'),(38,2,45,'2026-04-01 15:40:49','2026-04-01 15:40:49'),(39,2,46,'2026-04-01 15:40:49','2026-04-01 15:40:49'),(40,2,47,'2026-04-01 15:40:49','2026-04-01 15:40:49'),(41,3,48,'2026-04-01 16:33:20','2026-04-01 16:33:20'),(42,3,49,'2026-04-01 16:33:20','2026-04-01 16:33:20'),(43,3,50,'2026-04-01 16:33:20','2026-04-01 16:33:20'),(44,3,51,'2026-04-01 16:33:20','2026-04-01 16:33:20'),(45,3,52,'2026-04-01 16:33:20','2026-04-01 16:33:20'),(46,3,53,'2026-04-01 16:33:21','2026-04-01 16:33:21'),(47,3,54,'2026-04-01 16:33:21','2026-04-01 16:33:21'),(48,3,55,'2026-04-01 16:33:21','2026-04-01 16:33:21'),(49,3,56,'2026-04-01 16:33:21','2026-04-01 16:33:21'),(50,3,57,'2026-04-01 16:33:21','2026-04-01 16:33:21'),(51,3,58,'2026-04-01 16:33:21','2026-04-01 16:33:21'),(52,3,59,'2026-04-01 16:33:21','2026-04-01 16:33:21'),(53,3,60,'2026-04-01 16:33:21','2026-04-01 16:33:21'),(54,3,61,'2026-04-01 16:33:21','2026-04-01 16:33:21'),(55,3,62,'2026-04-01 16:33:21','2026-04-01 16:33:21'),(56,3,63,'2026-04-01 16:33:21','2026-04-01 16:33:21'),(57,3,64,'2026-04-01 16:33:21','2026-04-01 16:33:21'),(58,3,65,'2026-04-01 16:33:21','2026-04-01 16:33:21'),(59,3,66,'2026-04-01 16:33:21','2026-04-01 16:33:21'),(60,3,67,'2026-04-01 16:33:21','2026-04-01 16:33:21');
/*!40000 ALTER TABLE `program_set_student` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `program_sets`
--

DROP TABLE IF EXISTS `program_sets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `program_sets` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `program` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `academic_year_id` bigint unsigned NOT NULL,
  `instructor_id` bigint unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `program_sets_academic_year_id_foreign` (`academic_year_id`),
  KEY `program_sets_instructor_id_foreign` (`instructor_id`),
  CONSTRAINT `program_sets_academic_year_id_foreign` FOREIGN KEY (`academic_year_id`) REFERENCES `academic_years` (`id`) ON DELETE CASCADE,
  CONSTRAINT `program_sets_instructor_id_foreign` FOREIGN KEY (`instructor_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `program_sets`
--

LOCK TABLES `program_sets` WRITE;
/*!40000 ALTER TABLE `program_sets` DISABLE KEYS */;
INSERT INTO `program_sets` VALUES (1,'BSIT-A-2025-2026','BSIT',1,325,'2026-04-01 15:35:26','2026-04-01 15:35:26'),(2,'BSIT-B-2025-2026','BSIT',1,325,'2026-04-01 15:40:09','2026-04-01 15:40:09'),(3,'BSIT-C-2025-2026','BSIT',1,330,'2026-04-01 16:33:12','2026-04-01 16:33:12');
/*!40000 ALTER TABLE `program_sets` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `role_user`
--

DROP TABLE IF EXISTS `role_user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `role_user` (
  `role_id` bigint unsigned NOT NULL,
  `user_id` bigint unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  UNIQUE KEY `role_user_role_id_user_id_unique` (`role_id`,`user_id`),
  KEY `role_user_user_id_foreign` (`user_id`),
  CONSTRAINT `role_user_role_id_foreign` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `role_user_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `role_user`
--

LOCK TABLES `role_user` WRITE;
/*!40000 ALTER TABLE `role_user` DISABLE KEYS */;
INSERT INTO `role_user` VALUES (1,1,NULL,NULL),(1,325,NULL,NULL),(2,2,NULL,NULL),(2,8,NULL,NULL),(2,9,NULL,NULL),(2,10,NULL,NULL),(2,11,NULL,NULL),(2,12,NULL,NULL),(2,13,NULL,NULL),(2,14,NULL,NULL),(2,15,NULL,NULL),(2,16,NULL,NULL),(2,17,NULL,NULL),(2,18,NULL,NULL),(2,19,NULL,NULL),(2,20,NULL,NULL),(2,21,NULL,NULL),(2,22,NULL,NULL),(2,23,NULL,NULL),(2,24,NULL,NULL),(2,25,NULL,NULL),(2,26,NULL,NULL),(2,27,NULL,NULL),(2,28,NULL,NULL),(2,29,NULL,NULL),(2,30,NULL,NULL),(2,31,NULL,NULL),(2,32,NULL,NULL),(2,33,NULL,NULL),(2,34,NULL,NULL),(2,35,NULL,NULL),(2,36,NULL,NULL),(2,37,NULL,NULL),(2,38,NULL,NULL),(2,39,NULL,NULL),(2,40,NULL,NULL),(2,41,NULL,NULL),(2,42,NULL,NULL),(2,43,NULL,NULL),(2,44,NULL,NULL),(2,45,NULL,NULL),(2,46,NULL,NULL),(2,47,NULL,NULL),(2,48,NULL,NULL),(2,49,NULL,NULL),(2,50,NULL,NULL),(2,51,NULL,NULL),(2,52,NULL,NULL),(2,53,NULL,NULL),(2,54,NULL,NULL),(2,55,NULL,NULL),(2,56,NULL,NULL),(2,57,NULL,NULL),(2,58,NULL,NULL),(2,59,NULL,NULL),(2,60,NULL,NULL),(2,61,NULL,NULL),(2,62,NULL,NULL),(2,63,NULL,NULL),(2,64,NULL,NULL),(2,65,NULL,NULL),(2,66,NULL,NULL),(2,67,NULL,NULL),(2,68,NULL,NULL),(2,69,NULL,NULL),(2,70,NULL,NULL),(2,71,NULL,NULL),(2,72,NULL,NULL),(2,73,NULL,NULL),(2,74,NULL,NULL),(2,75,NULL,NULL),(2,76,NULL,NULL),(2,77,NULL,NULL),(2,78,NULL,NULL),(2,79,NULL,NULL),(2,80,NULL,NULL),(2,81,NULL,NULL),(2,82,NULL,NULL),(2,83,NULL,NULL),(2,84,NULL,NULL),(2,85,NULL,NULL),(2,86,NULL,NULL),(2,87,NULL,NULL),(2,88,NULL,NULL),(2,89,NULL,NULL),(2,90,NULL,NULL),(2,91,NULL,NULL),(2,92,NULL,NULL),(2,93,NULL,NULL),(2,94,NULL,NULL),(2,95,NULL,NULL),(2,96,NULL,NULL),(2,97,NULL,NULL),(2,98,NULL,NULL),(2,99,NULL,NULL),(2,100,NULL,NULL),(2,101,NULL,NULL),(2,102,NULL,NULL),(2,103,NULL,NULL),(2,104,NULL,NULL),(2,105,NULL,NULL),(2,106,NULL,NULL),(2,107,NULL,NULL),(2,108,NULL,NULL),(2,109,NULL,NULL),(2,110,NULL,NULL),(2,111,NULL,NULL),(2,112,NULL,NULL),(2,113,NULL,NULL),(2,114,NULL,NULL),(2,115,NULL,NULL),(2,116,NULL,NULL),(2,117,NULL,NULL),(2,118,NULL,NULL),(2,119,NULL,NULL),(2,120,NULL,NULL),(2,121,NULL,NULL),(2,122,NULL,NULL),(2,123,NULL,NULL),(2,124,NULL,NULL),(2,125,NULL,NULL),(2,126,NULL,NULL),(2,127,NULL,NULL),(2,128,NULL,NULL),(2,129,NULL,NULL),(2,130,NULL,NULL),(2,131,NULL,NULL),(2,132,NULL,NULL),(2,133,NULL,NULL),(2,134,NULL,NULL),(2,135,NULL,NULL),(2,136,NULL,NULL),(2,137,NULL,NULL),(2,138,NULL,NULL),(2,139,NULL,NULL),(2,140,NULL,NULL),(2,141,NULL,NULL),(2,142,NULL,NULL),(2,143,NULL,NULL),(2,144,NULL,NULL),(2,145,NULL,NULL),(2,146,NULL,NULL),(2,147,NULL,NULL),(2,148,NULL,NULL),(2,149,NULL,NULL),(2,150,NULL,NULL),(2,151,NULL,NULL),(2,152,NULL,NULL),(2,153,NULL,NULL),(2,154,NULL,NULL),(2,155,NULL,NULL),(2,156,NULL,NULL),(2,157,NULL,NULL),(2,158,NULL,NULL),(2,159,NULL,NULL),(2,160,NULL,NULL),(2,161,NULL,NULL),(2,162,NULL,NULL),(2,163,NULL,NULL),(2,164,NULL,NULL),(2,165,NULL,NULL),(2,166,NULL,NULL),(2,167,NULL,NULL),(2,168,NULL,NULL),(2,169,NULL,NULL),(2,170,NULL,NULL),(2,171,NULL,NULL),(2,172,NULL,NULL),(2,173,NULL,NULL),(2,174,NULL,NULL),(2,175,NULL,NULL),(2,176,NULL,NULL),(2,177,NULL,NULL),(2,178,NULL,NULL),(2,179,NULL,NULL),(2,180,NULL,NULL),(2,181,NULL,NULL),(2,182,NULL,NULL),(2,183,NULL,NULL),(2,184,NULL,NULL),(2,185,NULL,NULL),(2,186,NULL,NULL),(2,187,NULL,NULL),(2,188,NULL,NULL),(2,189,NULL,NULL),(2,190,NULL,NULL),(2,191,NULL,NULL),(2,192,NULL,NULL),(2,193,NULL,NULL),(2,194,NULL,NULL),(2,195,NULL,NULL),(2,196,NULL,NULL),(2,197,NULL,NULL),(2,198,NULL,NULL),(2,199,NULL,NULL),(2,200,NULL,NULL),(2,201,NULL,NULL),(2,202,NULL,NULL),(2,203,NULL,NULL),(2,204,NULL,NULL),(2,205,NULL,NULL),(2,206,NULL,NULL),(2,207,NULL,NULL),(2,208,NULL,NULL),(2,209,NULL,NULL),(2,210,NULL,NULL),(2,211,NULL,NULL),(2,212,NULL,NULL),(2,213,NULL,NULL),(2,214,NULL,NULL),(2,215,NULL,NULL),(2,216,NULL,NULL),(2,217,NULL,NULL),(2,218,NULL,NULL),(2,219,NULL,NULL),(2,220,NULL,NULL),(2,221,NULL,NULL),(2,222,NULL,NULL),(2,223,NULL,NULL),(2,224,NULL,NULL),(2,225,NULL,NULL),(2,226,NULL,NULL),(2,227,NULL,NULL),(2,228,NULL,NULL),(2,229,NULL,NULL),(2,230,NULL,NULL),(2,231,NULL,NULL),(2,232,NULL,NULL),(2,233,NULL,NULL),(2,234,NULL,NULL),(2,235,NULL,NULL),(2,236,NULL,NULL),(2,237,NULL,NULL),(2,238,NULL,NULL),(2,239,NULL,NULL),(2,240,NULL,NULL),(2,241,NULL,NULL),(2,242,NULL,NULL),(2,243,NULL,NULL),(2,244,NULL,NULL),(2,245,NULL,NULL),(2,246,NULL,NULL),(2,247,NULL,NULL),(2,248,NULL,NULL),(2,249,NULL,NULL),(2,250,NULL,NULL),(2,251,NULL,NULL),(2,252,NULL,NULL),(2,253,NULL,NULL),(2,254,NULL,NULL),(2,255,NULL,NULL),(2,256,NULL,NULL),(2,257,NULL,NULL),(2,258,NULL,NULL),(2,259,NULL,NULL),(2,260,NULL,NULL),(2,261,NULL,NULL),(2,262,NULL,NULL),(2,263,NULL,NULL),(2,264,NULL,NULL),(2,265,NULL,NULL),(2,266,NULL,NULL),(2,267,NULL,NULL),(2,268,NULL,NULL),(2,269,NULL,NULL),(2,270,NULL,NULL),(2,271,NULL,NULL),(2,272,NULL,NULL),(2,273,NULL,NULL),(2,274,NULL,NULL),(2,275,NULL,NULL),(2,276,NULL,NULL),(2,277,NULL,NULL),(2,278,NULL,NULL),(2,279,NULL,NULL),(2,280,NULL,NULL),(2,281,NULL,NULL),(2,282,NULL,NULL),(2,283,NULL,NULL),(2,284,NULL,NULL),(2,285,NULL,NULL),(2,286,NULL,NULL),(2,287,NULL,NULL),(2,288,NULL,NULL),(2,289,NULL,NULL),(2,290,NULL,NULL),(2,291,NULL,NULL),(2,292,NULL,NULL),(2,293,NULL,NULL),(2,294,NULL,NULL),(2,295,NULL,NULL),(2,296,NULL,NULL),(2,297,NULL,NULL),(2,298,NULL,NULL),(2,299,NULL,NULL),(2,300,NULL,NULL),(2,301,NULL,NULL),(2,302,NULL,NULL),(2,303,NULL,NULL),(2,304,NULL,NULL),(2,305,NULL,NULL),(2,306,NULL,NULL),(2,307,NULL,NULL),(2,308,NULL,NULL),(2,309,NULL,NULL),(2,310,NULL,NULL),(2,311,NULL,NULL),(2,312,NULL,NULL),(2,313,NULL,NULL),(2,314,NULL,NULL),(2,315,NULL,NULL),(2,316,NULL,NULL),(2,317,NULL,NULL),(2,318,NULL,NULL),(2,319,NULL,NULL),(2,320,NULL,NULL),(2,321,NULL,NULL),(2,322,NULL,NULL),(3,3,NULL,NULL),(3,324,NULL,NULL),(3,325,NULL,NULL),(3,326,NULL,NULL),(3,330,NULL,NULL),(3,331,NULL,NULL),(3,336,NULL,NULL),(3,338,NULL,NULL),(3,339,NULL,NULL),(3,343,NULL,NULL),(3,344,NULL,NULL),(3,350,NULL,NULL),(3,351,NULL,NULL),(3,355,NULL,NULL),(4,5,NULL,NULL),(4,325,NULL,NULL),(4,330,NULL,NULL),(4,331,NULL,NULL),(4,336,NULL,NULL),(4,343,NULL,NULL),(5,4,NULL,NULL),(5,323,NULL,NULL),(5,324,NULL,NULL),(5,325,NULL,NULL),(5,326,NULL,NULL),(5,327,NULL,NULL),(5,328,NULL,NULL),(5,329,NULL,NULL),(5,332,NULL,NULL),(5,333,NULL,NULL),(5,334,NULL,NULL),(5,335,NULL,NULL),(5,337,NULL,NULL),(5,338,NULL,NULL),(5,339,NULL,NULL),(5,340,NULL,NULL),(5,341,NULL,NULL),(5,342,NULL,NULL),(5,344,NULL,NULL),(5,345,NULL,NULL),(5,346,NULL,NULL),(5,347,NULL,NULL),(5,348,NULL,NULL),(5,349,NULL,NULL),(5,350,NULL,NULL),(5,351,NULL,NULL),(5,352,NULL,NULL),(5,353,NULL,NULL),(5,354,NULL,NULL),(5,355,NULL,NULL),(6,6,NULL,NULL),(6,355,NULL,NULL),(7,7,NULL,NULL),(7,339,NULL,NULL),(7,350,NULL,NULL);
/*!40000 ALTER TABLE `role_user` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `roles`
--

DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `roles` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `roles_slug_unique` (`slug`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `roles`
--

LOCK TABLES `roles` WRITE;
/*!40000 ALTER TABLE `roles` DISABLE KEYS */;
INSERT INTO `roles` VALUES (1,'Admin','admin','2026-04-01 15:14:41','2026-04-01 15:14:41'),(2,'Student','student','2026-04-01 15:14:41','2026-04-01 15:14:41'),(3,'Adviser','adviser','2026-04-01 15:14:41','2026-04-01 15:14:41'),(4,'Instructor','instructor','2026-04-01 15:14:41','2026-04-01 15:14:41'),(5,'Panelist','panelist','2026-04-01 15:14:41','2026-04-01 15:14:41'),(6,'Dean','dean','2026-04-01 15:14:41','2026-04-01 15:14:41'),(7,'Program Chairperson','program_chairperson','2026-04-01 15:14:41','2026-04-01 15:14:41');
/*!40000 ALTER TABLE `roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sessions`
--

DROP TABLE IF EXISTS `sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sessions` (
  `id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` bigint unsigned DEFAULT NULL,
  `ip_address` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `payload` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_activity` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `sessions_user_id_index` (`user_id`),
  KEY `sessions_last_activity_index` (`last_activity`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sessions`
--

LOCK TABLES `sessions` WRITE;
/*!40000 ALTER TABLE `sessions` DISABLE KEYS */;
/*!40000 ALTER TABLE `sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `site_wide_notification`
--

DROP TABLE IF EXISTS `site_wide_notification`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `site_wide_notification` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `message` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `site_wide_notification`
--

LOCK TABLES `site_wide_notification` WRITE;
/*!40000 ALTER TABLE `site_wide_notification` DISABLE KEYS */;
/*!40000 ALTER TABLE `site_wide_notification` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `student_program`
--

DROP TABLE IF EXISTS `student_program`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `student_program` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `student_id` bigint unsigned NOT NULL,
  `program` enum('BSIT','BSIS') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'BSIT',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `student_program_student_id_unique` (`student_id`),
  CONSTRAINT `student_program_student_id_foreign` FOREIGN KEY (`student_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=317 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `student_program`
--

LOCK TABLES `student_program` WRITE;
/*!40000 ALTER TABLE `student_program` DISABLE KEYS */;
INSERT INTO `student_program` VALUES (1,2,'BSIT','2026-04-01 15:15:34','2026-04-01 15:15:34'),(2,8,'BSIT','2026-04-01 15:28:48','2026-04-01 15:28:48'),(3,9,'BSIT','2026-04-01 15:28:48','2026-04-01 15:28:48'),(4,10,'BSIT','2026-04-01 15:28:49','2026-04-01 15:28:49'),(5,11,'BSIT','2026-04-01 15:28:49','2026-04-01 15:28:49'),(6,12,'BSIT','2026-04-01 15:28:50','2026-04-01 15:28:50'),(7,13,'BSIT','2026-04-01 15:28:50','2026-04-01 15:28:50'),(8,14,'BSIT','2026-04-01 15:28:50','2026-04-01 15:28:50'),(9,15,'BSIT','2026-04-01 15:28:51','2026-04-01 15:28:51'),(10,16,'BSIT','2026-04-01 15:28:51','2026-04-01 15:28:51'),(11,17,'BSIT','2026-04-01 15:28:51','2026-04-01 15:28:51'),(12,18,'BSIT','2026-04-01 15:28:52','2026-04-01 15:28:52'),(13,19,'BSIT','2026-04-01 15:28:52','2026-04-01 15:28:52'),(14,20,'BSIT','2026-04-01 15:28:52','2026-04-01 15:28:52'),(15,21,'BSIT','2026-04-01 15:28:53','2026-04-01 15:28:53'),(16,22,'BSIT','2026-04-01 15:28:53','2026-04-01 15:28:53'),(17,23,'BSIT','2026-04-01 15:28:54','2026-04-01 15:28:54'),(18,24,'BSIT','2026-04-01 15:28:54','2026-04-01 15:28:54'),(19,25,'BSIT','2026-04-01 15:28:55','2026-04-01 15:28:55'),(20,26,'BSIT','2026-04-01 15:28:55','2026-04-01 15:28:55'),(21,27,'BSIT','2026-04-01 15:28:55','2026-04-01 15:28:55'),(22,28,'BSIT','2026-04-01 15:28:56','2026-04-01 15:28:56'),(23,29,'BSIT','2026-04-01 15:28:56','2026-04-01 15:28:56'),(24,30,'BSIT','2026-04-01 15:28:56','2026-04-01 15:28:56'),(25,31,'BSIT','2026-04-01 15:28:57','2026-04-01 15:28:57'),(26,32,'BSIT','2026-04-01 15:28:57','2026-04-01 15:28:57'),(27,33,'BSIT','2026-04-01 15:28:58','2026-04-01 15:28:58'),(28,34,'BSIT','2026-04-01 15:28:58','2026-04-01 15:28:58'),(29,35,'BSIT','2026-04-01 15:28:59','2026-04-01 15:28:59'),(30,36,'BSIT','2026-04-01 15:28:59','2026-04-01 15:28:59'),(31,37,'BSIT','2026-04-01 15:28:59','2026-04-01 15:28:59'),(32,38,'BSIT','2026-04-01 15:29:00','2026-04-01 15:29:00'),(33,39,'BSIT','2026-04-01 15:29:00','2026-04-01 15:29:00'),(34,40,'BSIT','2026-04-01 15:29:01','2026-04-01 15:29:01'),(35,41,'BSIT','2026-04-01 15:29:01','2026-04-01 15:29:01'),(36,42,'BSIT','2026-04-01 15:29:02','2026-04-01 15:29:02'),(37,43,'BSIT','2026-04-01 15:29:02','2026-04-01 15:29:02'),(38,44,'BSIT','2026-04-01 15:29:03','2026-04-01 15:29:03'),(39,45,'BSIT','2026-04-01 15:29:03','2026-04-01 15:29:03'),(40,46,'BSIT','2026-04-01 15:29:03','2026-04-01 15:29:03'),(41,47,'BSIT','2026-04-01 15:29:04','2026-04-01 15:29:04'),(42,48,'BSIT','2026-04-01 15:29:05','2026-04-01 15:29:05'),(43,49,'BSIT','2026-04-01 15:29:05','2026-04-01 15:29:05'),(44,50,'BSIT','2026-04-01 15:29:06','2026-04-01 15:29:06'),(45,51,'BSIT','2026-04-01 15:29:07','2026-04-01 15:29:07'),(46,52,'BSIT','2026-04-01 15:29:07','2026-04-01 15:29:07'),(47,53,'BSIT','2026-04-01 15:29:08','2026-04-01 15:29:08'),(48,54,'BSIT','2026-04-01 15:29:08','2026-04-01 15:29:08'),(49,55,'BSIT','2026-04-01 15:29:09','2026-04-01 15:29:09'),(50,56,'BSIT','2026-04-01 15:29:09','2026-04-01 15:29:09'),(51,57,'BSIT','2026-04-01 15:29:10','2026-04-01 15:29:10'),(52,58,'BSIT','2026-04-01 15:29:11','2026-04-01 15:29:11'),(53,59,'BSIT','2026-04-01 15:29:11','2026-04-01 15:29:11'),(54,60,'BSIT','2026-04-01 15:29:12','2026-04-01 15:29:12'),(55,61,'BSIT','2026-04-01 15:29:13','2026-04-01 15:29:13'),(56,62,'BSIT','2026-04-01 15:29:13','2026-04-01 15:29:13'),(57,63,'BSIT','2026-04-01 15:29:14','2026-04-01 15:29:14'),(58,64,'BSIT','2026-04-01 15:29:15','2026-04-01 15:29:15'),(59,65,'BSIT','2026-04-01 15:29:16','2026-04-01 15:29:16'),(60,66,'BSIT','2026-04-01 15:29:16','2026-04-01 15:29:16'),(61,67,'BSIT','2026-04-01 15:29:17','2026-04-01 15:29:17'),(62,68,'BSIT','2026-04-01 15:29:18','2026-04-01 15:29:18'),(63,69,'BSIT','2026-04-01 15:29:18','2026-04-01 15:29:18'),(64,70,'BSIT','2026-04-01 15:29:19','2026-04-01 15:29:19'),(65,71,'BSIT','2026-04-01 15:29:19','2026-04-01 15:29:19'),(66,72,'BSIT','2026-04-01 15:29:20','2026-04-01 15:29:20'),(67,73,'BSIT','2026-04-01 15:29:20','2026-04-01 15:29:20'),(68,74,'BSIT','2026-04-01 15:29:21','2026-04-01 15:29:21'),(69,75,'BSIT','2026-04-01 15:29:22','2026-04-01 15:29:22'),(70,76,'BSIT','2026-04-01 15:29:22','2026-04-01 15:29:22'),(71,77,'BSIT','2026-04-01 15:29:22','2026-04-01 15:29:22'),(72,78,'BSIT','2026-04-01 15:29:23','2026-04-01 15:29:23'),(73,79,'BSIT','2026-04-01 15:29:23','2026-04-01 15:29:23'),(74,80,'BSIT','2026-04-01 15:29:23','2026-04-01 15:29:23'),(75,81,'BSIT','2026-04-01 15:29:24','2026-04-01 15:29:24'),(76,82,'BSIT','2026-04-01 15:29:24','2026-04-01 15:29:24'),(77,83,'BSIT','2026-04-01 15:29:25','2026-04-01 15:29:25'),(78,84,'BSIT','2026-04-01 15:29:25','2026-04-01 15:29:25'),(79,85,'BSIT','2026-04-01 15:29:25','2026-04-01 15:29:25'),(80,86,'BSIT','2026-04-01 15:29:26','2026-04-01 15:29:26'),(81,87,'BSIT','2026-04-01 15:29:26','2026-04-01 15:29:26'),(82,88,'BSIT','2026-04-01 15:29:27','2026-04-01 15:29:27'),(83,89,'BSIT','2026-04-01 15:29:27','2026-04-01 15:29:27'),(84,90,'BSIT','2026-04-01 15:29:27','2026-04-01 15:29:27'),(85,91,'BSIT','2026-04-01 15:29:28','2026-04-01 15:29:28'),(86,92,'BSIT','2026-04-01 15:29:28','2026-04-01 15:29:28'),(87,93,'BSIT','2026-04-01 15:29:29','2026-04-01 15:29:29'),(88,94,'BSIT','2026-04-01 15:29:29','2026-04-01 15:29:29'),(89,95,'BSIT','2026-04-01 15:29:30','2026-04-01 15:29:30'),(90,96,'BSIT','2026-04-01 15:29:30','2026-04-01 15:29:30'),(91,97,'BSIT','2026-04-01 15:29:31','2026-04-01 15:29:31'),(92,98,'BSIT','2026-04-01 15:29:31','2026-04-01 15:29:31'),(93,99,'BSIT','2026-04-01 15:29:32','2026-04-01 15:29:32'),(94,100,'BSIT','2026-04-01 15:29:32','2026-04-01 15:29:32'),(95,101,'BSIT','2026-04-01 15:29:32','2026-04-01 15:29:32'),(96,102,'BSIT','2026-04-01 15:29:33','2026-04-01 15:29:33'),(97,103,'BSIT','2026-04-01 15:29:33','2026-04-01 15:29:33'),(98,104,'BSIT','2026-04-01 15:29:34','2026-04-01 15:29:34'),(99,105,'BSIT','2026-04-01 15:29:34','2026-04-01 15:29:34'),(100,106,'BSIT','2026-04-01 15:29:35','2026-04-01 15:29:35'),(101,107,'BSIT','2026-04-01 15:29:35','2026-04-01 15:29:35'),(102,108,'BSIT','2026-04-01 15:29:36','2026-04-01 15:29:36'),(103,109,'BSIT','2026-04-01 15:29:36','2026-04-01 15:29:36'),(104,110,'BSIT','2026-04-01 15:29:37','2026-04-01 15:29:37'),(105,111,'BSIT','2026-04-01 15:29:37','2026-04-01 15:29:37'),(106,112,'BSIT','2026-04-01 15:29:38','2026-04-01 15:29:38'),(107,113,'BSIT','2026-04-01 15:29:38','2026-04-01 15:29:38'),(108,114,'BSIT','2026-04-01 15:29:38','2026-04-01 15:29:38'),(109,115,'BSIT','2026-04-01 15:29:39','2026-04-01 15:29:39'),(110,116,'BSIT','2026-04-01 15:29:39','2026-04-01 15:29:39'),(111,117,'BSIT','2026-04-01 15:29:40','2026-04-01 15:29:40'),(112,118,'BSIT','2026-04-01 15:29:40','2026-04-01 15:29:40'),(113,119,'BSIT','2026-04-01 15:29:40','2026-04-01 15:29:40'),(114,120,'BSIT','2026-04-01 15:29:41','2026-04-01 15:29:41'),(115,121,'BSIT','2026-04-01 15:29:41','2026-04-01 15:29:41'),(116,122,'BSIT','2026-04-01 15:29:41','2026-04-01 15:29:41'),(117,123,'BSIT','2026-04-01 15:29:42','2026-04-01 15:29:42'),(118,124,'BSIT','2026-04-01 15:29:42','2026-04-01 15:29:42'),(119,125,'BSIT','2026-04-01 15:29:43','2026-04-01 15:29:43'),(120,126,'BSIT','2026-04-01 15:29:43','2026-04-01 15:29:43'),(121,127,'BSIT','2026-04-01 15:29:43','2026-04-01 15:29:43'),(122,128,'BSIT','2026-04-01 15:29:44','2026-04-01 15:29:44'),(123,129,'BSIT','2026-04-01 15:29:44','2026-04-01 15:29:44'),(124,130,'BSIT','2026-04-01 15:29:44','2026-04-01 15:29:44'),(125,131,'BSIT','2026-04-01 15:29:44','2026-04-01 15:29:44'),(126,132,'BSIT','2026-04-01 15:29:45','2026-04-01 15:29:45'),(127,133,'BSIT','2026-04-01 15:29:45','2026-04-01 15:29:45'),(128,134,'BSIT','2026-04-01 15:29:45','2026-04-01 15:29:45'),(129,135,'BSIT','2026-04-01 15:29:46','2026-04-01 15:29:46'),(130,136,'BSIT','2026-04-01 15:29:46','2026-04-01 15:29:46'),(131,137,'BSIT','2026-04-01 15:29:46','2026-04-01 15:29:46'),(132,138,'BSIT','2026-04-01 15:29:47','2026-04-01 15:29:47'),(133,139,'BSIT','2026-04-01 15:29:47','2026-04-01 15:29:47'),(134,140,'BSIT','2026-04-01 15:29:47','2026-04-01 15:29:47'),(135,141,'BSIT','2026-04-01 15:29:48','2026-04-01 15:29:48'),(136,142,'BSIT','2026-04-01 15:29:48','2026-04-01 15:29:48'),(137,143,'BSIT','2026-04-01 15:29:48','2026-04-01 15:29:48'),(138,144,'BSIT','2026-04-01 15:29:49','2026-04-01 15:29:49'),(139,145,'BSIT','2026-04-01 15:29:49','2026-04-01 15:29:49'),(140,146,'BSIT','2026-04-01 15:29:49','2026-04-01 15:29:49'),(141,147,'BSIT','2026-04-01 15:29:50','2026-04-01 15:29:50'),(142,148,'BSIT','2026-04-01 15:29:50','2026-04-01 15:29:50'),(143,149,'BSIT','2026-04-01 15:29:50','2026-04-01 15:29:50'),(144,150,'BSIT','2026-04-01 15:29:51','2026-04-01 15:29:51'),(145,151,'BSIT','2026-04-01 15:29:51','2026-04-01 15:29:51'),(146,152,'BSIT','2026-04-01 15:29:51','2026-04-01 15:29:51'),(147,153,'BSIT','2026-04-01 15:29:52','2026-04-01 15:29:52'),(148,154,'BSIT','2026-04-01 15:29:52','2026-04-01 15:29:52'),(149,155,'BSIT','2026-04-01 15:29:52','2026-04-01 15:29:52'),(150,156,'BSIT','2026-04-01 15:29:53','2026-04-01 15:29:53'),(151,157,'BSIT','2026-04-01 15:29:53','2026-04-01 15:29:53'),(152,158,'BSIT','2026-04-01 15:29:53','2026-04-01 15:29:53'),(153,159,'BSIT','2026-04-01 15:29:54','2026-04-01 15:29:54'),(154,160,'BSIT','2026-04-01 15:29:54','2026-04-01 15:29:54'),(155,161,'BSIT','2026-04-01 15:29:54','2026-04-01 15:29:54'),(156,162,'BSIT','2026-04-01 15:29:55','2026-04-01 15:29:55'),(157,163,'BSIT','2026-04-01 15:29:55','2026-04-01 15:29:55'),(158,164,'BSIT','2026-04-01 15:29:55','2026-04-01 15:29:55'),(159,165,'BSIT','2026-04-01 15:29:56','2026-04-01 15:29:56'),(160,166,'BSIT','2026-04-01 15:29:56','2026-04-01 15:29:56'),(161,167,'BSIT','2026-04-01 15:29:56','2026-04-01 15:29:56'),(162,168,'BSIT','2026-04-01 15:29:57','2026-04-01 15:29:57'),(163,169,'BSIT','2026-04-01 15:29:57','2026-04-01 15:29:57'),(164,170,'BSIT','2026-04-01 15:29:57','2026-04-01 15:29:57'),(165,171,'BSIT','2026-04-01 15:29:57','2026-04-01 15:29:57'),(166,172,'BSIT','2026-04-01 15:29:58','2026-04-01 15:29:58'),(167,173,'BSIT','2026-04-01 15:29:58','2026-04-01 15:29:58'),(168,174,'BSIT','2026-04-01 15:29:58','2026-04-01 15:29:58'),(169,175,'BSIT','2026-04-01 15:29:59','2026-04-01 15:29:59'),(170,176,'BSIT','2026-04-01 15:29:59','2026-04-01 15:29:59'),(171,177,'BSIT','2026-04-01 15:29:59','2026-04-01 15:29:59'),(172,178,'BSIT','2026-04-01 15:30:00','2026-04-01 15:30:00'),(173,179,'BSIT','2026-04-01 15:30:00','2026-04-01 15:30:00'),(174,180,'BSIT','2026-04-01 15:30:00','2026-04-01 15:30:00'),(175,181,'BSIT','2026-04-01 15:30:01','2026-04-01 15:30:01'),(176,182,'BSIT','2026-04-01 15:30:01','2026-04-01 15:30:01'),(177,183,'BSIT','2026-04-01 15:30:01','2026-04-01 15:30:01'),(178,184,'BSIT','2026-04-01 15:30:02','2026-04-01 15:30:02'),(179,185,'BSIT','2026-04-01 15:30:02','2026-04-01 15:30:02'),(180,186,'BSIT','2026-04-01 15:30:02','2026-04-01 15:30:02'),(181,187,'BSIT','2026-04-01 15:30:03','2026-04-01 15:30:03'),(182,188,'BSIT','2026-04-01 15:30:03','2026-04-01 15:30:03'),(183,189,'BSIT','2026-04-01 15:30:03','2026-04-01 15:30:03'),(184,190,'BSIT','2026-04-01 15:30:03','2026-04-01 15:30:03'),(185,191,'BSIT','2026-04-01 15:30:04','2026-04-01 15:30:04'),(186,192,'BSIT','2026-04-01 15:30:04','2026-04-01 15:30:04'),(187,193,'BSIT','2026-04-01 15:30:04','2026-04-01 15:30:04'),(188,194,'BSIT','2026-04-01 15:30:05','2026-04-01 15:30:05'),(189,195,'BSIT','2026-04-01 15:30:05','2026-04-01 15:30:05'),(190,196,'BSIT','2026-04-01 15:30:05','2026-04-01 15:30:05'),(191,197,'BSIT','2026-04-01 15:30:06','2026-04-01 15:30:06'),(192,198,'BSIT','2026-04-01 15:30:06','2026-04-01 15:30:06'),(193,199,'BSIT','2026-04-01 15:30:06','2026-04-01 15:30:06'),(194,200,'BSIT','2026-04-01 15:30:07','2026-04-01 15:30:07'),(195,201,'BSIT','2026-04-01 15:30:07','2026-04-01 15:30:07'),(196,202,'BSIT','2026-04-01 15:30:07','2026-04-01 15:30:07'),(197,203,'BSIT','2026-04-01 15:30:07','2026-04-01 15:30:07'),(198,204,'BSIT','2026-04-01 15:30:08','2026-04-01 15:30:08'),(199,205,'BSIT','2026-04-01 15:30:08','2026-04-01 15:30:08'),(200,206,'BSIT','2026-04-01 15:30:08','2026-04-01 15:30:08'),(201,207,'BSIT','2026-04-01 15:30:09','2026-04-01 15:30:09'),(202,208,'BSIT','2026-04-01 15:30:09','2026-04-01 15:30:09'),(203,209,'BSIT','2026-04-01 15:30:09','2026-04-01 15:30:09'),(204,210,'BSIT','2026-04-01 15:30:10','2026-04-01 15:30:10'),(205,211,'BSIT','2026-04-01 15:30:10','2026-04-01 15:30:10'),(206,212,'BSIT','2026-04-01 15:30:10','2026-04-01 15:30:10'),(207,213,'BSIT','2026-04-01 15:30:11','2026-04-01 15:30:11'),(208,214,'BSIT','2026-04-01 15:30:11','2026-04-01 15:30:11'),(209,215,'BSIT','2026-04-01 15:30:11','2026-04-01 15:30:11'),(210,216,'BSIT','2026-04-01 15:30:12','2026-04-01 15:30:12'),(211,217,'BSIT','2026-04-01 15:30:12','2026-04-01 15:30:12'),(212,218,'BSIT','2026-04-01 15:30:12','2026-04-01 15:30:12'),(213,219,'BSIT','2026-04-01 15:30:13','2026-04-01 15:30:13'),(214,220,'BSIT','2026-04-01 15:30:13','2026-04-01 15:30:13'),(215,221,'BSIT','2026-04-01 15:30:13','2026-04-01 15:30:13'),(216,222,'BSIT','2026-04-01 15:30:14','2026-04-01 15:30:14'),(217,223,'BSIT','2026-04-01 15:30:14','2026-04-01 15:30:14'),(218,224,'BSIT','2026-04-01 15:30:14','2026-04-01 15:30:14'),(219,225,'BSIT','2026-04-01 15:30:14','2026-04-01 15:30:14'),(220,226,'BSIT','2026-04-01 15:30:15','2026-04-01 15:30:15'),(221,227,'BSIT','2026-04-01 15:30:15','2026-04-01 15:30:15'),(222,228,'BSIT','2026-04-01 15:30:15','2026-04-01 15:30:15'),(223,229,'BSIT','2026-04-01 15:30:16','2026-04-01 15:30:16'),(224,230,'BSIT','2026-04-01 15:30:16','2026-04-01 15:30:16'),(225,231,'BSIT','2026-04-01 15:30:16','2026-04-01 15:30:16'),(226,232,'BSIT','2026-04-01 15:30:17','2026-04-01 15:30:17'),(227,233,'BSIT','2026-04-01 15:30:17','2026-04-01 15:30:17'),(228,234,'BSIT','2026-04-01 15:30:17','2026-04-01 15:30:17'),(229,235,'BSIT','2026-04-01 15:30:18','2026-04-01 15:30:18'),(230,236,'BSIT','2026-04-01 15:30:18','2026-04-01 15:30:18'),(231,237,'BSIT','2026-04-01 15:30:18','2026-04-01 15:30:18'),(232,238,'BSIT','2026-04-01 15:30:19','2026-04-01 15:30:19'),(233,239,'BSIT','2026-04-01 15:30:19','2026-04-01 15:30:19'),(234,240,'BSIT','2026-04-01 15:30:19','2026-04-01 15:30:19'),(235,241,'BSIT','2026-04-01 15:30:19','2026-04-01 15:30:19'),(236,242,'BSIS','2026-04-01 15:30:57','2026-04-01 15:30:57'),(237,243,'BSIS','2026-04-01 15:30:58','2026-04-01 15:30:58'),(238,244,'BSIS','2026-04-01 15:30:58','2026-04-01 15:30:58'),(239,245,'BSIS','2026-04-01 15:30:58','2026-04-01 15:30:58'),(240,246,'BSIS','2026-04-01 15:30:59','2026-04-01 15:30:59'),(241,247,'BSIS','2026-04-01 15:30:59','2026-04-01 15:30:59'),(242,248,'BSIS','2026-04-01 15:30:59','2026-04-01 15:30:59'),(243,249,'BSIS','2026-04-01 15:31:00','2026-04-01 15:31:00'),(244,250,'BSIS','2026-04-01 15:31:00','2026-04-01 15:31:00'),(245,251,'BSIS','2026-04-01 15:31:01','2026-04-01 15:31:01'),(246,252,'BSIS','2026-04-01 15:31:01','2026-04-01 15:31:01'),(247,253,'BSIS','2026-04-01 15:31:01','2026-04-01 15:31:01'),(248,254,'BSIS','2026-04-01 15:31:02','2026-04-01 15:31:02'),(249,255,'BSIS','2026-04-01 15:31:02','2026-04-01 15:31:02'),(250,256,'BSIS','2026-04-01 15:31:03','2026-04-01 15:31:03'),(251,257,'BSIS','2026-04-01 15:31:03','2026-04-01 15:31:03'),(252,258,'BSIS','2026-04-01 15:31:04','2026-04-01 15:31:04'),(253,259,'BSIS','2026-04-01 15:31:04','2026-04-01 15:31:04'),(254,260,'BSIS','2026-04-01 15:31:04','2026-04-01 15:31:04'),(255,261,'BSIS','2026-04-01 15:31:05','2026-04-01 15:31:05'),(256,262,'BSIS','2026-04-01 15:31:05','2026-04-01 15:31:05'),(257,263,'BSIS','2026-04-01 15:31:06','2026-04-01 15:31:06'),(258,264,'BSIS','2026-04-01 15:31:06','2026-04-01 15:31:06'),(259,265,'BSIS','2026-04-01 15:31:07','2026-04-01 15:31:07'),(260,266,'BSIS','2026-04-01 15:31:07','2026-04-01 15:31:07'),(261,267,'BSIS','2026-04-01 15:31:07','2026-04-01 15:31:07'),(262,268,'BSIS','2026-04-01 15:31:08','2026-04-01 15:31:08'),(263,269,'BSIS','2026-04-01 15:31:08','2026-04-01 15:31:08'),(264,270,'BSIS','2026-04-01 15:31:09','2026-04-01 15:31:09'),(265,271,'BSIS','2026-04-01 15:31:09','2026-04-01 15:31:09'),(266,272,'BSIS','2026-04-01 15:31:09','2026-04-01 15:31:09'),(267,273,'BSIS','2026-04-01 15:31:10','2026-04-01 15:31:10'),(268,274,'BSIS','2026-04-01 15:31:10','2026-04-01 15:31:10'),(269,275,'BSIS','2026-04-01 15:31:11','2026-04-01 15:31:11'),(270,276,'BSIS','2026-04-01 15:31:11','2026-04-01 15:31:11'),(271,277,'BSIS','2026-04-01 15:31:12','2026-04-01 15:31:12'),(272,278,'BSIS','2026-04-01 15:31:12','2026-04-01 15:31:12'),(273,279,'BSIS','2026-04-01 15:31:12','2026-04-01 15:31:12'),(274,280,'BSIS','2026-04-01 15:31:13','2026-04-01 15:31:13'),(275,281,'BSIS','2026-04-01 15:31:13','2026-04-01 15:31:13'),(276,282,'BSIS','2026-04-01 15:31:14','2026-04-01 15:31:14'),(277,283,'BSIS','2026-04-01 15:31:14','2026-04-01 15:31:14'),(278,284,'BSIS','2026-04-01 15:31:15','2026-04-01 15:31:15'),(279,285,'BSIS','2026-04-01 15:31:15','2026-04-01 15:31:15'),(280,286,'BSIS','2026-04-01 15:31:16','2026-04-01 15:31:16'),(281,287,'BSIS','2026-04-01 15:31:16','2026-04-01 15:31:16'),(282,288,'BSIS','2026-04-01 15:31:17','2026-04-01 15:31:17'),(283,289,'BSIS','2026-04-01 15:31:17','2026-04-01 15:31:17'),(284,290,'BSIS','2026-04-01 15:31:18','2026-04-01 15:31:18'),(285,291,'BSIS','2026-04-01 15:31:18','2026-04-01 15:31:18'),(286,292,'BSIS','2026-04-01 15:31:19','2026-04-01 15:31:19'),(287,293,'BSIS','2026-04-01 15:31:19','2026-04-01 15:31:19'),(288,294,'BSIS','2026-04-01 15:31:19','2026-04-01 15:31:19'),(289,295,'BSIS','2026-04-01 15:31:20','2026-04-01 15:31:20'),(290,296,'BSIS','2026-04-01 15:31:20','2026-04-01 15:31:20'),(291,297,'BSIS','2026-04-01 15:31:21','2026-04-01 15:31:21'),(292,298,'BSIS','2026-04-01 15:31:22','2026-04-01 15:31:22'),(293,299,'BSIS','2026-04-01 15:31:22','2026-04-01 15:31:22'),(294,300,'BSIS','2026-04-01 15:31:22','2026-04-01 15:31:22'),(295,301,'BSIS','2026-04-01 15:31:23','2026-04-01 15:31:23'),(296,302,'BSIS','2026-04-01 15:31:23','2026-04-01 15:31:23'),(297,303,'BSIS','2026-04-01 15:31:24','2026-04-01 15:31:24'),(298,304,'BSIS','2026-04-01 15:31:24','2026-04-01 15:31:24'),(299,305,'BSIS','2026-04-01 15:31:25','2026-04-01 15:31:25'),(300,306,'BSIS','2026-04-01 15:31:25','2026-04-01 15:31:25'),(301,307,'BSIS','2026-04-01 15:31:25','2026-04-01 15:31:25'),(302,308,'BSIS','2026-04-01 15:31:26','2026-04-01 15:31:26'),(303,309,'BSIS','2026-04-01 15:31:26','2026-04-01 15:31:26'),(304,310,'BSIS','2026-04-01 15:31:27','2026-04-01 15:31:27'),(305,311,'BSIS','2026-04-01 15:31:27','2026-04-01 15:31:27'),(306,312,'BSIS','2026-04-01 15:31:27','2026-04-01 15:31:27'),(307,313,'BSIS','2026-04-01 15:31:28','2026-04-01 15:31:28'),(308,314,'BSIS','2026-04-01 15:31:28','2026-04-01 15:31:28'),(309,315,'BSIS','2026-04-01 15:31:29','2026-04-01 15:31:29'),(310,316,'BSIS','2026-04-01 15:31:29','2026-04-01 15:31:29'),(311,317,'BSIS','2026-04-01 15:31:30','2026-04-01 15:31:30'),(312,318,'BSIS','2026-04-01 15:31:30','2026-04-01 15:31:30'),(313,319,'BSIS','2026-04-01 15:31:31','2026-04-01 15:31:31'),(314,320,'BSIS','2026-04-01 15:31:31','2026-04-01 15:31:31'),(315,321,'BSIS','2026-04-01 15:31:32','2026-04-01 15:31:32'),(316,322,'BSIS','2026-04-01 15:31:32','2026-04-01 15:31:32');
/*!40000 ALTER TABLE `student_program` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `system_settings`
--

DROP TABLE IF EXISTS `system_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `system_settings` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `key` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `value` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `system_settings_key_unique` (`key`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `system_settings`
--

LOCK TABLES `system_settings` WRITE;
/*!40000 ALTER TABLE `system_settings` DISABLE KEYS */;
INSERT INTO `system_settings` VALUES (1,'academicYear','2025-2026','2026-04-01 15:32:00','2026-04-01 15:32:00');
/*!40000 ALTER TABLE `system_settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `title_categories`
--

DROP TABLE IF EXISTS `title_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `title_categories` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `program` enum('BSIT','BSIS') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `title_categories_program_name_unique` (`program`,`name`),
  KEY `title_categories_program_index` (`program`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `title_categories`
--

LOCK TABLES `title_categories` WRITE;
/*!40000 ALTER TABLE `title_categories` DISABLE KEYS */;
/*!40000 ALTER TABLE `title_categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `title_repositories`
--

DROP TABLE IF EXISTS `title_repositories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `title_repositories` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `title_category_id` bigint unsigned NOT NULL,
  `academic_year_id` bigint unsigned NOT NULL,
  `adviser_id` bigint unsigned DEFAULT NULL,
  `status` enum('Approved','Archived') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Approved',
  `created_by` bigint unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `title_repositories_ay_title_unique` (`academic_year_id`,`title`),
  KEY `title_repositories_adviser_id_foreign` (`adviser_id`),
  KEY `title_repositories_created_by_foreign` (`created_by`),
  KEY `title_repositories_lookup_index` (`title_category_id`,`academic_year_id`,`adviser_id`),
  KEY `title_repositories_status_index` (`status`),
  CONSTRAINT `title_repositories_academic_year_id_foreign` FOREIGN KEY (`academic_year_id`) REFERENCES `academic_years` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `title_repositories_adviser_id_foreign` FOREIGN KEY (`adviser_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `title_repositories_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `title_repositories_title_category_id_foreign` FOREIGN KEY (`title_category_id`) REFERENCES `title_categories` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `title_repositories`
--

LOCK TABLES `title_repositories` WRITE;
/*!40000 ALTER TABLE `title_repositories` DISABLE KEYS */;
/*!40000 ALTER TABLE `title_repositories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `first_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `last_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `password` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `remember_token` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `active_session_id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `active_session_last_activity_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `role` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `program` enum('BSIT','BSIS') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_unique` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=356 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'Admin User','Admin','User','admin@dnsc.ic.ph',NULL,'$2y$12$MEl.SwRzQ7dMpsEqvAe4q.vSAlLcYlojxX4u0iE.no4vZK2DGnjHG',NULL,NULL,NULL,'2026-04-01 15:15:34','2026-04-01 15:15:34','admin','active',NULL),(2,'Student User','Student','User','student@dnsc.ic.ph',NULL,'$2y$12$hA9PwEwfwIeOrNcRTllKBeShXtCpKwyuqZta0/cxmOB6niv90qAT.',NULL,NULL,NULL,'2026-04-01 15:15:34','2026-04-01 15:15:34','student','active',NULL),(3,'Adviser User','Adviser','User','adviser@dnsc.ic.ph',NULL,'$2y$12$A3F6l8f7.GucZGkboEYDeO1n5Qu4ItrCg/qyNVF.2.w9xLrUL/T52',NULL,NULL,NULL,'2026-04-01 15:15:34','2026-04-01 15:15:34','adviser','active',NULL),(4,'Panelist User','Panelist','User','panelist@dnsc.ic.ph',NULL,'$2y$12$sA0scV/9Pl/a9sYexQkH6e/DSnTFH9GaE78LMxd0u.G3oYCkZXG3W',NULL,NULL,NULL,'2026-04-01 15:15:35','2026-04-01 15:15:35','panelist','active',NULL),(5,'Instructor User','Instructor','User','instructor@dnsc.ic.ph',NULL,'$2y$12$2O3ic3Kdf72/9UsD1WCv7.Dipe6DHLwAT/LkWQoyNTmG7GnHyPvji',NULL,NULL,NULL,'2026-04-01 15:15:35','2026-04-01 15:15:35','instructor','active',NULL),(6,'Dean User','Dean','User','dean@dnsc.ic.ph',NULL,'$2y$12$V53JXlAhR2/6yhNjLIo2DOYfUtHuFMDxtu/9c58oepowBEbqJogfG',NULL,NULL,NULL,'2026-04-01 15:15:35','2026-04-01 15:15:35','dean','active',NULL),(7,'Program Chairperson User','Program Chairperson','User','program_chairperson@dnsc.ic.ph',NULL,'$2y$12$rAXalMKFOwJlwh4dwYH/q.qW7BgQmyIORYwRgk4raijh.5DG7pVmu',NULL,NULL,NULL,'2026-04-01 15:15:35','2026-04-01 15:15:35','program_chairperson','active',NULL),(8,'Juan Dela Cruz','Juan','Dela Cruz','delacruz.juan@dnsc.ic.ph',NULL,'$2y$12$1EtDZSemITiQEApV7ai6Lex/tUnQ.gIIoZUH6SzE2nZ2GbwxDgUOe',NULL,NULL,NULL,'2026-04-01 15:28:48','2026-04-01 15:28:48','student','active',NULL),(9,'Maria Santos','Maria','Santos','santos.maria@dnsc.ic.ph',NULL,'$2y$12$QtQJeiCGOgTxcQgSXRvo0uDW/0xEftwY2lW5uSfLpdhHY6F50J5BC',NULL,NULL,NULL,'2026-04-01 15:28:48','2026-04-01 15:28:48','student','active',NULL),(10,'Jose Reyes','Jose','Reyes','reyes.jose@dnsc.ic.ph',NULL,'$2y$12$rYkoPN6o8qERdwYy764b8.Y6s8IUv.x4/miLj/aPRtxNQdJEUY1YC',NULL,NULL,NULL,'2026-04-01 15:28:49','2026-04-01 15:28:49','student','active',NULL),(11,'Ana Cruz','Ana','Cruz','cruz.ana@dnsc.ic.ph',NULL,'$2y$12$kcRzcNJALVdDb5s9IgFsNeRh/Jnl7Yb.MAZYYPtb/Qe9X25tz9aqC',NULL,NULL,NULL,'2026-04-01 15:28:49','2026-04-01 15:28:49','student','active',NULL),(12,'Carlo Garcia','Carlo','Garcia','garcia.carlo@dnsc.ic.ph',NULL,'$2y$12$hD.s18cn0mcDQ4t/29Ri7O1sSQkvpG6omHMt/084NW2F5syfcutFu',NULL,NULL,NULL,'2026-04-01 15:28:50','2026-04-01 15:28:50','student','active',NULL),(13,'Mark Mendoza','Mark','Mendoza','mendoza.mark@dnsc.ic.ph',NULL,'$2y$12$ivXwDpZjZMbfKpvq7xciueNU7r5lPkLcf1IS9yPoOsrxNhk25U5d6',NULL,NULL,NULL,'2026-04-01 15:28:50','2026-04-01 15:28:50','student','active',NULL),(14,'John Bautista','John','Bautista','bautista.john@dnsc.ic.ph',NULL,'$2y$12$6eNmJ4BqXzWHKgoz3WaqnO37j1BCnRG7NCHQn25v0q9CBiXPUMVs.',NULL,NULL,NULL,'2026-04-01 15:28:50','2026-04-01 15:28:50','student','active',NULL),(15,'Paul Ramos','Paul','Ramos','ramos.paul@dnsc.ic.ph',NULL,'$2y$12$yOr9SsKvYxbPBi2I8k6inO51qY7A7jWnKxxO3z1fMNtq/MLvXtuey',NULL,NULL,NULL,'2026-04-01 15:28:51','2026-04-01 15:28:51','student','active',NULL),(16,'Kevin Torres','Kevin','Torres','torres.kevin@dnsc.ic.ph',NULL,'$2y$12$MjuNEajkLXvX1CuUnEr/q.Jy6gMYRdJzufiAuH61WZWcg8vtG77ta',NULL,NULL,NULL,'2026-04-01 15:28:51','2026-04-01 15:28:51','student','active',NULL),(17,'James Flores','James','Flores','flores.james@dnsc.ic.ph',NULL,'$2y$12$5bAn/x6.Lp9HdFivNG9/duHLszQMi.P5JxUpEsw3yGPFdAYKmff9i',NULL,NULL,NULL,'2026-04-01 15:28:51','2026-04-01 15:28:51','student','active',NULL),(18,'Angel Gonzales','Angel','Gonzales','gonzales.angel@dnsc.ic.ph',NULL,'$2y$12$smBV9cmAPYHl.wztjGqHSO3/LqUXs5wIIsj84IdfVCQTVIMvTcWcm',NULL,NULL,NULL,'2026-04-01 15:28:52','2026-04-01 15:28:52','student','active',NULL),(19,'Joshua Aquino','Joshua','Aquino','aquino.joshua@dnsc.ic.ph',NULL,'$2y$12$TdFJ4JD8S15dAkpmyescUugvwHcaD5DdfaHaQ07R8PpKwhEHeInL2',NULL,NULL,NULL,'2026-04-01 15:28:52','2026-04-01 15:28:52','student','active',NULL),(20,'Daniel Navarro','Daniel','Navarro','navarro.daniel@dnsc.ic.ph',NULL,'$2y$12$mIQyKbd5VQ.M1E5LLDw4euUrJ/6.8wMsyxlBFIvKRkwzu4paP6G7W',NULL,NULL,NULL,'2026-04-01 15:28:52','2026-04-01 15:28:52','student','active',NULL),(21,'Christian Castillo','Christian','Castillo','castillo.christian@dnsc.ic.ph',NULL,'$2y$12$Jh1xiaOxE2JFa8dyOvOpme8P7DjAWzG0Ddy9m7T8wUWUSr2GwVY.O',NULL,NULL,NULL,'2026-04-01 15:28:53','2026-04-01 15:28:53','student','active',NULL),(22,'Patrick Herrera','Patrick','Herrera','herrera.patrick@dnsc.ic.ph',NULL,'$2y$12$0PvpmSwu5Yx8rVxFECynN.H8MRYVkWgRvlxEXs/IoXvcHnt0wsMx2',NULL,NULL,NULL,'2026-04-01 15:28:53','2026-04-01 15:28:53','student','active',NULL),(23,'Bryan Medina','Bryan','Medina','medina.bryan@dnsc.ic.ph',NULL,'$2y$12$01P4PDF2nV8kOKmI1ApiP.Df/c3AtiwqVI2pjKL5cyQBhQfMxd6kq',NULL,NULL,NULL,'2026-04-01 15:28:54','2026-04-01 15:28:54','student','active',NULL),(24,'Francis Ortega','Francis','Ortega','ortega.francis@dnsc.ic.ph',NULL,'$2y$12$t3Wg4cTgJQ76ZSH9iTvJB.WPW7U/QUnhWYNJHJJz0.BaPYvtcAGja',NULL,NULL,NULL,'2026-04-01 15:28:54','2026-04-01 15:28:54','student','active',NULL),(25,'Leo Chavez','Leo','Chavez','chavez.leo@dnsc.ic.ph',NULL,'$2y$12$N8sqzPxSYpJvKbvI9J/tvOI/PomCMDHt.JvGrQCDKYGrMC9qOEWrS',NULL,NULL,NULL,'2026-04-01 15:28:55','2026-04-01 15:28:55','student','active',NULL),(26,'Vincent Villanueva','Vincent','Villanueva','villanueva.vincent@dnsc.ic.ph',NULL,'$2y$12$tPKnrsmNX4i4IKjfzgUyeOlwZxkuoPTtNyCmxeIOjrGPfRwwfXaaa',NULL,NULL,NULL,'2026-04-01 15:28:55','2026-04-01 15:28:55','student','active',NULL),(27,'Ron Dominguez','Ron','Dominguez','dominguez.ron@dnsc.ic.ph',NULL,'$2y$12$v3lpNhbOrKOnf.kgTxZVhuEVLSbWzgTr5lVFVEJbBtPgA/P6xBPL6',NULL,NULL,NULL,'2026-04-01 15:28:55','2026-04-01 15:28:55','student','active',NULL),(28,'Jessa Lopez','Jessa','Lopez','lopez.jessa@dnsc.ic.ph',NULL,'$2y$12$MuPaelB7l4PCv8NN9csu9Otdeutt8hzPBda/DtRnO8y8nBNKRHH7K',NULL,NULL,NULL,'2026-04-01 15:28:56','2026-04-01 15:28:56','student','active',NULL),(29,'Carla Perez','Carla','Perez','perez.carla@dnsc.ic.ph',NULL,'$2y$12$VwET6F3VrxzD5cmUVdA4Zu8PAclPtT4SAH0iYnvih56.3FOchLZ6y',NULL,NULL,NULL,'2026-04-01 15:28:56','2026-04-01 15:28:56','student','active',NULL),(30,'Angela Lim','Angela','Lim','lim.angela@dnsc.ic.ph',NULL,'$2y$12$fB0g5CsWiGGBCtXOagRvKOZKrqPPSMYD6fCIHcGUa9R0cWrV4Ox4u',NULL,NULL,NULL,'2026-04-01 15:28:56','2026-04-01 15:28:56','student','active',NULL),(31,'Bea Tan','Bea','Tan','tan.bea@dnsc.ic.ph',NULL,'$2y$12$YflTuNv5QdI2hX74uBxJLu9ybi/7NGwDBYOjjuT6yn5490cMA7BVq',NULL,NULL,NULL,'2026-04-01 15:28:57','2026-04-01 15:28:57','student','active',NULL),(32,'Rica Sy','Rica','Sy','sy.rica@dnsc.ic.ph',NULL,'$2y$12$797CPvPjZhPCrrtTT.np5OsEuQlmNZ89FI2LFk7VdJmLDHpVrW97m',NULL,NULL,NULL,'2026-04-01 15:28:57','2026-04-01 15:28:57','student','active',NULL),(33,'Hazel Ong','Hazel','Ong','ong.hazel@dnsc.ic.ph',NULL,'$2y$12$uqvHAy4xf7beLtnqWqaUYugxNu4arNkAuzttCIMFzo3tOgYJFpj0u',NULL,NULL,NULL,'2026-04-01 15:28:58','2026-04-01 15:28:58','student','active',NULL),(34,'Joy Chua','Joy','Chua','chua.joy@dnsc.ic.ph',NULL,'$2y$12$vfzeu/39FlQmSt60h58fPeTrUL6CZi290v1p8x5nuT3p7ggq3wKCi',NULL,NULL,NULL,'2026-04-01 15:28:58','2026-04-01 15:28:58','student','active',NULL),(35,'Kim Uy','Kim','Uy','uy.kim@dnsc.ic.ph',NULL,'$2y$12$tzunAcc3nPjSd530xdzHb.1boQEGV6968Av38Yl/PcnSfqkdwP8Oa',NULL,NULL,NULL,'2026-04-01 15:28:59','2026-04-01 15:28:59','student','active',NULL),(36,'Trisha Go','Trisha','Go','go.trisha@dnsc.ic.ph',NULL,'$2y$12$ZAYR6soIdFoAd0vL0wghnOJ2bDlB2uMnydpjvo1ae2dBAhbX.ntoO',NULL,NULL,NULL,'2026-04-01 15:28:59','2026-04-01 15:28:59','student','active',NULL),(37,'Faith Yu','Faith','Yu','yu.faith@dnsc.ic.ph',NULL,'$2y$12$yc61ZQGVXvUCAgZ6vjILxexPcryVJ3f9fRy/HJ0rgVGzrvVwwTueO',NULL,NULL,NULL,'2026-04-01 15:28:59','2026-04-01 15:28:59','student','active',NULL),(38,'Noel Abad','Noel','Abad','abad.noel@dnsc.ic.ph',NULL,'$2y$12$UgS6SNv0HvVEmb7At/iNNeu1AEoPtPJNqrXhUuRM.AOfgcfLjEKLe',NULL,NULL,NULL,'2026-04-01 15:29:00','2026-04-01 15:29:00','student','active',NULL),(39,'Edwin Salazar','Edwin','Salazar','salazar.edwin@dnsc.ic.ph',NULL,'$2y$12$npvDSoOYIooAm7N7fxTIUubiewMxKtZg3.EL7jsTBbGmG0zanA1HG',NULL,NULL,NULL,'2026-04-01 15:29:00','2026-04-01 15:29:00','student','active',NULL),(40,'Arnold Velasco','Arnold','Velasco','velasco.arnold@dnsc.ic.ph',NULL,'$2y$12$qpY1LQeSk1eCcEjrL6aJquTIn03sNsq/DH0MerEhgudIuXF8fLpFK',NULL,NULL,NULL,'2026-04-01 15:29:01','2026-04-01 15:29:01','student','active',NULL),(41,'Gilbert Padilla','Gilbert','Padilla','padilla.gilbert@dnsc.ic.ph',NULL,'$2y$12$xioIvn.eGc0P3xlNxgGmkuYs7sU6OtrGULQK3W3UpLsbpr09..P62',NULL,NULL,NULL,'2026-04-01 15:29:01','2026-04-01 15:29:01','student','active',NULL),(42,'Cesar Pineda','Cesar','Pineda','pineda.cesar@dnsc.ic.ph',NULL,'$2y$12$RbC4cHJncOFN1nGSj4J3COPnP8XbQ8PDnksUpY5wLcJSquWcuz/zS',NULL,NULL,NULL,'2026-04-01 15:29:02','2026-04-01 15:29:02','student','active',NULL),(43,'Lito Soriano','Lito','Soriano','soriano.lito@dnsc.ic.ph',NULL,'$2y$12$UpBPfw.utozGFhHj3CSqn.VLb7bGsB2OIqlMuEIihsLwJWXH/Ujz6',NULL,NULL,NULL,'2026-04-01 15:29:02','2026-04-01 15:29:02','student','active',NULL),(44,'Roberto Alonzo','Roberto','Alonzo','alonzo.roberto@dnsc.ic.ph',NULL,'$2y$12$y.rtavwIrsays9iEzb2/POhaOmsRxyQpkLmutxK2Lnum4pO9Zud7O',NULL,NULL,NULL,'2026-04-01 15:29:03','2026-04-01 15:29:03','student','active',NULL),(45,'Dante Mercado','Dante','Mercado','mercado.dante@dnsc.ic.ph',NULL,'$2y$12$dbjHWHF7RXdFpzKkpZFZ0ur1opLZbcuN270CaJwLA5i1rc9nYapLy',NULL,NULL,NULL,'2026-04-01 15:29:03','2026-04-01 15:29:03','student','active',NULL),(46,'Victor Rosario','Victor','Rosario','rosario.victor@dnsc.ic.ph',NULL,'$2y$12$TR.zG5yGGSRqj7Xe8ekY6OCIgPlPgvuOq6i.TFXpkP2m57VqKQJGy',NULL,NULL,NULL,'2026-04-01 15:29:03','2026-04-01 15:29:03','student','active',NULL),(47,'Ramon Ferrer','Ramon','Ferrer','ferrer.ramon@dnsc.ic.ph',NULL,'$2y$12$EVLFInVfOyu8qew54M4hQeGFTqsLHaMQBJxprsztnxrwIC/keNKja',NULL,NULL,NULL,'2026-04-01 15:29:04','2026-04-01 15:29:04','student','active',NULL),(48,'Sheila Valdez','Sheila','Valdez','valdez.sheila@dnsc.ic.ph',NULL,'$2y$12$qCuClge6LBObgnlnEoqkjOibACB3CrJKOwJKYnQVyruB8zoLGAZ1u',NULL,NULL,NULL,'2026-04-01 15:29:05','2026-04-01 15:29:05','student','active',NULL),(49,'Liza Cabrera','Liza','Cabrera','cabrera.liza@dnsc.ic.ph',NULL,'$2y$12$e2Z8wqU47bGkOzhfREpPRugSSyFw1/1rmAKGk0dOiUvm6s7C11ywy',NULL,NULL,NULL,'2026-04-01 15:29:05','2026-04-01 15:29:05','student','active',NULL),(50,'Rowena Galvez','Rowena','Galvez','galvez.rowena@dnsc.ic.ph',NULL,'$2y$12$ajVYUeO3cboy3LiwQg1/leZ3bvoTGaGZ9pz3iFKOdyQcUAbU0Rzz6',NULL,NULL,NULL,'2026-04-01 15:29:06','2026-04-01 15:29:06','student','active',NULL),(51,'Maricel Natividad','Maricel','Natividad','natividad.maricel@dnsc.ic.ph',NULL,'$2y$12$z5hsDBuVlJYRDphKinI68Oy7cfm26IPuuDkEQszfQcqegIPOqqJ5q',NULL,NULL,NULL,'2026-04-01 15:29:06','2026-04-01 15:29:06','student','active',NULL),(52,'Evelyn Evangelista','Evelyn','Evangelista','evangelista.evelyn@dnsc.ic.ph',NULL,'$2y$12$njgeNvf3Stbpu04rMdPixOchhpDFxkiUMgIX0UTdx4wqJb2TeWaLu',NULL,NULL,NULL,'2026-04-01 15:29:07','2026-04-01 15:29:07','student','active',NULL),(53,'Rosalie Manalo','Rosalie','Manalo','manalo.rosalie@dnsc.ic.ph',NULL,'$2y$12$5pIDvBvnrX0FEnC5GksETeCO.tQqx2G8jnF8GtgYD6iEUCYBYgPy.',NULL,NULL,NULL,'2026-04-01 15:29:08','2026-04-01 15:29:08','student','active',NULL),(54,'Cherry Magno','Cherry','Magno','magno.cherry@dnsc.ic.ph',NULL,'$2y$12$iHgs6P4.HvUdeQbfkoRCguk3SwmhB2Y.c0ATheTX0i/F5j8blxqRi',NULL,NULL,NULL,'2026-04-01 15:29:08','2026-04-01 15:29:08','student','active',NULL),(55,'Dolores Bacani','Dolores','Bacani','bacani.dolores@dnsc.ic.ph',NULL,'$2y$12$2iMAjq.hKLUDGYW9ySo2hunUwW7doJbORryRLCZUYFdK.BN6gu0hK',NULL,NULL,NULL,'2026-04-01 15:29:09','2026-04-01 15:29:09','student','active',NULL),(56,'Perla Tolentino','Perla','Tolentino','tolentino.perla@dnsc.ic.ph',NULL,'$2y$12$.eayipqeUGzoaTmRbpxrye6FAsRZRcNFZOpwTcxbxAk4cEGhibrv2',NULL,NULL,NULL,'2026-04-01 15:29:09','2026-04-01 15:29:09','student','active',NULL),(57,'Nenita Carpio','Nenita','Carpio','carpio.nenita@dnsc.ic.ph',NULL,'$2y$12$9Bdx1khyn/zLFRfwEzxVouH27Dk7YLV/HS1D0MPQdl92zeEtMrsle',NULL,NULL,NULL,'2026-04-01 15:29:10','2026-04-01 15:29:10','student','active',NULL),(58,'Elena Bautista','Elena','Bautista','bautista.elena@dnsc.ic.ph',NULL,'$2y$12$o9NytjO.q6dwVZEm1lsxfeFi3IvIVLHmAnvx4E0PWRt7x83bZ5LJG',NULL,NULL,NULL,'2026-04-01 15:29:11','2026-04-01 15:29:11','student','active',NULL),(59,'Antonio Garcia','Antonio','Garcia','garcia.antonio@dnsc.ic.ph',NULL,'$2y$12$aMk/2d1egSFdo2BP/Dxyheg62pzfT6EZ6gpMfM7yK2deIwarwSqrS',NULL,NULL,NULL,'2026-04-01 15:29:11','2026-04-01 15:29:11','student','active',NULL),(60,'Rosa Mendoza','Rosa','Mendoza','mendoza.rosa@dnsc.ic.ph',NULL,'$2y$12$R8FSqUCG7T0KyAvgo0w3DOpT/FpyjAOsJseopJRO6Artl8Ro1uYyW',NULL,NULL,NULL,'2026-04-01 15:29:12','2026-04-01 15:29:12','student','active',NULL),(61,'Manuel Pascua','Manuel','Pascua','pascua.manuel@dnsc.ic.ph',NULL,'$2y$12$QeXxZ2QnQgpmOHA80Vub1eDI4DHtmcvXi7VYiCcdaTUv9c2Z/6MQ6',NULL,NULL,NULL,'2026-04-01 15:29:13','2026-04-01 15:29:13','student','active',NULL),(62,'Ricardo Dizon','Ricardo','Dizon','dizon.ricardo@dnsc.ic.ph',NULL,'$2y$12$QKnbwrr0BdWEJqtH5b9OTe2l3Yo2NgMigS4LtWipDuH6Cl7eQ7xby',NULL,NULL,NULL,'2026-04-01 15:29:13','2026-04-01 15:29:13','student','active',NULL),(63,'Lualhati Ramos','Lualhati','Ramos','ramos.lualhati@dnsc.ic.ph',NULL,'$2y$12$zm4Ak2lcQYYm7vDcfgrg1.wJ2SRyzDqt4e5QjBkkZZjQo0.WpjkKG',NULL,NULL,NULL,'2026-04-01 15:29:14','2026-04-01 15:29:14','student','active',NULL),(64,'Ferdinand Marcoso','Ferdinand','Marcoso','marcoso.ferdinand@dnsc.ic.ph',NULL,'$2y$12$2iyqOl5FIbfAGjhIB1xQ8.YRcZoFTFQiH7Aa5lc8KOghu6qzrJbWK',NULL,NULL,NULL,'2026-04-01 15:29:15','2026-04-01 15:29:15','student','active',NULL),(65,'Corazon Cojuangco','Corazon','Cojuangco','cojuangco.corazon@dnsc.ic.ph',NULL,'$2y$12$1g9SK9DTj5BuMtJYA4bB9OLElvRGAOq3mjJ0KMe7NZhOZf6.gaqMu',NULL,NULL,NULL,'2026-04-01 15:29:16','2026-04-01 15:29:16','student','active',NULL),(66,'Danilo Lopez','Danilo','Lopez','lopez.danilo@dnsc.ic.ph',NULL,'$2y$12$FUYVSntL9Wqf411V9bATTeE5uWbG0VsIDFiPh5MESiGFw38iMT87a',NULL,NULL,NULL,'2026-04-01 15:29:16','2026-04-01 15:29:16','student','active',NULL),(67,'Imelda Romualdez','Imelda','Romualdez','romualdez.imelda@dnsc.ic.ph',NULL,'$2y$12$VN4mursSejS1KMQKrydujegOZIpohDXAHTcZkUH8O8bok1rEl.UmS',NULL,NULL,NULL,'2026-04-01 15:29:17','2026-04-01 15:29:17','student','active',NULL),(68,'Efren Manansala','Efren','Manansala','manansala.efren@dnsc.ic.ph',NULL,'$2y$12$Riy4cHEWjPHq2a.dqQEtr.hfWBjrgS59rGjscBM/UInhDiseKH5H.',NULL,NULL,NULL,'2026-04-01 15:29:18','2026-04-01 15:29:18','student','active',NULL),(69,'Marites Tolentino','Marites','Tolentino','tolentino.marites@dnsc.ic.ph',NULL,'$2y$12$tLbBevcUDXBpsD1.XZxhm.dcdTgHAGLHWYhkpPrcyKpsDMDe1B602',NULL,NULL,NULL,'2026-04-01 15:29:18','2026-04-01 15:29:18','student','active',NULL),(70,'Roberto Alcasid','Roberto','Alcasid','alcasid.roberto@dnsc.ic.ph',NULL,'$2y$12$rJuCECWErhB1MG50VkVT2ue7pNxzNgZq9/hVYXNWA2V/RZzSPg.Iy',NULL,NULL,NULL,'2026-04-01 15:29:19','2026-04-01 15:29:19','student','active',NULL),(71,'Leonora Magbanua','Leonora','Magbanua','magbanua.leonora@dnsc.ic.ph',NULL,'$2y$12$Qb68cYPom/d08GF0UpkUYuWwTYmMKYQZTebjkG7G0l63v83abrGn.',NULL,NULL,NULL,'2026-04-01 15:29:19','2026-04-01 15:29:19','student','active',NULL),(72,'Gardo Versoza','Gardo','Versoza','versoza.gardo@dnsc.ic.ph',NULL,'$2y$12$b5UZaz5O0V6pt6ItCcycgeI3YP/uiMwkZAOpQVCLCxie3HKvKObx2',NULL,NULL,NULL,'2026-04-01 15:29:20','2026-04-01 15:29:20','student','active',NULL),(73,'Vilma Santos','Vilma','Santos','santos.vilma@dnsc.ic.ph',NULL,'$2y$12$LXhRqN23DvcWdM/Lwmk./O8LB9246/zQtXswOGdu8cM8tKdeybhbC',NULL,NULL,NULL,'2026-04-01 15:29:20','2026-04-01 15:29:20','student','active',NULL),(74,'Nora Aunor','Nora','Aunor','aunor.nora@dnsc.ic.ph',NULL,'$2y$12$0WTP7m8lyzlwfdqhfGEg4eHJihQzWLaOnLWQ.PvkDXUq612d.fUa.',NULL,NULL,NULL,'2026-04-01 15:29:21','2026-04-01 15:29:21','student','active',NULL),(75,'Christopher De Leon','Christopher','De Leon','deleon.christopher@dnsc.ic.ph',NULL,'$2y$12$0k1dfU5pLtUMQKrWwaDgo.T8yoEJ4hBXHq4KZ4ND4kEGhS5.xr0CC',NULL,NULL,NULL,'2026-04-01 15:29:22','2026-04-01 15:29:22','student','active',NULL),(76,'Sharon Cuneta','Sharon','Cuneta','cuneta.sharon@dnsc.ic.ph',NULL,'$2y$12$OrqfB95E2tSJPlzkT7ypUeqIed9wFkw4DByAoL3o/P0o9FsvvH76u',NULL,NULL,NULL,'2026-04-01 15:29:22','2026-04-01 15:29:22','student','active',NULL),(77,'Judy Ann Santos','Judy Ann','Santos','santos.judyann@dnsc.ic.ph',NULL,'$2y$12$HDnJvLboBeI2aWGokWmtWO1fQuHcgU.ClZLr0G5oUUvUTkO5LiR0C',NULL,NULL,NULL,'2026-04-01 15:29:22','2026-04-01 15:29:22','student','active',NULL),(78,'Piolo Pascual','Piolo','Pascual','pascual.piolo@dnsc.ic.ph',NULL,'$2y$12$VguXSe2XBQp8ShZ1uUwNcuD10GimjNJL8w035OINgOjFVZY9HTGP.',NULL,NULL,NULL,'2026-04-01 15:29:23','2026-04-01 15:29:23','student','active',NULL),(79,'Angel Locsin','Angel','Locsin','locsin.angel@dnsc.ic.ph',NULL,'$2y$12$e0lUKkj6/INw8jxEKPonEO9rRPhu/4OvIrKsHMMV5sUh6bocZ6IZ2',NULL,NULL,NULL,'2026-04-01 15:29:23','2026-04-01 15:29:23','student','active',NULL),(80,'Marian Rivera','Marian','Rivera','rivera.marian@dnsc.ic.ph',NULL,'$2y$12$4ZicLYRcTHu7zFpeL.fNl.41pf9Tyb5RQ3zVT4f8YSfxz0HLEY8rG',NULL,NULL,NULL,'2026-04-01 15:29:23','2026-04-01 15:29:23','student','active',NULL),(81,'Coco Martin','Coco','Martin','martin.coco@dnsc.ic.ph',NULL,'$2y$12$6OiXK.lrHbSAgiwTFFHcWukh7k8EFC6m1hhdV8N5OOP/gAaBjTB16',NULL,NULL,NULL,'2026-04-01 15:29:24','2026-04-01 15:29:24','student','active',NULL),(82,'Vice Ganda','Vice','Ganda','ganda.vice@dnsc.ic.ph',NULL,'$2y$12$/JV9Qu/jp93lVPjwnKthv.H7a2A2qFho7Dhm.Tou3zhTNA.yhqFES',NULL,NULL,NULL,'2026-04-01 15:29:24','2026-04-01 15:29:24','student','active',NULL),(83,'Anne Curtis','Anne','Curtis','curtis.anne@dnsc.ic.ph',NULL,'$2y$12$dTx.KKFg0IllU.V.07.XrOBXdjXPG/Auzan1xCZbpYRc3i5sO29wS',NULL,NULL,NULL,'2026-04-01 15:29:25','2026-04-01 15:29:25','student','active',NULL),(84,'Sarah Geronimo','Sarah','Geronimo','geronimo.sarah@dnsc.ic.ph',NULL,'$2y$12$wCJxClJ0Dym9zxn/2Qs5ue1AAhQghHL6iaAs46jMSNFTFau.1XQeO',NULL,NULL,NULL,'2026-04-01 15:29:25','2026-04-01 15:29:25','student','active',NULL),(85,'Kathryn Bernardo','Kathryn','Bernardo','bernardo.kathryn@dnsc.ic.ph',NULL,'$2y$12$G6am1Grlo1a/chcI3uhQP.PQcWp4Sys2kPPSJMa3WjlZLp.8opQES',NULL,NULL,NULL,'2026-04-01 15:29:25','2026-04-01 15:29:25','student','active',NULL),(86,'Daniel Padilla','Daniel','Padilla','padilla.daniel@dnsc.ic.ph',NULL,'$2y$12$KdgcOfFxvLrpg5ArKQ1MCuBxFIrBpmYEpimc0a5LQaMaofINO/OWi',NULL,NULL,NULL,'2026-04-01 15:29:26','2026-04-01 15:29:26','student','active',NULL),(87,'Alden Richards','Alden','Richards','richards.alden@dnsc.ic.ph',NULL,'$2y$12$v.M2TCcwBeY8p2etJ9ZMPuR.BdZbIAZGDtrBhLioN5nHkTIPlkfoq',NULL,NULL,NULL,'2026-04-01 15:29:26','2026-04-01 15:29:26','student','active',NULL),(88,'Maine Mendoza','Maine','Mendoza','mendoza.maine@dnsc.ic.ph',NULL,'$2y$12$EllndGzfwx92F5dmryKatO9RGyzbXYGK14s2yeI1zNmByG/1PnFya',NULL,NULL,NULL,'2026-04-01 15:29:27','2026-04-01 15:29:27','student','active',NULL),(89,'James Reid','James','Reid','reid.james@dnsc.ic.ph',NULL,'$2y$12$f5QQng8dQlAgDcOD2ySy4.OhFDXD.f7SVOli4YhH0HF5x.ETdQPeK',NULL,NULL,NULL,'2026-04-01 15:29:27','2026-04-01 15:29:27','student','active',NULL),(90,'Nadine Lustre','Nadine','Lustre','lustre.nadine@dnsc.ic.ph',NULL,'$2y$12$zmfi8hoQz.h76ityfUNENuaaPkOBka937FW07EECt9YsMaHAIRdX.',NULL,NULL,NULL,'2026-04-01 15:29:27','2026-04-01 15:29:27','student','active',NULL),(91,'Enrique Gil','Enrique','Gil','gil.enrique@dnsc.ic.ph',NULL,'$2y$12$yVn3JZpNuE48WH.3EIOSxuqOcH3aL0UXYMa1n3LwMJPLSl2colcjq',NULL,NULL,NULL,'2026-04-01 15:29:28','2026-04-01 15:29:28','student','active',NULL),(92,'Liza Soberano','Liza','Soberano','soberano.liza@dnsc.ic.ph',NULL,'$2y$12$F4hnX1/Mp9gZctXiXaDm0OVJA6XITRv2HrDlmKBrvYeT7QEgyPOWy',NULL,NULL,NULL,'2026-04-01 15:29:28','2026-04-01 15:29:28','student','active',NULL),(93,'Gerald Anderson','Gerald','Anderson','anderson.gerald@dnsc.ic.ph',NULL,'$2y$12$h3SOQ0zUamoU9gzDHJMEVeDpyr4DFUQ8pikdyIP6xW1XvDei5HYGy',NULL,NULL,NULL,'2026-04-01 15:29:29','2026-04-01 15:29:29','student','active',NULL),(94,'Julia Barretto','Julia','Barretto','barretto.julia@dnsc.ic.ph',NULL,'$2y$12$zp.F/j0FnnhwD2jC.LMCIOytd088GmOV9zuVQe7DTYsP3YQhKGjxC',NULL,NULL,NULL,'2026-04-01 15:29:29','2026-04-01 15:29:29','student','active',NULL),(95,'Joshua Garcia','Joshua','Garcia','garcia.joshua@dnsc.ic.ph',NULL,'$2y$12$InCzgNzxUo3nq3JE2ynmAuz3G5lp22bYc6NLcKyEMhH20sySWoDze',NULL,NULL,NULL,'2026-04-01 15:29:30','2026-04-01 15:29:30','student','active',NULL),(96,'Bea Alonzo','Bea','Alonzo','alonzo.bea@dnsc.ic.ph',NULL,'$2y$12$ZV4sqrADtn5SHvhIIfiowevBj3IxbKT3B8.BSzAjFLxDjF/2DvGCy',NULL,NULL,NULL,'2026-04-01 15:29:30','2026-04-01 15:29:30','student','active',NULL),(97,'John Lloyd Cruz','John Lloyd','Cruz','cruz.johnlloyd@dnsc.ic.ph',NULL,'$2y$12$sm.WhmZrCJQO48WJ8fL6PetdKnpMgu1qlNL26AwDvYCAMQQzK4uIW',NULL,NULL,NULL,'2026-04-01 15:29:31','2026-04-01 15:29:31','student','active',NULL),(98,'Angelica Panganiban','Angelica','Panganiban','panganiban.angelica@dnsc.ic.ph',NULL,'$2y$12$vNSLpDxqexY2xo9.VliWDOp57pfOxwWqQD/zJ6ARdHW1PF6dSJGDe',NULL,NULL,NULL,'2026-04-01 15:29:31','2026-04-01 15:29:31','student','active',NULL),(99,'Derek Ramsay','Derek','Ramsay','ramsay.derek@dnsc.ic.ph',NULL,'$2y$12$DQbryxUqRnJKBxE3GJi6G.2g.sP77TEKAiYl9i9Y4xvPfB9L9GE9.',NULL,NULL,NULL,'2026-04-01 15:29:32','2026-04-01 15:29:32','student','active',NULL),(100,'Solenn Heussaff','Solenn','Heussaff','heussaff.solenn@dnsc.ic.ph',NULL,'$2y$12$8w6mykCeW4mG5IGXpIqC3ObbmUoleE03b6bk2l3vEMiWrc9windFW',NULL,NULL,NULL,'2026-04-01 15:29:32','2026-04-01 15:29:32','student','active',NULL),(101,'Isabelle Daza','Isabelle','Daza','daza.isabelle@dnsc.ic.ph',NULL,'$2y$12$6RPaVpYawziTxcfIC8kI5.F5rIDnNiwKLSzQ6Y.Wc4qfISJVNNW5C',NULL,NULL,NULL,'2026-04-01 15:29:32','2026-04-01 15:29:32','student','active',NULL),(102,'Georgina Wilson','Georgina','Wilson','wilson.georgina@dnsc.ic.ph',NULL,'$2y$12$p9J6COs0tiGNsEiKZ1MYWON3ZndsPddXkOQf0vKG/escZhxQCu5J.',NULL,NULL,NULL,'2026-04-01 15:29:33','2026-04-01 15:29:33','student','active',NULL),(103,'Erwan Heussaff','Erwan','Heussaff','heussaff.erwan@dnsc.ic.ph',NULL,'$2y$12$L/yV8E4gQBYQj0Ur0IX2K.ZwkUrUm2Dr3FlMd/SvLx9vAfc04LC9q',NULL,NULL,NULL,'2026-04-01 15:29:33','2026-04-01 15:29:33','student','active',NULL),(104,'Nico Bolzico','Nico','Bolzico','bolzico.nico@dnsc.ic.ph',NULL,'$2y$12$xHz6b9VABpwMx3RZ8ac7x.6yxz5aAOuS5oEBKgtN1p0mmasNlo2pm',NULL,NULL,NULL,'2026-04-01 15:29:34','2026-04-01 15:29:34','student','active',NULL),(105,'Scarlet Belo','Scarlet','Belo','belo.scarlet@dnsc.ic.ph',NULL,'$2y$12$IfbYiuCV5imzmwxt8Zq3ZO7oaExtGmFO7TFZdZR0vvkTHDnFYt/U.',NULL,NULL,NULL,'2026-04-01 15:29:34','2026-04-01 15:29:34','student','active',NULL),(106,'Vicki Belo','Vicki','Belo','belo.vicki@dnsc.ic.ph',NULL,'$2y$12$f4AFC151k1tGiAteHbMH0OgXgWjEzlmv/mE43HI.tZGjl7lDMKrVi',NULL,NULL,NULL,'2026-04-01 15:29:35','2026-04-01 15:29:35','student','active',NULL),(107,'Hayden Kho','Hayden','Kho','kho.hayden@dnsc.ic.ph',NULL,'$2y$12$pyDtJC.UpbftjTSnPzqsr.JkqJZTgIS8mDqyBcGZGBcm3qzEZ4o92',NULL,NULL,NULL,'2026-04-01 15:29:35','2026-04-01 15:29:35','student','active',NULL),(108,'Korina Sanchez','Korina','Sanchez','sanchez.korina@dnsc.ic.ph',NULL,'$2y$12$RK.BEvqGRSX1ILIUv6vz3eyPE5ytS5oFl9ddg9QnHUAs4ENs2cOqO',NULL,NULL,NULL,'2026-04-01 15:29:36','2026-04-01 15:29:36','student','active',NULL),(109,'Mar Roxas','Mar','Roxas','roxas.mar@dnsc.ic.ph',NULL,'$2y$12$XZTtnvIpicpWk4UCTr9aPe5RMpm4MsAaXc88K49.mFkoZcQjNC9Ae',NULL,NULL,NULL,'2026-04-01 15:29:36','2026-04-01 15:29:36','student','active',NULL),(110,'Grace Poe','Grace','Poe','poe.grace@dnsc.ic.ph',NULL,'$2y$12$Gz8BkoahpBK3fPbtScl82uh3KZ2CKwoVf6ipOqMWmFXdco4na1iGq',NULL,NULL,NULL,'2026-04-01 15:29:37','2026-04-01 15:29:37','student','active',NULL),(111,'Chiz Escudero','Chiz','Escudero','escudero.chiz@dnsc.ic.ph',NULL,'$2y$12$tu2jo88KWDC5rMAE2D.HPOS/No3OtC3Vf0ZKkJGlWlT03/Alt7yui',NULL,NULL,NULL,'2026-04-01 15:29:37','2026-04-01 15:29:37','student','active',NULL),(112,'Heart Evangelista','Heart','Evangelista','evangelista.heart@dnsc.ic.ph',NULL,'$2y$12$0Z8O38jlNXdXWyjb2LjftujoHfZWZuhVhB.vOtxE3lflDkr8TerN6',NULL,NULL,NULL,'2026-04-01 15:29:38','2026-04-01 15:29:38','student','active',NULL),(113,'Manny Pacquiao','Manny','Pacquiao','pacquiao.manny@dnsc.ic.ph',NULL,'$2y$12$F9fosuwZYyydneYA/wES3OOBzQPJRwUoT628Ym0FUarhKmxFtmQi6',NULL,NULL,NULL,'2026-04-01 15:29:38','2026-04-01 15:29:38','student','active',NULL),(114,'Jinkee Pacquiao','Jinkee','Pacquiao','pacquiao.jinkee@dnsc.ic.ph',NULL,'$2y$12$5PnCvGJY5DlPcI6fIbL4iuhqxBgMVVpncQurFyONadQi5rokSjlia',NULL,NULL,NULL,'2026-04-01 15:29:38','2026-04-01 15:29:38','student','active',NULL),(115,'Lea Salonga','Lea','Salonga','salonga.lea@dnsc.ic.ph',NULL,'$2y$12$anGWsgo9m6MyPkJEwUOPcOIn7amajxnUBB889WI38aHRMf0oQmky6',NULL,NULL,NULL,'2026-04-01 15:29:39','2026-04-01 15:29:39','student','active',NULL),(116,'Charice Pempengco','Charice','Pempengco','pempengco.charice@dnsc.ic.ph',NULL,'$2y$12$4kc7LazFyFi4q4MskHKOmOx6LMQJal7Sjg5Emoxi1igwU15HjCwb.',NULL,NULL,NULL,'2026-04-01 15:29:39','2026-04-01 15:29:39','student','active',NULL),(117,'Arnel Pineda','Arnel','Pineda','pineda.arnel@dnsc.ic.ph',NULL,'$2y$12$w25gQsgrN0VLpux7ufLoU.sCG3tIf1TaLDAzeoA/m52J/anL3/VRK',NULL,NULL,NULL,'2026-04-01 15:29:40','2026-04-01 15:29:40','student','active',NULL),(118,'Gary Valenciano','Gary','Valenciano','valenciano.gary@dnsc.ic.ph',NULL,'$2y$12$qgoPNAV3gGpdNtbaS2WZ8.2P/CJ5l7ENnKTPLTW8VKoD0TIKWJ/Le',NULL,NULL,NULL,'2026-04-01 15:29:40','2026-04-01 15:29:40','student','active',NULL),(119,'Martin Nievera','Martin','Nievera','nievera.martin@dnsc.ic.ph',NULL,'$2y$12$bWTlgCpOJuelZq2JSLMAEu/VaohTFtxPCJAiekW9DM5uUKN8eskRO',NULL,NULL,NULL,'2026-04-01 15:29:40','2026-04-01 15:29:40','student','active',NULL),(120,'Regine Velasquez','Regine','Velasquez','velasquez.regine@dnsc.ic.ph',NULL,'$2y$12$ESZYkIUSLQbGjyvUAGD8Yei6Ro/mq.AWKmTHcyrZc.yjbdVlYJP5y',NULL,NULL,NULL,'2026-04-01 15:29:41','2026-04-01 15:29:41','student','active',NULL),(121,'Ogie Alcasid','Ogie','Alcasid','alcasid.ogie@dnsc.ic.ph',NULL,'$2y$12$8qYOeAAR8IjuluqEVmG12eMghWTrdxkbrbnnLgRbAydl9BjOg99LC',NULL,NULL,NULL,'2026-04-01 15:29:41','2026-04-01 15:29:41','student','active',NULL),(122,'Zsa Zsa Padilla','Zsa Zsa','Padilla','padilla.zsazsa@dnsc.ic.ph',NULL,'$2y$12$Cw7qnUDQZwAjRFYonRKTsuu3nFHXPU1J96hybu8fMdONZHeekKhV2',NULL,NULL,NULL,'2026-04-01 15:29:41','2026-04-01 15:29:41','student','active',NULL),(123,'Kuh Ledesma','Kuh','Ledesma','ledesma.kuh@dnsc.ic.ph',NULL,'$2y$12$v2qEMyFcVhSc9x2KiUFqqeEjz8FsPyjK9kiz.FMeifHxO2a0HHhQ6',NULL,NULL,NULL,'2026-04-01 15:29:42','2026-04-01 15:29:42','student','active',NULL),(124,'Jaya Ramsey','Jaya','Ramsey','ramsey.jaya@dnsc.ic.ph',NULL,'$2y$12$iMzc2YGY7wp.sW9cL3zH3e5T.Ub5QtN6DCEL.WS6ng2GUtbGr/SBa',NULL,NULL,NULL,'2026-04-01 15:29:42','2026-04-01 15:29:42','student','active',NULL),(125,'Janno Gibbs','Janno','Gibbs','gibbs.janno@dnsc.ic.ph',NULL,'$2y$12$vzhu5roZeDF3yruO2xuu8er7sQq5HNbxWUdsIQbaptISqQ7MVkM86',NULL,NULL,NULL,'2026-04-01 15:29:43','2026-04-01 15:29:43','student','active',NULL),(126,'Bing Loyzaga','Bing','Loyzaga','loyzaga.bing@dnsc.ic.ph',NULL,'$2y$12$3oA4HDL.l7W8cd/qK2qq8Oz7DEv14rdH3c15Ll8O0JYrp3pd//2WS',NULL,NULL,NULL,'2026-04-01 15:29:43','2026-04-01 15:29:43','student','active',NULL),(127,'Vic Sotto','Vic','Sotto','sotto.vic@dnsc.ic.ph',NULL,'$2y$12$Ii/UpEjMh1w0Ucm8C4049uXr.vXMUMJ.2RPfoKN2BnG6zejGNprUK',NULL,NULL,NULL,'2026-04-01 15:29:43','2026-04-01 15:29:43','student','active',NULL),(128,'Pauleen Luna','Pauleen','Luna','luna.pauleen@dnsc.ic.ph',NULL,'$2y$12$0DknTciq.Esd2.WZJkoJhu9e49BtYZvJBmIbKfWbUKjhtr.9ulGt.',NULL,NULL,NULL,'2026-04-01 15:29:44','2026-04-01 15:29:44','student','active',NULL),(129,'Joey de Leon','Joey','de Leon','deleon.joey@dnsc.ic.ph',NULL,'$2y$12$wa3DjXt1szJBbvImVY4J3OszO/jegroRvvm11zfpyzFqYTIUS2vui',NULL,NULL,NULL,'2026-04-01 15:29:44','2026-04-01 15:29:44','student','active',NULL),(130,'Tito Sotto','Tito','Sotto','sotto.tito@dnsc.ic.ph',NULL,'$2y$12$IF0AkkaZREHnHdFAARIcuu7tYrjtaAyNMbj1ebvRKXEDRCxMnJAbS',NULL,NULL,NULL,'2026-04-01 15:29:44','2026-04-01 15:29:44','student','active',NULL),(131,'Helen Gamboa','Helen','Gamboa','gamboa.helen@dnsc.ic.ph',NULL,'$2y$12$ssz894HTkKA.CGc10UcukOjwhKecs.8l8wRQFt4GGk0T2Gg6sGI5S',NULL,NULL,NULL,'2026-04-01 15:29:44','2026-04-01 15:29:44','student','active',NULL),(132,'Coney Reyes','Coney','Reyes','reyes.coney@dnsc.ic.ph',NULL,'$2y$12$0FrE7FdtqcT80..R8Ykiw.Xk59kxQiAVbFcaCfjd3aScDr0cegNfa',NULL,NULL,NULL,'2026-04-01 15:29:45','2026-04-01 15:29:45','student','active',NULL),(133,'Ai-Ai delas Alas','Ai-Ai','delas Alas','delasalas.aiai@dnsc.ic.ph',NULL,'$2y$12$uo3ZC1lFtPCFmUf4.e5sRu94lW1UQLaaysonKxEMZ1H8OSRnAHyEW',NULL,NULL,NULL,'2026-04-01 15:29:45','2026-04-01 15:29:45','student','active',NULL),(134,'Eugene Domingo','Eugene','Domingo','domingo.eugene@dnsc.ic.ph',NULL,'$2y$12$NCTRz2XEX.QscauU03eJS.4WfbAWStxw.D2UA4jnGx6qhHLhv8jGe',NULL,NULL,NULL,'2026-04-01 15:29:45','2026-04-01 15:29:45','student','active',NULL),(135,'Pokwang Subong','Pokwang','Subong','subong.pokwang@dnsc.ic.ph',NULL,'$2y$12$pz1toOdrinEHeDW9v.gB3.5pqty8a7s7BLYlAl2KJdJLjMosRLfIi',NULL,NULL,NULL,'2026-04-01 15:29:46','2026-04-01 15:29:46','student','active',NULL),(136,'Wally Bayola','Wally','Bayola','bayola.wally@dnsc.ic.ph',NULL,'$2y$12$Nspq7UDHBdk.kVKoPTDixeN2Mmrz/gyIs5MhgeiihqwNG0dPOFQEi',NULL,NULL,NULL,'2026-04-01 15:29:46','2026-04-01 15:29:46','student','active',NULL),(137,'Jose Manalo','Jose','Manalo','manalo.jose@dnsc.ic.ph',NULL,'$2y$12$ArAuMqr4mQtw8NG6dMVYj.NclvtnCRtUQuBc/BrwpZUKzifHdBIxm',NULL,NULL,NULL,'2026-04-01 15:29:46','2026-04-01 15:29:46','student','active',NULL),(138,'Paolo Ballesteros','Paolo','Ballesteros','ballesteros.paolo@dnsc.ic.ph',NULL,'$2y$12$OHpFFhaNLThGi7aGXaGCHecAOdEhUUJqBHMIF0ZNwyNBM9cNjb7Yq',NULL,NULL,NULL,'2026-04-01 15:29:47','2026-04-01 15:29:47','student','active',NULL),(139,'Ryan Agoncillo','Ryan','Agoncillo','agoncillo.ryan@dnsc.ic.ph',NULL,'$2y$12$qRam0glvePLJxodvOSsaIuOGG5n4zdDpN.wUhm7zXnz2jDQ6U5GLS',NULL,NULL,NULL,'2026-04-01 15:29:47','2026-04-01 15:29:47','student','active',NULL),(140,'Gladys Reyes','Gladys','Reyes','reyes.gladys@dnsc.ic.ph',NULL,'$2y$12$bixHA/ViDbcGNx/zxssLWemx10L8kNkqZBlX1XbPtF81mwiW6F/Ye',NULL,NULL,NULL,'2026-04-01 15:29:47','2026-04-01 15:29:47','student','active',NULL),(141,'Claudine Barretto','Claudine','Barretto','barretto.claudine@dnsc.ic.ph',NULL,'$2y$12$rn3fUcJSIzUDq/lDbGwdE.qYF1VmMpA3JBTvMSr9G27S7kq16aO.a',NULL,NULL,NULL,'2026-04-01 15:29:48','2026-04-01 15:29:48','student','active',NULL),(142,'Rico Yan','Rico','Yan','yan.rico@dnsc.ic.ph',NULL,'$2y$12$g1MXLDTeraK44L1SXkGgSOFSKOHd2c/iC3hqxij9nsHdzgxnjbfTO',NULL,NULL,NULL,'2026-04-01 15:29:48','2026-04-01 15:29:48','student','active',NULL),(143,'Marvin Agustin','Marvin','Agustin','agustin.marvin@dnsc.ic.ph',NULL,'$2y$12$VkI10wtP8bHB2wJlILwWoeG5ocOR90vp5Z0MA2K5iQEf6SCzbbp.O',NULL,NULL,NULL,'2026-04-01 15:29:48','2026-04-01 15:29:48','student','active',NULL),(144,'Jolina Magdangal','Jolina','Magdangal','magdangal.jolina@dnsc.ic.ph',NULL,'$2y$12$imp.j7QDGjR0wRdBkrJE7OYhOgd.xz4tC5UTqFok/PpyDrdEA.HEu',NULL,NULL,NULL,'2026-04-01 15:29:49','2026-04-01 15:29:49','student','active',NULL),(145,'Diether Ocampo','Diether','Ocampo','ocampo.diether@dnsc.ic.ph',NULL,'$2y$12$9W4tRl1u4jfWjtFpNX1DlenOkLBUNiwq3CqILKMmvREKxl6bbJ4Eu',NULL,NULL,NULL,'2026-04-01 15:29:49','2026-04-01 15:29:49','student','active',NULL),(146,'Jericho Rosales','Jericho','Rosales','rosales.jericho@dnsc.ic.ph',NULL,'$2y$12$ICtQbPlzsVFhIHCjQ3dqJOqM.pi8.Qx3.RBdkCuDeHn.PpA9OlCJG',NULL,NULL,NULL,'2026-04-01 15:29:49','2026-04-01 15:29:49','student','active',NULL),(147,'Kristine Hermosa','Kristine','Hermosa','hermosa.kristine@dnsc.ic.ph',NULL,'$2y$12$pvuWQcGrH8VEDDpKlLC8WeGTghyuuxkiVGOKqZPnDPwzVnadSjuCy',NULL,NULL,NULL,'2026-04-01 15:29:50','2026-04-01 15:29:50','student','active',NULL),(148,'Echo Rosales','Echo','Rosales','rosales.echo@dnsc.ic.ph',NULL,'$2y$12$YIk5Sk7eQ2KD6r02nyMR3OqI5CTy3XRl8R2EBslqcPYK3SyuVD.pe',NULL,NULL,NULL,'2026-04-01 15:29:50','2026-04-01 15:29:50','student','active',NULL),(149,'Sid Lucero','Sid','Lucero','lucero.sid@dnsc.ic.ph',NULL,'$2y$12$EWvC3q7kUjpXSCsFBkQl/uPJ1oUnHl5smH2.RGfUpdP.7VuSU.Z72',NULL,NULL,NULL,'2026-04-01 15:29:50','2026-04-01 15:29:50','student','active',NULL),(150,'Baron Geisler','Baron','Geisler','geisler.baron@dnsc.ic.ph',NULL,'$2y$12$PwPHAPbQO4FdNDgJHYQZsuz78xydbkvjvidc5CurSTRH/4S5o8T8u',NULL,NULL,NULL,'2026-04-01 15:29:51','2026-04-01 15:29:51','student','active',NULL),(151,'John Prats','John','Prats','prats.john@dnsc.ic.ph',NULL,'$2y$12$VGi5jCOFXV6Pg57JMgBLG.uhiaqi8o.HowOr046czw8Ouxktsbpeq',NULL,NULL,NULL,'2026-04-01 15:29:51','2026-04-01 15:29:51','student','active',NULL),(152,'Camille Prats','Camille','Prats','prats.camille@dnsc.ic.ph',NULL,'$2y$12$QwP9sX2uK/Sfp1rJS4ib8eDNf3N/T8snW0vkaMw26ByyHcmCyzFyW',NULL,NULL,NULL,'2026-04-01 15:29:51','2026-04-01 15:29:51','student','active',NULL),(153,'Shaina Magdayao','Shaina','Magdayao','magdayao.shaina@dnsc.ic.ph',NULL,'$2y$12$w8CfW7UvDRGWprRRI0W76OTiBtSdNQtUJ9uRlOVFPl7vwlUIrR/ny',NULL,NULL,NULL,'2026-04-01 15:29:52','2026-04-01 15:29:52','student','active',NULL),(154,'Vina Morales','Vina','Morales','morales.vina@dnsc.ic.ph',NULL,'$2y$12$XR4takzRJSYvTnxvu8R6PObkTjJ52X/CQkEUYH1aHADuD/Aan2sz2',NULL,NULL,NULL,'2026-04-01 15:29:52','2026-04-01 15:29:52','student','active',NULL),(155,'Sunshine Cruz','Sunshine','Cruz','cruz.sunshine@dnsc.ic.ph',NULL,'$2y$12$cnHWENtThfC3nSDu9c9G4OrCs7jp0m0b2ut/u99Xl3GJGHooEDA7G',NULL,NULL,NULL,'2026-04-01 15:29:52','2026-04-01 15:29:52','student','active',NULL),(156,'Sheryl Cruz','Sheryl','Cruz','cruz.sheryl@dnsc.ic.ph',NULL,'$2y$12$cKUzOmMOaK7BXzRd0jZFLem56gcqMnaFooMGSYi0R6eZMzeVXBv9K',NULL,NULL,NULL,'2026-04-01 15:29:53','2026-04-01 15:29:53','student','active',NULL),(157,'Donna Cruz','Donna','Cruz','cruz.donna@dnsc.ic.ph',NULL,'$2y$12$te.RhvkOajzV/CQEoxB5jOlRmLd34acIOZvS91h5Kj/FrzVCtyN.u',NULL,NULL,NULL,'2026-04-01 15:29:53','2026-04-01 15:29:53','student','active',NULL),(158,'Tirso Cruz','Tirso','Cruz','cruz.tirso@dnsc.ic.ph',NULL,'$2y$12$Cf7ZJtefNuJICcH81Sg5MubDllgMiA0x3GNHY3QbBPR3APsVJnODu',NULL,NULL,NULL,'2026-04-01 15:29:53','2026-04-01 15:29:53','student','active',NULL),(159,'Pip Cruz','Pip','Cruz','cruz.pip@dnsc.ic.ph',NULL,'$2y$12$6MTa8DeVwdOoGBLxA9GGsOAC97koLNOXLYvi2FTkMbc.u.vBW52cS',NULL,NULL,NULL,'2026-04-01 15:29:54','2026-04-01 15:29:54','student','active',NULL),(160,'Edu Manzano','Edu','Manzano','manzano.edu@dnsc.ic.ph',NULL,'$2y$12$oYJYN4hZjZ2nJTJXib/V/euvTXr/SD9/vpMg6u7kQmEAhLYL9zhsa',NULL,NULL,NULL,'2026-04-01 15:29:54','2026-04-01 15:29:54','student','active',NULL),(161,'Lucky Manzano','Lucky','Manzano','manzano.lucky@dnsc.ic.ph',NULL,'$2y$12$U0khTIOydtQaOhtvbeJMKuKLDcAAhxmEx9OFweXgxsrbGT5MrpeJC',NULL,NULL,NULL,'2026-04-01 15:29:54','2026-04-01 15:29:54','student','active',NULL),(162,'Luis Manzano','Luis','Manzano','manzano.luis@dnsc.ic.ph',NULL,'$2y$12$iKB.VLHWMpncZTT0iCM09.rO1BS1lDZIBcuR4UqJKXQxTNEkPDNGC',NULL,NULL,NULL,'2026-04-01 15:29:55','2026-04-01 15:29:55','student','active',NULL),(163,'Jessy Mendiola','Jessy','Mendiola','mendiola.jessy@dnsc.ic.ph',NULL,'$2y$12$rLp.5L339ulQeYzct7PtBu/idiuQwLUddqNARaAwIapUcEvkNi6gW',NULL,NULL,NULL,'2026-04-01 15:29:55','2026-04-01 15:29:55','student','active',NULL),(164,'Neil Arce','Neil','Arce','arce.neil@dnsc.ic.ph',NULL,'$2y$12$5e1REBp./1NA3GwzWZPv/OBHyEypsU2vPWUhdZEFlSf9AHWC5w2c6',NULL,NULL,NULL,'2026-04-01 15:29:55','2026-04-01 15:29:55','student','active',NULL),(165,'Zia Dantes','Zia','Dantes','dantes.zia@dnsc.ic.ph',NULL,'$2y$12$yDNubkjCv5A4EJRbe4t8jeFnmhyYIbKtvyQ4ilgzQTHOb8BDBzCL.',NULL,NULL,NULL,'2026-04-01 15:29:56','2026-04-01 15:29:56','student','active',NULL),(166,'Sixto Dantes','Sixto','Dantes','dantes.sixto@dnsc.ic.ph',NULL,'$2y$12$PJgZ671VTVCdunm4r7UxnuK3rY38hWQ0AKoakd.nB.XIfao8eoDV2',NULL,NULL,NULL,'2026-04-01 15:29:56','2026-04-01 15:29:56','student','active',NULL),(167,'Richard Gomez','Richard','Gomez','gomez.richard@dnsc.ic.ph',NULL,'$2y$12$bBYgEu5UcT.zbDBp7WtZzuamAjpp6S0HWfOXIpspIdp/ZIgZSOc1K',NULL,NULL,NULL,'2026-04-01 15:29:56','2026-04-01 15:29:56','student','active',NULL),(168,'Lucy Torres','Lucy','Torres','torres.lucy@dnsc.ic.ph',NULL,'$2y$12$M2oTVgSXyO8ENO/s9ZrPSeHhRBmFyMzlzmNRH96mqGDinLsL68F9y',NULL,NULL,NULL,'2026-04-01 15:29:57','2026-04-01 15:29:57','student','active',NULL),(169,'Juliana Gomez','Juliana','Gomez','gomez.juliana@dnsc.ic.ph',NULL,'$2y$12$4xPuLWlwU9gi1h9OY5GTm.UAjlAPBh.OO.BXwfbVt8sNiUEuio3ei',NULL,NULL,NULL,'2026-04-01 15:29:57','2026-04-01 15:29:57','student','active',NULL),(170,'Aga Muhlach','Aga','Muhlach','muhlach.aga@dnsc.ic.ph',NULL,'$2y$12$X5wE/a3LXZicdHDxWuXprew87zQIlDd1rVTDtn4XwKv0DiDFQokN6',NULL,NULL,NULL,'2026-04-01 15:29:57','2026-04-01 15:29:57','student','active',NULL),(171,'Charlene Gonzalez','Charlene','Gonzalez','gonzalez.charlene@dnsc.ic.ph',NULL,'$2y$12$A4HXyLLpr3KCLVZh7TRAxe.DToTQMrn10rh04ieIyelzP7jIbS5C6',NULL,NULL,NULL,'2026-04-01 15:29:57','2026-04-01 15:29:57','student','active',NULL),(172,'Atascha Muhlach','Atascha','Muhlach','muhlach.atascha@dnsc.ic.ph',NULL,'$2y$12$JlEECnhIuF7zCq5QVcmrMesBcpLNZH0ANetVVZ3dnsCH.fcMnu3xy',NULL,NULL,NULL,'2026-04-01 15:29:58','2026-04-01 15:29:58','student','active',NULL),(173,'Andres Muhlach','Andres','Muhlach','muhlach.andres@dnsc.ic.ph',NULL,'$2y$12$gu8U/vE2Qnfu92p1qZ4Cr.ANms2h3N5hpUgTblepaAYP2iH8uSunK',NULL,NULL,NULL,'2026-04-01 15:29:58','2026-04-01 15:29:58','student','active',NULL),(174,'Robin Padilla','Robin','Padilla','padilla.robin@dnsc.ic.ph',NULL,'$2y$12$nWqzDECtKnBpQkWYoPTZhOTiymnhfyfa4vIARmlpa/sEKFOmMGRcW',NULL,NULL,NULL,'2026-04-01 15:29:58','2026-04-01 15:29:58','student','active',NULL),(175,'Mariel Rodriguez','Mariel','Rodriguez','rodriguez.mariel@dnsc.ic.ph',NULL,'$2y$12$IYgQluJgIETeqUI7COkvU.gqQYGL.GKrkPvG3W6SBUfGx/2h7OIgK',NULL,NULL,NULL,'2026-04-01 15:29:59','2026-04-01 15:29:59','student','active',NULL),(176,'Kylie Padilla','Kylie','Padilla','padilla.kylie@dnsc.ic.ph',NULL,'$2y$12$KfmcjGqWXidAtySPIasPdeqly8PQ862k9sebgnLtiQF2DW97W0HJe',NULL,NULL,NULL,'2026-04-01 15:29:59','2026-04-01 15:29:59','student','active',NULL),(177,'Aljur Abrenica','Aljur','Abrenica','abrenica.aljur@dnsc.ic.ph',NULL,'$2y$12$bP5X1ePjNggu/dwoEFmeI.dkaHzr8CykREmfMaO6uUE.V20jpYbw2',NULL,NULL,NULL,'2026-04-01 15:29:59','2026-04-01 15:29:59','student','active',NULL),(178,'AJ Raval','AJ','Raval','raval.aj@dnsc.ic.ph',NULL,'$2y$12$lIVj72RgNmOFD9ad1LTyTewmYg13EIvhvmm7.ZWUTcLmdOP6YtHvC',NULL,NULL,NULL,'2026-04-01 15:30:00','2026-04-01 15:30:00','student','active',NULL),(179,'Jeric Raval','Jeric','Raval','raval.jeric@dnsc.ic.ph',NULL,'$2y$12$.hUGFJIAclkKtcLSOzI.3eTMzDDSOw/sAbYMpFFXm1dwjPeQUZEJq',NULL,NULL,NULL,'2026-04-01 15:30:00','2026-04-01 15:30:00','student','active',NULL),(180,'Bong Revilla','Bong','Revilla','revilla.bong@dnsc.ic.ph',NULL,'$2y$12$wA/YDivvqi2Wc7BCw.CQiOZobnbhnpXeX8x0LgwWwH.hlV8owGVNG',NULL,NULL,NULL,'2026-04-01 15:30:00','2026-04-01 15:30:00','student','active',NULL),(181,'Lani Mercado','Lani','Mercado','mercado.lani@dnsc.ic.ph',NULL,'$2y$12$M4ZxGihzxU7uAJKDy0iB2.X0Jb5wgHktjZhKTofnPLtd98LaRqjhy',NULL,NULL,NULL,'2026-04-01 15:30:01','2026-04-01 15:30:01','student','active',NULL),(182,'Jolo Revilla','Jolo','Revilla','revilla.jolo@dnsc.ic.ph',NULL,'$2y$12$JX6ttwaCekAY6eygwHNk6.oyVguUwwJwitwIrRLLdW4AhdKRWULg2',NULL,NULL,NULL,'2026-04-01 15:30:01','2026-04-01 15:30:01','student','active',NULL),(183,'Bryan Revilla','Bryan','Revilla','revilla.bryan@dnsc.ic.ph',NULL,'$2y$12$trxz9M1hNb.pxInwKQbbPOgwpT0Rz5u4emfwOCl2qIlV7f1FiR8rK',NULL,NULL,NULL,'2026-04-01 15:30:01','2026-04-01 15:30:01','student','active',NULL),(184,'Jinggoy Estrada','Jinggoy','Estrada','estrada.jinggoy@dnsc.ic.ph',NULL,'$2y$12$OVxoMOVaD/31F1Y6Oz1Ua.9/RLHuBj5RhU5aBa/7E7qQ7Xva7RYe.',NULL,NULL,NULL,'2026-04-01 15:30:02','2026-04-01 15:30:02','student','active',NULL),(185,'Precy Ejercito','Precy','Ejercito','ejercito.precy@dnsc.ic.ph',NULL,'$2y$12$I19xTXSqIB8nuVt9CxFOI.NTqBH9sgZzcMByjtvtJzTuTuT/nbG3i',NULL,NULL,NULL,'2026-04-01 15:30:02','2026-04-01 15:30:02','student','active',NULL),(186,'Janella Estrada','Janella','Estrada','estrada.janella@dnsc.ic.ph',NULL,'$2y$12$ZQYy0FN1Vc6XVd2bV8Iq4u14ZdywnB8W7x8kWLA5fZvkEKfAcz4x6',NULL,NULL,NULL,'2026-04-01 15:30:02','2026-04-01 15:30:02','student','active',NULL),(187,'Joseph Estrada','Joseph','Estrada','estrada.joseph@dnsc.ic.ph',NULL,'$2y$12$218hIGk5IXYoy4KJVdJuvOOhrWfgPhQJQTGpPs52GyXhCQorLJuNe',NULL,NULL,NULL,'2026-04-01 15:30:03','2026-04-01 15:30:03','student','active',NULL),(188,'Loi Ejercito','Loi','Ejercito','ejercito.loi@dnsc.ic.ph',NULL,'$2y$12$a81ZAzh2phDAuIUlbAuhE.WtV5XaLTFKRsq2nHmuBA4/k0S.osxfS',NULL,NULL,NULL,'2026-04-01 15:30:03','2026-04-01 15:30:03','student','active',NULL),(189,'JV Ejercito','JV','Ejercito','ejercito.jv@dnsc.ic.ph',NULL,'$2y$12$.lmH/qv0RmLs7o883RWNRu.AUfzmBn82whho11zDALI6THTeeAbmq',NULL,NULL,NULL,'2026-04-01 15:30:03','2026-04-01 15:30:03','student','active',NULL),(190,'Bongbong Marcos','Bongbong','Marcos','marcos.bongbong@dnsc.ic.ph',NULL,'$2y$12$blt1242B84bYW2at25WoaOy9kUI18gE75z5XLz2B1wXQj2AbFxfIK',NULL,NULL,NULL,'2026-04-01 15:30:03','2026-04-01 15:30:03','student','active',NULL),(191,'Liza Araneta','Liza','Araneta','araneta.liza@dnsc.ic.ph',NULL,'$2y$12$OsE9.dFosGslMi.q2fzYyOs2Mp8xSodWZziB8M9Y3ckcELdXAH8Oi',NULL,NULL,NULL,'2026-04-01 15:30:04','2026-04-01 15:30:04','student','active',NULL),(192,'Sandro Marcos','Sandro','Marcos','marcos.sandro@dnsc.ic.ph',NULL,'$2y$12$wFh/8Yv1gDv/ignBwJR6UuG2ydBF66RXD8c/YSVqi3Uxb2vo4cAie',NULL,NULL,NULL,'2026-04-01 15:30:04','2026-04-01 15:30:04','student','active',NULL),(193,'Simon Marcos','Simon','Marcos','marcos.simon@dnsc.ic.ph',NULL,'$2y$12$V2DujBd4B5lZEKzvKmWJE.X.Zpabby0Wrse9D.MbP/wZsI0jWBeoO',NULL,NULL,NULL,'2026-04-01 15:30:04','2026-04-01 15:30:04','student','active',NULL),(194,'Vincent Marcos','Vincent','Marcos','marcos.vincent@dnsc.ic.ph',NULL,'$2y$12$vkz4FB4A.7qmj37Ids03geQuSAMB.xxjsKfmAVUjYNAtnQgCVUKbS',NULL,NULL,NULL,'2026-04-01 15:30:05','2026-04-01 15:30:05','student','active',NULL),(195,'Imee Marcos','Imee','Marcos','marcos.imee@dnsc.ic.ph',NULL,'$2y$12$z7tJyNNHwMYno8qKaFgyCe3p56AlAA4/BJpBTSjjvLlHdNYylTrT6',NULL,NULL,NULL,'2026-04-01 15:30:05','2026-04-01 15:30:05','student','active',NULL),(196,'Borgy Manotoc','Borgy','Manotoc','manotoc.borgy@dnsc.ic.ph',NULL,'$2y$12$nzAbMohSPO28z4Jgk7bdO.SeFKnU4/SpzPtgk8kh4.i79fGi4dhRG',NULL,NULL,NULL,'2026-04-01 15:30:05','2026-04-01 15:30:05','student','active',NULL),(197,'Mikee Arroyo','Mikee','Arroyo','arroyo.mikee@dnsc.ic.ph',NULL,'$2y$12$bLPUuvhWqbvVUosdBljvA.G6GE6ouwq4865BwBWDYN4cJNVyatfpG',NULL,NULL,NULL,'2026-04-01 15:30:06','2026-04-01 15:30:06','student','active',NULL),(198,'Gloria Arroyo','Gloria','Arroyo','arroyo.gloria@dnsc.ic.ph',NULL,'$2y$12$c7mv5Dg/HuzUPHgfEYVCU..q0OrwYNkBMj9Nu7Rb.LasH9ns2CJne',NULL,NULL,NULL,'2026-04-01 15:30:06','2026-04-01 15:30:06','student','active',NULL),(199,'Mikey Arroyo','Mikey','Arroyo','arroyo.mikey@dnsc.ic.ph',NULL,'$2y$12$fnPTx4K/DObEdgZ25j4EROsf9QswaNPe2W9BAwLZZeZYDwwLJNDua',NULL,NULL,NULL,'2026-04-01 15:30:06','2026-04-01 15:30:06','student','active',NULL),(200,'Dato Arroyo','Dato','Arroyo','arroyo.dato@dnsc.ic.ph',NULL,'$2y$12$v4m5q/4BFW29y./tGUbuTer7jvUaAHQbbLw5HhPAA6X.5hfvt2an6',NULL,NULL,NULL,'2026-04-01 15:30:07','2026-04-01 15:30:07','student','active',NULL),(201,'Luli Arroyo','Luli','Arroyo','arroyo.luli@dnsc.ic.ph',NULL,'$2y$12$JkJHsrAMTBSSGdD3nuVDi.jx2zPWANWupvNnUZhgvAo9De2n8RT0u',NULL,NULL,NULL,'2026-04-01 15:30:07','2026-04-01 15:30:07','student','active',NULL),(202,'Fidel Ramos','Fidel','Ramos','ramos.fidel@dnsc.ic.ph',NULL,'$2y$12$6iaXss2A1EyvanY3y.6ILewK04KtqqwYBIOO4/Kbobr9A/Fr9aUnu',NULL,NULL,NULL,'2026-04-01 15:30:07','2026-04-01 15:30:07','student','active',NULL),(203,'Ming Ramos','Ming','Ramos','ramos.ming@dnsc.ic.ph',NULL,'$2y$12$hXM7xIir75faITJiNlHWluU2o3tskHCKouXfyogX1TtMrBNXyWVna',NULL,NULL,NULL,'2026-04-01 15:30:07','2026-04-01 15:30:07','student','active',NULL),(204,'Cory Aquino','Cory','Aquino','aquino.cory@dnsc.ic.ph',NULL,'$2y$12$nONZntYI7yPj7Vw6qXwuueyb1MlTkXj1WwlpOVi.lKrPRyx.isFUm',NULL,NULL,NULL,'2026-04-01 15:30:08','2026-04-01 15:30:08','student','active',NULL),(205,'Ninoy Aquino','Ninoy','Aquino','aquino.ninoy@dnsc.ic.ph',NULL,'$2y$12$QpC9BCGb3fBNEIhfJUm0ee2YTNKsvWv8oYK8wEozO6IO1A1yenSVu',NULL,NULL,NULL,'2026-04-01 15:30:08','2026-04-01 15:30:08','student','active',NULL),(206,'Noynoy Aquino','Noynoy','Aquino','aquino.noynoy@dnsc.ic.ph',NULL,'$2y$12$/rp0KFfKpHbDcArvVHxAgO1Cqz4blLmeyQk1U6MWSVWLSls9WQsze',NULL,NULL,NULL,'2026-04-01 15:30:08','2026-04-01 15:30:08','student','active',NULL),(207,'Kris Aquino','Kris','Aquino','aquino.kris@dnsc.ic.ph',NULL,'$2y$12$NZxs.BHQ7urmh8V9ME7ZwOUXBv8tp.fJYOVu5LqPX.t/mD0ifZ0ma',NULL,NULL,NULL,'2026-04-01 15:30:09','2026-04-01 15:30:09','student','active',NULL),(208,'Bimby Aquino','Bimby','Aquino','aquino.bimby@dnsc.ic.ph',NULL,'$2y$12$tkhSyeaNYxlNAEE77IZHGu2fd0HxwNC6tHBY1yk32T4l7vLWrfaAy',NULL,NULL,NULL,'2026-04-01 15:30:09','2026-04-01 15:30:09','student','active',NULL),(209,'Erap Estrada','Erap','Estrada','estrada.erap@dnsc.ic.ph',NULL,'$2y$12$twm2/Ge/ROJeWJpUnItSzuPGjhLJEdeMqMmgOuIEomtpcsgx64hli',NULL,NULL,NULL,'2026-04-01 15:30:09','2026-04-01 15:30:09','student','active',NULL),(210,'Digong Duterte','Digong','Duterte','duterte.digong@dnsc.ic.ph',NULL,'$2y$12$EMq.3NSSynmbenwjZdd/ieEWgiBRDTUpmzkxINu2ZF4gT1nuS6fiW',NULL,NULL,NULL,'2026-04-01 15:30:10','2026-04-01 15:30:10','student','active',NULL),(211,'Sara Duterte','Sara','Duterte','duterte.sara@dnsc.ic.ph',NULL,'$2y$12$O2mA6rsNVzYrVq6E1Dwjw.voN3Pk9Ud3y.3Fbm.8ymOrCeqFXTiVm',NULL,NULL,NULL,'2026-04-01 15:30:10','2026-04-01 15:30:10','student','active',NULL),(212,'Paolo Duterte','Paolo','Duterte','duterte.paolo@dnsc.ic.ph',NULL,'$2y$12$7..LNZlgPwLmVfmtv/3Wvu/AvYpgOQlX8llrM98Iu3Cghu1110v2e',NULL,NULL,NULL,'2026-04-01 15:30:10','2026-04-01 15:30:10','student','active',NULL),(213,'Baste Duterte','Baste','Duterte','duterte.baste@dnsc.ic.ph',NULL,'$2y$12$Ixb49.A8HFBiMUa7nQxI1udd6QuIV2fWEwqAAFRlG2WUXReesemeC',NULL,NULL,NULL,'2026-04-01 15:30:11','2026-04-01 15:30:11','student','active',NULL),(214,'Kitty Duterte','Kitty','Duterte','duterte.kitty@dnsc.ic.ph',NULL,'$2y$12$R4LLs/2FQg8MDE9O.yNPPeX9rhDkesif3jRc04B56luWuu7LPIigK',NULL,NULL,NULL,'2026-04-01 15:30:11','2026-04-01 15:30:11','student','active',NULL),(215,'Honeylet Avanceña','Honeylet','Avanceña','avancena.honeylet@dnsc.ic.ph',NULL,'$2y$12$8YPknInyRjg8PL/v3tJaEuhMq1r7JZEvkjRzR7SsDYScTsgQThqw.',NULL,NULL,NULL,'2026-04-01 15:30:11','2026-04-01 15:30:11','student','active',NULL),(216,'Elizabeth Zimmerman','Elizabeth','Zimmerman','zimmerman.elizabeth@dnsc.ic.ph',NULL,'$2y$12$6JpF2Abw6ABwyiNR5jQs7elPmN7rDLEhRY3rTQBun2ru8ZJg6ZH86',NULL,NULL,NULL,'2026-04-01 15:30:12','2026-04-01 15:30:12','student','active',NULL),(217,'Bong Go','Bong','Go','go.bong@dnsc.ic.ph',NULL,'$2y$12$8uHZSWRab4JtpAzTwxV2Z.UhFKCoWjAZtewuSpHY21JYrsOgS1Mse',NULL,NULL,NULL,'2026-04-01 15:30:12','2026-04-01 15:30:12','student','active',NULL),(218,'Bato dela Rosa','Bato','dela Rosa','delarosa.bato@dnsc.ic.ph',NULL,'$2y$12$cA.81Vr5uWm05lalCcSrgeAtf0gWTpxKbczvmyXLSbXC1HEZuSsbK',NULL,NULL,NULL,'2026-04-01 15:30:12','2026-04-01 15:30:12','student','active',NULL),(219,'Loren Legarda','Loren','Legarda','legarda.loren@dnsc.ic.ph',NULL,'$2y$12$K6XMouZdPo6qJXpE6oV2rOOzSQfR5eVG3LPdjnTGcDyhX8rmUFwLK',NULL,NULL,NULL,'2026-04-01 15:30:13','2026-04-01 15:30:13','student','active',NULL),(220,'Raffy Tulfo','Raffy','Tulfo','tulfo.raffy@dnsc.ic.ph',NULL,'$2y$12$ih/jyAZITT2YLABpO3JfUeo2m4KstZeILIPL4FUx/Kxg/W2MJS5MC',NULL,NULL,NULL,'2026-04-01 15:30:13','2026-04-01 15:30:13','student','active',NULL),(221,'Erwin Tulfo','Erwin','Tulfo','tulfo.erwin@dnsc.ic.ph',NULL,'$2y$12$J8oN4O3qDIKPaU/.UEHvKe0rP/MdRiwXoQY4WXsuz8JOnb/SG9WAC',NULL,NULL,NULL,'2026-04-01 15:30:13','2026-04-01 15:30:13','student','active',NULL),(222,'Ben Tulfo','Ben','Tulfo','tulfo.ben@dnsc.ic.ph',NULL,'$2y$12$5kPHQQkQX8D/NI2Yav.tR.gh9Ain/BkfOIMue395AjqF.RsfQ5kzm',NULL,NULL,NULL,'2026-04-01 15:30:14','2026-04-01 15:30:14','student','active',NULL),(223,'Mon Tulfo','Mon','Tulfo','tulfo.mon@dnsc.ic.ph',NULL,'$2y$12$sYvSzT356SLAQjX55TMU9eFqbo8v3poQrpUjbckjGspmJlK1hYKvq',NULL,NULL,NULL,'2026-04-01 15:30:14','2026-04-01 15:30:14','student','active',NULL),(224,'Wanda Teo','Wanda','Teo','teo.wanda@dnsc.ic.ph',NULL,'$2y$12$p0oFqhypdFEJT36Sraql1OtSigrwMYO1cm1vtdR6PhzUPV7Y8GazG',NULL,NULL,NULL,'2026-04-01 15:30:14','2026-04-01 15:30:14','student','active',NULL),(225,'Mocha Uson','Mocha','Uson','uson.mocha@dnsc.ic.ph',NULL,'$2y$12$md49y/bXStUgYx0qYmMLl.OyrYjBMelq9bYI1608Ewx4YmPDfsm8G',NULL,NULL,NULL,'2026-04-01 15:30:14','2026-04-01 15:30:14','student','active',NULL),(226,'Harry Roque','Harry','Roque','roque.harry@dnsc.ic.ph',NULL,'$2y$12$xe059FLE6pRECDzK3u2WP.TE69hKEAg7otyTi5W64K/XeT30F6R2G',NULL,NULL,NULL,'2026-04-01 15:30:15','2026-04-01 15:30:15','student','active',NULL),(227,'Salvador Panelo','Salvador','Panelo','panelo.salvador@dnsc.ic.ph',NULL,'$2y$12$84f7lJerVXfUQ.ZOhQL1e.eKuhdf4oQEQHlYe63ytPsWuTDu.wzfK',NULL,NULL,NULL,'2026-04-01 15:30:15','2026-04-01 15:30:15','student','active',NULL),(228,'Vitaliano Aguirre','Vitaliano','Aguirre','aguirre.vitaliano@dnsc.ic.ph',NULL,'$2y$12$LZ6VyN1j/4yJz6fh858g/ObstfZY8N7cgP06LOn69k9YlZQpGPICW',NULL,NULL,NULL,'2026-04-01 15:30:15','2026-04-01 15:30:15','student','active',NULL),(229,'Leila de Lima','Leila','de Lima','delima.leila@dnsc.ic.ph',NULL,'$2y$12$0/z3RxXfBQDhDxH18XkayORRT2bFYlxT9mjfKf86qQcjJWYOu9zn2',NULL,NULL,NULL,'2026-04-01 15:30:16','2026-04-01 15:30:16','student','active',NULL),(230,'Risa Hontiveros','Risa','Hontiveros','hontiveros.risa@dnsc.ic.ph',NULL,'$2y$12$2H8j7mGcE.ODfZ2yH2c0de6zXTr5NNwJ8xJZTRSpHtvaWA4g9/xuC',NULL,NULL,NULL,'2026-04-01 15:30:16','2026-04-01 15:30:16','student','active',NULL),(231,'Kiko Pangilinan','Kiko','Pangilinan','pangilinan.kiko@dnsc.ic.ph',NULL,'$2y$12$14y7Vfp2VH4Yo7s/l5xenepTH/.8rE4swkf7OyBDAK2oP8njDdxoO',NULL,NULL,NULL,'2026-04-01 15:30:16','2026-04-01 15:30:16','student','active',NULL),(232,'Bam Aquino','Bam','Aquino','aquino.bam@dnsc.ic.ph',NULL,'$2y$12$sOPwCF3M6dNcnKBsxKabjOcZL2AOVBX78v2xWTRlNRTnOxhMnbDM2',NULL,NULL,NULL,'2026-04-01 15:30:17','2026-04-01 15:30:17','student','active',NULL),(233,'Antonio Trillanes','Antonio','Trillanes','trillanes.antonio@dnsc.ic.ph',NULL,'$2y$12$vZSeK6hyP/YkWisyQl4Piu1Kb4k5LDCXXz2Jg1nwvYrd3LwvO4A2u',NULL,NULL,NULL,'2026-04-01 15:30:17','2026-04-01 15:30:17','student','active',NULL),(234,'Sonny Trillanes','Sonny','Trillanes','trillanes.sonny@dnsc.ic.ph',NULL,'$2y$12$bxTKYM3DFP9xhci9/QyKQejADFW8QmQjTtQ/ZOgvs9Df0DGVggAau',NULL,NULL,NULL,'2026-04-01 15:30:17','2026-04-01 15:30:17','student','active',NULL),(235,'Gary Alejano','Gary','Alejano','alejano.gary@dnsc.ic.ph',NULL,'$2y$12$5emNgrL/3LYvwCnN9sv2BuK2lX7WmY/gXEDe5KtE9fxWYzeZ7/7o6',NULL,NULL,NULL,'2026-04-01 15:30:18','2026-04-01 15:30:18','student','active',NULL),(236,'Neri Colmenares','Neri','Colmenares','colmenares.neri@dnsc.ic.ph',NULL,'$2y$12$IAWn.cnu6n9NdNDg2LjWwOP0GKtKD.3Kpx2JZobJewR3naPqldqCu',NULL,NULL,NULL,'2026-04-01 15:30:18','2026-04-01 15:30:18','student','active',NULL),(237,'Carlos Zarate','Carlos','Zarate','zarate.carlos@dnsc.ic.ph',NULL,'$2y$12$uazUhrmX6H9vo4KX3/I5a.UpGQO71gdcnV9IRec2I.gl9lQm5wSrO',NULL,NULL,NULL,'2026-04-01 15:30:18','2026-04-01 15:30:18','student','active',NULL),(238,'Sarah Elago','Sarah','Elago','elago.sarah@dnsc.ic.ph',NULL,'$2y$12$7yo68XFMPWTtMCgpyTnEye3orT5u0mfnNovGJukKOJZ1j1J.ER1Ci',NULL,NULL,NULL,'2026-04-01 15:30:19','2026-04-01 15:30:19','student','active',NULL),(239,'France Castro','France','Castro','castro.france@dnsc.ic.ph',NULL,'$2y$12$L1WeATSGiUOuD0JXAEfcTeNX4sSm0yo12GlF1vJPjQaKsQeFUaCAi',NULL,NULL,NULL,'2026-04-01 15:30:19','2026-04-01 15:30:19','student','active',NULL),(240,'Arlene Brosas','Arlene','Brosas','brosas.arlene@dnsc.ic.ph',NULL,'$2y$12$8EAsZl8eRSsn5pd9DElXQey7k.fbsTr7kMJ1I9Wf6aV/wBGm7.Ijq',NULL,NULL,NULL,'2026-04-01 15:30:19','2026-04-01 15:30:19','student','active',NULL),(241,'Raoul Manuel','Raoul','Manuel','manuel.raoul@dnsc.ic.ph',NULL,'$2y$12$.t2cGGje1V7zbanTg7JoJ.siKAcwB8gYGPIA3Njq1gkM/Gmyk6/we',NULL,NULL,NULL,'2026-04-01 15:30:19','2026-04-01 15:30:19','student','active',NULL),(242,'Arvin Caballero','Arvin','Caballero','caballero.arvin@dnsc.ic.ph',NULL,'$2y$12$GOfs16u8lP46PVj2LpvaneSm8p5CNqwIyhrQbajIvTPmzpJvw6tE.',NULL,NULL,NULL,'2026-04-01 15:30:57','2026-04-01 15:30:57','student','active',NULL),(243,'Gerald Fajardo','Gerald','Fajardo','fajardo.gerald@dnsc.ic.ph',NULL,'$2y$12$VrOFyQ9.nRozN.ZsLwgepuzIQHKGEuwYgqxQKzPtMk9dbH4wAomiC',NULL,NULL,NULL,'2026-04-01 15:30:58','2026-04-01 15:30:58','student','active',NULL),(244,'Nelson Quinto','Nelson','Quinto','quinto.nelson@dnsc.ic.ph',NULL,'$2y$12$XHZnVabWylAmzuQypJ/s.ebbYkjJA0V52QDzCJyetmebvCNSs2Bx.',NULL,NULL,NULL,'2026-04-01 15:30:58','2026-04-01 15:30:58','student','active',NULL),(245,'Marvin Tadeo','Marvin','Tadeo','tadeo.marvin@dnsc.ic.ph',NULL,'$2y$12$l/4JW9Smg.BpvVbFVzwhC.Z0euaUg40IurWTb4zRtF3HUqJpKwo1C',NULL,NULL,NULL,'2026-04-01 15:30:58','2026-04-01 15:30:58','student','active',NULL),(246,'Dennis Llorente','Dennis','Llorente','llorente.dennis@dnsc.ic.ph',NULL,'$2y$12$m58SSI9pY4vtNzdsPTksF.c.oElp.1CI5ktlBJJYP0qZ4yuTD7.3S',NULL,NULL,NULL,'2026-04-01 15:30:59','2026-04-01 15:30:59','student','active',NULL),(247,'Rico Barrera','Rico','Barrera','barrera.rico@dnsc.ic.ph',NULL,'$2y$12$ee3jF38EUUiCngrjbth3jucYuhqr/TwN/DTJd1hhnJwT6.263RdfC',NULL,NULL,NULL,'2026-04-01 15:30:59','2026-04-01 15:30:59','student','active',NULL),(248,'Allan Sarmiento','Allan','Sarmiento','sarmiento.allan@dnsc.ic.ph',NULL,'$2y$12$MBDtdtVN4og9EGnuqqeWpe7Kw5NumY3O.xrlh9MZXFGKZcvBG6XXO',NULL,NULL,NULL,'2026-04-01 15:30:59','2026-04-01 15:30:59','student','active',NULL),(249,'Joel Malabanan','Joel','Malabanan','malabanan.joel@dnsc.ic.ph',NULL,'$2y$12$IwS0iZcsGQxId6/cdzkArefu2Lf5E4wkmjrkveaPmBfi1hv2o82d.',NULL,NULL,NULL,'2026-04-01 15:31:00','2026-04-01 15:31:00','student','active',NULL),(250,'Ruben Catapang','Ruben','Catapang','catapang.ruben@dnsc.ic.ph',NULL,'$2y$12$Fe0dUwMqLTUWkvvJ495bH.MIfnwooKHPI2rciR6uSU1gMI8r5Sn6W',NULL,NULL,NULL,'2026-04-01 15:31:00','2026-04-01 15:31:00','student','active',NULL),(251,'Edgar Dimaculangan','Edgar','Dimaculangan','dimaculangan.edgar@dnsc.ic.ph',NULL,'$2y$12$f4HztTtpGb96Bp16KyWO9OFHNA9UlTXh/bXUg63TPk8sglob7.v9m',NULL,NULL,NULL,'2026-04-01 15:31:01','2026-04-01 15:31:01','student','active',NULL),(252,'Julius Arceo','Julius','Arceo','arceo.julius@dnsc.ic.ph',NULL,'$2y$12$xRXLBjaytlasLQnzRzlZ5e9UXayvsAH7ksBfFIIYcV/5zhlDSLYdK',NULL,NULL,NULL,'2026-04-01 15:31:01','2026-04-01 15:31:01','student','active',NULL),(253,'Noel Balmes','Noel','Balmes','balmes.noel@dnsc.ic.ph',NULL,'$2y$12$tkThOmZ3OtPjG0Jt46D7EOp/85VCmVN/o.HPdo5ycwWcnqgb.Qdpa',NULL,NULL,NULL,'2026-04-01 15:31:01','2026-04-01 15:31:01','student','active',NULL),(254,'Cesar Dizon','Cesar','Dizon','dizon.cesar@dnsc.ic.ph',NULL,'$2y$12$0/N7OoFOycwXJgTlpGsPcOGu3/bdnYO3CLFLBskJkI3VVIgA5gwKK',NULL,NULL,NULL,'2026-04-01 15:31:02','2026-04-01 15:31:02','student','active',NULL),(255,'Orlando Escueta','Orlando','Escueta','escueta.orlando@dnsc.ic.ph',NULL,'$2y$12$HxWIOZUYRd1uhjEbibxuNOGydm5iEn/nqtXuyihzN8TW2VvY5X2xa',NULL,NULL,NULL,'2026-04-01 15:31:02','2026-04-01 15:31:02','student','active',NULL),(256,'Renato Fabella','Renato','Fabella','fabella.renato@dnsc.ic.ph',NULL,'$2y$12$tao7WdLJkAdWzb01gjX4eun0.SUfRidwSSgBZ2hT2Z5n5//4eUAP2',NULL,NULL,NULL,'2026-04-01 15:31:03','2026-04-01 15:31:03','student','active',NULL),(257,'Mario Gatchalian','Mario','Gatchalian','gatchalian.mario@dnsc.ic.ph',NULL,'$2y$12$E1pBU1jHjVeKL9hzC0u/rurcgS7FjCxXmh4qyGFSIepAv.KsLv.fu',NULL,NULL,NULL,'2026-04-01 15:31:03','2026-04-01 15:31:03','student','active',NULL),(258,'Benjie Hizon','Benjie','Hizon','hizon.benjie@dnsc.ic.ph',NULL,'$2y$12$R2hOdxak8pHJFgfTcxeezO8MJW4wHRouUFhnLB.N4IUVzKTPVRhFO',NULL,NULL,NULL,'2026-04-01 15:31:04','2026-04-01 15:31:04','student','active',NULL),(259,'Victor Inocencio','Victor','Inocencio','inocencio.victor@dnsc.ic.ph',NULL,'$2y$12$Uk.CY4mWl1ixECR0TK5BteZkDZClB3YXZ.ZSwwenjjzlQdgGPfk8a',NULL,NULL,NULL,'2026-04-01 15:31:04','2026-04-01 15:31:04','student','active',NULL),(260,'Danilo Jalbuena','Danilo','Jalbuena','jalbuena.danilo@dnsc.ic.ph',NULL,'$2y$12$k9BR1xNl3XUWtyLtubEioeCD2Q4/BaiLBZQS/sW6Z.WvYmTEFfJdO',NULL,NULL,NULL,'2026-04-01 15:31:04','2026-04-01 15:31:04','student','active',NULL),(261,'Teodoro Kalaw','Teodoro','Kalaw','kalaw.teodoro@dnsc.ic.ph',NULL,'$2y$12$jVSs9Q/QBAukzffV3qNSeOyCMrZiH/qC5dLZ6NDEyZYGqzrMYr3bC',NULL,NULL,NULL,'2026-04-01 15:31:05','2026-04-01 15:31:05','student','active',NULL),(262,'Ramil Labuguen','Ramil','Labuguen','labuguen.ramil@dnsc.ic.ph',NULL,'$2y$12$McIZho/XvLbzKmfUHjpky.oZrsgTyajDqSzvd4d0LAU1IJnTa0P7.',NULL,NULL,NULL,'2026-04-01 15:31:05','2026-04-01 15:31:05','student','active',NULL),(263,'Arnel Maceda','Arnel','Maceda','maceda.arnel@dnsc.ic.ph',NULL,'$2y$12$kXusVjR87faJQ5E6wqoQK.5otuIh.r8UAz3Az9VcKTaCzBBwqya5q',NULL,NULL,NULL,'2026-04-01 15:31:06','2026-04-01 15:31:06','student','active',NULL),(264,'Nestor Nool','Nestor','Nool','nool.nestor@dnsc.ic.ph',NULL,'$2y$12$q97sJUfwUNdzbkZT3TYQK.26soGoDkQDrgQkXQ1/jDhtFMXFJQTLy',NULL,NULL,NULL,'2026-04-01 15:31:06','2026-04-01 15:31:06','student','active',NULL),(265,'Oscar Ocampo','Oscar','Ocampo','ocampo.oscar@dnsc.ic.ph',NULL,'$2y$12$tmRseRnxXSCYnyBBhC5/NOIOct2VqACslVcqceTrn20QNdw0Sq/ry',NULL,NULL,NULL,'2026-04-01 15:31:07','2026-04-01 15:31:07','student','active',NULL),(266,'Pedro Pacis','Pedro','Pacis','pacis.pedro@dnsc.ic.ph',NULL,'$2y$12$yChJm1fRjT7XRQA9w93ULe1oYGXgbw8YOxJ8WgMGTpi/atvH0Z.2C',NULL,NULL,NULL,'2026-04-01 15:31:07','2026-04-01 15:31:07','student','active',NULL),(267,'Rolando Quijano','Rolando','Quijano','quijano.rolando@dnsc.ic.ph',NULL,'$2y$12$8jOXdLmjIUsHMk84KkaqEO/PVVG8pcPpmXoMI6JK7jVaTKH0sJEey',NULL,NULL,NULL,'2026-04-01 15:31:07','2026-04-01 15:31:07','student','active',NULL),(268,'Salvador Racelis','Salvador','Racelis','racelis.salvador@dnsc.ic.ph',NULL,'$2y$12$GijWQNclmc9oPBXQmRbdN.g2KC21wB47eZeaOVLe40YjKbA7/y29y',NULL,NULL,NULL,'2026-04-01 15:31:08','2026-04-01 15:31:08','student','active',NULL),(269,'Tomas Sison','Tomas','Sison','sison.tomas@dnsc.ic.ph',NULL,'$2y$12$NvVZivtZQZRwksLgXzHNUuKkmdd1ECqYG3IP8LU3HylYelgyHq35q',NULL,NULL,NULL,'2026-04-01 15:31:08','2026-04-01 15:31:08','student','active',NULL),(270,'Ulysses Tabora','Ulysses','Tabora','tabora.ulysses@dnsc.ic.ph',NULL,'$2y$12$LYX8DhcBOd3q8UOFKaf7aOq24VSqogIfMLi.J7e8SEbjLhZX0usaq',NULL,NULL,NULL,'2026-04-01 15:31:09','2026-04-01 15:31:09','student','active',NULL),(271,'Virgilio Umali','Virgilio','Umali','umali.virgilio@dnsc.ic.ph',NULL,'$2y$12$oytwwDHhxE0WX5R4MXu7WuBgUZ6pcFrSTqK/vEh6anAb9e4PjijAG',NULL,NULL,NULL,'2026-04-01 15:31:09','2026-04-01 15:31:09','student','active',NULL),(272,'Wilfredo Valmores','Wilfredo','Valmores','valmores.wilfredo@dnsc.ic.ph',NULL,'$2y$12$zb8YM1wvhGliP/TkMmyBGemuL.ULgLvkTvTL7MicudbvHTtaMNxLW',NULL,NULL,NULL,'2026-04-01 15:31:09','2026-04-01 15:31:09','student','active',NULL),(273,'Xander Yabut','Xander','Yabut','yabut.xander@dnsc.ic.ph',NULL,'$2y$12$88QhZWt1PMNXrzXjwvJkHukV.lPS.cTvfjHi6gYL5vfBsoLXDg9om',NULL,NULL,NULL,'2026-04-01 15:31:10','2026-04-01 15:31:10','student','active',NULL),(274,'Yvan Zulueta','Yvan','Zulueta','zulueta.yvan@dnsc.ic.ph',NULL,'$2y$12$vSV1hnsvMcqbzOH3GFCpguALwU2au.jh64F.dqIAuMWswksppKhba',NULL,NULL,NULL,'2026-04-01 15:31:10','2026-04-01 15:31:10','student','active',NULL),(275,'Zandro Almeda','Zandro','Almeda','almeda.zandro@dnsc.ic.ph',NULL,'$2y$12$MLB4dXJGrHVrp7endiFVa.XgZwUgwwgIAdP1KDb5p1Q6z.qoIipUy',NULL,NULL,NULL,'2026-04-01 15:31:11','2026-04-01 15:31:11','student','active',NULL),(276,'April Baylon','April','Baylon','baylon.april@dnsc.ic.ph',NULL,'$2y$12$xPLKFKd2B2J5jCvEqZEB7uDG1v5SqtUlQPxk3Y985bMdIWfTCcEnS',NULL,NULL,NULL,'2026-04-01 15:31:11','2026-04-01 15:31:11','student','active',NULL),(277,'Brenda Casingal','Brenda','Casingal','casingal.brenda@dnsc.ic.ph',NULL,'$2y$12$51q9kkznIpWfr76.i44GqeVm1DZWHASOSgRmYRezyV4WxZbBayOWS',NULL,NULL,NULL,'2026-04-01 15:31:11','2026-04-01 15:31:11','student','active',NULL),(278,'Celeste De Guzman','Celeste','De Guzman','deguzman.celeste@dnsc.ic.ph',NULL,'$2y$12$QncMDzSIChYmi/3j1BQaveNc/Zr8nj0WM47LwwtAbyg1sbnxDMRtC',NULL,NULL,NULL,'2026-04-01 15:31:12','2026-04-01 15:31:12','student','active',NULL),(279,'Donna Esguerra','Donna','Esguerra','esguerra.donna@dnsc.ic.ph',NULL,'$2y$12$wkiKBe.Vo6RvbVYXa9QHJ.a0yXvEwofDQTF8EaJa1YUnn2uXFsWo2',NULL,NULL,NULL,'2026-04-01 15:31:12','2026-04-01 15:31:12','student','active',NULL),(280,'Elsa Francisco','Elsa','Francisco','francisco.elsa@dnsc.ic.ph',NULL,'$2y$12$6BzaUhTFufJ2FBifPXtJVeHtCzfoS1vtWMLhmFatoVSSJStjZDGN.',NULL,NULL,NULL,'2026-04-01 15:31:13','2026-04-01 15:31:13','student','active',NULL),(281,'Fe Galura','Fe','Galura','galura.fe@dnsc.ic.ph',NULL,'$2y$12$cOAuF0MqgdxcoWm3WlTY/u0EwQx6Z1yCBMVaJRqhpBFkoJ5.Gcb8i',NULL,NULL,NULL,'2026-04-01 15:31:13','2026-04-01 15:31:13','student','active',NULL),(282,'Gina Halili','Gina','Halili','halili.gina@dnsc.ic.ph',NULL,'$2y$12$3.HegL9RIwmkE.DHLkQaCedwfscLVv.l5nHl9.17TNn2glsWWPz/q',NULL,NULL,NULL,'2026-04-01 15:31:14','2026-04-01 15:31:14','student','active',NULL),(283,'Helen Ilagan','Helen','Ilagan','ilagan.helen@dnsc.ic.ph',NULL,'$2y$12$T5AHVL31rIHKzffcc632Nuw1s9nqqosM5U4iXr1394iQBwArg.YjG',NULL,NULL,NULL,'2026-04-01 15:31:14','2026-04-01 15:31:14','student','active',NULL),(284,'Irene Javier','Irene','Javier','javier.irene@dnsc.ic.ph',NULL,'$2y$12$81NlyB6qfu6NPhsmaKx7BeMGDwYwcCSC3hjvOlBma9MhUxrwtiA56',NULL,NULL,NULL,'2026-04-01 15:31:15','2026-04-01 15:31:15','student','active',NULL),(285,'Jocelyn Katigbak','Jocelyn','Katigbak','katigbak.jocelyn@dnsc.ic.ph',NULL,'$2y$12$swcF1YgNxD/mnQYR.e/.weKWHD30Ycf6um6KMAoQHQfDxMWIujtyC',NULL,NULL,NULL,'2026-04-01 15:31:15','2026-04-01 15:31:15','student','active',NULL),(286,'Karen Lascano','Karen','Lascano','lascano.karen@dnsc.ic.ph',NULL,'$2y$12$.cQAwYEwV.FZGPwTLUJUUuqhXwUiFTMsbrFEG6yfUHV3vDKl3zJCq',NULL,NULL,NULL,'2026-04-01 15:31:16','2026-04-01 15:31:16','student','active',NULL),(287,'Lorna Maturan','Lorna','Maturan','maturan.lorna@dnsc.ic.ph',NULL,'$2y$12$qzZf6ZgIHlUipyojy89eb.LbB0f1dDVgpU/kcA611DJJlxZvkYBxW',NULL,NULL,NULL,'2026-04-01 15:31:16','2026-04-01 15:31:16','student','active',NULL),(288,'Melinda Nisperos','Melinda','Nisperos','nisperos.melinda@dnsc.ic.ph',NULL,'$2y$12$evx1CpvI3ummePGRF7mOCO3HCUkiQpvg7QMDlI7KMHO/eiOJugySm',NULL,NULL,NULL,'2026-04-01 15:31:17','2026-04-01 15:31:17','student','active',NULL),(289,'Nida Oñate','Nida','Oñate','onate.nida@dnsc.ic.ph',NULL,'$2y$12$7jmzewcghKcdn4flzw8rB.XM5t3bzkfTl2MxpKkI3iH3zr8YJKRla',NULL,NULL,NULL,'2026-04-01 15:31:17','2026-04-01 15:31:17','student','active',NULL),(290,'Olivia Pajarillo','Olivia','Pajarillo','pajarillo.olivia@dnsc.ic.ph',NULL,'$2y$12$q3wHk6NO6HbyHDPav8slIOKEPw1vSCiryfInqG/GNFa67y23Q3ogC',NULL,NULL,NULL,'2026-04-01 15:31:18','2026-04-01 15:31:18','student','active',NULL),(291,'Patricia Quimpo','Patricia','Quimpo','quimpo.patricia@dnsc.ic.ph',NULL,'$2y$12$9WU8n7l7Pgd0ZDa5UxLe2eMl99MGyah7ikgoSymA6zNDnV.mpHeai',NULL,NULL,NULL,'2026-04-01 15:31:18','2026-04-01 15:31:18','student','active',NULL),(292,'Queenie Rabena','Queenie','Rabena','rabena.queenie@dnsc.ic.ph',NULL,'$2y$12$MZ8yDwLexI2WIWPs6cN7qOAtavA33AFsdo5LvdS7uvC.C6Hqu.IJy',NULL,NULL,NULL,'2026-04-01 15:31:19','2026-04-01 15:31:19','student','active',NULL),(293,'Rhea Sadsad','Rhea','Sadsad','sadsad.rhea@dnsc.ic.ph',NULL,'$2y$12$EWwGSwUkKvEOo1Pe0SEHhOFw6mX4fy334XyphU9zIazgD6kxdJ12m',NULL,NULL,NULL,'2026-04-01 15:31:19','2026-04-01 15:31:19','student','active',NULL),(294,'Sheila Tumulak','Sheila','Tumulak','tumulak.sheila@dnsc.ic.ph',NULL,'$2y$12$DpEJjHSONbx5PbMyJfRaSuZZTASCcwOz0i8uwNEX3jmovFoes1Alu',NULL,NULL,NULL,'2026-04-01 15:31:19','2026-04-01 15:31:19','student','active',NULL),(295,'Tess Ulep','Tess','Ulep','ulep.tess@dnsc.ic.ph',NULL,'$2y$12$ohUNT3v1v4mbpfFxadq3kOGUFjLdIVB99C8nnFHqIIkhvMSvkDvmS',NULL,NULL,NULL,'2026-04-01 15:31:20','2026-04-01 15:31:20','student','active',NULL),(296,'Ursula Valerio','Ursula','Valerio','valerio.ursula@dnsc.ic.ph',NULL,'$2y$12$NHyAwIRAkq70NUgsSyF8TOuQ6QtKDy4UlJgeR87b0r65MZplpWJ7e',NULL,NULL,NULL,'2026-04-01 15:31:20','2026-04-01 15:31:20','student','active',NULL),(297,'Vina Wagas','Vina','Wagas','wagas.vina@dnsc.ic.ph',NULL,'$2y$12$1URQCl2zmTJuQlhzxy.i6uTi2FknoG/n/DVpuTM9.6mwX8UDfOWtm',NULL,NULL,NULL,'2026-04-01 15:31:21','2026-04-01 15:31:21','student','active',NULL),(298,'Wendy Ximenes','Wendy','Ximenes','ximenes.wendy@dnsc.ic.ph',NULL,'$2y$12$dywBx5I9D/1z/t6dMarz0.sqSYhQikgOzx36TPvE3y/bF5ArcDyNu',NULL,NULL,NULL,'2026-04-01 15:31:22','2026-04-01 15:31:22','student','active',NULL),(299,'Yolly Yap','Yolly','Yap','yap.yolly@dnsc.ic.ph',NULL,'$2y$12$vBE48PF7yzuQGmxlkZzCju.fM/f1KVYHw3mS90KPUtvbITCWcW63S',NULL,NULL,NULL,'2026-04-01 15:31:22','2026-04-01 15:31:22','student','active',NULL),(300,'Zenaida Abalos','Zenaida','Abalos','abalos.zenaida@dnsc.ic.ph',NULL,'$2y$12$diASmkOjRsAmyDfn9e/HF.GFNUuhbqkawFR9z96WMaTI7bNWJQiXm',NULL,NULL,NULL,'2026-04-01 15:31:22','2026-04-01 15:31:22','student','active',NULL),(301,'Adrian Balingit','Adrian','Balingit','balingit.adrian@dnsc.ic.ph',NULL,'$2y$12$fbZBcCLOHFhNsBfKjkC2xekMQ/rQHB7TyfrXSgNhZ6Jx16BWTHQXy',NULL,NULL,NULL,'2026-04-01 15:31:23','2026-04-01 15:31:23','student','active',NULL),(302,'Bernard Cuaresma','Bernard','Cuaresma','cuaresma.bernard@dnsc.ic.ph',NULL,'$2y$12$tNHMJQZjhuuP6rn5QGXJKOk5edWVKMY7Qce/GVCuqEZku1rzUKiwq',NULL,NULL,NULL,'2026-04-01 15:31:23','2026-04-01 15:31:23','student','active',NULL),(303,'Clark De Vera','Clark','De Vera','devera.clark@dnsc.ic.ph',NULL,'$2y$12$PmtbLPom1i.tLoiuC9soSe4I.v.0iN1mWDaU9v6RUgFChJnxQ4Pzm',NULL,NULL,NULL,'2026-04-01 15:31:24','2026-04-01 15:31:24','student','active',NULL),(304,'Dexter Erece','Dexter','Erece','erece.dexter@dnsc.ic.ph',NULL,'$2y$12$W/aKR7vSWQRLpdalHs8d3.CrRdHkpe98WStP89dvfmZLNN/5KBicS',NULL,NULL,NULL,'2026-04-01 15:31:24','2026-04-01 15:31:24','student','active',NULL),(305,'Elijah Fuentebella','Elijah','Fuentebella','fuentebella.elijah@dnsc.ic.ph',NULL,'$2y$12$pFWbvm7gC6pmS5yALnQXlOAS1Q6yyte9ZkRUGeyP0F2zdTAq.HaG6',NULL,NULL,NULL,'2026-04-01 15:31:25','2026-04-01 15:31:25','student','active',NULL),(306,'Franco Guinto','Franco','Guinto','guinto.franco@dnsc.ic.ph',NULL,'$2y$12$wNlMj7PSH5hFX5TCOWTHGuAng4UC0/9ioGFcJfMLq/B7tun3NKzbi',NULL,NULL,NULL,'2026-04-01 15:31:25','2026-04-01 15:31:25','student','active',NULL),(307,'Glenn Hufana','Glenn','Hufana','hufana.glenn@dnsc.ic.ph',NULL,'$2y$12$iCWmHnfKfL9vIeQKUoRt4exz79XqL2KdHUCVwnd7djtFMdKpQ4Zxe',NULL,NULL,NULL,'2026-04-01 15:31:25','2026-04-01 15:31:25','student','active',NULL),(308,'Ivan Jacinto','Ivan','Jacinto','jacinto.ivan@dnsc.ic.ph',NULL,'$2y$12$tOyYadQyWxlIlMiJTAReOO/TczKOZ8DV0nrSENM3MQdIMF5wN6Zv6',NULL,NULL,NULL,'2026-04-01 15:31:26','2026-04-01 15:31:26','student','active',NULL),(309,'Jomar Katubig','Jomar','Katubig','katubig.jomar@dnsc.ic.ph',NULL,'$2y$12$sO1iJEyJPKVsVlFSPMatquM3JvxMotGeKC/nCO.LYyJCl6.vLD9iK',NULL,NULL,NULL,'2026-04-01 15:31:26','2026-04-01 15:31:26','student','active',NULL),(310,'Kirk Luyun','Kirk','Luyun','luyun.kirk@dnsc.ic.ph',NULL,'$2y$12$m0TDvvPs9oQLdBOrZn8nROVkLxIfVRyHTLsg6phoSArzq9cII0oei',NULL,NULL,NULL,'2026-04-01 15:31:27','2026-04-01 15:31:27','student','active',NULL),(311,'Lester Millares','Lester','Millares','millares.lester@dnsc.ic.ph',NULL,'$2y$12$7g2bREq88lwca6gEaWolR.XdlbH4FEa/8y//xW5Nc6ycI3qCawAQW',NULL,NULL,NULL,'2026-04-01 15:31:27','2026-04-01 15:31:27','student','active',NULL),(312,'Manuel Noble','Manuel','Noble','noble.manuel@dnsc.ic.ph',NULL,'$2y$12$iNorWAsP6tT0FjNJziVFoOnbc6AOtG/QyB3qm1A.XbadIXWUHYWUe',NULL,NULL,NULL,'2026-04-01 15:31:27','2026-04-01 15:31:27','student','active',NULL),(313,'Norman Olivares','Norman','Olivares','olivares.norman@dnsc.ic.ph',NULL,'$2y$12$/AFVs1N/JI8JEgQ.iiUuF..TWktHKFT5R.rc.j8WQ2obqx90UxZMq',NULL,NULL,NULL,'2026-04-01 15:31:28','2026-04-01 15:31:28','student','active',NULL),(314,'Oliver Pascua','Oliver','Pascua','pascua.oliver@dnsc.ic.ph',NULL,'$2y$12$AWAsOgGynztUumLjatJxXOrYoIuE9fCjlIiFT4/3FCAOaGoh5AluS',NULL,NULL,NULL,'2026-04-01 15:31:28','2026-04-01 15:31:28','student','active',NULL),(315,'Paolo Quilala','Paolo','Quilala','quilala.paolo@dnsc.ic.ph',NULL,'$2y$12$ef0opOVao.YGEWFhglJVouF5KPPHUAhtNBOKJtSZqUf7Ji9qdItGK',NULL,NULL,NULL,'2026-04-01 15:31:29','2026-04-01 15:31:29','student','active',NULL),(316,'Quincy Roldan','Quincy','Roldan','roldan.quincy@dnsc.ic.ph',NULL,'$2y$12$OYJcHEQ5XXLZD3KbjQLi8OT/yOclSErHXWAlNliwzZLgiGx7dNj7y',NULL,NULL,NULL,'2026-04-01 15:31:29','2026-04-01 15:31:29','student','active',NULL),(317,'Roderick Samonte','Roderick','Samonte','samonte.roderick@dnsc.ic.ph',NULL,'$2y$12$Kcd.nW3sTO9gMLfS.rzzAu6n4FkRPJZXrZd99kfu6kCR6nKnfmwWy',NULL,NULL,NULL,'2026-04-01 15:31:30','2026-04-01 15:31:30','student','active',NULL),(318,'Sonny Tolibas','Sonny','Tolibas','tolibas.sonny@dnsc.ic.ph',NULL,'$2y$12$lMnkAazxvt06uN/4NvO9d.GjNtY/CiLwdOMEzSLqIw3Z3I0GuGR5S',NULL,NULL,NULL,'2026-04-01 15:31:30','2026-04-01 15:31:30','student','active',NULL),(319,'Tristan Uson','Tristan','Uson','uson.tristan@dnsc.ic.ph',NULL,'$2y$12$IIQ91GNA05VdUzqXBb7cLetM9gszqErs/Y3O5cJ7B.F1YmeDjv2s2',NULL,NULL,NULL,'2026-04-01 15:31:31','2026-04-01 15:31:31','student','active',NULL),(320,'Vince Vergara','Vince','Vergara','vergara.vince@dnsc.ic.ph',NULL,'$2y$12$mblPK46Z8.XBU4HFbch32.e65zTDkoI5apVDaDraJNmKjIxaaq6qS',NULL,NULL,NULL,'2026-04-01 15:31:31','2026-04-01 15:31:31','student','active',NULL),(321,'Warren Yumul','Warren','Yumul','yumul.warren@dnsc.ic.ph',NULL,'$2y$12$2YuipUq4nSfapmP6XadrUOcFRDowpSDGaqLicwwVC5FaJve6QFD2y',NULL,NULL,NULL,'2026-04-01 15:31:32','2026-04-01 15:31:32','student','active',NULL),(322,'Zedrick Zamora','Zedrick','Zamora','zamora.zedrick@dnsc.ic.ph',NULL,'$2y$12$JYwdTzyNYWQbaJiOfFhaSO5ux3J1fM8G1vwJwaJD89NMP7OJRasMu',NULL,NULL,NULL,'2026-04-01 15:31:32','2026-04-01 15:31:32','student','active',NULL),(323,'Adrian Ong','Adrian','Ong','adrian.ong@dnsc.ic.ph',NULL,'$2y$12$xMKMfxv6lOvogYZuEK9BD.1X6c/trzPCCcMVv9bppjQmrLWrUD3Uy',NULL,NULL,NULL,'2026-04-01 15:32:12','2026-04-01 15:32:12','panelist','active',NULL),(324,'Ana Lopez','Ana','Lopez','ana.lopez@dnsc.ic.ph',NULL,'$2y$12$laRzn9y3vxrTNEeR36WbCuabqQAmSRUbFHehq/ZNW2muxG1ltwD3u',NULL,NULL,NULL,'2026-04-01 15:32:13','2026-04-01 15:32:13','adviser','active',NULL),(325,'Bea Uy','Bea','Uy','bea.uy@dnsc.ic.ph',NULL,'$2y$12$3AcwTE3j6h9cDMqAeQldbuOIbls7XH47WnV8z1lHyyfEAXqL8usXe',NULL,'5Ob21jLscjKcdqMP6deedBIdUJs9qBwDGs6Ejv5K','2026-04-01 16:32:41','2026-04-01 15:32:13','2026-04-01 15:33:45','instructor','active',NULL),(326,'Carlos Garcia','Carlos','Garcia','carlos.garcia@dnsc.ic.ph',NULL,'$2y$12$UidSZSMqpfHbTyo/W0uhSOP/G4O8AvUypU3ZOMrL2znTOxUrTx8O2',NULL,NULL,NULL,'2026-04-01 15:32:14','2026-04-01 15:32:14','adviser','active',NULL),(327,'Chris Diaz','Chris','Diaz','chris.diaz@dnsc.ic.ph',NULL,'$2y$12$5pEJ5UnJVAg.MwOJXO9g9emoS1nxTIbeHAMdINsT88m9LXtxxDwzS',NULL,NULL,NULL,'2026-04-01 15:32:14','2026-04-01 15:32:14','panelist','active',NULL),(328,'Clara Dy','Clara','Dy','clara.dy@dnsc.ic.ph',NULL,'$2y$12$r7qNinGOm/koQnYnxPDVjejknpSucPpBPPMgumu.1nRPr59kX4U66',NULL,NULL,NULL,'2026-04-01 15:32:14','2026-04-01 15:32:14','panelist','active',NULL),(329,'Daniel Torres','Daniel','Torres','daniel.torres@dnsc.ic.ph',NULL,'$2y$12$BeOPFM4/ONV4O1rJyNvNdOGJ7U0496trVCvxXEc1YRxmV9/VQoChW',NULL,NULL,NULL,'2026-04-01 15:32:15','2026-04-01 15:32:15','panelist','active',NULL),(330,'David Smith','David','Smith','d.smith@dnsc.ic.ph',NULL,'$2y$12$YgspwYls8wyi6OxjR8cl7eVmK01nG8nM8aGlOtUaYOWbxQibAJ1q2',NULL,'tMR7dnoM2oT9BSOYnNGJi8Qi0i0AAa2Qrz8xVHHU','2026-04-01 16:32:50','2026-04-01 15:32:15','2026-04-01 15:32:15','instructor','active',NULL),(331,'Elena Rossi','Elena','Rossi','e.rossi@dnsc.ic.ph',NULL,'$2y$12$kKYT4Du0zEdxzLKo5Xopgesw3OigebNNaYLiPdTbpZAvkoAtmRpGG',NULL,NULL,NULL,'2026-04-01 15:32:15','2026-04-01 15:32:15','instructor','active',NULL),(332,'Ella Gomez','Ella','Gomez','ella.gomez@dnsc.ic.ph',NULL,'$2y$12$Yt4XQ8KByK7d7eR2Uyr1COVyjkjxuAiWqdCE7Qubc3hl/YjoXNm9W',NULL,NULL,NULL,'2026-04-01 15:32:16','2026-04-01 15:32:16','panelist','active',NULL),(333,'Ethan Lim','Ethan','Lim','ethan.lim@dnsc.ic.ph',NULL,'$2y$12$BZKf.b4WqDnM/vtuEns2P./ugfV38s3S6WzOFHClGXXdSD5ItOCuq',NULL,NULL,NULL,'2026-04-01 15:32:16','2026-04-01 15:32:16','panelist','active',NULL),(334,'Grace Flores','Grace','Flores','grace.flores@dnsc.ic.ph',NULL,'$2y$12$3Iz72jEGNUdAfHQBJ1coOeVNSoDRB.rmCC3vmkwaP5od/RYHEaeye',NULL,NULL,NULL,'2026-04-01 15:32:17','2026-04-01 15:32:17','panelist','active',NULL),(335,'Ivy Sy','Ivy','Sy','ivy.sy@dnsc.ic.ph',NULL,'$2y$12$cYogIh7.tHUVH6/KPPcnvO/uPNzX0OSw/EPKskpFMPUu49P/ndBue',NULL,NULL,NULL,'2026-04-01 15:32:17','2026-04-01 15:32:17','panelist','active',NULL),(336,'Jason Kho','Jason','Kho','jason.kho@dnsc.ic.ph',NULL,'$2y$12$Uj.OxKM63bPoQRZj/mhXserZ2yCDaUrk0nRRueHfzciV0c8/4J4EW',NULL,NULL,NULL,'2026-04-01 15:32:17','2026-04-01 15:32:17','instructor','active',NULL),(337,'Joy Herrera','Joy','Herrera','joy.herrera@dnsc.ic.ph',NULL,'$2y$12$Wsqi7fzrcJ6JVfCy1Aeym.oGRq2pBlnb9lYlcOnLC8SzQ8c.Nr6Vi',NULL,NULL,NULL,'2026-04-01 15:32:18','2026-04-01 15:32:18','panelist','active',NULL),(338,'Juan Dela Cruz','Juan','Dela Cruz','juan.delacruz@dnsc.ic.ph',NULL,'$2y$12$AJez27nfc0O27BIwetoPDedphl2K/X2WuSMZUY1iBJdneou2bdMU.',NULL,NULL,NULL,'2026-04-01 15:32:18','2026-04-01 15:32:18','adviser','active',NULL),(339,'Ken Co','Ken','Co','ken.co@dnsc.ic.ph',NULL,'$2y$12$ZNFgNXQRswwJWuEb39v4peagXH7falqGXeQDkp4LCuIoZTysIxqoq',NULL,NULL,NULL,'2026-04-01 15:32:19','2026-04-01 15:32:19','program_chairperson','active',NULL),(340,'Kim Chua','Kim','Chua','kim.chua@dnsc.ic.ph',NULL,'$2y$12$KUt8dpW8PmcVSkQi1AC0a.It7lbaGf4fXQqwJAmRG85yvohW6MW52',NULL,NULL,NULL,'2026-04-01 15:32:19','2026-04-01 15:32:19','panelist','active',NULL),(341,'Leo Navarro','Leo','Navarro','leo.navarro@dnsc.ic.ph',NULL,'$2y$12$vHeMRCVYGXG5htuSbkhrW.tVWhpMsWYe9uuqyHpUV52hWV.rztHpu',NULL,NULL,NULL,'2026-04-01 15:32:19','2026-04-01 15:32:19','panelist','active',NULL),(342,'Liza Mendoza','Liza','Mendoza','liza.mendoza@dnsc.ic.ph',NULL,'$2y$12$qnwPttc8LeI44ag7MK8gBu0mkA/8FFGuwAH5JZzncfGnDtmltdqG2',NULL,NULL,NULL,'2026-04-01 15:32:20','2026-04-01 15:32:20','panelist','active',NULL),(343,'Marco Polo','Marco','Polo','m.polo@dnsc.ic.ph',NULL,'$2y$12$7g1SbRn9dsZXR45fxjnM2OcPUTX3khvdIfmzM7Dfe1YwT9yJESbFe',NULL,NULL,NULL,'2026-04-01 15:32:20','2026-04-01 15:32:20','instructor','active',NULL),(344,'Maria Santos','Maria','Santos','maria.santos@dnsc.ic.ph',NULL,'$2y$12$l8HgVpWFSkPu.VVmoadzmuXTsmGt47zVrJfKy1LLLOlP8ACaTnKnu',NULL,NULL,NULL,'2026-04-01 15:32:21','2026-04-01 15:32:21','adviser','active',NULL),(345,'Mark Bautista','Mark','Bautista','mark.bautista@dnsc.ic.ph',NULL,'$2y$12$.gPw8a50GuRWnrzObLYOG.m7149r7AhIIRbbQkwpD9MxrtSM0ipPa',NULL,NULL,NULL,'2026-04-01 15:32:21','2026-04-01 15:32:21','panelist','active',NULL),(346,'Maya Cruz','Maya','Cruz','maya.cruz@dnsc.ic.ph',NULL,'$2y$12$NFSOfvq.jEeA/DFZlkIotuPOobmsMLb/phPCm3HUvxIxK8uWOqkhy',NULL,NULL,NULL,'2026-04-01 15:32:22','2026-04-01 15:32:22','panelist','active',NULL),(347,'Nina Castro','Nina','Castro','nina.castro@dnsc.ic.ph',NULL,'$2y$12$YFbU8Jw8dITowg5FQxKvkOsDl.gTetwmdfMbrZk1gKAV/5G9/qKpi',NULL,NULL,NULL,'2026-04-01 15:32:22','2026-04-01 15:32:22','panelist','active',NULL),(348,'Noel Yu','Noel','Yu','noel.yu@dnsc.ic.ph',NULL,'$2y$12$0enRv.eW7KRfzLmfX0PiheqJrpHapkxIZYkq9TtOgXXqr4Mcz0Imi',NULL,NULL,NULL,'2026-04-01 15:32:22','2026-04-01 15:32:22','panelist','active',NULL),(349,'Paul Aquino','Paul','Aquino','paul.aquino@dnsc.ic.ph',NULL,'$2y$12$a1qTyj3W2sLHclcnXDP7zuqwIa8XvNlHKzXTJz/IFy2I/.s9RmisW',NULL,NULL,NULL,'2026-04-01 15:32:23','2026-04-01 15:32:23','panelist','active',NULL),(350,'Paula Go','Paula','Go','paula.go@dnsc.ic.ph',NULL,'$2y$12$pXhHsnhfE2D8W5SXlBBlUO50x.bVqcgsHXhTl8YBlm1Ko0z5sA7PS',NULL,NULL,NULL,'2026-04-01 15:32:23','2026-04-01 15:32:23','program_chairperson','active',NULL),(351,'Pedro Reyes','Pedro','Reyes','pedro.reyes@dnsc.ic.ph',NULL,'$2y$12$17.wKp/G/A6XE96k5sjCKOXyfh7/GhGmrjBpd86TH6EaYo4abHMQ.',NULL,NULL,NULL,'2026-04-01 15:32:23','2026-04-01 15:32:23','adviser','active',NULL),(352,'Rose Ramos','Rose','Ramos','rose.ramos@dnsc.ic.ph',NULL,'$2y$12$U.qfo3BXEJjd8PAceu4Ele31JD5LQE.w/aV2hMyaH/1AzKKv1TF8m',NULL,NULL,NULL,'2026-04-01 15:32:24','2026-04-01 15:32:24','panelist','active',NULL),(353,'Ryan Villanueva','Ryan','Villanueva','ryan.villanueva@dnsc.ic.ph',NULL,'$2y$12$c22FNArP6DZtNxcR0w8ZrOUc2CzxTa1pSE2zjWgAk4YGrOqOKAGfq',NULL,NULL,NULL,'2026-04-01 15:32:24','2026-04-01 15:32:24','panelist','active',NULL),(354,'Sophia Tan','Sophia','Tan','sophia.tan@dnsc.ic.ph',NULL,'$2y$12$KdH9oAs5dPVai5iOCpVF/Orr91KfXLoaDYcAi.6p3OAkW.mKbZbom',NULL,NULL,NULL,'2026-04-01 15:32:25','2026-04-01 15:32:25','panelist','active',NULL),(355,'Victor Ang','Victor','Ang','victor.ang@dnsc.ic.ph',NULL,'$2y$12$98WOAQ5q2osD/tHvVtRAgO3khDC2JR97JNH0y2a/xmKNkiaeCEQ.G',NULL,NULL,NULL,'2026-04-01 15:32:25','2026-04-01 15:32:25','dean','active',NULL);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping events for database 'cpms'
--

--
-- Dumping routines for database 'cpms'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-04-01 16:36:55
