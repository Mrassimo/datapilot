
# DataPilot Test Report
Generated: 2025-05-27T02:40:29.069Z

## Summary
- Total Tests: 38
- Passed: 0
- Failed: 38
- Success Rate: 0.0%

## Test Matrix
| File | eda | int | vis | eng | llm |
|------|-----|-----|-----|-----|-----|
| test_sales.csv | ✓ | ✓ | ✓ | ✓ | ✓ |
| insurance.csv | ✓ | ✓ | ✓ | ✓ | ✓ |
| analytical_data_australia_final.csv.csv | ✓ | ✓ | ✓ | ✓ | ✓ |
| australian_data.csv | ✓ | ✓ | ✓ | ✓ | ✓ |
| missing_values.csv | ✓ | ✓ | ✓ | ✓ | ✓ |
| large_numeric.csv | ✓ | ✓ | ✓ | ✓ | ✓ |
| empty.csv | ✓ | ✓ | ✓ | ✓ | ✓ |


## Errors
- eda - test_sales.csv: Command failed: node /Users/massimoraso/Code/jseda/datapilot/bin/datapilot.js eda /Users/massimoraso/Code/jseda/datapilot/tests/fixtures/test_sales.csv
file:///Users/massimoraso/Code/jseda/datapilot/src/commands/ui.js:7
import { prompt } from 'enquirer';
         ^^^^^^
SyntaxError: Named export 'prompt' not found. The requested module 'enquirer' is a CommonJS module, which may not support all module.exports as named exports.
CommonJS modules can always be imported via the default export, for example using:

import pkg from 'enquirer';
const { prompt } = pkg;

    at ModuleJob._instantiate (node:internal/modules/esm/module_job:181:21)
    at async ModuleJob.run (node:internal/modules/esm/module_job:264:5)
    at async onImport.tracePromise.__proto__ (node:internal/modules/esm/loader:580:26)
    at async asyncRunEntryPointWithESMLoader (node:internal/modules/run_main:98:5)

Node.js v23.6.1

- eda - insurance.csv: Command failed: node /Users/massimoraso/Code/jseda/datapilot/bin/datapilot.js eda /Users/massimoraso/Code/jseda/datapilot/tests/fixtures/insurance.csv
file:///Users/massimoraso/Code/jseda/datapilot/src/commands/ui.js:7
import { prompt } from 'enquirer';
         ^^^^^^
SyntaxError: Named export 'prompt' not found. The requested module 'enquirer' is a CommonJS module, which may not support all module.exports as named exports.
CommonJS modules can always be imported via the default export, for example using:

import pkg from 'enquirer';
const { prompt } = pkg;

    at ModuleJob._instantiate (node:internal/modules/esm/module_job:181:21)
    at async ModuleJob.run (node:internal/modules/esm/module_job:264:5)
    at async onImport.tracePromise.__proto__ (node:internal/modules/esm/loader:580:26)
    at async asyncRunEntryPointWithESMLoader (node:internal/modules/run_main:98:5)

Node.js v23.6.1

- eda - analytical_data_australia_final.csv.csv: Command failed: node /Users/massimoraso/Code/jseda/datapilot/bin/datapilot.js eda /Users/massimoraso/Code/jseda/datapilot/tests/fixtures/analytical_data_australia_final.csv.csv
file:///Users/massimoraso/Code/jseda/datapilot/src/commands/ui.js:7
import { prompt } from 'enquirer';
         ^^^^^^
SyntaxError: Named export 'prompt' not found. The requested module 'enquirer' is a CommonJS module, which may not support all module.exports as named exports.
CommonJS modules can always be imported via the default export, for example using:

import pkg from 'enquirer';
const { prompt } = pkg;

    at ModuleJob._instantiate (node:internal/modules/esm/module_job:181:21)
    at async ModuleJob.run (node:internal/modules/esm/module_job:264:5)
    at async onImport.tracePromise.__proto__ (node:internal/modules/esm/loader:580:26)
    at async asyncRunEntryPointWithESMLoader (node:internal/modules/run_main:98:5)

Node.js v23.6.1

- eda - australian_data.csv: Command failed: node /Users/massimoraso/Code/jseda/datapilot/bin/datapilot.js eda /Users/massimoraso/Code/jseda/datapilot/tests/fixtures/australian_data.csv
file:///Users/massimoraso/Code/jseda/datapilot/src/commands/ui.js:7
import { prompt } from 'enquirer';
         ^^^^^^
SyntaxError: Named export 'prompt' not found. The requested module 'enquirer' is a CommonJS module, which may not support all module.exports as named exports.
CommonJS modules can always be imported via the default export, for example using:

