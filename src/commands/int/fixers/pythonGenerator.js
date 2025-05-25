export function generatePythonFixes(analysisResults, fileName = 'data.csv') {
  const scripts = {
    fuzzyMatching: null,
    dataStandardisation: null,
    outlierHandling: null,
    missingValueImputation: null
  };

  if (analysisResults.fuzzyDuplicates && analysisResults.fuzzyDuplicates.length > 0) {
    scripts.fuzzyMatching = generateFuzzyMatchingScript(analysisResults.fuzzyDuplicates, fileName);
  }

  if (analysisResults.standardisationNeeded) {
    scripts.dataStandardisation = generateStandardisationScript(analysisResults.standardisationNeeded, fileName);
  }

  if (analysisResults.outliers) {
    scripts.outlierHandling = generateOutlierScript(analysisResults.outliers, fileName);
  }

  if (analysisResults.missingValues) {
    scripts.missingValueImputation = generateImputationScript(analysisResults.missingValues, fileName);
  }

  return formatPythonOutput(scripts, fileName);
}

function generateFuzzyMatchingScript(fuzzyDuplicates, fileName) {
  return `#!/usr/bin/env python3
"""
Fuzzy Duplicate Merging Script
Generated for: ${fileName}
Purpose: Identify and merge near-duplicate records
"""

import pandas as pd
import numpy as np
from fuzzywuzzy import fuzz, process
import recordlinkage
from datetime import datetime
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class FuzzyDuplicateMerger:
    def __init__(self, filepath, threshold=85):
        self.filepath = filepath
        self.threshold = threshold
        self.df = None
        self.matches = []
        
    def load_data(self):
        """Load CSV data"""
        logger.info(f"Loading data from {self.filepath}")
        self.df = pd.read_csv(self.filepath)
        logger.info(f"Loaded {len(self.df)} records")
        return self.df
    
    def find_duplicates(self, columns_to_match):
        """Find potential duplicates using multiple algorithms"""
        logger.info("Starting fuzzy duplicate detection")
        
        # Create record linkage index
        indexer = recordlinkage.Index()
        indexer.block(columns_to_match[0])  # Block on first column for efficiency
        candidate_pairs = indexer.index(self.df)
        
        # Compare records
        compare = recordlinkage.Compare()
        for col in columns_to_match:
            compare.string(col, col, method='jarowinkler', threshold=0.85, label=col)
        
        features = compare.compute(candidate_pairs, self.df)
        
        # Find matches above threshold
        matches = features[features.sum(axis=1) >= len(columns_to_match) * 0.8]
        
        logger.info(f"Found {len(matches)} potential duplicate pairs")
        self.matches = matches
        return matches
    
    def review_duplicates(self, sample_size=10):
        """Display sample duplicates for review"""
        print("\\n" + "="*80)
        print("SAMPLE DUPLICATE PAIRS FOR REVIEW")
        print("="*80)
        
        sample = self.matches.head(sample_size)
        for (idx1, idx2), scores in sample.iterrows():
            print(f"\\nPair {idx1} <-> {idx2} (Similarity: {scores.mean():.2%})")
            print("-" * 40)
            
            for col in self.df.columns[:5]:  # Show first 5 columns
                val1 = self.df.loc[idx1, col]
                val2 = self.df.loc[idx2, col]
                if val1 != val2:
                    print(f"{col:20} | {str(val1)[:30]:30} | {str(val2)[:30]}")
    
    def merge_strategy(self, idx1, idx2):
        """Define merging strategy for duplicate pairs"""
        row1 = self.df.loc[idx1]
        row2 = self.df.loc[idx2]
        merged = {}
        
        for col in self.df.columns:
            # Strategy: Keep non-null values, prefer most recent
            if pd.isna(row1[col]) and not pd.isna(row2[col]):
                merged[col] = row2[col]
            elif not pd.isna(row1[col]) and pd.isna(row2[col]):
                merged[col] = row1[col]
            elif 'date' in col.lower() or 'time' in col.lower():
                # For dates, keep the most recent
                try:
                    date1 = pd.to_datetime(row1[col])
                    date2 = pd.to_datetime(row2[col])
                    merged[col] = row1[col] if date1 >= date2 else row2[col]
                except:
                    merged[col] = row1[col]  # Default to first record
            else:
                # For other fields, keep from the more complete record
                merged[col] = row1[col] if row1.notna().sum() >= row2.notna().sum() else row2[col]
        
        return merged
    
    def execute_merge(self, auto_merge=False):
        """Execute the merge process"""
        logger.info("Starting merge process")
        
        # Group matches into clusters
        merged_indices = set()
        merge_groups = []
        
        for (idx1, idx2), _ in self.matches.iterrows():
            if idx1 not in merged_indices and idx2 not in merged_indices:
                group = {idx1, idx2}
                # Find all connected records
                for (i1, i2), _ in self.matches.iterrows():
                    if i1 in group or i2 in group:
                        group.update([i1, i2])
                merge_groups.append(list(group))
                merged_indices.update(group)
        
        logger.info(f"Found {len(merge_groups)} merge groups")
        
        # Create merged dataframe
        keep_indices = []
        merged_records = []
        
        for group in merge_groups:
            if auto_merge or self.confirm_merge(group):
                # Merge all records in group
                primary_idx = group[0]
                for idx in group[1:]:
                    merged_record = self.merge_strategy(primary_idx, idx)
                    self.df.loc[primary_idx] = merged_record
                keep_indices.append(primary_idx)
            else:
                # Keep all records if merge not confirmed
                keep_indices.extend(group)
        
        # Add non-duplicate records
        all_indices = set(range(len(self.df)))
        duplicate_indices = set(idx for group in merge_groups for idx in group)
        keep_indices.extend(all_indices - duplicate_indices)
        
        # Create final dataframe
        final_df = self.df.loc[sorted(keep_indices)].reset_index(drop=True)
        logger.info(f"Merged {len(self.df)} records into {len(final_df)} records")
        
        return final_df
    
    def confirm_merge(self, group):
        """Interactive confirmation for merging"""
        print(f"\\nMerge group with {len(group)} records: {group}")
        response = input("Merge these records? (y/n): ")
        return response.lower() == 'y'
    
    def save_results(self, output_df, suffix='_deduped'):
        """Save deduplicated data"""
        output_path = self.filepath.replace('.csv', f'{suffix}.csv')
        output_df.to_csv(output_path, index=False)
        logger.info(f"Saved deduplicated data to {output_path}")
        
        # Save merge report
        report_path = self.filepath.replace('.csv', '_merge_report.txt')
        with open(report_path, 'w') as f:
            f.write(f"Fuzzy Duplicate Merge Report\\n")
            f.write(f"Generated: {datetime.now()}\\n")
            f.write(f"Original records: {len(self.df)}\\n")
            f.write(f"Final records: {len(output_df)}\\n")
            f.write(f"Records merged: {len(self.df) - len(output_df)}\\n")
        
        logger.info(f"Saved merge report to {report_path}")

# Main execution
if __name__ == "__main__":
    # Configuration
    FILE_PATH = "${fileName}"
    MATCH_COLUMNS = [${fuzzyDuplicates[0].matchingFields.map(f => `'${f.field}'`).join(', ')}]
    THRESHOLD = ${fuzzyDuplicates[0].similarity || 85}
    
    # Run deduplication
    merger = FuzzyDuplicateMerger(FILE_PATH, THRESHOLD)
    merger.load_data()
    merger.find_duplicates(MATCH_COLUMNS)
    merger.review_duplicates()
    
    # Execute merge (set auto_merge=True for automatic merging)
    final_df = merger.execute_merge(auto_merge=False)
    merger.save_results(final_df)
`;
}

