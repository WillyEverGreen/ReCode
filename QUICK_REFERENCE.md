# 🚀 Quick Reference - Development Tools

## ⚡ Essential Commands

| Command | What It Does | When to Use |
|---------|-------------|-------------|
| `npm test` | Run tests in watch mode | During development |
| `npm run validate` | Run ALL checks at once | Before pushing |
| `npm run lint:fix` | Auto-fix linting issues | When you have lint errors |
| `npm run format` | Format all code | To clean up formatting |
| `npm run type-check` | Check TypeScript types | To find type errors |

## 🔄 Your Workflow

```
1. Write code
   ↓
2. npm test (write/run tests)
   ↓
3. git add .
   ↓
4. git commit -m "message"
   ↓ (hooks run automatically)
5. git push
   ↓ (CI/CD runs on GitHub)
6. ✅ Done!
```

## 🛡️ What Runs When

### On `git commit` (automatic):
- ✅ ESLint fix on changed files
- ✅ Prettier format on changed files

### On `git push` (GitHub Actions):
- ✅ Type checking
- ✅ Linting (strict)
- ✅ Format checking
- ✅ All tests
- ✅ Build verification
- ✅ Security audit

## 📦 Using Zod Validation

```typescript
import { UserSchema, validateSchema } from './utils/schemas';

// Validate API response
const result = validateSchema(UserSchema, apiData);

if (result.success) {
  // Type-safe data
  console.log(result.data.email);
} else {
  // Handle errors
  console.error(result.error);
}
```

## 🧪 Writing Tests

```typescript
import { describe, it, expect } from 'vitest';

describe('My Feature', () => {
  it('should work correctly', () => {
    expect(1 + 1).toBe(2);
  });
});
```

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| Lint errors blocking commit | Run `npm run lint:fix` |
| Type errors | Run `npm run type-check` to see all |
| Tests failing | Run `npm test` and fix the tests |
| Format issues | Run `npm run format` |
| CI/CD failing | Run `npm run validate` locally |

## 📁 Key Files

- `.eslintrc.cjs` - ESLint rules
- `.prettierrc` - Prettier config
- `utils/schemas.ts` - Zod schemas
- `tests/` - Test files
- `.github/workflows/ci.yml` - CI/CD pipeline

---

**Keep this file handy for quick reference!** 📌
