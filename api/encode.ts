require('browser-env')();
import { NowRequest, NowResponse } from '@now/node';
import { TCModel, TCString, GVL } from 'didomi-iabtcf-core';
import { CmpApi } from 'didomi-iabtcf-cmpapi';
import { updateTCModel } from './../src/scripts/core/core_cookies';
import { OIL_SPEC } from './../src/scripts/core/core_constants';
import fetch from 'node-fetch';

export default async function (req: NowRequest, res: NowResponse) {
    const { method, body } = req;

    if (method == 'POST' && body) {
        encode(body)
            .then((result) => { 
                res.status(result.status).json(result.json);
            });
    } else {
        res.status(403).json({ error: 'action not allowed' });
    }
};

export const encode = async (body) => {
    const tcModel = await getTCModel();
    let privacySettings = JSON.parse(body);
    let consentData = updateTCModel(privacySettings, tcModel);
    let tcString = TCString.encode(consentData);

    const cmpApi = new CmpApi(consentData.cmpId, consentData.cmpVersion, consentData.isServiceSpecific, {
        'getInAppTCData': (next, appTCData, success) => {
            // tcData will be constructed via the TC string and can be added to here
            appTCData.addtlConsent = consentData.addtlConsent;
            // pass data along
            next(appTCData, success);
        }
    });
    cmpApi.update(tcString, false);

    let tcData;
    //@ts-ignore
    window.__tcfapi('getInAppTCData', 2, (appTCData, success) => {
        tcData=appTCData;
    });

    return {
        status: 200,
        json: {
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
            IABTCF_AddtlConsent: tcData.addtlConsent,
        }
    };
}

const getTCModel = async () => {
    let gvlJson = await fetch('https://vendorlist.consensu.org/v2/vendor-list.json', {
        method: 'GET'
    })
    .then(res => {
        return res.json()
    }).then(r => r);

    let gvl = new GVL(gvlJson);

    let consentData = new TCModel(gvl);
    consentData.cmpId = OIL_SPEC.CMP_ID;
    consentData.publisherCountryCode = 'IT';
    consentData.cmpVersion = OIL_SPEC.CMP_VERSION;
    consentData.isServiceSpecific = true;
    consentData.purposeOneTreatment = true;
    consentData.supportOOB = false;
    consentData.consentScreen = 1;

    return consentData
}