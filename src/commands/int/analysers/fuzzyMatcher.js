import FuzzySet from 'fuzzyset.js';

export function analyseFuzzyDuplicates(data, headers) {
  const results = {
    nearDuplicateGroups: [],
    totalNearDuplicates: 0,
    algorithms: ['Levenshtein', 'Jaro-Winkler', 'Soundex', 'Token Sorting'],
    processingStrategy: data.length > 1000 ? 'sampled' : 'full'
  };

  const keyColumns = identifyKeyColumns(headers);
  if (keyColumns.length === 0) {
    results.message = 'No suitable columns found for fuzzy matching';
    return results;
  }

  const groups = data.length > 1000 
    ? findNearDuplicatesSampled(data, keyColumns, 1000)
    : findNearDuplicatesFull(data, keyColumns);

  results.nearDuplicateGroups = groups;
  results.totalNearDuplicates = groups.reduce((sum, group) => sum + group.records.length - 1, 0);

  return results;
}

function identifyKeyColumns(headers) {
  const priorityColumns = ['name', 'company', 'address', 'email', 'title', 'description'];
  const keyColumns = [];

  headers.forEach((header, index) => {
    const headerLower = header.toLowerCase();
    if (priorityColumns.some(col => headerLower.includes(col))) {
      keyColumns.push({ header, index, priority: 1 });
    } else if (headerLower.includes('id') || headerLower.includes('code')) {
      keyColumns.push({ header, index, priority: 2 });
    }
  });

  return keyColumns.sort((a, b) => a.priority - b.priority).slice(0, 5);
}

function findNearDuplicatesFull(data, keyColumns) {
  const groups = [];
  const processed = new Set();
  const fuzzyIndices = buildFuzzyIndices(data, keyColumns);

  for (let i = 0; i < data.length; i++) {
    if (processed.has(i)) continue;

    const matches = findSimilarRecords(data[i], i, data, keyColumns, fuzzyIndices, processed);
    
    if (matches.length > 0) {
      processed.add(i);
      matches.forEach(m => processed.add(m.index));
      
      groups.push({
        id: `group_${groups.length + 1}`,
        similarity: Math.max(...matches.map(m => m.similarity)),
        recordCount: matches.length + 1,
        records: [
          { index: i, data: extractKeyData(data[i], keyColumns) },
          ...matches.map(m => ({ 
            index: m.index, 
            data: extractKeyData(data[m.index], keyColumns) 
          }))
        ],
        algorithms: matches[0].algorithms,
        matchDetails: analyseMatchDetails(data[i], matches[0].record, keyColumns)
      });
    }
  }

  return groups.sort((a, b) => b.recordCount - a.recordCount).slice(0, 100);
}

function findNearDuplicatesSampled(data, keyColumns, sampleSize) {
  const sample = [];
  const step = Math.max(1, Math.floor(data.length / sampleSize));
  
  for (let i = 0; i < data.length; i += step) {
    sample.push({ index: i, data: data[i] });
  }

  const groups = [];
  const fuzzyIndices = buildFuzzyIndices(sample.map(s => s.data), keyColumns);

  for (let i = 0; i < sample.length; i++) {
    const matches = findSimilarRecordsInSample(
      sample[i], 
      i, 
      sample, 
      keyColumns, 
      fuzzyIndices
    );
    
    if (matches.length > 0) {
      groups.push({
        id: `group_${groups.length + 1}`,
        similarity: Math.max(...matches.map(m => m.similarity)),
        recordCount: matches.length + 1,
        records: [
          { 
            index: sample[i].index, 
            data: extractKeyData(sample[i].data, keyColumns) 
          },
          ...matches.map(m => ({ 
            index: sample[m.index].index, 
            data: extractKeyData(sample[m.index].data, keyColumns) 
          }))
        ],
        algorithms: matches[0].algorithms,
        matchDetails: analyseMatchDetails(
          sample[i].data, 
          sample[matches[0].index].data, 
          keyColumns
        )
      });
    }
  }

  return groups.sort((a, b) => b.similarity - a.similarity).slice(0, 50);
}

function buildFuzzyIndices(data, keyColumns) {
  const indices = {};
  
  keyColumns.forEach(col => {
    const values = data.map(row => String(row[col.index] || '').toLowerCase().trim());
    const uniqueValues = [...new Set(values.filter(v => v.length > 2))];
    
    if (uniqueValues.length > 0 && uniqueValues.length < data.length * 0.9) {
      indices[col.header] = FuzzySet(uniqueValues);
    }
  });

  return indices;
}

