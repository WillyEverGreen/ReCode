# Development Tools Setup

This project includes comprehensive development tooling to ensure code quality, catch bugs early, and maintain consistent code style.

## 🛠️ Tools Configured

### 1. ESLint
**Purpose**: Catch code issues and enforce coding standards

- Configuration: `.eslintrc.cjs`
- Plugins: TypeScript, React, React Hooks, Prettier
- Run manually: `npm run lint`
- Auto-fix issues: `npm run lint:fix`

### 2. TypeScript Type Checking
**Purpose**: Catch type errors before runtime

- Run: `npm run type-check`
- Configuration: `tsconfig.json`
- Runs on: Pre-commit, CI/CD pipeline

### 3. Prettier
**Purpose**: Automatic code formatting

- Configuration: `.prettierrc`
- Format all files: `npm run format`
- Check formatting: `npm run format:check`
- Runs on: Pre-commit, CI/CD pipeline

### 4. Zod Runtime Validation
**Purpose**: Validate data at runtime to catch schema mismatches

- Schema definitions: `utils/schemas.ts`
- Usage example:
```typescript
import { UserSchema, validateSchema } from './utils/schemas';

const result = validateSchema(UserSchema, userData);
if (result.success) {
  // Use validated data
  console.log(result.data);
} else {
  // Handle validation errors
  console.error(result.error);
}
```

### 5. Vitest Testing
**Purpose**: Unit and integration testing

- Configuration: `vitest.config.ts`
- Test files: `tests/*.test.ts(x)`
- Run tests: `npm test`
- Run tests once: `npm run test:run`
- Test UI: `npm run test:ui`

### 6. Husky + lint-staged
**Purpose**: Pre-commit hooks to ensure quality before committing

- Configuration: `.husky/pre-commit` and `lint-staged` in `package.json`
- Automatically runs on `git commit`:
  - ESLint fix on `.ts`, `.tsx`, `.js`, `.jsx` files
  - Prettier format on all staged files
  
### 7. GitHub Actions CI/CD
**Purpose**: Automated testing and deployment pipeline

- Configuration: `.github/workflows/ci.yml`
- Runs on: Push and Pull Requests
- Checks:
  - Type checking
  - Linting
  - Formatting
  - Tests
  - Build
  - Security audit

## 📋 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run type-check` | Run TypeScript type checking |
| `npm run lint` | Run ESLint (fail on warnings) |
| `npm run lint:fix` | Fix ESLint issues automatically |
| `npm run format` | Format all files with Prettier |
| `npm run format:check` | Check if files are formatted |
| `npm test` | Run tests in watch mode |
| `npm run test:run` | Run tests once |
| `npm run test:ui` | Open Vitest UI |
| `npm run validate` | Run all checks (type-check + lint + format + test) |

## 🚀 Workflow

### Before Committing
1. Write your code
2. Run tests: `npm test`
3. Commit your changes - hooks will auto-format and lint
4. If hooks fail, fix the issues and commit again

### Running All Checks
To run all quality checks at once:
```bash
npm run validate
```

This runs:
- Type checking
- Linting
- Format checking
- All tests

### CI/CD Pipeline
When you push code or create a PR:
1. ✅ Type checking runs
2. ✅ Linting runs
3. ✅ Format checking runs
4. ✅ All tests run
5. ✅ Build verification
6. ✅ Security audit

If any check fails, the pipeline fails and you'll be notified.

## 📝 Writing Tests

### Schema Validation Tests
```typescript
import { describe, it, expect } from 'vitest';
import { validateSchema, UserSchema } from '../utils/schemas';

describe('User validation', () => {
  it('should validate correct user', () => {
    const result = validateSchema(UserSchema, {
      _id: '123',
      email: 'test@example.com',
      plan: 'free',
      isPro: false,
    });
    expect(result.success).toBe(true);
  });
});
```

### Component Tests
```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import MyComponent from '../components/MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

## 🐛 Debugging Issues

### ESLint Errors
- Check `.eslintrc.cjs` for rules
- Run `npm run lint:fix` to auto-fix
- Disable specific rules with `// eslint-disable-next-line rule-name`

### Type Errors
- Run `npm run type-check` to see all errors
- Check `tsconfig.json` for compiler options
- Use `@ts-expect-error` for known issues (with comment)

### Prettier Conflicts
- Prettier overrides ESLint formatting rules
- Run `npm run format` to fix
- Configure `.prettierrc` if needed

### Test Failures
- Run `npm test` for watch mode
- Check `tests/setup.ts` for global test config
- Use `npm run test:ui` for visual debugging

## 🔧 Configuration Files

| File | Purpose |
|------|---------|
| `.eslintrc.cjs` | ESLint configuration |
| `.prettierrc` | Prettier formatting rules |
| `.prettierignore` | Files to ignore for formatting |
| `vitest.config.ts` | Vitest test configuration |
| `tsconfig.json` | TypeScript compiler options |
| `.husky/pre-commit` | Pre-commit hook script |
| `.github/workflows/ci.yml` | GitHub Actions CI/CD pipeline |
| `utils/schemas.ts` | Zod schema definitions |

## 📚 Best Practices

1. **Always validate external data** with Zod schemas
2. **Write tests for critical functionality**
3. **Run `npm run validate` before pushing**
4. **Fix linting errors immediately** - don't accumulate tech debt
5. **Keep tests simple and focused**
6. **Use type-safe code** - avoid `any` when possible
7. **Format code before committing** (done automatically)

## 🎯 Next Steps

1. Add more Zod schemas for API responses
2. Increase test coverage
3. Add E2E tests with Playwright/Cypress
4. Configure deployment in CI/CD pipeline
5. Add code coverage reporting
6. Set up visual regression testing

---

**Note**: All these tools run automatically on commit and push, ensuring code quality at every stage!
