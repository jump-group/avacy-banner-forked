//NOTE: no changes to be made @tcf2
import { getSoiCookie, setSoiCookieWithPoiCookieData } from './core_cookies';
import { logPreviewInfo } from './core_log';
import { verifyPowerOptIn } from './core_poi';
import { getPolicyVersion } from './core_config';
import { manageDomElementActivation } from './core_tag_management.js';
import { sendEventToHostSite } from './core_utils.js';
/**
 * Log Helper function for checkOptIn
 * @param {*} singleOptIn
 * @param {*} powerOptIn
 */
function logPreviewOptInInfo(singleOptIn, powerOptIn) {
  if (powerOptIn) {
    logPreviewInfo('User has given POI permit, OIL not shown.');
  } else if (singleOptIn) {
    logPreviewInfo('User has given SOI permit, OIL not shown.');
  } else {
    logPreviewInfo('User has not opted in at all, OIL should be shown.');
  }
}

/**
 * Check Opt In
 * @return Promise with updated cookie value
 */
export function checkOptIn() {
  return new Promise((resolve, reject) => {
    let cookie = getSoiCookie();
    if(cookie.opt_in && isCookieVersionOk(cookie)){
        sendEventToHostSite('oil-checked-optin');
        resolve([cookie.opt_in, cookie]);
        return;
    }

    verifyPowerOptIn().then((powerOptIn) => {
        if(powerOptIn.power_opt_in && isCookieVersionOk(powerOptIn)){
            setSoiCookieWithPoiCookieData(powerOptIn)
            .then(() => {
                sendEventToHostSite('oil-checked-optin');
                resolve([powerOptIn.power_opt_in, powerOptIn]);
                return;
            })
            .catch(error => reject(error));
        } else {
          sendEventToHostSite('oil-checked-optin');
          resolve([false, powerOptIn]);
          return;
        }
    });
  });
}

function isCookieVersionOk(cookie) {
  if (cookie.policyVersion === getPolicyVersion()) {
    return true;
  }
  return false
}

