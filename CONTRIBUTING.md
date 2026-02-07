# Contributing to ColoringBook.AI

Thank you for your interest in contributing to ColoringBook.AI! This document provides guidelines and instructions for contributing to the project.

## 🌟 Getting Started

1. **Fork the repository** to your GitHub account
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/coloring-book.git
   cd coloring-book
   ```
3. **Install dependencies**:
   ```bash
   npm install
   ```
4. **Set up your environment** following the instructions in [README.md](README.md)

## 🔧 Development Workflow

### Creating a Branch

Create a feature branch from `main`:
```bash
git checkout -b feature/your-feature-name
```

Use descriptive branch names:
- `feature/` for new features
- `fix/` for bug fixes
- `docs/` for documentation changes
- `refactor/` for code refactoring

### Making Changes

1. **Follow the coding conventions** outlined in [AGENTS.md](AGENTS.md)
2. **Write meaningful commit messages**:
   ```
   Add feature to generate custom coloring prompts

   - Implement prompt customization UI
   - Add API endpoint for custom prompt processing
   - Update tests for new functionality
   ```
3. **Keep commits focused** - one logical change per commit
4. **Test your changes** thoroughly before submitting

### Code Style

- **TypeScript**: Use strict mode, avoid `any` types
- **React**: Prefer functional components and hooks
- **Formatting**: Run `npm run lint` before committing
- **Tailwind CSS**: Use utility classes consistently
- **Comments**: Add comments for complex logic, not obvious code

### Running Tests

```bash
# Run linter
npm run lint

# Run end-to-end tests
npm run test:e2e

# Build the project
npm run build
```

Ensure all tests pass before submitting a pull request.

## 📝 Pull Request Process

### Before Submitting

1. ✅ Update your branch with the latest from `main`
2. ✅ Run `npm run lint` and fix any issues
3. ✅ Test your changes locally
4. ✅ Update documentation if needed
5. ✅ Add or update tests for new features

### Submitting Your PR

1. **Push your branch** to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```

2. **Create a Pull Request** on GitHub with:
   - **Clear title**: Summarize your changes
   - **Description**: Explain what and why
   - **Screenshots**: For UI changes
   - **Testing**: Describe how you tested
   - **Related Issues**: Link to relevant issues

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
How did you test these changes?

## Screenshots (if applicable)
Add screenshots for UI changes

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-reviewed my code
- [ ] Commented complex code sections
- [ ] Updated documentation
- [ ] No new warnings generated
- [ ] Added tests that prove fix/feature works
- [ ] All tests pass locally
```

### Review Process

- Maintainers will review your PR within a few days
- Address any requested changes
- Once approved, a maintainer will merge your PR

## 🐛 Reporting Bugs

Found a bug? Help us fix it:

1. **Check existing issues** first to avoid duplicates
2. **Create a new issue** with:
   - Clear, descriptive title
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots if applicable
   - Environment details (OS, browser, Node version)

## 💡 Feature Requests

Have an idea for a new feature?

1. **Check existing issues** for similar requests
2. **Create a feature request** explaining:
   - The problem you're trying to solve
   - Your proposed solution
   - Alternative solutions considered
   - Why this would benefit other users

## 🎨 Code Review Guidelines

When reviewing code:

- Be respectful and constructive
- Focus on code, not the author
- Explain the "why" behind suggestions
- Approve when satisfied, even if you'd do it differently
- Ask questions if something is unclear

## 📚 Development Resources

### Key Files to Understand

- `src/app/` - Next.js App Router pages and API routes
- `src/components/` - React components
- `src/lib/` - Utility functions and integrations
- `src/contexts/` - React Context providers
- `AGENTS.md` - AI agent development guidelines

### Helpful Documentation

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Supabase Docs](https://supabase.com/docs)
- [OpenAI API](https://platform.openai.com/docs)

## 🤖 Working with AI Tools

This project showcases best practices for:

- **GitHub Copilot**: See `.github/copilot-instructions.md` for project-specific instructions
- **VS Code**: Recommended extensions in `.vscode/extensions.json`
- **MCP Servers**: Configuration in `.vscode/mcp.json`

## ❓ Questions?

- Open a [GitHub Discussion](https://github.com/pierceboggan/coloring-book/discussions)
- Check existing documentation
- Review closed issues for similar questions

## 📜 License

By contributing, you agree that your contributions will be licensed under the MIT License.

## 🙏 Thank You!

Your contributions make this project better for everyone. We appreciate your time and effort!
