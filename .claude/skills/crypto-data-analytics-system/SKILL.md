```markdown
# crypto-data-analytics-system Development Patterns

> Auto-generated skill from repository analysis

## Overview
This skill teaches you the core development patterns and conventions used in the `crypto-data-analytics-system` Python codebase. You'll learn about file naming, import/export styles, commit patterns, and how to write and run tests. This guide also provides step-by-step workflows and suggested commands for common development tasks.

## Coding Conventions

### File Naming
- Use **snake_case** for all file names.
  - Example: `data_loader.py`, `price_analysis.py`

### Import Style
- Use **relative imports** within the package.
  - Example:
    ```python
    from .utils import calculate_moving_average
    ```

### Export Style
- Use **named exports** (explicitly define what is exported from a module).
  - Example:
    ```python
    __all__ = ['CryptoDataLoader', 'analyze_prices']
    ```

### Commit Patterns
- Commit messages are **freeform** (no enforced prefixes).
- Keep commit messages concise (average ~21 characters).
  - Example: `add price fetcher`

## Workflows

### Adding a New Data Analytics Module
**Trigger:** When you need to introduce a new analytics feature or module  
**Command:** `/add-module`

1. Create a new Python file using snake_case (e.g., `trend_detector.py`).
2. Implement your analytics logic.
3. Use relative imports to access shared utilities or data loaders.
4. Define named exports with `__all__`.
5. Write corresponding tests in a `*.test.*` file.
6. Commit your changes with a concise message.

### Running Tests
**Trigger:** When you want to verify code correctness  
**Command:** `/run-tests`

1. Identify all test files matching the `*.test.*` pattern.
2. Use your preferred Python test runner (e.g., `pytest` or `unittest`) to execute tests.
   - Example:
     ```bash
     pytest
     ```
3. Review test output and fix any failures.

### Refactoring or Updating Imports
**Trigger:** When reorganizing code or updating module structure  
**Command:** `/update-imports`

1. Update import statements to use relative imports.
   - Example:
     ```python
     from .data_loader import load_data
     ```
2. Ensure all modules use named exports.
3. Run tests to confirm everything works.

## Testing Patterns

- Test files follow the `*.test.*` naming convention (e.g., `data_loader.test.py`).
- Testing framework is not explicitly defined; use standard Python testing tools like `pytest` or `unittest`.
- Place tests alongside or near the modules they cover.
- Example test file structure:
  ```python
  import unittest
  from .data_loader import load_data

  class TestDataLoader(unittest.TestCase):
      def test_load_data(self):
          data = load_data('BTC')
          self.assertIsNotNone(data)
  ```

## Commands

| Command        | Purpose                                        |
|----------------|------------------------------------------------|
| /add-module    | Scaffold and add a new analytics module        |
| /run-tests     | Run all test files in the codebase             |
| /update-imports| Refactor imports to use relative style         |
```