let desktop = false;
let mobile = false;
let windows = false;
let xbox = false;
let android = false;
let ios = false;
let touch = false;
let gamepads = false;
let workers = false;
let passiveEvents = false;

if (typeof navigator !== 'undefined') {
    const ua = navigator.userAgent;

    if (/(windows|mac os|linux|cros)/i.test(ua))
        desktop = true;

    if (/xbox/i.test(ua))
        xbox = true;

    if (/(windows phone|iemobile|wpdesktop)/i.test(ua)) {
        mobile = true;
        windows = true;
    } else if (/android/i.test(ua)) {
        mobile = true;
        android = true;
    } else if (/ip([ao]d|hone)/i.test(ua)) {
        mobile = true;
        ios = true;
    }

    if (typeof window !== 'undefined') {
        touch = 'ontouchstart' in window || ('maxTouchPoints' in navigator && navigator.maxTouchPoints > 0);
    }

    gamepads = 'getGamepads' in navigator;

    workers = (typeof(Worker) !== 'undefined');

    try {
        const opts = Object.defineProperty({}, 'passive', {
            get: function () {
                passiveEvents = true;
                return false;
            }
        });
        window.addEventListener("testpassive", null, opts);
        window.removeEventListener("testpassive", null, opts);
    } catch (e) {}
}

/**
 * @namespace
 * @name platform
 * @description Global namespace that stores flags regarding platform environment and features support.
 * @example
 * if (pc.platform.touch) {
 *     // touch is supported
 * }
 */
const platform = {
    /**
     * @static
     * @readonly
     * @type {boolean}
     * @name platform.desktop
     * @description Is it a desktop or laptop device.
     */
    desktop: desktop,

    /**
     * @static
     * @readonly
     * @type {boolean}
     * @name platform.mobile
     * @description Is it a mobile or tablet device.
     */
    mobile: mobile,

    /**
     * @static
     * @readonly
     * @type {boolean}
     * @name platform.ios
     * @description If it is iOS.
     */
    ios: ios,

    /**
     * @static
     * @readonly
     * @type {boolean}
     * @name platform.android
     * @description If it is Android.
     */
    android: android,

    /**
     * @static
     * @readonly
     * @type {boolean}
     * @name platform.windows
     * @description If it is Windows.
     */
    windows: windows,

    /**
     * @static
     * @readonly
     * @type {boolean}
     * @name platform.xbox
     * @description If it is Xbox.
     */
    xbox: xbox,

    /**
     * @static
     * @readonly
     * @type {boolean}
     * @name platform.gamepads
     * @description If platform supports gamepads.
     */
    gamepads: gamepads,

    /**
     * @static
     * @readonly
     * @type {boolean}
     * @name platform.touch
     * @description If platform supports touch input.
     */
    touch: touch,

    /**
     * @static
     * @readonly
     * @type {boolean}
     * @name platform.workers
     * @description If the platform supports Web Workers.
     */
    workers: workers,

    /**
     * @private
     * @static
     * @readonly
     * @type {boolean}
     * @name platform.passiveEvents
     * @description If the platform supports an options object as the third parameter
     * to `EventTarget.addEventListener()` and the passive property is supported.
     */
    passiveEvents: passiveEvents
};

export { platform };
