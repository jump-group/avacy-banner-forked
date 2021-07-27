import { observer } from './scripts/element-observer/observer';
import { monkey } from './scripts/element-observer/monkey';
import { getSoiCookie } from './scripts/core/core_cookies';

if (window.CLIENT_SIDE_BLOCKING && window.CLIENT_SIDE_BLOCKING.active) {
    // Starts the monitoring
    window.CLIENT_SIDE_BLOCKING.observer = observer;
    observer.observe(document.documentElement, {
        childList: true,
        subtree: true
    });

    getSoiCookie().then(cookie => {
        console.log('oilstub_cookie', cookie)
        monkey(cookie);
    })
  }

const cmpstub = require('didomi-iabtcf-stub');
cmpstub();