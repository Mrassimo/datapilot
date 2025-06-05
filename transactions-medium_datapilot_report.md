🤖 DATAPILOT COMPLETE ANALYSIS ENGINE
======================================
Analysis Target: transactions-medium.csv
Report Generated: 2025-06-05 22:48:30 (UTC)
DataPilot Version: v1.0.0 (TypeScript Edition)

---
### Section 1: Comprehensive Dataset & Analysis Overview
This section provides a detailed snapshot of the dataset properties, how it was processed, and the context of this analysis run.

**1.1. Input Data File Details:**
    * Original Filename: `transactions-medium.csv`
    * Full Resolved Path: `/Users/[user]/plum/test-datasets/large/transactions-medium.csv`
    * File Size (on disk): 11.28 MB
    * MIME Type (detected/inferred): `text/csv`
    * File Last Modified (OS Timestamp): 2025-06-05 22:14:53 (UTC)
    * File Hash (SHA256): `356ef3df53bd1c9dde3b6de0f56b2fea36a5d2eb4e3559980109e693ef68ab85`

**1.2. Data Ingestion & Parsing Parameters:**
    * Data Source Type: Local File System
    * Parsing Engine Utilized: DataPilot Advanced CSV Parser v1.0.0
    * Time Taken for Parsing & Initial Load: 0.298 seconds
    * Detected Character Encoding: `utf8`
        * Encoding Detection Method: Statistical Character Pattern Analysis
        * Encoding Confidence: High (95%)
    * Detected Delimiter Character: `,` (Comma)
        * Delimiter Detection Method: Character Frequency Analysis with Field Consistency Scoring
        * Delimiter Confidence: High (100%)
    * Detected Line Ending Format: `CRLF (Windows-style)`
    * Detected Quoting Character: `"`
        * Empty Lines Encountered: 0
    * Header Row Processing:
        * Header Presence: Detected
        * Header Row Number(s): 1
        * Column Names Derived From: First row interpreted as column headers
    * Byte Order Mark (BOM): Not Detected
    * Initial Row/Line Scan Limit for Detection: First 1048576 bytes or 1000 lines

**1.3. Dataset Structural Dimensions & Initial Profile:**
    * Total Rows Read (including header, if any): 100,001
    * Total Rows of Data (excluding header): 100,000
    * Total Columns Detected: 15
    * Total Data Cells (Data Rows × Columns): 1,500,000
    * List of Column Names (15) and Original Index:
        1.  (Index 0) `transaction_id`
        2.  (Index 1) `timestamp`
        3.  (Index 2) `customer_id`
        4.  (Index 3) `product_id`
        5.  (Index 4) `category`
        6.  (Index 5) `quantity`
        7.  (Index 6) `unit_price`
        8.  (Index 7) `total_amount`
        9.  (Index 8) `payment_method`
        10.  (Index 9) `store_location`
        11.  (Index 10) `discount_applied`
        12.  (Index 11) `customer_age`
        13.  (Index 12) `customer_segment`
        14.  (Index 13) `rating`
        15.  (Index 14) `returned`
    * Estimated In-Memory Size (Post-Parsing & Initial Type Guessing): 71.97 MB
    * Average Row Length (bytes, approximate): 118 bytes
    * Dataset Sparsity (Initial Estimate): Dense dataset with minimal missing values (0.67% sparse cells via Statistical sampling of 10000 rows)

**1.4. Analysis Configuration & Execution Context:**
    * Full Command Executed: `datapilot overview /Users/massimoraso/plum/test-datasets/large/transactions-medium.csv`
    * Analysis Mode Invoked: Comprehensive Deep Scan
    * Timestamp of Analysis Start: 2025-06-05 22:48:29 (UTC)
    * Global Dataset Sampling Strategy: Full dataset analysis (No record sampling applied for initial overview)
    * DataPilot Modules Activated for this Run: File I/O Manager, Advanced CSV Parser, Metadata Collector, Structural Analyzer, Report Generator
    * Processing Time for Section 1 Generation: 0.345 seconds
    * Host Environment Details:
        * Operating System: macOS (Unknown Version)
        * System Architecture: ARM64 (Apple Silicon/ARM 64-bit)
        * Execution Runtime: Node.js v23.6.1 (V8 12.9.202.28-node.12) on darwin
        * Available CPU Cores / Memory (at start of analysis): 8 cores / 8 GB

---
### Performance Metrics

**Processing Performance:**
    * Total Analysis Time: 0.346 seconds
    * File analysis: 0.039s
    * Parsing: 0.299s
    * Structural analysis: 0.006s