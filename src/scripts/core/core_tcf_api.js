import { CmpApi } from '@iabtcf/cmpapi';
import { OIL_SPEC } from './core_constants';

let tcfCmpApi = null;

function loadTcfApi() {
    tcfCmpApi = new CmpApi(OIL_SPEC.CMP_ID, OIL_SPEC.CMP_VERSION, true);
    return tcfCmpApi;
}

export function updateTcfApi(cookieData, cmpVisible = false) {
    if (!tcfCmpApi) {
        loadTcfApi();
    }
    let TCString = (cookieData && cookieData.consentString) ? cookieData.consentString : '';
    tcfCmpApi.update(TCString, cmpVisible);
    return tcfCmpApi;
}

export function disableGdprTcfApi() {
    if (!tcfCmpApi) {
        loadTcfApi();
    }

    tcfCmpApi.update(null, false);
    return tcfCmpApi;
}