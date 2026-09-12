export function isRestartKey(key) {
  return key === 'Enter' || key === ' ';
}

export function canRestart(status) {
  return status === 'gameover' || status === 'win';
}
