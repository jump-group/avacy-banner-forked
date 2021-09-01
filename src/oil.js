import './scripts/element-observer/observer';
// import './scripts/element-observer/monkey';
import './public_path.js'
import './polyfill.js';
import { initOilLayer } from './scripts/core/core_oil.js';
import { logInfo } from './scripts/core/core_log.js';

(function () {
  let configurationElement = document.querySelector('script[type="application/configuration"]#oil-configuration');

  if (configurationElement && configurationElement.dataset.remoteConfig) {
    fetch(`${configurationElement.dataset.remoteConfig}`)
    .then(body => body.json())
    .then(data => {
      logInfo('Get remote config', data);
      configurationElement.innerHTML = JSON.stringify(data);
      initOilLayer();
    })
  } else {
    initOilLayer();
  }
}());