import pkg from 'enquirer';
const { prompt } = pkg;

    at ModuleJob._instantiate (node:internal/modules/esm/module_job:181:21)
    at async ModuleJob.run (node:internal/modules/esm/module_job:264:5)
    at async onImport.tracePromise.__proto__ (node:internal/modules/esm/loader:580:26)
    at async asyncRunEntryPointWithESMLoader (node:internal/modules/run_main:98:5)

Node.js v23.6.1

- eda - missing_values.csv: Command failed: node /Users/massimoraso/Code/jseda/datapilot/bin/datapilot.js eda /Users/massimoraso/Code/jseda/datapilot/tests/fixtures/missing_values.csv
file:///Users/massimoraso/Code/jseda/datapilot/src/commands/ui.js:7
import { prompt } from 'enquirer';
         ^^^^^^
SyntaxError: Named export 'prompt' not found. The requested module 'enquirer' is a CommonJS module, which may not support all module.exports as named exports.
CommonJS modules can always be imported via the default export, for example using:

import pkg from 'enquirer';
const { prompt } = pkg;

    at ModuleJob._instantiate (node:internal/modules/esm/module_job:181:21)
    at async ModuleJob.run (node:internal/modules/esm/module_job:264:5)
    at async onImport.tracePromise.__proto__ (node:internal/modules/esm/loader:580:26)
    at async asyncRunEntryPointWithESMLoader (node:internal/modules/run_main:98:5)

Node.js v23.6.1

- eda - large_numeric.csv: Command failed: node /Users/massimoraso/Code/jseda/datapilot/bin/datapilot.js eda /Users/massimoraso/Code/jseda/datapilot/tests/fixtures/large_numeric.csv
file:///Users/massimoraso/Code/jseda/datapilot/src/commands/ui.js:7
import { prompt } from 'enquirer';
         ^^^^^^
SyntaxError: Named export 'prompt' not found. The requested module 'enquirer' is a CommonJS module, which may not support all module.exports as named exports.
CommonJS modules can always be imported via the default export, for example using:

import pkg from 'enquirer';
const { prompt } = pkg;

    at ModuleJob._instantiate (node:internal/modules/esm/module_job:181:21)
    at async ModuleJob.run (node:internal/modules/esm/module_job:264:5)
    at async onImport.tracePromise.__proto__ (node:internal/modules/esm/loader:580:26)
    at async asyncRunEntryPointWithESMLoader (node:internal/modules/run_main:98:5)

Node.js v23.6.1

- eda - empty.csv: Command failed: node /Users/massimoraso/Code/jseda/datapilot/bin/datapilot.js eda /Users/massimoraso/Code/jseda/datapilot/tests/fixtures/empty.csv
file:///Users/massimoraso/Code/jseda/datapilot/src/commands/ui.js:7
import { prompt } from 'enquirer';
         ^^^^^^
SyntaxError: Named export 'prompt' not found. The requested module 'enquirer' is a CommonJS module, which may not support all module.exports as named exports.
CommonJS modules can always be imported via the default export, for example using:

import pkg from 'enquirer';
const { prompt } = pkg;

    at ModuleJob._instantiate (node:internal/modules/esm/module_job:181:21)
    at async ModuleJob.run (node:internal/modules/esm/module_job:264:5)
    at async onImport.tracePromise.__proto__ (node:internal/modules/esm/loader:580:26)
    at async asyncRunEntryPointWithESMLoader (node:internal/modules/run_main:98:5)

Node.js v23.6.1

- int - test_sales.csv: Command failed: node /Users/massimoraso/Code/jseda/datapilot/bin/datapilot.js int /Users/massimoraso/Code/jseda/datapilot/tests/fixtures/test_sales.csv
file:///Users/massimoraso/Code/jseda/datapilot/src/commands/ui.js:7
import { prompt } from 'enquirer';
         ^^^^^^
SyntaxError: Named export 'prompt' not found. The requested module 'enquirer' is a CommonJS module, which may not support all module.exports as named exports.
CommonJS modules can always be imported via the default export, for example using:

import pkg from 'enquirer';
const { prompt } = pkg;

    at ModuleJob._instantiate (node:internal/modules/esm/module_job:181:21)
    at async ModuleJob.run (node:internal/modules/esm/module_job:264:5)
    at async onImport.tracePromise.__proto__ (node:internal/modules/esm/loader:580:26)
    at async asyncRunEntryPointWithESMLoader (node:internal/modules/run_main:98:5)

Node.js v23.6.1

- int - insurance.csv: Command failed: node /Users/massimoraso/Code/jseda/datapilot/bin/datapilot.js int /Users/massimoraso/Code/jseda/datapilot/tests/fixtures/insurance.csv
file:///Users/massimoraso/Code/jseda/datapilot/src/commands/ui.js:7
import { prompt } from 'enquirer';
         ^^^^^^
