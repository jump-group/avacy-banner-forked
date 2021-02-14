//REVIEW: changes in todo comments @tcf2

import Cookie from 'js-cookie';
import { logInfo } from './core_log';
import {
  getConfigVersion,
  getPolicyVersion,
  getCookieExpireInDays,
  getCustomPurposes,
  getDefaultToOptin,
  isInfoBannerOnly,
  getLanguageFromLocale,
  getLocaleVariantName,
  getIabVendorWhitelist
} from './core_config';
import { getAllPreferences } from './core_consents';
import { getLocaleVariantVersion } from './core_utils';
import { ADDITIONAL_CONSENT_VERSION, OIL_CONFIG_DEFAULT_VERSION, OIL_POLICY_DEFAULT_VERSION, OIL_SPEC } from './core_constants';
import { getCustomVendorListVersion, getLimitedVendorIds, getPurposes, getVendorList, loadVendorListAndCustomVendorList, getAllAdditionalConsentProviders, getAdditionalConsentList } from './core_vendor_lists';
import { OilVersion } from './core_utils';
import { TCModel, TCString } from 'didomi-iabtcf-core';
import { consentStore } from './core_consent_store';
import { updateTcfApi } from '../core/core_tcf_api';

const COOKIE_PREVIEW_NAME = 'oil_preview';
const COOKIE_VERBOSE_NAME = 'oil_verbose';

const OIL_DOMAIN_COOKIE_NAME = 'oil_data';
const OIL_SESSION_COOKIE_NAME = 'oil_data_session';

export function setSessionCookie(name, value) {
  Cookie.set(name, value);
}

export function setDomainCookie(name, value, expires_in_days) {
  // decoded consent data must not be written to the cookie
  delete value.consentData;

  if (window.location.protocol === 'http:') {
      consentStore().writeConsent(name, value);
      // Cookie.set(name, value);
  } else {
      consentStore().writeConsent(name, value, { expires: expires_in_days, secure: true, sameSite: 'none' });
      // Cookie.set(name, value, { expires: expires_in_days, secure: true, sameSite: 'none' });
  }  
}

export function getOilCookie(cookieConfig) {
    const read = consentStore().readConsent(cookieConfig.name);

    //TODO: set new consent @tcf2 @tcf2soi
    return read.then( cookieJson => {
      if (cookieJson !== undefined ) {
        cookieJson.consentData = TCString.decode(cookieJson.consentString, getDefaultTCModel());
        logInfo('getting consent settings from cookie:', cookieJson.consentData);
      }
      return cookieJson;
    });

}

// TODO: DA RIMUOVERE
// export function hasOutdatedOilCookie(cookieConfig) {
//   return isCookieValid(cookieConfig.name, cookieConfig.outdated_cookie_content_keys);
// }


// TODO: DA RIMUOVERE
// export function findCookieConsideringCookieVersions(cookieConfig, outdatedCookieTransformer) {
//   let cookie;

//   if (hasCurrentOilCookie(cookieConfig)) {
//     cookie = getOilCookie(cookieConfig);
//   } else if (hasOilCookieWithoutVersion(cookieConfig)) {
//     cookie = getOilCookie(cookieConfig);
//     cookie.configVersion = OIL_CONFIG_DEFAULT_VERSION;
//     cookie.policyVersion = OIL_POLICY_DEFAULT_VERSION;
//   } else if (hasOutdatedOilCookie(cookieConfig)) {
//     cookie = outdatedCookieTransformer(cookieConfig);
//   } else {
//     cookie = cookieConfig.defaultCookieContent;
//   }

//   return cookie;
// }

export function getSoiCookie() {
  return getOilCookieConfig().then(cookieConfig => {    
    return getOilCookie(cookieConfig).then(config => {
      let cookie;
      if (config && config.opt_in === true) {
        cookie = config;
      } else {
        cookie = cookieConfig.defaultCookieContent;
      }
      return cookie;
    })
  });
}

