import { OIL_CONFIG, OIL_CONFIG_DEFAULT_VERSION, OIL_GLOBAL_OBJECT_NAME, OIL_POLICY_DEFAULT_VERSION, DEFAULT_LANG } from './core_constants';
import { logError, logInfo } from './core_log.js';
import { getGlobalOilObject, isObject, OilVersion, setGlobalOilObject, sendEventToHostSite } from './core_utils';
import DEFAULT_LOCALE from './../userview/locale/userview_default_locale.json';
/**
 * Read configuration of component from JSON script block
 * @param configurationElement - DOM config element
 * @returns {{}} extracted configuration as JSON
 * @function
 */
function readConfiguration(configurationElement) {
  let parsedConfig = {};
  try {
    if (configurationElement) {
      if (configurationElement.text) {
        parsedConfig = JSON.parse(configurationElement.text);
        logInfo('Parsed config', parsedConfig);
      }
    }
  } catch (errorDetails) {
    logError('Error config', errorDetails);
  }
  return parsedConfig;
}

/**
 * Get OIL configuration from HTML document
 * @returns Object parsed config
 */
function getConfiguration() {
  if (!getGlobalOilObject('CONFIG')) {
    let configurationElement = document.querySelector('script[type="application/configuration"]#oil-configuration');
    if (configurationElement === null) {
      logInfo('Using default config');
    }

    setGlobalOilObject('CONFIG', readConfiguration(configurationElement));
    setGlobalOilObject('CONFIG_ATTRIBUTES', OIL_CONFIG);

    verifyConfiguration();
    verifyLocaleObject();

    if (getPublicPath()) {
      __webpack_public_path__ = getPublicPath();
    }
  }
  return getGlobalOilObject('CONFIG');
}

/**
 * Verify that configuration has a version.
 */
function verifyConfiguration() {
  if (!getConfigValue(OIL_CONFIG.ATTR_CONFIG_VERSION, undefined)) {
    logError('Your configuration is faulty - it must contain a "config_version" property. See the oil.js documentation for details.');
  }
}

/**
 * Verify that locale object does not lack any required properties.
 *
 * The locale can be a
 * a) string to use with the language backend or
 * b) it can be an object containing all labels
 *
 * If both is missing a default will be used.
 */
function verifyLocaleObject() {
  let locale = getLocale();

  if ((!locale || (typeof locale) === 'string') && getLocaleUrl() === undefined) {
    logError('Incorrect or missing locale parameter found. Please review documentation on how to set the locale object in your configuration. Using default locale.');
  } else if (locale && isObject(locale)) {
    if (!locale.localeId) {
      logError('Your configuration is faulty - "locale" object misses "localeId" property. See the oil.js documentation for details.');
    }
    if (!locale.version && locale.version !== 0) {
      logError('Your configuration is faulty - "locale" object misses "version" property. See the oil.js documentation for details.');
    }
  }
}

function setConfigValue(name, value) {
  getConfiguration()[name] = value;
}

/**
 * Returns a config value or its given default value if not existing in users configuration.
 *
 * @param {string} name in form of the key of the config value
 * @param {object} defaultValue as fallback if there is no value found for the key (name)
 * @returns {*}
 */
export function getConfigValue(name, defaultValue) {
  const config = getConfiguration();
  return (config && typeof config[name] !== 'undefined') ? config[name] : defaultValue;
}

// **
//  Public Interface
// **

export function getConfigVersion() {
  return getConfigValue(OIL_CONFIG.ATTR_CONFIG_VERSION, OIL_CONFIG_DEFAULT_VERSION);
}

export function getPolicyVersion() {
  return getConfigValue(OIL_CONFIG.ATTR_POLICY_VERSION, OIL_POLICY_DEFAULT_VERSION);
}

export function isPreviewMode() {
  return getConfigValue(OIL_CONFIG.ATTR_PREVIEW_MODE, false);
}

export function isPoiActive() {
  return getConfigValue(OIL_CONFIG.ATTR_ACTIVATE_POI, false);
}

/**
 * Get the hub iFrame domain with protocol prefix for the current location
 * @returns {string, null} domain iframe orgin
 */
export function getHubOrigin() {
  let origin = getConfigValue(OIL_CONFIG.ATTR_HUB_ORIGIN, 'https://unpkg.com');
  if (origin) {
    return origin === '/' || origin.indexOf('http') !== -1 ? origin : location.protocol + origin;
  }
  return null;
}

