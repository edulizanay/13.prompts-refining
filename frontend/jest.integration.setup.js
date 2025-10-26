/**
 * Integration Test Setup
 *
 * Sets up environment for integration tests that connect to Supabase.
 */

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

// Set test timeout to 30 seconds for integration tests
jest.setTimeout(30000);

// Suppress console warnings during tests (optional)
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
};
