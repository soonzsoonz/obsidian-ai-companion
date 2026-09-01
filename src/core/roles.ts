import { t } from '../i18n';

/**
 * Which voice the AI answers in, and when.
 *
 * A single "be practical" instruction turned out to mean "judge everything by
 * whether it helps your work" — so a book someone saved because they liked it
 * came back rated 重要性偏低. People keep things for many reasons, and the
 * answer should match the reason. These rules make that explicit and editable
 * rather than an assumption buried in a prompt.
 */
export interface RoleDefinition {
    id: string;
    /** Display name, e.g. 心靈導師. */
    name: string;
    /** Shown before the answer so the voice is visible at a glance. */
    emoji: string;
    /** The instruction handed to the AI when this role is chosen. */
    prompt: string;
}

export interface RoleRule {
    id: string;
    /** What the entry or link is about, in the reader's own words. */
    situation: string;
    /** Role ids, most important first. */
    roles: string[];
}

/**
 * The built-in voices, before localisation.
 *
 * Names, situations and prompts are i18n keys resolved when the defaults are
 * first handed out, so installing in Japanese gives Japanese rules rather than
 * a page of Chinese. Once saved they become ordinary editable text — a
 * language change never overwrites wording the reader has made their own.
 */
const ROLE_SEEDS = [
    { id: 'confidant', emoji: '🫂' },
    { id: 'friend', emoji: '☕' },
    { id: 'teacher', emoji: '🎒' },
    { id: 'parent-coach', emoji: '👨‍👩‍👧' },
    { id: 'life-hacker', emoji: '💡' },
    { id: 'finance', emoji: '💰' },
    { id: 'engineer', emoji: '🔧' },
    { id: 'scout', emoji: '📡' },
    { id: 'creative', emoji: '🎨' },
    { id: 'librarian', emoji: '📚' }
] as const;

const RULE_SEEDS = [
    { id: 'r-people', roles: ['confidant', 'friend'] },
    { id: 'r-children', roles: ['teacher', 'parent-coach'] },
    { id: 'r-life', roles: ['life-hacker', 'scout'] },
    { id: 'r-money', roles: ['finance'] },
    { id: 'r-tech', roles: ['engineer'] },
    { id: 'r-creative', roles: ['creative', 'scout'] },
    { id: 'r-interest', roles: ['librarian', 'scout'] },
    { id: 'r-family-use', roles: ['life-hacker', 'friend'] }
] as const;

/** Maps a seed id to its i18n keys. Kept explicit so a typo is a build error. */
const ROLE_KEYS = {
    'confidant': ['ROLE_CONFIDANT_NAME', 'ROLE_CONFIDANT_PROMPT'],
    'friend': ['ROLE_FRIEND_NAME', 'ROLE_FRIEND_PROMPT'],
    'teacher': ['ROLE_TEACHER_NAME', 'ROLE_TEACHER_PROMPT'],
    'parent-coach': ['ROLE_PARENT_NAME', 'ROLE_PARENT_PROMPT'],
    'life-hacker': ['ROLE_LIFE_NAME', 'ROLE_LIFE_PROMPT'],
    'finance': ['ROLE_FINANCE_NAME', 'ROLE_FINANCE_PROMPT'],
    'engineer': ['ROLE_ENGINEER_NAME', 'ROLE_ENGINEER_PROMPT'],
    'scout': ['ROLE_SCOUT_NAME', 'ROLE_SCOUT_PROMPT'],
    'creative': ['ROLE_CREATIVE_NAME', 'ROLE_CREATIVE_PROMPT'],
    'librarian': ['ROLE_LIBRARIAN_NAME', 'ROLE_LIBRARIAN_PROMPT']
} as const;

const RULE_KEYS = {
    'r-people': 'RULE_PEOPLE',
    'r-children': 'RULE_CHILDREN',
    'r-life': 'RULE_LIFE',
    'r-money': 'RULE_MONEY',
    'r-tech': 'RULE_TECH',
    'r-creative': 'RULE_CREATIVE',
    'r-interest': 'RULE_INTEREST',
    'r-family-use': 'RULE_FAMILY_USE'
} as const;

/** The built-in voices in the reader's language. */
export function defaultRoles(): RoleDefinition[] {
    return ROLE_SEEDS.map(seed => {
        const [nameKey, promptKey] = ROLE_KEYS[seed.id];
        return {
            id: seed.id,
            emoji: seed.emoji,
            name: t(nameKey),
            prompt: t(promptKey)
        };
    });
}

/** The built-in situation rules in the reader's language. */
export function defaultRules(): RoleRule[] {
    return RULE_SEEDS.map(seed => ({
        id: seed.id,
        situation: t(RULE_KEYS[seed.id]),
        roles: [...seed.roles]
    }));
}

/**
 * Renders the rules and role prompts into the instruction block both features
 * prepend to their prompts.
 */
export function renderRoleGuidance(rules: RoleRule[], roles: RoleDefinition[]): string {
    const byId = new Map(roles.map(r => [r.id, r]));
    const used = new Set<string>();

    const lines: string[] = [
        'Choose the voice that fits what is actually being discussed.',
        'Several may apply to one entry — answer each part in its own voice.',
        '',
        'Situation → voice (in order of preference):'
    ];

    for (const rule of rules) {
        const names = rule.roles
            .map(id => { used.add(id); return byId.get(id)?.name; })
            .filter(Boolean);
        if (names.length > 0) {
            lines.push(`- ${rule.situation} → ${names.join(' → ')}`);
        }
    }

    lines.push('', 'The voices:');
    for (const id of used) {
        const role = byId.get(id);
        if (role) lines.push(`- ${role.emoji} ${role.name}: ${role.prompt}`);
    }

    const first = byId.get([...used][0] ?? '');
    lines.push(
        '',
        'Open each answer with the emoji and name of the voice you are using,',
        'so the reader can see at a glance who is speaking — for example:',
        '',
        (first?.emoji ?? '') + ' **' + (first?.name ?? '') + '** — <the answer>',
        '',
        'When a passage genuinely needs a different voice, start a new line with',
        'that voice instead. Never use more than one voice for the same point.',
        '',
        'If nothing fits, answer as a thoughtful friend would. Never force an',
        'entry into a work frame it does not belong in.'
    );
    return lines.join('\n');
}
