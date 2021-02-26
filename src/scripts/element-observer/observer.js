import { transformElement } from './utils'
import { checkOnBlacklist } from './checks'

// Setup a mutation observer to track DOM insertion
export const observer = new MutationObserver(mutations => {
    for (let i = 0; i < mutations.length; i++) {
        const { addedNodes } = mutations[i];
        for(let i = 0; i < addedNodes.length; i++) {
            const node = addedNodes[i]

            if (node.nodeType === 1) {
                if (node.tagName === 'IFRAME' && window.CLIENT_SIDE_BLOCKING.iframes !== true) {
                    return
                }
                const src = node.src;
                const type = node.type
                // If the src is inside the blacklist and is not inside the whitelist
                const isOnPapyriBlacklist = checkOnBlacklist(src, type)[0];
                const rules = checkOnBlacklist(src, type)[1];

                if(isOnPapyriBlacklist) {
                    transformElement(node, rules);
                }
            }
        }
    }
})