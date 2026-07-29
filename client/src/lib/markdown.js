// Study notes should be plain Markdown, but language models love to sprinkle in
// LaTeX ($\rightarrow$, x^{2}, \frac{a}{b}) and backslash-escapes. These helpers
// convert that to clean, readable Unicode text so notes never show raw "$...$".

const LATEX = {
    "\\rightarrow": "→", "\\longrightarrow": "→", "\\to": "→", "\\Rightarrow": "⇒",
    "\\leftarrow": "←", "\\Leftarrow": "⇐", "\\leftrightarrow": "↔", "\\mapsto": "↦",
    "\\uparrow": "↑", "\\downarrow": "↓",
    "\\times": "×", "\\div": "÷", "\\cdot": "·", "\\ast": "∗", "\\star": "⋆",
    "\\pm": "±", "\\mp": "∓", "\\leq": "≤", "\\le": "≤", "\\geq": "≥", "\\ge": "≥",
    "\\neq": "≠", "\\ne": "≠", "\\approx": "≈", "\\equiv": "≡", "\\propto": "∝",
    "\\infty": "∞", "\\sum": "∑", "\\prod": "∏", "\\int": "∫", "\\sqrt": "√",
    "\\partial": "∂", "\\nabla": "∇", "\\degree": "°", "\\circ": "∘", "\\bullet": "•",
    "\\ldots": "…", "\\cdots": "⋯", "\\dots": "…",
    "\\in": "∈", "\\notin": "∉", "\\subset": "⊂", "\\subseteq": "⊆", "\\supset": "⊃",
    "\\cup": "∪", "\\cap": "∩", "\\emptyset": "∅", "\\forall": "∀", "\\exists": "∃",
    "\\land": "∧", "\\lor": "∨", "\\lnot": "¬", "\\oplus": "⊕", "\\otimes": "⊗",
    "\\alpha": "α", "\\beta": "β", "\\gamma": "γ", "\\delta": "δ", "\\epsilon": "ε",
    "\\zeta": "ζ", "\\eta": "η", "\\theta": "θ", "\\lambda": "λ", "\\mu": "μ",
    "\\nu": "ν", "\\rho": "ρ", "\\sigma": "σ", "\\tau": "τ", "\\phi": "φ", "\\chi": "χ",
    "\\psi": "ψ", "\\omega": "ω", "\\Delta": "Δ", "\\Gamma": "Γ", "\\Theta": "Θ",
    "\\Lambda": "Λ", "\\Sigma": "Σ", "\\Phi": "Φ", "\\Psi": "Ψ", "\\Omega": "Ω", "\\Pi": "Π",
    "\\quad": " ", "\\qquad": "  ", "\\,": " ", "\\;": " ", "\\:": " ",
};

// Replace \command tokens with Unicode; unknown commands keep their word.
function deLatex(s) {
    return String(s)
        .replace(/\\[a-zA-Z]+|\\[,;:]/g, (m) => (m in LATEX ? LATEX[m] : m.replace(/^\\/, "")));
}

export function cleanText(input) {
    let t = String(input == null ? "" : input);
    // \text{…}/\mathrm{…}/\mathbf{…} → inner content
    t = t.replace(/\\(?:text|mathrm|mathbf|mathit|mathsf|mathcal|operatorname)\s*\{([^{}]*)\}/g, "$1");
    // \frac{a}{b} → a/b
    t = t.replace(/\\frac\s*\{([^{}]*)\}\s*\{([^{}]*)\}/g, "($1/$2)");
    // strip $$…$$ then $…$ math, de-LaTeX-ing the inside
    t = t.replace(/\$\$([\s\S]*?)\$\$/g, (_, x) => deLatex(x));
    t = t.replace(/\\\(([\s\S]*?)\\\)/g, (_, x) => deLatex(x));
    t = t.replace(/\$([^$\n]*)\$/g, (_, x) => deLatex(x));
    // any remaining backslash commands outside math
    t = deLatex(t);
    // x^{2} → x^2, x_{i} → x_i (drop the grouping braces)
    t = t.replace(/([\^_])\{([^{}]*)\}/g, "$1$2");
    // unescape \-, \*, \., \#, etc.
    t = t.replace(/\\([-*._#>`~+=(){}[\]|\\])/g, "$1");
    return t;
}
