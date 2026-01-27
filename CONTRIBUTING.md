# Contributing to Automatic Translator

Thank you for your interest in contributing to Automatic Translator! This document provides guidelines for contributing to the project.

## How to Contribute

### Reporting Issues

If you find a bug or have a feature request:

1. Check if the issue already exists in the [Issues](../../issues) section
2. If not, create a new issue with:
   - Clear title and description
   - Steps to reproduce (for bugs)
   - Expected vs actual behavior
   - Your environment details (Node version, OS, etc.)

### Submitting Pull Requests

1. **Fork the repository**
   - Click the "Fork" button at the top right of the repository page
   - Clone your fork locally:
     ```bash
     git clone https://github.com/YOUR_USERNAME/automatic-translator.git
     cd automatic-translator
     ```

2. **Create a branch**
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bug-fix
   ```

3. **Make your changes**
   - Write clear, commented code
   - Follow the existing code style
   - Add tests if applicable
   - Update documentation if needed

4. **Test your changes**
   ```bash
   npm install
   npm run build
   # Test the functionality manually or with tests
   ```

5. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add new feature" # or "fix: fix bug"
   ```
   
   Use conventional commit messages:
   - `feat:` for new features
   - `fix:` for bug fixes
   - `docs:` for documentation changes
   - `refactor:` for code refactoring
   - `test:` for adding tests
   - `chore:` for maintenance tasks

6. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

7. **Create a Pull Request**
   - Go to the original repository on GitHub
   - Click "New Pull Request"
   - Select your fork and branch
   - Provide a clear description of your changes
   - Link any related issues

### Adding New Translation Providers

If you want to add a new translation provider:

1. Create a new file in `src/providers/your-provider.ts`
2. Implement the `AIProvider` interface:
   ```typescript
   export class YourProvider implements AIProvider {
     public name = 'YourProvider';
     private available = true;

     isAvailable(): boolean {
       return this.available;
     }

     async translate(text: string, options: TranslationOptions): Promise<string> {
       // Implementation
     }
   }
   ```
3. Export it from `src/index.ts`
4. Add it to the default providers in `src/translator.ts` (if it's free) or document how to use it
5. Update documentation in `README.md` and `API.md`
6. Test thoroughly

### Code Style

- Use TypeScript
- Follow existing naming conventions
- Add JSDoc comments for public methods
- Use meaningful variable and function names
- Keep functions focused and small

### Testing

- Test your changes manually
- Ensure no TypeScript errors: `npm run build`
- Test API endpoints if you modified server code
- Test with different language pairs

## Development Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/automatic-translator.git
cd automatic-translator

# Install dependencies
npm install

# Build the project
npm run build

# Run the API server (optional)
npm start
```

## Questions?

Feel free to open an issue for any questions about contributing!

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on what is best for the community
- Show empathy towards other community members

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
