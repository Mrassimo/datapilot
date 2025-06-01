import { writeFileSync } from 'fs';
import chalk from 'chalk';

export class OutputHandler {
  constructor(options = {}) {
    this.outputFile = options.output;
    this.buffer = '';
    this.originalLog = console.log;
    
    if (this.outputFile) {
      // Override console.log to capture output
      console.log = (...args) => {
        const text = args.join(' ');
        this.buffer += text + '\n';
      };
    }
  }
  
  finalize() {
    if (this.outputFile) {
      // Restore original console.log
      console.log = this.originalLog;
      
      // Write buffer to file
      writeFileSync(this.outputFile, this.buffer);
      const checkmark = process.platform === 'win32' ? '[OK]' : '✓';
      console.log(chalk.green(`\n${checkmark} Analysis saved to: ${this.outputFile}`));
      
      // Show preview
      const lines = this.buffer.split('\n').slice(0, 10);
      console.log(chalk.gray('\nPreview of saved analysis:'));
      lines.forEach(line => console.log(chalk.gray(line)));
      
      if (this.buffer.split('\n').length > 10) {
        console.log(chalk.gray('... (truncated)'));
      }
    }
  }
  
  restore() {
    // Restore console.log in case of error
    if (this.outputFile) {
      console.log = this.originalLog;
    }
  }
}