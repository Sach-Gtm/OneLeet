// Parse pasted/imported questions into the Studio editor's shape:
//   { text, options: string[], correctIndex, marks, explanation }
//
// Two input styles are auto-detected:
//
// 1) JSON — an array of objects (great for spreadsheet exports / AI output):
//      [{ "text": "...", "options": ["A","B","C","D"], "answer": "B", "explanation": "..." }]
//    `answer` may be a letter (A–H) or a 1-based number; `correctIndex` (0-based) also works.
//
// 2) Blocks — how question sites present them, one block per question, blocks
//    separated by a blank line:
//      Bee : Hive :: Bird : ?
//      A) Sky
//      B) Nest
//      C) Tree
//      D) Egg
//      Answer: B
//      Explanation: A hive is a bee's home.
//    Option lines start with A) / A. / (A) / 1) ; the answer line starts with
//    "Answer"/"Ans"/"Correct"; an optional "Explanation"/"Solution" line follows.

const letterOrNumberToIndex = (v) => {
    const t = String(v).trim().replace(/[().:\-\s]/g, "");
    if (/^[A-Ha-h]$/.test(t)) return t.toUpperCase().charCodeAt(0) - 65;
    const n = parseInt(t, 10);
    return Number.isFinite(n) ? n - 1 : -1; // 1-based number → 0-based
};

const clean = (q, i) => {
    const options = (q.options || []).map((o) => String(o).trim()).filter(Boolean);
    if (!q.text || !String(q.text).trim()) throw new Error(`Question ${i + 1}: missing text`);
    if (options.length < 2) throw new Error(`Question ${i + 1}: needs at least 2 options`);
    let ci = Number.isInteger(q.correctIndex) ? q.correctIndex : -1;
    if (ci < 0 || ci >= options.length) ci = 0;
    return {
        text: String(q.text).trim(),
        options,
        correctIndex: ci,
        marks: Number(q.marks) > 0 ? Number(q.marks) : 1,
        explanation: String(q.explanation || "").trim(),
    };
};

function fromJson(raw) {
    let arr;
    try {
        arr = JSON.parse(raw);
    } catch {
        throw new Error("That looks like JSON but couldn't be parsed — check the brackets and commas.");
    }
    if (!Array.isArray(arr)) arr = [arr];
    return arr.map((q, i) => {
        let ci = Number.isInteger(q.correctIndex) ? q.correctIndex : null;
        if (ci === null && q.answer != null) ci = letterOrNumberToIndex(q.answer);
        return clean({ ...q, correctIndex: ci ?? 0 }, i);
    });
}

function fromBlocks(raw) {
    const blocks = raw.split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);
    const out = [];
    blocks.forEach((block) => {
        const lines = block.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
        if (!lines.length) return;
        const options = [];
        // The first line is ALWAYS the question stem (strip any leading "12." number)
        // so a numbered question like "3. 7 : 49 : ?" isn't mistaken for an option.
        const questionLines = [lines[0].replace(/^\s*\d+[).:]\s*/, "")];
        let answer = null;
        let explanation = "";
        lines.slice(1).forEach((line) => {
            const ansM = line.match(/^(?:ans(?:wer)?|correct(?:\s*answer)?)\s*[:.-]?\s*\(?([A-Ha-h]|[1-8])\)?/i);
            const explM = line.match(/^(?:expl(?:anation)?|sol(?:ution)?)\s*[:.-]?\s*(.+)$/i);
            const optM = line.match(/^\(?([A-Ha-h1-8])[).:-]\s*(.+)$/);
            if (ansM) {
                answer = ansM[1];
            } else if (explM) {
                explanation = explM[1].trim();
            } else if (optM) {
                options.push(optM[2].trim());
            } else {
                questionLines.push(line); // continuation of the question stem
            }
        });
        const text = questionLines.join(" ").trim();
        if (!text || options.length < 2) return; // skip malformed block
        let correctIndex = answer != null ? letterOrNumberToIndex(answer) : 0;
        if (correctIndex < 0 || correctIndex >= options.length) correctIndex = 0;
        out.push({ text, options, correctIndex, marks: 1, explanation });
    });
    if (!out.length) throw new Error("No questions found. Each question needs a line of text, option lines (A) B) C)…), and an Answer line.");
    return out;
}

// Returns an array of editor-ready questions, or throws Error(message).
export function parseQuestions(raw) {
    const text = String(raw || "").trim();
    if (!text) throw new Error("Paste some questions first.");
    return text.startsWith("[") || text.startsWith("{") ? fromJson(text) : fromBlocks(text);
}
