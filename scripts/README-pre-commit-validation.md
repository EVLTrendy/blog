# Pre-commit Validation for GitHub Desktop Users

Since you use GitHub Desktop instead of command line Git, here's a simple way to validate frontmatter before committing.

## Quick Setup

1. **Copy the validation script** to your desktop:
   ```
   C:\Users\xmarc\Desktop\validate-before-commit.bat
   ```

2. **Before committing in GitHub Desktop**:
   - Save all files
   - Double-click `validate-before-commit.bat`
   - Wait for validation to complete
   - If ✅ passes: Commit normally in GitHub Desktop
   - If ❌ fails: Fix issues, then run validation again

## What It Does

The validation script:
- ✅ **Checks all blog posts** for frontmatter issues
- ✅ **Auto-fixes** common problems (unquoted dates, etc.)
- ✅ **Shows clear errors** if manual fixes needed
- ✅ **Prevents commits** when validation fails

## Manual Alternative

If you prefer not to use the script:

1. **Before committing**: Run this in VS Code terminal
   ```bash
   npm run validate:fix
   ```

2. **Check the output**:
   - ✅ Green checkmarks = Ready to commit
   - ❌ Red X's = Need to fix issues

3. **Fix any errors** shown, then commit

## Why This Matters

Without validation, you might:
- ❌ Break Netlify builds with YAML errors
- ❌ Get confusing "column 59" error messages
- ❌ Have to troubleshoot build failures

With validation, you get:
- ✅ **Early error detection** before pushing
- ✅ **Auto-fixing** of common issues
- ✅ **Clear guidance** on how to fix problems
- ✅ **Bulletproof builds** that never fail due to YAML

## Troubleshooting

### "npm is not recognized"
- Open VS Code in the blog directory
- Use Terminal > New Terminal
- Run: `npm run validate:fix`

### Script says "Please run from blog root directory"
- Make sure you're running the script from:
  ```
  C:\Users\xmarc\OneDrive\Documents\GitHub\blog
  ```

### Validation passes but Netlify still fails
- Run: `npm run validate:yaml` for detailed debugging
- Check that dates are quoted: `"2025-12-07T20:03:48.097Z"`
- Ensure no special characters in field values

## Integration with GitHub Desktop

### Recommended Workflow
1. **Write/edit blog post** in VS Code
2. **Run validation**: Double-click `validate-before-commit.bat`
3. **If ✅ passes**: Use GitHub Desktop to commit
4. **If ❌ fails**: Fix issues, repeat validation
5. **Push**: GitHub Actions will validate again (with auto-fixes)

### Files to Watch
- `.frontmatter-template.md` - Use this for new posts
- `docs/CONTRIBUTING.md` - Full documentation
- `scripts/frontmatter-validator.js` - The validation engine

## Success Indicators

✅ **Script output ends with green checkmark**
✅ **No red X error messages**
✅ **GitHub Desktop commit succeeds**
✅ **GitHub Actions pass (green checkmark)**
✅ **Netlify builds successfully**

---

*This validation system ensures your blog builds never fail due to YAML frontmatter errors.*
*Last updated: 2025-10-20*
