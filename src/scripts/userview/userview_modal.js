import '../../styles/modal.scss';
import { getGlobalOilObject, isObject, sendEventToHostSite } from '../core/core_utils';
import { removeSubscriberCookies, getSoiCookie } from '../core/core_cookies';
import {
  ADDITIONAL_CONSENT_VERSION,
  EVENT_NAME_ADVANCED_SETTINGS,
  EVENT_NAME_AS_PRIVACY_SELECTED,
  EVENT_NAME_BACK_TO_MAIN,
  EVENT_NAME_COMPANY_LIST,
  EVENT_NAME_OIL_SHOWN, EVENT_NAME_OPT_IN_BUTTON_CLICKED,
  EVENT_NAME_POI_OPT_IN,
  EVENT_NAME_SOI_OPT_IN,
  EVENT_NAME_THIRD_PARTY_LIST,
  EVENT_NAME_TIMEOUT,
  JS_CLASS_BUTTON_ADVANCED_SETTINGS,
  JS_CLASS_BUTTON_OILBACK,
  JS_CLASS_BUTTON_OPTIN,
  OIL_CONFIG_CPC_TYPES,
  PRIVACY_MINIMUM_TRACKING
} from '../core/core_constants';
import { oilOptIn, oilPowerOptIn } from './userview_optin';
import { deActivatePowerOptIn } from '../core/core_poi';
import { oilDefaultTemplate } from './view/oil.default';
import { oilNoCookiesTemplate } from './view/oil.no.cookies';
import * as AdvancedSettingsStandard from './view/oil.advanced.settings.standard';
import * as AdvancedSettingsTabs from './view/oil.advanced.settings.tabs';
import { logError, logInfo } from '../core/core_log';
import { getCpcType, getTimeOutValue, isOptoutConfirmRequired, isPersistMinimumTracking, getBannerPosition, getBannerAnimation } from './userview_config';
import { gdprApplies, getAdvancedSettingsPurposesDefault, isInfoBannerOnly, isPoiActive } from '../core/core_config';
import { applyPrivacySettings, getPrivacySettings, applyAdditionalConsent } from './userview_privacy';
import { activateOptoutConfirm } from './userview_optout_confirm';
import { getPurposeIds, loadVendorListAndCustomVendorList} from '../core/core_vendor_lists';

import { manageDomElementActivation } from '../core/core_tag_management';
import { sendConsentInformationToCustomVendors } from '../core/core_custom_vendors';
import { getAllPreferences } from '../core/core_consents';
import { getVisualConfig, getDefaultVisualConfig } from '../userview/userview_config';
import { updateTcfApi, writeSettings, readSettings } from '../core/core_tcf_api';
// Initialize our Oil wrapper and save it ...

export const oilWrapper = defineOilWrapper;
export let hasRunningTimeout;

export function stopTimeOut() {
  if (hasRunningTimeout) {
    clearTimeout(hasRunningTimeout);
    hasRunningTimeout = undefined;
  }
}

/**
 * Utility function for forEach safety
 */
export function forEach(array, callback, scope) {
  for (let i = 0; i < array.length; i++) {
    callback.call(scope, array[i]);
  }
}

export function renderOil(props) {
  if (shouldRenderOilLayer(props)) {
    if (props.noCookie) {
      renderOilContentToWrapper(oilNoCookiesTemplate());
    } else if (props.advancedSettings) {
      // we do not need to load vendor list and poi groups here - this is only invoked via oilShowPreferenceCenter() method that has done it before
      renderOilContentToWrapper(findAdvancedSettingsTemplate());
    } else {
      startTimeOut();
      renderOilContentToWrapper(oilDefaultTemplate());
    }
    sendEventToHostSite(EVENT_NAME_OIL_SHOWN);
  } else {
    removeOilWrapperFromDOM();
  }
}

export function oilShowPreferenceCenter(mode) {
  // We need the PowerGroupUi-Stuff for the CPC

  import('../poi-list/poi-info.js');

  // We need to make sure the vendor list is loaded before showing the cpc
  loadVendorListAndCustomVendorList()
    .then(() => {
      // then we want the group list because it may contain group-wide iabVendorWhitelist or iabVendorBlacklist
      import('../poi-list/poi.group.list.js').then(poi_group_list => {
        poi_group_list.getGroupList().then(() => {
          let wrapper = document.querySelector('.as-oil');
          let entryNode = document.querySelector('#oil-preference-center');
          if (wrapper || mode === 'absolute') {
            renderOil({ advancedSettings: true });
          } else if (entryNode) {
            entryNode.innerHTML = findAdvancedSettingsInlineTemplate();
            setWrapperStyles(entryNode);
            addOilHandlers(getOilDOMNodes());
          } else {
            logError('No wrapper for the CPC with the id #oil-preference-center was found.');
            return;
          }
          //TODO: Fill and Apply Preferences
          let mobile = 0;
          applyPrivacySettings(mobile ? getSettingsFromMobile() : getSettingsFromCookie());
        });
      });
    })
    .catch((error) => logError(error));
}

