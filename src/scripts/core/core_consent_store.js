import Cookie from 'js-cookie';
import { isMobileEnvironment, getNativePublisher } from './core_config';

let consentStoreInstance;

class ConsentStore {
    // Constructor
    constructor() {
        this.publisher = getNativePublisher();
        this.osEnv = isMobileEnvironment() ? 'native' : 'web';
        this.cookieJsonPromise;
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


    // PRIVATE PUBLISHER METHODS
    _readAvacySDK(name) {
        let cookieName = name.toUpperCase();
        if (window.CMPWebInterface) {
            // Call Android interface
            if (typeof window.CMPWebInterface.readAll === 'function'){
                return new Promise((resolve, reject) => {
                    window.myResolve = resolve;
                    window.CMPWebInterface.readAll('callbackFunction');
                }).then(res => {
                    let result = JSON.parse(res);

                    return new Promise((resolve, reject) => {
                        let cookie;
                        if (cookieName in result) {
                            cookie = JSON.parse(result[cookieName].replace(/(%[\dA-F]{2})+/gi, decodeURIComponent));
                        } else {
                            cookie = undefined;
                        }
                        resolve(cookie);
                    })
                })
            }
        } else if (window.webkit
            && window.webkit.messageHandlers
            && window.webkit.messageHandlers.CMPWebInterface) {
            // Call iOS interface
            return new Promise((resolve, reject) => {
                let message = {
                    command: 'readAll',
                    callback: 'callbackFunction'
                };
                window.webkit.messageHandlers.CMPWebInterface.postMessage(message);
                window.myResolve = resolve;
            }).then(res => {
                let result = JSON.parse(res);

                return new Promise((resolve, reject) => {
                    let cookie;
                    if (cookieName in result) {
                        cookie = JSON.parse(result[cookieName].replace(/(%[\dA-F]{2})+/gi, decodeURIComponent));
                    } else {
                        cookie = undefined;
                    }
                    resolve(cookie);
                })
            })
            

        } else {
            // No Android or iOS interface found
            console.log('No native APIs found. true');
        }
    }

    _readRaiSDK(name) {
        let cookieName = name.toUpperCase();

        if(this._isAndroid()) {
            return new Promise((resolve, reject) => {
                let result = JSON.parse(window.Android.retrieveConsent());
                //DEVO CONTROLLARE SE ESITE NELLA STRUTTURA DATI RITORNATA UN INDICE CON CHIAVE "name"
                let cookie;
                if (cookieName in result) {
                    cookie = JSON.parse(result[cookieName].replace(/(%[\dA-F]{2})+/gi, decodeURIComponent));
                } else {
                    cookie = undefined;
                }

                resolve(cookie)
            })

        }else{
            return checkConsent().then(
                function (hasConsent) {
                    if (hasConsent) {
                        return retrieveConsent().then(
                                function (returnValue) {
                                    let result = JSON.parse(returnValue);
                                    if (cookieName in result) {
                                        let cookie = result[cookieName].replace(/(%[\dA-F]{2})+/gi, decodeURIComponent);
                                        return JSON.parse(cookie);
                                    } else {
                                        return undefined;
                                    }
                                },
                                function (error) {
                                    console.log(error);
                                }
                            )
                    } else {
                        return undefined
                    }
                },
                function (error) {
                    console.log(error);
                })
        }


    }

    _writeAvacySDK(name, value) {
        let objToWrite = this._buildObjectToWrite(name, value);
        
        if (window.CMPWebInterface) {
            // Call Android interface
            if (typeof window.CMPWebInterface.writeAll === 'function'){
                window.CMPWebInterface.writeAll(JSON.stringify(objToWrite), 'callbackFunction');
            }
        } else if (window.webkit
            && window.webkit.messageHandlers
            && window.webkit.messageHandlers.CMPWebInterface) {
            // Call iOS interface
            let message = {
                command: 'writeAll',	
                values: JSON.stringify(objToWrite),
                callback: 'callbackFunction'
            };
            window.webkit.messageHandlers.CMPWebInterface.postMessage(message);
        } else {
            // No Android or iOS interface found
            console.log('No native APIs found. true');
        }
    }

    _writeRaiSDK(name, value) {
        let objToWrite = this._buildObjectToWrite(name, value);
        
        if(this._isAndroid()) {
            window.Android.sendConsent(JSON.stringify(objToWrite));
        }else{
            sendConsent(objToWrite).then(
                function (returnValue) {

                },
                function (error) {
                }
            )
        }
    }

    // QUESTA FUNZIONE LA USA SOLO RAI PER ADESSO
    writeDecodedRaiConsentSDK(privacySettings) {
        if (this._osEnv === 'native' && this._publisher === 'papyri') {
            if(this._isAndroid()) {
                window.Android.sendDecodedConsent(JSON.stringify(privacySettings))
            }else{
                sendDecodedConsent(privacySettings).then(
                    function (returnValue) {
                    },
                    function (error) {
                    }
                )
            }
        }
    } 

    _buildObjectToWrite(name, value) {
        let objectToWrite = {}

        // ASSEGNO A objectToWrite IL COOKIE OIL_DATA STRINGIFIZZATO
        let encodedValue;
        // CONTROLLO PERCHE' su ANDROID NON USO LA LIBRERIA DI ENCODING

        if (this._publisher === 'papyri') {
            if (this._isAndroid()) {
                encodedValue = JSON.stringify(value);
            } else {
                encodedValue = encodeURIComponent(JSON.stringify(value)).replace(/%(2[346BF]|3[AC-F]|40|5[BDE]|60|7[BCD])/g, decodeURIComponent);
            }
        } else {
            encodedValue = encodeURIComponent(JSON.stringify(value)).replace(/%(2[346BF]|3[AC-F]|40|5[BDE]|60|7[BCD])/g, decodeURIComponent);
        }


        Object.assign(objectToWrite, { [name.toUpperCase()] : encodedValue })
        
        // MI PRENDO I VALORI IAB DA SALVARE
        let iabValues = this._IABValues();
        if (iabValues) {
            Object.assign(objectToWrite, iabValues)
        }

        return objectToWrite;
    }

    _showAvacySDK() {
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
            window.webkit.messageHandlers.CMPWebInterface.postMessage(message);
        } else {
            // No Android or iOS interface found
            console.log('No native APIs found. true');
        }
    }

