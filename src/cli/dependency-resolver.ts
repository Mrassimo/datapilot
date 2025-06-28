/**
 * Ultra-Advanced Dependency Graph System for CLI Analyzers
 * Handles complex dependency resolution, circular detection, memory optimization, and conditional execution
 */

import type {
  SectionResult,
  SectionResultMap,
  DependencyResolver,
  AnalyzerDependency,
  CLIOptions,
  CLIErrorContext,
} from './types';
import type { LogContext } from '../utils/logger';
import { logger } from '../utils/logger';
import { DataPilotError, ErrorSeverity, ErrorCategory } from '../core/types';

/**
 * Graph node representing a section with its dependencies
 */
interface DependencyNode {
  id: string;
  dependencies: Set<string>;
  dependents: Set<string>;
  optional: boolean;
  weight: number; // Memory/computational weight for optimization
  condition?: (options: CLIOptions) => boolean; // Conditional execution
  executionTime?: number; // Track actual execution time for future optimization
}

/**
 * Execution plan for dependency resolution
 */
export interface ExecutionPlan {
  order: string[];
  memoryOptimized: boolean;
  conditionalSkips: string[];
  parallelGroups: string[][];
  estimatedMemoryPeak: number;
}

/**
 * Advanced dependency graph with topological sorting, cycle detection, and memory optimization
 */
export class DependencyGraph {
  private nodes = new Map<string, DependencyNode>();
  private resolved = new Set<string>();
  private resolving = new Set<string>(); // For cycle detection
  private executionHistory = new Map<string, number[]>(); // Performance tracking
  private memoryThreshold: number;

  constructor(memoryThreshold: number = 512 * 1024 * 1024) { // 512MB default
    this.memoryThreshold = memoryThreshold;
    this.initializeDefaultNodes();
  }

  /**
   * Initialize the default section dependency graph
   */
  private initializeDefaultNodes(): void {
    // Section 1: Overview - No dependencies, lightweight
    this.addNode('section1', [], false, 10, () => true);
    
    // Section 2: Quality - Independent, moderate weight
    this.addNode('section2', [], false, 20, () => true);
    
    // Section 3: EDA - Independent, heavy computational weight
    this.addNode('section3', [], false, 40, () => true);
    
    // Section 4: Visualization - Depends on section1 and section3
    this.addNode('section4', ['section1', 'section3'], false, 25, 
      (options) => !options.sections || options.sections.includes('4') || options.sections.includes('section4'));
    
    // Section 5: Engineering - Depends on sections 1, 2, 3
    this.addNode('section5', ['section1', 'section2', 'section3'], false, 35,
      (options) => !options.sections || options.sections.includes('5') || options.sections.includes('section5'));
    
    // Section 6: Modeling - Depends on sections 1, 2, 3, 5 (critical dependencies)
    this.addNode('section6', ['section1', 'section2', 'section3', 'section5'], false, 60,
      (options) => !options.sections || options.sections.includes('6') || options.sections.includes('section6'));
  }

  /**
   * Add a node to the dependency graph
   */
  addNode(
    id: string, 
    dependencies: string[] = [], 
    optional: boolean = false,
    weight: number = 10,
    condition?: (options: CLIOptions) => boolean
  ): void {
    const node: DependencyNode = {
      id,
      dependencies: new Set(dependencies),
      dependents: new Set(),
      optional,
      weight,
      condition,
    };

    this.nodes.set(id, node);

    // Update dependents for existing nodes
    dependencies.forEach(depId => {
      const depNode = this.nodes.get(depId);
      if (depNode) {
        depNode.dependents.add(id);
      }
    });
  }

  /**
   * Detect circular dependencies using DFS
   */
  detectCircularDependencies(): { hasCircles: boolean; cycles: string[][] } {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const cycles: string[][] = [];

    const dfs = (nodeId: string, path: string[]): boolean => {
      if (recursionStack.has(nodeId)) {
        // Found a cycle - extract the cycle from the path
        const cycleStart = path.indexOf(nodeId);
        const cycle = path.slice(cycleStart).concat(nodeId);
        cycles.push(cycle);
        return true;
      }

      if (visited.has(nodeId)) {
        return false;
      }

      visited.add(nodeId);
      recursionStack.add(nodeId);
      path.push(nodeId);

      const node = this.nodes.get(nodeId);
      if (node) {
        for (const depId of node.dependencies) {
          if (dfs(depId, [...path])) {
            return true;
          }
        }
      }

      recursionStack.delete(nodeId);
      path.pop();
      return false;
    };

    let hasCircles = false;
    for (const nodeId of this.nodes.keys()) {
      if (!visited.has(nodeId)) {
        if (dfs(nodeId, [])) {
          hasCircles = true;
        }
      }
    }

    return { hasCircles, cycles };
  }

