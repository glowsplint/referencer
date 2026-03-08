# Bible Study Note-Taking UX Brainstorm

## 1. Annotation UX

### 1.5 Clutter-Free Toggle

One keystroke to hide ALL annotation markers and show clean text for distraction-free reading. Analogous to Google Docs' 2024 "hide comments" option.

**Impact**: Medium
**Inspired by**: Google Docs

As an additional feature, allow duplication without annotations (just texts).

### 5.3 @Mentions in Comments

Tag collaborators in comment text with `@name`. Triggers a notification (in-app badge or email). "Hey @Sarah, what do you think about this use of 'grace'?"

**Impact**: High
**Inspired by**: Hypothesis, Google Docs, Slack

### 6.4 Print-Optimized Layout

Improve the existing print CSS stub:

- Comments rendered as footnotes or margin notes
- Arrows rendered as numbered cross-references
- Layer legend at the top
- Clean typography optimized for paper

**Impact**: Medium
**Inspired by**: Existing print stub in codebase

### 8.6 Reduce Motion Option

Respect `prefers-reduced-motion` media query. Eliminate all slide/fade animations for users with vestibular disorders. WCAG 2.1 AA requirement.

**Impact**: Low (but important for accessibility compliance)
