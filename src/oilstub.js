import { observer } from './scripts/element-observer/observer';
import { monkey } from './scripts/element-observer/monkey';

if (window.CLIENT_SIDE_BLOCKING && window.CLIENT_SIDE_BLOCKING.active) {
    // Starts the monitoring
    observer.observe(document.documentElement, {
        childList: true,
        subtree: true
    });
    // monkey();
  }

const cmpstub = require('didomi-iabtcf-stub');
cmpstub();