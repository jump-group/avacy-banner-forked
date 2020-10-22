import { getSoiCookie } from '../core/core_cookies';
import { PRIVACY_FULL_TRACKING, ADDITIONAL_CONSENT_VERSION } from '../core/core_constants';
import { logInfo } from '../core/core_log';
import { forEach } from './userview_modal';
import { getPurposes, getSpecialFeatures, getVendorIds, getAdditionalConsentList } from '../core/core_vendor_lists';
import { replace } from 'core-js/fn/symbol';

export function getSoiConsentData() {
  let soiCookie = getSoiCookie();
  return soiCookie.opt_in ? soiCookie.consentData : undefined;
}

/**
 * If the CPC is visible it returns the settings from the CPC,
 * otherwise '1' is returned for 'full tracking'
 *
 * @returns {Object,number}
 *  "0": if no checkbox is marked
 *  "1": if all checkboxes are marked or if
 *  "{}": if there are multiple checkboxes
 */
export function getPrivacySettings() {
  //TODO: prendere i dati corretti dal pannello 
  if (document.querySelector('.as-oil-cpc-wrapper')) {
    let purpose = {};
    let specialFeature = {}
    let vendor = {}
    let addtlConsent = [];

    const purposeSliders = document.querySelectorAll('.as-js-purpose-slider');
    purposeSliders && forEach(purposeSliders, (element) => {
      let element_id = element.dataset ? element.dataset.id : element.getAttribute('data-id');
      if (purpose[element_id] !== undefined) {
        purpose[element_id].consent = element.checked;
      } else {
        purpose[element_id] = {};
        purpose[element_id].consent = element.checked;
      }
    }, this);

    const purposeLegintSliders = document.querySelectorAll('.as-js-purpose-legint-slider');
    purposeLegintSliders && forEach(purposeLegintSliders, (element) => {
      let element_id = element.dataset ? element.dataset.id : element.getAttribute('data-id');
      if (purpose[element_id] !== undefined) {
        purpose[element_id].legint = element.checked;
      } else {
        purpose[element_id] = {};
        purpose[element_id].legint = element.checked;
      }
    }, this);

    const specialFeatureSliders = document.querySelectorAll('.as-js-specialFeature-slider');
    specialFeatureSliders && forEach(specialFeatureSliders, (element) => {
      let element_id = element.dataset ? element.dataset.id : element.getAttribute('data-id');
      if (specialFeature[element_id] !== undefined) {
        specialFeature[element_id].optin = element.checked;
      } else {
        specialFeature[element_id] = {};
        specialFeature[element_id].optin = element.checked;
      }
    }, this);

    const vendorSliders = document.querySelectorAll('.as-js-vendor-slider');
    vendorSliders && forEach(vendorSliders, (element) => {
      let element_id = element.dataset ? element.dataset.id : element.getAttribute('data-id');
      if (vendor[element_id] !== undefined) {
        vendor[element_id].consent = element.checked;
      } else {
        vendor[element_id] = {};
        vendor[element_id].consent = element.checked;
      }
    }, this);

    const vendorLegintSliders = document.querySelectorAll('.as-js-vendor-legint-slider');
    vendorLegintSliders && forEach(vendorLegintSliders, (element) => {
      let element_id = element.dataset ? element.dataset.id : element.getAttribute('data-id');
      if (vendor[element_id] !== undefined) {
        vendor[element_id].legint = element.checked;
      } else {
        vendor[element_id] = {};
        vendor[element_id].legint = element.checked;
      }
    }, this);

    const addtlConsentSliders = document.querySelectorAll('.as-js-additional-consent-slider');
    addtlConsentSliders && forEach(addtlConsentSliders, (element) => {
      let element_id = element.dataset ? element.dataset.id : element.getAttribute('data-id');
      if (element.checked) {
        addtlConsent.push(element_id);
      }
    }, this);

    let addtlConsentString = ADDITIONAL_CONSENT_VERSION+addtlConsent.join('.');

    return {
      purpose: purpose,
      specialFeature: specialFeature,
      vendor: vendor,
      addtlConsent: addtlConsentString
    };
  }
  return PRIVACY_FULL_TRACKING;
}

export function applyPrivacySettings(privacySettings) {
  logInfo('Apply privacy settings from cookie', privacySettings);

  if (privacySettings.length === 0) {
    return;
  }

  applyPurposesSettings(privacySettings.purpose);
  applySpecialFeaturesSettings(privacySettings.specialFeature);
  applyVendorsSettings(privacySettings.vendor);
}

export function applyAdditionalConsent(addtlConsentString) {
  logInfo('Apply Additional Consent from cookie', addtlConsentString);

  if (addtlConsentString === ADDITIONAL_CONSENT_VERSION) {
    return;
  }

  let providerList = addtlConsentString.replace(ADDITIONAL_CONSENT_VERSION, '').split('.');
  const addtlConsentSliders = document.querySelectorAll('.as-js-additional-consent-slider');

  addtlConsentSliders.forEach(element => {
    if (providerList.includes(element.dataset.id)) {
      element.checked = true;
    } else {
      element.checked = false;
    }
  });
}

function applyPurposesSettings(purposes) {
  for (let i = 1; i <= Object.keys(getPurposes()).length; i++) {
    if (purposes[i]) {
      document.querySelector(`#as-js-purpose-slider-${i}`) && (document.querySelector(`#as-js-purpose-slider-${i}`).checked = purposes[i].consent);
      document.querySelector(`#as-js-legint-slider-${i}`) && (document.querySelector(`#as-js-legint-slider-${i}`).checked = purposes[i].legint);
    } else {
      document.querySelector(`#as-js-purpose-slider-${i}`) && (document.querySelector(`#as-js-purpose-slider-${i}`).checked = false);
      document.querySelector(`#as-js-legint-slider-${i}`) && (document.querySelector(`#as-js-legint-slider-${i}`).checked = false);
    }
  }
}

function applySpecialFeaturesSettings(specialFeatures) {
  for (let i = 1; i <= Object.keys(getSpecialFeatures()).length; i++) {
    if (specialFeatures[i]) {
      (document.querySelector(`#as-js-specialFeature-slider-${i}`).checked = specialFeatures[i].optin);
    } else {
      (document.querySelector(`#as-js-specialFeature-slider-${i}`).checked = false);
    }
  }
}

function applyVendorsSettings(vendors) {
  getVendorIds().forEach(id => {
    if (vendors[id]) {
      document.querySelector(`#as-js-vendor-legint-slider-${id}`) && (document.querySelector(`#as-js-vendor-legint-slider-${id}`).checked = vendors[id].legint);
      document.querySelector(`#as-js-vendor-slider-${id}`) && (document.querySelector(`#as-js-vendor-slider-${id}`).checked = vendors[id].consent);
    } else {
      document.querySelector(`#as-js-vendor-legint-slider-${id}`) && (document.querySelector(`#as-js-vendor-legint-slider-${id}`).checked = false);
      document.querySelector(`#as-js-vendor-slider-${id}`) && (document.querySelector(`#as-js-vendor-slider-${id}`).checked = false);
    }
  });
}

