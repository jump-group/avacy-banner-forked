import { OIL_CONFIG, OIL_CONFIG_CPC_TYPES } from '../core/core_constants.js';
import { getConfigValue, getLocale } from '../core/core_config.js';
import DEFAULT_VISUAL from './visual/userview_default_visual_configuration';

// tag::config-timeout[]
const defaultTimeoutInSeconds = 60;
// end::config-timeout[]

// FIXME bad name - isPersistOptOut or similiar
export function isPersistMinimumTracking() {
  return getConfigValue(OIL_CONFIG.ATTR_PERSIST_MINIMUM_TRACKING, true);
}

// FIXME bad name - isAdvancedSettingsEnabled
export function isAdvancedSettings() {
  return getConfigValue(OIL_CONFIG.ATTR_ADVANCED_SETTINGS, false);
}

export function getTimeOutValue() {
  return getConfigValue(OIL_CONFIG.ATTR_TIMEOUT, defaultTimeoutInSeconds);
}

export function getTheme() {
  let visual_config = getVisualConfig();
  let visual_default_config = getDefaultVisualConfig();
  if (visual_config.theme !== undefined) {
    return visual_config.theme; 
  }

  return visual_default_config.theme; 
}

export function getBannerPosition() {
  let visual_config = getVisualConfig();
  let visual_default_config = getDefaultVisualConfig();
  if (visual_config.banner_position !== undefined) {
    return visual_config.banner_position; 
  }

  return visual_default_config.banner_position; 
}

export function getBannerAnimation() {
  let visual_config = getVisualConfig();
  let visual_default_config = getDefaultVisualConfig();
  if (visual_config.banner_animation !== undefined) {
    return visual_config.banner_animation; 
  }

  return visual_default_config.banner_animation; 
}

export function getCpcType() {
  return getConfigValue(OIL_CONFIG.ATTR_CPC_TYPE, OIL_CONFIG_CPC_TYPES.CPC_TYPE_STANDARD);
}

export function getLabel(labelName) {
  return getLabelWithDefault(labelName, labelName);
}

export function getVisualConfig() {
  return getConfigValue(OIL_CONFIG.ATTR_VISUAL_CONFIGURATION, DEFAULT_VISUAL)
}

export function getDefaultVisualConfig() {
  return getConfigValue(undefined, DEFAULT_VISUAL)
}
/**
 * Returns the label or the given default value if it could not be found in configuration.
 *
 * At first, the label is searched directly in the configuration. This is deprecated behaviour.
 * If there is no label definition, it is searched within the 'locale.texts' configuration object.
 * If there is no label definition too, the given default value is returned.
 *
 * @param labelName label name
 * @param defaultLabel the default value.
 * @returns {*}
 */
export function getLabelWithDefault(labelName, defaultLabel) {
  let defaultLocale = getLocale();

  return getConfigValue(labelName, (defaultLocale && defaultLocale.texts && defaultLocale.texts[labelName]) ? defaultLocale.texts[labelName] : defaultLabel);
}

export function isOptoutConfirmRequired() {
  return getConfigValue(OIL_CONFIG.ATTR_REQUIRE_OPTOUT_CONFIRM, false);
}
