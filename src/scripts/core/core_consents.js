import { forEach } from './../userview/userview_modal';

//function to get purposes from TCModel
export function getPurposesAllowed(TCModel) {
  return getLegalBasisPreferences(TCModel, 'purpose');
}

export function getVendorsAllowed(TCModel) {
  return getLegalBasisPreferences(TCModel, 'vendor');
}

export function getSpecialFeaturesAllowed(TCModel) {
  return getOptinsPreferences(TCModel, 'specialFeature');
}

export function getAllPreferences(TCModel, addtlConsent, customVendor) {
  return {
    addtlConsent: addtlConsent,
    purpose: getPurposesAllowed(TCModel),
    vendor: getVendorsAllowed(TCModel),
    customVendor: customVendor,
    specialFeature: getSpecialFeaturesAllowed(TCModel)
  }
}

function getLegalBasisPreferences(TCModel, category) {

  let consentMethod = category + 'Consents';
  let legintMethod = category + 'LegitimateInterests';

  let categoryLegalBasis = {};

  forEach(TCModel[consentMethod], (checked, id) => {
    if (checked) {
      if (!categoryLegalBasis[id]) {
        categoryLegalBasis[id] = {}
      }
      categoryLegalBasis[id].consent = true;
    }
  })

  forEach(TCModel[legintMethod], (checked, id) => {
    if (checked) {
      if (!categoryLegalBasis[id]) {
        categoryLegalBasis[id] = {}
      }
      categoryLegalBasis[id].legint = true;
    }
  });

  return categoryLegalBasis;
}


function getOptinsPreferences(TCModel, category) {

  let consentMethod = category + 'Optins';

  let categoryOptins = {};

  forEach(TCModel[consentMethod], (checked, id) => {
    if (checked) {
      if (!categoryOptins[id]) {
        categoryOptins[id] = {}
      }
      categoryOptins[id].optin = true;
    }
  })

  return categoryOptins;
}