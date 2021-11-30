import { OIL_LABELS } from '../../userview_constants';
import { getLabel } from '../../userview_config';
import { DATA_CONTEXT_YES,
DATA_CONTEXT_CANCEL,
DATA_CONTEXT_PROCEED,
DATA_CONTEXT_BACK,
DATA_CONTEXT_ADVANCED_SETTINGS,
DATA_CONTEXT_REJECT_ALL,
JS_CLASS_BUTTON_OILBACK,
JS_CLASS_BUTTON_PROCEED,
JS_CLASS_BUTTON_CANCEL,
JS_CLASS_BUTTON_ADVANCED_SETTINGS,
JS_CLASS_BUTTON_REJECT_ALL } from '../../../core/core_constants.js';

export const YesButton = (classes, layer) => {
  if (layer === 'first_layer') {
    return `
    <button class="${classes}" data-optin-mode="consent-all" data-optin-layer="1" data-context="${DATA_CONTEXT_YES}" data-qa="oil-YesButton">
        ${getLabel(OIL_LABELS.ATTR_LABEL_BUTTON_YES)}
    </button>`
  } else {
    return `
    <button class="${classes}" data-optin-mode="save-preferences" data-optin-layer="2" data-context="${DATA_CONTEXT_YES}" data-qa="oil-YesButton">
        ${getLabel(OIL_LABELS.ATTR_LABEL_CPC_SAVE)}
    </button>`
  }
}

export const ProceedButton = () => {
  return `
    <button class="as-oil__btn-proceed as-oil__btn-blue ${JS_CLASS_BUTTON_PROCEED}" data-context="${DATA_CONTEXT_PROCEED}" data-qa="oil-proceed-button">
      ${getLabel(OIL_LABELS.ATTR_LABEL_CPC_PURPOSE_OPTOUT_PROCEED)}
    </button>
  `
}

export const CancelButton = () => {
  return `
    <button class="as-oil__btn-cancel as-oil__btn-grey ${JS_CLASS_BUTTON_CANCEL}" data-context="${DATA_CONTEXT_CANCEL}" data-qa="oil-cancel-button">
      ${getLabel(OIL_LABELS.ATTR_LABEL_CPC_PURPOSE_OPTOUT_CANCEL)}
    </button>
  `
}

export const BackButton = () => {
  return `
    <button class="as-oil-back-button ${JS_CLASS_BUTTON_OILBACK}" data-context="${DATA_CONTEXT_BACK}" data-qa="oil-back-button">
      <svg class="as-oil-back-button__icon" width="512" height="448" viewBox="0 0 448 512" xmlns="http://www.w3.org/2000/svg">
        <path fill="#aaa" d="M257.5 445.1l-22.2 22.2c-9.4 9.4-24.6 9.4-33.9 0L7 273c-9.4-9.4-9.4-24.6 0-33.9L201.4 44.7c9.4-9.4 24.6-9.4 33.9 0l22.2 22.2c9.5 9.5 9.3 25-.4 34.3L136.6 216H424c13.3 0 24 10.7 24 24v32c0 13.3-10.7 24-24 24H136.6l120.5 114.8c9.8 9.3 10 24.8.4 34.3z"></path>
      </svg>
      <span class="as-oil-back-button__text">
        ${getLabel(OIL_LABELS.ATTR_LABEL_BUTTON_BACK)}
      </span>
    </button>
  `
};

export const closeWithoutConsents = (closeWithoutConsents) => {
  return closeWithoutConsents === true ? '<span class="as-oil__close-banner as-js-close-banner"></span>' : '';
}


/**
 * OIL advanced settings button
 */

export const AdvancedSettingsButton = (advancedSettings, classes) => {
  return advancedSettings === true ? (
    `
      <button class="${classes} ${JS_CLASS_BUTTON_ADVANCED_SETTINGS}" data-context="${DATA_CONTEXT_ADVANCED_SETTINGS}" data-qa="oil-AdvancedSettingsButton">
        ${getLabel(OIL_LABELS.ATTR_LABEL_BUTTON_ADVANCED_SETTINGS)}
      </button>
    `
  ) : '';
}


/**
 * OIL Reject All button
 */

export const RejectAllButton = (isRejectAllEnabled, classes) => {
  return isRejectAllEnabled === true ? (
    `
      <button class="${classes} ${JS_CLASS_BUTTON_REJECT_ALL}" data-context="${DATA_CONTEXT_REJECT_ALL}" data-qa="oil-reject-all-btn">
        ${getLabel(OIL_LABELS.ATTR_LABEL_BUTTON_REJECT_ALL)}
      </button>
    `
  ) : '';
}