export function getHubPath() {
  return getConfigValue(OIL_CONFIG.ATTR_HUB_PATH, `/@ideasio/oil.js@${OilVersion.getLatestReleaseVersion()}/release/current/hub.html`);
}

/**
 * The server path from which all chunks and ressources will be loaded.
 * @returns {string}
 */
export function getPublicPath() {
  let publicPath = getConfigValue(OIL_CONFIG.ATTR_PUBLIC_PATH, undefined);
  if (publicPath && publicPath.substr(-1) !== '/') {
    publicPath += '/'
  }
  return publicPath;
}

export function getLocaleUrl() {
  return getConfigValue(OIL_CONFIG.ATTR_LOCALE_URL, undefined);
}

export function getIabVendorListDomain() {
  return getConfigValue(OIL_CONFIG.ATTR_IAB_VENDOR_LIST_URL, 'https://cdn.jumpgroup.it/assets/'); //TODO: add our domain vendor list
}

export function getIabVendorBlacklist() {
  return getConfigValue(OIL_CONFIG.ATTR_IAB_VENDOR_BLACKLIST, undefined);
}

export function getCustomVendorListUrl() {
  return getConfigValue(OIL_CONFIG.ATTR_CUSTOM_VENDOR_LIST_URL, undefined);
}

export function getAdditionalConsentListUrl() {
  return getConfigValue(OIL_CONFIG.ATTR_ADDITIONAL_CONSENT_LIST_URL, undefined);
}

export function getAtpWhitelist() {
  return getConfigValue(OIL_CONFIG.ATTR_ATP_WHITELIST, undefined);
}

export function getRequiredStacks() {
  return getConfigValue(OIL_CONFIG.ATTR_USE_STACKS, undefined);
}

export function getVendorOnLegalScope() {
  return getConfigValue(OIL_CONFIG.ATTR_VENDOR_ON_LEGAL_SCOPE, false);
}

export function getIabVendorWhitelist() {
  return getConfigValue(OIL_CONFIG.ATTR_IAB_VENDOR_WHITELIST, undefined);
}

export function setIabVendorBlacklist(value) {
  setConfigValue(OIL_CONFIG.ATTR_IAB_VENDOR_BLACKLIST, value);
}

export function setIabVendorWhitelist(value) {
  setConfigValue(OIL_CONFIG.ATTR_IAB_VENDOR_WHITELIST, value);
}

export function getPoiGroupName() {
  return getConfigValue(OIL_CONFIG.ATTR_POI_GROUP_NAME, 'default');
}

export function getTcfPurposeOneTreatment() {
  return getConfigValue(OIL_CONFIG.ATTR_TCF_PURPOSE_ONE_TREATMENT, false);
}

export function getClearOnVersionUpdate() {
  return getConfigValue(OIL_CONFIG.ATTR_CLEAR_ON_VERSION_UPDATE, false);
}

export function getCookieExpireInDays() {
  return checkMinExpireInDays(getConfigValue(OIL_CONFIG.ATTR_COOKIE_EXPIRES_IN_DAYS, 365));
}

export function checkMinExpireInDays(days) {
  if (days < 183) {
    days = 183;
  }
  logInfo('Cookie expires in days:', days);
  return days;
}

export function getLocaleVariantName() {
  const defaultLocaleId = 'enEN_01';
  let localeVariantName = getLocale();

  if (!localeVariantName) {
    localeVariantName = defaultLocaleId;
  }
  if (localeVariantName && isObject(localeVariantName)) {
    return localeVariantName.localeId ? localeVariantName.localeId : defaultLocaleId;
  }
  return localeVariantName;
}

export function autoChangeLanguage() {
  let bannerLang = document.documentElement.lang;
  if (bannerLang) {
    return bannerLang.substring(0, 2);
  }
  return 'en';
}

export function autoLanguage() {
  return getConfigValue(OIL_CONFIG.ATTR_AUTO_LANGUAGE, false);
}

export function getLanguage() {
  return getLanguageFromLocale(getLocaleVariantName());
}

export function getLanguageFromLocale(localeVariantName = DEFAULT_LANG) {
  return localeVariantName.substring(0, 2);
}

