import { useEffect, useState } from "react";
import { getMyExamPatterns } from "@/Api/ExamPatternApi";

// Whole days from now until `date` (never negative), or null if there's no date.
// Computed live in the browser, so it counts down one day at a time on its own.
export function daysUntil(date) {
    if (!date) return null;
    const ms = new Date(date).getTime() - Date.now();
    if (Number.isNaN(ms)) return null;
    return Math.max(0, Math.ceil(ms / 86400000));
}

// The student's SOONEST upcoming exam that has a date set, with days remaining.
// Returns undefined while loading, then { examName, examDate, daysLeft } or null
// (signed in but no dated exam). Reads the same /exam-patterns/me the dashboard
// exam card uses.
export function useExamCountdown() {
    const [state, setState] = useState(undefined);
    useEffect(() => {
        let alive = true;
        getMyExamPatterns()
            .then((patterns) => {
                if (!alive) return;
                const dated = (patterns || []).filter((p) => p.examDate);
                if (!dated.length) return setState(null);
                const soonest = dated.reduce((a, b) =>
                    new Date(a.examDate).getTime() <= new Date(b.examDate).getTime() ? a : b
                );
                setState({
                    examName: soonest.examName,
                    examDate: soonest.examDate,
                    daysLeft: daysUntil(soonest.examDate),
                });
            })
            .catch(() => alive && setState(null));
        return () => {
            alive = false;
        };
    }, []);
    return state;
}
