import '../../../styles/cpc_standard.scss';
import { getCustomPurposes, getCustomVendorListUrl, getAdditionalConsentListUrl, getLanguageFromConfigObject, getTcfPurposeOneTreatment } from '../../core/core_config'
import { JS_CLASS_BUTTON_OPTIN, OIL_GLOBAL_OBJECT_NAME } from '../../core/core_constants';
import { getCustomVendorList, getAdditionalConsentList, getFeatures, getPurposes, getSpecialFeatures, getSpecialPurposes, getVendorList, getVendorsToDisplay, getStacks, getFullStacks } from '../../core/core_vendor_lists';
import { getLabel, getLabelWithDefault, useLegint } from '../userview_config';
import { OIL_LABELS } from '../userview_constants';
import { forEach } from '../userview_modal';
import { BackButton, YesButton } from './components/oil.buttons';
import moment from 'moment';
const CLASS_NAME_FOR_ACTIVE_MENU_SECTION = 'as-oil-cpc__category-link--active';

export function oilAdvancedSettingsTemplate() {
  return `
  <div id="as-oil-cpc" class="as-oil-content-overlay" data-qa="oil-cpc-overlay">
    ${oilAdvancedSettingsInlineTemplate()}
  </div>`
}

export function oilAdvancedSettingsInlineTemplate() {
  return `<div class="as-oil-l-wrapper-layout-max-width as-oil-cpc-wrapper">
    <div class="as-oil__heading">
      ${getLabel(OIL_LABELS.ATTR_LABEL_CPC_HEADING)}
    </div>
    <p class="as-oil__intro-txt">
      ${getLabel(OIL_LABELS.ATTR_LABEL_CPC_TEXT)}
    </p>
    ${ActivateButtonSnippet()}
    ${window.AS_OIL.isInCollection('oil_has_optedin') || window.AS_OIL.isInCollection('oil_optin_done') ? '' : BackButton()}
    ${ContentSnippet()}
  </div>`
}

export function attachCpcHandlers() {
  forEach(document.querySelectorAll('.as-js-btn-activate-all'), (domNode) => {
    domNode && domNode.addEventListener('click', activateAll, false);
  });
  forEach(document.querySelectorAll('.as-js-btn-deactivate-all'), (domNode) => {
    domNode && domNode.addEventListener('click', deactivateAll, false);
  });
  forEach(document.querySelectorAll('.as-js-stack-slider'), (domNode) => {
    domNode && domNode.addEventListener('change', stacksToggles, false);
  });
  forEach(document.querySelectorAll('.as-js-btn-object-all'), (domNode) => {
    domNode && domNode.addEventListener('change', objectAllLegint(domNode), false);
  });
  forEach(document.querySelectorAll('.js-stack .as-js-purpose-slider'), (domNode) => {
    domNode && domNode.addEventListener('change', stacksObjectStatus, false);
  });
  forEach(document.querySelectorAll('.js-legint-info'), (domNode) => {
    domNode && domNode.addEventListener('click', legIntInfoPanel, false);
  });
  forEach(document.querySelectorAll('.js-disclosure-url'), (domNode) => {
    domNode && domNode.addEventListener('click', discloseUrlPanel, false);
  });
  forEach(document.querySelectorAll('.js-cpc-category-link'), (domNode) => {
    domNode && domNode.addEventListener('click', switchCpcCategory, false);
  });
  forEach(document.querySelectorAll('a[href="#privacy-policy"]'), (domNode) => {
    domNode && domNode.addEventListener('click', privacyPolicyInfoPanel, false);
  });
  forEach(document.querySelectorAll('a[href="#cookie-policy"]'), (domNode) => {
    domNode && domNode.addEventListener('click', cookiePolicyInfoPanel, false);
  });
  forEach(document.querySelectorAll('input[type="checkbox"][name^="oil-cpc"]'), (domNode) => {
    domNode && domNode.addEventListener('change', changeState, false);
  });
}


