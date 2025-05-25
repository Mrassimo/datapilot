export function generateSQLFixes(analysisResults, tableName = 'your_table') {
  const sqlScripts = {
    priority1_referentialIntegrity: [],
    priority2_dataStandardisation: [],
    priority3_constraints: [],
    priority4_cleanup: []
  };

  if (analysisResults.businessRules) {
    generateBusinessRuleSQL(analysisResults.businessRules, tableName, sqlScripts);
  }

  if (analysisResults.validityIssues) {
    generateValidityFixSQL(analysisResults.validityIssues, tableName, sqlScripts);
  }

  if (analysisResults.duplicates) {
    generateDuplicateFixSQL(analysisResults.duplicates, tableName, sqlScripts);
  }

  if (analysisResults.consistencyIssues) {
    generateConsistencyFixSQL(analysisResults.consistencyIssues, tableName, sqlScripts);
  }

  if (analysisResults.temporalIssues) {
    generateTemporalFixSQL(analysisResults.temporalIssues, tableName, sqlScripts);
  }

  return formatSQLOutput(sqlScripts, tableName);
}

function generateBusinessRuleSQL(rules, tableName, scripts) {
  rules.forEach(rule => {
    if (rule.type === 'FOREIGN_KEY_CONSTRAINT') {
      scripts.priority1_referentialIntegrity.push({
        description: `Add foreign key for ${rule.field}`,
        sql: `ALTER TABLE ${tableName} 
ADD CONSTRAINT fk_${rule.field} 
FOREIGN KEY (${rule.field}) 
REFERENCES ${rule.field.replace('_id', '')}(id);`,
        rollback: `ALTER TABLE ${tableName} DROP CONSTRAINT fk_${rule.field};`
      });
    }

    if (rule.type === 'RANGE_CONSTRAINT' || rule.type === 'NON_NEGATIVE_CONSTRAINT') {
      scripts.priority3_constraints.push({
        description: `Add check constraint for ${rule.field}`,
        sql: `ALTER TABLE ${tableName} 
ADD CONSTRAINT chk_${rule.field} 
${rule.sql};`,
        rollback: `ALTER TABLE ${tableName} DROP CONSTRAINT chk_${rule.field};`,
        validation: `SELECT COUNT(*) as violations 
FROM ${tableName} 
WHERE NOT (${rule.rule});`
      });
    }

    if (rule.type === 'UNIQUENESS_CONSTRAINT') {
      scripts.priority3_constraints.push({
        description: `Add unique constraint for ${rule.field}`,
        sql: `ALTER TABLE ${tableName} 
ADD CONSTRAINT uk_${rule.field} 
UNIQUE (${rule.field});`,
        rollback: `ALTER TABLE ${tableName} DROP CONSTRAINT uk_${rule.field};`,
        preCheck: `SELECT ${rule.field}, COUNT(*) as cnt 
FROM ${tableName} 
GROUP BY ${rule.field} 
HAVING COUNT(*) > 1;`
      });
    }

    if (rule.type === 'PATTERN_CONSTRAINT') {
      scripts.priority3_constraints.push({
        description: `Add pattern check for ${rule.field}`,
        sql: `ALTER TABLE ${tableName} 
ADD CONSTRAINT chk_${rule.field}_pattern 
${rule.sql};`,
        rollback: `ALTER TABLE ${tableName} DROP CONSTRAINT chk_${rule.field}_pattern;`
      });
    }

    if (rule.type === 'DERIVED_FIELD_RULE' && rule.violations > 0) {
      const updateSQL = generateDerivedFieldUpdate(rule, tableName);
      scripts.priority2_dataStandardisation.push({
        description: `Fix calculated field ${rule.field}`,
        sql: updateSQL,
        validation: `SELECT COUNT(*) as remaining_issues 
FROM ${tableName} 
WHERE ${rule.field} != ${rule.components.join(' + ')};`
      });
    }
  });
}

function generateDerivedFieldUpdate(rule, tableName) {
  return `-- Fix ${rule.violations} incorrect calculations in ${rule.field}
UPDATE ${tableName}
SET ${rule.field} = ${rule.components.join(' + ')}
WHERE ${rule.field} != ${rule.components.join(' + ')};

-- Add trigger to maintain consistency
CREATE OR REPLACE TRIGGER trg_${rule.field}_calc
BEFORE INSERT OR UPDATE ON ${tableName}
FOR EACH ROW
BEGIN
    NEW.${rule.field} := ${rule.components.map(c => 'NEW.' + c).join(' + ')};
END;`;
}

