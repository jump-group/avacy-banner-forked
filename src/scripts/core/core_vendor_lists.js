//REVIEW: changes in todo comments @tcf2
import { getCustomVendorListUrl, getAdditionalConsentListUrl, getIabVendorBlacklist, getIabVendorListDomain, getIabVendorWhitelist, getShowLimitedVendors, getLanguageFromConfigObject, getAtpWhitelist, getRequiredStacks } from './core_config';
import { logError, logInfo } from './core_log';
import { fetchJsonData } from './core_utils';
import { GVL } from '@iabtcf/core';
import { forEach } from '../userview/userview_modal';

export const DEFAULT_VENDOR_LIST = {
  vendorListVersion: 36, //TODO: @tcf2 @tc2soi
  maxVendorId: 747, //TODO @tcf2 @tc2soi
  lastUpdated: '2018-05-30T16:00:15Z', //TODO @tcf2 @tc2soi
  purposeIds: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], //TODO @tcf2 @tc2soi
  legintIds: [2, 3, 4, 5, 6, 7, 8 , 9, 10],
  specialFeaturesIds: [1, 2]
};

export const DEFAULT_CUSTOM_VENDOR_LIST = {
  'vendorListVersion': -1, //TODO @tcf2 @tc2soi
  'isDefault': true,
  'vendors': []
};

export const DEFAULT_ADDITIONAL_CONSENT_LIST = {
  'providers': {}
};

export let cachedVendorList = null;
export let cachedCustomVendorList = null;
export let cachedAdditionalConsent = null;
export let pendingVendorListPromise = null;
let cachedGVL = null;
let gvlPromise = null;

export function loadVendorListAndCustomVendorList() {
  //TODO @tcf2 load from API @tc2soi
  if (cachedVendorList && cachedCustomVendorList && cachedAdditionalConsent) {
    return new Promise(resolve => {
      resolve();
    });
  } else if (pendingVendorListPromise) {
    return pendingVendorListPromise;
  } else {
    pendingVendorListPromise = new Promise(function (resolve) {
      getGlobalVendorListPromise()
        .then(response => {
          Promise.all([response, loadCustomVendorList(), loadAdditionalConsentList()]).then(() => {
            cachedVendorList = response;
            pendingVendorListPromise = null;
            resolve();
          });
        })
        .catch(error => {
          logError(`OIL getVendorList failed and returned error: ${error}. Falling back to default vendor list!`);
          Promise.all([loadCustomVendorList(), loadAdditionalConsentList()]).then(() => {
            pendingVendorListPromise = null;
            resolve();
          });
        });
    });

    return pendingVendorListPromise;
  }

}

export function loadCustomVendorList() {
  return new Promise(resolve => {
    let customVendorListUrl = getCustomVendorListUrl();
    let avacyBlocking = document.querySelector('#avacy-blocking');
    if (avacyBlocking) {
      cachedCustomVendorList = window.myCustomVendorlist;
      resolve();
    } else {
      if (!customVendorListUrl) {
        cachedCustomVendorList = DEFAULT_CUSTOM_VENDOR_LIST;
        resolve();
      } else {
        fetchJsonData(customVendorListUrl)
          .then(response => {
            cachedCustomVendorList = response;
            resolve();
          })
          .catch(error => {
            cachedCustomVendorList = DEFAULT_CUSTOM_VENDOR_LIST;
            logError(`OIL getCustomVendorList failed and returned error: ${error}. Falling back to default custom vendor list!`);
            resolve();
          });
      }
    }
  });
}

function loadAdditionalConsentList() {
  return new Promise(resolve => {
    let additionalConsentListUrl = getAdditionalConsentListUrl();
    if (!additionalConsentListUrl) {
      cachedAdditionalConsent = DEFAULT_ADDITIONAL_CONSENT_LIST;
      resolve();
    } else {
      fetchJsonData(additionalConsentListUrl)
        .then(response => {
          cachedAdditionalConsent = response;
          resolve();
        })
        .catch(error => {
          cachedAdditionalConsent = DEFAULT_ADDITIONAL_CONSENT_LIST;
          logError(`OIL getCustomVendorList failed and returned error: ${error}. Falling back to default custom vendor list!`);
          resolve();
        });
    }
  });
}

function getGlobalVendorList() {
  if(!cachedGVL) {
    GVL.baseUrl = getIabVendorListDomain();
    cachedGVL = new GVL();
    cachedGVL.readyPromise.then( () => {
      return cachedGVL;
    });
  }
  return cachedGVL;
}

async function getGlobalVendorListPromise() {
  let iabGvl = await getGlobalVendorList();
  
  let newLang = getLanguageFromConfigObject();
  return iabGvl.readyPromise.then(() => {
    return iabGvl.changeLanguage(newLang).then(() => {
      return iabGvl;
    });
  })

}

export function getFullPurposes() {
  return cachedVendorList ? cachedVendorList.purposes : expandIdsToObjects(DEFAULT_VENDOR_LIST.purposeIds);
}

export function getPurposes() {
  let purposes = cachedVendorList ? cachedVendorList.purposes : expandIdsToObjects(DEFAULT_VENDOR_LIST.purposeIds);
  //REVIEW: need changes? @tcf2
  if (getStacks()) {
    let mergedStackPurposes = []
    let filteredPurposes = {}

    forEach(Object.entries(getStacks()), ([key, value]) => {
      mergedStackPurposes = [...new Set([...mergedStackPurposes,...value.purposes])];
    })

    Object.keys(purposes).filter( (key) => {
      if (!mergedStackPurposes.sort().includes(+key)) {
        filteredPurposes[key] = purposes[key];
      }
    } );

    return filteredPurposes;
  }
  return purposes;
}

