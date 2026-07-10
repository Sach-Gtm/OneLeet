// Thin, provider-agnostic AI facade. Calling code (controllers) only ever
// touches this interface — never a specific provider — so swapping providers is
// a config change (AI_PROVIDER env var), not a code change.
//
//   AI_PROVIDER=gemini  + GEMINI_API_KEY   -> real Gemini
//   AI_PROVIDER=stub (or unset / no key)   -> offline placeholder
//
// To add a provider later (OpenAI, Claude, ...), drop a module in ./providers
// implementing the same four methods and register it in `providers` below.

const providers = {
    gemini: require("./providers/gemini"),
    stub: require("./providers/stub"),
};

function activeProviderName() {
    const name = (process.env.AI_PROVIDER || "stub").toLowerCase();
    // If Gemini is selected but no key is configured, fall back to the stub so
    // the app keeps working instead of erroring.
    if (name === "gemini" && !process.env.GEMINI_API_KEY) return "stub";
    return providers[name] ? name : "stub";
}

function getProvider() {
    return providers[activeProviderName()];
}

module.exports = {
    // Which provider is actually serving requests right now.
    activeProvider: activeProviderName,

    // Reports whether the active provider can actually be reached (used by the
    // AI health endpoint). The stub is always healthy.
    health: async () => {
        const name = activeProviderName();
        const provider = providers[name];
        const detail = provider.verifyKey ? await provider.verifyKey() : { ok: true };
        return { provider: name, ...detail };
    },

    summarizeNote: (input) => getProvider().summarizeNote(input),
    generateFlashcards: (input) => getProvider().generateFlashcards(input),
    generateQuestions: (input) => getProvider().generateQuestions(input),
    predictDifficulty: (input) => getProvider().predictDifficulty(input),
    generateStudyPlan: (input) => getProvider().generateStudyPlan(input),
    analyzePerformance: (input) => getProvider().analyzePerformance(input),
};
