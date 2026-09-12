/**
 * @param {string} key
 * @returns {boolean}
 */
export function isRestartKey(key) {
  return key === 'Enter' || key === ' ';
}

/**
 * @param {string} status
 * @returns {boolean}
 */
export function canRestart(status) {
  return status === 'gameover' || status === 'win';
}
