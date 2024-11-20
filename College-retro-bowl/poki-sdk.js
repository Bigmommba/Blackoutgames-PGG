(() => {
    // Helper function to get URL query parameters safely
    const getURLParam = (key) => {
        try {
            const regex = new RegExp(`[?&]${key}=([^&]*)`);
            const match = regex.exec(window.location.search);
            return match ? decodeURIComponent(match[1].replace(/\+/g, " ")) : null;
        } catch (error) {
            console.error(`Error getting URL parameter '${key}':`, error);
            return null;
        }
    };

    const isKidsMode = getURLParam("tag") === "kids";
    const hasAdBridge = !!window.adBridge;
    const isHoistMode = ["yes", "yes"].includes(getURLParam("hoist")) || getURLParam("gdhoist") === "yes";

    class SDKManager {
        constructor() {
            this.queue = [];
            this.isInitialized = false;
        }

        enqueue(fnName, args, resolve, reject) {
            if (this.isInitialized) {
                resolve && resolve(true); // Automatically resolve if initialized
            } else {
                this.queue.push({ fnName, args, resolve, reject });
            }
        }

        dequeue() {
            while (this.queue.length > 0) {
                const { fnName, args, resolve, reject } = this.queue.shift();

                if (typeof window.PokiSDK?.[fnName] === "function") {
                    const isInit = fnName === "init";

                    // Safely execute SDK methods
                    window.PokiSDK[fnName](...args)
                        .then((...results) => {
                            resolve && resolve(...results);
                            if (isInit) this.dequeue();
                        })
                        .catch((error) => {
                            console.error(`Error in '${fnName}':`, error);
                            reject && reject(error);
                            if (isInit) this.dequeue();
                        });

                    if (isInit) break; // Dequeue only after init
                } else {
                    console.error(`Function '${fnName}' is not available in PokiSDK.`);
                }
            }
        }
    }

    // Create SDKManager instance
    const sdkManager = new SDKManager();

    // Public API
    window.PokiSDK = {
        init: (config = {}, options = {}) => new Promise((resolve, reject) => sdkManager.enqueue("init", [config, options], resolve, reject)),
        commercialBreak: (config) => new Promise((resolve, reject) => sdkManager.enqueue("commercialBreak", [config], resolve, reject)),
        rewardedBreak: () => Promise.resolve(false),
        displayAd: (config, onSuccess, onFailure) => {
            onSuccess && onSuccess();
            onFailure && onFailure();
        },
        shareableURL: () => Promise.reject(new Error("shareableURL is not implemented.")),
        getURLParam: getURLParam,
        getLanguage: () => (navigator.language || "en").toLowerCase().split("-")[0],
    };

    // Add placeholders for additional methods
    [
        "captureError",
        "customEvent",
        "gameInteractive",
        "gameLoadingFinished",
        "gameLoadingProgress",
        "gameLoadingStart",
        "gameplayStart",
        "gameplayStop",
        "happyTime",
        "logError",
        "muteAd",
        "roundEnd",
        "roundStart",
        "sendHighscore",
        "setDebug",
        "setLogging",
    ].forEach((method) => {
        window.PokiSDK[method] = (...args) => sdkManager.enqueue(method, args);
    });

    // Dynamically load SDK script
    const loadSDKScript = () => {
        try {
            const sdkVersion = window.pokiSDKVersion || getURLParam("ab") || "default-sdk-version";
            let sdkFileName = `poki-sdk-core-${sdkVersion}.js`;

            if (isKidsMode) sdkFileName = `poki-sdk-kids-${sdkVersion}.js`;
            if (hasAdBridge) sdkFileName = `poki-sdk-playground-${sdkVersion}.js`;
            if (isHoistMode) sdkFileName = `poki-sdk-hoist-${sdkVersion}.js`;

            const sdkScriptURL = `scripts/${sdkVersion}/${sdkFileName}`;
            const script = document.createElement("script");
            script.src = sdkScriptURL;
            script.type = "text/javascript";
            script.crossOrigin = "anonymous";

            script.onload = () => {
                sdkManager.isInitialized = true;
                sdkManager.dequeue(); // Process queue
            };

            script.onerror = (error) => {
                console.error("Failed to load PokiSDK script:", error);
            };

            document.head.appendChild(script);
        } catch (error) {
            console.error("Error loading SDK script:", error);
        }
    };

    loadSDKScript();
})();