function generateStandardisationScript(standardisationNeeded, fileName) {
  return `#!/usr/bin/env python3
"""
Data Standardisation Script
Generated for: ${fileName}
Purpose: Standardise formats, clean data, and ensure consistency
"""

import pandas as pd
import re
import numpy as np
from datetime import datetime
import phonenumbers
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DataStandardiser:
    def __init__(self, filepath):
        self.filepath = filepath
        self.df = pd.read_csv(filepath)
        self.changes_log = []
        
    def standardise_phone_numbers(self, column, country='AU'):
        """Standardise phone numbers to E164 format"""
        logger.info(f"Standardising phone numbers in {column}")
        
        def clean_phone(phone):
            if pd.isna(phone):
                return phone
            try:
                # Parse phone number
                parsed = phonenumbers.parse(str(phone), country)
                if phonenumbers.is_valid_number(parsed):
                    # Return in national format
                    return phonenumbers.format_number(parsed, phonenumbers.PhoneNumberFormat.NATIONAL)
                else:
                    return f"INVALID_{phone}"
            except:
                # Try adding country code
                if str(phone).startswith('0'):
                    try:
                        parsed = phonenumbers.parse(f"+61{str(phone)[1:]}", None)
                        if phonenumbers.is_valid_number(parsed):
                            return phonenumbers.format_number(parsed, phonenumbers.PhoneNumberFormat.NATIONAL)
                    except:
                        pass
                return f"INVALID_{phone}"
        
        original = self.df[column].copy()
        self.df[column] = self.df[column].apply(clean_phone)
        
        changes = (original != self.df[column]).sum()
        self.changes_log.append(f"Phone standardisation in {column}: {changes} changes")
        logger.info(f"Standardised {changes} phone numbers")
        
    def standardise_addresses(self, columns):
        """Standardise address formats"""
        logger.info(f"Standardising addresses in {columns}")
        
        abbreviations = {
            'Street': 'St',
            'Road': 'Rd',
            'Avenue': 'Ave',
            'Place': 'Pl',
            'Drive': 'Dr',
            'Court': 'Ct',
            'Boulevard': 'Blvd',
            'Lane': 'Ln'
        }
        
        for col in columns:
            if col in self.df.columns:
                original = self.df[col].copy()
                
                # Standardise abbreviations
                for full, abbr in abbreviations.items():
                    self.df[col] = self.df[col].str.replace(f' {full}$', f' {abbr}', regex=True)
                    self.df[col] = self.df[col].str.replace(f' {full} ', f' {abbr} ', regex=True)
                
                # Standardise capitalisation
                self.df[col] = self.df[col].str.title()
                
                # Remove extra spaces
                self.df[col] = self.df[col].str.replace(r'\\s+', ' ', regex=True).str.strip()
                
                changes = (original != self.df[col]).sum()
                self.changes_log.append(f"Address standardisation in {col}: {changes} changes")
    
    def standardise_names(self, columns):
        """Standardise name formats"""
        logger.info(f"Standardising names in {columns}")
        
        for col in columns:
            if col in self.df.columns:
                original = self.df[col].copy()
                
                # Title case
                self.df[col] = self.df[col].str.title()
                
                # Handle special cases (McDonald, O'Brien, etc.)
                self.df[col] = self.df[col].str.replace(r"\\bMc(\\w)", lambda m: f"Mc{m.group(1).upper()}", regex=True)
                self.df[col] = self.df[col].str.replace(r"\\bO'(\\w)", lambda m: f"O'{m.group(1).upper()}", regex=True)
                
                # Remove extra spaces
                self.df[col] = self.df[col].str.replace(r'\\s+', ' ', regex=True).str.strip()
                
                changes = (original != self.df[col]).sum()
                self.changes_log.append(f"Name standardisation in {col}: {changes} changes")
    
    def standardise_dates(self, columns, target_format='%Y-%m-%d'):
        """Standardise date formats"""
        logger.info(f"Standardising dates to {target_format}")
        
        for col in columns:
            if col in self.df.columns:
                original = self.df[col].copy()
                
                # Try to parse dates with various formats
                self.df[col] = pd.to_datetime(self.df[col], errors='coerce', dayfirst=True)
                self.df[col] = self.df[col].dt.strftime(target_format)
                
                # Replace NaT with original values (couldn't parse)
                mask = self.df[col].isna()
                self.df.loc[mask, col] = original[mask]
                
                changes = (original != self.df[col]).sum()
                self.changes_log.append(f"Date standardisation in {col}: {changes} changes")
    
    def remove_duplicates(self, subset=None, keep='first'):
        """Remove duplicate rows"""
        logger.info("Removing duplicate rows")
        
        original_len = len(self.df)
        self.df = self.df.drop_duplicates(subset=subset, keep=keep)
        removed = original_len - len(self.df)
        
        self.changes_log.append(f"Duplicate removal: {removed} rows removed")
        logger.info(f"Removed {removed} duplicate rows")
    
    def save_results(self):
        """Save standardised data and change log"""
        output_path = self.filepath.replace('.csv', '_standardised.csv')
        self.df.to_csv(output_path, index=False)
        logger.info(f"Saved standardised data to {output_path}")
        
        # Save change log
        log_path = self.filepath.replace('.csv', '_standardisation_log.txt')
        with open(log_path, 'w') as f:
            f.write(f"Data Standardisation Log\\n")
            f.write(f"Generated: {datetime.now()}\\n")
            f.write(f"Original file: {self.filepath}\\n\\n")
            f.write("Changes made:\\n")
            for change in self.changes_log:
                f.write(f"- {change}\\n")
        
        logger.info(f"Saved change log to {log_path}")
        
        return output_path

# Main execution
if __name__ == "__main__":
    FILE_PATH = "${fileName}"
    
    standardiser = DataStandardiser(FILE_PATH)
    
    # Apply standardisation based on detected issues
    ${generateStandardisationCalls(standardisationNeeded)}
    
    # Save results
    output_file = standardiser.save_results()
    print(f"\\nStandardisation complete! Output saved to: {output_file}")
`;
}

