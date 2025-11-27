// Vitest setup file

import '@testing-library/jest-dom';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock environment variables
Object.defineProperty(import.meta, 'env', {
  value: {
    VITE_START_DATE: '2025-10',
    VITE_END_DATE: '2026-12',
  },
  writable: true,
});