export function setSoiCookieWithPoiCookieData(poiCookieJson) {
  console.log('poiCookieJson', poiCookieJson);
  //TODO: set new consent @tcf2 @tcf2poi
  return new Promise((resolve, reject) => {
    Promise.all([loadVendorListAndCustomVendorList(), getOilCookieConfig()]).then(results => {  
      let cookieConfig = results[1];
      let consentString;
      let configVersion = poiCookieJson.configVersion || cookieConfig.defaultCookieContent.configVersion;
      let policyVersion = poiCookieJson.policyVersion || cookieConfig.defaultCookieContent.policyVersion;
      let addtlConsent = poiCookieJson.addtlConsent || cookieConfig.defaultCookieContent.addtlConsent;

      if (poiCookieJson.consentString) {
        consentString = poiCookieJson.consentString;
      } else {
        let consentData = cookieConfig.defaultCookieContent.consentData;
        consentData.setPurposesAllowed(poiCookieJson.consentData.allowedPurposeIds);
        consentData.setVendorsAllowed(poiCookieJson.consentData.allowedVendorIds);
        consentData.setConsentLanguage(poiCookieJson.consentData.consentLanguage);
        consentString = consentData.getConsentString();
      }

      let cookie = {
        opt_in: true,
        version: cookieConfig.defaultCookieContent.version,
        localeVariantName: cookieConfig.defaultCookieContent.localeVariantName,
        localeVariantVersion: cookieConfig.defaultCookieContent.localeVariantVersion,
        customVendorListVersion: poiCookieJson.customVendorListVersion,
        customPurposes: poiCookieJson.customPurposes,
        consentString: !isInfoBannerOnly() ? consentString : '',
        configVersion: configVersion,
        policyVersion: policyVersion,
        addtlConsent: addtlConsent
      };

      setDomainCookie(cookieConfig.name, cookie, cookieConfig.expires);
      resolve(cookie);
    }).catch(error => reject(error));
  });
}

export function updateTCModel(privacySettings, tcModel) {
  tcModel.cmpId = OIL_SPEC.CMP_ID;
  tcModel.supportOOB = OIL_SPEC.SUPPORT_OOB;
  tcModel.isServiceSpecific = OIL_SPEC.IS_SERVICE_SPECIFIC;
  if (privacySettings !== 1) {
    ['purpose', 'vendor'].forEach((category) => {
      privacySettings[category] && Object.entries(privacySettings[category]).forEach((value) => {
        let id = Math.trunc(value[0]);
        let settings = value[1];
        let consentMethod = category + 'Consents';
        let legintMethod = category + 'LegitimateInterests';

        if (settings.consent) {
          tcModel[consentMethod].set(id);
        } else {
          tcModel[consentMethod].unset(id);
        }

        if (settings.legint) {
          tcModel[legintMethod].set(id);
        } else {
          tcModel[legintMethod].unset(id);
        }

      });
    });

    privacySettings.specialFeature && Object.entries(privacySettings.specialFeature).forEach((value) => {
      let id = Math.trunc(value[0]);
      let settings = value[1];

      if (settings.optin) {
        tcModel.specialFeatureOptins.set(id);
      } else {
        tcModel.specialFeatureOptins.unset(id);
      }

    });

    tcModel.addtlConsent = privacySettings.addtlConsent;

    tcModel.consentScreen = 2;
    tcModel.updated();
    return tcModel;
  }
  tcModel.addtlConsent = ADDITIONAL_CONSENT_VERSION+getAllAdditionalConsentProviders();
  if (getIabVendorWhitelist()) {
    tcModel.setAllPurposeConsents();
    tcModel.setAllPurposeLegitimateInterests();
    tcModel.setAllSpecialFeatureOptins();
    tcModel.vendorConsents.set(getIabVendorWhitelist());
    tcModel.vendorLegitimateInterests.set(getIabVendorWhitelist());
  } else {
    tcModel.setAll();
  }

  tcModel.consentScreen = 1;
  tcModel.updated();
  return tcModel;

}

export function buildSoiCookie(privacySettings) {
  return new Promise((resolve, reject) => {
    Promise.all([loadVendorListAndCustomVendorList(),getOilCookieConfig()]).then( results => {
      let cookieConfig = results[1];

      logInfo('creating TCModel with this settings:', privacySettings);
      let consentData = updateTCModel(privacySettings, cookieConfig.defaultCookieContent.consentData);

      logInfo('privacySettings', privacySettings);
      logInfo('new TCModel', consentData);
      logInfo('new TCString', TCString.encode(consentData));

      let outputCookie = {
        opt_in: true,
        version: cookieConfig.defaultCookieContent.version,
        localeVariantName: cookieConfig.defaultCookieContent.localeVariantName,
        localeVariantVersion: cookieConfig.defaultCookieContent.localeVariantVersion,
        customVendorListVersion: getCustomVendorListVersion(),
        customPurposes: getCustomPurposesWithConsent(privacySettings),
        consentString: !isInfoBannerOnly() ? TCString.encode(consentData) : '',
        configVersion: cookieConfig.defaultCookieContent.configVersion,
        policyVersion: cookieConfig.defaultCookieContent.policyVersion,
        addtlConsent: getAdditionalConsentWithSettings(privacySettings)
      };

      // TODO: inizialmente risolvevo solo outputCookie, ma per poter lanciare la sendDecodedConsent ho bisogno del TCmodel, ovvero consentData
      resolve([outputCookie, consentData]);
    }).catch(error => reject(error));
  });
}