function generateValidityFixSQL(validityIssues, tableName, scripts) {
  Object.entries(validityIssues).forEach(([field, issues]) => {
    if (issues.phoneFormat) {
      scripts.priority2_dataStandardisation.push({
        description: `Standardise phone numbers in ${field}`,
        sql: generatePhoneStandardisationSQL(field, tableName),
        validation: `SELECT COUNT(*) as invalid_phones 
FROM ${tableName} 
WHERE ${field} IS NOT NULL 
  AND ${field} !~ '^\\+?61[0-9]{9}$' 
  AND ${field} !~ '^0[0-9]{9}$';`
      });
    }

    if (issues.emailFormat) {
      scripts.priority2_dataStandardisation.push({
        description: `Clean invalid emails in ${field}`,
        sql: `-- Mark invalid emails for review
UPDATE ${tableName}
SET ${field} = CONCAT('INVALID_', ${field})
WHERE ${field} IS NOT NULL
  AND ${field} !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$'
  AND ${field} NOT LIKE 'INVALID_%';`,
        rollback: `UPDATE ${tableName} 
SET ${field} = SUBSTRING(${field} FROM 9) 
WHERE ${field} LIKE 'INVALID_%';`
      });
    }

    if (issues.caseInconsistency) {
      scripts.priority2_dataStandardisation.push({
        description: `Standardise case for ${field}`,
        sql: generateCaseStandardisationSQL(field, tableName, issues.recommendedCase)
      });
    }
  });
}

function generatePhoneStandardisationSQL(field, tableName) {
  return `-- Standardise Australian phone numbers
-- Add leading 0 to mobile numbers missing it
UPDATE ${tableName}
SET ${field} = CONCAT('0', ${field})
WHERE LENGTH(${field}) = 9 
  AND ${field} ~ '^4[0-9]{8}$';

-- Remove spaces, hyphens, and parentheses
UPDATE ${tableName}
SET ${field} = REGEXP_REPLACE(${field}, '[\\s\\-\\(\\)]', '', 'g')
WHERE ${field} ~ '[\\s\\-\\(\\)]';

-- Convert international format to local
UPDATE ${tableName}
SET ${field} = REGEXP_REPLACE(${field}, '^\\+61', '0')
WHERE ${field} ~ '^\\+61';`;
}

function generateCaseStandardisationSQL(field, tableName, recommendedCase) {
  const caseFunction = {
    'UPPER': 'UPPER',
    'LOWER': 'LOWER',
    'TITLE': 'INITCAP'
  };

  return `UPDATE ${tableName}
SET ${field} = ${caseFunction[recommendedCase] || 'INITCAP'}(${field})
WHERE ${field} IS NOT NULL;`;
}

function generateDuplicateFixSQL(duplicates, tableName, scripts) {
  if (duplicates.exactDuplicates && duplicates.exactDuplicates.length > 0) {
    scripts.priority4_cleanup.push({
      description: 'Remove exact duplicate records',
      sql: `-- Remove exact duplicates keeping the oldest record
WITH duplicates AS (
  SELECT ctid,
         ROW_NUMBER() OVER (
           PARTITION BY ${duplicates.keyColumns.join(', ')}
           ORDER BY created_date, ctid
         ) AS rn
  FROM ${tableName}
)
DELETE FROM ${tableName}
WHERE ctid IN (
  SELECT ctid FROM duplicates WHERE rn > 1
);`,
      validation: `SELECT COUNT(*) as duplicate_groups
FROM (
  SELECT ${duplicates.keyColumns.join(', ')}, COUNT(*) as cnt
  FROM ${tableName}
  GROUP BY ${duplicates.keyColumns.join(', ')}
  HAVING COUNT(*) > 1
) t;`
    });
  }

  if (duplicates.fuzzyDuplicates && duplicates.fuzzyDuplicates.length > 0) {
    scripts.priority4_cleanup.push({
      description: 'Merge fuzzy duplicate records',
      sql: generateFuzzyMergeSQL(duplicates.fuzzyDuplicates[0], tableName),
      manual: true,
      note: 'Review and adjust merge logic before executing'
    });
  }
}

function generateFuzzyMergeSQL(fuzzyGroup, tableName) {
  return `-- Merge fuzzy duplicates for group: ${fuzzyGroup.id}
-- Primary record: ${fuzzyGroup.records[0].index}
-- Records to merge: ${fuzzyGroup.records.slice(1).map(r => r.index).join(', ')}

BEGIN;

-- Step 1: Update foreign key references
-- TODO: Add UPDATE statements for tables referencing this record

-- Step 2: Merge data (customize based on business rules)
UPDATE ${tableName} t1
SET 
  -- Combine/update fields as needed
  -- Example: notes = COALESCE(t1.notes, '') || ' | ' || COALESCE(t2.notes, '')
FROM ${tableName} t2
WHERE t1.id = ${fuzzyGroup.records[0].index}
  AND t2.id IN (${fuzzyGroup.records.slice(1).map(r => r.index).join(', ')});

-- Step 3: Delete merged records
DELETE FROM ${tableName}
WHERE id IN (${fuzzyGroup.records.slice(1).map(r => r.index).join(', ')});

COMMIT;`;
}