SyntaxError: Named export 'prompt' not found. The requested module 'enquirer' is a CommonJS module, which may not support all module.exports as named exports.
CommonJS modules can always be imported via the default export, for example using:

import pkg from 'enquirer';
const { prompt } = pkg;

    at ModuleJob._instantiate (node:internal/modules/esm/module_job:181:21)
    at async ModuleJob.run (node:internal/modules/esm/module_job:264:5)
    at async onImport.tracePromise.__proto__ (node:internal/modules/esm/loader:580:26)
    at async asyncRunEntryPointWithESMLoader (node:internal/modules/run_main:98:5)

Node.js v23.6.1

- int - analytical_data_australia_final.csv.csv: Command failed: node /Users/massimoraso/Code/jseda/datapilot/bin/datapilot.js int /Users/massimoraso/Code/jseda/datapilot/tests/fixtures/analytical_data_australia_final.csv.csv
file:///Users/massimoraso/Code/jseda/datapilot/src/commands/ui.js:7
import { prompt } from 'enquirer';
         ^^^^^^
SyntaxError: Named export 'prompt' not found. The requested module 'enquirer' is a CommonJS module, which may not support all module.exports as named exports.
CommonJS modules can always be imported via the default export, for example using:

import pkg from 'enquirer';
const { prompt } = pkg;

    at ModuleJob._instantiate (node:internal/modules/esm/module_job:181:21)
    at async ModuleJob.run (node:internal/modules/esm/module_job:264:5)
    at async onImport.tracePromise.__proto__ (node:internal/modules/esm/loader:580:26)
    at async asyncRunEntryPointWithESMLoader (node:internal/modules/run_main:98:5)

Node.js v23.6.1

- int - australian_data.csv: Command failed: node /Users/massimoraso/Code/jseda/datapilot/bin/datapilot.js int /Users/massimoraso/Code/jseda/datapilot/tests/fixtures/australian_data.csv
file:///Users/massimoraso/Code/jseda/datapilot/src/commands/ui.js:7
import { prompt } from 'enquirer';
         ^^^^^^
SyntaxError: Named export 'prompt' not found. The requested module 'enquirer' is a CommonJS module, which may not support all module.exports as named exports.
CommonJS modules can always be imported via the default export, for example using:

import pkg from 'enquirer';
const { prompt } = pkg;

    at ModuleJob._instantiate (node:internal/modules/esm/module_job:181:21)
    at async ModuleJob.run (node:internal/modules/esm/module_job:264:5)
    at async onImport.tracePromise.__proto__ (node:internal/modules/esm/loader:580:26)
    at async asyncRunEntryPointWithESMLoader (node:internal/modules/run_main:98:5)

Node.js v23.6.1

- int - missing_values.csv: Command failed: node /Users/massimoraso/Code/jseda/datapilot/bin/datapilot.js int /Users/massimoraso/Code/jseda/datapilot/tests/fixtures/missing_values.csv
file:///Users/massimoraso/Code/jseda/datapilot/src/commands/ui.js:7
import { prompt } from 'enquirer';
         ^^^^^^
SyntaxError: Named export 'prompt' not found. The requested module 'enquirer' is a CommonJS module, which may not support all module.exports as named exports.
CommonJS modules can always be imported via the default export, for example using:

import pkg from 'enquirer';
const { prompt } = pkg;

    at ModuleJob._instantiate (node:internal/modules/esm/module_job:181:21)
    at async ModuleJob.run (node:internal/modules/esm/module_job:264:5)
    at async onImport.tracePromise.__proto__ (node:internal/modules/esm/loader:580:26)
    at async asyncRunEntryPointWithESMLoader (node:internal/modules/run_main:98:5)

Node.js v23.6.1

- int - large_numeric.csv: Command failed: node /Users/massimoraso/Code/jseda/datapilot/bin/datapilot.js int /Users/massimoraso/Code/jseda/datapilot/tests/fixtures/large_numeric.csv
file:///Users/massimoraso/Code/jseda/datapilot/src/commands/ui.js:7
import { prompt } from 'enquirer';
         ^^^^^^
SyntaxError: Named export 'prompt' not found. The requested module 'enquirer' is a CommonJS module, which may not support all module.exports as named exports.
CommonJS modules can always be imported via the default export, for example using:

import pkg from 'enquirer';
const { prompt } = pkg;

    at ModuleJob._instantiate (node:internal/modules/esm/module_job:181:21)
    at async ModuleJob.run (node:internal/modules/esm/module_job:264:5)
    at async onImport.tracePromise.__proto__ (node:internal/modules/esm/loader:580:26)
    at async asyncRunEntryPointWithESMLoader (node:internal/modules/run_main:98:5)

Node.js v23.6.1

