import { CmpApi } from 'didomi-iabtcf-cmpapi';
import { TCString } from 'didomi-iabtcf-core';
import { OIL_SPEC, ADDITIONAL_CONSENT_VERSION } from './core_constants';
import { getAllPreferences } from './core_consents';
import { nativeInterface } from './../native/native_interface';

let tcfCmpApi = null;
let acm = ADDITIONAL_CONSENT_VERSION;

function loadTcfApi() {
    if (!tcfCmpApi) {
        tcfCmpApi = new CmpApi(OIL_SPEC.CMP_ID, OIL_SPEC.CMP_VERSION, true, {
            'getTCData': (next, tcData, success) => {
                // tcData will be constructed via the TC string and can be added to here
                tcData.addtlConsent = acm;
                // pass data along
                next(tcData, success);
            },
            'getInAppTCData': (next, appTCData, success) => {
                // tcData will be constructed via the TC string and can be added to here
                appTCData.addtlConsent = acm;
                // pass data along
                next(appTCData, success);
            }
        });
    }

    return tcfCmpApi;
}

export function updateTcfApi(cookieData, cmpVisible = false, addtlConsent) {
    acm = addtlConsent;
    loadTcfApi();

    let TCString = (cookieData && cookieData.consentString) ? cookieData.consentString : '';
    tcfCmpApi.update(TCString, cmpVisible);
    if (!cmpVisible) {
        // nativeInterface('destroy');
    } else {
        nativeInterface('show');
    }
    return tcfCmpApi;
}

export function disableGdprTcfApi() {
    acm = ADDITIONAL_CONSENT_VERSION;
    loadTcfApi();

    tcfCmpApi.update(null, false);
    return tcfCmpApi;
}

export function tcModelBaseValues(model) {
    model.cmpId = OIL_SPEC.CMP_ID;
    model.publisherCountryCode = 'IT';
    model.cmpVersion = OIL_SPEC.CMP_VERSION;
    model.isServiceSpecific = true;
    model.purposeOneTreatment = true;
    model.supportOOB = false;
    model.consentScreen = 1;

    return model;
}


export function writeSettings() {
    let tcData;
    //@ts-ignore
    window.__tcfapi('getInAppTCData', 2, (appTCData, success) => {
        tcData=appTCData;
    });

    let iabValues = {
        IABTCF_CmpSdkID: tcData.cmpId,
        IABTCF_CmpSdkVersion: tcData.cmpVersion,
        IABTCF_PolicyVersion: tcData.tcfPolicyVersion,
        IABTCF_gdprApplies: tcData.gdprApplies,
        IABTCF_PublisherCC: tcData.publisherCC,
        IABTCF_PurposeOneTreatment: tcData.purposeOneTreatment,
        IABTCF_UseNonStandardStacks: tcData.useNonStandardStacks,
        IABTCF_TCString: tcData.tcString,
        IABTCF_VendorConsents: tcData.vendor.consents,
        IABTCF_VendorLegitimateInterests: tcData.vendor.legitimateInterests,
        IABTCF_PurposeConsents: tcData.purpose.consents,
        IABTCF_PurposeLegitimateInterests: tcData.purpose.legitimateInterests,
        IABTCF_SpecialFeaturesOptIns: tcData.specialFeatureOptins,
        IABTCF_AddtlConsent: tcData.addtlConsent
    }

    Object.entries(iabValues).map(([key, value]) => {
        window.localStorage.setItem(key, value)
        nativeInterface('write', key, value);
    })    
}

export function readSettings() {
    let tcString = window.localStorage.getItem('IABTCF_TCString');
    nativeInterface('read', 'IABTCF_TCString');
    let atpString = window.localStorage.getItem('IABTCF_AddtlConsent');
    nativeInterface('read', 'IABTCF_AddtlConsent');
    const tcModel = TCString.decode(tcString);
    return getAllPreferences(tcModel, atpString);
}