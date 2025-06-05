/**
 * Simple logger utility for DataPilot
 */

/* eslint-disable no-console */

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

export class Logger {
  private static instance: Logger;
  private level: LogLevel = LogLevel.INFO;

  private constructor() {}

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  setLevel(level: LogLevel): void {
    this.level = level;
  }

  error(message: string, ...args: unknown[]): void {
    if (this.level >= LogLevel.ERROR) {
      console.error(`❌ ERROR: ${message}`, ...args);
    }
  }

  warn(message: string, ...args: unknown[]): void {
    if (this.level >= LogLevel.WARN) {
      console.warn(`⚠️  WARN: ${message}`, ...args);
    }
  }

  info(message: string, ...args: unknown[]): void {
    if (this.level >= LogLevel.INFO) {
      console.log(`ℹ️  INFO: ${message}`, ...args);
    }
  }

  debug(message: string, ...args: unknown[]): void {
    if (this.level >= LogLevel.DEBUG) {
      console.log(`🐛 DEBUG: ${message}`, ...args);
    }
  }

  progress(message: string): void {
    if (this.level >= LogLevel.INFO) {
      process.stdout.write(`\r⏳ ${message}`);
    }
  }

  success(message: string): void {
    if (this.level >= LogLevel.INFO) {
      console.log(`\r✅ ${message}`);
    }
  }

  newline(): void {
    console.log();
  }
}

export const logger = Logger.getInstance();
