# Contributing Blog Posts

## Creating a New Post

**Always use the generator:**
```bash
npm run new "Your Post Title"
```

## Frontmatter Rules

### ✅ CORRECT Date Format
```yaml
date: "2024-01-15T10:30:00.000Z"
```

### ❌ INCORRECT Date Formats
```yaml
date: 2024-01-15           # Unquoted (causes build failure!)
date:                      # Empty (causes build failure!)
date: null                 # Null (causes build failure!)
```

**IMPORTANT:** Dates MUST be quoted strings in ISO 8601 format.

## Validation

Before committing, always run:
```bash
npm run validate
```

To auto-fix issues:
```bash
npm run validate:fix
