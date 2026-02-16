(function () {
  'use strict';

  // Legacy shim: keep app.js for old bookmarks/caches, but run the canonical runtime.
  if (document.querySelector('script[data-tim-clicker-runtime="script-js"]')) return;

  var runtime = document.createElement('script');
  runtime.src = 'script.js?v=20260214i';
  runtime.dataset.timClickerRuntime = 'script-js';
  document.head.appendChild(runtime);
})();
