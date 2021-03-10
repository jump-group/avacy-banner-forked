import { observer } from './scripts/element-observer/observer';
import { monkey } from './scripts/element-observer/monkey';
import { getSoiCookie } from './scripts/core/core_cookies';

if (window.CLIENT_SIDE_BLOCKING && window.CLIENT_SIDE_BLOCKING.active) {
    // Starts the monitoring
    observer.observe(document.documentElement, {
        childList: true,
        subtree: true
    });

    getSoiCookie().then(cookie => {
        monkey(cookie);
    })
  }

const cmpstub = require('didomi-iabtcf-stub');
cmpstub();