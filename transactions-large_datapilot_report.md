🤖 DATAPILOT COMPLETE ANALYSIS ENGINE
======================================
Analysis Target: transactions-large.csv
Report Generated: 2025-06-05 22:15:10 (UTC)
DataPilot Version: v1.0.0 (TypeScript Edition)

---
### Section 1: Comprehensive Dataset & Analysis Overview
This section provides a detailed snapshot of the dataset properties, how it was processed, and the context of this analysis run.

**1.1. Input Data File Details:**
    * Original Filename: `transactions-large.csv`
    * Full Resolved Path: `/Users/[user]/plum/test-datasets/large/transactions-large.csv`
    * File Size (on disk): 112.74 MB
    * MIME Type (detected/inferred): `text/csv`
    * File Last Modified (OS Timestamp): 2025-06-05 22:10:33 (UTC)
    * File Hash (SHA256): `fbe632917255eaae6e68f299599fe85de587900ba9e0c15d2fb4208dc3ebc56c`

**1.2. Data Ingestion & Parsing Parameters:**
    * Data Source Type: Local File System
    * Parsing Engine Utilized: DataPilot Advanced CSV Parser v1.0.0
    * Time Taken for Parsing & Initial Load: 2.272 seconds
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
    * Total Rows Read (including header, if any): 1,000,000
    * Total Rows of Data (excluding header): 999,999
    * Total Columns Detected: 15
    * Total Data Cells (Data Rows × Columns): 14,999,985
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
    * Estimated In-Memory Size (Post-Parsing & Initial Type Guessing): 719.52 MB
    * Average Row Length (bytes, approximate): 118 bytes
    * Dataset Sparsity (Initial Estimate): Dense dataset with minimal missing values (0.64% sparse cells via Statistical sampling of 10000 rows)

**1.4. Analysis Configuration & Execution Context:**
    * Full Command Executed: `datapilot overview /Users/massimoraso/plum/test-datasets/large/transactions-large.csv`
    * Analysis Mode Invoked: Comprehensive Deep Scan
    * Timestamp of Analysis Start: 2025-06-05 22:15:07 (UTC)
    * Global Dataset Sampling Strategy: Full dataset analysis (No record sampling applied for initial overview)
    * DataPilot Modules Activated for this Run: File I/O Manager, Advanced CSV Parser, Metadata Collector, Structural Analyzer, Report Generator
    * Processing Time for Section 1 Generation: 2.558 seconds
    * Host Environment Details:
        * Operating System: macOS (Unknown Version)
        * System Architecture: ARM64 (Apple Silicon/ARM 64-bit)
        * Execution Runtime: Node.js v23.6.1 (V8 12.9.202.28-node.12) on darwin
        * Available CPU Cores / Memory (at start of analysis): 8 cores / 8 GB

---
### Analysis Warnings

**File Warnings:**
    * ⚠️ Large file detected (112.7MB) (Suggestion: Consider using sampling options for very large datasets)

---
### Performance Metrics

**Processing Performance:**
    * Total Analysis Time: 2.558 seconds
    * File analysis: 0.278s
    * Parsing: 2.273s
    * Structural analysis: 0.006s