function generateStandardisationCalls(issues) {
  const calls = [];
  
  if (issues.phoneColumns) {
    calls.push(`standardiser.standardise_phone_numbers('${issues.phoneColumns[0]}')`);
  }
  
  if (issues.addressColumns) {
    calls.push(`standardiser.standardise_addresses([${issues.addressColumns.map(c => `'${c}'`).join(', ')}])`);
  }
  
  if (issues.nameColumns) {
    calls.push(`standardiser.standardise_names([${issues.nameColumns.map(c => `'${c}'`).join(', ')}])`);
  }
  
  if (issues.dateColumns) {
    calls.push(`standardiser.standardise_dates([${issues.dateColumns.map(c => `'${c}'`).join(', ')}])`);
  }
  
  calls.push('standardiser.remove_duplicates()');
  
  return calls.join('\\n    ');
}

function generateOutlierScript(outliers, fileName) {
  return `#!/usr/bin/env python3
"""
Outlier Detection and Handling Script
Generated for: ${fileName}
Purpose: Identify and handle statistical outliers
"""

import pandas as pd
import numpy as np
from scipy import stats
import matplotlib.pyplot as plt
import seaborn as sns
from datetime import datetime
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class OutlierHandler:
    def __init__(self, filepath):
        self.filepath = filepath
        self.df = pd.read_csv(filepath)
        self.outliers = {}
        
    def detect_outliers_iqr(self, column, multiplier=1.5):
        """Detect outliers using IQR method"""
        Q1 = self.df[column].quantile(0.25)
        Q3 = self.df[column].quantile(0.75)
        IQR = Q3 - Q1
        
        lower_bound = Q1 - multiplier * IQR
        upper_bound = Q3 + multiplier * IQR
        
        outliers = self.df[(self.df[column] < lower_bound) | (self.df[column] > upper_bound)]
        return outliers.index.tolist(), lower_bound, upper_bound
    
    def detect_outliers_zscore(self, column, threshold=3):
        """Detect outliers using Z-score method"""
        z_scores = np.abs(stats.zscore(self.df[column].dropna()))
        outliers = np.where(z_scores > threshold)[0]
        return outliers.tolist()
    
    def detect_outliers_isolation_forest(self, columns):
        """Detect multivariate outliers using Isolation Forest"""
        from sklearn.ensemble import IsolationForest
        
        X = self.df[columns].dropna()
        clf = IsolationForest(contamination=0.1, random_state=42)
        outliers = clf.fit_predict(X)
        
        return X[outliers == -1].index.tolist()
    
    def visualize_outliers(self, column):
        """Create visualizations for outlier analysis"""
        fig, axes = plt.subplots(2, 2, figsize=(12, 10))
        
        # Box plot
        axes[0, 0].boxplot(self.df[column].dropna())
        axes[0, 0].set_title(f'Box Plot - {column}')
        
        # Histogram
        axes[0, 1].hist(self.df[column].dropna(), bins=50, edgecolor='black')
        axes[0, 1].set_title(f'Histogram - {column}')
        
        # Q-Q plot
        stats.probplot(self.df[column].dropna(), dist="norm", plot=axes[1, 0])
        axes[1, 0].set_title(f'Q-Q Plot - {column}')
        
        # Scatter plot with outliers highlighted
        outlier_indices, _, _ = self.detect_outliers_iqr(column)
        colors = ['red' if i in outlier_indices else 'blue' for i in range(len(self.df))]
        axes[1, 1].scatter(range(len(self.df)), self.df[column], c=colors, alpha=0.5)
        axes[1, 1].set_title(f'Scatter Plot - {column} (outliers in red)')
        
        plt.tight_layout()
        plt.savefig(f'{column}_outlier_analysis.png')
        plt.close()
        
        logger.info(f"Saved outlier visualization for {column}")
    
    def handle_outliers(self, column, method='cap', **kwargs):
        """Handle outliers using specified method"""
        outlier_indices, lower_bound, upper_bound = self.detect_outliers_iqr(column)
        
        if method == 'remove':
            # Remove outliers
            self.df = self.df.drop(outlier_indices)
            logger.info(f"Removed {len(outlier_indices)} outliers from {column}")
            
        elif method == 'cap':
            # Cap outliers at bounds
            self.df.loc[self.df[column] < lower_bound, column] = lower_bound
            self.df.loc[self.df[column] > upper_bound, column] = upper_bound
            logger.info(f"Capped {len(outlier_indices)} outliers in {column}")
            
        elif method == 'transform':
            # Log transformation
            self.df[f'{column}_log'] = np.log1p(self.df[column])
            logger.info(f"Applied log transformation to {column}")
            
        elif method == 'impute':
            # Impute with median
            median = self.df[column].median()
            self.df.loc[outlier_indices, column] = median
            logger.info(f"Imputed {len(outlier_indices)} outliers with median in {column}")
        
        self.outliers[column] = {
            'method': method,
            'count': len(outlier_indices),
            'bounds': (lower_bound, upper_bound)
        }
    
    def generate_report(self):
        """Generate outlier analysis report"""
        report = []
        report.append("OUTLIER ANALYSIS REPORT")
        report.append(f"Generated: {datetime.now()}")
        report.append(f"File: {self.filepath}")
        report.append("")
        
        for column, info in self.outliers.items():
            report.append(f"\\n{column}:")
            report.append(f"  Method: {info['method']}")
            report.append(f"  Outliers: {info['count']}")
            report.append(f"  Bounds: [{info['bounds'][0]:.2f}, {info['bounds'][1]:.2f}]")
        
        return "\\n".join(report)
    
    def save_results(self):
        """Save cleaned data and report"""
        output_path = self.filepath.replace('.csv', '_outliers_handled.csv')
        self.df.to_csv(output_path, index=False)
        logger.info(f"Saved cleaned data to {output_path}")
        
        report_path = self.filepath.replace('.csv', '_outlier_report.txt')
        with open(report_path, 'w') as f:
            f.write(self.generate_report())
        logger.info(f"Saved outlier report to {report_path}")

# Main execution
if __name__ == "__main__":
    FILE_PATH = "${fileName}"
    NUMERIC_COLUMNS = [${outliers.map(o => `'${o.field}'`).join(', ')}]
    
    handler = OutlierHandler(FILE_PATH)
    
    # Analyze and handle outliers for each numeric column
    for column in NUMERIC_COLUMNS:
        if column in handler.df.columns:
            # Visualize outliers
            handler.visualize_outliers(column)
            
            # Handle outliers (method can be: 'remove', 'cap', 'transform', 'impute')
            handler.handle_outliers(column, method='cap')
    
    # Save results
    handler.save_results()
    print("\\nOutlier handling complete!")
`;
}

