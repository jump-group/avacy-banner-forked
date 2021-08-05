import { OilVersion, sendEventToHostSite, setGlobalOilObject, googleTagManagerEvents, tealiumTagManagerEvents } from './core_utils';
import { handleOptOut } from './core_optout';
import { logError, logInfo, logPreviewInfo } from './core_log';
import { checkOptIn } from './core_optin';
import { getSoiCookie, isBrowserCookieEnabled, isPreviewCookieSet, removePreviewCookie, removeVerboseCookie, setPreviewCookie, setVerboseCookie, setDomainCookie, getOilDomainCookieName } from './core_cookies';
import { getLocale, isAmpModeActivated, isPreviewMode, resetConfiguration, setGdprApplies, gdprApplies, setLoginStatus, getLoginStatus, checkMinExpireInDays } from './core_config';
import { EVENT_NAME_HAS_OPTED_IN, EVENT_NAME_NO_COOKIES_ALLOWED, OIL_GLOBAL_OBJECT_NAME, ADDITIONAL_CONSENT_VERSION } from './core_constants';
import { updateTcfApi } from './core_tcf_api';
import { manageDomElementActivation, demoPage } from './core_tag_management';
import { sendConsentInformationToCustomVendors } from './core_custom_vendors';
import { getPurposes, clearVendorListCache } from './core_vendor_lists';
import { consentStore } from './core_consent_store';
import { forEach, removeOilWrapperFromDOM } from '../userview/userview_modal';
import Cookie from 'js-cookie';
/**
 * Initialize Oil on Host Site
 * This functions gets called directly after Oil has loaded
 */
export function initOilLayer() {
  logInfo(`Init OilLayer (version ${OilVersion.get()})`);

  if (isPreviewMode() && !isPreviewCookieSet()) {
    logPreviewInfo('Preview mode ON and OIL layer remains hidden. Run AS_OIL.previewModeOn() and reload to display the layer.');
  }

  window.PAPYRI = window.AS_OIL;
  window.AVACY = window.AS_OIL;
  registerDomElementActivationManager();
  attachUtilityFunctionsToWindowObject();
  
  document.documentElement.style.setProperty('--home-demo-bg', `url(${getQueryStringParam('bgUrl') ? getQueryStringParam('bgUrl') : '../assets/images/bi-uk.png' }`);

  /**
   * We show OIL depending on the following conditions:
   * With Dev Mode turned on, we only show Oil if a developer cookie is set
   */
  if (!isPreviewMode() || isPreviewCookieSet()) {
    /**
     * Cookies are not enabled
     */
    if (!isAmpModeActivated() && !isBrowserCookieEnabled()) {
      logInfo('This browser doesn\'t allow cookies.');
      import('../userview/locale/userview_oil.js')
        .then(userview_modal => {
          userview_modal.locale(uv_m => uv_m.renderOil({ noCookie: true }));
        })
        .catch((e) => {
          logError('Locale could not be loaded.', e);
        });
      sendEventToHostSite(EVENT_NAME_NO_COOKIES_ALLOWED);
      return;
    }

    /**
     * We read our cookie and get an opt-in value, true or false
     */
    checkOptIn().then((result) => {
      let optin = result[0];
      let cookieData = result[1];
      
      if (window.dataLayer) {
        logInfo('Using dataLayer Push');
        googleTagManagerEvents(optin, cookieData);
      }
      
      if (window.utag) {
        logInfo('Using utag Link');
        tealiumTagManagerEvents(optin, cookieData);
      }

      if (optin) {
        /**
         * User has opted in
         */
        sendEventToHostSite(EVENT_NAME_HAS_OPTED_IN);
        updateTcfApi(cookieData, false, cookieData.addtlConsent);
        if(window.AS_OIL.isInCollection('oil-dom-loaded')) {
          manageDomElementActivation();
        }

        sendConsentInformationToCustomVendors().then(() => logInfo('Consent information sending to custom vendors after OIL start with found opt-in finished!'));
      } else {
        /**
         * Any other case, when the user didn't decide before and oil needs to be shown:
         */
        import('../userview/locale/userview_oil.js')
          .then(userview_modal => {
            userview_modal.locale(uv_m => uv_m.renderOil({ optIn: false }));
            if (gdprApplies()) {
              updateTcfApi(cookieData, true, ADDITIONAL_CONSENT_VERSION);
              consentStore().showPanel();
            }
          })
          .catch((e) => {
            logError('Locale could not be loaded.', e);
          });
        demoPage(cookieData);
        sendConsentInformationToCustomVendors().then(() => logInfo('Consent information sending to custom vendors after OIL start without found opt-in finished!'));
      }
      if (getQueryStringParam('prefcenter') && getQueryStringParam('prefcenter') === '1') {
        consentStore().showPanel();
        window.PAPYRI.showPreferenceCenter('absolute');
      } else if (optin) {
        consentStore().hidePanel();
      }
    });
  }
}

