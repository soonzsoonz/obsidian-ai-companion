import type { MarkdownPostProcessorContext } from 'obsidian';
import { sectionAliases, type SectionKey } from './notes';

const AI_SECTIONS: SectionKey[] = ['feedback', 'digest'];
const ALL_SECTIONS: SectionKey[] = ['journal', 'feedback', 'shares', 'digest'];

/**
 * Tags the plugin's own sections in rendered notes so a chosen style can
 * target them.
 *
 * Obsidian renders a note in chunks rather than as one tree, so a heading and
 * the paragraphs beneath it often arrive in separate calls. Rather than trying
 * to wrap a section in one element, this marks the elements themselves — which
 * survives chunked rendering, and leaves the note's markdown untouched.
 */
export function decorateSections(el: HTMLElement, _ctx: MarkdownPostProcessorContext): void {
    const headings = el.querySelectorAll('h2');

    for (const heading of Array.from(headings)) {
        const text = (heading.textContent ?? '').trim();
        const key = ALL_SECTIONS.find(section =>
            sectionAliases(section).some(alias => alias.replace(/^##\s*/, '') === text)
        );
        if (!key) continue;

        heading.addClass('ai-journey-section-heading');
        heading.addClass('ai-journey-section-' + key);

        // Everything up to the next h2 belongs to this section.
        const owned: Element[] = [];
        let node = heading.nextElementSibling;
        while (node && node.tagName !== 'H2') {
            owned.push(node);
            node = node.nextElementSibling;
        }

        const wrapper = heading.parentElement;
        if (wrapper) {
            wrapper.addClass('ai-journey-section');
            if (AI_SECTIONS.includes(key)) wrapper.addClass('ai-journey-ai');
        }
        for (const child of owned) {
            child.addClass('ai-journey-section-body');
            // The italic timestamp the plugin writes above each AI block.
            if (child.tagName === 'P' && child.children.length === 1
                && child.firstElementChild?.tagName === 'EM') {
                child.addClass('ai-journey-stamp');
            }
        }
    }
}
