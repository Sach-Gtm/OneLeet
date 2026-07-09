// Offline placeholder AI provider. Returns deterministic, plausible content so
// the AI features work before a real provider (Gemini) is configured. Every
// response carries provider:"stub" so the UI can show a subtle "sample" hint.

function summarizeNote({ title = "this note", subject = "", description = "" } = {}) {
    const subj = subject ? ` in ${subject}` : "";
    const base = description ? `${description} ` : "";
    return {
        provider: "stub",
        summary:
            `${base}${title} covers the core concepts${subj}. Start with the key definitions, ` +
            `work through the standard examples, then attempt past-year questions on the topic. ` +
            `Connect each idea back to what you already know before moving on.`,
        keyPoints: [
            `Core definitions and terminology${subj}`,
            "Standard worked examples and derivations",
            "Common exam question patterns to expect",
            "Links to related topics for revision",
        ],
    };
}

function generateFlashcards({ title = "this note", subject = "", count = 5 } = {}) {
    const n = Math.min(Math.max(parseInt(count, 10) || 5, 1), 20);
    const cards = [];
    for (let i = 1; i <= n; i++) {
        cards.push({
            question: `Key concept ${i} from "${title}"${subject ? ` (${subject})` : ""}?`,
            answer:
                "Sample flashcard answer — configure an AI provider (set AI_PROVIDER=gemini " +
                "and GEMINI_API_KEY) to generate real cards from this note.",
        });
    }
    return { provider: "stub", cards };
}

function generateQuestions({ subject = "", topic = "", difficulty = "moderate", count = 5 } = {}) {
    const n = Math.min(Math.max(parseInt(count, 10) || 5, 1), 30);
    const questions = [];
    for (let i = 1; i <= n; i++) {
        questions.push({
            question: `Sample ${difficulty} question ${i} on ${topic || subject || "the topic"}.`,
            options: ["Option A", "Option B", "Option C", "Option D"],
            answerIndex: i % 4,
            difficulty,
        });
    }
    return { provider: "stub", questions };
}

function analyzePerformance({ stats = {} } = {}) {
    return {
        provider: "stub",
        focusAreas: ["Thermodynamics", "Digital Logic"],
        summary:
            "Sample analysis — configure an AI provider to get a personalised breakdown of your " +
            "strengths and weak areas from your test history.",
        recommendations: [
            "Revise your weakest two topics first",
            "Take one timed mock test this week",
            "Practise 15 past-year questions daily",
        ],
        _statsSeen: Object.keys(stats || {}).length,
    };
}

module.exports = { summarizeNote, generateFlashcards, generateQuestions, analyzePerformance };
