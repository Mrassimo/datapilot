# 📦 DataPilot NPM Publishing Guide

## 🚀 First-Time Publishing (5 minutes)

### Step 1: Create npm Account
```bash
# If you don't have an npm account, create one at:
# https://www.npmjs.com/signup

# Or create via CLI:
npm adduser
# Enter username, password, and email
```

### Step 2: Login to npm
```bash
npm login
# Enter your npm credentials
```

### Step 3: Verify Package
```bash
# Check what will be published
npm pack --dry-run

# Current package: 941.2 KB (perfect size!)
```

### Step 4: Publish!
```bash
npm publish
```

That's it! 🎉 DataPilot will be live on npm in ~1 minute.

## 📝 Making Updates (Even Easier!)

### 1. Make Your Changes
```bash
# Edit your code as needed
# Test everything
npm test
```

### 2. Update Version
```bash
# For bug fixes (1.1.1 → 1.1.2)
npm version patch

# For new features (1.1.1 → 1.2.0)
npm version minor

# For breaking changes (1.1.1 → 2.0.0)
npm version major
```

### 3. Publish Update
```bash
npm publish
# That's it! Update is live in ~1 minute
```

## 🔍 What Gets Published?

Current package includes:
- ✅ `dist/` - Bundled CLI tool (2.8MB)
- ✅ `src/` - Source code for transparency
- ✅ `bin/` - CLI entry point
- ✅ `README.md` - Documentation
- ✅ `package.json` - Package metadata

Excluded (via .npmignore):
- ❌ `tests/` - Not needed by users
- ❌ `archive/` - Old documentation
- ❌ `docs/` - Development docs
- ❌ `.github/` - CI/CD files

## 🏷️ Package Name

The name `datapilot` is currently **available**! 🎉

## 📊 Version Strategy

Current: `1.1.1`

Recommended versioning:
- Bug fixes: `1.1.2`, `1.1.3`, etc.
- New features: `1.2.0`, `1.3.0`, etc.
- Breaking changes: `2.0.0`

## 🔄 Automated Publishing (Optional)

Add to package.json for easier publishing:
```json
"scripts": {
  "release:patch": "npm version patch && npm publish",
  "release:minor": "npm version minor && npm publish",
  "release:major": "npm version major && npm publish"
}
```

Then just run:
```bash
npm run release:patch  # For bug fixes
```

## 📈 After Publishing

1. **Verify Installation**:
   ```bash
   npm install -g datapilot
   datapilot --version
   ```

2. **Check npm Page**:
   ```
   https://www.npmjs.com/package/datapilot
   ```

3. **Monitor Downloads**:
   ```bash
   npm info datapilot
   ```

## 🚨 Common Issues

1. **Name Taken**: Change name in package.json
2. **Not Logged In**: Run `npm login`
3. **Version Exists**: Bump version with `npm version patch`

## 💡 Pro Tips

1. **Test First**: Always run `npm pack` to preview
2. **Semantic Versioning**: Use patch/minor/major appropriately
3. **README**: First thing people see on npm
4. **Keywords**: Help people find your package

## 🎯 Ready to Publish?

Just run:
```bash
npm login
npm publish
```

Your package will be available globally in ~1 minute! 🚀