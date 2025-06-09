# Contributing to DataPilot

Thank you for your interest in contributing to DataPilot! This document provides guidelines for contributing to the project.

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for all contributors.

## How to Contribute

### Reporting Issues

1. Check existing issues to avoid duplicates
2. Use issue templates when available
3. Include:
   - Clear description of the problem
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment details (OS, Node.js version)
   - Sample CSV file (if applicable)

### Submitting Pull Requests

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Make your changes following our coding standards
4. Add/update tests for your changes
5. Ensure all tests pass: `npm test`
6. Update documentation if needed
7. Commit with descriptive messages
8. Push to your fork and submit a PR

### Development Setup

```bash
# Clone your fork
git clone https://github.com/your-username/datapilot.git
cd datapilot

# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test

# Link for local testing
npm link
```

### Coding Standards

- **TypeScript**: Use strict mode, avoid `any` types
- **Formatting**: Run `npm run lint:fix` before committing
- **Testing**: Maintain >90% coverage for new code
- **Documentation**: Update JSDoc comments and README
- **Performance**: Consider memory usage for large datasets

### Testing Guidelines

- Write unit tests for all new functions
- Include edge cases and error scenarios
- Test with various CSV formats
- Add integration tests for cross-module features
- Performance test with large datasets

### Commit Message Format

```
type(scope): brief description

Longer explanation if needed

Fixes #123
```

Types: feat, fix, docs, style, refactor, test, chore

### Areas for Contribution

- **New Analysis Features**: Statistical tests, ML algorithms
- **Performance**: Optimization for large datasets
- **Visualization**: New chart types and libraries
- **Documentation**: Tutorials, examples, translations
- **Platform Support**: Docker, cloud integrations
- **Bug Fixes**: See open issues

## Questions?

- Open a discussion on GitHub
- Check existing documentation
- Review closed issues for similar topics

Thank you for contributing to DataPilot! 🚁📊