const ContentSnippet = () => {
  return `
<div data-qa="cpc-snippet" class="as-oil-l-row as-oil-cpc__content">
  <div class="as-oil-cpc__left scroll-tabs-end">
    <div class="as-oil-cpc__left-wrapper">
      <a href="#as-oil-cpc-purposes" class="js-cpc-category-link as-oil-cpc__category-link ${CLASS_NAME_FOR_ACTIVE_MENU_SECTION}">
        ${getLabel(OIL_LABELS.ATTR_LABEL_CPC_PURPOSE_TITLE)}
      </a>
      <a href="#as-oil-cpc-special-purposes" class="js-cpc-category-link as-oil-cpc__category-link">
        ${getLabel(OIL_LABELS.ATTR_LABEL_CPC_SPECIAL_PURPOSE_TITLE)}
      </a>
      <a href="#as-oil-cpc-features" class="js-cpc-category-link as-oil-cpc__category-link">
      ${getLabel(OIL_LABELS.ATTR_LABEL_CPC_FEATURE_TITLE)}
      </a>
      <a href="#as-oil-cpc-special-features" class="js-cpc-category-link as-oil-cpc__category-link">
        ${getLabel(OIL_LABELS.ATTR_LABEL_CPC_SPECIAL_FEATURE_TITLE)}
      </a>
      <a href="#as-oil-cpc-third-parties" class="js-cpc-category-link as-oil-cpc__category-link">
        ${getLabel(OIL_LABELS.ATTR_LABEL_THIRD_PARTY)}
      </a>
      ${IsCustomVendorsEnables() ? `
        <a href="#as-oil-cpc-custom-third-parties" class="js-cpc-category-link as-oil-cpc__category-link">
          ${getLabel(OIL_LABELS.ATTR_LABEL_CUSTOM_THIRD_PARTY_HEADING)}
        </a>
      ` : ''}
      ${IsAdditionalConsentEnables() ? `
        <a href="#as-oil-cpc-additional-consent" class="js-cpc-category-link as-oil-cpc__category-link">
          ${getLabel(OIL_LABELS.ATTR_LABEL_ADDITIONAL_CONSENT_HEADING)}
        </a>
      ` : ''}
    </div>
  </div>
  <div class="as-oil-cpc__middle scroll-content-end as-js-purposes">
    <div class="as-oil-cpc__middle-wrapper">
      ${getPurposes() ? `
      <div class="as-oil-cpc__row-title" id="as-oil-cpc-purposes">
      ${getLabel(OIL_LABELS.ATTR_LABEL_CPC_PURPOSE_TITLE)}
      </div>
      ${buildPurposeEntries(getPurposes(), 'purpose')}
      ${getFullStacks() ? buildStackEntries(getFullStacks(), 'stack') : ''}
      ` : ''}

      ${getSpecialPurposes() ? `
      <div class="as-oil-cpc__row-title" id="as-oil-cpc-special-purposes">
        ${getLabel(OIL_LABELS.ATTR_LABEL_CPC_SPECIAL_PURPOSE_TITLE)}
      </div>
      ${buildPurposeEntries(getSpecialPurposes())}
      ` : ''}

      ${getFeatures() ? `
      <div class="as-oil-cpc__row-title" id="as-oil-cpc-features">
        ${getLabel(OIL_LABELS.ATTR_LABEL_CPC_FEATURE_TITLE)}
      </div>
      ${buildPurposeEntries(getFeatures())}
      ` : ''}

      ${getSpecialFeatures() ? `
      <div class="as-oil-cpc__row-title" id="as-oil-cpc-special-features">
        ${getLabel(OIL_LABELS.ATTR_LABEL_CPC_SPECIAL_FEATURE_TITLE)}
      </div>
      ${buildPurposeEntries(getSpecialFeatures(), 'specialFeature')}
      ` : ''}
      
      ${buildPurposeEntries(getCustomPurposes())}

      ${buildIabVendorList()}
      ${buildCustomVendorList()}
      ${buildAdditionalConsentList()}
    </div>
  </div>
  <div class="as-oil-cpc__right">
    <div class="as-oil-l-row as-oil-l-buttons">
      <div class="as-oil-l-item">
        ${YesButton(`as-oil__btn-tertiary ${JS_CLASS_BUTTON_OPTIN}`)}
      </div>
    </div>
  </div>
</div>`;
};

const StackContainerSnippet = ({ id, header, text, purposes, value, key }) => {
  return `
    <div class="as-oil-cpc__purpose Purpose js-stack">
        <div class="as-oil-cpc__purpose-container Purpose__Container js-stack-container">
            <div class="Purpose__Heading">
              <div class="as-oil-cpc__purpose-header Purpose__Title">${header}</div>
              <div class="Purpose__Switches">
                <label class="as-oil-cpc__switch Purpose__Switch Purpose__Switch--Consent">
                    <input data-id="${id}" id="as-js-${key}-slider-${id}" class="as-js-${key}-slider" type="checkbox" name="oil-cpc-${key}-${id}" value="${value}"/>
                    <span class="as-oil-cpc__slider Purpose__SwitchSlider"></span>
                </label>
              </div>
            </div>
            <div class="as-oil-cpc__purpose-text">${text}</div>
            ${snippetStackMore()}

            <div class="as-oil-cpc__stack-detail" style="display: none">
              ${buildPurposeEntries(purposes, 'purpose')}
            </div> 
        </div>
    </div>`
};