function getSettingsFromCookie() {
  let soiCookie = getSoiCookie();
  let consentData = soiCookie.opt_in ? soiCookie.consentData : undefined;
  let addtlConsent = soiCookie.opt_in ? soiCookie.addtlConsent : ADDITIONAL_CONSENT_VERSION;

  let cookiePrivacySettings;
  if (consentData && addtlConsent) {
    cookiePrivacySettings = getAllPreferences(consentData, addtlConsent);
  } else {
    cookiePrivacySettings = [];
  }

  console.log(JSON.stringify(cookiePrivacySettings));
  return cookiePrivacySettings;
}

function getSettingsFromMobile() {
  return readSettings();
}

function handleOptInBtn() {
  sendEventToHostSite(EVENT_NAME_OPT_IN_BUTTON_CLICKED);
  handleOptIn();
}
export function handleOptIn() {
  console.log('handleOptIn')
  stopTimeOut();
  if (isPoiActive()) {
    import('../poi-list/poi.group.list.js').then(poi_group_list => {
      poi_group_list.getGroupList().then(() => {
        (handlePoiOptIn()).then(onOptInComplete);
      });
    });
  } else {
    (handleSoiOptIn()).then(onOptInComplete);
  }
  animateOptInButton();
}

function onOptInComplete() {
  let commandCollectionExecutor = getGlobalOilObject('commandCollectionExecutor');
  if (commandCollectionExecutor) {
    commandCollectionExecutor();
  }
  sendConsentInformationToCustomVendors().then(() => logInfo('Consent information sending to custom vendors after user\'s opt-in finished!'));
  manageDomElementActivation();
  updateTcfApi(getSoiCookie(), false, getSoiCookie().addtlConsent);
  writeSettings();
  if (document.querySelector('#oil-preference-center')) {
    document.querySelector('#oil-preference-center').innerHTML = '';
  }
}

function shouldRenderOilLayer(props) {
  // first condition makes sure that optIn has to be true and nothing else is allowed. So leave it as ugly as it is
  return props.optIn !== true && gdprApplies();
}

function startTimeOut() {
  if (!hasRunningTimeout && getTimeOutValue() > 0) {
    logInfo('OIL will auto-hide in', getTimeOutValue(), 'seconds.');
    hasRunningTimeout = setTimeout(function () {
      removeOilWrapperFromDOM();
      sendEventToHostSite(EVENT_NAME_TIMEOUT);
      if (isInfoBannerOnly()) {
        handleOptIn();
      }
      hasRunningTimeout = undefined;
    }, getTimeOutValue() * 1000);
  }
}

function findAdvancedSettingsTemplate() {
  const cpcType = getCpcType();
  switch (cpcType) {
    case OIL_CONFIG_CPC_TYPES.CPC_TYPE_STANDARD:
      return AdvancedSettingsStandard.oilAdvancedSettingsTemplate();
    case OIL_CONFIG_CPC_TYPES.CPC_TYPE_TABS:
      return AdvancedSettingsTabs.oilAdvancedSettingsTemplate();
    default:
      logError(`Found unknown CPC type '${cpcType}'! Falling back to CPC type '${OIL_CONFIG_CPC_TYPES.CPC_TYPE_STANDARD}'!`);
      return AdvancedSettingsStandard.oilAdvancedSettingsTemplate();
  }
}

function findAdvancedSettingsInlineTemplate() {
  const cpcType = getCpcType();
  switch (cpcType) {
    case OIL_CONFIG_CPC_TYPES.CPC_TYPE_STANDARD:
      return AdvancedSettingsStandard.oilAdvancedSettingsInlineTemplate();
    case OIL_CONFIG_CPC_TYPES.CPC_TYPE_TABS:
      return AdvancedSettingsTabs.oilAdvancedSettingsInlineTemplate();
    default:
      logError(`Found unknown CPC type '${cpcType}'! Falling back to CPC type '${OIL_CONFIG_CPC_TYPES.CPC_TYPE_STANDARD}'!`);
      return AdvancedSettingsStandard.oilAdvancedSettingsInlineTemplate();
  }
}

function attachCpcEventHandlers() {
  if (isOptoutConfirmRequired()) {
    activateOptoutConfirm();
  }

  const cpcType = getCpcType();
  switch (cpcType) {
    case OIL_CONFIG_CPC_TYPES.CPC_TYPE_STANDARD:
      AdvancedSettingsStandard.attachCpcHandlers();
      break;
    case OIL_CONFIG_CPC_TYPES.CPC_TYPE_TABS:
      AdvancedSettingsTabs.attachCpcHandlers();
      break;
    default:
      logError(`Found unknown CPC type '${cpcType}'! Falling back to CPC type '${OIL_CONFIG_CPC_TYPES.CPC_TYPE_STANDARD}'!`);
      AdvancedSettingsStandard.attachCpcHandlers();
      break;
  }
}

