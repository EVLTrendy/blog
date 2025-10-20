@echo off
echo 🔍 Running frontmatter validation before commit...
echo.

REM Check if we're in the blog directory
if not exist "scripts\frontmatter-validator.js" (
    echo ❌ Error: Please run this from the blog root directory
    exit /b 1
)

REM Run validation with auto-fix
echo Running validation...
call npm run validate:fix

REM Check if validation passed
if %errorlevel% equ 0 (
    echo.
    echo ✅ Frontmatter validation passed!
    echo You can now commit your changes safely.
    exit /b 0
) else (
    echo.
    echo ❌ Frontmatter validation failed!
    echo Please fix the issues above before committing.
    echo.
    echo Common fixes:
    echo - Ensure dates are quoted: "2025-12-07T20:03:48.097Z"
    echo - Check for missing required fields
    echo - Verify YAML formatting
    echo.
    echo Run "npm run validate:fix" to auto-fix most issues.
    exit /b 1
)
