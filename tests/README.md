# Tests Directory

This directory contains tests for Team 4's Monitoring & Security implementation.

## Test Framework

- **Jest**: Test runner and assertion library
- **Supertest**: HTTP assertion library for testing Express endpoints

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Test Structure

### Current Tests

- `test-framework.test.js`: Validates Jest and supertest are working
- `health.test.js`: Placeholder for `/health` endpoint tests (ready for Coordinator)
- `metrics.test.js`: Placeholder for `/metrics` endpoint tests (ready for Iteration 5)

### Adding New Tests

When adding new tests:

1. Create test files in the `tests/` directory
2. Use the naming convention: `*.test.js`
3. Follow the existing test structure:
   ```javascript
   const request = require('supertest');
   
   describe('Feature Name', () => {
     test('should do something', async () => {
       // Test implementation
     });
   });
   ```

## Coordinator Service Integration

**Note**: The Coordinator service is not yet in the repository. Once it's added:

1. Update import paths in test files (e.g., `health.test.js`, `metrics.test.js`)
2. Uncomment the actual endpoint tests
3. Adjust test expectations based on actual Coordinator implementation

Expected Coordinator structure:
- Coordinator should export Express app from a module (e.g., `app.js` or `server.js`)
- Example import: `const app = require('../coordinator/app');`

## Test Coverage Goals

- **Iteration 0**: ✅ Test framework setup complete
- **Iteration 1**: Config and validation tests
- **Iteration 2**: JWT middleware tests
- **Iteration 3**: Route auth and validation tests
- **Iteration 4**: Logging and correlation ID tests
- **Iteration 5**: Metrics endpoint tests
- **Iteration 6-8**: Integration and end-to-end tests