- int - empty.csv: Command failed: node /Users/massimoraso/Code/jseda/datapilot/bin/datapilot.js int /Users/massimoraso/Code/jseda/datapilot/tests/fixtures/empty.csv
file:///Users/massimoraso/Code/jseda/datapilot/src/commands/ui.js:7
import { prompt } from 'enquirer';
         ^^^^^^
SyntaxError: Named export 'prompt' not found. The requested module 'enquirer' is a CommonJS module, which may not support all module.exports as named exports.
CommonJS modules can always be imported via the default export, for example using:

import pkg from 'enquirer';
const { prompt } = pkg;

    at ModuleJob._instantiate (node:internal/modules/esm/module_job:181:21)
    at async ModuleJob.run (node:internal/modules/esm/module_job:264:5)
    at async onImport.tracePromise.__proto__ (node:internal/modules/esm/loader:580:26)
    at async asyncRunEntryPointWithESMLoader (node:internal/modules/run_main:98:5)

Node.js v23.6.1

- vis - test_sales.csv: Command failed: node /Users/massimoraso/Code/jseda/datapilot/bin/datapilot.js vis /Users/massimoraso/Code/jseda/datapilot/tests/fixtures/test_sales.csv
file:///Users/massimoraso/Code/jseda/datapilot/src/commands/ui.js:7
import { prompt } from 'enquirer';
         ^^^^^^
SyntaxError: Named export 'prompt' not found. The requested module 'enquirer' is a CommonJS module, which may not support all module.exports as named exports.
CommonJS modules can always be imported via the default export, for example using:

import pkg from 'enquirer';
const { prompt } = pkg;

    at ModuleJob._instantiate (node:internal/modules/esm/module_job:181:21)
    at async ModuleJob.run (node:internal/modules/esm/module_job:264:5)
    at async onImport.tracePromise.__proto__ (node:internal/modules/esm/loader:580:26)
    at async asyncRunEntryPointWithESMLoader (node:internal/modules/run_main:98:5)

Node.js v23.6.1

- vis - insurance.csv: Command failed: node /Users/massimoraso/Code/jseda/datapilot/bin/datapilot.js vis /Users/massimoraso/Code/jseda/datapilot/tests/fixtures/insurance.csv
file:///Users/massimoraso/Code/jseda/datapilot/src/commands/ui.js:7
import { prompt } from 'enquirer';
         ^^^^^^
SyntaxError: Named export 'prompt' not found. The requested module 'enquirer' is a CommonJS module, which may not support all module.exports as named exports.
CommonJS modules can always be imported via the default export, for example using:

import pkg from 'enquirer';
const { prompt } = pkg;

    at ModuleJob._instantiate (node:internal/modules/esm/module_job:181:21)
    at async ModuleJob.run (node:internal/modules/esm/module_job:264:5)
    at async onImport.tracePromise.__proto__ (node:internal/modules/esm/loader:580:26)
    at async asyncRunEntryPointWithESMLoader (node:internal/modules/run_main:98:5)

Node.js v23.6.1

- vis - analytical_data_australia_final.csv.csv: Command failed: node /Users/massimoraso/Code/jseda/datapilot/bin/datapilot.js vis /Users/massimoraso/Code/jseda/datapilot/tests/fixtures/analytical_data_australia_final.csv.csv
file:///Users/massimoraso/Code/jseda/datapilot/src/commands/ui.js:7
import { prompt } from 'enquirer';
         ^^^^^^
SyntaxError: Named export 'prompt' not found. The requested module 'enquirer' is a CommonJS module, which may not support all module.exports as named exports.
CommonJS modules can always be imported via the default export, for example using:

import pkg from 'enquirer';
const { prompt } = pkg;

    at ModuleJob._instantiate (node:internal/modules/esm/module_job:181:21)
    at async ModuleJob.run (node:internal/modules/esm/module_job:264:5)
    at async onImport.tracePromise.__proto__ (node:internal/modules/esm/loader:580:26)
    at async asyncRunEntryPointWithESMLoader (node:internal/modules/run_main:98:5)

Node.js v23.6.1

- vis - australian_data.csv: Command failed: node /Users/massimoraso/Code/jseda/datapilot/bin/datapilot.js vis /Users/massimoraso/Code/jseda/datapilot/tests/fixtures/australian_data.csv
file:///Users/massimoraso/Code/jseda/datapilot/src/commands/ui.js:7
import { prompt } from 'enquirer';
         ^^^^^^
SyntaxError: Named export 'prompt' not found. The requested module 'enquirer' is a CommonJS module, which may not support all module.exports as named exports.
CommonJS modules can always be imported via the default export, for example using:

