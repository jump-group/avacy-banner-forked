import { CmpApi, TCData } from '@iabtcf/cmpapi';
import { OIL_SPEC, ADDITIONAL_CONSENT_VERSION } from './core_constants';

let tcfCmpApi = null;

function loadTcfApi(addtlConsent) {
    tcfCmpApi = new CmpApi(OIL_SPEC.CMP_ID, OIL_SPEC.CMP_VERSION, true, {
        'getTCData': (next, tcData, success) => {
            // tcData will be constructed via the TC string and can be added to here
            tcData.addtlConsent = addtlConsent;
            // pass data along
            next(tcData, success);
        }
    });
    return tcfCmpApi;
}

export function updateTcfApi(cookieData, cmpVisible = false, addtlConsent) {
    // if (!tcfCmpApi) {
    //     loadTcfApi(addtlConsent);
    // }
    loadTcfApi(addtlConsent);

    let TCString = (cookieData && cookieData.consentString) ? cookieData.consentString : '';
    tcfCmpApi.update(TCString, cmpVisible);

    return tcfCmpApi;
}

export function disableGdprTcfApi() {
    // if (!tcfCmpApi) {
    //     loadTcfApi();
    // }
    loadTcfApi(ADDITIONAL_CONSENT_VERSION);

    tcfCmpApi.update(null, false);
    return tcfCmpApi;
}