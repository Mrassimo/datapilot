# 🚀 Automated Release Process

## Overview

DataPilot now uses **Semantic Release** for fully automated releases. When code is pushed to the `main` branch and all CI tests pass, a new release will be automatically created based on the commit messages.

## 🎯 How It Works

### 1. **Automatic Version Management**
- **Patch Release** (1.0.0 → 1.0.1): Bug fixes
- **Minor Release** (1.0.0 → 1.1.0): New features  
- **Major Release** (1.0.0 → 2.0.0): Breaking changes

### 2. **Commit Message Format**

Use [Conventional Commits](https://www.conventionalcommits.org/) format:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### 3. **Release Triggers**

| Commit Type | Release Type | Example |
|-------------|--------------|---------|
| `fix:` | Patch | `fix: resolve CSV parsing issue` |
| `feat:` | Minor | `feat: add new visualization engine` |
| `feat!:` or `BREAKING CHANGE:` | Major | `feat!: redesign API interface` |
| `chore:`, `docs:`, `style:` | No Release | `docs: update README` |

## 📝 Commit Message Examples

### **Patch Release (Bug Fixes)**
```bash
git commit -m "fix: resolve memory leak in streaming analyzer"
git commit -m "fix(csv): handle malformed headers correctly"
```

### **Minor Release (New Features)**
```bash
git commit -m "feat: add PostgreSQL data source support"
git commit -m "feat(viz): implement interactive dashboard components"
```

### **Major Release (Breaking Changes)**
```bash
git commit -m "feat!: redesign CLI argument structure

BREAKING CHANGE: The --format flag has been replaced with --output-format"
```

### **No Release**
```bash
git commit -m "docs: update installation guide"
git commit -m "chore: update dependencies"
git commit -m "style: fix linting issues"
```

## 🔄 Release Workflow

1. **Developer pushes to main branch**
2. **CI Pipeline runs** (linting, testing, building)
3. **All CI jobs pass** ✅
4. **Semantic Release analyzes commits** since last release
5. **Determines version bump** based on commit messages
6. **Updates package.json** and CHANGELOG.md
7. **Creates GitHub release** with generated notes
8. **Publishes to NPM** automatically
9. **Commits version changes** back to repository

## 🛠️ Manual Release (Emergency)

If automated release fails, you can trigger manually:

```bash
# Option 1: Use existing release workflow
gh workflow run release.yml --field version=v1.4.7

# Option 2: Run semantic-release locally (requires tokens)
npx semantic-release --dry-run  # Preview what would happen
npx semantic-release            # Actually release
```

## 🔐 Required Secrets

The following GitHub Secrets must be configured:

- `NPM_TOKEN`: For publishing to npm registry
- `GITHUB_TOKEN`: Automatically provided by GitHub Actions

## 📋 Release Checklist

- ✅ **TypeScript compilation** passes
- ✅ **All tests** pass on all platforms
- ✅ **Linting** passes
- ✅ **Build** succeeds
- ✅ **Commit messages** follow conventional format
- ✅ **Main branch** is target (releases only from main)

## 🚨 Troubleshooting

### **No Release Created**
- Check commit messages follow conventional format
- Ensure push was to `main` branch
- Verify all CI jobs passed
- Check semantic-release logs in GitHub Actions

### **NPM Publish Failed**
- Verify `NPM_TOKEN` secret is valid
- Check package name isn't already taken
- Ensure semantic-release has publish permissions

### **GitHub Release Failed**
- Verify `GITHUB_TOKEN` has sufficient permissions
- Check repository settings allow GitHub Actions to create releases

## 📚 Additional Resources

- [Conventional Commits Specification](https://www.conventionalcommits.org/)
- [Semantic Release Documentation](https://semantic-release.gitbook.io/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)