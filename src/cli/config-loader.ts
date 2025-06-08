/**
 * Configuration file loader for DataPilot CLI
 * Supports multiple configuration formats and environment variable overrides
 */

import { existsSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { homedir } from 'os';
import type { CLIOptions } from './types';

export interface DataPilotConfig {
  // Default options for all commands
  defaults?: Partial<CLIOptions>;

  // Command-specific overrides
  commands?: {
    [command: string]: Partial<CLIOptions>;
  };

  // Environment-specific configurations
  environments?: {
    [env: string]: {
      defaults?: Partial<CLIOptions>;
      commands?: Record<string, Partial<CLIOptions>>;
    };
  };

  // Custom aliases for common operations
  aliases?: {
    [alias: string]: {
      command: string;
      options?: Partial<CLIOptions>;
    };
  };

  // Performance presets
  presets?: {
    [preset: string]: Partial<CLIOptions>;
  };
}

export class ConfigLoader {
  private static readonly CONFIG_FILES = [
    '.datapilotrc',
    '.datapilotrc.json',
    '.datapilotrc.yaml',
    '.datapilotrc.yml',
    'datapilot.config.js',
    'datapilot.config.json',
    'package.json', // Check for datapilot field
  ];

  private static readonly ENV_PREFIX = 'DATAPILOT_';

  /**
   * Load configuration from files and environment
   */
  static async loadConfig(startDir: string = process.cwd()): Promise<DataPilotConfig> {
    // 1. Load from configuration files
    const fileConfig = await this.loadFromFiles(startDir);

    // 2. Load from environment variables
    const envConfig = this.loadFromEnvironment();

    // 3. Merge configurations (env > local > global)
    return this.mergeConfigs(fileConfig, envConfig);
  }

  /**
   * Search for and load configuration files
   */
  private static async loadFromFiles(startDir: string): Promise<DataPilotConfig> {
    const configs: DataPilotConfig[] = [];

    // Search from current directory up to root
    let currentDir = startDir;
    while (currentDir !== dirname(currentDir)) {
      const config = await this.loadFromDirectory(currentDir);
      if (config) {
        configs.push(config);
      }
      currentDir = dirname(currentDir);
    }

    // Also check home directory
    const homeConfig = await this.loadFromDirectory(homedir());
    if (homeConfig) {
      configs.push(homeConfig);
    }

    // Merge all configs (closer to cwd takes precedence)
    return configs.reduce((merged, config) => this.mergeConfigs(config, merged), {});
  }

  /**
   * Load configuration from a specific directory
   */
  private static async loadFromDirectory(dir: string): Promise<DataPilotConfig | null> {
    for (const filename of this.CONFIG_FILES) {
      const filepath = join(dir, filename);

      if (existsSync(filepath)) {
        try {
          if (filename === 'package.json') {
            const pkg = JSON.parse(readFileSync(filepath, 'utf8'));
            if (pkg.datapilot) {
              return pkg.datapilot;
            }
          } else if (filename.endsWith('.js')) {
            // Dynamic import for JS config files
            const config = require(filepath);
            return config.default || config;
          } else if (filename.endsWith('.json') || filename === '.datapilotrc') {
            return JSON.parse(readFileSync(filepath, 'utf8'));
          } else if (filename.endsWith('.yaml') || filename.endsWith('.yml')) {
            // Would need to add yaml parser dependency
            console.warn(`YAML config files not yet supported: ${filepath}`);
          }
        } catch (error) {
          console.warn(`Error loading config from ${filepath}:`, error);
        }
      }
    }

    return null;
  }

  /**
   * Load configuration from environment variables
   */
  private static loadFromEnvironment(): DataPilotConfig {
    const config: DataPilotConfig = {
      defaults: {},
    };

    // Map of environment variables to config options
    const envMappings: Record<string, keyof CLIOptions> = {
      OUTPUT: 'output',
      OUTPUT_FILE: 'outputFile',
      MAX_ROWS: 'maxRows',
      MAX_MEMORY: 'maxMemory',
      PRIVACY_MODE: 'privacyMode',
      VERBOSE: 'verbose',
      QUIET: 'quiet',
      FORCE: 'force',
      DRY_RUN: 'dryRun',
    };

    for (const [envKey, configKey] of Object.entries(envMappings)) {
      const envVar = `${this.ENV_PREFIX}${envKey}`;
      const value = process.env[envVar];

      if (value !== undefined) {
        // Type conversion based on the config key
        if (configKey === 'maxRows' || configKey === 'maxMemory') {
          config.defaults![configKey] = parseInt(value, 10);
        } else if (
          configKey === 'verbose' ||
          configKey === 'quiet' ||
          configKey === 'force' ||
          configKey === 'dryRun'
        ) {
          config.defaults![configKey] = value === 'true' || value === '1';
        } else if (configKey === 'output') {
          config.defaults![configKey] = value as any;
        } else if (configKey === 'privacyMode') {
          config.defaults![configKey] = value as any;
        } else {
          config.defaults![configKey] = value as any;
        }
      }
    }

    return config;
  }

  /**
   * Merge two configuration objects
   */
  private static mergeConfigs(source: DataPilotConfig, target: DataPilotConfig): DataPilotConfig {
    return {
      defaults: { ...target.defaults, ...source.defaults },
      commands: { ...target.commands, ...source.commands },
      environments: { ...target.environments, ...source.environments },
      aliases: { ...target.aliases, ...source.aliases },
      presets: { ...target.presets, ...source.presets },
    };
  }

  /**
   * Apply configuration to CLI options
   */
  static applyConfig(options: CLIOptions, config: DataPilotConfig, command?: string): CLIOptions {
    let merged = { ...options };

    // Apply defaults
    if (config.defaults) {
      merged = { ...config.defaults, ...merged };
    }

    // Apply command-specific overrides
    if (command && config.commands?.[command]) {
      merged = { ...config.commands[command], ...merged };
    }

    // Apply environment-specific settings
    const env = process.env.NODE_ENV || 'development';
    if (config.environments?.[env]) {
      if (config.environments[env].defaults) {
        merged = { ...config.environments[env].defaults, ...merged };
      }
      if (command && config.environments[env].commands?.[command]) {
        merged = { ...config.environments[env].commands[command], ...merged };
      }
    }

    // Apply presets if specified in options (Note: preset is not a standard CLIOption)
    // This would need to be handled separately through a different mechanism

    return merged;
  }

  /**
   * Resolve command aliases
   */
  static resolveAlias(
    alias: string,
    config: DataPilotConfig,
  ): { command: string; options?: Partial<CLIOptions> } | null {
    return config.aliases?.[alias] || null;
  }

  /**
   * Get example configuration
   */
  static getExampleConfig(): DataPilotConfig {
    return {
      defaults: {
        output: 'markdown',
        verbose: false,
        privacyMode: 'redacted',
      },
      commands: {
        all: {
          maxMemory: 1024,
          showProgress: true,
        },
        eda: {
          chunkSize: 1000,
          memoryLimit: 512,
        },
      },
      environments: {
        production: {
          defaults: {
            quiet: true,
            output: 'json',
            privacyMode: 'minimal',
          },
        },
        ci: {
          defaults: {
            quiet: true,
            showProgress: false,
            output: 'json',
          },
        },
      },
      aliases: {
        'quick-check': {
          command: 'validate',
          options: {
            verbose: true,
          },
        },
        'full-report': {
          command: 'all',
          options: {
            output: 'markdown',
            verbose: true,
            includeEnvironment: true,
          },
        },
      },
      presets: {
        'low-memory': {
          maxMemory: 256,
          maxRows: 10000,
        },
        'high-performance': {
          maxMemory: 4096,
          parallel: true,
        },
      },
    };
  }
}

// DataPilotConfig is already exported as an interface above