function findSimilarRecords(record, recordIndex, allData, keyColumns, fuzzyIndices, processed) {
  const matches = [];
  const recordKey = generateRecordKey(record, keyColumns);
  
  for (let i = recordIndex + 1; i < allData.length; i++) {
    if (processed.has(i)) continue;
    
    const similarity = calculateSimilarity(record, allData[i], keyColumns, fuzzyIndices);
    
    if (similarity.score > 85) {
      matches.push({
        index: i,
        record: allData[i],
        similarity: similarity.score,
        algorithms: similarity.algorithms
      });
    }
  }

  return matches.sort((a, b) => b.similarity - a.similarity);
}

function findSimilarRecordsInSample(sampleItem, itemIndex, sample, keyColumns, fuzzyIndices) {
  const matches = [];
  
  for (let i = itemIndex + 1; i < sample.length; i++) {
    const similarity = calculateSimilarity(
      sampleItem.data, 
      sample[i].data, 
      keyColumns, 
      fuzzyIndices
    );
    
    if (similarity.score > 90) {
      matches.push({
        index: i,
        similarity: similarity.score,
        algorithms: similarity.algorithms
      });
    }
  }

  return matches;
}

function calculateSimilarity(record1, record2, keyColumns, fuzzyIndices) {
  const scores = [];
  const algorithms = [];

  keyColumns.forEach(col => {
    const val1 = String(record1[col.index] || '').trim();
    const val2 = String(record2[col.index] || '').trim();
    
    if (!val1 || !val2) return;

    const levenshteinScore = calculateLevenshteinSimilarity(val1, val2);
    if (levenshteinScore > 70) {
      scores.push({ score: levenshteinScore, weight: 1.0 });
      algorithms.push('Levenshtein');
    }

    const jaroWinklerScore = calculateJaroWinklerSimilarity(val1, val2);
    if (jaroWinklerScore > 80) {
      scores.push({ score: jaroWinklerScore, weight: 1.2 });
      algorithms.push('Jaro-Winkler');
    }

    if (col.header.toLowerCase().includes('name')) {
      const soundexScore = calculateSoundexSimilarity(val1, val2);
      if (soundexScore > 0) {
        scores.push({ score: soundexScore, weight: 0.8 });
        algorithms.push('Soundex');
      }
    }

    const tokenScore = calculateTokenSortSimilarity(val1, val2);
    if (tokenScore > 85) {
      scores.push({ score: tokenScore, weight: 1.0 });
      algorithms.push('Token Sort');
    }

    if (fuzzyIndices[col.header]) {
      const fuzzyResults = fuzzyIndices[col.header].get(val1.toLowerCase());
      if (fuzzyResults && fuzzyResults.length > 0) {
        const fuzzyMatch = fuzzyResults.find(r => r[1] === val2.toLowerCase());
        if (fuzzyMatch && fuzzyMatch[0] > 0.8) {
          scores.push({ score: fuzzyMatch[0] * 100, weight: 1.1 });
          algorithms.push('FuzzySet');
        }
      }
    }
  });

  if (scores.length === 0) return { score: 0, algorithms: [] };

  const totalWeight = scores.reduce((sum, s) => sum + s.weight, 0);
  const weightedScore = scores.reduce((sum, s) => sum + s.score * s.weight, 0) / totalWeight;

  return {
    score: Math.round(weightedScore),
    algorithms: [...new Set(algorithms)]
  };
}

function calculateLevenshteinSimilarity(str1, str2) {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 100;
  
  const editDistance = levenshteinDistance(longer.toLowerCase(), shorter.toLowerCase());
  return Math.round(((longer.length - editDistance) / longer.length) * 100);
}

