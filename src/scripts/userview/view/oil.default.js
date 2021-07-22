import { JS_CLASS_BUTTON_OPTIN } from '../../core/core_constants.js';
import { getLabel, isAdvancedSettings, isCloseWithoutConsentsEnabled, logoUrl, isRejectAllEnabled } from '../userview_config.js';
import { OIL_LABELS } from '../userview_constants.js';
import { closeWithoutConsents, bannerLogo } from './components/oil.additional_elements.js';
import { AdvancedSettingsButton, YesButton, RejectAllButton } from './components/oil.buttons.js';

export function oilDefaultTemplate() {
  return `
    <div class="as-oil-content-overlay" data-qa="oil-full">
        <div class="as-oil-l-wrapper-layout-max-width ${isRejectAllEnabled() ? 'Reject': ''}">
            ${closeWithoutConsents(isCloseWithoutConsentsEnabled())}
            ${bannerLogo(logoUrl())}
            <div class="as-oil__heading">
                ${getLabel(OIL_LABELS.ATTR_LABEL_INTRO_HEADING)}
            </div>
            <p class="as-oil__intro-txt">
                ${getLabel(OIL_LABELS.ATTR_LABEL_INTRO)}
            </p>
            <div class="as-oil-l-row as-oil-l-buttons">
                <div class="as-oil-l-item as-oil-l-item__optin">
                    ${YesButton(`as-oil__btn-primary ${JS_CLASS_BUTTON_OPTIN}`, 'first_layer')}
                </div>
                ${isRejectAllEnabled() ? `
                    <div class="as-oil-l-item as-oil-l-item__reject-all">
                        ${RejectAllButton(isRejectAllEnabled(), 'as-oil__btn-primary')}
                    </div>
                `: ''}
                <div class="as-oil-l-item as-oil-l-item__advanced-settings">
                    ${AdvancedSettingsButton(isAdvancedSettings(), 'as-oil__btn-primary')}
                </div>
            </div>
        </div>
    </div>
`
}
