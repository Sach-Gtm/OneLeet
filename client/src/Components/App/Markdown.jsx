import { cleanText } from "@/lib/markdown";

// A tiny, SAFE Markdown renderer (never dangerouslySetInnerHTML, so note text
// can't inject HTML/scripts). Handles headings, bullet + numbered lists, tables,
// **bold**, `code`, and paragraphs — and strips any LaTeX ($…$, \command) to
// plain Unicode so notes never render raw math.
function renderInline(text, keyBase) {
    return cleanText(text)
        .split(/(\*\*[^*]+\*\*|`[^`]+`)/g)
        .map((p, i) => {
            if (/^\*\*[^*]+\*\*$/.test(p)) return <strong key={`${keyBase}-b${i}`}>{p.slice(2, -2)}</strong>;
            if (/^`[^`]+`$/.test(p))
                return (
                    <code
                        key={`${keyBase}-c${i}`}
                        className="rounded bg-slate-100 px-1 py-0.5 text-[13px] text-slate-700 dark:bg-slate-800"
                    >
                        {p.slice(1, -1)}
                    </code>
                );
            return <span key={`${keyBase}-t${i}`}>{p}</span>;
        });
}

const isRow = (s) => /^\s*\|.*\|\s*$/.test(s);
const isSep = (s) => /-/.test(s) && /^\s*\|?[\s:|-]+\|?\s*$/.test(s);
const cells = (s) =>
    s.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim());

export default function Markdown({ content }) {
    const lines = String(content || "").split(/\r?\n/);
    const blocks = [];
    let i = 0;

    while (i < lines.length) {
        const line = lines[i].trimEnd();

        // Table (header row + separator + body rows)
        if (isRow(line) && i + 1 < lines.length && isSep(lines[i + 1])) {
            const header = cells(line);
            i += 2;
            const rows = [];
            while (i < lines.length && isRow(lines[i])) rows.push(cells(lines[i++]));
            blocks.push(
                <div key={`tbl-${i}`} className="my-3 overflow-x-auto">
                    <table className="w-full border-collapse text-sm">
                        <thead>
                            <tr>
                                {header.map((h, hi) => (
                                    <th
                                        key={hi}
                                        className="border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-left font-semibold text-slate-700 dark:bg-slate-800"
                                    >
                                        {renderInline(h, `th-${i}-${hi}`)}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((r, ri) => (
                                <tr key={ri}>
                                    {r.map((c, ci) => (
                                        <td
                                            key={ci}
                                            className="border border-slate-200 px-2.5 py-1.5 align-top text-slate-600"
                                        >
                                            {renderInline(c, `td-${i}-${ri}-${ci}`)}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            );
            continue;
        }

        // Bullet list
        if (/^\s*[-*]\s+/.test(line)) {
            const items = [];
            while (i < lines.length) {
                const m = lines[i].match(/^\s*[-*]\s+(.*)$/);
                if (!m) break;
                items.push(m[1]);
                i += 1;
            }
            blocks.push(
                <ul key={`ul-${i}`} className="my-2 ml-5 list-disc space-y-1">
                    {items.map((it, ii) => (
                        <li key={ii} className="text-sm leading-relaxed text-slate-600">
                            {renderInline(it, `li-${i}-${ii}`)}
                        </li>
                    ))}
                </ul>
            );
            continue;
        }

        // Numbered list
        if (/^\s*\d+[.)]\s+/.test(line)) {
            const items = [];
            while (i < lines.length) {
                const m = lines[i].match(/^\s*\d+[.)]\s+(.*)$/);
                if (!m) break;
                items.push(m[1]);
                i += 1;
            }
            blocks.push(
                <ol key={`ol-${i}`} className="my-2 ml-5 list-decimal space-y-1">
                    {items.map((it, ii) => (
                        <li key={ii} className="text-sm leading-relaxed text-slate-600">
                            {renderInline(it, `ol-${i}-${ii}`)}
                        </li>
                    ))}
                </ol>
            );
            continue;
        }

        i += 1;
        if (!line.trim()) continue;

        // Heading
        const h = line.match(/^(#{1,4})\s+(.*)$/);
        if (h) {
            const level = h[1].length;
            const cls =
                level <= 1
                    ? "mt-4 text-lg font-bold text-slate-900"
                    : level === 2
                    ? "mt-4 text-base font-bold text-slate-800"
                    : "mt-3 text-sm font-semibold text-slate-700";
            blocks.push(
                <p key={`h-${i}`} className={cls}>
                    {renderInline(h[2], `h-${i}`)}
                </p>
            );
            continue;
        }

        // Paragraph
        blocks.push(
            <p key={`p-${i}`} className="mt-2 text-sm leading-relaxed text-slate-600">
                {renderInline(line, `p-${i}`)}
            </p>
        );
    }

    return <div>{blocks}</div>;
}
