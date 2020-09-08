//NOTE: no changes to be made @tcf2
import { getSoiCookie, setSoiCookieWithPoiCookieData } from './core_cookies';
import { logPreviewInfo } from './core_log';
import { verifyPowerOptIn } from './core_poi';
import { getPolicyVersion } from './core_config';
import { manageDomElementActivation } from './core_tag_management.js';
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
    let soiOptIn = cookie.opt_in;
    let resultOptIn = soiOptIn;

    if (cookie.policyVersion !== getPolicyVersion()) {
      resultOptIn = false;
    }

    // Verify Power Opt In (will return immediately if not activated), it will overwrite the SOI result only if its positive
    verifyPowerOptIn().then((powerOptIn) => {
      logPreviewOptInInfo(soiOptIn, powerOptIn.power_opt_in);
      if (powerOptIn.power_opt_in) {
        cookie = powerOptIn;
        resultOptIn = cookie.power_opt_in;
        if (!soiOptIn) {
          setSoiCookieWithPoiCookieData(powerOptIn)
            .then(() => {
              manageDomElementActivation();
              resolve([resultOptIn, cookie])
            })
            .catch(error => reject(error));
        }
      }
      resolve([resultOptIn, cookie]);
    });
  });
}

