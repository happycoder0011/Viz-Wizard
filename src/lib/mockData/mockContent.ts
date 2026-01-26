/**
 * Mock File Content Generator
 * Generates realistic code content for different file types
 */

import { FileCategory, FileExtension } from '@/types/repository';

// React Component Template
function generateComponentContent(name: string): string {
  const hookName = `use${name}`;
  return `'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';

interface ${name}Props {
  className?: string;
  children?: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}

export function ${name}({ className, children, onClick, disabled }: ${name}Props) {
  const [isHovered, setIsHovered] = useState(false);
  const [isActive, setIsActive] = useState(false);

  const handleClick = useCallback(() => {
    if (disabled) return;
    setIsActive(true);
    onClick?.();
    setTimeout(() => setIsActive(false), 150);
  }, [disabled, onClick]);

  return (
    <motion.div
      className={\`relative \${className}\`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
      animate={{
        scale: isActive ? 0.98 : 1,
        opacity: disabled ? 0.5 : 1,
      }}
      transition={{ duration: 0.15 }}
    >
      {children}
      {isHovered && !disabled && (
        <motion.div
          className="absolute inset-0 bg-white/5 rounded pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />
      )}
    </motion.div>
  );
}

export default ${name};
`;
}

// Custom Hook Template
function generateHookContent(name: string): string {
  const stateName = name.replace(/^use/, '').toLowerCase();
  return `'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface ${name}Options {
  initialValue?: any;
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}

interface ${name}Result {
  data: any;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  reset: () => void;
}

export function ${name}(options: ${name}Options = {}): ${name}Result {
  const { initialValue = null, onSuccess, onError } = options;

  const [data, setData] = useState<any>(initialValue);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Simulated API call
      const response = await fetch('/api/${stateName}');
      if (!response.ok) {
        throw new Error('Failed to fetch ${stateName}');
      }

      const result = await response.json();

      if (mountedRef.current) {
        setData(result);
        onSuccess?.(result);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      if (mountedRef.current) {
        setError(error);
        onError?.(error);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [onSuccess, onError]);

  const reset = useCallback(() => {
    setData(initialValue);
    setError(null);
    setLoading(false);
  }, [initialValue]);

  useEffect(() => {
    fetchData();
  }, []);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    reset,
  };
}

export default ${name};
`;
}

// Service Class Template
function generateServiceContent(name: string): string {
  const baseName = name.replace(/Service$/, '').toLowerCase();
  return `/**
 * ${name}
 * Handles ${baseName}-related API operations
 */

import { ApiError, handleApiError } from './errorHandler';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api';

export interface ${name.replace(/Service$/, '')}Data {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  [key: string]: any;
}

export interface ${name.replace(/Service$/, '')}CreateInput {
  [key: string]: any;
}

export interface ${name.replace(/Service$/, '')}UpdateInput {
  [key: string]: any;
}

class ${name}Impl {
  private baseUrl: string;

  constructor() {
    this.baseUrl = \`\${API_BASE}/${baseName}\`;
  }

  async getAll(): Promise<${name.replace(/Service$/, '')}Data[]> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new ApiError('Failed to fetch ${baseName}s', response.status);
      }

      return response.json();
    } catch (error) {
      throw handleApiError(error);
    }
  }

  async getById(id: string): Promise<${name.replace(/Service$/, '')}Data> {
    try {
      const response = await fetch(\`\${this.baseUrl}/\${id}\`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new ApiError('${baseName} not found', response.status);
      }

      return response.json();
    } catch (error) {
      throw handleApiError(error);
    }
  }

  async create(data: ${name.replace(/Service$/, '')}CreateInput): Promise<${name.replace(/Service$/, '')}Data> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new ApiError('Failed to create ${baseName}', response.status);
      }

      return response.json();
    } catch (error) {
      throw handleApiError(error);
    }
  }

  async update(id: string, data: ${name.replace(/Service$/, '')}UpdateInput): Promise<${name.replace(/Service$/, '')}Data> {
    try {
      const response = await fetch(\`\${this.baseUrl}/\${id}\`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new ApiError('Failed to update ${baseName}', response.status);
      }

      return response.json();
    } catch (error) {
      throw handleApiError(error);
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const response = await fetch(\`\${this.baseUrl}/\${id}\`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new ApiError('Failed to delete ${baseName}', response.status);
      }
    } catch (error) {
      throw handleApiError(error);
    }
  }
}

export const ${name} = new ${name}Impl();
export default ${name};
`;
}

