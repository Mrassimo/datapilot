🤖 DATAPILOT COMPLETE ANALYSIS ENGINE
======================================
Analysis Target: Medicaldataset.csv
Report Generated: 2025-06-06 03:12:25 (UTC)
DataPilot Version: v1.0.0 (TypeScript Edition)

---
### Section 1: Comprehensive Dataset & Analysis Overview
This section provides a detailed snapshot of the dataset properties, how it was processed, and the context of this analysis run.

**1.1. Input Data File Details:**
    * Original Filename: `Medicaldataset.csv`
    * Full Resolved Path: `/Users/[user]/plum/test-datasets/kaggle/Medicaldataset.csv`
    * File Size (on disk): 0.04993 MB
    * MIME Type (detected/inferred): `text/csv`
    * File Last Modified (OS Timestamp): 2025-06-05 11:34:05 (UTC)
    * File Hash (SHA256): `ba28e4585e736fff12f0232c9d139f944e374c2c29c32594b3c6bae44b6348e0`

**1.2. Data Ingestion & Parsing Parameters:**
    * Data Source Type: Local File System
    * Parsing Engine Utilized: DataPilot Advanced CSV Parser v1.0.0
    * Time Taken for Parsing & Initial Load: 0.011 seconds
    * Detected Character Encoding: `utf8`
        * Encoding Detection Method: Statistical Character Pattern Analysis
        * Encoding Confidence: High (90%)
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
    * Byte Order Mark (BOM): Not Detected
    * Initial Row/Line Scan Limit for Detection: First 52355 bytes or 1000 lines

**1.3. Dataset Structural Dimensions & Initial Profile:**
    * Total Rows Read (including header, if any): 1,320
    * Total Rows of Data (excluding header): 1,319
    * Total Columns Detected: 9
    * Total Data Cells (Data Rows × Columns): 11,871
    * List of Column Names (9) and Original Index:
        1.  (Index 0) `Age`
        2.  (Index 1) `Gender`
        3.  (Index 2) `Heart rate`
        4.  (Index 3) `Systolic blood pressure`
        5.  (Index 4) `Diastolic blood pressure`
        6.  (Index 5) `Blood sugar`
        7.  (Index 6) `CK-MB`
        8.  (Index 7) `Troponin`
        9.  (Index 8) `Result`
    * Estimated In-Memory Size (Post-Parsing & Initial Type Guessing): 0.48 MB
    * Average Row Length (bytes, approximate): 39 bytes
    * Dataset Sparsity (Initial Estimate): Dense dataset with minimal missing values (0% sparse cells via Full dataset analysis)

**1.4. Analysis Configuration & Execution Context:**
    * Full Command Executed: `datapilot overview /Users/massimoraso/plum/test-datasets/kaggle/Medicaldataset.csv`
    * Analysis Mode Invoked: Comprehensive Deep Scan
    * Timestamp of Analysis Start: 2025-06-06 03:12:25 (UTC)
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
    * File analysis: 0.002s
    * Parsing: 0.011s
    * Structural analysis: 0.002s