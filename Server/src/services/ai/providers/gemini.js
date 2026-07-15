// Google Gemini provider. Uses the REST API via global fetch (Node 18+), so no
// SDK dependency. Activated when AI_PROVIDER=gemini and GEMINI_API_KEY is set.
// NOTE: verified against the documented API shape; needs a real key to run.

// `gemini-flash-lite-latest` is an always-current alias with the most generous
// free-tier quota — verified working with AI Studio (AQ.) keys. Override with
// GEMINI_MODEL if you move to a paid tier / bigger model.
const BASE_MODEL = () => process.env.GEMINI_MODEL || "gemini-flash-lite-latest";

// Model routing: "simple" tasks (MCQs, difficulty, flashcards, summaries) use
// the cheapest model; "smart" tasks (full drafts, study plans, analysis) MAY use
// a stronger one — but ONLY if you opt in via AI_MODEL_SMART. Everything defaults
// to the cheap base model, so there's no extra cost unless you choose it.
function modelForTier(tier) {
    if (tier === "smart") {
        return process.env.AI_MODEL_SMART || process.env.AI_MODEL_SIMPLE || BASE_BASE_MODEL();
    }
    return process.env.AI_MODEL_SIMPLE || BASE_BASE_MODEL();
}

const safeJsonParse = (text) => {
    if (!text) return null;
    // Gemini sometimes wraps JSON in ```json fences — strip them.
    const cleaned = text.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
    try {
        return JSON.parse(cleaned);
    } catch {
        return null;
    }
};

