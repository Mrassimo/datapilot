/**
 * State machine for UI components
 * Manages complex state transitions and ensures consistency
 */
export class StateMachine {
  constructor(config) {
    this.states = config.states || {};
    this.transitions = config.transitions || {};
    this.initialState = config.initial;
    this.currentState = this.initialState;
    this.context = config.context || {};
    this.history = [];
    this.listeners = new Map();
    this.guards = new Map();
    this.actions = new Map();
    this.debug = config.debug || false;
    
    // Validate configuration
    this.validateConfig();
  }

  /**
   * Validate state machine configuration
   */
  validateConfig() {
    if (!this.initialState) {
      throw new Error('Initial state is required');
    }
    
    if (!this.states[this.initialState]) {
      throw new Error(`Initial state '${this.initialState}' not found in states`);
    }
    
    // Validate all transitions
    Object.entries(this.transitions).forEach(([state, events]) => {
      if (!this.states[state]) {
        throw new Error(`State '${state}' in transitions not found in states`);
      }
      
      Object.entries(events).forEach(([event, config]) => {
        const target = typeof config === 'string' ? config : config.target;
        if (!this.states[target]) {
          throw new Error(`Target state '${target}' for event '${event}' in state '${state}' not found`);
        }
      });
    });
  }

  /**
   * Get current state
   */
  getState() {
    return this.currentState;
  }

  /**
   * Get state context
   */
  getContext() {
    return { ...this.context };
  }