const PurposeContainerSnippet = ({ id, header, text, legalText, value, key }) => {
  legalText = legalText.replace(/(\r\n|\n|\r)/gm, '<br>').replace(/\*/gm, '<br>&#160;&hybull;');

  let hasLegInt;

  hasLegInt = Object.keys(getVendorList().getVendorsWithLegIntPurpose(id)).length;

  return `
    <div class="as-oil-cpc__purpose Purpose">
        <div class="as-oil-cpc__purpose-container Purpose__Container">
            <div class="Purpose__Heading">
              <div class="as-oil-cpc__purpose-header Purpose__Title">${header}</div>
              <div class="Purpose__Switches">
              ${key !== undefined ? `
                  <label class="as-oil-cpc__switch Purpose__Switch Purpose__Switch--Consent">
                      <input data-id="${id}" id="as-js-${key}-slider-${id}" class="as-js-${key}-slider" type="checkbox" name="oil-cpc-${key}-${id}" value="${value}"/>
                      <span class="as-oil-cpc__slider Purpose__SwitchSlider"></span>
                  </label>
              `: ''}
              </div>
            </div>
            <div class="as-oil-cpc__purpose-text">${text}</div>
            <div class="as-oil-cpc__purpose-legal-text" style="display: none">${legalText}</div>
            ${snippetTextMore()}
        </div>
        ${key !== undefined ? `              
          ${hasLegInt && useLegint() && (key !== 'specialFeature') ? `          
            ${snippetPurposeLengint(id, key, value)}
          `: ''}
        `: ''}
    </div>`
};

const snippetPurposeLengint = (id, key, value) => {
  return `
    <div class="LegintBlock">
      <span class="LegintBlock__Description">${getLabel(OIL_LABELS.ATTR_LABEL_CPC_LEGINT_BOX_TEXT)} <span class="LegintRejectPanel__Info js-legint-info">&#9432;</span></span>
      <label class="LegintBlock__Input">
          <input data-id="${id}" id="as-js-legint-slider-${id}" class="as-js-${key}-legint-slider" type="checkbox" name="oil-cpc-legint-${id}" value="${value}" checked/>
          <span class="LegintBlock__CheckBox"></span>
      </label>
    </div>
  `;
}

const snippetTextMore = () => {
  return `
    <span class="as-oil-cpc__purpose-more" onClick='${OIL_GLOBAL_OBJECT_NAME}._toggleMoreText(this)'>${getLabel(OIL_LABELS.ATTR_LABEL_CPC_READ_MORE)}</span>
  `;
}

const snippetStackMore = () => {
  return `
    <span class="as-oil-cpc__stack-more" onClick='${OIL_GLOBAL_OBJECT_NAME}._toggleMoreStack(this)'>${getLabel(OIL_LABELS.ATTR_LABEL_CPC_MORE_STACK)}</span>
  `;
}

const IsCustomVendorsEnables = () => {
  return !!getCustomVendorListUrl();
};

const IsAdditionalConsentEnables = () => {
  return !!getAdditionalConsentListUrl();
};

const buildIabVendorList = () => {
  return `
<div class="as-oil-cpc__row-title" id="as-oil-cpc-third-parties">
  ${getLabel(OIL_LABELS.ATTR_LABEL_THIRD_PARTY)}
  </div>
  ${getLabel(OIL_LABELS.ATTR_LABEL_THIRD_PARTY_DESCRIPTION) === OIL_LABELS.ATTR_LABEL_THIRD_PARTY_DESCRIPTION ? '' : `
    <div class="as-oil-cpc__row-thirdPartiesText">${getLabel(OIL_LABELS.ATTR_LABEL_THIRD_PARTY_DESCRIPTION)}</div>
  `}
  ${
    useLegint() ? `
    <div class="as-oil-cpc__object-legint">
      <div class="LegintRejectPanel">
        <span class="LegintRejectPanel__Title">
          ${getLabel(OIL_LABELS.ATTR_LABEL_THIRD_PARTY_OBJECT_LEGINT_BTN)}
          <span class="LegintRejectPanel__Info js-legint-info">&#9432;</span>
        </span>
        <label class="LegintRejectPanel__Switch as-oil-cpc__switch">
          <input class="as-js-btn-object-all" type="checkbox" name="oil-cpc-object-legint" value="" checked/>
          <span class="as-oil-cpc__slider"></span>
        </label>
      </div>
    </div>
    ` : ''
  }
  
<div id="as-js-third-parties-list">
  ${buildIabVendorEntries()}
</div>`
};


const buildCustomVendorList = () => {
  if (IsCustomVendorsEnables()) {
    return `
<div class="as-oil-cpc__row-title" id="as-oil-cpc-custom-third-parties">
  ${getLabel(OIL_LABELS.ATTR_LABEL_CUSTOM_THIRD_PARTY_HEADING)}
</div>
  ${getLabel(OIL_LABELS.ATTR_LABEL_CUSTOM_THIRD_PARTY_DESCRIPTION) === OIL_LABELS.ATTR_LABEL_CUSTOM_THIRD_PARTY_DESCRIPTION ? '' : `
  <div class="as-oil-cpc__row-customThirdPartiesText">${getLabel(OIL_LABELS.ATTR_LABEL_CUSTOM_THIRD_PARTY_DESCRIPTION)}</div>
  `}
<div id="as-oil-custom-third-parties-list">
  ${buildCustomVendorEntries()}
</div>`
  } else {
    return '';
  }
};