export function getStacks() {
  //REVIEW: need changes? @tcf2
  let vendorListStacks = cachedVendorList ? cachedVendorList.stacks : undefined;
  if (getRequiredStacks() && getRequiredStacks().length > 0) {
    let filteredStacks = {};
    Object.entries(vendorListStacks).filter(([key, value]) => {
      if (getRequiredStacks().includes(+key)) {
        filteredStacks[key] = value;
      }
    })

    return Object.fromEntries(Object.entries(filteredStacks).sort((a,b) => b[1]-a[1]));
  }

  return undefined;
}

export function getFullStacks() {
  if(getStacks() === undefined ) {
    return undefined;
  }
  return Object.entries(getStacks()).map(([key, value]) => {
    value.fullPurposes = {};
    forEach(value.purposes, el => {
      value.fullPurposes[el] = getFullPurposes()[el];
    })

    return value;
  });
}

export function getSpecialPurposes() {
  return cachedVendorList ? cachedVendorList.specialPurposes : null;
}

export function getFeatures() {
  return cachedVendorList ? cachedVendorList.features : null;
}

export function getLegitimateInterest() {
  return expandIdsToObjects(DEFAULT_VENDOR_LIST.legintIds);
}

export function getSpecialFeatures() {
  return cachedVendorList ? cachedVendorList.specialFeatures : expandIdsToObjects(DEFAULT_VENDOR_LIST.specialFeaturesIds);
}

export function getPurposeIds() {
  return Object.entries(getPurposes()).map(([index, value]) => value.id);
}

export function getLegintIds() {
  return Object.entries(getLegitimateInterest()).map(([index, value]) => value.id);
}

export function getSpecialFeatureIds() {
  return Object.entries(getSpecialFeatures()).map(([index, value]) => value.id);
}

export function getCustomVendorIds() {
  return Object.entries(getCustomVendorList().vendors).map(item => item);
}

export function getVendors() {
  //REVIEW: need changes? @tcf2a
  return cachedVendorList ? Object.values(cachedVendorList.vendors) : expandIdsToObjects(buildDefaultVendorIdList());
}

export function getVendorIds() {
  return getVendors().map(({ id }) => id);
}

export function getVendorList() {
  //REVIEW: need changes? @tcf2a
  if (cachedVendorList) {
    return cachedVendorList;
  }
  
  return getGlobalVendorList();

}

export function getCustomVendorList() {
  return cachedCustomVendorList ? cachedCustomVendorList : DEFAULT_CUSTOM_VENDOR_LIST;
}

export function getAdditionalConsentList() {
  let wholeAdditionalConsent = cachedAdditionalConsent ? cachedAdditionalConsent : DEFAULT_ADDITIONAL_CONSENT_LIST;
  let additionalConsentList = wholeAdditionalConsent.providers;
  let atpWhitelist = [];
  if (getAtpWhitelist() && getAtpWhitelist().length > 0) {     
    forEach(getAtpWhitelist(), element => {
      if (additionalConsentList[element] !== undefined ) {
        atpWhitelist[element] = additionalConsentList[element];
      }
    }) 
    return atpWhitelist;
  }
  return additionalConsentList;
}

export function getAllAdditionalConsentProviders() {
  let additionalConsentList = getAdditionalConsentList();

  if (typeof (additionalConsentList) === 'object') {
    additionalConsentList = Object.values(additionalConsentList)
  }

  return additionalConsentList.map(element => {
    return element.id;
  }).join('.')

}

export function getCustomVendorListVersion() {
  if (cachedCustomVendorList && !cachedCustomVendorList.isDefault) {
    return cachedCustomVendorList.vendorListVersion;
  }
  return undefined;
}

export function clearVendorListCache() {
  cachedVendorList = undefined;
  cachedCustomVendorList = undefined;
  pendingVendorListPromise = null;
  cachedGVL = null;
}

export function getVendorsToDisplay() {
  return getShowLimitedVendors() ? getLimitedVendors() : getVendors();
}

export function getLimitedVendors() {
  let vendors = getVendors();
  const limitedIds = getLimitedVendorIds();

  logInfo('limiting vendors');

  vendors = vendors.filter(vendor => limitedIds.indexOf(vendor.id) > -1);

  return vendors;
}

export function getLimitedVendorIds() {
  //REVIEW: need changes? @tcf2a
  let limited;
  if (!cachedVendorList) {
    limited = buildDefaultVendorIdList();
  } else {
    limited = getVendorIds();
  }
  const whitelist = getIabVendorWhitelist();
  const blacklist = getIabVendorBlacklist();

  if (whitelist && whitelist.length > 0) {
    limited = limited.filter(vendorId => whitelist.indexOf(vendorId) > -1);
  } else if (blacklist && blacklist.length > 0) {
    limited = limited.filter(vendorId => blacklist.indexOf(vendorId) === -1);
  }

  return limited;
}

// FIXME Refactor this code. Nobody can read it!
function buildDefaultVendorIdList() {
  return ((a, b) => {
    while (a--) {
      b[a] = a + 1;
    }
    return b;
  })(DEFAULT_VENDOR_LIST.maxVendorId, []);
}

/**
 * This function takes every element from the input array
 * and wraps it with as {id: element} object
 */
function expandIdsToObjects(idArray) {
  return idArray.map(anId => ({ 'id': anId }));
}
