// CJS shim for the uuid package in Jest e2e tests.
// The uuid v13+ package ships as ESM only, which Jest's CommonJS
// runtime cannot import directly. This shim re-exports v4 using
// Node's built-in crypto.randomUUID().
'use strict';

const crypto = require('crypto');

module.exports = {
  v4: () => crypto.randomUUID(),
  // Stubs for other exports referenced by MikroORM/NestJS internals.
  NIL: '00000000-0000-0000-0000-000000000000',
  MAX: 'ffffffff-ffff-ffff-ffff-ffffffffffff',
  validate: (s) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s),
  version: (s) => parseInt(s.slice(14, 15), 16),
  parse: () => new Uint8Array(16),
  stringify: () => '00000000-0000-0000-0000-000000000000',
};