async function callGemini(prompt, { json = false, tier = "simple" } = {}) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error("GEMINI_API_KEY is not configured");

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelForTier(tier)}:generateContent?key=${key}`;
    const body = {
        contents: [{ parts: [{ text: prompt }] }],
        ...(json ? { generationConfig: { responseMimeType: "application/json" } } : {}),
    };

    // The "latest" aliases occasionally return 503 (overloaded) — retry once.
    let res;
    for (let attempt = 0; attempt < 2; attempt++) {
        res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });
        if (res.status !== 503) break;
    }

    if (!res.ok) {
        const errText = await res.text().catch(() => "");
        throw new Error(`Gemini API error ${res.status}: ${errText.slice(0, 300)}`);
    }

    const data = await res.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

// Cheap key/endpoint check — lists models (no generation cost). Used by the AI
// health endpoint so a bad key is obvious without burning quota.
async function verifyKey() {
    const key = process.env.GEMINI_API_KEY;
    if (!key) return { ok: false, error: "GEMINI_API_KEY is not set" };
    try {
        // A real generation is the only true test (it exercises quota + model),
        // but that costs quota — so we probe the models list (free) to confirm
        // the key authenticates, and report the configured model.
        const res = await fetch(
            "https://generativelanguage.googleapis.com/v1beta/models",
            { headers: { "x-goog-api-key": key } }
        );
        if (!res.ok) {
            const t = await res.text().catch(() => "");
            return { ok: false, model: BASE_MODEL(), error: `${res.status}: ${t.slice(0, 160)}` };
        }
        const data = await res.json();
        const modelAvailable = (data.models || []).some((m) =>
            (m.name || "").includes(BASE_MODEL())
        );
        return { ok: true, model: BASE_MODEL(), modelAvailable };
    } catch (e) {
        return { ok: false, error: e.message };
    }
}

async function summarizeNote({ title, subject, description, text } = {}) {
    const prompt =
        `You are a study assistant for the Indian LEET (Lateral Entry) engineering entrance exam. ` +
        `Summarise the following study note for a student in a few sentences and list the key points. ` +
        `Respond ONLY as JSON: {"summary": string, "keyPoints": string[]}.\n` +
        `Title: ${title}\nSubject: ${subject || "N/A"}\n` +
        `Content: ${text || description || "(summarise from the title and subject)"}`;
    const raw = await callGemini(prompt, { json: true });
    const parsed = safeJsonParse(raw) || { summary: raw, keyPoints: [] };
    return { provider: "gemini", summary: parsed.summary || "", keyPoints: parsed.keyPoints || [] };
}

async function generateFlashcards({ title, subject, description, text, count = 5 } = {}) {
    const prompt =
        `Create ${count} exam-revision flashcards from this study note for LEET prep. ` +
        `Respond ONLY as JSON: {"cards": [{"question": string, "answer": string}]}.\n` +
        `Title: ${title}\nSubject: ${subject || "N/A"}\n` +
        `Content: ${text || description || "(generate from the title and subject)"}`;
    const raw = await callGemini(prompt, { json: true });
    const parsed = safeJsonParse(raw) || { cards: [] };
    return { provider: "gemini", cards: Array.isArray(parsed.cards) ? parsed.cards : [] };
}

async function generateQuestions({ subject, topic, difficulty = "moderate", count = 5 } = {}) {
    const prompt =
        `Generate ${count} ${difficulty} multiple-choice questions for LEET prep on ` +
        `${topic || subject}. Each has exactly 4 options and one correct answer. ` +
        `Respond ONLY as JSON: {"questions": [{"question": string, "options": string[4], "answerIndex": number, "difficulty": string}]}.`;
    const raw = await callGemini(prompt, { json: true });
    const parsed = safeJsonParse(raw) || { questions: [] };
    return { provider: "gemini", questions: Array.isArray(parsed.questions) ? parsed.questions : [] };
}

// Draft a full assessment (test or practice set) from pasted source text (or a
// topic). Returns a title/description + MCQs with the correct index, marks and
// an explanation — everything the Studio needs to save an editable draft.
async function draftAssessment({ text, subject, topic, mode = "test", count = 5, difficulty = "moderate" } = {}) {
    const kind = mode === "practice" ? "practice question set" : "graded test";
    const source = text
        ? `Base the questions ONLY on this source material:\n"""\n${String(text).slice(0, 12000)}\n"""`
        : `Topic: ${topic || subject || "LEET general aptitude"}.`;
    const prompt =
        `You are creating a ${kind} for the Indian LEET (Lateral Entry) engineering entrance exam. ` +
        `Draft ${count} ${difficulty} multiple-choice questions. Each question has exactly 4 options, ` +
        `one correct answer given as a 0-based index, an integer marks value (default 1), and a ` +
        `one-line explanation of why the answer is correct. Also propose a concise title and a ` +
        `one-line description. ${source} ` +
        `Respond ONLY as JSON: {"title": string, "description": string, "questions": ` +
        `[{"text": string, "options": string[4], "correctIndex": number, "marks": number, "explanation": string}]}.`;
    const raw = await callGemini(prompt, { json: true, tier: "smart" });
    const parsed = safeJsonParse(raw) || {};
    return {
        provider: "gemini",
        title: parsed.title || topic || subject || "Untitled set",
        description: parsed.description || "",
        questions: Array.isArray(parsed.questions) ? parsed.questions : [],
    };
}

async function predictDifficulty({ questionText } = {}) {
    const prompt =
        `Classify the difficulty of this LEET exam question as one of easy, moderate, or hard, ` +
        `and briefly justify it. Respond ONLY as JSON: ` +
        `{"difficulty": "easy|moderate|hard", "confidence": number (0-1), "rationale": string}.\n` +
        `Question: ${questionText}`;
    const raw = await callGemini(prompt, { json: true });
    const parsed = safeJsonParse(raw) || {};
    return {
        provider: "gemini",
        difficulty: parsed.difficulty || "moderate",
        confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0.7,
        rationale: parsed.rationale || raw,
    };
}

async function generateStudyPlan({ targetExam = "LEET", days = 7, hoursPerDay = 2, weakAreas = [] } = {}) {
    const prompt =
        `Create a ${days}-day study plan for a student targeting ${targetExam}, studying about ` +
        `${hoursPerDay} hours/day. ${weakAreas.length ? `Prioritise these weak areas: ${weakAreas.join(", ")}. ` : ""}` +
        `Respond ONLY as JSON: {"summary": string, "plan": [{"day": number, "focus": string, "hours": number, "tasks": string[]}]}.`;
    const raw = await callGemini(prompt, { json: true, tier: "smart" });
    const parsed = safeJsonParse(raw) || { summary: raw, plan: [] };
    return {
        provider: "gemini",
        targetExam,
        summary: parsed.summary || "",
        plan: Array.isArray(parsed.plan) ? parsed.plan : [],
    };
}

async function analyzePerformance({ stats } = {}) {
    const prompt =
        `A LEET aspirant has these prep stats: ${JSON.stringify(stats || {})}. ` +
        `Give a short performance analysis with focus areas and recommendations. ` +
        `Respond ONLY as JSON: {"summary": string, "focusAreas": string[], "recommendations": string[]}.`;
    const raw = await callGemini(prompt, { json: true, tier: "smart" });
    const parsed = safeJsonParse(raw) || { summary: raw, focusAreas: [], recommendations: [] };
    return {
        provider: "gemini",
        summary: parsed.summary || "",
        focusAreas: parsed.focusAreas || [],
        recommendations: parsed.recommendations || [],
    };
}

module.exports = {
    verifyKey,
    summarizeNote,
    generateFlashcards,
    generateQuestions,
    draftAssessment,
    predictDifficulty,
    generateStudyPlan,
    analyzePerformance,
};
