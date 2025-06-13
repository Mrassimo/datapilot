/**
 * DataPilot Join Analysis - Phase 1: Foundation Architecture
 * 
 * Simple, focused implementation of core join analysis capabilities.
 * Future phases will build upon this foundation.
 */

// Core types and interfaces
export * from './types.js';

// Phase 1 components
export { RelationshipDetector } from './relationship-detector.js';
export { JoinAnalyzer } from './join-analyzer.js';
export { IntelligentColumnMatcher } from './column-matcher.js';
export { JoinFormatter } from './join-formatter.js';

// Simplified facade for easy integration
export { createJoinAnalyzer } from './simple-facade.js';