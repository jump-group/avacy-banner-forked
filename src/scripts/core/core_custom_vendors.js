//NOTE: no changes to be made @tcf2
import { getCustomVendorList, loadVendorListAndCustomVendorList } from './core_vendor_lists';
import { logError } from './core_log';
import { getSoiCookie } from './core_cookies';
import { getPurposesAllowed } from './core_consents';

export function sendConsentInformationToCustomVendors() {
  return Promise.all([loadVendorListAndCustomVendorList(), getSoiCookie() ]).then(results => {
      let customVendorList = getCustomVendorList();

      if (customVendorList && !customVendorList.isDefault) {

        let customVendors = customVendorList.vendors;
        if (typeof (customVendors) === 'object') {
          customVendors = Object.values(customVendors)
        }

        // TODO getSoiCookie is not sufficient - possibly required information is in poi cookie and soi cookie does not exist (see OIL-336)
        let cookie = results[1];
        if (cookie && cookie.consentData) {
          customVendors.forEach(customVendor => {
            sendConsentInformationToCustomVendor(customVendor, cookie.consentData)
          });
        }
      }
    });
}

function sendConsentInformationToCustomVendor(customVendor, consentData) {
  let allowedPurposeIds = getPurposesAllowed(consentData);

  let testCustomVendorConsent;
  if (Object.keys(allowedPurposeIds).length > 0) {
    testCustomVendorConsent = customVendor.purposes.every(purposeId => {
      if (allowedPurposeIds[purposeId] === undefined) {
        return false;
      }
      if (allowedPurposeIds[purposeId].hasOwnProperty('consent')) {
        return allowedPurposeIds[purposeId].consent !== -1
      }
    })
  }

  if (testCustomVendorConsent) {
    executeCustomVendorScript('opt-in', customVendor.optInSnippet, customVendor);
  } else {
    executeCustomVendorScript('opt-out', customVendor.optOutSnippet, customVendor);
  }
}

function executeCustomVendorScript(scriptType, script, customVendor) {
  if (script) {
    try {
      // Note: We assign eval function to a variable and invoke it this way indirectly. This ensures that's the scope
      // for executed JavaScript function is global and not the scope of this function! We need this to enable the
      // executed script to set (global) variables that are reachable for other code snippets (i.e. for webtrekk) of
      // the website the opt-in layer is integrated in.
      let evalFunction = eval;
      evalFunction(script)
    } catch (error) {
      logError('Error occurred while executing ' + scriptType + ' script for custom vendor ' + customVendor.id + ' (' + customVendor.name + ')! Error was: ', error);
    }
  }
}
