export function nativeInterface(method, ...args) {
    if (window.CMPWebInterface) {
		// Call Android interface
		if (typeof window.CMPWebInterface[method] === 'function'){
            window.CMPWebInterface[method](...args);
		}
	} else if (window.webkit
		&& window.webkit.messageHandlers
		&& window.webkit.messageHandlers.CMPWebInterface) {
        // Call iOS interface
        let message = {
            command: method
        };

        if (args[0]) {
            message.key = args[0];
        }

        if (args[1]) {
            message.key = args[0];
            message.value = args[1];
        }
		window.webkit.messageHandlers.CMPWebInterface.postMessage(message);
	} else {
		// No Android or iOS interface found
		console.log('No native APIs found.');
	}
}