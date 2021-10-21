import { observer } from './scripts/element-observer/observer';
import { monkey } from './scripts/element-observer/monkey';
import { getSoiCookie } from './scripts/core/core_cookies';
import { forEach } from './scripts/userview/userview_modal'

if (window.CLIENT_SIDE_BLOCKING && window.CLIENT_SIDE_BLOCKING.active) {
    let avacyBlocking = document.querySelector('#avacy-blocking');
    if (avacyBlocking) {
        forEach(Object.entries(window.myCustomVendorlist.vendors), ([id, vendor]) => {
            window.CLIENT_SIDE_BLOCKING.blacklist.push({
                pattern: vendor.pattern,
                rules: {
                    'data-purposes': vendor.purposes,
                    'data-legints': vendor.legIntPurposes,
                    'data-special-features': vendor.specialFeatures,
                    'data-custom-vendor': `${vendor.id}`
                }
            })
        } )
    }
    // Starts the monitoring
    window.CLIENT_SIDE_BLOCKING.observer = observer;
    observer.observe(document.documentElement, {
        childList: true,
        subtree: true
    });

    getSoiCookie().then(cookie => {
        monkey(cookie);
    })
  }

const cmpstub = require('@iabtcf/stub');
cmpstub();