export function setSoiCookie(privacySettings) {

  return new Promise((resolve, reject) => {
    buildSoiCookie(privacySettings).then( results => {
      let cookie = results[0];
      let consentData = results[1];
      //TODO: da rivedere, ma ho bisogno di fare l'update prima di settare il cookie.
      updateTcfApi(cookie, false, cookie.addtlConsent);
      setDomainCookie(OIL_DOMAIN_COOKIE_NAME, cookie, getCookieExpireInDays());
      consentStore().writeDecodedRaiConsentSDK(getAllPreferences(consentData, cookie.addtlConsent));

      resolve(cookie);
    }).catch(error => reject(error));
  });
}

export function setPreviewCookie() {
  setSessionCookie(COOKIE_PREVIEW_NAME, 'true');
}

export function setVerboseCookie() {
  setSessionCookie(COOKIE_VERBOSE_NAME, 'true');
}

export function removePreviewCookie() {
  Cookie.remove(COOKIE_PREVIEW_NAME);
}

export function removeVerboseCookie() {
  Cookie.remove(COOKIE_VERBOSE_NAME);
}

export function isPreviewCookieSet() {
  return Cookie.get(COOKIE_PREVIEW_NAME) === 'true';
}

export function isVerboseCookieSet() {
  return Cookie.get(COOKIE_VERBOSE_NAME) === 'true';
}

export function removeSubscriberCookies() {
  Cookie.remove(OIL_DOMAIN_COOKIE_NAME);
  Cookie.remove(OIL_DOMAIN_COOKIE_NAME, { expires: getCookieExpireInDays(), secure: true, sameSite: 'none' });
  
  Cookie.remove(OIL_SESSION_COOKIE_NAME);
}

export function removeHubCookie(poiGroup) {
  removeSubscriberCookies();
  if (poiGroup) {
    Cookie.remove(`${poiGroup}_${OIL_DOMAIN_COOKIE_NAME}`);
    Cookie.remove(`${poiGroup}_${OIL_DOMAIN_COOKIE_NAME}`, { expires: getCookieExpireInDays(), secure: true, sameSite: 'none' });
  }
}

/**
 * Checks weather the browser is able to store cookies
 * @return boolean
 */
export function isBrowserCookieEnabled() {
  let result;

  if (inIframe()) {
    Cookie.set('oil_cookie_exp','cookiedata', {secure: true, sameSite: 'none'});
    result = isCookie('oil_cookie_exp');
    Cookie.remove('oil_cookie_exp', {secure: true, sameSite: 'none'});
  } else {
    Cookie.set('oil_cookie_exp', 'cookiedata');
    result = isCookie('oil_cookie_exp');
    Cookie.remove('oil_cookie_exp');
  }
  return result;
}

export function inIframe() {
  try {
      return window.self !== window.top;
  } catch (e) {
      return true;
  }
}

export function getStandardPurposesWithConsent(privacySettings) {
  if (typeof privacySettings === 'object') {
    return getPurposes().map(({ id }) => id).filter(purposeId => privacySettings[purposeId]);
  } else {
    return privacySettings === 1 ? getPurposes().map(({ id }) => id) : [];
  }
}

export function getCustomPurposesWithConsent(privacySettings, allCustomPurposes) {
  //TODO: check and fix for new privacySettings value
  if (!allCustomPurposes) {
    allCustomPurposes = getCustomPurposes();
  }
  if (typeof privacySettings === 'object') {
    return allCustomPurposes.map(({ id }) => id).filter(purposeId => privacySettings[purposeId]);
  } else {
    return privacySettings === 1 ? allCustomPurposes.map(({ id }) => id) : [];
  }
}

export function getAdditionalConsentWithSettings(privacySettings) {
  return privacySettings !== 1 ? privacySettings.addtlConsent : ADDITIONAL_CONSENT_VERSION+getAllAdditionalConsentProviders();
}

function getAllowedStandardPurposesDefault() {
  return getDefaultToOptin() ? getPurposes().map(({ id }) => id) : [];
}

function getAllowedCustomPurposesDefault() {
  return getCustomPurposesWithConsent(getDefaultToOptin() ? 1 : 0);
}

// TODO: DA RIMUOVERE
// function getAllowedVendorsDefault() {
//   return getDefaultToOptin() ? getLimitedVendorIds() : [];
// }

// TODO: DA RIMUOVERE
// function hasOilCookieWithoutVersion(cookieConfig) {
//   let expectedKeys = Object.keys(cookieConfig.defaultCookieContent);
//   expectedKeys.splice(expectedKeys.indexOf('configVersion'), 1);
//   return isCookieValid(cookieConfig.name, expectedKeys);
// }

// TODO: DA RIMUOVERE
// function hasCurrentOilCookie(cookieConfig) {
//   return isCookieValid(cookieConfig.name, Object.keys(cookieConfig.defaultCookieContent));
// }