  /**
   * Generate optimal execution plan using modified Kahn's algorithm with memory optimization
   */
  generateExecutionPlan(requestedSections: string[], options: CLIOptions): ExecutionPlan {
    // Validate circular dependencies first
    const circularCheck = this.detectCircularDependencies();
    if (circularCheck.hasCircles) {
      throw new DataPilotError(
        'Circular dependencies detected in section graph',
        'CIRCULAR_DEPENDENCY',
        ErrorSeverity.CRITICAL,
        ErrorCategory.VALIDATION,
        {},
        circularCheck.cycles.map(cycle => ({
          action: 'Break circular dependency',
          description: `Circular dependency found: ${cycle.join(' -> ')}`,
          severity: ErrorSeverity.CRITICAL,
        }))
      );
    }

    // Filter sections based on conditions
    const activeNodes = new Map<string, DependencyNode>();
    const conditionalSkips: string[] = [];

    for (const [nodeId, node] of this.nodes) {
      if (node.condition && !node.condition(options)) {
        conditionalSkips.push(nodeId);
        continue;
      }
      activeNodes.set(nodeId, node);
    }

    // Expand requested sections to include all dependencies
    const requiredSections = this.expandDependencies(requestedSections, activeNodes);

    // Topological sort with memory optimization
    const order = this.topologicalSort(requiredSections, activeNodes);
    
    // Identify parallel execution opportunities
    const parallelGroups = this.identifyParallelGroups(order, activeNodes);
    
    // Calculate memory optimization
    const memoryOptimized = this.isMemoryOptimized(order, activeNodes);
    const estimatedMemoryPeak = this.estimateMemoryPeak(order, activeNodes);

    return {
      order,
      memoryOptimized,
      conditionalSkips,
      parallelGroups,
      estimatedMemoryPeak,
    };
  }

  /**
   * Expand requested sections to include all required dependencies
   */
  private expandDependencies(
    requestedSections: string[], 
    activeNodes: Map<string, DependencyNode>
  ): Set<string> {
    const required = new Set<string>();
    const stack = [...requestedSections];

    while (stack.length > 0) {
      const sectionId = stack.pop()!;
      if (required.has(sectionId)) continue;

      const node = activeNodes.get(sectionId);
      if (!node) {
        throw new DataPilotError(
          `Section ${sectionId} not found in dependency graph`,
          'MISSING_SECTION',
          ErrorSeverity.HIGH,
          ErrorCategory.VALIDATION,
          {}
        );
      }

      required.add(sectionId);
      
      // Add all dependencies to stack
      for (const depId of node.dependencies) {
        if (!required.has(depId) && activeNodes.has(depId)) {
          stack.push(depId);
        }
      }
    }

    return required;
  }

  /**
   * Topological sort using Kahn's algorithm with memory-aware ordering
   */
  private topologicalSort(
    requiredSections: Set<string>, 
    activeNodes: Map<string, DependencyNode>
  ): string[] {
    const inDegree = new Map<string, number>();
    const queue: string[] = [];
    const result: string[] = [];

    // Calculate in-degrees for required sections only
    for (const sectionId of requiredSections) {
      const node = activeNodes.get(sectionId)!;
      const deps = Array.from(node.dependencies).filter(dep => requiredSections.has(dep));
      inDegree.set(sectionId, deps.length);
      
      if (deps.length === 0) {
        queue.push(sectionId);
      }
    }

    // Sort queue by weight (lighter sections first for memory efficiency)
    queue.sort((a, b) => {
      const weightA = activeNodes.get(a)?.weight || 0;
      const weightB = activeNodes.get(b)?.weight || 0;
      return weightA - weightB;
    });

    while (queue.length > 0) {
      // Choose next node with memory optimization
      const nodeId = this.selectNextNode(queue, activeNodes);
      const nodeIndex = queue.indexOf(nodeId);
      queue.splice(nodeIndex, 1);
      
      result.push(nodeId);
      
      const node = activeNodes.get(nodeId)!;
      
      // Update in-degrees of dependents
      for (const dependentId of node.dependents) {
        if (requiredSections.has(dependentId)) {
          const currentInDegree = inDegree.get(dependentId)! - 1;
          inDegree.set(dependentId, currentInDegree);
          
          if (currentInDegree === 0) {
            this.insertSorted(queue, dependentId, activeNodes);
          }
        }
      }
    }

    // Verify all required sections are included
    if (result.length !== requiredSections.size) {
      const missing = Array.from(requiredSections).filter(s => !result.includes(s));
      throw new DataPilotError(
        `Failed to resolve all dependencies. Missing: ${missing.join(', ')}`,
        'INCOMPLETE_RESOLUTION',
        ErrorSeverity.HIGH,
        ErrorCategory.ANALYSIS,
        {}
      );
    }

    return result;
  }

  /**
   * Select next node for execution based on memory optimization
   */
  private selectNextNode(queue: string[], activeNodes: Map<string, DependencyNode>): string {
    if (queue.length === 1) return queue[0];

    // Prioritize nodes that:
    // 1. Have lower memory weight
    // 2. Enable more dependents to execute sooner
    // 3. Have historically faster execution times

    let bestNode = queue[0];
    let bestScore = this.calculateNodeScore(bestNode, activeNodes);

    for (let i = 1; i < queue.length; i++) {
      const score = this.calculateNodeScore(queue[i], activeNodes);
      if (score > bestScore) {
        bestScore = score;
        bestNode = queue[i];
      }
    }

    return bestNode;
  }