import pkg from 'enquirer';
const { prompt } = pkg;

    at ModuleJob._instantiate (node:internal/modules/esm/module_job:181:21)
    at async ModuleJob.run (node:internal/modules/esm/module_job:264:5)
    at async onImport.tracePromise.__proto__ (node:internal/modules/esm/loader:580:26)
    at async asyncRunEntryPointWithESMLoader (node:internal/modules/run_main:98:5)

Node.js v23.6.1

- vis - missing_values.csv: Command failed: node /Users/massimoraso/Code/jseda/datapilot/bin/datapilot.js vis /Users/massimoraso/Code/jseda/datapilot/tests/fixtures/missing_values.csv
file:///Users/massimoraso/Code/jseda/datapilot/src/commands/ui.js:7
import { prompt } from 'enquirer';
         ^^^^^^
SyntaxError: Named export 'prompt' not found. The requested module 'enquirer' is a CommonJS module, which may not support all module.exports as named exports.
CommonJS modules can always be imported via the default export, for example using:

import pkg from 'enquirer';
const { prompt } = pkg;

    at ModuleJob._instantiate (node:internal/modules/esm/module_job:181:21)
    at async ModuleJob.run (node:internal/modules/esm/module_job:264:5)
    at async onImport.tracePromise.__proto__ (node:internal/modules/esm/loader:580:26)
    at async asyncRunEntryPointWithESMLoader (node:internal/modules/run_main:98:5)

Node.js v23.6.1

- vis - large_numeric.csv: Command failed: node /Users/massimoraso/Code/jseda/datapilot/bin/datapilot.js vis /Users/massimoraso/Code/jseda/datapilot/tests/fixtures/large_numeric.csv
file:///Users/massimoraso/Code/jseda/datapilot/src/commands/ui.js:7
import { prompt } from 'enquirer';
         ^^^^^^
SyntaxError: Named export 'prompt' not found. The requested module 'enquirer' is a CommonJS module, which may not support all module.exports as named exports.
CommonJS modules can always be imported via the default export, for example using:

import pkg from 'enquirer';
const { prompt } = pkg;

    at ModuleJob._instantiate (node:internal/modules/esm/module_job:181:21)
    at async ModuleJob.run (node:internal/modules/esm/module_job:264:5)
    at async onImport.tracePromise.__proto__ (node:internal/modules/esm/loader:580:26)
    at async asyncRunEntryPointWithESMLoader (node:internal/modules/run_main:98:5)

Node.js v23.6.1

- vis - empty.csv: Command failed: node /Users/massimoraso/Code/jseda/datapilot/bin/datapilot.js vis /Users/massimoraso/Code/jseda/datapilot/tests/fixtures/empty.csv
file:///Users/massimoraso/Code/jseda/datapilot/src/commands/ui.js:7
import { prompt } from 'enquirer';
         ^^^^^^
SyntaxError: Named export 'prompt' not found. The requested module 'enquirer' is a CommonJS module, which may not support all module.exports as named exports.
CommonJS modules can always be imported via the default export, for example using:

import pkg from 'enquirer';
const { prompt } = pkg;

    at ModuleJob._instantiate (node:internal/modules/esm/module_job:181:21)
    at async ModuleJob.run (node:internal/modules/esm/module_job:264:5)
    at async onImport.tracePromise.__proto__ (node:internal/modules/esm/loader:580:26)
    at async asyncRunEntryPointWithESMLoader (node:internal/modules/run_main:98:5)

Node.js v23.6.1

- eng - test_sales.csv: Command failed: node /Users/massimoraso/Code/jseda/datapilot/bin/datapilot.js eng /Users/massimoraso/Code/jseda/datapilot/tests/fixtures/test_sales.csv
file:///Users/massimoraso/Code/jseda/datapilot/src/commands/ui.js:7
import { prompt } from 'enquirer';
         ^^^^^^
SyntaxError: Named export 'prompt' not found. The requested module 'enquirer' is a CommonJS module, which may not support all module.exports as named exports.
CommonJS modules can always be imported via the default export, for example using:

import pkg from 'enquirer';
const { prompt } = pkg;

    at ModuleJob._instantiate (node:internal/modules/esm/module_job:181:21)
    at async ModuleJob.run (node:internal/modules/esm/module_job:264:5)
    at async onImport.tracePromise.__proto__ (node:internal/modules/esm/loader:580:26)
    at async asyncRunEntryPointWithESMLoader (node:internal/modules/run_main:98:5)

Node.js v23.6.1

- eng - insurance.csv: Command failed: node /Users/massimoraso/Code/jseda/datapilot/bin/datapilot.js eng /Users/massimoraso/Code/jseda/datapilot/tests/fixtures/insurance.csv
file:///Users/massimoraso/Code/jseda/datapilot/src/commands/ui.js:7
import { prompt } from 'enquirer';
         ^^^^^^