function oilShowCompanyList() {
  import('../poi-list/poi-info.js')
    .then(poiList => {
      poiList.renderOilGroupListTemplate(renderOilContentToWrapper);
    })
    .catch((e) => {
      logError('Error on oilShowCompanyList.', e);
    });
}

function oilShowThirdPartyList() {
  import('../poi-list/poi-info.js')
    .then(poiList => {
      poiList.renderOilThirdPartyListTemplate(renderOilContentToWrapper);
    })
    .catch((e) => {
      logError('Error on oilShowThirdPartyList.', e);
    });
}

/**
 * Define Oil Wrapper DOM Node
 * @return object DOM element
 */
function defineOilWrapper() {
  let oilWrapper = document.createElement('div');
  // Set some attributes as CSS classes and attributes for testing
  oilWrapper.setAttribute('class', `as-oil ${getBannerPosition()} ${getBannerAnimation()}`);
  oilWrapper.setAttribute('data-qa', 'oil-Layer');
  return oilWrapper;
}

/**
 * Define Content of our Oil Wrapper
 * Sets HTML based on props ...
 */
function renderOilContentToWrapper(content) {
  let wrapper = oilWrapper();
  wrapper.innerHTML = content;
  setWrapperStyles(wrapper);
  injectOilWrapperInDOM(wrapper);
}

function setWrapperStyles(wrapper) {
  setColorVariables(wrapper);
  setFontBaseSize(wrapper);
  setFontFamily(wrapper);
  setTabsBlur(wrapper);
  setContentBlur(wrapper);
}

function setTabsBlur(wrapper) {
  let scrollable = wrapper.querySelector('.as-oil-cpc__left');
  let scrollableWrapper = wrapper.querySelector('.as-oil-cpc__left-wrapper');
  if (scrollableWrapper) { 
    scrollableWrapper.addEventListener('scroll', e => {
      if (e.target.scrollLeft > 0) {
        scrollable.classList.remove('scroll-tabs-end');
        scrollable.classList.add('scroll-tabs-start');
      } else {
        scrollable.classList.add('scroll-tabs-end');
        scrollable.classList.remove('scroll-tabs-start');
      }
    });
  }
}

function setContentBlur(wrapper) {
  let scrollable = wrapper.querySelector('.as-oil-cpc__middle');
  let scrollableWrapper = wrapper.querySelector('.as-oil-cpc__middle-wrapper');
  if (scrollableWrapper) { 
    scrollableWrapper.addEventListener('scroll', e => {
      if (e.target.scrollTop > 0) {
        scrollable.classList.add('scroll-content-start');
        scrollable.classList.add('scroll-content-end');
        if (e.target.scrollTop === e.target.scrollHeight - e.target.offsetHeight - 1) {
          scrollable.classList.remove('scroll-content-end');
        }
      } else {
        scrollable.classList.add('scroll-content-end');
        scrollable.classList.remove('scroll-content-start');
      }
    });
  }
}

function setColorVariables(wrapper) {
  let default_colors = getDefaultVisualConfig().colors;
  let config_colors = getVisualConfig().colors;

  Object.entries(default_colors).forEach(([key, value]) => {
    if (config_colors[key] !== undefined) {
      wrapper.style.setProperty(`--avacy_${key}`,config_colors[key])
    } else {
      wrapper.style.setProperty(`--avacy_${key}`,value)
    }
  });
}

function setFontBaseSize(wrapper) {
  let default_font_base_scale= getDefaultVisualConfig().font_base_scale;
  let font_base_scale = getVisualConfig().font_base_scale;

  if (font_base_scale !== undefined) {
    wrapper.style.setProperty('--avacy_font_base_scale',font_base_scale)
  } else {
    wrapper.style.setProperty('--avacy_font_base_scale',default_font_base_scale)
  }
}

function setFontFamily(wrapper) {
  let default_font_family = getDefaultVisualConfig().font_family;
  let font_family = getVisualConfig().font_family;

  if (font_family !== undefined) {
    wrapper.style.setProperty('--avacy_font_family',font_family)
  } else {
    wrapper.style.setProperty('--avacy_font_family',default_font_family)
  }
}

function removeOilWrapperFromDOM() {
  let domNodes = getOilDOMNodes();
  // For every render cycle our OIL main DOM node gets removed, in case it already exists in DOM
  if (domNodes.oilWrapper) {
    forEach(domNodes.oilWrapper, function (domNode) {
      domNode.parentElement.removeChild(domNode);
    });
  }
}