// Utility Function Template
function generateUtilContent(name: string): string {
  return `/**
 * ${name} utilities
 * Helper functions for common ${name.toLowerCase()} operations
 */

/**
 * Format a value for display
 */
export function format${name}(value: any): string {
  if (value === null || value === undefined) {
    return '';
  }
  return String(value);
}

/**
 * Validate a value
 */
export function validate${name}(value: any): boolean {
  if (!value) return false;
  // Add validation logic here
  return true;
}

/**
 * Parse a string value
 */
export function parse${name}(input: string): any {
  try {
    return JSON.parse(input);
  } catch {
    return input;
  }
}

/**
 * Compare two values
 */
export function compare${name}(a: any, b: any): number {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

/**
 * Deep clone a value
 */
export function clone${name}<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

/**
 * Debounce a function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle a function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}
`;
}

// Test File Template
function generateTestContent(name: string): string {
  const componentName = name.replace(/\.test$/, '');
  return `import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ${componentName} } from '../${componentName}';

describe('${componentName}', () => {
  it('renders without crashing', () => {
    render(<${componentName} />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('handles click events', async () => {
    const handleClick = jest.fn();
    render(<${componentName} onClick={handleClick} />);

    await userEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('respects disabled state', async () => {
    const handleClick = jest.fn();
    render(<${componentName} onClick={handleClick} disabled />);

    await userEvent.click(screen.getByRole('button'));
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('applies custom className', () => {
    render(<${componentName} className="custom-class" />);
    expect(screen.getByRole('button')).toHaveClass('custom-class');
  });

  it('renders children correctly', () => {
    render(<${componentName}>Test Content</${componentName}>);
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  describe('accessibility', () => {
    it('has correct ARIA attributes', () => {
      render(<${componentName} disabled />);
      expect(screen.getByRole('button')).toHaveAttribute('aria-disabled', 'true');
    });

    it('is keyboard accessible', async () => {
      const handleClick = jest.fn();
      render(<${componentName} onClick={handleClick} />);

      screen.getByRole('button').focus();
      await userEvent.keyboard('{Enter}');
      expect(handleClick).toHaveBeenCalled();
    });
  });
});
`;
}

// CSS Stylesheet Template
function generateStyleContent(name: string): string {
  return `/**
 * ${name} Styles
 * Component-specific styling with CSS custom properties
 */

/* Base styles */
.${name.toLowerCase()}-container {
  --${name.toLowerCase()}-padding: 1rem;
  --${name.toLowerCase()}-radius: 0.5rem;
  --${name.toLowerCase()}-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);

  position: relative;
  padding: var(--${name.toLowerCase()}-padding);
  border-radius: var(--${name.toLowerCase()}-radius);
  box-shadow: var(--${name.toLowerCase()}-shadow);
}

/* State variants */
.${name.toLowerCase()}-container:hover {
  --${name.toLowerCase()}-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
}

.${name.toLowerCase()}-container:focus-within {
  outline: 2px solid var(--primary-color, #3b82f6);
  outline-offset: 2px;
}

.${name.toLowerCase()}-container.disabled {
  opacity: 0.5;
  pointer-events: none;
}

/* Animation */
@keyframes ${name.toLowerCase()}-fade-in {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.${name.toLowerCase()}-animated {
  animation: ${name.toLowerCase()}-fade-in 0.2s ease-out;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .${name.toLowerCase()}-container {
    --${name.toLowerCase()}-padding: 0.75rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .${name.toLowerCase()}-animated {
    animation: none;
  }
}
`;
}

// JSON Config Template
function generateConfigContent(name: string): string {
  return `{
  "name": "${name}",
  "version": "1.0.0",
  "description": "Configuration for ${name}",
  "settings": {
    "enabled": true,
    "debug": false,
    "maxRetries": 3,
    "timeout": 5000
  },
  "features": {
    "feature1": true,
    "feature2": false,
    "feature3": true
  },
  "endpoints": {
    "api": "/api/v1",
    "auth": "/auth",
    "webhooks": "/webhooks"
  },
  "logging": {
    "level": "info",
    "format": "json",
    "destinations": ["console", "file"]
  }
}
`;
}

