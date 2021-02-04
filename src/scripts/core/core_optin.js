//NOTE: no changes to be made @tcf2
import { getSoiCookie, setSoiCookieWithPoiCookieData } from './core_cookies';
import { logPreviewInfo } from './core_log';
import { verifyPowerOptIn } from './core_poi';
import { getPolicyVersion } from './core_config';
import { OIL_SPEC } from './core_constants.js';
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
    if(cookie.opt_in && isCookieStillValid(cookie)){
        sendEventToHostSite('oil-checked-optin');
        resolve([cookie.opt_in, cookie]);
        return;
    }

    verifyPowerOptIn().then((powerOptIn) => {
        if(powerOptIn.power_opt_in && isCookieStillValid(powerOptIn)){
            setSoiCookieWithPoiCookieData(powerOptIn)
            .then(() => {
                sendEventToHostSite('oil-checked-optin');
                resolve([powerOptIn.power_opt_in, powerOptIn]);
                return;
            })
            .catch(error => reject(error));
        } else {
          sendEventToHostSite('oil-checked-optin');
          resolve([false, cookie]);
          return;
        }
    });
  });
}

function isCookieStillValid(cookie) {
  return isCookieVersionOk(cookie) && isCmpIdValid(cookie) && isOOBValid(cookie) && isServiceSpecificValid(cookie);
}

function isCookieVersionOk(cookie) {
  if (cookie.policyVersion === getPolicyVersion()) {
    return true;
  }
  return false
}

function isCmpIdValid(cookie) {
  /** TODO: check if TCF isn't Service Specific */
  if ( cookie.consentData.cmpId_ === OIL_SPEC.CMP_ID) {
    return true;
  }
  return false
}

function isOOBValid(cookie) {
  if ( cookie.consentData.supportOOB_ === OIL_SPEC.SUPPORT_OOB) {
    return true;
  }
  return false
}

function isServiceSpecificValid(cookie) {
  if ( cookie.consentData.isServiceSpecific_ === OIL_SPEC.IS_SERVICE_SPECIFIC) {
    return true;
  }
  return false
}