SyntaxError: Named export 'prompt' not found. The requested module 'enquirer' is a CommonJS module, which may not support all module.exports as named exports.
CommonJS modules can always be imported via the default export, for example using:

import pkg from 'enquirer';
const { prompt } = pkg;

    at ModuleJob._instantiate (node:internal/modules/esm/module_job:181:21)
    at async ModuleJob.run (node:internal/modules/esm/module_job:264:5)
    at async onImport.tracePromise.__proto__ (node:internal/modules/esm/loader:580:26)
    at async asyncRunEntryPointWithESMLoader (node:internal/modules/run_main:98:5)

Node.js v23.6.1

- eng - analytical_data_australia_final.csv.csv: Command failed: node /Users/massimoraso/Code/jseda/datapilot/bin/datapilot.js eng /Users/massimoraso/Code/jseda/datapilot/tests/fixtures/analytical_data_australia_final.csv.csv
file:///Users/massimoraso/Code/jseda/datapilot/src/commands/ui.js:7
import { prompt } from 'enquirer';
         ^^^^^^
SyntaxError: Named export 'prompt' not found. The requested module 'enquirer' is a CommonJS module, which may not support all module.exports as named exports.
CommonJS modules can always be imported via the default export, for example using:

import pkg from 'enquirer';
const { prompt } = pkg;

    at ModuleJob._instantiate (node:internal/modules/esm/module_job:181:21)
    at async ModuleJob.run (node:internal/modules/esm/module_job:264:5)
    at async onImport.tracePromise.__proto__ (node:internal/modules/esm/loader:580:26)
    at async asyncRunEntryPointWithESMLoader (node:internal/modules/run_main:98:5)

Node.js v23.6.1

- eng - australian_data.csv: Command failed: node /Users/massimoraso/Code/jseda/datapilot/bin/datapilot.js eng /Users/massimoraso/Code/jseda/datapilot/tests/fixtures/australian_data.csv
file:///Users/massimoraso/Code/jseda/datapilot/src/commands/ui.js:7
import { prompt } from 'enquirer';
         ^^^^^^
SyntaxError: Named export 'prompt' not found. The requested module 'enquirer' is a CommonJS module, which may not support all module.exports as named exports.
CommonJS modules can always be imported via the default export, for example using:

import pkg from 'enquirer';
const { prompt } = pkg;

    at ModuleJob._instantiate (node:internal/modules/esm/module_job:181:21)
    at async ModuleJob.run (node:internal/modules/esm/module_job:264:5)
    at async onImport.tracePromise.__proto__ (node:internal/modules/esm/loader:580:26)
    at async asyncRunEntryPointWithESMLoader (node:internal/modules/run_main:98:5)

Node.js v23.6.1

- eng - missing_values.csv: Command failed: node /Users/massimoraso/Code/jseda/datapilot/bin/datapilot.js eng /Users/massimoraso/Code/jseda/datapilot/tests/fixtures/missing_values.csv
file:///Users/massimoraso/Code/jseda/datapilot/src/commands/ui.js:7
import { prompt } from 'enquirer';
         ^^^^^^
SyntaxError: Named export 'prompt' not found. The requested module 'enquirer' is a CommonJS module, which may not support all module.exports as named exports.
CommonJS modules can always be imported via the default export, for example using:

import pkg from 'enquirer';
const { prompt } = pkg;

    at ModuleJob._instantiate (node:internal/modules/esm/module_job:181:21)
    at async ModuleJob.run (node:internal/modules/esm/module_job:264:5)
    at async onImport.tracePromise.__proto__ (node:internal/modules/esm/loader:580:26)
    at async asyncRunEntryPointWithESMLoader (node:internal/modules/run_main:98:5)

Node.js v23.6.1

- eng - large_numeric.csv: Command failed: node /Users/massimoraso/Code/jseda/datapilot/bin/datapilot.js eng /Users/massimoraso/Code/jseda/datapilot/tests/fixtures/large_numeric.csv
file:///Users/massimoraso/Code/jseda/datapilot/src/commands/ui.js:7
import { prompt } from 'enquirer';
         ^^^^^^
SyntaxError: Named export 'prompt' not found. The requested module 'enquirer' is a CommonJS module, which may not support all module.exports as named exports.
CommonJS modules can always be imported via the default export, for example using:

import pkg from 'enquirer';
const { prompt } = pkg;

    at ModuleJob._instantiate (node:internal/modules/esm/module_job:181:21)
    at async ModuleJob.run (node:internal/modules/esm/module_job:264:5)
    at async onImport.tracePromise.__proto__ (node:internal/modules/esm/loader:580:26)
    at async asyncRunEntryPointWithESMLoader (node:internal/modules/run_main:98:5)