  /**
   * Calculate optimization score for node selection
   */
  private calculateNodeScore(nodeId: string, activeNodes: Map<string, DependencyNode>): number {
    const node = activeNodes.get(nodeId)!;
    
    // Lower weight is better (negative contribution)
    const weightScore = -node.weight;
    
    // More dependents enabled is better
    const dependentScore = node.dependents.size * 10;
    
    // Faster historical execution is better
    const history = this.executionHistory.get(nodeId) || [];
    const avgTime = history.length > 0 ? history.reduce((a, b) => a + b) / history.length : 1000;
    const timeScore = -avgTime / 100;
    
    return weightScore + dependentScore + timeScore;
  }

  /**
   * Insert node into queue maintaining sorted order by weight
   */
  private insertSorted(queue: string[], nodeId: string, activeNodes: Map<string, DependencyNode>): void {
    const weight = activeNodes.get(nodeId)?.weight || 0;
    
    let insertIndex = queue.length;
    for (let i = 0; i < queue.length; i++) {
      const queueWeight = activeNodes.get(queue[i])?.weight || 0;
      if (weight < queueWeight) {
        insertIndex = i;
        break;
      }
    }
    
    queue.splice(insertIndex, 0, nodeId);
  }

  /**
   * Identify sections that can execute in parallel
   */
  private identifyParallelGroups(
    order: string[], 
    activeNodes: Map<string, DependencyNode>
  ): string[][] {
    const groups: string[][] = [];
    const processed = new Set<string>();
    
    while (processed.size < order.length) {
      const parallelGroup: string[] = [];
      
      for (const sectionId of order) {
        if (processed.has(sectionId)) continue;
        
        const node = activeNodes.get(sectionId)!;
        
        // Check if all dependencies are already processed
        const canExecute = Array.from(node.dependencies).every(dep => processed.has(dep));
        
        if (canExecute) {
          parallelGroup.push(sectionId);
        }
      }
      
      if (parallelGroup.length === 0) break; // Safety check
      
      groups.push(parallelGroup);
      parallelGroup.forEach(id => processed.add(id));
    }
    
    return groups;
  }

  /**
   * Check if execution order is memory optimized
   */
  private isMemoryOptimized(order: string[], activeNodes: Map<string, DependencyNode>): boolean {
    let currentMemory = 0;
    
    for (const sectionId of order) {
      const node = activeNodes.get(sectionId)!;
      currentMemory += node.weight * 1024 * 1024; // Convert weight to approximate bytes
      
      if (currentMemory > this.memoryThreshold) {
        return false;
      }
      
      // Assume memory is freed after dependents no longer need it
      if (node.dependents.size === 0) {
        currentMemory -= node.weight * 1024 * 1024;
      }
    }
    
    return true;
  }

  /**
   * Estimate peak memory usage for execution plan
   */
  private estimateMemoryPeak(order: string[], activeNodes: Map<string, DependencyNode>): number {
    let currentMemory = 0;
    let peakMemory = 0;
    const activeWeights = new Map<string, number>();
    
    for (const sectionId of order) {
      const node = activeNodes.get(sectionId)!;
      const weight = node.weight * 1024 * 1024;
      
      activeWeights.set(sectionId, weight);
      currentMemory += weight;
      peakMemory = Math.max(peakMemory, currentMemory);
      
      // Check if any previous sections can be garbage collected
      for (const [prevId, prevWeight] of activeWeights) {
        if (prevId === sectionId) continue;
        
        const prevNode = activeNodes.get(prevId)!;
        const stillNeeded = Array.from(prevNode.dependents).some(depId => 
          order.indexOf(depId) > order.indexOf(sectionId)
        );
        
        if (!stillNeeded) {
          currentMemory -= prevWeight;
          activeWeights.delete(prevId);
        }
      }
    }
    
    return peakMemory;
  }

  /**
   * Record execution time for future optimization
   */
  recordExecutionTime(sectionId: string, timeMs: number): void {
    if (!this.executionHistory.has(sectionId)) {
      this.executionHistory.set(sectionId, []);
    }
    
    const history = this.executionHistory.get(sectionId)!;
    history.push(timeMs);
    
    // Keep only last 10 executions for optimization
    if (history.length > 10) {
      history.shift();
    }
    
    // Update node execution time
    const node = this.nodes.get(sectionId);
    if (node) {
      node.executionTime = history.reduce((a, b) => a + b) / history.length;
    }
  }

  /**
   * Get dependency graph visualization for debugging
   */
  getGraphVisualization(): string {
    const lines: string[] = ['Dependency Graph:'];
    
    for (const [nodeId, node] of this.nodes) {
      const deps = Array.from(node.dependencies).join(', ') || 'none';
      const dependents = Array.from(node.dependents).join(', ') || 'none';
      const avgTime = node.executionTime ? `${node.executionTime.toFixed(0)}ms` : 'N/A';
      
      lines.push(`  ${nodeId}:`);
      lines.push(`    Dependencies: ${deps}`);
      lines.push(`    Dependents: ${dependents}`);
      lines.push(`    Weight: ${node.weight}`);
      lines.push(`    Optional: ${node.optional}`);
      lines.push(`    Avg Time: ${avgTime}`);
      lines.push('');
    }
    
    return lines.join('\n');
  }

  /**
   * Validate specific dependency requirements
   */
  validateDependencies(requestedSections: string[]): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check for unknown sections
    for (const section of requestedSections) {
      if (!this.nodes.has(section)) {
        errors.push(`Unknown section: ${section}`);
      }
    }

