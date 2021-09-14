import './scripts/element-observer/observer';
// import './scripts/element-observer/monkey';
import './public_path.js'
import './polyfill.js';
import { initOilLayer, getQueryStringParam } from './scripts/core/core_oil.js';
import { logInfo } from './scripts/core/core_log.js';
import { mergeDeep } from './scripts/core/core_utils.js';

(function () {
  let configurationElement = document.querySelector('script[type="application/configuration"]#oil-configuration');
  let queryStringRemoteConfig = getQueryStringParam('remoteConfig');
  if (configurationElement && (configurationElement.dataset.remoteConfig || queryStringRemoteConfig )) {
    let remoteUrl = queryStringRemoteConfig ? queryStringRemoteConfig : configurationElement.dataset.remoteConfig;
    fetch(`${remoteUrl}`)
    .then(body => body.json())
    .then(data => {
      let newInnerConfig;
      logInfo('Get remote config', data);
      let extendedConfig = configurationElement.textContent.trim() !== '' ? JSON.parse(configurationElement.innerText) : undefined;
      
      if (extendedConfig) {
        logInfo('Get extended config', extendedConfig);
        newInnerConfig = mergeDeep(data, extendedConfig)
      } else {
        newInnerConfig = data;
      }
      
      logInfo('Apply Config:', newInnerConfig);
      
      configurationElement.innerHTML = JSON.stringify(newInnerConfig);
      initOilLayer();
    })
  } else {
    initOilLayer();
  }
}());

