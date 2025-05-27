DataPilot Tool: Identified Issues & Recommendations

This document summarizes the key problems and areas for improvement discovered during the testing of the DataPilot tool. It covers both general architectural issues and specific problems within individual features (EDA, INT, VIS, ENG, LLM).
I. General / Architectural Issues

    Large Dataset Performance & Timeouts:
        Problem: The tool hangs or times out indefinitely when processing larger datasets (e.g., >10K rows, >1MB), particularly affecting the llm and eng functions. Tests on California Housing (20K rows) and Australian Postcodes (16K rows) failed to complete.
        Suspected Cause: Inefficient algorithms (potentially O(n²) or worse), synchronous/blocking processing, multiple full-dataset passes, potential memory leaks.
        Suggested Fix:
            Implement statistically sound sampling (e.g., systematic or stratified random sampling with confidence scores) for large datasets instead of just "first N rows".
            Introduce streaming processing for calculations.
            Optimize algorithms and consider more efficient libraries.
            Implement progress indicators and configurable timeouts.

    CSV Parsing Inconsistencies:
        Problem: Different functions handle CSV parsing differently, leading to inconsistent encoding detection, row counting, error handling (skipped rows), and ultimately, critical failures (like in the int function).
        Suspected Cause: Use of multiple CSV parsing libraries or different configurations/error handling logic across functions.
        Suggested Fix: Standardize CSV parsing by creating a single, shared parsing utility with unified configuration (e.g., always output objects, handle encodings consistently) and robust, consistent error handling across all functions.

    JavaScript Runtime Errors & Error Handling:
        Problem: Occasional undefined property access errors (e.g., llm slice error) occur, although some functions have graceful fallbacks. Error handling isn't consistently robust.
        Suspected Cause: Insufficient input validation, missing null/undefined checks (defensive programming gaps).
        Suggested Fix: Add comprehensive input validation and null checks, especially before array/string operations. Implement better error boundaries and provide more informative error messages.

    Output Formatting Inconsistencies:
        Problem: The CLI output has mixed formatting styles, color coding, and symbols across different functions, affecting professionalism.
        Suspected Cause: Developed at different times with different styling approaches.
        Suggested Fix: Standardize output formatting using shared utilities for a consistent, professional look and feel.

II. Intra-Feature Problems

    INT (Data Integrity Check): 🔴 CRITICAL
        Problem: The int function is fundamentally broken. It reports 100% missing values even when data is present, treats all data as "undefined" strings, and produces misleading quality scores.
        Suspected Cause: A data structure mismatch during CSV parsing. It likely expects array-based rows but receives object-based rows from the parser, leading to undefined when accessing by index.
        Suggested Fix: Ensure the int function uses the standardized CSV parser and correctly handles object-based row structures (accessing data by column name, not index).

    LLM (LLM Context Generation): 🟡 HIGH
        Problem: Experiences partial failures (Cannot read properties of undefined (reading 'slice')), forcing it to fall back to a less comprehensive analysis mode, reducing output quality. Also affected by performance issues.
        Suspected Cause: Cascading data pipeline issues leading to undefined variables, coupled with a lack of null checks before array operations.
        Suggested Fix: Add defensive null/undefined checks, improve error handling to pinpoint failure steps, and address underlying performance/parsing issues.

    ENG (Data Engineering Archaeology): 🟡 MEDIUM
        Problem: While excellent at domain classification and pattern recognition, its relationship detection has critical gaps:
            No Data Validation: Relies only on column name similarity, leading to high confidence scores for relationships with zero actual data matches (e.g., shipments.order_id vs orders.order_id, inventory.product_id vs products.product_id).
            Generic References: All relationships point to unknown.column_name instead of specific table names.
            Missed Data Quality Issues: Fails to detect or report critical issues like broken referential integrity or format mismatches.
            Need interacivity to manage memories, to delete, to edit, to modify. Maybe a link to the memoryfile that can be opened up in an editor.:
        Suspected Cause: The core logic focuses on name heuristics and lacks a data-driven validation layer.
        Suggested Fix:
            Implement data-driven relationship validation (sampling actual values, checking overlaps, detecting cardinality).
            Weight data validation higher than name similarity in confidence scoring.
            Resolve unknown references to specific table names.
            Add referential integrity and format mismatch analysis.

    VIS (Visualisation Recommendations): 🟢 LOW/MEDIUM
        Problem: While generally excellent (especially primary chart selection, color palettes, layouts), it has areas for improvement:
            Weak Secondary Charts: Tends to over-recommend box plots, even when it self-identifies them as sub-optimal.
            Limited Domain Context: Misses opportunities for domain-specific visualisations (e.g., medical normal ranges, e-commerce funnels).
            Geographic Detection Errors: Incorrectly flags non-geographic fields as geographic based on name alone.
        Suspected Cause: Relies on generic rules and name patterns without deeper data content or domain understanding.
        Suggested Fix:
            Improve secondary chart logic based on primary chart and analytical goals.
            Implement domain-specific templates.
            Enhance data type/content detection to validate geographic data.

    EDA (Exploratory Data Analysis): ✅ WORKING WELL
        Note: The EDA function performed excellently in tests and is considered largely production-ready. It benefits from the most robust CSV parsing implementation currently in the tool. Any improvements would likely stem from general fixes (performance, TS migration).


🧠 TUI Memory Management Feature:

    Modify src/commands/ui.js:
        Add a "🧠 Manage Memories" option to the showMainMenu choices.
        Add a case 'memory': to the main switch to call showMemoryManager().
        Import KnowledgeBase at the top.
    Create showMemoryManager() in src/commands/ui.js:
        Load the KnowledgeBase.
        Display a summary (table count, domain count).
        Use enquirer to show options: List, View, Delete, Clear All, Back.
    Implement Helper Functions in src/commands/ui.js:
        listMemories(knowledge): Display tables/domains.
        viewMemoryDetails(knowledge): Prompt for table, load YAML, display.
        deleteMemory(knowledge): Prompt, confirm, call kb.deleteTable().
        clearAllMemories(kb): Prompt, strongly confirm, call kb.clearAll().
    Enhance src/utils/knowledgeBase.js:
        Add deleteTable(tableName) method (remove YAML, update warehouse).
        Add clearAll() method (remove ~/.datapilot/archaeology dir).

🧪 Automated TUI Testing Improvements:

    Refactor src/commands/ui.js:
        Create a TUI_Engine class/module to hold UI state and logic.
        Separate UI logic (what to do) from rendering (enquirer, console.log).
        Make ui.js a driver for the engine.
    Build/Enhance Test Harness (tests/automated_tui_test.js or new file):
        Import and use the TUI_Engine directly (don't spawn processes).
        Write tests to simulate user actions by calling engine methods.
        Assert on the engine's state or returned descriptions.
        Mock analysis functions (eda, int) for speed.
    Update Test Strategy:
        Use existing process-spawning tests (automated_tui_test.js) primarily for end-to-end smoke testing.
        Use the new harness-based tests for detailed coverage of all menu options and flows.
        Integrate harness tests into tests/run_tui_tests.js.