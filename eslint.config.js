// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config')
const expoConfig = require('eslint-config-expo/flat')
const prettier = require('eslint-config-prettier')

module.exports = defineConfig([
  expoConfig,
  prettier,
  {
    ignores: ['dist/*', '.expo/*', 'coverage/*', 'node_modules/*', 'supabase/**', 'scripts/**', 'docs/**', 'assets/**', '*.config.js', 'babel.config.js',
      "dist/**", "dist-web/**", "coverage/**", "web-build/**",],
  },
  {
    // Arquitetura (Fase 0/1): domain não conhece React/React Native/Supabase.
    files: ['src/domain/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            { group: ['react', 'react-native', '@supabase/*', 'expo*', 'react-native-*'], message: 'domain/ deve permanecer puro (sem UI/redes).' },
          ],
        },
      ],
    },
  },
  {
    // Tokens: proibida cor literal fora de src/theme (baseline do repo).
    files: ['src/components/**/*.tsx', 'src/features/**/*.tsx', 'src/app/**/*.tsx', 'src/services/**/*.ts'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: "Literal[value=/^#([0-9a-fA-F]{3,8})$/]",
          message: 'Cores hardcoded fora de src/theme/ — use theme.colors.* (docs/THEME_SYSTEM.md).',
        },
      ],
    },
  },
])