function injectOilWrapperInDOM(wrapper) {
  removeOilWrapperFromDOM();

  // Insert OIL into DOM
  document.body.insertBefore(wrapper, document.body.firstElementChild);
  addOilHandlers(getOilDOMNodes());
}

/**
 * Small Utility Function to retrieve our Oil Wrapper and Action Elements,
 * like Buttons ...
 * @return data object which contains various OIL DOM nodes
 */
function getOilDOMNodes() {
  return {
    oilWrapper: document.querySelectorAll('.as-oil'),
    btnOptIn: document.querySelectorAll(`.${JS_CLASS_BUTTON_OPTIN}`),
    btnPoiOptIn: document.querySelectorAll('.as-js-optin-poi'),
    companyList: document.querySelectorAll('.as-js-companyList'),
    thirdPartyList: document.querySelectorAll('.as-js-thirdPartyList'),
    btnAdvancedSettings: document.querySelectorAll(`.${JS_CLASS_BUTTON_ADVANCED_SETTINGS}`),
    btnBack: document.querySelectorAll(`.${JS_CLASS_BUTTON_OILBACK}`)
  };
}

function handleBackToMainDialog() {
  logInfo('Handling Back Button');
  stopTimeOut();
  renderOil({});
  sendEventToHostSite(EVENT_NAME_BACK_TO_MAIN);
}

function handleAdvancedSettings() {
  logInfo('Handling Show Advanced Settings');
  stopTimeOut();
  oilShowPreferenceCenter();
  sendEventToHostSite(EVENT_NAME_ADVANCED_SETTINGS);
}

function handleCompanyList() {
  logInfo('Handling Show Company List');
  stopTimeOut();
  oilShowCompanyList();
  sendEventToHostSite(EVENT_NAME_COMPANY_LIST);
}

function handleThirdPartyList() {
  logInfo('Handling Show Third Party List');
  stopTimeOut();
  oilShowThirdPartyList();
  sendEventToHostSite(EVENT_NAME_THIRD_PARTY_LIST);
}

function animateOptInButton() {
  let optInButton = document.querySelector(`.${JS_CLASS_BUTTON_OPTIN}`);
  if (optInButton) {
    optInButton.className += ' as-oil__btn-optin-clicked';
    window.setTimeout(() => {
      optInButton.className = optInButton.className.replace(' as-js-clicked', '');
    }, 1200);
  }
}

function handleSoiOptIn() {
  let privacySetting = getPrivacySettings();
  logInfo('Handling SOI with settings: ', privacySetting);
  trackPrivacySettings(privacySetting);

  if (shouldPrivacySettingBeStored(privacySetting)) {
    return oilOptIn(privacySetting).then(() => {
      // FIXME should remove Wrapper
      renderOil({ optIn: true });
      sendEventToHostSite(EVENT_NAME_SOI_OPT_IN);
    });
  } else {
    return new Promise(resolve => {
      removeSubscriberCookies();
      resolve();
    });
  }
}

function handlePoiOptIn() {
  let privacySetting = getPrivacySettings();
  logInfo('Handling POI with settings: ', privacySetting);
  trackPrivacySettings(privacySetting);

  if (shouldPrivacySettingBeStored(privacySetting)) {
    return oilPowerOptIn(privacySetting).then(() => {
      // FIXME should remove Wrapper
      renderOil({ optIn: true });
      if (isPoiActive()) {
        sendEventToHostSite(EVENT_NAME_POI_OPT_IN);
      }
    });
  } else {
    removeSubscriberCookies();
    return deActivatePowerOptIn();
  }
}

function trackPrivacySettings(privacySetting) {
  if (isObject(privacySetting)) {
    sendEventToHostSite(EVENT_NAME_AS_PRIVACY_SELECTED);
  }
}

function shouldPrivacySettingBeStored(privacySetting) {
  return privacySetting !== PRIVACY_MINIMUM_TRACKING || isPersistMinimumTracking();
}

/**
 * adds a listener to all dom nodes in this list
 *
 * @param {array} listOfDoms, can be null, as any kind of iterable
 * @param {function} listener as callable function
 */
function addEventListenersToDOMList(listOfDoms, listener) {
  if (listOfDoms) {
    forEach(listOfDoms, function (domNode) {
      domNode && domNode.addEventListener('click', listener, false);
    });
  }
}

function addOilHandlers(nodes) {
  addEventListenersToDOMList(nodes.btnOptIn, handleOptInBtn);
  addEventListenersToDOMList(nodes.btnAdvancedSettings, handleAdvancedSettings);
  addEventListenersToDOMList(nodes.btnBack, handleBackToMainDialog);
  addEventListenersToDOMList(nodes.companyList, handleCompanyList);
  addEventListenersToDOMList(nodes.thirdPartyList, handleThirdPartyList);
  attachCpcEventHandlers();
}