const buildAdditionalConsentList = () => {
  if (IsAdditionalConsentEnables()) {
    return `
<div class="as-oil-cpc__row-title" id="as-oil-cpc-additional-consent">
  ${getLabel(OIL_LABELS.ATTR_LABEL_ADDITIONAL_CONSENT_HEADING)}
</div>
  ${getLabel(OIL_LABELS.ATTR_LABEL_ADDITIONAL_CONSENT_DESCRIPTION) === OIL_LABELS.ATTR_LABEL_ADDITIONAL_CONSENT_DESCRIPTION ? '' : `
  <div class="as-oil-cpc__row-additionalContentText">${getLabel(OIL_LABELS.ATTR_LABEL_ADDITIONAL_CONSENT_DESCRIPTION)}</div>
  `}
<div id="as-oil-additional-consent-list">
  ${buildAdditionalConsentEntries()}
</div>`
  } else {
    return '';
  }
};

const buildIabVendorEntries = () => {
  let vendorList = getVendorList();

  if (vendorList && !vendorList.isDefault) {
    let listWrapped = getVendorsToDisplay();

    if (typeof (listWrapped) === 'object') {
      listWrapped = Object.values(listWrapped)
    }
    listWrapped = listWrapped.map((element) => {
      return buildVendorListEntry(element);
    });
    return `<div class="as-oil-poi-group-list">${listWrapped.join('')}</div>`;
  } else {
    return 'Missing vendor list! Maybe vendor list retrieval has failed! Please contact web administrator!';
  }
};

const buildCustomVendorEntries = () => {
  let customVendorList = getCustomVendorList();
  if (customVendorList && !customVendorList.isDefault) {
    
    let customVendors = customVendorList.vendors;
    if (typeof (customVendors) === 'object') {
      customVendors = Object.values(customVendors)
    }
    customVendors = customVendors.map((element) => {
      return buildCustomVendorListEntry(element);
    });
    return `<div class="as-oil-poi-group-list">${customVendors.join('')}</div>`;
  } else {
    return 'Missing custom vendor list! Maybe vendor list retrieval has failed! Please contact web administrator!';
  }
};

const buildAdditionalConsentEntries = () => {
  let additionalConsentList = getAdditionalConsentList();
  if (additionalConsentList) {
    if (typeof (additionalConsentList) === 'object') {
      additionalConsentList = Object.values(additionalConsentList)
    }
    additionalConsentList = additionalConsentList.map((element) => {
      return buildAdditionalConsentListEntry(element);
    });
    return `<div class="as-oil-poi-group-list">${additionalConsentList.join('')}</div>`;
  } else {
    return 'Missing custom vendor list! Maybe vendor list retrieval has failed! Please contact web administrator!';
  }
};

const buildVendorListEntry = (element) => {
  if (element.name) {
    return `
          <div class="as-oil-third-party-list-element Vendor">
              <span class="Vendor__Heading" onclick='${OIL_GLOBAL_OBJECT_NAME}._toggleViewElements(this)'>
                  <svg class='as-oil-icon-plus' width="10" height="10" viewBox="0 0 10 10" xmlns="http://www.w3.org/2000/svg">
                    <path d="M5.675 4.328H10v1.344H5.675V10h-1.35V5.672H0V4.328h4.325V0h1.35z" fill="#0068FF" fill-rule="evenodd" fill-opacity=".88"/>
                  </svg>
                  <svg class='as-oil-icon-minus' style='display: none;' width="10" height="5" viewBox="0 0 10 5" xmlns="http://www.w3.org/2000/svg">
                    <path d="M0 0h10v1.5H0z" fill="#3B7BE2" fill-rule="evenodd" opacity=".88"/>
                  </svg>
                  <span class='as-oil-third-party-name'>${element.name}</span>
              </span>
                ${snippetVendorConsent(element.id)}
              <div class='as-oil-third-party-toggle-part' style='display: none;'>
                <a class='as-oil-third-party-link' href='${element.policyUrl}'>${element.policyUrl}</a>  
                ${snippetLegalDescription(element.purposes, 'purposes', getLabel(OIL_LABELS.ATTR_LABEL_CPC_LEGAL_PURPOSE_CONSENT))}
                ${useLegint() === true ? snippetLegalDescription(element.legIntPurposes, 'purposes', getLabel(OIL_LABELS.ATTR_LABEL_CPC_LEGAL_PURPOSE_LEG_INT)) : ''}
                ${snippetLegalDescription(element.specialPurposes, 'specialPurposes', getLabel(OIL_LABELS.ATTR_LABEL_CPC_LEGAL_PURPOSE_SPECIAL_PURPOSES))}
                ${snippetLegalDescription(element.features, 'features', getLabel(OIL_LABELS.ATTR_LABEL_CPC_LEGAL_PURPOSE_FEATURES))}
                ${snippetLegalDescription(element.specialFeatures, 'specialFeatures', getLabel(OIL_LABELS.ATTR_LABEL_CPC_LEGAL_PURPOSE_SPECIAL_FEATURES))}
                ${cookieRetentionSection(element)}
              </div>
              ${element.legIntPurposes.length > 0 && useLegint() ? snippetLengint(element.id) : ''}
            </div>
          `;
  }
};

