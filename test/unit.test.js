const test = require('node:test');
const assert = require('node:assert');

test('basic unit test - truthy check', () => {
  assert.strictEqual(1 + 1, 2);
});
