import 'react-native-get-random-values';
const TextEncodingPolyfill = require('text-encoding');

console.log('Original TextDecoder:', global.TextDecoder ? 'Exists' : 'Missing');

// Force overwrite the global TextEncoder/TextDecoder
// Hermes has a read-only native implementation, so we must use defineProperty
// to bypass potential protections.
try {
    Object.defineProperty(global, 'TextEncoder', {
        value: TextEncodingPolyfill.TextEncoder,
        writable: true,
        enumerable: false,
        configurable: true,
    });
    Object.defineProperty(global, 'TextDecoder', {
        value: TextEncodingPolyfill.TextDecoder,
        writable: true,
        enumerable: false,
        configurable: true,
    });
    console.log('Polyfills overwritten via Object.defineProperty.');
} catch (e) {
    console.error('Failed to overwrite globals via defineProperty:', e);
    // Fallback
    global.TextEncoder = TextEncodingPolyfill.TextEncoder;
    global.TextDecoder = TextEncodingPolyfill.TextDecoder;
}

try {
    console.log('Current TextDecoder code:', global.TextDecoder.toString());
} catch (e) { }

try {
    const decoder = new global.TextDecoder('utf-16le');
    console.log('Sanity check: utf-16le is supported.');
} catch (e) {
    console.error('Sanity check FAILED: utf-16le not supported!', e);
}