  /**
   * Check if transition is allowed
   */
  canTransition(event) {
    const transitions = this.transitions[this.currentState];
    if (!transitions || !transitions[event]) {
      return false;
    }
    
    const transition = transitions[event];
    const config = typeof transition === 'string' 
      ? { target: transition } 
      : transition;
    
    // Check guard if exists
    if (config.guard) {
      const guard = this.guards.get(config.guard);
      if (guard && !guard(this.context, event)) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Send event to trigger transition
   */
  async send(event, data = {}) {
    if (this.debug) {
      console.log(`[StateMachine] Event: ${event}, Current State: ${this.currentState}`);
    }
    
    // Check if transition exists
    const transitions = this.transitions[this.currentState];
    if (!transitions || !transitions[event]) {
      if (this.debug) {
        console.log(`[StateMachine] No transition for event '${event}' in state '${this.currentState}'`);
      }
      return false;
    }
    
    // Get transition config
    const transition = transitions[event];
    const config = typeof transition === 'string' 
      ? { target: transition } 
      : transition;
    
    // Check guard
    if (config.guard) {
      const guard = this.guards.get(config.guard);
      if (guard && !guard(this.context, event, data)) {
        if (this.debug) {
          console.log(`[StateMachine] Guard '${config.guard}' prevented transition`);
        }
        return false;
      }
    }
    
    // Store previous state
    const previousState = this.currentState;
    const targetState = config.target;
    
    // Execute exit actions for current state
    await this.executeStateActions(this.currentState, 'onExit', { event, data });
    
    // Execute transition actions
    if (config.actions) {
      await this.executeActions(config.actions, { event, data, from: previousState, to: targetState });
    }
    
    // Update state
    this.currentState = targetState;
    
    // Update context if provided
    if (config.assign) {
      Object.assign(this.context, config.assign);
    }
    
    // Add to history
    this.history.push({
      from: previousState,
      to: targetState,
      event,
      data,
      timestamp: Date.now()
    });
    
    // Keep history size manageable
    if (this.history.length > 100) {
      this.history.shift();
    }
    
    // Execute entry actions for new state
    await this.executeStateActions(this.currentState, 'onEntry', { event, data });
    
    // Notify listeners
    await this.notifyListeners({
      type: 'transition',
      from: previousState,
      to: targetState,
      event,
      data
    });
    
    if (this.debug) {
      console.log(`[StateMachine] Transitioned from '${previousState}' to '${targetState}'`);
    }
    
    return true;
  }

  /**
   * Execute state actions
   */
  async executeStateActions(state, type, context) {
    const stateConfig = this.states[state];
    if (!stateConfig || !stateConfig[type]) {
      return;
    }
    
    const actions = Array.isArray(stateConfig[type]) 
      ? stateConfig[type] 
      : [stateConfig[type]];
    
    await this.executeActions(actions, context);
  }

  /**
   * Execute actions
   */
  async executeActions(actions, context) {
    const actionList = Array.isArray(actions) ? actions : [actions];
    
    for (const actionName of actionList) {
      const action = this.actions.get(actionName);
      if (action) {
        try {
          await action(this.context, context);
        } catch (error) {
          console.error(`[StateMachine] Error in action '${actionName}':`, error);
          throw error;
        }
      }
    }
  }

  /**
   * Register guard function
   */
  registerGuard(name, guardFn) {
    this.guards.set(name, guardFn);
  }

  /**
   * Register action function
   */
  registerAction(name, actionFn) {
    this.actions.set(name, actionFn);
  }

  /**
   * Subscribe to state changes
   */
  subscribe(listener) {
    const id = Symbol('listener');
    this.listeners.set(id, listener);
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(id);
    };
  }

  /**
   * Notify all listeners
   */
  async notifyListeners(event) {
    const promises = Array.from(this.listeners.values()).map(listener => {
      try {
        return Promise.resolve(listener(event, this));
      } catch (error) {
        console.error('[StateMachine] Error in listener:', error);
        return Promise.resolve();
      }
    });
    
    await Promise.all(promises);
  }

  /**
   * Get available events for current state
   */
  getAvailableEvents() {
    const transitions = this.transitions[this.currentState];
    if (!transitions) {
      return [];
    }
    
    return Object.keys(transitions).filter(event => this.canTransition(event));
  }

  /**
   * Get state history
   */
  getHistory(limit = 10) {
    return this.history.slice(-limit);
  }

  /**
   * Reset to initial state
   */
  async reset() {
    const previousState = this.currentState;
    this.currentState = this.initialState;
    this.context = {};
    this.history = [];
    
    await this.notifyListeners({
      type: 'reset',
      from: previousState,
      to: this.initialState
    });
  }

  /**
   * Create a snapshot of current state
   */
  snapshot() {
    return {
      currentState: this.currentState,
      context: { ...this.context },
      history: [...this.history]
    };
  }

  /**
   * Restore from snapshot
   */
  async restore(snapshot) {
    const previousState = this.currentState;
    this.currentState = snapshot.currentState;
    this.context = { ...snapshot.context };
    this.history = [...snapshot.history];
    
    await this.notifyListeners({
      type: 'restore',
      from: previousState,
      to: this.currentState
    });
  }
}

/**
 * Create UI-specific state machine
 */
export function createUIStateMachine() {
  return new StateMachine({
    initial: 'idle',
    
    states: {
      idle: {
        onEntry: ['clearSelection']
      },
      loading: {
        onEntry: ['showLoader'],
        onExit: ['hideLoader']
      },
      browsing: {
        onEntry: ['updateDisplay']
      },
      analyzing: {
        onEntry: ['startAnalysis'],
        onExit: ['stopAnalysis']
      },
      results: {
        onEntry: ['showResults']
      },
      error: {
        onEntry: ['showError'],
        onExit: ['clearError']
      }
    },
    
    transitions: {
      idle: {
        SELECT_FILE: {
          target: 'loading',
          actions: ['validateFile']
        },
        ERROR: 'error'
      },
      
      loading: {
        LOAD_SUCCESS: 'browsing',
        LOAD_ERROR: 'error',
        CANCEL: 'idle'
      },
      
      browsing: {
        SELECT_COMMAND: {
          target: 'analyzing',
          guard: 'canAnalyze'
        },
        CHANGE_FILE: 'loading',
        BACK: 'idle',
        ERROR: 'error'
      },
      
      analyzing: {
        ANALYSIS_COMPLETE: 'results',
        ANALYSIS_ERROR: 'error',
        CANCEL: 'browsing'
      },
      
      results: {
        BACK: 'browsing',
        NEW_ANALYSIS: 'browsing',
        NEW_FILE: 'idle',
        EXPORT: {
          target: 'results',
          actions: ['exportResults']
        },
        ERROR: 'error'
      },
      
      error: {
        RETRY: {
          target: 'idle',
          actions: ['clearError']
        },
        DISMISS: 'idle'
      }
    },
    
    context: {
      file: null,
      command: null,
      results: null,
      error: null
    }
  });
}

/**
 * Create navigation state machine
 */
export function createNavigationStateMachine() {
  return new StateMachine({
    initial: 'normal',
    
    states: {
      normal: {},
      searching: {
        onEntry: ['showSearchBox'],
        onExit: ['hideSearchBox']
      },
      filtering: {
        onEntry: ['showFilterBox'],
        onExit: ['hideFilterBox']
      },
      help: {
        onEntry: ['showHelp'],
        onExit: ['hideHelp']
      },
      commandPalette: {
        onEntry: ['showCommandPalette'],
        onExit: ['hideCommandPalette']
      }
    },
    
    transitions: {
      normal: {
        START_SEARCH: 'searching',
        START_FILTER: 'filtering',
        SHOW_HELP: 'help',
        SHOW_COMMANDS: 'commandPalette'
      },
      
      searching: {
        CONFIRM_SEARCH: {
          target: 'normal',
          actions: ['applySearch']
        },
        CANCEL_SEARCH: 'normal'
      },
      
      filtering: {
        CONFIRM_FILTER: {
          target: 'normal',
          actions: ['applyFilter']
        },
        CANCEL_FILTER: 'normal'
      },
      
      help: {
        CLOSE_HELP: 'normal'
      },
      
      commandPalette: {
        SELECT_COMMAND: {
          target: 'normal',
          actions: ['executeCommand']
        },
        CLOSE_PALETTE: 'normal'
      }
    }
  });
}