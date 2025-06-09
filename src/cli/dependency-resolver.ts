/**
 * Enhanced Dependency Injection System for CLI Analyzers
 * Manages complex dependencies between analysis sections with caching and validation
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
 * Concrete implementation of dependency resolver with caching and validation
 */
export class AnalyzerDependencyResolver implements DependencyResolver {
  private dependencies = new Map<string, AnalyzerDependency>();
  private resolutionOrder: string[] = [];
  private resolverFunctions = new Map<string, () => Promise<SectionResult>>();
  private context: LogContext;

  constructor(context: LogContext = {}) {
    this.context = context;
    this.setupResolutionOrder();
  }

  /**
   * Define the canonical dependency resolution order
   */
  private setupResolutionOrder(): void {
    this.resolutionOrder = [
      'section1', // Overview - no dependencies
      'section2', // Quality - depends on section1 (optional)
      'section3', // EDA - depends on section1 (optional)
      'section4', // Visualization - depends on section1, section3
      'section5', // Engineering - depends on section1, section2, section3
      'section6', // Modeling - depends on section1, section2, section3, section5
    ];
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
   * Resolve a specific section dependency with error handling and retries
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
        const cached = this.dependencies.get(sectionName)!;
        logger.debug(
          `Using cached result for ${sectionName} (cached at ${cached.timestamp.toISOString()})`,
          sectionContext,
        );
        return cached.result as SectionResultMap[K];
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

      logger.info(`Resolving dependency: ${sectionName}`, sectionContext);

      // Execute resolver with timeout
      const result = await this.executeWithTimeout(resolver, 300000); // 5 minute timeout

      // Validate result
      this.validateSectionResult(sectionName, result);

      // Cache the result
      this.cache(sectionName, result as SectionResultMap[K]);

      const duration = Date.now() - startTime;
      logger.info(`Successfully resolved ${sectionName} in ${duration}ms`, sectionContext);

      return result as SectionResultMap[K];
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error(`Failed to resolve ${sectionName} after ${duration}ms`, sectionContext, error);

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
        ],
      );
    }
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
   * Resolve multiple dependencies in order
   */
  async resolveMultiple<K extends keyof SectionResultMap>(
    sectionNames: K[],
  ): Promise<Record<K, SectionResultMap[K]>> {
    const results = {} as Record<K, SectionResultMap[K]>;

    // Sort by resolution order to ensure dependencies are resolved first
    const orderedSections = sectionNames.sort((a, b) => {
      const indexA = this.resolutionOrder.indexOf(a);
      const indexB = this.resolutionOrder.indexOf(b);
      return indexA - indexB;
    });

    for (const sectionName of orderedSections) {
      results[sectionName] = await this.resolve(sectionName);
    }

    return results;
  }

  /**
   * Get the recommended resolution order for given sections
   */
  getResolutionOrder(sectionNames: string[]): string[] {
    return this.resolutionOrder.filter((section) => sectionNames.includes(section));
  }

  /**
   * Check if all dependencies for a section are available
   */
  canResolve(sectionName: string): { canResolve: boolean; missingDependencies: string[] } {
    const dependencies = this.getSectionDependencies(sectionName);
    const missingDependencies = dependencies.filter((dep) => !this.has(dep));

    return {
      canResolve: missingDependencies.length === 0,
      missingDependencies,
    };
  }

  /**
   * Get the dependencies for a specific section
   */
  private getSectionDependencies(sectionName: string): string[] {
    const dependencyMap: Record<string, string[]> = {
      section1: [],
      section2: [], // Can optionally use section1 but not required
      section3: [], // Can optionally use section1 but not required
      section4: ['section1', 'section3'],
      section5: ['section1', 'section2', 'section3'],
      section6: ['section1', 'section2', 'section3'], // section5 is resolved internally
    };

    return dependencyMap[sectionName] || [];
  }
}

/**
 * Factory function to create a configured dependency resolver
 */
export function createDependencyResolver(
  filePath: string,
  options: CLIOptions,
  context: LogContext = {},
): AnalyzerDependencyResolver {
  const resolver = new AnalyzerDependencyResolver({
    ...context,
    filePath,
    operation: 'dependency_management',
  });

  // The actual resolvers will be registered by the CLI orchestrator
  // based on the sections to be executed

  return resolver;
}

/**
 * Dependency chain validator for complex analysis pipelines
 */
export class DependencyChainValidator {
  private dependencies: Map<string, string[]> = new Map();

  constructor() {
    this.setupDependencyMap();
  }

  private setupDependencyMap(): void {
    this.dependencies.set('section1', []);
    this.dependencies.set('section2', []);
    this.dependencies.set('section3', []);
    this.dependencies.set('section4', ['section1', 'section3']);
    this.dependencies.set('section5', ['section1', 'section2', 'section3']);
    this.dependencies.set('section6', ['section1', 'section2', 'section3']);
  }

  /**
   * Validate that all dependencies can be resolved for the given sections
   */
  validateChain(requestedSections: string[]): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    for (const section of requestedSections) {
      const deps = this.dependencies.get(section);
      if (!deps) {
        errors.push(`Unknown section: ${section}`);
        continue;
      }

      for (const dep of deps) {
        if (!requestedSections.includes(dep)) {
          errors.push(
            `Section ${section} requires ${dep}, but ${dep} is not in the execution plan`,
          );
        }
      }
    }

    // Check for potential performance issues
    if (requestedSections.includes('section6') && requestedSections.length === 1) {
      warnings.push(
        'Running section6 alone will require executing sections 1, 2, 3, and 5 as dependencies',
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Get the optimal execution order for the given sections
   */
  getExecutionOrder(requestedSections: string[]): string[] {
    const allRequired = new Set<string>();

    // Add all requested sections and their dependencies
    for (const section of requestedSections) {
      allRequired.add(section);
      const deps = this.dependencies.get(section) || [];
      deps.forEach((dep) => allRequired.add(dep));
    }

    // Sort by dependency order
    const ordered = ['section1', 'section2', 'section3', 'section4', 'section5', 'section6'];
    return ordered.filter((section) => allRequired.has(section));
  }
}