function levenshteinDistance(str1, str2) {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

function calculateJaroWinklerSimilarity(str1, str2) {
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();
  
  if (s1 === s2) return 100;
  
  const len1 = s1.length;
  const len2 = s2.length;
  
  const maxDist = Math.floor(Math.max(len1, len2) / 2) - 1;
  let matches = 0;
  let transpositions = 0;
  
  const s1Matches = new Array(len1).fill(false);
  const s2Matches = new Array(len2).fill(false);
  
  for (let i = 0; i < len1; i++) {
    const start = Math.max(0, i - maxDist);
    const end = Math.min(i + maxDist + 1, len2);
    
    for (let j = start; j < end; j++) {
      if (s2Matches[j] || s1[i] !== s2[j]) continue;
      s1Matches[i] = true;
      s2Matches[j] = true;
      matches++;
      break;
    }
  }
  
  if (matches === 0) return 0;
  
  let k = 0;
  for (let i = 0; i < len1; i++) {
    if (!s1Matches[i]) continue;
    while (!s2Matches[k]) k++;
    if (s1[i] !== s2[k]) transpositions++;
    k++;
  }
  
  const jaro = (matches / len1 + matches / len2 + (matches - transpositions / 2) / matches) / 3;
  
  let prefixLen = 0;
  for (let i = 0; i < Math.min(len1, len2, 4); i++) {
    if (s1[i] === s2[i]) prefixLen++;
    else break;
  }
  
  const jaroWinkler = jaro + prefixLen * 0.1 * (1 - jaro);
  return Math.round(jaroWinkler * 100);
}

function calculateSoundexSimilarity(str1, str2) {
  const soundex1 = soundex(str1);
  const soundex2 = soundex(str2);
  return soundex1 === soundex2 ? 90 : 0;
}

function soundex(str) {
  const s = str.toUpperCase().replace(/[^A-Z]/g, '');
  if (!s) return '';
  
  const firstLetter = s[0];
  const encoded = s.substring(1)
    .replace(/[AEIOUYHW]/g, '0')
    .replace(/[BFPV]/g, '1')
    .replace(/[CGJKQSXZ]/g, '2')
    .replace(/[DT]/g, '3')
    .replace(/[L]/g, '4')
    .replace(/[MN]/g, '5')
    .replace(/[R]/g, '6');
  
  const cleaned = firstLetter + encoded
    .split('')
    .filter((digit, index, arr) => digit !== '0' && digit !== arr[index - 1])
    .join('');
  
  return (cleaned + '000').substring(0, 4);
}

function calculateTokenSortSimilarity(str1, str2) {
  const tokens1 = str1.toLowerCase().split(/\s+/).sort();
  const tokens2 = str2.toLowerCase().split(/\s+/).sort();
  
  const sorted1 = tokens1.join(' ');
  const sorted2 = tokens2.join(' ');
  
  return calculateLevenshteinSimilarity(sorted1, sorted2);
}

function generateRecordKey(record, keyColumns) {
  return keyColumns
    .map(col => String(record[col.index] || '').toLowerCase().trim())
    .filter(v => v.length > 0)
    .join('|');
}

function extractKeyData(record, keyColumns) {
  const data = {};
  keyColumns.forEach(col => {
    data[col.header] = record[col.index];
  });
  return data;
}

function analyseMatchDetails(record1, record2, keyColumns) {
  const details = {
    matchingFields: [],
    differences: [],
    overallPattern: ''
  };

  keyColumns.forEach(col => {
    const val1 = String(record1[col.index] || '').trim();
    const val2 = String(record2[col.index] || '').trim();
    
    if (!val1 || !val2) return;

    const similarity = calculateLevenshteinSimilarity(val1, val2);
    
    if (similarity === 100) {
      details.matchingFields.push({
        field: col.header,
        similarity: '100%',
        type: 'Exact match'
      });
    } else if (similarity > 90) {
      details.matchingFields.push({
        field: col.header,
        similarity: `${similarity}%`,
        type: detectDifferenceType(val1, val2)
      });
    } else {
      details.differences.push({
        field: col.header,
        value1: val1,
        value2: val2,
        similarity: `${similarity}%`
      });
    }
  });

  if (details.matchingFields.length === keyColumns.length) {
    details.overallPattern = 'Near-exact duplicate';
  } else if (details.matchingFields.length > keyColumns.length * 0.6) {
    details.overallPattern = 'Likely same entity with variations';
  } else {
    details.overallPattern = 'Possible match requiring verification';
  }

  return details;
}

function detectDifferenceType(str1, str2) {
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();
  
  if (Math.abs(s1.length - s2.length) <= 2) {
    const charDiff = levenshteinDistance(s1, s2);
    if (charDiff === 1) return 'Single character difference (typo)';
    if (charDiff === 2) return 'Minor spelling variation';
  }
  
  if (s1.replace(/[^a-z0-9]/g, '') === s2.replace(/[^a-z0-9]/g, '')) {
    return 'Punctuation/spacing difference';
  }
  
  if (s1.includes(s2) || s2.includes(s1)) {
    return 'Abbreviation or truncation';
  }
  
  const tokens1 = s1.split(/\s+/).sort();
  const tokens2 = s2.split(/\s+/).sort();
  if (tokens1.join('') === tokens2.join('')) {
    return 'Word order variation';
  }
  
  return 'General variation';
}