const buildCustomVendorListEntry = (element) => {
  if (element.name) {
    return `
          <div class="as-oil-third-party-list-element Vendor">
              <span class="Vendor__Heading" onclick='${OIL_GLOBAL_OBJECT_NAME}._toggleViewElements(this)'>
                  <svg class='as-oil-icon-plus' width="10" height="10" viewBox="0 0 10 10" xmlns="http://www.w3.org/2000/svg">
                    <path d="M5.675 4.328H10v1.344H5.675V10h-1.35V5.672H0V4.328h4.325V0h1.35z" fill="#0068FF" fill-rule="evenodd" fill-opacity=".88"/>
                  </svg>
                  <svg class='as-oil-icon-minus' style='display: none;' width="10" height="5" viewBox="0 0 10 5" xmlns="http://www.w3.org/2000/svg">
                    <path d="M0 0h10v1.5H0z" fill="#3B7BE2" fill-rule="evenodd" opacity=".88"/>
                  </svg>
                  <span class='as-oil-third-party-name'>${element.name}</span>
              </span>
                ${snippetCustomVendorConsent(element.id)}
              <div class='as-oil-third-party-toggle-part' style='display: none;'>
                <a class='as-oil-third-party-link' href='${element.policyUrl}'>${element.policyUrl}</a>  
                ${snippetLegalDescription(element.purposes, 'purposes', getLabel(OIL_LABELS.ATTR_LABEL_CPC_LEGAL_PURPOSE_CONSENT))}
                ${snippetLegalDescription(element.legIntPurposes, 'purposes', getLabel(OIL_LABELS.ATTR_LABEL_CPC_LEGAL_PURPOSE_LEG_INT))}
                ${snippetLegalDescription(element.specialPurposes, 'specialPurposes', getLabel(OIL_LABELS.ATTR_LABEL_CPC_LEGAL_PURPOSE_SPECIAL_PURPOSES))}
                ${snippetLegalDescription(element.features, 'features', getLabel(OIL_LABELS.ATTR_LABEL_CPC_LEGAL_PURPOSE_FEATURES))}
                ${snippetLegalDescription(element.specialFeatures, 'specialFeatures', getLabel(OIL_LABELS.ATTR_LABEL_CPC_LEGAL_PURPOSE_SPECIAL_FEATURES))}
              </div>
              ${element.legIntPurposes.length > 0 ? snippetLengint(element.id) : ''}
            </div>
          `;
  }
};

const buildAdditionalConsentListEntry = (element) => {
  if (element.name) {
    return `
          <div class="as-oil-third-party-list-element Vendor">
              <span class="Vendor__Heading" onclick='${OIL_GLOBAL_OBJECT_NAME}._toggleViewElements(this)'>
                  <svg class='as-oil-icon-plus' width="10" height="10" viewBox="0 0 10 10" xmlns="http://www.w3.org/2000/svg">
                    <path d="M5.675 4.328H10v1.344H5.675V10h-1.35V5.672H0V4.328h4.325V0h1.35z" fill="#0068FF" fill-rule="evenodd" fill-opacity=".88"/>
                  </svg>
                  <svg class='as-oil-icon-minus' style='display: none;' width="10" height="5" viewBox="0 0 10 5" xmlns="http://www.w3.org/2000/svg">
                    <path d="M0 0h10v1.5H0z" fill="#3B7BE2" fill-rule="evenodd" opacity=".88"/>
                  </svg>
                  <span class='as-oil-third-party-name'>${element.name}</span>
              </span>
                ${snippetAdditionalConsent(element.id)}
              <div class='as-oil-third-party-toggle-part' style='display: none;'>
                <a class='as-oil-third-party-link' href='${element.policyUrl}'>${element.policyUrl}</a>  
              </div>
            </div>
          `;
  }
};

const snippetLegalDescription = (list, index ,category) => {  
  if (list.length > 0) {
    return `
      <div class="as-oil-third-party-category-list">
        <p>
          <strong>${category}: </strong> ${categoryList(list, index)}
        </p>
      </div>
    `;
  } else {
    return '';
  }
}

