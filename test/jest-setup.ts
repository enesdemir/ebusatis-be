// UUID ESM module mock — Jest CommonJS ortaminda calissin
jest.mock('uuid', () => ({
  v4: () => 'test-uuid-' + Math.random().toString(36).substring(2, 10),
}));
