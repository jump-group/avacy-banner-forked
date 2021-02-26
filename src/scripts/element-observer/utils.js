import { TYPE_ATTRIBUTE } from './variables'

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

export const setRules = (el, rules) => {
    for (const [key, value] of Object.entries(rules)) {
        el.setAttribute(key, value);
    }
}

export const checkAndSetDataAttribute = (el, attr) => {
    if (el.hasAttribute(attr)) {
        el.setAttribute(`data-${attr}`, el.getAttribute(attr))
        el.removeAttribute(attr);
    }
}