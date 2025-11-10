/**
 * Section 5: Engineering Adapter (V1 → V2)
 * Converts bloated engineering output to lean schema optimization facts
 */

import { logger } from '@/utils/logger';
import type {
  DataEngineeringAnalysis,
  SchemaAnalysis,
  DataTypeConversion,
  TransformationPipelineRecommendations,
  MLReadinessAssessment,
} from './types';

import type {
  Section5EngineeringV2,
  TypeOptimization,
  CategoricalCandidate,
  InteractionFeature,
  BinningCandidate,
  DateFeatureCandidate,
  JoinCandidate,
} from './types-v2';

export class Section5Adapter {
  /**
   * Convert V1 (bloated) to V2 (lean)
   * Strips: reasoning, examples, DDL statements, implementation details
   * Keeps: factual type optimizations and feature engineering candidates
   *
   * Error handling strategy:
   * - Validates V1 input structure before processing
   * - Uses safe navigation and defaults for missing fields
   * - Returns minimal valid structure on critical errors
   * - Logs warnings for unexpected data
   */
  public static convertToV2(v1: DataEngineeringAnalysis): Section5EngineeringV2 {
    try {
      // Validate input
      if (!this.isValidV1Input(v1)) {
        logger.warn('Section5Adapter: Invalid V1 input, returning minimal structure', {
          context: 'convertToV2',
          hasInput: !!v1,
          inputType: typeof v1,
        });
        return this.getMinimalV2Structure();
      }
      const typeOptimizations: TypeOptimization[] = [];
      const categoricalCandidates: CategoricalCandidate[] = [];
      const interactionFeatures: InteractionFeature[] = [];
      const binningCandidates: BinningCandidate[] = [];
      const dateFeatures: DateFeatureCandidate[] = [];
      const joinCandidates: JoinCandidate[] = [];

      // Extract type optimizations
      const dataTypeConversions = v1?.schemaAnalysis?.dataTypeConversions;
      if (Array.isArray(dataTypeConversions)) {
        dataTypeConversions.forEach((conv) => {
          if (!conv || typeof conv !== 'object') {
            return;
          }
          try {
            typeOptimizations.push({
              column: conv.columnName || 'unknown',
              current_type: conv.currentType || 'unknown',
              suggested_type: conv.recommendedType || 'unknown',
              conversion_safe: conv.riskLevel === 'low',
              memory_savings_ratio: this.estimateMemorySavings(
                conv.currentType || 'unknown',
                conv.recommendedType || 'unknown'
              ),
            });
          } catch (error) {
            logger.warn('Section5Adapter: Error processing type optimization', {
              context: 'convertToV2',
              columnName: conv.columnName,
              error: error instanceof Error ? error.message : String(error),
            });
          }
        });
      }

      // V1 doesn't have detailed feature engineering data in MLReadinessAssessment
      // These would need to be extracted from other sections or enhanced in V1 first
      // For now, leave empty arrays

      return {
        version: '2.0',
        type_optimizations: typeOptimizations,
        categorical_candidates: categoricalCandidates,
        interaction_features: interactionFeatures,
        binning_candidates: binningCandidates,
        date_features: dateFeatures,
        join_candidates: joinCandidates.length > 0 ? joinCandidates : undefined,
        current_memory_mb: this.estimateCurrentMemory(v1),
        optimized_memory_mb: this.estimateOptimizedMemory(v1, typeOptimizations),
        memory_reduction_ratio: this.calculateMemoryReduction(v1, typeOptimizations),
      };
    } catch (error) {
      logger.error('Section5Adapter: Critical error during V2 conversion', {
        context: 'convertToV2',
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      return this.getMinimalV2Structure();
    }
  }

  private static extractCategoricalCandidates(featureEng: any, candidates: CategoricalCandidate[]): void {
    // Extract from categoricalEncoding if available
    if (featureEng.categoricalEncoding) {
      featureEng.categoricalEncoding.forEach((enc: any) => {
        const uniqueRatio = enc.uniqueRatio || enc.cardinality / (enc.totalValues || 1);
        candidates.push({
          column: enc.columnName || enc.column,
          unique_ratio: uniqueRatio,
          cardinality: enc.cardinality || enc.uniqueValues || 0,
          encoding_recommendation: this.mapEncodingType(enc.recommendedEncoding || enc.method),
        });
      });
    }
  }

  private static extractInteractionFeatures(featureEng: any, interactions: InteractionFeature[]): void {
    // Extract from featureInteractions if available
    if (featureEng.featureInteractions) {
      featureEng.featureInteractions.forEach((interaction: any) => {
        interactions.push({
          col_a: interaction.feature1 || interaction.column1,
          col_b: interaction.feature2 || interaction.column2,
          interaction_type: this.mapInteractionType(interaction.type || interaction.operation),
          correlation_with_target: interaction.correlationWithTarget,
        });
      });
    }
  }

  private static extractBinningCandidates(featureEng: any, binning: BinningCandidate[]): void {
    // Extract from discretization/binning recommendations
    if (featureEng.discretization) {
      featureEng.discretization.forEach((disc: any) => {
        binning.push({
          column: disc.columnName || disc.column,
          current_unique: disc.currentUnique || disc.cardinality || 0,
          suggested_bins: disc.suggestedBins || disc.bins || 10,
          binning_method: this.mapBinningMethod(disc.method),
        });
      });
    }
  }

  private static extractDateFeatures(featureEng: any, dateFeatures: DateFeatureCandidate[]): void {
    // Extract from temporal feature engineering
    if (featureEng.temporalFeatures) {
      featureEng.temporalFeatures.forEach((temp: any) => {
        dateFeatures.push({
          column: temp.columnName || temp.column,
          extractable_features: temp.extractableFeatures || [
            'year',
            'month',
            'day',
            'day_of_week',
            'is_weekend',
          ],
        });
      });
    }
  }

  private static extractJoinCandidates(relationshipAnalysis: any, joins: JoinCandidate[]): void {
    // Extract from cross-file relationship analysis
    if (relationshipAnalysis.potentialJoins) {
      relationshipAnalysis.potentialJoins.forEach((join: any) => {
        joins.push({
          left_file: join.leftFile || join.file1,
          right_file: join.rightFile || join.file2,
          left_column: join.leftColumn || join.column1,
          right_column: join.rightColumn || join.column2,
          join_type: this.mapJoinType(join.joinType || join.relationship),
          match_ratio: join.matchRatio || join.confidence || 0,
          cardinality_left: join.leftCardinality || 0,
          cardinality_right: join.rightCardinality || 0,
        });
      });
    }
  }

  private static estimateMemorySavings(currentType: string, suggestedType: string): number {
    // Simple heuristic for memory savings
    const currentSize = this.typeSize(currentType);
    const suggestedSize = this.typeSize(suggestedType);
    return currentSize > 0 ? (currentSize - suggestedSize) / currentSize : 0;
  }

  private static typeSize(type: string): number {
    const lower = type.toLowerCase();
    if (lower.includes('int64') || lower.includes('float64')) return 8;
    if (lower.includes('int32') || lower.includes('float32')) return 4;
    if (lower.includes('int16')) return 2;
    if (lower.includes('int8') || lower.includes('bool')) return 1;
    if (lower.includes('string') || lower.includes('object')) return 50; // Estimate
    if (lower.includes('category')) return 4; // Encoded as int32
    return 8; // Default
  }

  private static estimateCurrentMemory(v1: DataEngineeringAnalysis): number {
    try {
      // Estimate from schema analysis
      const sizeBytes = v1?.schemaAnalysis?.currentSchema?.estimatedSizeBytes || 0;
      return sizeBytes / (1024 * 1024); // Convert to MB
    } catch (error) {
      logger.warn('Section5Adapter: Error estimating current memory', {
        context: 'estimateCurrentMemory',
        error: error instanceof Error ? error.message : String(error),
      });
      return 0;
    }
  }

  private static estimateOptimizedMemory(v1: DataEngineeringAnalysis, opts: TypeOptimization[]): number {
    try {
      const current = this.estimateCurrentMemory(v1);
      if (!Array.isArray(opts) || opts.length === 0) {
        return current;
      }
      const avgSavings = opts.reduce((sum, opt) => sum + (opt?.memory_savings_ratio || 0), 0) / opts.length;
      return current * (1 - avgSavings);
    } catch (error) {
      logger.warn('Section5Adapter: Error estimating optimized memory', {
        context: 'estimateOptimizedMemory',
        error: error instanceof Error ? error.message : String(error),
      });
      return 0;
    }
  }

  private static calculateMemoryReduction(v1: DataEngineeringAnalysis, opts: TypeOptimization[]): number {
    try {
      const current = this.estimateCurrentMemory(v1);
      const optimized = this.estimateOptimizedMemory(v1, opts);
      return current > 0 ? (current - optimized) / current : 0;
    } catch (error) {
      logger.warn('Section5Adapter: Error calculating memory reduction', {
        context: 'calculateMemoryReduction',
        error: error instanceof Error ? error.message : String(error),
      });
      return 0;
    }
  }

  private static mapEncodingType(type: string): 'onehot' | 'label' | 'target' | 'frequency' {
    const lower = type?.toLowerCase() || '';
    if (lower.includes('onehot') || lower.includes('one-hot')) return 'onehot';
    if (lower.includes('label')) return 'label';
    if (lower.includes('target')) return 'target';
    if (lower.includes('frequency')) return 'frequency';
    return 'label'; // Default
  }

  private static mapInteractionType(type: string): 'multiply' | 'divide' | 'add' | 'subtract' {
    const lower = type?.toLowerCase() || '';
    if (lower.includes('multiply') || lower.includes('product')) return 'multiply';
    if (lower.includes('divide') || lower.includes('ratio')) return 'divide';
    if (lower.includes('add') || lower.includes('sum')) return 'add';
    if (lower.includes('subtract') || lower.includes('difference')) return 'subtract';
    return 'multiply'; // Default
  }

  private static mapBinningMethod(
    method: string,
  ): 'equal_width' | 'equal_frequency' | 'kmeans' {
    const lower = method?.toLowerCase() || '';
    if (lower.includes('equal_width') || lower.includes('uniform')) return 'equal_width';
    if (lower.includes('equal_frequency') || lower.includes('quantile')) return 'equal_frequency';
    if (lower.includes('kmeans') || lower.includes('cluster')) return 'kmeans';
    return 'equal_width'; // Default
  }

  private static mapJoinType(type: string): 'one_to_one' | 'one_to_many' | 'many_to_many' {
    const lower = type?.toLowerCase() || '';
    if (lower.includes('one_to_one') || lower.includes('1:1')) return 'one_to_one';
    if (lower.includes('one_to_many') || lower.includes('1:n')) return 'one_to_many';
    if (lower.includes('many_to_many') || lower.includes('n:m')) return 'many_to_many';
    return 'one_to_many'; // Default
  }

  /**
   * Validates V1 input structure
   * Checks for required schemaAnalysis field
   */
  private static isValidV1Input(v1: DataEngineeringAnalysis): boolean {
    if (!v1 || typeof v1 !== 'object') {
      return false;
    }

    // Check for schemaAnalysis (main required field)
    return v1.schemaAnalysis !== undefined;
  }

  /**
   * Returns a minimal valid V2 structure for error cases
   * Ensures that downstream consumers always receive valid structure
   */
  private static getMinimalV2Structure(): Section5EngineeringV2 {
    return {
      version: '2.0',
      type_optimizations: [],
      categorical_candidates: [],
      interaction_features: [],
      binning_candidates: [],
      date_features: [],
      join_candidates: undefined,
      current_memory_mb: 0,
      optimized_memory_mb: 0,
      memory_reduction_ratio: 0,
    };
  }
}