// Markdown Documentation Template
function generateDocsContent(name: string): string {
  return `# ${name}

## Overview

This module provides functionality for ${name.toLowerCase()}-related operations.

## Installation

\`\`\`bash
npm install ${name.toLowerCase()}
\`\`\`

## Usage

\`\`\`typescript
import { ${name} } from '@/lib/${name.toLowerCase()}';

// Basic usage
const result = await ${name}.process(data);
\`\`\`

## API Reference

### \`${name}.process(data)\`

Processes the input data and returns the result.

**Parameters:**
- \`data\` (object): The input data to process

**Returns:**
- \`Promise<Result>\`: The processed result

### \`${name}.validate(input)\`

Validates the input against the schema.

**Parameters:**
- \`input\` (any): The value to validate

**Returns:**
- \`boolean\`: Whether the input is valid

## Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| \`enabled\` | boolean | \`true\` | Enable the feature |
| \`timeout\` | number | \`5000\` | Request timeout in ms |
| \`retries\` | number | \`3\` | Number of retry attempts |

## Examples

### Basic Example

\`\`\`typescript
const { ${name} } = require('./${name.toLowerCase()}');

async function main() {
  const result = await ${name}.process({
    input: 'example',
  });
  console.log(result);
}
\`\`\`

## License

MIT
`;
}

// Page Component Template
function generatePageContent(name: string): string {
  return `'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Header } from '@/components/ui/Header';
import { Footer } from '@/components/ui/Footer';

export default function ${name}Page() {
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    // Simulate data loading
    const loadData = async () => {
      try {
        // const response = await fetch('/api/${name.toLowerCase()}');
        // const result = await response.json();
        // setData(result);
        setData({ title: '${name}' });
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold mb-6">{data?.title || '${name}'}</h1>

          <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Page content goes here */}
            <div className="p-6 rounded-lg bg-white shadow-sm">
              <h2 className="text-xl font-semibold mb-2">Section 1</h2>
              <p className="text-gray-600">
                Content for the ${name} page.
              </p>
            </div>
          </section>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
`;
}

/**
 * Generate mock content based on file properties
 */
export function generateMockContent(
  name: string,
  extension: FileExtension,
  category: FileCategory
): string {
  // Extract base name without extension
  const baseName = name.replace(/\.(test|spec)?\.(ts|tsx|js|jsx|css|scss|json|md|yaml|html)$/, '');

  // Generate content based on file type
  if (name.includes('.test.') || name.includes('.spec.')) {
    return generateTestContent(baseName);
  }

  switch (category) {
    case 'core':
      if (name.includes('use')) {
        return generateHookContent(baseName);
      }
      if (name.includes('Service')) {
        return generateServiceContent(baseName);
      }
      if (name.includes('Page') || extension === 'tsx') {
        if (baseName.match(/^[A-Z]/)) {
          // Capitalized = component
          return generateComponentContent(baseName);
        }
        return generatePageContent(baseName);
      }
      return generateUtilContent(baseName);

    case 'legacy':
      return generateComponentContent(baseName);

    case 'style':
      return generateStyleContent(baseName);

    case 'test':
      return generateTestContent(baseName);

    case 'config':
      return generateConfigContent(baseName);

    case 'docs':
      return generateDocsContent(baseName);

    default:
      return generateUtilContent(baseName);
  }
}

/**
 * Get the Monaco language identifier for syntax highlighting
 */
export function getLanguageFromExtension(extension: FileExtension): string {
  const map: Record<string, string> = {
    'ts': 'typescript',
    'tsx': 'typescript',
    'js': 'javascript',
    'jsx': 'javascript',
    'css': 'css',
    'scss': 'scss',
    'json': 'json',
    'md': 'markdown',
    'yaml': 'yaml',
    'html': 'html',
    'test.ts': 'typescript',
    'test.tsx': 'typescript',
    'spec.ts': 'typescript',
  };
  return map[extension] || 'plaintext';
}
