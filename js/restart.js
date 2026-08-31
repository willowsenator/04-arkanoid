(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.Arkanoid = root.Arkanoid || {};
    root.Arkanoid.Restart = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  function isRestartKey(key) {
    return key === 'Enter' || key === ' ';
  }

  function canRestart(status) {
    return status === 'gameover' || status === 'win';
  }

  return { isRestartKey: isRestartKey, canRestart: canRestart };
});