/**
 * Checks weather a cookie exists
 * @param name {string} Name of cookie
 * @return boolean
 */
function isCookie(name) {
  return typeof (Cookie.get(name)) !== 'undefined';
}

/**
 * Checks if a cookie contains a data object with given keys
 * @param name {string} Name of cookie
 * @param data {array}  Keys of data object
 * @returns boolean
 */

 // TODO: DA RIMUOVERE
// function cookieDataHasKeys(name, data) {  
//   if (typeof (name) === 'string' && Array.isArray(data)) {
//     let cookieData;
//     if (isCookie(name)) {
//       cookieData = Cookie.getJSON(name);
//     } else {
//       // cookieData = consentStore().readConsent(name); 
//     }
//     if (cookieData) {
//       return data.every(item => item === 'consentData' || cookieData.hasOwnProperty(item));
//     }
//   }
//   return false;
// }

/**
 * Checks if a cookie is valid and contains a data object with given keys
 * @param name {string} Name of cookie
 * @param data {array}  Keys of data object
 * @returns boolean
 */
// TODO: DA RIMUOVERE - Controllare se è realmente necesario validareil Cookie
// function isCookieValid(name, data) {
//   return cookieDataHasKeys(name, data);
// }

export function getDefaultTCModel() {
  let gvl = getVendorList();
  let consentData = new TCModel(gvl);
  consentData.cmpId = OIL_SPEC.CMP_ID;
  consentData.publisherCountryCode = 'IT';
  consentData.cmpVersion = OIL_SPEC.CMP_VERSION;
  consentData.isServiceSpecific = OIL_SPEC.IS_SERVICE_SPECIFIC;
  consentData.purposeOneTreatment = true;
  consentData.supportOOB = false;
  consentData.consentScreen = 1;

  return consentData;
}

function getOilCookieConfig() {
  //TODO: set new consent @tcf2 @tcf2soi
  // TODO: Capire bene come tornare un cookie in funzione del se o dato o meno l'optin
  let consentData;
  let consentString;
  
  return getOilCookie({name: OIL_DOMAIN_COOKIE_NAME}).then(cookie => {

    if (cookie) {
      consentData = cookie.consentData;
      consentData.supportOOB = false;
      consentData.gvl = getVendorList();
      consentString = cookie.consentString;
    } else {
      consentData = getDefaultTCModel();
      consentString = consentData.gvl.isReady ? TCString.encode(consentData) : ''; 
    }
  
    return {
      name: OIL_DOMAIN_COOKIE_NAME,
      expires: getCookieExpireInDays(),
      defaultCookieContent: {
        opt_in: false,
        version: OilVersion.get(),
        localeVariantName: getLocaleVariantName(),
        localeVariantVersion: getLocaleVariantVersion(),
        customPurposes: getAllowedCustomPurposesDefault(),
        consentData: consentData,
        consentString: !isInfoBannerOnly() ? consentString : '',
        configVersion: getConfigVersion(),
        policyVersion: getPolicyVersion(),
        addtlConsent: ADDITIONAL_CONSENT_VERSION
      },
      outdated_cookie_content_keys: ['opt_in', 'timestamp', 'version', 'localeVariantName', 'localeVariantVersion', 'privacy', 'addtlConsent']
    };
  });

}

// TODO: DA RIMUOVERE
// function transformOutdatedOilCookie(cookieConfig) {
//   //REVIEW: when does it run? @tcf2
//   let cookieJson = Cookie.getJSON(cookieConfig.name);

//   let cookie = cookieConfig.defaultCookieContent;
//   cookie.opt_in = cookieJson.opt_in;
//   cookie.version = cookieJson.version;
//   cookie.localeVariantName = cookieJson.localeVariantName;
//   cookie.localeVariantVersion = cookieJson.localeVariantVersion;
//   cookie.configVersion = OIL_CONFIG_DEFAULT_VERSION;
//   cookie.policyVersion = OIL_POLICY_DEFAULT_VERSION;
//   cookie.addtlConsent = ADDITIONAL_CONSENT_VERSION;
//   cookie.customPurposes = getCustomPurposesWithConsent(cookieJson.privacy);
//   cookie.consentData.setConsentLanguage(getLanguageFromLocale(cookieJson.localeVariantName));
//   cookie.consentData.setPurposesAllowed(getStandardPurposesWithConsent(cookieJson.privacy));
//   cookie.consentData.setVendorsAllowed(getLimitedVendorIds());
//   cookie.consentData.setGlobalVendorList(getVendorList());
//   cookie.consentString = !isInfoBannerOnly() ? cookie.consentData.getConsentString() : '';
//   return cookie;
// }
