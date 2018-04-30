'use strict';

/**
 * Merge custom constraints with the default one. The custom one take precedence.
 *
 * @param {Object} custom - custom webrtc constraints
 * @param {Object} def - default webrtc constraints
 * @return {Object} constraints - merged webrtc constraints
 */
export function mergeMediaConstraints(custom, def) {
  const constraints = (def ? Object.assign({}, def) : {});
  if (custom) {
    if (custom.mandatory) {
      constraints.mandatory = {...constraints.mandatory, ...custom.mandatory};
    }
    if (custom.optional && Array.isArray(custom.optional)) {
      // `optional` is an array, webrtc only finds first and ignore the rest if duplicate.
      constraints.optional = custom.optional.concat(constraints.optional);
    }
    if (custom.facingMode) {
      constraints.facingMode = custom.facingMode.toString(); // string, 'user' or the default 'environment'
    }
  }
  return constraints;
}

/**
* Returns a Promise and legacy callbacks compatible function
* @param {Function} method - The function to make Promise and legacy callbacks compatible
* @param {Boolean} [callbackFirst] - Indicate whether or not the success and failure callbacks are the firsts arguments
* @returns {Function}
*/
function promisify(method, callbackFirst) {
  return function (...origArgs) {
    const successPos = (callbackFirst ? 0 : origArgs.length - 2);
    const failurePos = (callbackFirst ? 1 : origArgs.length - 1);
    const success = origArgs[successPos];
    const failure = origArgs[failurePos];
    const hasSuccessFunc = (typeof success === 'function');
    const hasFailureFunc = (typeof failure === 'function');
    const args = (hasSuccessFunc && hasFailureFunc
        ? origArgs.filter(item => item !== success && item !== failure)
        : origArgs);

    return new Promise(function (resolve, reject) {
      const newArgs = (callbackFirst ? [resolve, reject, ...args] : [...args, resolve, reject]);

      // --- always pass resolve/reject as callback
      method(...newArgs);
    }).then((...res) => {
        if (hasSuccessFunc) success(...res);
      }, (...res) => {
        if (hasFailureFunc) failure(...res);
      }
    );
  };
}
