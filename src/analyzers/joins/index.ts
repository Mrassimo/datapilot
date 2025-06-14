/**
 * DataPilot Join Analysis - Phase 1: Foundation Architecture
 * 
 * Simple, focused implementation of core join analysis capabilities.
 * Future phases will build upon this foundation.
 */

// Core types and interfaces
export * from './types';

// Phase 1 components
export { RelationshipDetector } from './relationship-detector';
export { JoinAnalyzer } from './join-analyzer';
export { IntelligentColumnMatcher } from './column-matcher';
export { JoinFormatter } from './join-formatter';

// Simplified facade for easy integration
export { createJoinAnalyzer } from './simple-facade';