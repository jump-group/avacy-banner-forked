import Cookie from 'js-cookie';
import { logInfo } from './core_log';
import { isMobileEnvironment } from './core_config';
import { getDefaultTCModel } from './core_cookies';
import { TCString } from 'didomi-iabtcf-core';
import { reject } from 'core-js/fn/promise';

let consentStoreInstance;

class ConsentStore {
    // Constructor
    constructor(publisher) {
        this.publisher = publisher;
        this.osEnv = isMobileEnvironment() ? 'mobile' : 'web';
        this.cookieJson;
    }

    //Getters
    get osEnv() {
        return this._osEnv;
    }

    get publisher() {
        return this._publisher;
    }

    //Setters
    set publisher ( publisherName ) {
        this._publisher = publisherName;
    }

    set osEnv ( env ) {
        this._osEnv = env;
    }

    // Private Methods
    async _read(name) {
        if (this.cookieJson !== undefined) {
            console.log('Cookie Json Cachato')
            return this.cookieJson;
        }

        switch (this._publisher) {
            case 'avacy':
                if (window.CMPWebInterface) {
                    // Call Android interface
                    if (typeof window.CMPWebInterface.readAll === 'function'){
                        this.cookieJson = await new Promise((resolve, reject) => {
                            window.myResolve = resolve;
                            window.CMPWebInterface.readAll('callbackFunction');
                        }).then(res => res)
                    }
                } else if (window.webkit
                    && window.webkit.messageHandlers
                    && window.webkit.messageHandlers.CMPWebInterface) {
                    // Call iOS interface
                    let message = {
                        command: 'readAll',
                        callbackFunction: 'callbackFunction'
                    };
                    result = window.webkit.messageHandlers.CMPWebInterface.postMessage(message);
                } else {
                    // No Android or iOS interface found
                    console.log('No native APIs found. true');
                }
                break;
        
            default:
                break;
        }

        return this.cookieJson;
    }

    _write() {
        console.log('_write');
        this.cookieJson = undefined;

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

        switch (this._publisher) {
            case 'avacy':
                if (window.CMPWebInterface) {
                    // Call Android interface
                    if (typeof window.CMPWebInterface.writeAll === 'function'){
                        console.log(iabValues);
                        window.CMPWebInterface.writeAll(JSON.stringify(iabValues), 'callbackFunction');
                    }
                } else if (window.webkit
                    && window.webkit.messageHandlers
                    && window.webkit.messageHandlers.CMPWebInterface) {
                    // Call iOS interface
                    let message = {
                        command: 'writeAll',	
                        values: JSON.stringify(iabValues),
                        callbackFunction: 'callbackFunction'
                    };
                    result = window.webkit.messageHandlers.CMPWebInterface.postMessage(message);
                } else {
                    // No Android or iOS interface found
                    console.log('No native APIs found. true');
                }
                break;
            
            case 'papyri':
                
                break;
        
            default:
                break;
        }
    }

    _show() {
        console.log('_show');
        switch (this._publisher) {
            case 'avacy':
                if (window.CMPWebInterface) {
                    // Call Android interface
                    if (typeof window.CMPWebInterface.show === 'function'){
                        window.CMPWebInterface.show();
                    }
                } else if (window.webkit
                    && window.webkit.messageHandlers
                    && window.webkit.messageHandlers.CMPWebInterface) {
                    // Call iOS interface
                    let message = {
                        command: 'show'
                    };
                    result = window.webkit.messageHandlers.CMPWebInterface.postMessage(message);
                } else {
                    // No Android or iOS interface found
                    console.log('No native APIs found. true');
                }
                break;
        
            case 'papyri':
                
                break;
        
            default:
                break;
        }
    }

    _hide() {
        console.log('_hide');
        switch (this._publisher) {
            case 'avacy':
                if (window.CMPWebInterface) {
                    // Call Android interface
                    if (typeof window.CMPWebInterface.destroy === 'function'){
                        window.CMPWebInterface.destroy();
                    }
                } else if (window.webkit
                    && window.webkit.messageHandlers
                    && window.webkit.messageHandlers.CMPWebInterface) {
                    // Call iOS interface
                    let message = {
                        command: 'destroy'
                    };
                    result = window.webkit.messageHandlers.CMPWebInterface.postMessage(message);
                } else {
                    // No Android or iOS interface found
                    console.log('No native APIs found. true');
                }
                break;
        
            case 'papyri':
                
                break;
        
            default:
                break;
        }
    }

    // Public Methods
    readConsent(cookieConfig) {
        console.log('LEGGO IL CONSENSO');

        if(this._osEnv === 'web') {
            return Cookie.getJSON(cookieConfig.name);
        } else {
            let result = this._read(cookieConfig.name);
            console.log(typeof result);

            return Cookie.getJSON(cookieConfig.name)
            // console.log('this._read(cookieConfig.name)',this._read(cookieConfig.name));
        }
    }

    writeConsent(name, value, expires_in_days) {
        console.log('SCRIVO IL CONSENSO');

        if(this._osEnv === 'web') {
            
        } else {
            this._write();
        }
    }

    showPanel() {
        this._show();
    }

    hidePanel() {
        this._hide();
    }
}

export const consentStore = () => {
    if (!consentStoreInstance) {
        consentStoreInstance = new ConsentStore('avacy')
    }

    return consentStoreInstance;
}

window.callbackFunction = (result) => {
    window.myResolve(result);
    console.log('RISULTATO CALLBACK',result);
}