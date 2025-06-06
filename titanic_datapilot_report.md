🤖 DATAPILOT COMPLETE ANALYSIS ENGINE
======================================
Analysis Target: titanic.csv
Report Generated: 2025-06-06 13:14:12 (UTC)
DataPilot Version: v1.0.0 (TypeScript Edition)

---
### Section 1: Comprehensive Dataset & Analysis Overview
This section provides a detailed snapshot of the dataset properties, how it was processed, and the context of this analysis run.

**1.1. Input Data File Details:**
    * Original Filename: `titanic.csv`
    * Full Resolved Path: `/Users/[user]/plum/titanic.csv`
    * File Size (on disk): 0.057508 MB
    * MIME Type (detected/inferred): `text/csv`
    * File Last Modified (OS Timestamp): 2025-06-06 13:12:54 (UTC)
    * File Hash (SHA256): `4a437fde05fe5264e1701a7387ac6fb75393772ba38bb2c9c566405af5af4bd7`

**1.2. Data Ingestion & Parsing Parameters:**
    * Data Source Type: Local File System
    * Parsing Engine Utilized: DataPilot Advanced CSV Parser v1.0.0
    * Time Taken for Parsing & Initial Load: 0.005 seconds
    * Detected Character Encoding: `utf8`
        * Encoding Detection Method: Statistical Character Pattern Analysis
        * Encoding Confidence: High (95%)
    * Detected Delimiter Character: `,` (Comma)
        * Delimiter Detection Method: Character Frequency Analysis with Field Consistency Scoring
        * Delimiter Confidence: High (90%)
    * Detected Line Ending Format: `LF (Unix-style)`
    * Detected Quoting Character: `"`
        * Empty Lines Encountered: 1
    * Header Row Processing:
        * Header Presence: Not Detected
        * Header Row Number(s): N/A
        * Column Names Derived From: Generated column indices (Col_0, Col_1, etc.)
    * Byte Order Mark (BOM): Not Detected
    * Initial Row/Line Scan Limit for Detection: First 60302 bytes or 1000 lines

**1.3. Dataset Structural Dimensions & Initial Profile:**
    * Total Rows Read (including header, if any): 892
    * Total Rows of Data (excluding header): 892
    * Total Columns Detected: 12
    * Total Data Cells (Data Rows × Columns): 10,704
    * List of Column Names (12) and Original Index:
        1.  (Index 0) `Col_0`
        2.  (Index 1) `Col_1`
        3.  (Index 2) `Col_2`
        4.  (Index 3) `Col_3`
        5.  (Index 4) `Col_4`
        6.  (Index 5) `Col_5`
        7.  (Index 6) `Col_6`
        8.  (Index 7) `Col_7`
        9.  (Index 8) `Col_8`
        10.  (Index 9) `Col_9`
        11.  (Index 10) `Col_10`
        12.  (Index 11) `Col_11`
    * Estimated In-Memory Size (Post-Parsing & Initial Type Guessing): 0.45 MB
    * Average Row Length (bytes, approximate): 66 bytes
    * Dataset Sparsity (Initial Estimate): Moderately dense with some missing values (8.09% sparse cells via Full dataset analysis)

**1.4. Analysis Configuration & Execution Context:**
    * Full Command Executed: `datapilot overview /Users/massimoraso/plum/titanic.csv`
    * Analysis Mode Invoked: Comprehensive Deep Scan
    * Timestamp of Analysis Start: 2025-06-06 13:14:12 (UTC)
    * Global Dataset Sampling Strategy: Full dataset analysis (No record sampling applied for initial overview)
    * DataPilot Modules Activated for this Run: File I/O Manager, Advanced CSV Parser, Metadata Collector, Structural Analyzer, Report Generator
    * Processing Time for Section 1 Generation: 0.008 seconds
    * Host Environment Details:
        * Operating System: macOS (Unknown Version)
        * System Architecture: ARM64 (Apple Silicon/ARM 64-bit)
        * Execution Runtime: Node.js v23.6.1 (V8 12.9.202.28-node.12) on darwin
        * Available CPU Cores / Memory (at start of analysis): 8 cores / 8 GB

---
### Performance Metrics

**Processing Performance:**
    * Total Analysis Time: 0.008 seconds
    * File analysis: 0.002s
    * Parsing: 0.005s
    * Structural analysis: 0.001s