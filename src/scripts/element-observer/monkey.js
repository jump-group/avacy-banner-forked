import { TYPE_ATTRIBUTE } from './variables';
import { checkOnBlacklist } from './checks';
import { setRules, checkAndSetDataAttribute } from './utils';
import { hasConsent } from './../core/core_tag_management';

export const monkey = (cookie) => {
    const createElementBackup = document.createElement
    
    const originalDescriptors = {
        src: Object.getOwnPropertyDescriptor(HTMLScriptElement.prototype, 'src'),
        type: Object.getOwnPropertyDescriptor(HTMLScriptElement.prototype, 'type')
    }
    
    // Monkey patch the createElement method to prevent dynamic scripts from executing
    document.createElement = function(...args) {
        // If this is not a script tag, bypass
        if(args[0].toLowerCase() !== 'script') {
            return createElementBackup.bind(document)(...args)
        }
    
        const scriptElt = createElementBackup.bind(document)(...args)
    
        // Define getters / setters to ensure that the script type is properly set
        try {
            Object.defineProperties(scriptElt, {
                'src': {
                    get() {
                        return originalDescriptors.src.get.call(this)
                    },
                    set(value) {
                        let data = checkOnBlacklist(value, scriptElt.type);
                        
                        originalDescriptors.src.set.call(this, value);
                        if (data[0]){
                            if (!hasConsent(scriptElt, cookie)) {
                                scriptElt.setAttribute('data-managed', TYPE_ATTRIBUTE);
                                checkAndSetDataAttribute(scriptElt, 'title');
                                checkAndSetDataAttribute(scriptElt, 'display');
                                checkAndSetDataAttribute(scriptElt, 'href');
                                checkAndSetDataAttribute(scriptElt, 'src');
                                setRules(scriptElt, data[1]);
                            } else {
                                originalDescriptors.src.set.call(this, value);
                            }
                        }
                    }
                },
                'type': {
                    get() {
                        return originalDescriptors.type.get.call(this)
                    },
                    set(value) {
                        let data = checkOnBlacklist(scriptElt.src, scriptElt.type)
                        let typeValue = value;
                        if (data[0]) {
                            if (!hasConsent(scriptElt, cookie)) {
                                typeValue = TYPE_ATTRIBUTE;
                            }
                        }
                        originalDescriptors.type.set.call(this, typeValue);
                    }
                }
            })
    
            // Monkey patch the setAttribute function so that the setter is called instead
            scriptElt.setAttribute = function(name, value) {
                if(name === 'type' || name === 'src')
                    scriptElt[name] = value
                else
                    HTMLScriptElement.prototype.setAttribute.call(scriptElt, name, value)
            }
        } catch (error) {
            // eslint-disable-next-line
            console.warn(
                'Yett: unable to prevent script execution for script src ', scriptElt.src, '.\n',
                'A likely cause would be because you are using a third-party browser extension that monkey patches the "document.createElement" function.'
            )
        }

        return scriptElt
    }
}
