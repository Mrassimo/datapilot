/**
 * Windows PATH Helper
 * Provides utilities for detecting and guiding Windows PATH configuration
 */

import * as os from 'os';
import * as path from 'path';
import { execSync } from 'child_process';

export class WindowsPathHelper {
  /**
   * Check if we're running on Windows
   */
  static isWindows(): boolean {
    return os.platform() === 'win32';
  }

  /**
   * Check if DataPilot is available in PATH
   */
  static isDataPilotInPath(): boolean {
    if (!this.isWindows()) {
      return true; // Assume it's working on non-Windows systems
    }

    try {
      execSync('where datapilot', { stdio: 'ignore' });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get npm global installation path
   */
  static getNpmGlobalPath(): string | null {
    try {
      const npmPrefix = execSync('npm config get prefix', { encoding: 'utf8' }).trim();
      return npmPrefix;
    } catch (error) {
      return null;
    }
  }

  /**
   * Show Windows-specific setup guidance when DataPilot is not in PATH
   */
  static showWindowsSetupGuide(): void {
    if (!this.isWindows()) {
      return;
    }

    console.error('\n🚨 WINDOWS SETUP ISSUE DETECTED:');
    console.error('═══════════════════════════════════════════════════════════');
    console.error('⚠️  DataPilot CLI is not in your PATH environment variable.');
    console.error('⚠️  This is common on Windows after npm global installations.\n');

    // Try to get npm prefix for helpful instructions
    const npmPrefix = this.getNpmGlobalPath();
    
    if (npmPrefix) {
      console.error('🔧 QUICK FIXES:');
      console.error('\n1️⃣ Use npx (No setup needed, works immediately):');
      console.error(`   npx datapilot-cli --version`);
      console.error(`   npx datapilot-cli all yourfile.csv\n`);
      
      console.error('2️⃣ Add npm to PATH (One-time setup for permanent access):');
      console.error('   📋 PowerShell (as Administrator):');
      console.error(`      [Environment]::SetEnvironmentVariable("Path", $env:Path + ";${npmPrefix}", [EnvironmentVariableTarget]::User)`);
      console.error('   📋 Command Prompt (as Administrator):');
      console.error(`      setx PATH "%PATH%;${npmPrefix}"`);
      console.error('   📋 Manual (safest method):');
      console.error('      • Right-click "This PC" → Properties → Advanced system settings');
      console.error('      • Environment Variables → User variables → Path → Edit → New');
      console.error(`      • Add: ${npmPrefix}`);
      console.error('      • OK → OK → OK → Restart terminal\n');
      
      console.error('3️⃣ Use full path (Direct execution):');
      console.error(`   "${path.join(npmPrefix, 'datapilot')}" --version\n`);
    } else {
      console.error('🔧 SETUP OPTIONS:');
      console.error('1️⃣ Use npx: npx datapilot-cli --version');
      console.error('2️⃣ Find npm prefix: npm config get prefix');
      console.error('3️⃣ Add the prefix path to your PATH environment variable\n');
    }

    console.error('📚 Need more help?');
    console.error('   • Full guide: https://github.com/Mrassimo/datapilot#windows-installation');
    console.error('   • Issues: https://github.com/Mrassimo/datapilot/issues');
    console.error('═══════════════════════════════════════════════════════════\n');
  }

  /**
   * Check if the current execution might be a PATH-related issue
   */
  static isLikelyPathIssue(error: any): boolean {
    if (!this.isWindows()) {
      return false;
    }

    const errorMessage = String(error).toLowerCase();
    const pathIssueIndicators = [
      'command not found',
      'is not recognized',
      'not found',
      'cannot find',
      'enoent',
      'spawn',
      'spawnSync'
    ];

    return pathIssueIndicators.some(indicator => errorMessage.includes(indicator));
  }

  /**
   * Provide context-aware error guidance
   */
  static provideErrorGuidance(error: any): void {
    if (!this.isWindows()) {
      return;
    }

    if (this.isLikelyPathIssue(error)) {
      this.showWindowsSetupGuide();
    } else {
      // Generic Windows troubleshooting
      console.error('\n🔍 Windows Troubleshooting:');
      console.error('If you continue having issues:');
      console.error('• Try running as Administrator');
      console.error('• Check if your antivirus is blocking the command');
      console.error('• Ensure Node.js and npm are properly installed');
      console.error('• Try using PowerShell instead of Command Prompt\n');
    }
  }

  /**
   * Check installation health and provide proactive guidance
   */
  static checkInstallationHealth(): void {
    if (!this.isWindows()) {
      return;
    }

    // Only check if we think we might have issues
    if (!this.isDataPilotInPath()) {
      console.log('\n💡 Windows PATH Check:');
      console.log('DataPilot might not be in your PATH. If you encounter issues, try:');
      console.log('• npx datapilot-cli --version (works without PATH setup)');
      console.log('• Or see setup guide with --help-windows\n');
    }
  }

  /**
   * Show comprehensive Windows help
   */
  static showWindowsHelp(): void {
    if (!this.isWindows()) {
      console.log('This help is specific to Windows. You\'re on a different platform.');
      return;
    }

    console.log('\n🪟 DataPilot CLI - Windows Setup Guide');
    console.log('═══════════════════════════════════════════════════════════');
    
    console.log('\n📦 Installation Methods:');
    console.log('npm install -g datapilot-cli    # Global installation');
    console.log('npx datapilot-cli --version     # Direct usage (no installation)');
    
    console.log('\n🛠️  PATH Configuration:');
    const npmPrefix = this.getNpmGlobalPath();
    if (npmPrefix) {
      console.log(`Your npm global path: ${npmPrefix}`);
      console.log('This path should be in your PATH environment variable.');
    }
    
    console.log('\n✅ Verification:');
    console.log('datapilot --version             # Should show version if PATH is set');
    console.log('where datapilot                 # Should show executable location');
    console.log('npx datapilot-cli --version     # Always works regardless of PATH');
    
    console.log('\n🚨 Common Issues:');
    console.log('• "datapilot is not recognized" → PATH not configured');
    console.log('• "Access denied" → Run as Administrator');
    console.log('• "Module not found" → Try npm install -g datapilot-cli');
    
    console.log('\n🔗 Resources:');
    console.log('• GitHub: https://github.com/Mrassimo/datapilot');
    console.log('• Issues: https://github.com/Mrassimo/datapilot/issues');
    console.log('• Windows PATH Guide: https://www.java.com/en/download/help/path.html');
    console.log('═══════════════════════════════════════════════════════════\n');
  }
}