export function getLanguageFromConfigObject() {
    if (autoLanguage()) {
      return autoChangeLanguage(); 
    }

    let languages_list = getConfigValue(OIL_CONFIG.ATTR_LANGUAGES_LIST, undefined);
    let lang = getConfigValue(OIL_CONFIG.ATTR_LANGUAGE, DEFAULT_LANG)

    return checkLanguage(languages_list, lang);
}

/**
 * Get the hub iFrame URL with protocol prefix for the current location
 * @returns {string, null} complete iframe orgin
 */
export function getHubLocation() {
  return getHubOrigin() + getHubPath();
}

export function getPoiListDirectory() {
  let hubOrigin = getHubOrigin();
  return endsWith(hubOrigin, '/') ? hubOrigin.replace(/\/$/, '/poi-lists') : hubOrigin + '/poi-lists';
}

function endsWith(str, suffix) {
  return str.indexOf(suffix, str.length - suffix.length) !== -1;
}

/**
 * Reset configuration, reread from HTML.
 */
export function resetConfiguration() {
  setGlobalOilObject('CONFIG', null);
}

export function getCustomPurposes() {
  return getConfigValue(OIL_CONFIG.ATTR_CUSTOM_PURPOSES, []);
}

export function getCustomPurposeIds() {
  return getCustomPurposes().map(({ id }) => id);
}

export function isMobileEnvironment() {
  return getConfigValue(OIL_CONFIG.ATTR_DEVICE_ENVIRONMENT, 'web') === 'native' ? true : false;
}

export function getNativePublisher() {
  return getConfigValue(OIL_CONFIG.ATTR_NATIVE_PUBLISHER, 'avacy');
}

/**
 * Define whether in the advanced settings window checkboxes
 * should be activated by default, even when no consent was given
 * @return {bool, false}
 */
export function getAdvancedSettingsPurposesDefault() {
  return getConfigValue(OIL_CONFIG.ATTR_ADVANCED_SETTINGS_PURPOSES_DEFAULT, false);
}

export function getDefaultToOptin() {
  return getConfigValue(OIL_CONFIG.ATTR_DEFAULT_TO_OPTIN, false);
}

export function getLocale() {
  let languages_list = getConfigValue(OIL_CONFIG.ATTR_LANGUAGES_LIST, undefined);
  if (languages_list) {
    let lang = getLanguageFromConfigObject();
    lang = checkLanguage(languages_list, lang);  
    setConfigValue(OIL_CONFIG.ATTR_LOCALE, languages_list[lang]);
  }

  return getConfigValue(OIL_CONFIG.ATTR_LOCALE, DEFAULT_LOCALE);
}

function checkLanguage(list, lang) {

  if (list) {
    return Object.keys(list).includes(lang) ? lang : DEFAULT_LANG;
  }

  return DEFAULT_LANG;
}
export function getLoginStatus() {
  return window[OIL_GLOBAL_OBJECT_NAME] ? window[OIL_GLOBAL_OBJECT_NAME].login_status : false;
}

export function setLocale(localeObject) {
  setConfigValue(OIL_CONFIG.ATTR_LOCALE, localeObject);
}

export function gdprApplies() {
  return getConfigValue(OIL_CONFIG.ATTR_GDPR_APPLIES_GLOBALLY, true) || getConfigValue(OIL_CONFIG.ATTR_GDPR_APPLIES, false);
}

export function demoActive() {
  return getConfigValue(OIL_CONFIG.ATTR_AVACY_DEMO_STATUS, false);
}

export function setGdprApplies(value = true) {
  setConfigValue(OIL_CONFIG.ATTR_GDPR_APPLIES, value);
}

export function getShowLimitedVendors() {
  return getConfigValue(OIL_CONFIG.ATTR_SHOW_LIMITED_VENDORS_ONLY, false);
}

export function isInfoBannerOnly() {
  return getConfigValue(OIL_CONFIG.ATTR_INFO_BANNER_ONLY, false);
}

export function suppressCookies() {
  return getConfigValue(OIL_CONFIG.ATTR_SUPPRESS_COOKIES, false);
}

export function isAmpModeActivated() {
  return isInfoBannerOnly() && suppressCookies();
}

export function getConsentSolutionUrl() {
  return getConfigValue(OIL_CONFIG.ATTR_CONSENT_SOLUTION_URL, undefined);
}


