import { TYPE_ATTRIBUTE } from './variables'
import { checkOnBlacklist } from './checks'

// Setup a mutation observer to track DOM insertion
export const observer = new MutationObserver(mutations => {
    for (let i = 0; i < mutations.length; i++) {
        const { addedNodes } = mutations[i];
        for(let i = 0; i < addedNodes.length; i++) {
            const node = addedNodes[i]

            if (node.nodeType === 1) {
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


export const transformElement = (node, rules) => {
    let newNode = node.cloneNode(true);

    checkAndSetDataAttribute(newNode, 'src');
    checkAndSetDataAttribute(newNode, 'title');
    checkAndSetDataAttribute(newNode, 'display');
    checkAndSetDataAttribute(newNode, 'href');
    setRules(newNode, rules);

    if(newNode.tagName === 'SCRIPT') {
        newNode.type = TYPE_ATTRIBUTE;

        // Firefox has this additional event which prevents scripts from beeing executed
        const beforeScriptExecuteListener = function (event) {
            // Prevent only marked scripts from executing
            if(newNode.getAttribute('type') === TYPE_ATTRIBUTE)
                event.preventDefault()
                newNode.removeEventListener('beforescriptexecute', beforeScriptExecuteListener)
        }
        newNode.addEventListener('beforescriptexecute', beforeScriptExecuteListener)
    }  else {
        newNode.setAttribute('data-display', 'block');
        newNode.style.display = 'none';
    }

    newNode.setAttribute('data-managed', TYPE_ATTRIBUTE);

    node.parentElement.insertBefore(newNode, node)
    node.parentElement && node.parentElement.removeChild(node);

}

const setRules = (el, rules) => {
    for (const [key, value] of Object.entries(rules)) {
        el.setAttribute(key, value);
    }
}

const checkAndSetDataAttribute = (el, attr) => {
    if (el.hasAttribute(attr)) {
        el.setAttribute(`data-${attr}`, el.getAttribute(attr))
        el.removeAttribute(attr);
    }
}

// Starts the monitoring
observer.observe(document.documentElement, {
    childList: true,
    subtree: true
})