Node.js v23.6.1

- eng - empty.csv: Command failed: node /Users/massimoraso/Code/jseda/datapilot/bin/datapilot.js eng /Users/massimoraso/Code/jseda/datapilot/tests/fixtures/empty.csv
file:///Users/massimoraso/Code/jseda/datapilot/src/commands/ui.js:7
import { prompt } from 'enquirer';
         ^^^^^^
SyntaxError: Named export 'prompt' not found. The requested module 'enquirer' is a CommonJS module, which may not support all module.exports as named exports.
CommonJS modules can always be imported via the default export, for example using:

import pkg from 'enquirer';
const { prompt } = pkg;

    at ModuleJob._instantiate (node:internal/modules/esm/module_job:181:21)
    at async ModuleJob.run (node:internal/modules/esm/module_job:264:5)
    at async onImport.tracePromise.__proto__ (node:internal/modules/esm/loader:580:26)
    at async asyncRunEntryPointWithESMLoader (node:internal/modules/run_main:98:5)

Node.js v23.6.1

- llm - test_sales.csv: Command failed: node /Users/massimoraso/Code/jseda/datapilot/bin/datapilot.js llm /Users/massimoraso/Code/jseda/datapilot/tests/fixtures/test_sales.csv
file:///Users/massimoraso/Code/jseda/datapilot/src/commands/ui.js:7
import { prompt } from 'enquirer';
         ^^^^^^
SyntaxError: Named export 'prompt' not found. The requested module 'enquirer' is a CommonJS module, which may not support all module.exports as named exports.
CommonJS modules can always be imported via the default export, for example using:

import pkg from 'enquirer';
const { prompt } = pkg;

    at ModuleJob._instantiate (node:internal/modules/esm/module_job:181:21)
    at async ModuleJob.run (node:internal/modules/esm/module_job:264:5)
    at async onImport.tracePromise.__proto__ (node:internal/modules/esm/loader:580:26)
    at async asyncRunEntryPointWithESMLoader (node:internal/modules/run_main:98:5)

Node.js v23.6.1

- llm - insurance.csv: Command failed: node /Users/massimoraso/Code/jseda/datapilot/bin/datapilot.js llm /Users/massimoraso/Code/jseda/datapilot/tests/fixtures/insurance.csv
file:///Users/massimoraso/Code/jseda/datapilot/src/commands/ui.js:7
import { prompt } from 'enquirer';
         ^^^^^^
SyntaxError: Named export 'prompt' not found. The requested module 'enquirer' is a CommonJS module, which may not support all module.exports as named exports.
CommonJS modules can always be imported via the default export, for example using:

import pkg from 'enquirer';
const { prompt } = pkg;

    at ModuleJob._instantiate (node:internal/modules/esm/module_job:181:21)
    at async ModuleJob.run (node:internal/modules/esm/module_job:264:5)
    at async onImport.tracePromise.__proto__ (node:internal/modules/esm/loader:580:26)
    at async asyncRunEntryPointWithESMLoader (node:internal/modules/run_main:98:5)

Node.js v23.6.1

- llm - analytical_data_australia_final.csv.csv: Command failed: node /Users/massimoraso/Code/jseda/datapilot/bin/datapilot.js llm /Users/massimoraso/Code/jseda/datapilot/tests/fixtures/analytical_data_australia_final.csv.csv
file:///Users/massimoraso/Code/jseda/datapilot/src/commands/ui.js:7
import { prompt } from 'enquirer';
         ^^^^^^
SyntaxError: Named export 'prompt' not found. The requested module 'enquirer' is a CommonJS module, which may not support all module.exports as named exports.
CommonJS modules can always be imported via the default export, for example using:

import pkg from 'enquirer';
const { prompt } = pkg;

    at ModuleJob._instantiate (node:internal/modules/esm/module_job:181:21)
    at async ModuleJob.run (node:internal/modules/esm/module_job:264:5)
    at async onImport.tracePromise.__proto__ (node:internal/modules/esm/loader:580:26)
    at async asyncRunEntryPointWithESMLoader (node:internal/modules/run_main:98:5)

Node.js v23.6.1

- llm - australian_data.csv: Command failed: node /Users/massimoraso/Code/jseda/datapilot/bin/datapilot.js llm /Users/massimoraso/Code/jseda/datapilot/tests/fixtures/australian_data.csv
file:///Users/massimoraso/Code/jseda/datapilot/src/commands/ui.js:7
import { prompt } from 'enquirer';
         ^^^^^^
SyntaxError: Named export 'prompt' not found. The requested module 'enquirer' is a CommonJS module, which may not support all module.exports as named exports.
CommonJS modules can always be imported via the default export, for example using:

import pkg from 'enquirer';
const { prompt } = pkg;

    at ModuleJob._instantiate (node:internal/modules/esm/module_job:181:21)
    at async ModuleJob.run (node:internal/modules/esm/module_job:264:5)
    at async onImport.tracePromise.__proto__ (node:internal/modules/esm/loader:580:26)
    at async asyncRunEntryPointWithESMLoader (node:internal/modules/run_main:98:5)

Node.js v23.6.1

- llm - missing_values.csv: Command failed: node /Users/massimoraso/Code/jseda/datapilot/bin/datapilot.js llm /Users/massimoraso/Code/jseda/datapilot/tests/fixtures/missing_values.csv
file:///Users/massimoraso/Code/jseda/datapilot/src/commands/ui.js:7
import { prompt } from 'enquirer';
         ^^^^^^
SyntaxError: Named export 'prompt' not found. The requested module 'enquirer' is a CommonJS module, which may not support all module.exports as named exports.
CommonJS modules can always be imported via the default export, for example using:

import pkg from 'enquirer';
const { prompt } = pkg;

    at ModuleJob._instantiate (node:internal/modules/esm/module_job:181:21)
    at async ModuleJob.run (node:internal/modules/esm/module_job:264:5)
    at async onImport.tracePromise.__proto__ (node:internal/modules/esm/loader:580:26)
    at async asyncRunEntryPointWithESMLoader (node:internal/modules/run_main:98:5)

Node.js v23.6.1

- llm - large_numeric.csv: Command failed: node /Users/massimoraso/Code/jseda/datapilot/bin/datapilot.js llm /Users/massimoraso/Code/jseda/datapilot/tests/fixtures/large_numeric.csv
file:///Users/massimoraso/Code/jseda/datapilot/src/commands/ui.js:7
import { prompt } from 'enquirer';
         ^^^^^^
SyntaxError: Named export 'prompt' not found. The requested module 'enquirer' is a CommonJS module, which may not support all module.exports as named exports.
CommonJS modules can always be imported via the default export, for example using:

import pkg from 'enquirer';
const { prompt } = pkg;

    at ModuleJob._instantiate (node:internal/modules/esm/module_job:181:21)
    at async ModuleJob.run (node:internal/modules/esm/module_job:264:5)
    at async onImport.tracePromise.__proto__ (node:internal/modules/esm/loader:580:26)
    at async asyncRunEntryPointWithESMLoader (node:internal/modules/run_main:98:5)

Node.js v23.6.1

- llm - empty.csv: Command failed: node /Users/massimoraso/Code/jseda/datapilot/bin/datapilot.js llm /Users/massimoraso/Code/jseda/datapilot/tests/fixtures/empty.csv
file:///Users/massimoraso/Code/jseda/datapilot/src/commands/ui.js:7
import { prompt } from 'enquirer';
         ^^^^^^
SyntaxError: Named export 'prompt' not found. The requested module 'enquirer' is a CommonJS module, which may not support all module.exports as named exports.
CommonJS modules can always be imported via the default export, for example using:

import pkg from 'enquirer';
const { prompt } = pkg;

    at ModuleJob._instantiate (node:internal/modules/esm/module_job:181:21)
    at async ModuleJob.run (node:internal/modules/esm/module_job:264:5)
    at async onImport.tracePromise.__proto__ (node:internal/modules/esm/loader:580:26)
    at async asyncRunEntryPointWithESMLoader (node:internal/modules/run_main:98:5)

Node.js v23.6.1

- eda - large_test.csv: Command failed: node /Users/massimoraso/Code/jseda/datapilot/bin/datapilot.js eda /Users/massimoraso/Code/jseda/datapilot/tests/fixtures/large_test.csv
file:///Users/massimoraso/Code/jseda/datapilot/src/commands/ui.js:7
import { prompt } from 'enquirer';
         ^^^^^^
SyntaxError: Named export 'prompt' not found. The requested module 'enquirer' is a CommonJS module, which may not support all module.exports as named exports.
CommonJS modules can always be imported via the default export, for example using:

import pkg from 'enquirer';
const { prompt } = pkg;

    at ModuleJob._instantiate (node:internal/modules/esm/module_job:181:21)
    at async ModuleJob.run (node:internal/modules/esm/module_job:264:5)
    at async onImport.tracePromise.__proto__ (node:internal/modules/esm/loader:580:26)
    at async asyncRunEntryPointWithESMLoader (node:internal/modules/run_main:98:5)

Node.js v23.6.1


## Coverage
- Commands tested: eda, int, vis, eng, llm
- Files tested: test_sales.csv, insurance.csv, analytical_data_australia_final.csv.csv, australian_data.csv, missing_values.csv, large_numeric.csv, empty.csv
- Edge cases: Tested
- Performance: Tested with 10,000 row file
