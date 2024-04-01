-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Apr 01, 2024 at 06:11 AM
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
-- Database: `aitamportal`
--

-- --------------------------------------------------------

--
-- Table structure for table `alldata`
--

CREATE TABLE `alldata` (
  `id` int(11) NOT NULL,
  `branch` varchar(255) DEFAULT NULL,
  `roll_number` varchar(255) DEFAULT NULL,
  `message` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `status` varchar(50) DEFAULT NULL,
  `ref_id` varchar(255) DEFAULT NULL,
  `type` varchar(255) DEFAULT NULL,
  `solved_at` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `alldata`
--

INSERT INTO `alldata` (`id`, `branch`, `roll_number`, `message`, `created_at`, `status`, `ref_id`, `type`, `solved_at`) VALUES
(1, 'mec', '1', '1', '2024-03-26 18:03:19', 'solved', 'REF00000202403262333', 'water', '2024-03-26 23:34:04'),
(2, 'cse', '1111111111111142', 'driance  hh', '2024-03-27 04:30:50', 'solved', 'REF00000202403271000', 'water', '2024-03-27 10:02:50'),
(3, 'csm', '111111111111111142', '\r\nsed', '2024-03-27 04:34:08', 'solved', 'REF00000202403271004', 'water', '2024-03-28 20:56:45'),
(4, 'cse', '56y12651029', '1029', '2024-03-27 04:59:16', 'solved', 'REF00000202403271029', 'network', '2024-03-27 11:05:45'),
(5, 'csm', '22', '2', '2024-03-27 05:08:10', 'processing', 'REF00000202403271038', 'water', NULL),
(6, 'csm', '44442', '\r\nsed', '2024-03-27 05:45:29', 'solved', 'REF00000202403271115', 'water', '2024-03-27 11:18:37'),
(7, 'cse', '1', '1', '2024-03-28 15:25:43', 'pending', 'REF00000202403282055', 'network', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `civil`
--

CREATE TABLE `civil` (
  `id` int(11) NOT NULL,
  `branch` varchar(255) DEFAULT NULL,
  `roll_number` varchar(255) DEFAULT NULL,
  `message` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `status` varchar(50) DEFAULT 'pending',
  `ref_id` varchar(20) DEFAULT NULL,
  `type` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `complaints`
--

CREATE TABLE `complaints` (
  `id` int(11) NOT NULL,
  `branch` varchar(255) DEFAULT NULL,
  `roll_number` varchar(255) DEFAULT NULL,
  `message` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `status` varchar(50) DEFAULT 'pending',
  `ref_id` varchar(20) DEFAULT NULL,
  `type` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `complaints`
--

INSERT INTO `complaints` (`id`, `branch`, `roll_number`, `message`, `created_at`, `status`, `ref_id`, `type`) VALUES
(7, 'cse', '1', '1', '2024-03-28 15:25:43', 'pending', 'REF00000202403282055', 'network');

--
-- Triggers `complaints`
--
DELIMITER $$
CREATE TRIGGER `copy_complaint_type_to_alldata` AFTER INSERT ON `complaints` FOR EACH ROW BEGIN
    DECLARE complaint_type VARCHAR(255);
    
    
    SELECT type INTO complaint_type FROM complaints WHERE ref_id = NEW.ref_id LIMIT 1;
    
    
    UPDATE alldata SET type = complaint_type WHERE ref_id = NEW.ref_id;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `generate_ref_id` BEFORE INSERT ON `complaints` FOR EACH ROW BEGIN
    DECLARE ref_id VARCHAR(20);
    
    
    SET ref_id = CONCAT('REF', LPAD(NEW.id, 5, '0'), DATE_FORMAT(NEW.created_at, '%Y%m%d%H%i%s'));
    
    
    SET NEW.ref_id = ref_id;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `insert_alldata` AFTER INSERT ON `complaints` FOR EACH ROW BEGIN
    INSERT INTO alldata (branch, roll_number, message, created_at, status, ref_id)
    VALUES (NEW.branch, NEW.roll_number, NEW.message, NEW.created_at, NEW.status, NEW.ref_id);
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `cse`
--

CREATE TABLE `cse` (
  `id` int(11) NOT NULL,
  `branch` varchar(255) DEFAULT NULL,
  `roll_number` varchar(255) DEFAULT NULL,
  `message` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `status` varchar(50) DEFAULT 'pending',
  `ref_id` varchar(20) DEFAULT NULL,
  `type` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `csm`
--

CREATE TABLE `csm` (
  `id` int(11) NOT NULL,
  `branch` varchar(255) DEFAULT NULL,
  `roll_number` varchar(255) DEFAULT NULL,
  `message` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `status` varchar(50) DEFAULT 'pending',
  `ref_id` varchar(20) DEFAULT NULL,
  `type` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `csm`
--

INSERT INTO `csm` (`id`, `branch`, `roll_number`, `message`, `created_at`, `status`, `ref_id`, `type`) VALUES
(1, 'csm', '22', '2', '2024-03-27 05:08:10', 'pending', 'REF00000202403271038', 'water');

-- --------------------------------------------------------

--
-- Table structure for table `ece`
--

CREATE TABLE `ece` (
  `id` int(11) NOT NULL,
  `branch` varchar(255) DEFAULT NULL,
  `roll_number` varchar(255) DEFAULT NULL,
  `message` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `status` varchar(50) DEFAULT 'pending',
  `ref_id` varchar(20) DEFAULT NULL,
  `type` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `eee`
--

CREATE TABLE `eee` (
  `id` int(11) NOT NULL,
  `branch` varchar(255) DEFAULT NULL,
  `roll_number` varchar(255) DEFAULT NULL,
  `message` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `status` varchar(50) DEFAULT 'pending',
  `ref_id` varchar(20) DEFAULT NULL,
  `type` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `mec`
--

CREATE TABLE `mec` (
  `id` int(11) NOT NULL,
  `branch` varchar(255) DEFAULT NULL,
  `roll_number` varchar(255) DEFAULT NULL,
  `message` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `status` varchar(50) DEFAULT 'pending',
  `ref_id` varchar(20) DEFAULT NULL,
  `type` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `solved`
--

CREATE TABLE `solved` (
  `id` int(11) NOT NULL,
  `branch` varchar(255) DEFAULT NULL,
  `roll_number` varchar(255) DEFAULT NULL,
  `message` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `status` varchar(50) DEFAULT 'solved',
  `ref_id` varchar(20) DEFAULT NULL,
  `type` varchar(255) DEFAULT NULL,
  `solved_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `solved`
--

INSERT INTO `solved` (`id`, `branch`, `roll_number`, `message`, `created_at`, `status`, `ref_id`, `type`, `solved_at`) VALUES
(1, 'mec', '1', '1', '2024-03-26 18:03:19', 'solved', 'REF00000202403262333', 'water', '2024-03-26 18:04:04'),
(2, 'cse', '1111111111111142', 'driance  hh', '2024-03-27 04:30:50', 'solved', 'REF00000202403271000', 'water', '2024-03-27 04:32:50'),
(3, 'cse', '56y12651029', '1029', '2024-03-27 04:59:16', 'solved', 'REF00000202403271029', 'network', '2024-03-27 05:35:45'),
(4, 'csm', '44442', '\r\nsed', '2024-03-27 05:45:29', 'solved', 'REF00000202403271115', 'water', '2024-03-27 05:48:37'),
(5, 'csm', '111111111111111142', '\r\nsed', '2024-03-27 04:34:08', 'solved', 'REF00000202403271004', 'water', '2024-03-28 15:26:45');

--
-- Triggers `solved`
--
DELIMITER $$
CREATE TRIGGER `solved_insert_trigger` BEFORE INSERT ON `solved` FOR EACH ROW BEGIN
    SET NEW.solved_at = CURRENT_TIMESTAMP;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `update_alldata_solved_at` AFTER INSERT ON `solved` FOR EACH ROW BEGIN
    UPDATE alldata
    SET solved_at = NEW.solved_at
    WHERE ref_id = NEW.ref_id;
END
$$
DELIMITER ;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `alldata`
--
ALTER TABLE `alldata`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `civil`
--
ALTER TABLE `civil`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `complaints`
--
ALTER TABLE `complaints`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `cse`
--
ALTER TABLE `cse`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `csm`
--
ALTER TABLE `csm`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `ece`
--
ALTER TABLE `ece`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `eee`
--
ALTER TABLE `eee`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `mec`
--
ALTER TABLE `mec`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `solved`
--
ALTER TABLE `solved`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `alldata`
--
ALTER TABLE `alldata`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `civil`
--
ALTER TABLE `civil`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `complaints`
--
ALTER TABLE `complaints`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `cse`
--
ALTER TABLE `cse`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `csm`
--
ALTER TABLE `csm`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `ece`
--
ALTER TABLE `ece`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `eee`
--
ALTER TABLE `eee`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `mec`
--
ALTER TABLE `mec`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `solved`
--
ALTER TABLE `solved`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
