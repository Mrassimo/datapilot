🤖 DATAPILOT COMPLETE ANALYSIS ENGINE
======================================
Analysis Target: taco_sales_(2024-2025).csv
Report Generated: 2025-06-05 23:34:58 (UTC)
DataPilot Version: v1.0.0 (TypeScript Edition)

---
### Section 1: Comprehensive Dataset & Analysis Overview
This section provides a detailed snapshot of the dataset properties, how it was processed, and the context of this analysis run.

**1.1. Input Data File Details:**
    * Original Filename: `taco_sales_(2024-2025).csv`
    * Full Resolved Path: `/Users/[user]/plum/test-datasets/kaggle/taco_sales_(2024-2025).csv`
    * File Size (on disk): 0.1 MB
    * MIME Type (detected/inferred): `text/csv`
    * File Last Modified (OS Timestamp): 2025-06-05 11:33:57 (UTC)
    * File Hash (SHA256): `76c7c691a233c3fd81c47eec4b8fc865a27ae555a44e6af82a79d1a839c25574`

**1.2. Data Ingestion & Parsing Parameters:**
    * Data Source Type: Local File System
    * Parsing Engine Utilized: DataPilot Advanced CSV Parser v1.0.0
    * Time Taken for Parsing & Initial Load: 0.01 seconds
    * Detected Character Encoding: `utf8`
        * Encoding Detection Method: Byte Order Mark (BOM) Detection
        * Encoding Confidence: High (100%)
    * Detected Delimiter Character: `,` (Comma)
        * Delimiter Detection Method: Character Frequency Analysis with Field Consistency Scoring
        * Delimiter Confidence: High (100%)
    * Detected Line Ending Format: `CRLF (Windows-style)`
    * Detected Quoting Character: `"`
        * Empty Lines Encountered: 1
    * Header Row Processing:
        * Header Presence: Detected
        * Header Row Number(s): 1
        * Column Names Derived From: First row interpreted as column headers
    * Byte Order Mark (BOM): UTF-8 BOM Detected and Handled
    * Initial Row/Line Scan Limit for Detection: First 108307 bytes or 1000 lines

**1.3. Dataset Structural Dimensions & Initial Profile:**
    * Total Rows Read (including header, if any): 1,001
    * Total Rows of Data (excluding header): 1,000
    * Total Columns Detected: 13
    * Total Data Cells (Data Rows × Columns): 13,000
    * List of Column Names (13) and Original Index:
        1.  (Index 0) `Order ID`
        2.  (Index 1) `Restaurant Name`
        3.  (Index 2) `Location`
        4.  (Index 3) `Order Time`
        5.  (Index 4) `Delivery Time`
        6.  (Index 5) `Delivery Duration (min)`
        7.  (Index 6) `Taco Size`
        8.  (Index 7) `Taco Type`
        9.  (Index 8) `Toppings Count`
        10.  (Index 9) `Distance (km)`
        11.  (Index 10) `Price ($)`
        12.  (Index 11) `Tip ($)`
        13.  (Index 12) `Weekend Order`
    * Estimated In-Memory Size (Post-Parsing & Initial Type Guessing): 0.64 MB
    * Average Row Length (bytes, approximate): 107 bytes
    * Dataset Sparsity (Initial Estimate): Dense dataset with minimal missing values (0% sparse cells via Full dataset analysis)

**1.4. Analysis Configuration & Execution Context:**
    * Full Command Executed: `datapilot overview /Users/massimoraso/plum/test-datasets/kaggle/taco_sales_(2024-2025).csv`
    * Analysis Mode Invoked: Comprehensive Deep Scan
    * Timestamp of Analysis Start: 2025-06-05 23:34:58 (UTC)
    * Global Dataset Sampling Strategy: Full dataset analysis (No record sampling applied for initial overview)
    * DataPilot Modules Activated for this Run: File I/O Manager, Advanced CSV Parser, Metadata Collector, Structural Analyzer, Report Generator
    * Processing Time for Section 1 Generation: 0.016 seconds
    * Host Environment Details:
        * Operating System: macOS (Unknown Version)
        * System Architecture: ARM64 (Apple Silicon/ARM 64-bit)
        * Execution Runtime: Node.js v23.6.1 (V8 12.9.202.28-node.12) on darwin
        * Available CPU Cores / Memory (at start of analysis): 8 cores / 8 GB

---
### Performance Metrics

**Processing Performance:**
    * Total Analysis Time: 0.016 seconds
    * File analysis: 0.003s
    * Parsing: 0.011s
    * Structural analysis: 0.002s
    * Peak Memory Usage: 47.16 MB