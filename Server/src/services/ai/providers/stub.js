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

function draftAssessment({ text = "", subject = "", topic = "", mode = "test", count = 5, difficulty = "moderate" } = {}) {
    const n = Math.min(Math.max(parseInt(count, 10) || 5, 1), 30);
    const about = topic || subject || "the topic";
    const questions = [];
    for (let i = 1; i <= n; i++) {
        questions.push({
            text: `Sample ${difficulty} question ${i} on ${about}${text ? " (from your pasted material)" : ""}.`,
            options: ["Option A", "Option B", "Option C", "Option D"],
            correctIndex: i % 4,
            marks: 1,
            explanation: "Sample explanation — set AI_PROVIDER=gemini + GEMINI_API_KEY for real drafts.",
        });
    }
    return {
        provider: "stub",
        title: `${mode === "practice" ? "Practice" : "Test"}: ${about}`,
        description: "Sample draft — configure an AI provider to generate from your material.",
        questions,
    };
}

function generateStudyNote({ prompt = "", subject = "" } = {}) {
    const ask = String(prompt).trim() || "study notes based on the attached material";
    const subj = subject ? ` (${subject})` : "";
    const content =
        `_Sample AI note — set AI_PROVIDER=gemini and GEMINI_API_KEY for real results._\n\n` +
        `**Your request:** ${ask}\n\n` +
        `## Overview\nOnce AI is enabled, the note the AI writes for your request${subj} will appear here — ` +
        `in whatever form you asked for (short notes, detailed notes, MCQs, a summary, and so on).\n\n` +
        `## Key Points\n- Point one\n- Point two\n- Point three\n\n` +
        `## Example\nA short worked example would appear here.`;
    return {
        provider: "stub",
        title: (subject ? `${subject} — ` : "") + "Sample note",
        description: `Sample note for: ${ask.slice(0, 60)}`,
        content,
    };
}

function structureSyllabus({ text = "", subject = "" } = {}) {
    // Try to make the sample feel related to what was pasted by pulling a few
    // capitalised phrases as topic names; otherwise fall back to placeholders.
    const guesses = (String(text).match(/[A-Z][A-Za-z][A-Za-z ]{3,40}/g) || [])
        .map((s) => s.trim())
        .filter((s, i, a) => a.indexOf(s) === i)
        .slice(0, 6);
    const topicNames = guesses.length ? guesses : ["Fundamentals", "Core Concepts", "Applications", "Problem Solving"];
    const mid = Math.ceil(topicNames.length / 2);
    const mkTopics = (names) => names.map((t) => ({ title: t, estimatedHours: 3 }));
    return {
        provider: "stub",
        title: subject ? `${subject} Syllabus` : "Syllabus",
        subject,
        chapters: [
            { title: "Chapter 1 — Basics", topics: mkTopics(topicNames.slice(0, mid)) },
            { title: "Chapter 2 — Advanced", topics: mkTopics(topicNames.slice(mid)) },
        ],
    };
}

function predictDifficulty({ questionText = "" } = {}) {
    const len = questionText.trim().length;
    const difficulty = len > 160 ? "hard" : len > 80 ? "moderate" : "easy";
    return {
        provider: "stub",
        difficulty,
        confidence: 0.6,
        rationale:
            "Sample heuristic based on question length — configure an AI provider (Gemini) " +
            "for a real difficulty prediction.",
    };
}

function generateStudyPlan({ targetExam = "LEET", days = 7, hoursPerDay = 2, weakAreas = [] } = {}) {
    const topics = weakAreas.length
        ? weakAreas
        : ["Mathematics", "Physics", "Digital Electronics", "C Programming", "Mechanics"];
    const n = Math.min(Math.max(parseInt(days, 10) || 7, 1), 30);
    const plan = [];
    for (let d = 1; d <= n; d++) {
        const topic = topics[(d - 1) % topics.length];
        plan.push({
            day: d,
            focus: topic,
            hours: hoursPerDay,
            tasks: [`Revise ${topic} concepts`, `Solve 15 ${topic} PYQs`, "Take a short quiz"],
        });
    }
    return {
        provider: "stub",
        targetExam,
        summary: `A ${n}-day sample plan. Configure an AI provider for a personalised schedule.`,
        plan,
    };
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

module.exports = {
    summarizeNote,
    generateFlashcards,
    generateQuestions,
    draftAssessment,
    generateStudyNote,
    structureSyllabus,
    predictDifficulty,
    generateStudyPlan,
    analyzePerformance,
};
