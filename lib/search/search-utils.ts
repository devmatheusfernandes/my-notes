import { normalizeTerm } from "@/lib/video/tokenize";

export interface SearchTerm {
    term: string;
    original: string;
    exact: boolean;
}

export function parseSearchQuery(query: string): SearchTerm[] {
    // Regex for:
    // 1. Text between quotes (single or double) -> Group 2
    // 2. Unquoted words -> Group 3
    const regex = /(['"])(.*?)\1|(\S+)/g;

    // Clean common separators but keep quotes
    const cleanQuery = query.replace(/[,\.]/g, " ");

    const terms: SearchTerm[] = [];
    let match;
    while ((match = regex.exec(cleanQuery)) !== null) {
        if (match[2] && match[2].trim()) {
            const raw = match[2].trim();
            terms.push({
                term: normalizeTerm(raw),
                original: raw,
                exact: true
            });
        } else if (match[3] && match[3].trim()) {
            const raw = match[3].trim();
            terms.push({
                term: normalizeTerm(raw),
                original: raw,
                exact: false
            });
        }
    }
    return terms;
}

export function escapeRegExp(string: string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function checkMatch(text: string, term: SearchTerm): boolean {
    const normalizedText = normalizeTerm(text);
    if (term.exact) {
        // Use word boundary for exact matches
        // Note: word boundaries (\b) might not work perfectly with non-ASCII chars
        // but normalizeTerm removes most accents.
        try {
            const escaped = escapeRegExp(term.term);
            const regex = new RegExp(`\\b${escaped}\\b`, 'i');
            return regex.test(normalizedText);
        } catch {
            return normalizedText.includes(term.term);
        }
    }
    return normalizedText.includes(term.term);
}

export function splitIntoParagraphs(text: string): string[] {
    return text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
}

export function splitIntoSentences(text: string): string[] {
    // Basic sentence splitting (handles common Portuguese abbreviations if needed, 
    // but here we keep it simple)
    return text.split(/(?<=[.!?])\s+(?=[A-Z\xC0-\xDF])/).filter(s => s.trim().length > 0);
}
