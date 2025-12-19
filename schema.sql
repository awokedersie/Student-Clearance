-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Oct 28, 2025 at 11:33 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `clearance`
--

-- --------------------------------------------------------

--
-- Table structure for table `academicstaff_clearance`
--

CREATE TABLE `academicstaff_clearance` (
  `id` int(11) NOT NULL,
  `student_id` varchar(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `last_name` varchar(100) NOT NULL,
  `department` varchar(100) NOT NULL,
  `reason` text NOT NULL,
  `status` enum('pending','approved','rejected') DEFAULT 'pending',
  `requested_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `reject_reason` text DEFAULT NULL,
  `academic_year` int(11) NOT NULL DEFAULT year(curdate())
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `academicstaff_clearance`
--

INSERT INTO `academicstaff_clearance` (`id`, `student_id`, `name`, `last_name`, `department`, `reason`, `status`, `requested_at`, `reject_reason`, `academic_year`) VALUES
(77, 'DBU001', 'Awoke', 'Derssie', 'Information Technology', 'sssssss', 'pending', '2025-10-28 09:12:41', NULL, 2025),
(78, 'DBU002', 'Kirubel', 'Gelaw', 'Information System', 'eeeeeeeeee', 'pending', '2025-10-28 09:19:51', NULL, 2025),
(79, 'DBU003', 'Azanaw', 'Nega', 'Information Technology', 'eeeeeeeeee', 'pending', '2025-10-28 09:20:08', NULL, 2025);

-- --------------------------------------------------------

--
-- Table structure for table `admin`
--

CREATE TABLE `admin` (
  `id` int(11) NOT NULL,
  `name` varchar(50) NOT NULL,
  `last_name` varchar(50) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `email` varchar(100) NOT NULL,
  `phone` char(10) NOT NULL,
  `role` varchar(50) NOT NULL,
  `department_name` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `admin`
--

INSERT INTO `admin` (`id`, `name`, `last_name`, `username`, `password`, `email`, `phone`, `role`, `department_name`) VALUES
(1, 'Aman', 'Baye', 'cafeteria', '$2y$10$YvFelcJKQLn.ZW5HRcZxWu3yZsojj9ar3Ixr3VUXLRiDrI/MGinAC', 'admin@university.edu', '0912345678', 'cafeteria_admin', NULL),
(2, 'Azanaw', 'Nega', 'system', '$2y$10$nIWSWPzLoXwBlT4.xePNuOD7wyikIM4lUDDB58nLtDF.m9w5Z6YZ.', 'aza@gmail.com', '0986767676', 'system_admin', NULL),
(3, 'Awoke', 'Derssie', 'registrar', '$2y$10$nr5jaHlx18dUgrbCjKe3z.B8XHvbDm5Cd3j6Kw32PpYorRJpn4UBG', 'tomasderese49@gmail.com', '0939013630', 'registrar_admin', NULL),
(10, 'Amanuel', 'Neby', 'dormitory', '$2y$10$RvcEI1/AvazqTMxGg4WmX.kxlxmPnw53mlO3qDIobGJu.xaDPqKzW', 'tomasdere@gmail.com', '0939013630', 'dormitory_admin', NULL),
(11, 'Aman', 'Adis', 'library', '$2y$10$2BI9RekmX2NdanbBcqWMouVzb7j3R4Nuns5bg5cEILNI8bT3kQ7h2', 'adsmin@university.edu', '0912345678', 'library_admin', NULL),
(13, 'Tadele', 'Derso', 'department', '$2y$10$hneo0kNcPOr7L1teMuq/Y.XN.NGi7lAjUxijThaxbz7yDA7itIHga', 'adsvmin@university.edu', '0915166228', 'department_admin', 'Information Technology'),
(17, 'Abrham', 'Daniel', 'protector', '$2y$10$FUziIUpA.2BxmjaKzfuLI.8Abnr0b9W5qsIVRYiimC80Z8MPfEpOy', 'tilahunsitotaw418@gmail.com', '0939013639', 'personal_protector', NULL),
(19, 'Abrham', 'Daniel', 'abrham', '$2y$10$dvPY9dDCXU1sNgOSp/gzcO6S.eaPqicQeUW3y.lYd1fze2/9GrhU2', 'kman5819@gmail.com', '0939013639', 'department_admin', 'Accounting'),
(20, 'Awoke', 'Derssie', 'awoke123', '$2y$10$SG70nBAvnM/xpPk2IIf4Z.BjFtJCy0/fRgCJnd52bzIPsBwCsUNEW', 'tomasderee49@gmail.com', '0939013639', 'department_admin', 'Information System');

-- --------------------------------------------------------

--
-- Table structure for table `cafeteria_clearance`
--

CREATE TABLE `cafeteria_clearance` (
  `id` int(11) NOT NULL,
  `student_id` varchar(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `last_name` varchar(100) NOT NULL,
  `department` varchar(100) NOT NULL,
  `reason` text DEFAULT NULL,
  `status` enum('pending','approved','rejected') DEFAULT 'pending',
  `reject_reason` text DEFAULT NULL,
  `requested_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `academic_year` int(11) NOT NULL DEFAULT year(curdate())
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `cafeteria_clearance`
--

INSERT INTO `cafeteria_clearance` (`id`, `student_id`, `name`, `last_name`, `department`, `reason`, `status`, `reject_reason`, `requested_at`, `academic_year`) VALUES
(63, 'DBU001', 'Awoke', 'Derssie', 'Information Technology', 'sssssss', 'approved', NULL, '2025-10-28 09:12:41', 2025),
(64, 'DBU002', 'Kirubel', 'Gelaw', 'Information System', 'eeeeeeeeee', 'approved', NULL, '2025-10-28 09:19:51', 2025),
(65, 'DBU003', 'Azanaw', 'Nega', 'Information Technology', 'eeeeeeeeee', 'approved', NULL, '2025-10-28 09:20:08', 2025);

-- --------------------------------------------------------

--
-- Table structure for table `contact_messages`
--

CREATE TABLE `contact_messages` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `message` text NOT NULL,
  `submitted_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `is_read` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0=unread, 1=read'
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `department_clearance`
--

CREATE TABLE `department_clearance` (
  `id` int(11) NOT NULL,
  `student_id` varchar(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `last_name` varchar(100) NOT NULL,
  `department` varchar(100) NOT NULL,
  `reason` text NOT NULL,
  `status` enum('pending','approved','rejected') DEFAULT 'pending',
  `requested_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `reject_reason` text DEFAULT NULL,
  `academic_year` int(11) NOT NULL DEFAULT year(curdate())
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `department_clearance`
--

INSERT INTO `department_clearance` (`id`, `student_id`, `name`, `last_name`, `department`, `reason`, `status`, `requested_at`, `reject_reason`, `academic_year`) VALUES
(64, 'DBU001', 'Awoke', 'Derssie', 'Information Technology', 'sssssss', 'approved', '2025-10-28 09:12:41', NULL, 2025),
(65, 'DBU002', 'Kirubel', 'Gelaw', 'Information System', 'eeeeeeeeee', 'approved', '2025-10-28 09:19:51', NULL, 2025),
(66, 'DBU003', 'Azanaw', 'Nega', 'Information Technology', 'eeeeeeeeee', 'approved', '2025-10-28 09:20:08', NULL, 2025);

-- --------------------------------------------------------

--
-- Table structure for table `dormitory_clearance`
--

CREATE TABLE `dormitory_clearance` (
  `id` int(11) NOT NULL,
  `student_id` varchar(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `last_name` varchar(100) NOT NULL,
  `department` varchar(100) NOT NULL,
  `reason` text NOT NULL,
  `status` enum('pending','approved','rejected') DEFAULT 'pending',
  `requested_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `reject_reason` text DEFAULT NULL,
  `academic_year` int(11) NOT NULL DEFAULT year(curdate())
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `dormitory_clearance`
--

INSERT INTO `dormitory_clearance` (`id`, `student_id`, `name`, `last_name`, `department`, `reason`, `status`, `requested_at`, `reject_reason`, `academic_year`) VALUES
(57, 'DBU001', 'Awoke', 'Derssie', 'Information Technology', 'sssssss', 'approved', '2025-10-28 09:12:41', NULL, 2025),
(58, 'DBU002', 'Kirubel', 'Gelaw', 'Information System', 'eeeeeeeeee', 'approved', '2025-10-28 09:19:51', NULL, 2025),
(59, 'DBU003', 'Azanaw', 'Nega', 'Information Technology', 'eeeeeeeeee', 'approved', '2025-10-28 09:20:08', NULL, 2025);

-- --------------------------------------------------------

--
-- Table structure for table `final_clearance`
--

CREATE TABLE `final_clearance` (
  `id` int(11) NOT NULL,
  `student_id` varchar(20) NOT NULL,
  `name` varchar(50) NOT NULL,
  `last_name` varchar(50) NOT NULL,
  `message` text NOT NULL,
  `year` varchar(10) NOT NULL,
  `status` enum('pending','approved','rejected','finalized') DEFAULT 'pending',
  `reject_reason` varchar(255) DEFAULT NULL,
  `date_sent` timestamp NOT NULL DEFAULT current_timestamp(),
  `department` varchar(100) DEFAULT NULL,
  `academic_year` int(11) NOT NULL DEFAULT year(curdate()),
  `is_read` tinyint(4) DEFAULT 0,
  `email_sent` tinyint(1) DEFAULT 0,
  `email_sent_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `library_clearance`
--

CREATE TABLE `library_clearance` (
  `id` int(11) NOT NULL,
  `student_id` varchar(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `last_name` varchar(100) NOT NULL,
  `department` varchar(100) NOT NULL,
  `reason` text NOT NULL,
  `status` enum('pending','approved','rejected') DEFAULT 'pending',
  `reject_reason` text DEFAULT NULL,
  `requested_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `academic_year` int(11) NOT NULL DEFAULT year(curdate())
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `library_clearance`
--

INSERT INTO `library_clearance` (`id`, `student_id`, `name`, `last_name`, `department`, `reason`, `status`, `reject_reason`, `requested_at`, `academic_year`) VALUES
(87, 'DBU001', 'Awoke', 'Derssie', 'Information Technology', 'sssssss', 'approved', NULL, '2025-10-28 09:12:41', 2025),
(88, 'DBU002', 'Kirubel', 'Gelaw', 'Information System', 'eeeeeeeeee', 'approved', NULL, '2025-10-28 09:19:51', 2025),
(89, 'DBU003', 'Azanaw', 'Nega', 'Information Technology', 'eeeeeeeeee', 'approved', NULL, '2025-10-28 09:20:08', 2025);

-- --------------------------------------------------------

--
-- Table structure for table `student`
--

CREATE TABLE `student` (
  `id` int(11) NOT NULL,
  `student_id` varchar(11) NOT NULL,
  `name` varchar(50) NOT NULL,
  `last_name` varchar(50) NOT NULL,
  `phone` char(10) NOT NULL,
  `email` varchar(100) NOT NULL,
  `department` varchar(100) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `year` varchar(20) DEFAULT '1st Year',
  `semester` varchar(10) NOT NULL DEFAULT '1',
  `profile_picture` varchar(255) DEFAULT NULL,
  `status` enum('active','inactive') DEFAULT 'active',
  `reset_code` varchar(10) DEFAULT NULL,
  `reset_code_expires` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Dumping data for table `student`
--

INSERT INTO `student` (`id`, `student_id`, `name`, `last_name`, `phone`, `email`, `department`, `username`, `password`, `year`, `semester`, `profile_picture`, `status`, `reset_code`, `reset_code_expires`) VALUES
(97, 'DBU001', 'Awoke', 'Derssie', '0939013639', 'tomasderese49@gmail.com', 'Information Technology', 'awoke123', '$2y$10$ECliBq22OLcYQKYtpgz/J.w.iDnbT4gPM.5kcjz3RpHRh6k7K9/cy', '3', '2', NULL, 'active', NULL, NULL),
(98, 'DBU002', 'Kirubel', 'Gelaw', '0939013639', 'kman5819@gmail.com', 'Information System', 'kiru123', '$2y$10$GTiiPQPiMRY0zCOLjynYf.UCV.7wbnQ3KRtCyqJ6X2Xhb3Fn7VvkW', '3', '2', NULL, 'active', NULL, NULL),
(99, 'DBU003', 'Azanaw', 'Nega', '0939013639', 'tilahunsitotaw418@gmail.com', 'Information Technology', 'aze123', '$2y$10$BZrOsT0Ebwu299MlVnVrr.cRED5RICqn0HJyNSn3ohxBFs9A6RNdy', '3', '2', NULL, 'active', NULL, NULL);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `academicstaff_clearance`
--
ALTER TABLE `academicstaff_clearance`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_academicstaff_clearance_student` (`student_id`);

--
-- Indexes for table `admin`
--
ALTER TABLE `admin`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `cafeteria_clearance`
--
ALTER TABLE `cafeteria_clearance`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_cafeteria_clearance_student` (`student_id`);

--
-- Indexes for table `contact_messages`
--
ALTER TABLE `contact_messages`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `department_clearance`
--
ALTER TABLE `department_clearance`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_department_clearance_student` (`student_id`);

--
-- Indexes for table `dormitory_clearance`
--
ALTER TABLE `dormitory_clearance`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_dormitory_clearance_student` (`student_id`);

--
-- Indexes for table `final_clearance`
--
ALTER TABLE `final_clearance`
  ADD KEY `fk_final_clearance_student` (`student_id`);

--
-- Indexes for table `library_clearance`
--
ALTER TABLE `library_clearance`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_library_clearance_student` (`student_id`);

--
-- Indexes for table `student`
--
ALTER TABLE `student`
  ADD PRIMARY KEY (`student_id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `unique_id` (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `academicstaff_clearance`
--
ALTER TABLE `academicstaff_clearance`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=80;

--
-- AUTO_INCREMENT for table `admin`
--
ALTER TABLE `admin`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT for table `cafeteria_clearance`
--
ALTER TABLE `cafeteria_clearance`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=66;

--
-- AUTO_INCREMENT for table `contact_messages`
--
ALTER TABLE `contact_messages`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `department_clearance`
--
ALTER TABLE `department_clearance`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=67;

--
-- AUTO_INCREMENT for table `dormitory_clearance`
--
ALTER TABLE `dormitory_clearance`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=60;

--
-- AUTO_INCREMENT for table `library_clearance`
--
ALTER TABLE `library_clearance`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=90;

--
-- AUTO_INCREMENT for table `student`
--
ALTER TABLE `student`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=100;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `academicstaff_clearance`
--
ALTER TABLE `academicstaff_clearance`
  ADD CONSTRAINT `fk_academicstaff_clearance_student` FOREIGN KEY (`student_id`) REFERENCES `student` (`student_id`) ON DELETE CASCADE;

--
-- Constraints for table `cafeteria_clearance`
--
ALTER TABLE `cafeteria_clearance`
  ADD CONSTRAINT `fk_cafeteria_clearance_student` FOREIGN KEY (`student_id`) REFERENCES `student` (`student_id`) ON DELETE CASCADE;

--
-- Constraints for table `department_clearance`
--
ALTER TABLE `department_clearance`
  ADD CONSTRAINT `fk_department_clearance_student` FOREIGN KEY (`student_id`) REFERENCES `student` (`student_id`) ON DELETE CASCADE;

--
-- Constraints for table `dormitory_clearance`
--
ALTER TABLE `dormitory_clearance`
  ADD CONSTRAINT `fk_dormitory_clearance_student` FOREIGN KEY (`student_id`) REFERENCES `student` (`student_id`) ON DELETE CASCADE;

--
-- Constraints for table `final_clearance`
--
ALTER TABLE `final_clearance`
  ADD CONSTRAINT `fk_final_clearance_student` FOREIGN KEY (`student_id`) REFERENCES `student` (`student_id`) ON DELETE CASCADE;

--
-- Constraints for table `library_clearance`
--
ALTER TABLE `library_clearance`
  ADD CONSTRAINT `fk_library_clearance_student` FOREIGN KEY (`student_id`) REFERENCES `student` (`student_id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
