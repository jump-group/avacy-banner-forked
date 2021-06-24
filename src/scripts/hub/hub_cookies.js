import {
  OIL_CONFIG_DEFAULT_VERSION,
  OIL_POLICY_DEFAULT_VERSION,
  OIL_PAYLOAD_CONFIG_VERSION,
  OIL_PAYLOAD_POLICY_VERSION,
  OIL_PAYLOAD_CUSTOM_PURPOSES, 
  OIL_PAYLOAD_CUSTOM_VENDORLIST_VERSION,
  OIL_PAYLOAD_CUSTOM_VENDORLIST,
  OIL_PAYLOAD_LOCALE_VARIANT_NAME,
  OIL_PAYLOAD_LOCALE_VARIANT_VERSION,
  OIL_PAYLOAD_PRIVACY,
  OIL_PAYLOAD_VERSION,
  OIL_SPEC,
  OIL_PAYLOAD_ADDITIONAL_CONSENT_STRING,
  ADDITIONAL_CONSENT_VERSION
} from '../core/core_constants';
import { logError, logInfo } from '../core/core_log';
import { getConfigVersion, getPolicyVersion, getCookieExpireInDays } from '../core/core_config';
import { getDefaultTCModel, setDomainCookie } from '../core/core_cookies';
import Cookie from 'js-cookie';
import { TCString } from 'didomi-iabtcf-core';

const OIL_HUB_DOMAIN_COOKIE_NAME = 'oil_data';
const OIL_HUB_UNKNOWN_VALUE = 'unknown';

export function getPoiCookie(groupName = '') {
  let config = getHubDomainCookieConfig(groupName);
  let cookie = Cookie.getJSON(config.name);

  if (cookie) {
    logInfo('Oil Hub Domain Cookie: ', cookie);
    return cookie;
  } else {
    return config.defaultCookieContent;
  }
}

export function setPoiCookie(groupName, payload) {
  // If we send OLD DATA to a NEW HUB, we got a problem - in this case we do not want to store the POI-Cookie --> new data = consent string, old = privacy object
  let consentStringAsPrivacy = getConsentStringFromPayload(payload);
  if (payload && (typeof (consentStringAsPrivacy) === 'string')) {
    let cookie = {
      power_opt_in: true,
      version: getVersionFromPayload(payload),
      localeVariantName: getLocaleVariantNameFromPayload(payload),
      localeVariantVersion: getLocaleVariantVersionFromPayload(payload),
      customPurposes: getCustomPurposesFromPayload(payload),
      customVendorListVersion: getCustomVendorlistVersionFromPayload(payload),
      customVendorList: getCustomVendorlistFromPayload(payload),
      consentString: consentStringAsPrivacy,
      configVersion: getConfigVersionFromPayload(payload),
      policyVersion: getPolicyVersionFromPayload(payload),
      addtlConsent: getAdditionalConsentFromPayload(payload)
    };
    setDomainCookie(getOilHubCookieName(groupName), cookie, getCookieExpireInDays());
  } else {
    logError('Oil Hub received old or empty payload! No POI cookie stored.')
  }
}

function getOilHubCookieName(groupName) {
  if (groupName) {
    return groupName + '_' + OIL_HUB_DOMAIN_COOKIE_NAME;
  }
  return OIL_HUB_DOMAIN_COOKIE_NAME;
}

function getHubDomainCookieConfig(groupName) {
  let consentData = getDefaultTCModel();
  let consentString = consentData.gvl.isReady ? TCString.encode(consentData) : '';

  return {
    name: getOilHubCookieName(groupName),
    expires: getCookieExpireInDays(),
    defaultCookieContent: {
      power_opt_in: false,
      version: OIL_HUB_UNKNOWN_VALUE, // this value can't be figured out
      localeVariantName: OIL_HUB_UNKNOWN_VALUE, // this value can't be figured out
      localeVariantVersion: 0, // this value can't be figured out
      customPurposes: [],
      consentData: consentData,
      consentString: consentString,
      configVersion: getConfigVersion(),
      policyVersion: getPolicyVersion(),
      addtlConsent: ADDITIONAL_CONSENT_VERSION
    },
    outdated_cookie_content_keys: ['power_opt_in', 'timestamp', 'version', 'localeVariantName', 'localeVariantVersion', 'privacy', 'addtlConsent']
  };
}

function getConsentStringFromPayload(payload) {
  return getPayloadPropertyOrDefault(payload, OIL_PAYLOAD_PRIVACY, 'undefined');
}

function getConfigVersionFromPayload(payload) {
  return getPayloadPropertyOrDefault(payload, OIL_PAYLOAD_CONFIG_VERSION, OIL_CONFIG_DEFAULT_VERSION);
}

function getPolicyVersionFromPayload(payload) {
  return getPayloadPropertyOrDefault(payload, OIL_PAYLOAD_POLICY_VERSION, OIL_POLICY_DEFAULT_VERSION);
}

function getAdditionalConsentFromPayload(payload) {
  return getPayloadPropertyOrDefault(payload, OIL_PAYLOAD_ADDITIONAL_CONSENT_STRING, ADDITIONAL_CONSENT_VERSION);
}

function getCustomPurposesFromPayload(payload) {
  return getPayloadPropertyOrDefault(payload, OIL_PAYLOAD_CUSTOM_PURPOSES, []);
}

function getCustomVendorlistVersionFromPayload(payload) {
  return getPayloadPropertyOrDefault(payload, OIL_PAYLOAD_CUSTOM_VENDORLIST_VERSION, 'undefined');
}

function getCustomVendorlistFromPayload(payload) {
  return getPayloadPropertyOrDefault(payload, OIL_PAYLOAD_CUSTOM_VENDORLIST, 'undefined');
}

function getVersionFromPayload(payload) {
  return getPayloadPropertyOrDefault(payload, OIL_PAYLOAD_VERSION);
}

function getLocaleVariantNameFromPayload(payload) {
  return getPayloadPropertyOrDefault(payload, OIL_PAYLOAD_LOCALE_VARIANT_NAME);
}


function getLocaleVariantVersionFromPayload(payload) {
  return getPayloadPropertyOrDefault(payload, OIL_PAYLOAD_LOCALE_VARIANT_VERSION);
}

function getPayloadPropertyOrDefault(payload, pname, defaultValue) {
  if (payload && payload[pname]) {
    return payload[pname];
  }
  if (defaultValue === 'undefined') {
    return undefined;
  }
  return defaultValue || OIL_HUB_UNKNOWN_VALUE;
}