function generateImputationScript(missingValues, fileName) {
  return `#!/usr/bin/env python3
"""
Missing Value Imputation Script
Generated for: ${fileName}
Purpose: Handle missing values using appropriate imputation strategies
"""

import pandas as pd
import numpy as np
from sklearn.impute import SimpleImputer, KNNImputer
from sklearn.experimental import enable_iterative_imputer
from sklearn.impute import IterativeImputer
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class MissingValueHandler:
    def __init__(self, filepath):
        self.filepath = filepath
        self.df = pd.read_csv(filepath)
        self.imputation_log = []
        
    def analyze_missing_patterns(self):
        """Analyze patterns in missing data"""
        missing_counts = self.df.isnull().sum()
        missing_percent = (missing_counts / len(self.df)) * 100
        
        missing_df = pd.DataFrame({
            'Column': missing_counts.index,
            'Missing_Count': missing_counts.values,
            'Missing_Percent': missing_percent.values
        })
        
        missing_df = missing_df[missing_df['Missing_Count'] > 0].sort_values('Missing_Percent', ascending=False)
        
        print("\\nMissing Value Analysis:")
        print(missing_df.to_string(index=False))
        
        return missing_df
    
    def impute_categorical(self, column, strategy='mode'):
        """Impute missing categorical values"""
        if column not in self.df.columns:
            return
            
        missing_count = self.df[column].isnull().sum()
        if missing_count == 0:
            return
            
        if strategy == 'mode':
            mode_value = self.df[column].mode()[0] if len(self.df[column].mode()) > 0 else 'Unknown'
            self.df[column].fillna(mode_value, inplace=True)
            self.imputation_log.append(f"{column}: Imputed {missing_count} values with mode '{mode_value}'")
        elif strategy == 'unknown':
            self.df[column].fillna('Unknown', inplace=True)
            self.imputation_log.append(f"{column}: Imputed {missing_count} values with 'Unknown'")
    
    def impute_numeric(self, column, strategy='median'):
        """Impute missing numeric values"""
        if column not in self.df.columns:
            return
            
        missing_count = self.df[column].isnull().sum()
        if missing_count == 0:
            return
            
        if strategy == 'mean':
            mean_value = self.df[column].mean()
            self.df[column].fillna(mean_value, inplace=True)
            self.imputation_log.append(f"{column}: Imputed {missing_count} values with mean {mean_value:.2f}")
        elif strategy == 'median':
            median_value = self.df[column].median()
            self.df[column].fillna(median_value, inplace=True)
            self.imputation_log.append(f"{column}: Imputed {missing_count} values with median {median_value:.2f}")
        elif strategy == 'forward_fill':
            self.df[column].fillna(method='ffill', inplace=True)
            self.imputation_log.append(f"{column}: Imputed {missing_count} values with forward fill")
        elif strategy == 'interpolate':
            self.df[column].interpolate(method='linear', inplace=True)
            self.imputation_log.append(f"{column}: Imputed {missing_count} values with linear interpolation")
    
    def impute_knn(self, columns, n_neighbors=5):
        """Impute using KNN imputation"""
        if not all(col in self.df.columns for col in columns):
            return
            
        imputer = KNNImputer(n_neighbors=n_neighbors)
        self.df[columns] = imputer.fit_transform(self.df[columns])
        
        self.imputation_log.append(f"KNN imputation on {columns} with {n_neighbors} neighbors")
    
    def impute_mice(self, columns, max_iter=10):
        """Impute using MICE (Multiple Imputation by Chained Equations)"""
        if not all(col in self.df.columns for col in columns):
            return
            
        imputer = IterativeImputer(max_iter=max_iter, random_state=42)
        self.df[columns] = imputer.fit_transform(self.df[columns])
        
        self.imputation_log.append(f"MICE imputation on {columns} with {max_iter} iterations")
    
    def save_results(self):
        """Save imputed data and log"""
        output_path = self.filepath.replace('.csv', '_imputed.csv')
        self.df.to_csv(output_path, index=False)
        logger.info(f"Saved imputed data to {output_path}")
        
        log_path = self.filepath.replace('.csv', '_imputation_log.txt')
        with open(log_path, 'w') as f:
            f.write("Missing Value Imputation Log\\n")
            f.write(f"Generated: {pd.Timestamp.now()}\\n")
            f.write(f"Original file: {self.filepath}\\n\\n")
            f.write("Imputation strategies applied:\\n")
            for log_entry in self.imputation_log:
                f.write(f"- {log_entry}\\n")
        
        logger.info(f"Saved imputation log to {log_path}")

# Main execution
if __name__ == "__main__":
    FILE_PATH = "${fileName}"
    
    handler = MissingValueHandler(FILE_PATH)
    
    # Analyze missing patterns
    missing_analysis = handler.analyze_missing_patterns()
    
    # Apply imputation strategies based on column types and patterns
    ${generateImputationCalls(missingValues)}
    
    # Save results
    handler.save_results()
    print("\\nMissing value imputation complete!")
`;
}

