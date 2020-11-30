import { CmpApi } from 'didomi-iabtcf-cmpapi';
import { OIL_SPEC, ADDITIONAL_CONSENT_VERSION } from './core_constants';

let tcfCmpApi = null;
let acm = ADDITIONAL_CONSENT_VERSION;

function loadTcfApi() {
    if (!tcfCmpApi) {
        console.log('generoTcfCmpApi')
        tcfCmpApi = new CmpApi(OIL_SPEC.CMP_ID, OIL_SPEC.CMP_VERSION, true, {
            'getTCData': (next, tcData, success) => {
                // tcData will be constructed via the TC string and can be added to here
                tcData.addtlConsent = acm;
                // pass data along
                next(tcData, success);
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

    return tcfCmpApi;
}

export function disableGdprTcfApi() {
    acm = ADDITIONAL_CONSENT_VERSION;
    loadTcfApi();

    tcfCmpApi.update(null, false);
    return tcfCmpApi;
}