# DataPilot TUI Comprehensive Testing Plan

## Testing Strategy for Windows Terminal

### Test Categories

#### 1. **Basic Navigation & Interface Tests**
- TUI startup and welcome screen
- Menu navigation with arrow keys
- Option selection and cancellation
- Help screens and information displays
- Exit sequences

#### 2. **File Selection & Loading Tests**
- File browser functionality
- File preview capabilities
- Various file sizes (tiny to large)
- Invalid file handling
- Special characters in filenames
- Files with spaces in names

#### 3. **Analysis Mode Tests**
- EDA (Exploratory Data Analysis)
- INT (Data Integrity Check)
- VIS (Visualisation Recommendations)
- ENG (Data Engineering)
- LLM (AI-Ready Context)
- ALL (Complete Analysis)

#### 4. **Data Format Tests**
- Standard CSV files
- Unicode characters (international data)
- Different line endings (CRLF vs LF)
- Empty files
- Malformed CSV files
- Very large datasets

#### 5. **Error Handling & Edge Cases**
- Non-existent files
- Permission errors
- Memory limitations
- Interrupt handling (Ctrl+C)
- Corrupt data
- Network interruptions (if applicable)

#### 6. **Performance & User Experience**
- Loading time feedback
- Progress indicators
- Responsive interface during processing
- Memory usage with large files
- Output formatting and readability

## Test Files Available

### Small Test Files (Perfect for basic testing)
- `diabetes_patients.csv` - 1KB, medical data
- `obesity_by_state.csv` - 1.2KB, state-level data
- `food_nutrition_diabetes.csv` - 1.3KB, nutrition data
- `diabetes_lab_results.csv` - 1.4KB, lab results
- `patient_lifestyle_data.csv` - 1.4KB, lifestyle data

### Medium Test Files (Good for performance testing)
- `share-with-depression.csv` - 249KB, mental health data
- `mental-and-substance-use-as-share-of-disease.csv` - 251KB
- `share-with-mental-and-substance-disorders.csv` - 255KB

### Large Test Files (Stress testing)
- `prevalence-by-mental-and-substance-use-disorder.csv` - 958KB
- `prevalence-of-depression-males-vs-females.csv` - 1.8MB
- `share-with-mental-or-substance-disorders-by-sex.csv` - 1.8MB

### Special Test Files
- `invalid.csv` - Malformed CSV for error testing
- `unicode_test.csv` - International characters
- `crlf_test.csv` - Windows line endings
- `concurrent_*.csv` - Multiple small files for batch testing

## Testing Execution Plan

1. **Phase 1: Basic Interface Testing**
2. **Phase 2: Small File Analysis Testing**
3. **Phase 3: Error Handling & Edge Cases**
4. **Phase 4: Performance Testing with Large Files**
5. **Phase 5: User Experience & Accessibility**

## Success Criteria

- ✅ TUI starts without errors
- ✅ All navigation works smoothly
- ✅ File loading works for all valid formats
- ✅ Error messages are helpful and clear
- ✅ Analysis outputs are well-formatted
- ✅ Performance is acceptable for all file sizes
- ✅ Graceful handling of edge cases 