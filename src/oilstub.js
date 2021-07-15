import { observer } from './scripts/element-observer/observer';

if (window.CLIENT_SIDE_BLOCKING && window.CLIENT_SIDE_BLOCKING.active) {
    // Starts the monitoring
    window.CLIENT_SIDE_BLOCKING.observer = observer;
    observer.observe(document.documentElement, {
        childList: true,
        subtree: true
    });
}

const cmpstub = require('didomi-iabtcf-stub');
cmpstub();