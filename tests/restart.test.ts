import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as Restart from '../js/restart.js';

test('isRestartKey returns true for Enter', () => {
  assert.equal(Restart.isRestartKey('Enter'), true);
});

test('isRestartKey returns true for Space', () => {
  assert.equal(Restart.isRestartKey(' '), true);
});

test('isRestartKey returns false for other keys', () => {
  assert.equal(Restart.isRestartKey('ArrowLeft'), false);
  assert.equal(Restart.isRestartKey('a'), false);
});

test('canRestart returns true for gameover', () => {
  assert.equal(Restart.canRestart('gameover'), true);
});

test('canRestart returns true for win', () => {
  assert.equal(Restart.canRestart('win'), true);
});

test('canRestart returns false for playing and paddle-destroying', () => {
  assert.equal(Restart.canRestart('playing'), false);
  assert.equal(Restart.canRestart('paddle-destroying'), false);
});