function generateImputationCalls(missingValues) {
  const calls = [];
  
  Object.entries(missingValues).forEach(([column, info]) => {
    if (info.type === 'categorical') {
      calls.push(`handler.impute_categorical('${column}', strategy='mode')`);
    } else if (info.type === 'numeric') {
      if (info.pattern === 'MCAR') {
        calls.push(`handler.impute_numeric('${column}', strategy='median')`);
      } else if (info.pattern === 'MAR') {
        calls.push(`# Consider using KNN or MICE for ${column} (MAR pattern detected)`);
      }
    }
  });
  
  return calls.join('\\n    ');
}

function formatPythonOutput(scripts, fileName) {
  const output = [];
  
  output.push('# Data Quality Fix Scripts - Python');
  output.push(`# Generated for: ${fileName}`);
  output.push(`# Generated: ${new Date().toISOString()}`);
  output.push('# Install requirements: pip install pandas numpy scipy scikit-learn fuzzywuzzy python-Levenshtein phonenumbers recordlinkage matplotlib seaborn');
  output.push('');
  
  if (scripts.fuzzyMatching) {
    output.push('# ========================================');
    output.push('# FUZZY DUPLICATE MATCHING AND MERGING');
    output.push('# ========================================');
    output.push(scripts.fuzzyMatching);
    output.push('');
  }
  
  if (scripts.dataStandardisation) {
    output.push('# ========================================');
    output.push('# DATA STANDARDISATION');
    output.push('# ========================================');
    output.push(scripts.dataStandardisation);
    output.push('');
  }
  
  if (scripts.outlierHandling) {
    output.push('# ========================================');
    output.push('# OUTLIER DETECTION AND HANDLING');
    output.push('# ========================================');
    output.push(scripts.outlierHandling);
    output.push('');
  }
  
  if (scripts.missingValueImputation) {
    output.push('# ========================================');
    output.push('# MISSING VALUE IMPUTATION');
    output.push('# ========================================');
    output.push(scripts.missingValueImputation);
  }
  
  return output.join('\n');
}