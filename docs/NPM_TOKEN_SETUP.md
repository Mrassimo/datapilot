# NPM Token Setup for Automated Publishing

This document explains how to configure the NPM token for automated package publishing with semantic-release.

## Why NPM Token is Required

The DataPilot CLI uses [semantic-release](https://github.com/semantic-release/semantic-release) to automatically:
- Determine the next version number based on commit messages
- Generate release notes
- Publish to npm registry
- Create GitHub releases

## Current Status

✅ **All core functionality works without NPM token:**
- All 1,493 tests passing
- Security vulnerabilities resolved  
- Cross-platform binary building
- All CI checks passing

⚠️ **NPM token needed only for automatic publishing**

## Setup Instructions

### Step 1: Generate NPM Token

1. Go to [NPM Token Settings](https://www.npmjs.com/settings/tokens)
2. Click "Generate New Token"
3. Select **"Automation"** token type
4. Set permissions to **"Publish"**
5. Copy the generated token (starts with `npm_`)

### Step 2: Configure Two-Factor Authentication

**IMPORTANT:** If you use 2FA on your NPM account:

1. Go to [NPM Account Settings](https://www.npmjs.com/settings/profile)
2. Set 2FA level to **"Authorization only"** 
3. **NOT** "Authorization and writes" (this blocks semantic-release)

### Step 3: Add Token to GitHub Repository

1. Go to your repository on GitHub
2. Navigate to: `Settings` → `Secrets and variables` → `Actions`
3. Click "New repository secret"
4. Name: `NPM_TOKEN`
5. Value: Paste your NPM token
6. Click "Add secret"

### Step 4: Verify Setup

1. Push a new commit to the `main` branch
2. Check the "Semantic Release" step in GitHub Actions
3. Should now show: "✅ NPM token is valid and authenticated"

## Troubleshooting

### "Invalid NPM token" Error

- **Cause:** Token is expired, invalid, or has wrong permissions
- **Solution:** Generate a new Automation token with Publish permissions

### "E401 Unauthorized" Error

- **Cause:** 2FA is set to "Authorization and writes"
- **Solution:** Change 2FA to "Authorization only" in NPM settings

### "Token not configured" Message

- **Cause:** NPM_TOKEN secret is missing from repository
- **Solution:** Add the secret following Step 3 above

## Alternative Publishing Methods

If you prefer not to set up automated publishing:

1. **Manual Publishing:**
   ```bash
   npm run build
   npm publish
   ```

2. **Local Development:**
   ```bash
   npm pack
   npm install -g datapilot-cli-*.tgz
   ```

3. **Direct Usage:**
   ```bash
   node dist/cli/index.js --help
   ```

## Security Notes

- NPM tokens are sensitive - never commit them to code
- Use "Automation" tokens for CI/CD (not "Publish" user tokens)
- Regularly rotate tokens for security
- Repository secrets are encrypted and only accessible to workflow runs

## Support

If you need help with NPM token setup:
- [NPM Token Documentation](https://docs.npmjs.com/creating-and-viewing-access-tokens)
- [Semantic Release NPM Plugin](https://github.com/semantic-release/npm)
- [GitHub Repository Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)