    if (errors.length > 0) {
      return { isValid: false, errors, warnings };
    }

    // Check dependency satisfaction
    const requiredSections = this.expandDependencies(requestedSections, this.nodes);
    
    for (const section of requestedSections) {
      const node = this.nodes.get(section)!;
      
      for (const depId of node.dependencies) {
        if (!requiredSections.has(depId)) {
          errors.push(
            `Section ${section} requires ${depId}, but ${depId} is not available`
          );
        }
      }
    }

    // Check for performance warnings
    if (requestedSections.includes('section6') && requestedSections.length === 1) {
      warnings.push(
        'Requesting section6 alone will auto-execute sections 1, 2, 3, and 5 as dependencies'
      );
    }

    // Check memory concerns
    const totalWeight = Array.from(requiredSections)
      .map(id => this.nodes.get(id)?.weight || 0)
      .reduce((a, b) => a + b, 0);
    
    if (totalWeight > 100) {
      warnings.push(
        `High memory usage expected (${totalWeight} units). Consider running sections separately.`
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }
}

/**
 * Concrete implementation of dependency resolver with caching and validation
 */
export class AnalyzerDependencyResolver implements DependencyResolver {
  private dependencies = new Map<string, AnalyzerDependency>();
  private resolverFunctions = new Map<string, () => Promise<SectionResult>>();
  private context: LogContext;
  private dependencyGraph: DependencyGraph;
  private currentExecutionPlan?: ExecutionPlan;
  private options: CLIOptions;

  constructor(context: LogContext = {}, options: CLIOptions = {}) {
    this.context = context;
    this.options = options;
    this.dependencyGraph = new DependencyGraph(
      options.memoryLimit || 512 * 1024 * 1024
    );
  }

  /**
   * Generate optimal execution plan for requested sections
   */
  planExecution(requestedSections: string[]): ExecutionPlan {
    logger.info(
      `Planning execution for sections: ${requestedSections.join(', ')}`,
      { ...this.context, operation: 'execution_planning' }
    );

    try {
      // Validate dependencies first
      const validation = this.dependencyGraph.validateDependencies(requestedSections);
      
      if (!validation.isValid) {
        throw new DataPilotError(
          `Dependency validation failed: ${validation.errors.join(', ')}`,
          'DEPENDENCY_VALIDATION_FAILED',
          ErrorSeverity.HIGH,
          ErrorCategory.VALIDATION,
          this.context,
          validation.errors.map(error => ({
            action: 'Fix dependency',
            description: error,
            severity: ErrorSeverity.HIGH,
          }))
        );
      }

      // Log warnings
      validation.warnings.forEach(warning => {
        logger.warn(warning, { ...this.context, operation: 'execution_planning' });
      });

      // Generate execution plan
      this.currentExecutionPlan = this.dependencyGraph.generateExecutionPlan(
        requestedSections, 
        this.options
      );

      logger.info(
        `Execution plan generated: ${this.currentExecutionPlan.order.join(' -> ')}`,
        {
          ...this.context,
          operation: 'execution_planning',
          memoryOptimized: this.currentExecutionPlan.memoryOptimized,
          estimatedPeakMemory: this.currentExecutionPlan.estimatedMemoryPeak,
          parallelGroups: this.currentExecutionPlan.parallelGroups.length,
        }
      );

      return this.currentExecutionPlan;
    } catch (error) {
      logger.error('Failed to plan execution', this.context, error);
      throw error;
    }
  }

  /**
   * Get current execution plan
   */
  getExecutionPlan(): ExecutionPlan | undefined {
    return this.currentExecutionPlan;
  }

  /**
   * Check if parallel execution is possible for given sections
   */
  canExecuteInParallel(sectionA: string, sectionB: string): boolean {
    if (!this.currentExecutionPlan) {
      return false;
    }

    return this.currentExecutionPlan.parallelGroups.some(group =>
      group.includes(sectionA) && group.includes(sectionB)
    );
  }

  /**
   * Register resolver function for a section
   */
  registerResolver<K extends keyof SectionResultMap>(
    sectionName: K,
    resolver: () => Promise<SectionResultMap[K]>,
  ): void {
    this.resolverFunctions.set(sectionName, resolver);
    logger.debug(`Registered resolver for ${sectionName}`, this.context);
  }

