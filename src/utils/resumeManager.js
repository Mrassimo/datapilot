/**
 * Resume Manager for Large File Processing
 * Enables pausing and resuming analysis for very large datasets
 */

import { writeFileSync, readFileSync, existsSync, unlinkSync, statSync, mkdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import crypto from 'crypto';
import chalk from 'chalk';

export class ResumeManager {
  constructor(filePath, analysisType = 'eda') {
    this.filePath = filePath;
    this.analysisType = analysisType;
    this.fileHash = this.generateFileHash(filePath);
    this.resumeDir = join(homedir(), '.datapilot', 'resume');
    this.resumeFile = join(this.resumeDir, `${this.fileHash}_${analysisType}.json`);
    this.progressFile = join(this.resumeDir, `${this.fileHash}_progress.json`);
    
    // Store file stats for progress estimation
    try {
      this.fileStats = statSync(filePath);
    } catch (error) {
      this.fileStats = { size: 0 };
    }
    
    // Ensure resume directory exists
    this.ensureResumeDirectory();
  }

  generateFileHash(filePath) {
    // Create unique hash based on file path and modification time
    try {
      const stats = statSync(filePath);
      const content = `${filePath}:${stats.mtime.getTime()}:${stats.size}`;
      return crypto.createHash('md5').update(content).digest('hex').substring(0, 12);
    } catch (error) {
      // Fallback to simple path hash
      return crypto.createHash('md5').update(filePath).digest('hex').substring(0, 12);
    }
  }

  ensureResumeDirectory() {
    const resumeDir = this.resumeDir;
    
    try {
      if (!existsSync(resumeDir)) {
        mkdirSync(resumeDir, { recursive: true });
      }
    } catch (error) {
      console.warn(chalk.yellow(`Warning: Could not create resume directory: ${error.message}`));
    }
  }

  saveProgress(stage, data, percentage = 0) {
    try {
      const progressData = {
        filePath: this.filePath,
        analysisType: this.analysisType,
        stage,
        percentage,
        timestamp: new Date().toISOString(),
        data,
        version: '1.0'
      };

      writeFileSync(this.resumeFile, JSON.stringify(progressData, null, 2));
      
      // Also save lightweight progress info
      const progressInfo = {
        stage,
        percentage,
        timestamp: progressData.timestamp,
        estimatedTimeRemaining: this.calculateTimeRemaining(percentage)
      };
      
      writeFileSync(this.progressFile, JSON.stringify(progressInfo, null, 2));
      
      if (percentage > 0) {
        console.log(chalk.cyan(`💾 Progress saved: ${stage} (${percentage.toFixed(1)}%)`));
      }
    } catch (error) {
      console.warn(chalk.yellow(`Warning: Could not save progress: ${error.message}`));
    }
  }

  loadProgress() {
    try {
      if (!existsSync(this.resumeFile)) {
        return null;
      }

      const progressData = JSON.parse(readFileSync(this.resumeFile, 'utf8'));
      
      // Validate the progress data
      if (progressData.filePath !== this.filePath || 
          progressData.analysisType !== this.analysisType) {
        return null;
      }

      // Check if the saved progress is recent (within 24 hours)
      const savedTime = new Date(progressData.timestamp);
      const now = new Date();
      const hoursDiff = (now - savedTime) / (1000 * 60 * 60);
      
      if (hoursDiff > 24) {
        this.cleanupResumeData();
        return null;
      }

      return progressData;
    } catch (error) {
      console.warn(chalk.yellow(`Warning: Could not load progress: ${error.message}`));
      return null;
    }
  }

  hasResumeData() {
    return existsSync(this.resumeFile);
  }

  cleanupResumeData() {
    try {
      if (existsSync(this.resumeFile)) {
        unlinkSync(this.resumeFile);
      }
      if (existsSync(this.progressFile)) {
        unlinkSync(this.progressFile);
      }
      console.log(chalk.gray('🧹 Cleaned up resume data'));
    } catch (error) {
      console.warn(chalk.yellow(`Warning: Could not cleanup resume data: ${error.message}`));
    }
  }

  calculateTimeRemaining(percentage) {
    if (percentage <= 0) return null;
    
    try {
      const progressInfo = existsSync(this.progressFile) 
        ? JSON.parse(readFileSync(this.progressFile, 'utf8'))
        : null;

      if (!progressInfo || !progressInfo.timestamp) return null;

      const startTime = new Date(progressInfo.timestamp);
      const now = new Date();
      const elapsedMs = now - startTime;
      const remainingPercentage = 100 - percentage;
      const estimatedRemainingMs = (elapsedMs / percentage) * remainingPercentage;

      const minutes = Math.round(estimatedRemainingMs / (1000 * 60));
      return minutes > 0 ? `${minutes} minutes` : 'Less than 1 minute';
    } catch (error) {
      return null;
    }
  }

  static async promptForResume(resumeManager) {
    const progressData = resumeManager.loadProgress();
    if (!progressData) return false;

    console.log(chalk.cyan('\n🔄 Resume Analysis Available'));
    console.log(chalk.white(`Previous analysis was interrupted at: ${progressData.stage}`));
    console.log(chalk.white(`Progress: ${progressData.percentage.toFixed(1)}%`));
    console.log(chalk.white(`Saved: ${new Date(progressData.timestamp).toLocaleString()}`));
    
    const timeRemaining = resumeManager.calculateTimeRemaining(progressData.percentage);
    if (timeRemaining) {
      console.log(chalk.white(`Estimated time remaining: ${timeRemaining}`));
    }

    // For CLI, we'll automatically resume if data exists
    // In the future, this could be made interactive
    console.log(chalk.green('✨ Resuming from saved progress...\n'));
    return progressData;
  }

  static getResumeStages() {
    return {
      PARSING: 'parsing',
      COLUMN_ANALYSIS: 'column_analysis', 
      DISTRIBUTIONS: 'distributions',
      OUTLIERS: 'outliers',
      CORRELATIONS: 'correlations',
      CART: 'cart_analysis',
      PATTERNS: 'pattern_detection',
      FORMATTING: 'formatting_output'
    };
  }

  // Create a checkpoint that can be resumed from
  createCheckpoint(stage, analysisData, percentage) {
    const checkpoint = {
      stage,
      data: this.sanitizeForSerialization(analysisData),
      percentage,
      canResume: true
    };

    this.saveProgress(stage, checkpoint, percentage);
    return checkpoint;
  }

  // Sanitize data for JSON serialization
  sanitizeForSerialization(data) {
    try {
      // Remove circular references and functions
      return JSON.parse(JSON.stringify(data, (key, value) => {
        if (typeof value === 'function') return undefined;
        if (value instanceof Error) return { message: value.message, stack: value.stack };
        return value;
      }));
    } catch (error) {
      console.warn('Warning: Could not sanitize data for serialization');
      return {};
    }
  }
}

// Enhanced progress tracking with resume capability
export class ResumableProgressTracker {
  constructor(totalStages, resumeManager, startStage = 0) {
    this.totalStages = totalStages;
    this.currentStage = startStage;
    this.resumeManager = resumeManager;
    this.startTime = Date.now();
    this.stageStartTime = Date.now();
  }

  advance(stageName, data = null) {
    this.currentStage++;
    const percentage = (this.currentStage / this.totalStages) * 100;
    
    console.log(chalk.cyan(`📊 ${stageName} (${this.currentStage}/${this.totalStages})`));
    
    // Save checkpoint for resume capability
    if (this.resumeManager && percentage > 10) {
      this.resumeManager.createCheckpoint(stageName, data, percentage);
    }
    
    // Update timing
    const now = Date.now();
    const stageTime = now - this.stageStartTime;
    this.stageStartTime = now;
    
    if (stageTime > 5000) { // Only show timing for stages > 5 seconds
      console.log(chalk.gray(`   Completed in ${(stageTime / 1000).toFixed(1)}s`));
    }
    
    return percentage;
  }

  complete() {
    const totalTime = Date.now() - this.startTime;
    console.log(chalk.green(`✅ Analysis complete in ${(totalTime / 1000).toFixed(1)}s`));
    
    if (this.resumeManager) {
      this.resumeManager.cleanupResumeData();
    }
  }
}