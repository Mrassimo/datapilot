🤖 DATAPILOT COMPLETE ANALYSIS ENGINE
======================================
Analysis Target: wisc_bc_data.csv
Report Generated: 2025-06-06 09:16:32 (UTC)
DataPilot Version: v1.0.0 (TypeScript Edition)

---
### Section 1: Comprehensive Dataset & Analysis Overview
This section provides a detailed snapshot of the dataset properties, how it was processed, and the context of this analysis run.

**1.1. Input Data File Details:**
    * Original Filename: `wisc_bc_data.csv`
    * Full Resolved Path: `/Users/[user]/plum/test-datasets/wisc_bc_data.csv`
    * File Size (on disk): 0.119946 MB
    * MIME Type (detected/inferred): `text/csv`
    * File Last Modified (OS Timestamp): 2025-06-06 08:48:34 (UTC)
    * File Hash (SHA256): `def241f3adf050f003d6b00bec7b6d4d51aea16979f4a795ef1ca0a9ce114c7b`

**1.2. Data Ingestion & Parsing Parameters:**
    * Data Source Type: Local File System
    * Parsing Engine Utilized: DataPilot Advanced CSV Parser v1.0.0
    * Time Taken for Parsing & Initial Load: 0.007 seconds
    * Detected Character Encoding: `utf8`
        * Encoding Detection Method: Statistical Character Pattern Analysis
        * Encoding Confidence: High (95%)
    * Detected Delimiter Character: `,` (Comma)
        * Delimiter Detection Method: Character Frequency Analysis with Field Consistency Scoring
        * Delimiter Confidence: High (100%)
    * Detected Line Ending Format: `LF (Unix-style)`
    * Detected Quoting Character: `"`
        * Empty Lines Encountered: 1
    * Header Row Processing:
        * Header Presence: Detected
        * Header Row Number(s): 1
        * Column Names Derived From: First row interpreted as column headers
    * Byte Order Mark (BOM): Not Detected
    * Initial Row/Line Scan Limit for Detection: First 125773 bytes or 1000 lines

**1.3. Dataset Structural Dimensions & Initial Profile:**
    * Total Rows Read (including header, if any): 570
    * Total Rows of Data (excluding header): 569
    * Total Columns Detected: 32
    * Total Data Cells (Data Rows × Columns): 18,208
    * List of Column Names (32) and Original Index:
        1.  (Index 0) `id`
        2.  (Index 1) `diagnosis`
        3.  (Index 2) `radius_mean`
        4.  (Index 3) `texture_mean`
        5.  (Index 4) `perimeter_mean`
        6.  (Index 5) `area_mean`
        7.  (Index 6) `smoothness_mean`
        8.  (Index 7) `compactness_mean`
        9.  (Index 8) `concavity_mean`
        10.  (Index 9) `concave points_mean`
        11.  (Index 10) `symmetry_mean`
        12.  (Index 11) `fractal_dimension_mean`
        13.  (Index 12) `radius_se`
        14.  (Index 13) `texture_se`
        15.  (Index 14) `perimeter_se`
        16.  (Index 15) `area_se`
        17.  (Index 16) `smoothness_se`
        18.  (Index 17) `compactness_se`
        19.  (Index 18) `concavity_se`
        20.  (Index 19) `concave points_se`
        21.  (Index 20) `symmetry_se`
        22.  (Index 21) `fractal_dimension_se`
        23.  (Index 22) `radius_worst`
        24.  (Index 23) `texture_worst`
        25.  (Index 24) `perimeter_worst`
        26.  (Index 25) `area_worst`
        27.  (Index 26) `smoothness_worst`
        28.  (Index 27) `compactness_worst`
        29.  (Index 28) `concavity_worst`
        30.  (Index 29) `concave points_worst`
        31.  (Index 30) `symmetry_worst`
        32.  (Index 31) `fractal_dimension_worst`
    * Estimated In-Memory Size (Post-Parsing & Initial Type Guessing): 0.82 MB
    * Average Row Length (bytes, approximate): 220 bytes
    * Dataset Sparsity (Initial Estimate): Dense dataset with minimal missing values (0% sparse cells via Full dataset analysis)

**1.4. Analysis Configuration & Execution Context:**
    * Full Command Executed: `datapilot overview /Users/massimoraso/plum/test-datasets/wisc_bc_data.csv`
    * Analysis Mode Invoked: Comprehensive Deep Scan
    * Timestamp of Analysis Start: 2025-06-06 09:16:32 (UTC)
    * Global Dataset Sampling Strategy: Full dataset analysis (No record sampling applied for initial overview)
    * DataPilot Modules Activated for this Run: File I/O Manager, Advanced CSV Parser, Metadata Collector, Structural Analyzer, Report Generator
    * Processing Time for Section 1 Generation: 0.009 seconds
    * Host Environment Details:
        * Operating System: macOS (Unknown Version)
        * System Architecture: ARM64 (Apple Silicon/ARM 64-bit)
        * Execution Runtime: Node.js v23.6.1 (V8 12.9.202.28-node.12) on darwin
        * Available CPU Cores / Memory (at start of analysis): 8 cores / 8 GB

---
### Performance Metrics

**Processing Performance:**
    * Total Analysis Time: 0.01 seconds
    * File analysis: 0.001s
    * Parsing: 0.007s
    * Structural analysis: 0.001s