  /**
   * Resolve a specific section dependency with error handling and performance tracking
   */
  async resolve<K extends keyof SectionResultMap>(sectionName: K): Promise<SectionResultMap[K]> {
    const startTime = Date.now();
    const sectionContext: LogContext = {
      ...this.context,
      section: sectionName,
      operation: 'dependency_resolution',
    };

    try {
      // Check if already cached
      if (this.dependencies.has(sectionName)) {
        const cached = this.dependencies.get(sectionName);
        logger.debug(
          `Using cached result for ${sectionName} (cached at ${cached.timestamp.toISOString()})`,
          sectionContext,
        );
        return cached.result as SectionResultMap[K];
      }

      // Validate execution plan compliance
      if (this.currentExecutionPlan && !this.currentExecutionPlan.order.includes(sectionName)) {
        logger.warn(
          `Section ${sectionName} not in current execution plan, executing ad-hoc`,
          sectionContext
        );
      }

      // Validate resolver exists
      const resolver = this.resolverFunctions.get(sectionName);
      if (!resolver) {
        throw DataPilotError.analysis(
          `No resolver registered for section: ${sectionName}`,
          'MISSING_RESOLVER',
          sectionContext,
          [
            {
              action: 'Register resolver',
              description: `Call registerResolver('${sectionName}', resolver) before resolving`,
              severity: ErrorSeverity.HIGH,
            },
          ],
        );
      }

      // Check memory constraints before execution
      if (this.currentExecutionPlan && this.currentExecutionPlan.estimatedMemoryPeak > 0) {
        const currentMemory = process.memoryUsage().heapUsed;
        const memoryLimit = this.options.memoryLimit || 512 * 1024 * 1024;
        
        if (currentMemory > memoryLimit * 0.8) {
          logger.warn(
            `High memory usage detected (${(currentMemory / 1024 / 1024).toFixed(0)}MB), proceeding with caution`,
            sectionContext
          );
        }
      }

      logger.info(`Resolving dependency: ${sectionName}`, sectionContext);

      // Execute resolver with adaptive timeout based on historical data
      const timeoutMs = this.calculateTimeoutForSection(sectionName);
      const result = await this.executeWithTimeout(resolver, timeoutMs);

      // Validate result
      this.validateSectionResult(sectionName, result);

      // Cache the result
      this.cache(sectionName, result as SectionResultMap[K]);

      const duration = Date.now() - startTime;
      
      // Record execution time for future optimization
      this.dependencyGraph.recordExecutionTime(sectionName, duration);
      
      logger.info(`Successfully resolved ${sectionName} in ${duration}ms`, sectionContext);

      return result as SectionResultMap[K];
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error(`Failed to resolve ${sectionName} after ${duration}ms`, sectionContext, error);

      // Record failed execution time
      this.dependencyGraph.recordExecutionTime(sectionName, duration);

      if (error instanceof DataPilotError) {
        throw error;
      }

      throw DataPilotError.analysis(
        `Failed to resolve dependency ${sectionName}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'DEPENDENCY_RESOLUTION_FAILED',
        sectionContext,
        [
          {
            action: 'Check analyzer implementation',
            description: 'Verify the analyzer for this section is working correctly',
            severity: ErrorSeverity.HIGH,
          },
          {
            action: 'Check input data',
            description: 'Ensure the input data is valid and accessible',
            severity: ErrorSeverity.MEDIUM,
          },
          {
            action: 'Check memory constraints',
            description: 'Verify sufficient memory is available for this section',
            severity: ErrorSeverity.MEDIUM,
          },
        ],
      );
    }
  }

  /**
   * Calculate adaptive timeout based on historical execution data
   */
  private calculateTimeoutForSection(sectionName: string): number {
    const baseTimeout = 300000; // 5 minutes
    const node = this.dependencyGraph['nodes'].get(sectionName);
    
    if (node?.executionTime) {
      // Use 3x average execution time as timeout, with minimum of base timeout
      return Math.max(baseTimeout, node.executionTime * 3);
    }
    
    return baseTimeout;
  }

  /**
   * Execute resolver with timeout protection
   */
  private async executeWithTimeout<T>(resolver: () => Promise<T>, timeoutMs: number): Promise<T> {
    return Promise.race([
      resolver(),
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error('Resolver timeout')), timeoutMs),
      ),
    ]);
  }

  /**
   * Validate that a section result has the expected structure
   */
  private validateSectionResult(sectionName: string, result: SectionResult): void {
    if (!result) {
      throw DataPilotError.validation(
        `${sectionName} resolver returned null or undefined`,
        'NULL_RESULT',
        { section: sectionName },
      );
    }

    // Check for required properties based on section type
    const validationRules = this.getSectionValidationRules(sectionName);

    for (const rule of validationRules) {
      if (!this.hasProperty(result, rule.property)) {
        throw DataPilotError.validation(
          `${sectionName} result missing required property: ${rule.property}`,
          'MISSING_PROPERTY',
          { section: sectionName },
          [
            {
              action: 'Check analyzer implementation',
              description: `Ensure ${sectionName} analyzer returns an object with ${rule.property}`,
              severity: ErrorSeverity.HIGH,
            },
          ],
        );
      }
    }

    // Check for warnings array
    if (result.warnings && !Array.isArray(result.warnings)) {
      throw DataPilotError.validation(
        `${sectionName} warnings must be an array`,
        'INVALID_WARNINGS',
        { section: sectionName },
      );
    }
  }

  /**
   * Get validation rules for a specific section
   */
  private getSectionValidationRules(
    sectionName: string,
  ): Array<{ property: string; required: boolean }> {
    const rules: Record<string, Array<{ property: string; required: boolean }>> = {
      section1: [
        { property: 'overview', required: true },
        { property: 'warnings', required: true },
        { property: 'performanceMetrics', required: false },
      ],
      section2: [
        { property: 'qualityAudit', required: true },
        { property: 'warnings', required: true },
        { property: 'performanceMetrics', required: false },
      ],
      section3: [
        { property: 'edaAnalysis', required: true },
        { property: 'warnings', required: true },
        { property: 'performanceMetrics', required: false },
      ],
      section4: [
        { property: 'visualizationAnalysis', required: true },
        { property: 'warnings', required: true },
        { property: 'performanceMetrics', required: false },
      ],
      section5: [
        { property: 'engineeringAnalysis', required: true },
        { property: 'warnings', required: true },
        { property: 'performanceMetrics', required: false },
      ],
      section6: [
        { property: 'modelingAnalysis', required: true },
        { property: 'warnings', required: true },
        { property: 'performanceMetrics', required: false },
      ],
    };

    return rules[sectionName] || [];
  }

  /**
   * Check if object has a property using safe property access
   */
  private hasProperty(obj: any, property: string): boolean {
    return obj && typeof obj === 'object' && property in obj;
  }

  /**
   * Cache a section result with metadata
   */
  cache<K extends keyof SectionResultMap>(sectionName: K, result: SectionResultMap[K]): void {
    const dependency: AnalyzerDependency<SectionResultMap[K]> = {
      name: sectionName,
      result,
      timestamp: new Date(),
      cached: true,
    };

    this.dependencies.set(sectionName, dependency);
    logger.debug(`Cached result for ${sectionName}`, {
      ...this.context,
      section: sectionName,
      cacheSize: this.dependencies.size,
    });
  }

  /**
   * Clear all cached dependencies
   */
  clear(): void {
    const cachedCount = this.dependencies.size;
    this.dependencies.clear();
    this.resolverFunctions.clear();

    logger.debug(`Cleared ${cachedCount} cached dependencies`, this.context);
  }

  /**
   * Check if a section is already cached
   */
  has(sectionName: string): boolean {
    return this.dependencies.has(sectionName);
  }

  /**
   * Get all cached section names
   */
  getCachedSections(): string[] {
    return Array.from(this.dependencies.keys());
  }

  /**
   * Get dependency resolution statistics
   */
  getStats(): {
    totalCached: number;
    cachedSections: string[];
    oldestCache?: Date;
    newestCache?: Date;
  } {
    const dependencies = Array.from(this.dependencies.values());
    const timestamps = dependencies.map((dep) => dep.timestamp);

    return {
      totalCached: this.dependencies.size,
      cachedSections: Array.from(this.dependencies.keys()),
      oldestCache:
        timestamps.length > 0
          ? new Date(Math.min(...timestamps.map((t) => t.getTime())))
          : undefined,
      newestCache:
        timestamps.length > 0
          ? new Date(Math.max(...timestamps.map((t) => t.getTime())))
          : undefined,
    };
  }

  /**
   * Resolve multiple dependencies using optimal execution plan
   */
  async resolveMultiple<K extends keyof SectionResultMap>(
    sectionNames: K[],
  ): Promise<Record<K, SectionResultMap[K]>> {
    let results = {} as Record<K, SectionResultMap[K]>;
    const startTime = Date.now();

    logger.info(
      `Starting batch resolution for ${sectionNames.length} sections`,
      { ...this.context, operation: 'batch_resolution', sections: sectionNames }
    );

    try {
      // Generate optimal execution plan
      const executionPlan = this.planExecution(sectionNames);
      
      if (this.options.parallel && executionPlan.parallelGroups.length > 1) {
        // Execute in parallel groups for optimal performance
        results = await this.executeParallelPlan(executionPlan, results);
      } else {
        // Execute sequentially using optimal order
        results = await this.executeSequentialPlan(executionPlan, results);
      }

      const totalTime = Date.now() - startTime;
      logger.info(
        `Batch resolution completed in ${totalTime}ms`,
        { 
          ...this.context, 
          operation: 'batch_resolution',
          totalTime,
          sectionsCompleted: Object.keys(results).length,
          memoryEfficient: executionPlan.memoryOptimized,
        }
      );

      return results;
    } catch (error) {
      const totalTime = Date.now() - startTime;
      logger.error(
        `Batch resolution failed after ${totalTime}ms`,
        { ...this.context, operation: 'batch_resolution', totalTime },
        error
      );
      throw error;
    }
  }

  /**
   * Execute sections in parallel groups for optimal performance
   */
  private async executeParallelPlan<K extends keyof SectionResultMap>(
    executionPlan: ExecutionPlan,
    results: Record<K, SectionResultMap[K]>
  ): Promise<Record<K, SectionResultMap[K]>> {
    logger.info(
      `Executing ${executionPlan.parallelGroups.length} parallel groups`,
      { ...this.context, operation: 'parallel_execution' }
    );

    for (const [groupIndex, group] of executionPlan.parallelGroups.entries()) {
      logger.debug(
        `Executing parallel group ${groupIndex + 1}: ${group.join(', ')}`,
        { ...this.context, operation: 'parallel_execution', group }
      );

      // Execute all sections in this group in parallel
      const groupPromises = group.map(async (sectionName) => {
        const result = await this.resolve(sectionName as K);
        return [sectionName, result] as [K, SectionResultMap[K]];
      });

      const groupResults = await Promise.all(groupPromises);
      
      // Collect results
      groupResults.forEach(([sectionName, result]) => {
        results[sectionName] = result;
      });

      // Memory management: trigger garbage collection after each group
      if (global.gc && this.options.memoryLimit) {
        const memUsage = process.memoryUsage();
        if (memUsage.heapUsed > this.options.memoryLimit * 0.7) {
          logger.debug('Triggering garbage collection for memory management', this.context);
          global.gc();
        }
      }
    }

    return results;
  }

  /**
   * Execute sections sequentially using optimal order
   */
  private async executeSequentialPlan<K extends keyof SectionResultMap>(
    executionPlan: ExecutionPlan,
    results: Record<K, SectionResultMap[K]>
  ): Promise<Record<K, SectionResultMap[K]>> {
    logger.info(
      `Executing ${executionPlan.order.length} sections sequentially`,
      { ...this.context, operation: 'sequential_execution', order: executionPlan.order }
    );

    for (const [index, sectionName] of executionPlan.order.entries()) {
      logger.debug(
        `Executing section ${index + 1}/${executionPlan.order.length}: ${sectionName}`,
        { ...this.context, operation: 'sequential_execution', sectionName }
      );

      results[sectionName as K] = await this.resolve(sectionName as K);

      // Just-in-time memory cleanup: remove cached results that are no longer needed
      if (this.options.enableCaching !== false) {
        this.performJustInTimeCleanup(sectionName, executionPlan.order, index);
      }
    }

    return results;
  }

  /**
   * Perform just-in-time memory cleanup of cached results
   */
  private performJustInTimeCleanup(
    currentSection: string,
    executionOrder: string[],
    currentIndex: number
  ): void {
    const remainingSections = executionOrder.slice(currentIndex + 1);
    
    // Check which cached sections are no longer needed
    for (const [cachedSection] of this.dependencies) {
      if (cachedSection === currentSection) continue;
      
      // Check if any remaining section depends on this cached section
      const stillNeeded = remainingSections.some(remaining => {
        const node = this.dependencyGraph['nodes'].get(remaining);
        return node?.dependencies.has(cachedSection);
      });
      
      if (!stillNeeded) {
        logger.debug(
          `Cleaning up cached result for ${cachedSection} - no longer needed`,
          { ...this.context, operation: 'memory_cleanup', cachedSection }
        );
        this.dependencies.delete(cachedSection);
      }
    }
  }

  /**
   * Get the recommended resolution order for given sections using dependency graph
   */
  getResolutionOrder(sectionNames: string[]): string[] {
    try {
      const executionPlan = this.dependencyGraph.generateExecutionPlan(sectionNames, this.options);
      return executionPlan.order;
    } catch (error) {
      logger.warn(
        `Failed to generate execution plan, falling back to basic ordering`,
        this.context,
        error
      );
      // Fallback to basic ordering if graph fails
      const basicOrder = ['section1', 'section2', 'section3', 'section4', 'section5', 'section6'];
      return basicOrder.filter(section => sectionNames.includes(section));
    }
  }

  /**
   * Check if all dependencies for a section are available
   */
  canResolve(sectionName: string): { canResolve: boolean; missingDependencies: string[] } {
    const node = this.dependencyGraph['nodes'].get(sectionName);
    if (!node) {
      return {
        canResolve: false,
        missingDependencies: [`Section ${sectionName} not found in dependency graph`],
      };
    }

    const dependencies = Array.from(node.dependencies);
    const missingDependencies = dependencies.filter((dep) => !this.has(dep));

    return {
      canResolve: missingDependencies.length === 0,
      missingDependencies,
    };
  }

  /**
   * Get detailed dependency information with graph insights
   */
  getDependencyInsights(): {
    graphVisualization: string;
    executionStats: any;
    memoryOptimization: boolean;
    recommendations: string[];
  } {
    const stats = this.getStats();
    const recommendations: string[] = [];

    // Generate recommendations based on current state
    if (stats.totalCached > 3) {
      recommendations.push('Consider enabling memory cleanup to reduce cache size');
    }

    if (this.currentExecutionPlan && !this.currentExecutionPlan.memoryOptimized) {
      recommendations.push('Current execution plan is not memory optimized - consider adjusting memory limits');
    }

    if (this.options.parallel && this.currentExecutionPlan?.parallelGroups.length === 1) {
      recommendations.push('Parallel execution enabled but no parallelization opportunities found');
    }

    return {
      graphVisualization: this.dependencyGraph.getGraphVisualization(),
      executionStats: stats,
      memoryOptimization: this.currentExecutionPlan?.memoryOptimized || false,
      recommendations,
    };
  }

  /**
   * Validate execution readiness for given sections
   */
  validateExecutionReadiness(sectionNames: string[]): {
    ready: boolean;
    issues: string[];
    warnings: string[];
    executionPlan?: ExecutionPlan;
  } {
    const issues: string[] = [];
    const warnings: string[] = [];

    try {
      // Validate basic dependency requirements
      const validation = this.dependencyGraph.validateDependencies(sectionNames);
      issues.push(...validation.errors);
      warnings.push(...validation.warnings);

      if (validation.isValid) {
        // Generate execution plan
        const executionPlan = this.dependencyGraph.generateExecutionPlan(sectionNames, this.options);
        
        // Check resolver availability
        for (const sectionName of executionPlan.order) {
          if (!this.resolverFunctions.has(sectionName)) {
            issues.push(`No resolver registered for ${sectionName}`);
          }
        }

        // Memory warnings
        if (executionPlan.estimatedMemoryPeak > (this.options.memoryLimit || 512 * 1024 * 1024)) {
          warnings.push(
            `Estimated memory peak (${(executionPlan.estimatedMemoryPeak / 1024 / 1024).toFixed(0)}MB) exceeds limit`
          );
        }

        return {
          ready: issues.length === 0,
          issues,
          warnings,
          executionPlan,
        };
      }
    } catch (error) {
      issues.push(`Failed to validate execution plan: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return {
      ready: false,
      issues,
      warnings,
    };
  }

  /**
   * Access dependency graph for advanced operations
   */
  getDependencyGraph(): DependencyGraph {
    return this.dependencyGraph;
  }
}

/**
 * Factory function to create a configured dependency resolver with enhanced features
 */
export function createDependencyResolver(
  filePath: string,
  options: CLIOptions,
  context: LogContext = {},
): AnalyzerDependencyResolver {
  const resolver = new AnalyzerDependencyResolver(
    {
      ...context,
      filePath,
      operation: 'dependency_management',
    },
    options
  );

  logger.info(
    `Created dependency resolver for ${filePath}`,
    {
      ...context,
      filePath,
      memoryLimit: options.memoryLimit,
      parallelEnabled: options.parallel,
      cachingEnabled: options.enableCaching !== false,
    }
  );

  return resolver;
}

/**
 * Enhanced dependency chain validator that leverages the new dependency graph system
 * @deprecated Use DependencyGraph directly for more advanced features
 */
export class DependencyChainValidator {
  private dependencyGraph: DependencyGraph;

  constructor(options: CLIOptions = {}) {
    this.dependencyGraph = new DependencyGraph(options.memoryLimit);
  }

  /**
   * Validate that all dependencies can be resolved for the given sections
   */
  validateChain(requestedSections: string[]): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    return this.dependencyGraph.validateDependencies(requestedSections);
  }

  /**
   * Get the optimal execution order for the given sections
   */
  getExecutionOrder(requestedSections: string[], options: CLIOptions = {}): string[] {
    try {
      const executionPlan = this.dependencyGraph.generateExecutionPlan(requestedSections, options);
      return executionPlan.order;
    } catch (error) {
      // Fallback to basic ordering
      const allRequired = new Set<string>();
      
      // Add all requested sections and their dependencies
      for (const section of requestedSections) {
        allRequired.add(section);
        const node = this.dependencyGraph['nodes'].get(section);
        if (node) {
          node.dependencies.forEach(dep => allRequired.add(dep));
        }
      }

      // Sort by basic dependency order
      const ordered = ['section1', 'section2', 'section3', 'section4', 'section5', 'section6'];
      return ordered.filter(section => allRequired.has(section));
    }
  }

  /**
   * Get advanced execution plan with memory optimization and parallel groups
   */
  getAdvancedExecutionPlan(requestedSections: string[], options: CLIOptions = {}): ExecutionPlan {
    return this.dependencyGraph.generateExecutionPlan(requestedSections, options);
  }

  /**
   * Check for circular dependencies
   */
  checkCircularDependencies(): { hasCircles: boolean; cycles: string[][] } {
    return this.dependencyGraph.detectCircularDependencies();
  }

  /**
   * Get dependency graph visualization
   */
  getGraphVisualization(): string {
    return this.dependencyGraph.getGraphVisualization();
  }
}

/**
 * Create a dependency resolver with pre-configured analyzers for common use cases
 */
export function createConfiguredDependencyResolver(
  filePath: string,
  options: CLIOptions,
  context: LogContext = {},
): {
  resolver: AnalyzerDependencyResolver;
  executionPlan: ExecutionPlan | null;
  insights: any;
} {
  const resolver = createDependencyResolver(filePath, options, context);
  
  let executionPlan: ExecutionPlan | null = null;
  let insights: any = {};

  try {
    // Generate execution plan if sections are specified
    if (options.sections && options.sections.length > 0) {
      executionPlan = resolver.planExecution(options.sections);
      insights = resolver.getDependencyInsights();
    }
  } catch (error) {
    logger.warn(
      'Failed to generate initial execution plan',
      { ...context, filePath },
      error
    );
  }

  return {
    resolver,
    executionPlan,
    insights,
  };
}

/**
 * Utility function to validate section dependencies without creating a resolver
 */
export function validateSectionDependencies(
  requestedSections: string[],
  options: CLIOptions = {}
): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  recommendedOrder: string[];
  memoryEstimate: number;
} {
  const graph = new DependencyGraph(options.memoryLimit);
  const validation = graph.validateDependencies(requestedSections);
  
  let recommendedOrder: string[] = [];
  let memoryEstimate = 0;
  
  if (validation.isValid) {
    try {
      const plan = graph.generateExecutionPlan(requestedSections, options);
      recommendedOrder = plan.order;
      memoryEstimate = plan.estimatedMemoryPeak;
    } catch (error) {
      // Fallback to basic order
      recommendedOrder = ['section1', 'section2', 'section3', 'section4', 'section5', 'section6']
        .filter(section => requestedSections.includes(section));
    }
  }
  
  return {
    ...validation,
    recommendedOrder,
    memoryEstimate,
  };
}
