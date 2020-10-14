//REVIEW: changes in todo comments @tcf2
import { getCustomVendorListUrl, getIabVendorBlacklist, getIabVendorListDomain, getIabVendorWhitelist, getShowLimitedVendors, getLanguageFromConfigObject } from './core_config';
import { logError, logInfo } from './core_log';
import { fetchJsonData } from './core_utils';
import { GVL } from '@iabtcf/core';

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

export let cachedVendorList = null;
export let cachedCustomVendorList = null;
export let pendingVendorListPromise = null;
let cachedGVL = null;

export function loadVendorListAndCustomVendorList() {
  //TODO @tcf2 load from API @tc2soi
  if (cachedVendorList && cachedCustomVendorList) {
    return new Promise(resolve => {
      resolve();
    });
  } else if (pendingVendorListPromise) {
    return pendingVendorListPromise;
  } else {
    pendingVendorListPromise = new Promise(function (resolve) {
      getGlobalVendorListPromise()
        .then(response => {
          cachedVendorList = response;
          loadCustomVendorList().then(() => {
            pendingVendorListPromise = null;
            resolve();
          });
        })
        .catch(error => {
          logError(`OIL getVendorList failed and returned error: ${error}. Falling back to default vendor list!`);
          loadCustomVendorList().then(() => {
            pendingVendorListPromise = null;
            resolve();
          });
        });
    });

    return pendingVendorListPromise;
  }

}

function loadCustomVendorList() {
  return new Promise(resolve => {
    let customVendorListUrl = getCustomVendorListUrl();
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
  });
}

function getGlobalVendorList() {
  //TODO: Per ora ho commentato il seguente if, ma è da rivedere;
  // if (cachedGVL) {
  //   return cachedGVL;
  // }
  
  GVL.baseUrl = getIabVendorListDomain();

  cachedGVL = new GVL();
  return cachedGVL;
}

function getGlobalVendorListPromise() {

  let iabGvl = getGlobalVendorList();

  let newLang = getLanguageFromConfigObject();
  return iabGvl.changeLanguage(newLang).then(() => {
    return iabGvl;
  });

}

export function getPurposes() {
  //REVIEW: need changes? @tcf2
  return cachedVendorList ? cachedVendorList.purposes : expandIdsToObjects(DEFAULT_VENDOR_LIST.purposeIds);
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