const convertRetentionTime = (maxAgeSeconds) => {
  moment.locale(getLanguageFromConfigObject())
  if (maxAgeSeconds) {
    if (maxAgeSeconds <= 3600 ) {
      return moment.duration(3600, 'seconds').humanize();
    }

    return moment.duration(maxAgeSeconds, 'seconds').humanize();

  } else {
    if (maxAgeSeconds < 0 ) {
      return getLabel(OIL_LABELS.ATTR_LABEL_CPC_RETENTION_SNIPPET_SESSION)
    }

    return getLabel(OIL_LABELS.ATTR_LABEL_CPC_RETENTION_SNIPPET_UNDEFINED)
  }
}

const cookieRetentionSection = (element) => {
  moment.locale(getLanguageFromConfigObject())
  let cookieMaxAgeSeconds = element.cookieMaxAgeSeconds;
  let usesCookies = element.usesCookies;
  let usesNonCookieAccess = element.usesNonCookieAccess;
  let deviceStorageDisclosureUrl = element.deviceStorageDisclosureUrl;
  
  if (cookieMaxAgeSeconds && usesCookies) {
    if (deviceStorageDisclosureUrl) {
      // Se c'è un DisclosureURL
      return cookieRetentionSnippet(`${moment.duration(cookieMaxAgeSeconds, 'seconds').humanize()}`, deviceStorageDisclosureUrl)
    }

    if (cookieMaxAgeSeconds <= 3600 ) {
      // Se c'è una durata entro 1 ora 3600 secondi
      return cookieRetentionSnippet(`${moment.duration(3600, 'seconds').humanize()}`)
    }

    // Se c'è una durata
    return cookieRetentionSnippet(`${moment.duration(cookieMaxAgeSeconds, 'seconds').humanize()}`)
  } else {
    if (cookieMaxAgeSeconds < 0 ) {
      // Durata di Sessione
      return cookieRetentionSnippet(getLabel(OIL_LABELS.ATTR_LABEL_CPC_RETENTION_SNIPPET_SESSION))
    }
  }

  if (!cookieMaxAgeSeconds && !usesCookies && !deviceStorageDisclosureUrl) {

    if (!usesNonCookieAccess) {      
      return ''
    } else {
      return cookieRetentionSnippet(getLabel(OIL_LABELS.ATTR_LABEL_CPC_RETENTION_SNIPPET_UNDEFINED))
    }
  }
}

const cookieRetentionSnippet = (message, disclosureURL = false) => {
  if (disclosureURL) {
    return `
      <div class="CookieMaxDuration as-oil-third-party-category-list">
        <p>
          <strong>${getLabel(OIL_LABELS.ATTR_LABEL_CPC_DISCLOSURE_DURATION_PREFIX)}: </strong> ${message} - <span class="CookieMaxDuration__MoreInfo js-disclosure-url" data-disclosure-url=${disclosureURL} >${getLabel(OIL_LABELS.ATTR_LABEL_CPC_COOKIE_DISCLOSURE_INFO)} &#9432;</span>
        </p>
      </div>  
    `;
  }

  return `
    <div class="CookieMaxDuration as-oil-third-party-category-list">
      <p>
        <strong>${getLabel(OIL_LABELS.ATTR_LABEL_CPC_DISCLOSURE_DURATION_PREFIX)}: </strong> ${message}
      </p>
    </div>  
  `;
}

const snippetLengint = (id) => {
  return `
    <div class="LegintBlock">
      <span class="LegintBlock__Description">${getLabel(OIL_LABELS.ATTR_LABEL_CPC_LEGINT_BOX_TEXT)} <span class="LegintRejectPanel__Info js-legint-info">&#9432;</span></span>
      <label class="LegintBlock__Input">
        <input data-id="${id}" id="as-js-vendor-legint-slider-${id}" class="as-js-vendor-legint-slider" type="checkbox" name="oil-cpc-purpose" value="" checked/>
        <span class="LegintBlock__CheckBox"></span>
      </label>
    </div>
  `;
}

const snippetVendorConsent = (id) => {
  return `
    <label class="as-oil-cpc__switch">
      <input data-id="${id}" id="as-js-vendor-slider-${id}" class="as-js-vendor-slider" type="checkbox" name="oil-cpc-purpose" value=""/>
      <span class="as-oil-cpc__slider"></span>
    </label>
  `;
}

const snippetCustomVendorConsent = (id) => {
  return `
    <label class="as-oil-cpc__switch">
      <input data-id="${id}" id="as-js-custom-vendor-slider-${id}" class="as-js-custom-vendor-slider" type="checkbox" name="oil-cpc-purpose" value=""/>
      <span class="as-oil-cpc__slider"></span>
    </label>
  `;
}

const snippetAdditionalConsent = (id) => {
  return `
    <label class="as-oil-cpc__switch">
      <input data-id="${id}" id="as-js-additional-consent-slider-${id}" class="as-js-additional-consent-slider" type="checkbox" name="oil-cpc-additional-consent" value=""/>
      <span class="as-oil-cpc__slider"></span>
    </label>
  `;
}