function generateConsistencyFixSQL(consistencyIssues, tableName, scripts) {
  if (consistencyIssues.temporalInconsistencies) {
    consistencyIssues.temporalInconsistencies.forEach(issue => {
      scripts.priority2_dataStandardisation.push({
        description: `Fix temporal inconsistency: ${issue.rule}`,
        sql: `UPDATE ${tableName}
SET ${issue.field1} = LEAST(${issue.field1}, ${issue.field2})
WHERE ${issue.field1} > ${issue.field2};`,
        validation: `SELECT COUNT(*) as remaining_issues
FROM ${tableName}
WHERE ${issue.field1} > ${issue.field2};`
      });
    });
  }

  if (consistencyIssues.crossColumnValidation) {
    consistencyIssues.crossColumnValidation.forEach(issue => {
      if (issue.type === 'calculated_field') {
        scripts.priority2_dataStandardisation.push({
          description: `Fix cross-column calculation: ${issue.field}`,
          sql: issue.fixSQL || `-- Manual fix required for ${issue.field}`,
          manual: !issue.fixSQL
        });
      }
    });
  }
}

function generateTemporalFixSQL(temporalIssues, tableName, scripts) {
  if (temporalIssues.futureDates) {
    temporalIssues.futureDates.forEach(issue => {
      scripts.priority2_dataStandardisation.push({
        description: `Fix future dates in ${issue.field}`,
        sql: `-- Option 1: Set to current date
UPDATE ${tableName}
SET ${issue.field} = CURRENT_DATE
WHERE ${issue.field} > CURRENT_DATE;

-- Option 2: Set to NULL (uncomment if preferred)
-- UPDATE ${tableName}
-- SET ${issue.field} = NULL
-- WHERE ${issue.field} > CURRENT_DATE;`,
        validation: `SELECT COUNT(*) as future_dates
FROM ${tableName}
WHERE ${issue.field} > CURRENT_DATE;`
      });
    });
  }

  if (temporalIssues.staleRecords) {
    scripts.priority4_cleanup.push({
      description: 'Archive stale records',
      sql: `-- Create archive table
CREATE TABLE IF NOT EXISTS ${tableName}_archive (LIKE ${tableName});

-- Move stale records to archive
INSERT INTO ${tableName}_archive
SELECT * FROM ${tableName}
WHERE last_modified < CURRENT_DATE - INTERVAL '${temporalIssues.staleThreshold} days';

-- Delete from main table
DELETE FROM ${tableName}
WHERE last_modified < CURRENT_DATE - INTERVAL '${temporalIssues.staleThreshold} days';`,
      validation: `SELECT COUNT(*) as archived_records
FROM ${tableName}_archive;`
    });
  }
}

function formatSQLOutput(scripts, tableName) {
  const output = [];
  
  output.push(`-- Data Quality Fix Scripts for ${tableName}`);
  output.push(`-- Generated: ${new Date().toISOString()}`);
  output.push('-- IMPORTANT: Review all scripts before execution');
  output.push('-- Execute in order: Priority 1 -> 2 -> 3 -> 4\n');

  const sections = [
    { key: 'priority1_referentialIntegrity', title: 'PRIORITY 1: Referential Integrity' },
    { key: 'priority2_dataStandardisation', title: 'PRIORITY 2: Data Standardisation' },
    { key: 'priority3_constraints', title: 'PRIORITY 3: Constraints' },
    { key: 'priority4_cleanup', title: 'PRIORITY 4: Cleanup' }
  ];

  sections.forEach(section => {
    if (scripts[section.key].length > 0) {
      output.push(`\n-- ==========================================`);
      output.push(`-- ${section.title}`);
      output.push(`-- ==========================================\n`);

      scripts[section.key].forEach((script, index) => {
        output.push(`-- ${index + 1}. ${script.description}`);
        if (script.manual) {
          output.push('-- MANUAL REVIEW REQUIRED');
        }
        if (script.preCheck) {
          output.push('-- Pre-execution check:');
          output.push(script.preCheck);
          output.push('');
        }
        output.push(script.sql);
        if (script.validation) {
          output.push('\n-- Validation query:');
          output.push(script.validation);
        }
        if (script.rollback) {
          output.push('\n-- Rollback:');
          output.push(script.rollback);
        }
        output.push('');
      });
    }
  });

  output.push('\n-- ==========================================');
  output.push('-- POST-EXECUTION VALIDATION');
  output.push('-- ==========================================\n');
  output.push(generateValidationQueries(tableName));

  return output.join('\n');
}

function generateValidationQueries(tableName) {
  return `-- Check for remaining data quality issues
SELECT 
  'Null Values' as check_type,
  COUNT(*) as issue_count
FROM ${tableName}
WHERE important_column IS NULL
UNION ALL
SELECT 
  'Duplicates' as check_type,
  COUNT(*) as issue_count
FROM (
  SELECT key_column, COUNT(*) as cnt
  FROM ${tableName}
  GROUP BY key_column
  HAVING COUNT(*) > 1
) t
UNION ALL
SELECT 
  'Invalid Formats' as check_type,
  COUNT(*) as issue_count
FROM ${tableName}
WHERE email_column NOT LIKE '%@%.%'
   OR phone_column !~ '^[0-9+\\-\\s\\(\\)]+$';`;
}