    _showRaiSDK() {
        if(this._isAndroid()) {
            window.Android.showView();
        }else{
            showView().then(
                function (returnValue) {
                },
                function (error) {
                }
            )
        }
    }

    _hideAvacySDK() {
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
            window.webkit.messageHandlers.CMPWebInterface.postMessage(message);
        } else {
            // No Android or iOS interface found
            console.log('No native APIs found. true');
        }
    }

    _hideRaiSDK() {
        if(this._isAndroid()) {
            window.Android.hideView()
        }else{
            hideView().then(
                function (returnValue) {
                },
                function (error) {
                }
            )
        }
    }

    _IABValues() {
        let tcData;
        //@ts-ignore
        window.__tcfapi('getInAppTCData', 2, (appTCData, success) => {
            tcData=appTCData;
        });

        return {
            IABTCF_CmpSdkID: Number(tcData.cmpId),
            IABTCF_CmpSdkVersion: Number(tcData.cmpVersion),
            IABTCF_PolicyVersion: Number(tcData.tcfPolicyVersion),
            IABTCF_gdprApplies: Number(tcData.gdprApplies),
            IABTCF_PublisherCC: String(tcData.publisherCC),
            IABTCF_PurposeOneTreatment: Number(tcData.purposeOneTreatment),
            IABTCF_UseNonStandardStacks: Number(tcData.useNonStandardStacks),
            IABTCF_TCString: String(tcData.tcString),
            IABTCF_VendorConsents: String(tcData.vendor.consents),
            IABTCF_VendorLegitimateInterests: String(tcData.vendor.legitimateInterests),
            IABTCF_PurposeConsents: String(tcData.purpose.consents),
            IABTCF_PurposeLegitimateInterests: String(tcData.purpose.legitimateInterests),
            IABTCF_SpecialFeaturesOptIns: String(tcData.specialFeatureOptins),
            IABTCF_AddtlConsent: String(tcData.addtlConsent)
        }
    }

    _isAndroid() {
        let userAgent = navigator.userAgent || navigator.vendor || window.opera;
        return (/android/i.test(userAgent))
    }

    // NEW PUBLIC METHODS
    readConsent(name) {
        if (this.cookieJsonPromise) {
            return this.cookieJsonPromise;
        }

        switch (this._osEnv) {
            case 'native':
                // QUI SONO MOBILE
                if (this._publisher === 'papyri') {
                    // SE SONO UN PUBLISHER PARTICOLARE
                    this.cookieJsonPromise = this._readRaiSDK(name);
                } else {
                    // SE SONO AVACY DI FALLBACK / DEFAULT
                    this.cookieJsonPromise = this._readAvacySDK(name);
                }

                return this.cookieJsonPromise;
        
            default:
                // QUI SONO WEB DI DEFAULT
                return new Promise((resolve,reject) => {
                    resolve(Cookie.getJSON(name));
                })
        }
    }

    writeConsent(name, value, options = undefined) {
        switch (this._osEnv) {
            case 'native':
                // QUI SONO MOBILE

                if (this._publisher === 'papyri') {
                    // SE SONO UN PUBLISHER PARTICOLARE
                    this._writeRaiSDK(name, value);
                } else {
                    // SE SONO AVACY DI FALLBACK / DEFAULT
                    this._writeAvacySDK(name, value);
                }

                break;
        
            default:
                // QUI SONO WEB DI DEFAULT
                Cookie.set(name, value, options);
                break;
        }


    }

    showPanel() {
        switch (this._osEnv) {
            case 'native':
                // QUI SONO MOBILE

                if (this._publisher === 'papyri') {
                    // SE SONO UN PUBLISHER PARTICOLARE
                    this._showRaiSDK();
                } else {
                    // SE SONO AVACY DI FALLBACK / DEFAULT
                    this._showAvacySDK();
                }

                break;
        
            default:
                // QUI SONO WEB DI DEFAULT
                break;
        }
    }

    hidePanel() {
        switch (this._osEnv) {
            case 'native':
                // QUI SONO MOBILE

                if (this._publisher === 'papyri') {
                    // SE SONO UN PUBLISHER PARTICOLARE
                    this._hideRaiSDK();
                } else {
                    // SE SONO AVACY DI FALLBACK / DEFAULT
                    this._hideAvacySDK();
                }

                break;
        
            default:
                // QUI SONO WEB DI DEFAULT
                break;
        }
    }
}

export const consentStore = () => {
    if (!consentStoreInstance) {
        consentStoreInstance = new ConsentStore()
    }

    return consentStoreInstance;
}

window.callbackFunction = (result) => {
    window.myResolve(result);
}