const categoryList = (list, index) => {
  return list.map((id) => {
    return `(${id}) ${getVendorList()[index][id]['name']}`
  }).join(', ');
};

const ActivateButtonSnippet = () => {
  return `
  <div class="as-oil-cpc__row-btn-all">
        <span class="as-js-btn-deactivate-all as-oil__btn-secondary">${getLabel(OIL_LABELS.ATTR_LABEL_CPC_DEACTIVATE_ALL)}</span>
        <span class="as-js-btn-activate-all as-oil__btn-secondary">${getLabel(OIL_LABELS.ATTR_LABEL_CPC_ACTIVATE_ALL)}</span>
      </div>
  `
};

const buildPurposeEntries = (list, key = undefined) => {
  if (typeof (list) === 'object') {
    list = Object.values(list)
  }

  return list.map(purpose => {
    if ( key==='purpose' && getTcfPurposeOneTreatment() && purpose.id === 1) {
      return
    }
    return PurposeContainerSnippet({
      id: purpose.id,
      header: getLabelWithDefault(`label_cpc_purpose_${formatPurposeId(purpose.id)}_text`, purpose.name || `Error: Missing text for purpose with id ${purpose.id}!`),
      text: getLabelWithDefault(`label_cpc_purpose_${formatPurposeId(purpose.id)}_desc`, purpose.description || ''),
      legalText: getLabelWithDefault(`label_cpc_purpose_${formatPurposeId(purpose.id)}_desc`, purpose.descriptionLegal || ''),
      value: false,
      key: key
    })
  }).join('');
};

const buildStackEntries = (list, key = undefined) => {
  if (typeof (list) === 'object') {
    list = Object.values(list)
  }

  return list.map(stack => {
    return StackContainerSnippet({
      id: stack.id,
      header: getLabelWithDefault(`label_cpc_purpose_${formatPurposeId(stack.id)}_text`, stack.name || `Error: Missing text for purpose with id ${purpose.id}!`),
      text: getLabelWithDefault(`label_cpc_purpose_${formatPurposeId(stack.id)}_desc`, stack.description || ''),
      purposes: stack.fullPurposes,
      value: false,
      key: key
    })
  }).join('');
};

const formatPurposeId = (id) => {
  return id < 10 ? `0${id}` : id;
};

function activateAll() {
  let elements = document.querySelectorAll('.as-js-purpose-slider, .as-js-purpose-legint-slider, .as-js-specialFeature-slider, .as-js-vendor-slider, .as-js-custom-vendor-slider, .as-js-additional-consent-slider, .as-js-vendor-legint-slider');
  forEach(elements, (domNode) => {
    domNode && (domNode.checked = true);
  });
  legintObjectStatus();
  stacksObjectStatus();
}

export function deactivateAll() {
  let elements = document.querySelectorAll('.as-js-purpose-slider, .as-js-purpose-legint-slider, .as-js-specialFeature-slider, .as-js-vendor-slider, .as-js-custom-vendor-slider, .as-js-additional-consent-slider, .as-js-vendor-legint-slider');
  forEach(elements, (domNode) => {
    domNode && (domNode.checked = false);
  });
  legintObjectStatus();
  stacksObjectStatus();
}

export function objectAllLegint() {
  let objectSliderStatus = document.querySelector('.as-js-btn-object-all').checked;
  let elements = document.querySelectorAll('.as-js-vendor-legint-slider');
  forEach(elements, (domNode) => {
    domNode && (domNode.checked = objectSliderStatus);
  });
}

export function stacksToggles(domNode) {
  let purposesInStack = domNode.srcElement.closest('.js-stack-container').querySelectorAll('.as-js-purpose-slider');
  forEach(purposesInStack, element => {
    element.checked = domNode.srcElement.checked ? true : false;
  });
}

function changeState(domNode) {
  domNode.target.value = domNode.target.checked;
  
  if (domNode.target.checked) {
    domNode.target.classList.remove('disabled');
    domNode.target.classList.add('enabled');
  } else {
    domNode.target.classList.add('disabled');
    domNode.target.classList.remove('enabled');
  }

}

export function stacksObjectStatus() {
  let stackPanels = document.querySelectorAll('.js-stack');
  forEach(stackPanels, panel => {
    let stackPurposes = panel.querySelectorAll('.as-js-purpose-slider');
    panel.querySelector('.as-js-stack-slider').checked = Array.prototype.slice.call(stackPurposes).every(x => x.checked);
  })
}

export function legintObjectStatus() {
  let elements = document.querySelectorAll('.as-js-vendor-legint-slider');
  let objectAllLegint = document.querySelector('.as-js-btn-object-all');
  if (elements) {
    if (objectAllLegint) {
      objectAllLegint.checked = Array.prototype.slice.call(elements).some(x => x.checked);
    }
  }
}

