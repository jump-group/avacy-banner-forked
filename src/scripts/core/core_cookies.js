import Cookie from 'js-cookie';
import { logInfo } from './core_log';
import {
  getConfigVersion,
  getPolicyVersion,
  getCookieExpireInDays,
  getCustomPurposes,
  getDefaultToOptin,
  isInfoBannerOnly,
  getLocaleVariantName,
  getIabVendorWhitelist,
  getLoginStatus,
  getTcfPurposeOneTreatment,
  getClearOnVersionUpdate
} from './core_config';
import { getAllPreferences } from './core_consents';
import { getLocaleVariantVersion, tagManagerEvents } from './core_utils';
import { ADDITIONAL_CONSENT_VERSION, OIL_SPEC } from './core_constants';
import { getCustomVendorListVersion, getCustomVendorList, getPurposes, getVendorList, loadVendorListAndCustomVendorList, getAllAdditionalConsentProviders } from './core_vendor_lists';
import { OilVersion } from './core_utils';
import { TCModel, TCString } from 'didomi-iabtcf-core';
import { consentStore } from './core_consent_store';
import { updateTcfApi } from '../core/core_tcf_api';
import { forEach } from './../userview/userview_modal';
import { useLegint } from './../userview/userview_config';
import { isCookieStillValid } from './core_optin';

const COOKIE_PREVIEW_NAME = 'oil_preview';
const COOKIE_VERBOSE_NAME = 'oil_verbose';
const OIL_DOMAIN_COOKIE_NAME = 'oil_data';

const OIL_SESSION_COOKIE_NAME = 'oil_data_session';

export function getOilDomainCookieName() {
  return cookieAccordingToLoginStatus();
}

export function setSessionCookie(name, value) {
  Cookie.set(name, value);
}

export function setDomainCookie(name, value, expires_in_days) {
  // decoded consent data must not be written to the cookie
  delete value.consentData;

  if (window.location.protocol === 'http:') {
      consentStore().writeConsent(name, value, { expires: expires_in_days });
    } else {
      consentStore().writeConsent(name, value, { expires: expires_in_days, secure: true, sameSite: 'none' });
  }  
}

export function getOilCookie(cookieConfig) {
    const read = consentStore().readConsent(cookieConfig.name);

    return read.then( cookieJson => {
      if (cookieJson !== undefined ) {
        cookieJson.consentData = TCString.decode(cookieJson.consentString, getDefaultTCModel());
        logInfo('getting consent settings from cookie:', cookieJson.consentData);
      }
      return cookieJson;
    });
}

export function getSoiCookie() {
  return getOilCookieConfig().then(cookieConfig => {    
    return getOilCookie(cookieConfig).then(config => {
      let cookie;
      if (config && config.opt_in === true) {
        cookie = config;
      } else {
        cookie = cookieConfig.defaultCookieContent;
      }
      console.log('COOKIE', cookie)
      console.log('isCookieStillValid(cookie)', isCookieStillValid(cookie))

      if (getClearOnVersionUpdate() && !isCookieStillValid(cookie)) {
        console.log('cookieConfig.defaultCookieContent',cookieConfig)
        return cookieConfig.defaultCookieContent;
      }

      

      return cookie;
    })
  });
}

export function setSoiCookieWithPoiCookieData(poiCookieJson) {
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
        customVendorList: poiCookieJson.customVendorList,
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
    forEach(['purpose', 'vendor'], (category) => {
      privacySettings[category] && forEach(Object.entries(privacySettings[category]),(value) => {
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

      })
    })

    privacySettings.specialFeature && forEach(Object.entries(privacySettings.specialFeature), (value) => {
      let id = Math.trunc(value[0]);
      let settings = value[1];

      if (settings.optin) {
        tcModel.specialFeatureOptins.set(id);
      } else {
        tcModel.specialFeatureOptins.unset(id);
      }

    })

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

  if (!useLegint()) {
    tcModel.unsetAllPurposeLegitimateInterests();
    tcModel.unsetAllVendorLegitimateInterests();
  }

  if (getTcfPurposeOneTreatment()) {
    tcModel.purposeConsents.set_.delete(1)
  }

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
        customVendorList: getCustomVendorsWithConsent(privacySettings),
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
      setDomainCookie(cookieAccordingToLoginStatus(), cookie, getCookieExpireInDays());
      consentStore().writeDecodedRaiConsentSDK(getAllPreferences(consentData, cookie.addtlConsent, cookie.customVendor));
      tagManagerEvents(cookie.opt_in, cookie, 'consent_update', consentData);
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
  Cookie.remove(cookieAccordingToLoginStatus());
  Cookie.remove(cookieAccordingToLoginStatus(), { expires: getCookieExpireInDays(), secure: true, sameSite: 'none' });
  
  Cookie.remove(OIL_SESSION_COOKIE_NAME);
}

export function removeHubCookie(poiGroup) {
  removeSubscriberCookies();
  if (poiGroup) {
    Cookie.remove(`${poiGroup}_${cookieAccordingToLoginStatus()}`);
    Cookie.remove(`${poiGroup}_${cookieAccordingToLoginStatus()}`, { expires: getCookieExpireInDays(), secure: true, sameSite: 'none' });
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

export function getCustomVendorsWithConsent(privacySettings) {
  if (typeof privacySettings === 'object') {
    return Object.entries(privacySettings.customVendor).filter(item => item[1].consent).map(item => item[0]);
  } else {
    return privacySettings === 1 ? Object.entries(getCustomVendorList().vendors).map(item => item[0]) : [];
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


/**
 * Checks if a cookie is valid and contains a data object with given keys
 * @param name {string} Name of cookie
 * @param data {array}  Keys of data object
 * @returns boolean
 */

export function getDefaultTCModel() {
  let gvl = getVendorList();
  let consentData = new TCModel(gvl);
  consentData.cmpId = OIL_SPEC.CMP_ID;
  consentData.publisherCountryCode = 'IT';
  consentData.cmpVersion = OIL_SPEC.CMP_VERSION;
  consentData.isServiceSpecific = OIL_SPEC.IS_SERVICE_SPECIFIC;
  consentData.purposeOneTreatment = getTcfPurposeOneTreatment();
  consentData.supportOOB = false;
  consentData.consentScreen = 1;

  return consentData;
}

function getOilCookieConfig() {
  //TODO: set new consent @tcf2 @tcf2soi
  // TODO: Capire bene come tornare un cookie in funzione del se o dato o meno l'optin
  let consentData;
  let consentString;
  
  return getOilCookie({name: cookieAccordingToLoginStatus()}).then(cookie => {

    if (cookie) {
      consentData = cookie.consentData;
      consentData.supportOOB = false;
      consentData.gvl = getVendorList();
      consentString = cookie.consentString;
    } else {
      consentData = getDefaultTCModel();
      consentString = consentData.gvl.isReady ? TCString.encode(consentData) : ''; 
    }
    console.log('consentString', consentString);
    return {
      name: cookieAccordingToLoginStatus(),
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

function cookieAccordingToLoginStatus() {
  return (!getLoginStatus() || getLoginStatus() === false || getLoginStatus() === undefined || getLoginStatus() === null) ? OIL_DOMAIN_COOKIE_NAME : 'oil_data_be';
}