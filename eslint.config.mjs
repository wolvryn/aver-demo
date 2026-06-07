import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({ baseDirectory: __dirname });

const eslintConfig = [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),

  // Project-wide: allow intentionally-unused args/vars when underscore-prefixed (stub seams).
  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
    },
  },

  // Centralized logging (CLAUDE.md / security skill): all logging goes through the centralized
  // logger; no direct console anywhere. Build-failing gate, not a convention. The single
  // permitted caller — src/lib/logger/** — is exempted by the override below.
  {
    rules: {
      'no-console': 'error',
    },
  },

  // IP boundary (CLAUDE.md invariant 1 / ADR-002): the pipeline is Aver-unaware.
  // Nothing under src/pipeline/** may import the Aver client or any Aver package.
  // This is a build-failing lint gate, not a convention.
  {
    files: ['src/pipeline/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '**/aver-client',
                '**/aver-client/**',
                '@/lib/aver-client',
                '@/lib/aver-client/**',
              ],
              message:
                'IP boundary (CLAUDE.md invariant 1 / ADR-002): the pipeline is Aver-unaware and must not import the Aver client. Aver is reached only via src/lib/aver-client, driven by the dual-pane UI.',
            },
            {
              group: ['aver', 'aver/**', '@aver/*', '@wolvryn/aver', '@wolvryn/aver/**'],
              message:
                'IP boundary (ADR-002): the pipeline must not import any Aver package. The pipeline may import only the public contract types (src/contract).',
            },
          ],
        },
      ],
    },
  },

  // The centralized logger is the sole module permitted to call console (it owns the seam).
  {
    files: ['src/lib/logger/**/*.{ts,tsx}'],
    rules: {
      'no-console': 'off',
    },
  },

  {
    ignores: ['.next/**', 'node_modules/**', 'coverage/**', 'next-env.d.ts'],
  },
];

export default eslintConfig;