export function triggerInfoPanel(title,content, version = undefined) {
  let panel = document.querySelector('.InfoPanel');
  let wrapper = document.querySelector('.as-oil');
  if (!panel && wrapper) {    
    let infobox = document.createElement('div');
    infobox.className = 'InfoPanel as-oil-content-overlay';
    infobox.innerHTML = `<div class="InfoPanel__Wrapper as-oil-l-wrapper-layout-max-width">
      <span class="InfoPanel__Close js-close-infobox">&times</span>
      <h1 class="InfoPanel__Title">${title}</h1>
      <div class="InfoPanel__Content">${content}</div>
      ${version ? `
        <span class="InfoPanel__Version">v${version}</span>
      ` : ''}
    </div>`;
    wrapper.appendChild(infobox);
  }

  document.querySelector('.js-close-infobox').addEventListener('click', closeInfobox, false)
}

function privacyPolicyInfoPanel(ev) {
  ev.preventDefault();
  window[OIL_GLOBAL_OBJECT_NAME].getLegalText('privacy').then( res => {
    triggerInfoPanel(res.title, res.text, res.version);
  } )
}

function cookiePolicyInfoPanel(ev) {
  ev.preventDefault();
  window[OIL_GLOBAL_OBJECT_NAME].getLegalText().then( res => {
    triggerInfoPanel(res.title, res.text, res.version);
  } )
}

function legIntInfoPanel() {
  let title = getLabel(OIL_LABELS.ATTR_LABEL_CPC_LEGINT_INFOBOX_TITLE);
  let content = getLabel(OIL_LABELS.ATTR_LABEL_CPC_LEGINT_INFOBOX_DESCRIPTION);
  triggerInfoPanel(title,content);
}

function discloseUrlPanel(domNode) {
  fetch(domNode.target.dataset.disclosureUrl)
  .then( res => res.json())
  .then( data => {
    
    let title = getLabel(OIL_LABELS.ATTR_LABEL_CPC_DISCLOSURE_PANEL_TITLE);
    let disclosures = data.disclosures;
    let content = disclosures.map(item => {
      return `
      <div class="DiscloseVendorCookies">
        <div class="DiscloseVendorCookies__Row">
          <span class="DiscloseVendorCookies__Label">${getLabel(OIL_LABELS.ATTR_LABEL_CPC_DISCLOSE_COOKIE_IDENTIFIER)}: </span>
          <span class="DiscloseVendorCookies__Value">${item.identifier}</span>
        </div>
        <div class="DiscloseVendorCookies__Row">
          <span class="DiscloseVendorCookies__Label">${getLabel(OIL_LABELS.ATTR_LABEL_CPC_DISCLOSE_COOKIE_TYPE)}: </span>
          <span class="DiscloseVendorCookies__Value">${item.type}</span>
        </div>
        <div class="DiscloseVendorCookies__Row">
          <span class="DiscloseVendorCookies__Label">${getLabel(OIL_LABELS.ATTR_LABEL_CPC_DISCLOSE_COOKIE_DOMAIN)}: </span>
          <span class="DiscloseVendorCookies__Value">${item.domain}</span>
        </div>
        <div class="DiscloseVendorCookies__Row">
          <span class="DiscloseVendorCookies__Label">${getLabel(OIL_LABELS.ATTR_LABEL_CPC_DISCLOSE_COOKIE_DURATION)}: </span>
          <span class="DiscloseVendorCookies__Value">${convertRetentionTime(item.maxAgeSeconds)}</span>
        </div>
        <div class="DiscloseVendorCookies__Row">
          <span class="DiscloseVendorCookies__Label">${getLabel(OIL_LABELS.ATTR_LABEL_CPC_DISCLOSE_COOKIE_PURPOSES)}: </span>
          <span class="DiscloseVendorCookies__Value">${categoryList(item.purposes, 'purposes')}</span>
        </div>
      </div>
      `;
    }).join('');
    triggerInfoPanel(title,content);
  })
}

export function closeInfobox() {
  let panel = document.querySelector('.InfoPanel');
  let wrapper = document.querySelector('.as-oil');
  if (panel && wrapper) {    
    wrapper.removeChild(panel);
  }
}

function switchCpcCategory(ev) {
  ev.preventDefault();
  let element = ev.srcElement
  let parentElement = element.parentElement;

  const overflow = document.querySelector('.as-oil-cpc__middle-wrapper');
  const anchor = document.querySelector(element.attributes.href.value);

  // Set the scroll position of the overflow container
  overflow.scrollTop = anchor.offsetTop - overflow.offsetTop;

  let allElementsInMenu = parentElement.children;
  forEach(allElementsInMenu, (el) => {
    el.className = el.className.replace(new RegExp(`\\s?${CLASS_NAME_FOR_ACTIVE_MENU_SECTION}\\s?`, 'g'), '');
  });
  element.className += ` ${CLASS_NAME_FOR_ACTIVE_MENU_SECTION}`;
}
