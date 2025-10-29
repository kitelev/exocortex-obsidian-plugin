# Security Policy

## Supported Versions

We actively maintain and provide security updates for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 0.x.x   | :white_check_mark: |

## Reporting a Vulnerability

We take the security of our plugin seriously. If you believe you have found a security vulnerability, please report it to us as described below.

### Where to Report

**Please do NOT report security vulnerabilities through public GitHub issues.**

Instead, please report them via:
- GitHub Security Advisories: [Report a vulnerability](https://github.com/kitelev/exocortex-obsidian-plugin/security/advisories/new)
- Or email the maintainer directly (see package.json for contact information)

### What to Include

Please include the following information in your report:
- Type of vulnerability (e.g., XSS, injection, authentication bypass)
- Full paths of affected source files
- Location of the affected code (tag/branch/commit or direct URL)
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the vulnerability
- How you discovered the vulnerability

### Response Timeline

- **Initial Response**: Within 48 hours
- **Status Update**: Within 7 days
- **Fix Timeline**: We aim to release security fixes within 30 days for critical vulnerabilities

### Security Update Process

1. We will investigate and validate the reported vulnerability
2. We will develop and test a fix
3. We will release a security patch
4. We will credit reporters (unless anonymity is requested)
5. We will publish a security advisory with details

## Security Best Practices for Users

### Installation Security
- Always verify the plugin source before installation
- Use the official Obsidian Community Plugins marketplace when available
- Review plugin permissions and data access

### Data Security
- The plugin stores data locally in your Obsidian vault
- No data is transmitted to external servers
- Ensure your vault is properly backed up
- Use encryption at rest if handling sensitive information

### Updates
- Keep the plugin updated to the latest version
- Review changelogs for security-related updates
- Subscribe to GitHub notifications for security advisories

## Security Features

### Automated Security Scanning
- **CodeQL**: Continuous code security scanning for vulnerabilities
- **npm audit**: Regular dependency vulnerability checks
- **Dependabot**: Automated dependency updates with security patches
- **Dependency Review**: PR-based dependency vulnerability detection

### Code Security Practices
- No use of `eval()` or unsafe dynamic code execution
- No `dangerouslySetInnerHTML` in React components
- Input validation and sanitization
- Secure data handling practices
- Type-safe TypeScript throughout the codebase

### CI/CD Security
- Automated security audits on every commit
- Dependency vulnerability scanning
- Code quality and security linting
- Comprehensive test coverage

## Dependencies

We maintain our dependencies with security in mind:
- Regular updates via Dependabot
- Automated vulnerability scanning
- Minimal dependency footprint
- Vetted and trusted packages only

## Disclosure Policy

When we receive a security bug report, we will:
1. Confirm the vulnerability and its scope
2. Develop and test a fix
3. Release the fix as quickly as possible
4. Publish a security advisory with appropriate details

We follow coordinated disclosure practices and ask security researchers to do the same.

## Security Tools Used

- **CodeQL**: Static analysis security testing
- **npm audit**: Dependency vulnerability scanning
- **Dependabot**: Automated dependency updates
- **ESLint**: Code quality and security linting
- **TypeScript**: Type safety and compile-time checks
- **Husky**: Pre-commit hooks for security checks

## Contact

For security concerns, please use:
- GitHub Security Advisories (preferred)
- Direct contact with maintainers (see package.json)

Thank you for helping keep Exocortex secure!