function getQueryStringParam(string) {
  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString);
  return urlParams.get(string);
}

function registerDomElementActivationManager() {
  document.addEventListener('DOMContentLoaded', onDomContentLoaded);
}

function onDomContentLoaded() {
  document.removeEventListener('DOMContentLoaded', onDomContentLoaded);
  sendEventToHostSite('oil-dom-loaded');
  if (window.CLIENT_SIDE_BLOCKING && window.CLIENT_SIDE_BLOCKING.active) {
    window.CLIENT_SIDE_BLOCKING.observer.disconnect();
  }
  if(window.AS_OIL.isInCollection('oil-checked-optin')) {
    manageDomElementActivation();
  }
}

/**
 * Attach Utility Functions to window Object, so users of oil can use it.
 */
function attachUtilityFunctionsToWindowObject() {

  function loadLocale(callbackMethod) {
    import('../userview/locale/userview_oil.js')
      .then(userview_modal => {
        if (!getLocale()) {
          userview_modal.locale(callbackMethod);
        } else {
          callbackMethod(userview_modal);
        }
      })
      .catch((e) => {
        logError('Locale could not be loaded.', e);
      });
  }

  setGlobalOilObject('previewModeOn', () => {
    setPreviewCookie();
    return 'preview mode on';
  });

  setGlobalOilObject('previewModeOff', () => {
    removePreviewCookie();
    return 'preview mode off';
  });

  setGlobalOilObject('verboseModeOn', () => {
    setVerboseCookie();
    return 'verbose mode on';
  });

  setGlobalOilObject('verboseModeOff', () => {
    removeVerboseCookie();
    return 'verbose mode off';
  });

  setGlobalOilObject('reload', () => {
    resetConfiguration();
    initOilLayer();
    return 'OIL reloaded';
  });

  setGlobalOilObject('changeLanguage', (lang) => {
    clearVendorListCache();
    if (window[OIL_GLOBAL_OBJECT_NAME].CONFIG.language !== lang) {
      window[OIL_GLOBAL_OBJECT_NAME].CONFIG.language = lang;
    }
    initOilLayer();
    return 'OIL language Changed';
  });

  setGlobalOilObject('status', () => {
    return getSoiCookie();
  });

  setGlobalOilObject('showPreferenceCenter', (mode = 'inline') => {
    loadLocale(userview_modal => {
      userview_modal.oilShowPreferenceCenter(mode);
    });
  });

  setGlobalOilObject('triggerOptIn', () => {
    loadLocale(userview_modal => {
      userview_modal.handleOptIn();
    });
  });

  setGlobalOilObject('triggerSoiOptIn', () => {
    loadLocale(userview_modal => {
      userview_modal.handleSoiOptIn();
    });
  });

  setGlobalOilObject('triggerPoiOptIn', () => {
    loadLocale(userview_modal => {
      userview_modal.handlePoiOptIn();
    });
  });

  setGlobalOilObject('triggerOptOut', () => {
    handleOptOut();
  });

  setGlobalOilObject('getPurposeConsents', () => {
    return new Promise((resolve, reject) => {
      window.__tcfapi('getTCData', 2, (tcData, success) => {
        if(success) {
          let consentsList = {}
          let count = 1;
          for (let [key, value] of Object.entries(getPurposes())) {
            if (tcData.purpose.consents[count] === true) {
              consentsList[count] = true;
            } else {
              consentsList[count] = false;
            }
            count = count + 1;
          }
          resolve(consentsList)
        } else {
          reject(false)
        }
      });
    });
  });

  setGlobalOilObject('getLegIntConsents', () => {
    return new Promise((resolve, reject) => {
      window.__tcfapi('getTCData', 2, (tcData, success) => {
        if(success) {
          let legintList = {}
          for (let [key, value] of Object.entries(getPurposes())) {
            if (tcData.purpose.legitimateInterests[key] === true) {
              legintList[key] = true;
            } else {
              legintList[key] = false;
            }
          }
          resolve(legintList)
        } else {
          reject(false)
        }
      });
    });
  });

  setGlobalOilObject('hasConsents', (purposes = [], legint = []) => {
    return new Promise((resolve, reject) => {
      if (Array.isArray(purposes) && purposes.length > 0 && Array.isArray(legint)) {
          let consentsResult = window.AS_OIL.getPurposeConsents().then(value => {
            return purposes.every(item => value[item] === true)
          })

          let legIntsResult = window.AS_OIL.getLegIntConsents().then(value => {
            return legint.every(item => value[item] === true)
          })

          Promise.all([consentsResult, legIntsResult]).then(result => {
            resolve(result.every(value => value === true));
          })

      } else {
          reject(false);
      }
    });
  });

  setGlobalOilObject('getLegalText', (legalText = 'cookie') => {
    return new Promise((resolve, reject) => {
      //TODO: Check if config object exist
      if (legalText && window.AS_OIL.CONFIG.locale[legalText + '_policy']) {
          resolve({
              text: window.AS_OIL.CONFIG.locale[`${legalText}_policy`],
              version: window.AS_OIL.CONFIG.locale[`${legalText}_policy_version`]
          });
      } else {
          reject(`Cannot find legal text ${legalText}_policy`);
      }
  });
  });

  setGlobalOilObject('applyGDPR', () => {
    setGdprApplies(true);
    initOilLayer();
    return 'GDPR applied';
  });

  setGlobalOilObject('isInCollection', (event_name = 'oil_shown') => {
    let count = 0;
    let collection = window.AS_OIL.eventCollection;
    if (collection) {
      forEach(collection, element => {
        if (element.name === event_name) {
          count = count + 1;
        }
      })
    }
    return count;
  })

  setGlobalOilObject('getOilConsent', () => {
    return getSoiCookie().then(cookie => {
      let created = cookie.consentData.created;
      let lastUpdated = cookie.consentData.lastUpdated;
      let expires = checkMinExpireInDays(window[OIL_GLOBAL_OBJECT_NAME].CONFIG.cookie_expires_in_days);

      let expirationDate = new Date( lastUpdated.getTime() + (expires * 1000 * 60 * 60 * 24));
      delete cookie.consentData

      return {
        cookie: cookie,
        created: created,
        lastUpdated: lastUpdated,
        expiresInDays: expires,
        expirationDate: expirationDate
      }
    });
  })

  setGlobalOilObject('getOilDataCookie', (name) => {
    return Cookie.get(name);
  })

  setGlobalOilObject('getLoginStatus', () => {
    return getLoginStatus();
  })

  setGlobalOilObject('setLoginStatus', (status) => {
    if (getLoginStatus() !== status) {      
      window[OIL_GLOBAL_OBJECT_NAME].login_status = status;
      removeOilWrapperFromDOM();
      initOilLayer();
    }
  })

  setGlobalOilObject('getOilDataName', () => {
    return getOilDomainCookieName();
  })

  setGlobalOilObject('setOilCookieBE', (cookieBE) => {
    let cookie = cookieBE.cookie;
    // let created = new Date(cookieBE.created);
    // let lastUpdated = new Date(cookieBE.lastUpdated);
    // let expiresInDays = cookieBE.expiresInDays;
    let expirationDate = new Date(cookieBE.expirationDate);
    let now = new Date();
    let elapsedMilliseconds = (expirationDate.getTime() - now.getTime());
    let elapsedDays = elapsedMilliseconds > 0 ? elapsedMilliseconds / (1000*60*60*24) : -1;
    setDomainCookie(getOilDomainCookieName(), cookie, elapsedDays);
  })
}