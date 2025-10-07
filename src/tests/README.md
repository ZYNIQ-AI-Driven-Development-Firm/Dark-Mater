# Test Suite Documentation

This directory contains comprehensive tests for the MCP-Ollama integration system.

## Test Files

### 1. `mcpServerClient.test.ts`
Unit tests for the MCP Server Client module covering:
- Client creation and authentication
- Configuration fetching with ETag caching
- Knowledge base search functionality
- Memory retrieval and storage
- Context fetching
- Document management (upload, list, delete)
- Error handling and edge cases
- Client registry functionality

### 2. `mcpChatE2E.test.ts`
End-to-end tests for the complete MCP chat pipeline:
- Full chat flow integration (7-step process)
- Error scenario testing
- Performance measurements
- Mock implementations for testing without dependencies

## Running Tests

### Manual Testing (Current Setup)
Since testing frameworks are not installed, you can run manual tests:

```javascript
// In browser console or Node.js REPL
import { runMcpClientTests } from './src/tests/mcpServerClient.test.js';
import { runMcpChatE2ETests } from './src/tests/mcpChatE2E.test.js';

// Run unit tests
const unitResults = await runMcpClientTests();

// Run E2E tests
const e2eResults = await runMcpChatE2ETests('http://localhost:8080', 'your-auth-token');
```

### Full Test Setup (Recommended)
To set up proper testing framework:

```bash
# Install testing dependencies
npm install -D vitest @vitest/ui jsdom

# Add to package.json scripts:
# "test": "vitest",
# "test:ui": "vitest --ui",
# "test:run": "vitest run"

# Run tests
npm test
```

## Test Coverage

### MCP Server Client (Unit Tests)
- ✅ Client instantiation with/without auth tokens
- ✅ Configuration caching with ETag support
- ✅ Knowledge search with various parameters
- ✅ Memory operations (get/append)
- ✅ Context retrieval
- ✅ Document management operations
- ✅ Error handling for network failures
- ✅ Authentication token management
- ✅ Client registry caching and updates

### MCP Chat Pipeline (E2E Tests)
- ✅ Complete 7-step chat flow
- ✅ LLM configuration fetching
- ✅ Knowledge base integration
- ✅ Memory conversation context
- ✅ Server context injection
- ✅ Message building for Ollama
- ✅ Ollama API integration
- ✅ Response memory storage
- ✅ Error scenario handling
- ✅ Performance measurements

## Mock Data

Tests use comprehensive mock data that simulates real MCP server responses:

### LLM Configuration
```json
{
  "system_prompt": "You are a helpful AI assistant...",
  "tools_allowed": ["web_search", "weather_api"],
  "runtime_hints": {
    "preferred_model": "phi3:mini",
    "temperature": 0.7,
    "num_ctx": 4096,
    "keep_alive": 0
  }
}
```

### Knowledge Search Results
```json
{
  "chunks": [
    {
      "id": "chunk1",
      "content": "Relevant knowledge content...",
      "source": "document.md",
      "score": 0.95
    }
  ],
  "total": 1,
  "query": "user query"
}
```

### Memory Context
```json
{
  "messages": [
    {
      "id": "msg1",
      "role": "user",
      "content": "Previous message",
      "timestamp": "2024-01-01T00:00:00Z"
    }
  ],
  "total": 1,
  "hasMore": false
}
```

## Performance Benchmarks

The E2E test suite includes performance measurements:
- Chat flow latency (target: <200ms)
- Memory operations (target: <50ms)
- Knowledge search (target: <100ms)
- Configuration caching effectiveness

## Error Scenarios Tested

1. **Network Connectivity**
   - MCP server unreachable
   - Timeout conditions
   - Intermittent connectivity

2. **Authentication**
   - Invalid JWT tokens
   - Expired credentials
   - Permission denied scenarios

3. **API Errors**
   - Ollama model not found
   - Malformed responses
   - Rate limiting

4. **Data Validation**
   - Empty knowledge base
   - Corrupted memory data
   - Invalid configuration

## CI/CD Integration

Tests are designed to be easily integrated into CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
test:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v3
    - uses: actions/setup-node@v3
      with:
        node-version: '18'
    - run: npm ci
    - run: npm test
    - run: npm run test:coverage
```

## Test Data Management

Test data is isolated and doesn't affect production:
- Mock MCP server responses
- Simulated Ollama API calls
- Temporary test databases
- Isolated authentication tokens

## Debugging Tests

For debugging test failures:

1. Enable verbose logging:
```javascript
// Set environment variable
process.env.TEST_VERBOSE = 'true';
```

2. Run individual test suites:
```javascript
// Test specific functionality
const results = await testSuite.testBasicFunctionality();
```

3. Check network connectivity:
```javascript
// Test MCP server connection
const healthCheck = await mcpClient.testConnection();
```

## Contributing

When adding new features, please:
1. Add corresponding unit tests
2. Update E2E tests if pipeline changes
3. Update mock data as needed
4. Document new test scenarios
5. Maintain test coverage above 80%