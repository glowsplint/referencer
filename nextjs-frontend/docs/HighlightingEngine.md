# Highlighting Engine

This section serves as the documentation for the module that makes highlighting within Referencer possible.

---

## Goal

Let's start with the end in mind and work backwards towards it, crafting the necessary functions on the way in order to make the highlighting module possible.

The smallest building block possible will consist of a group of words that have the same format. For instance, components are rendered in the editor like this:

<b>Verse Number</b>:

```html
<span class="MuiTypography-root-85 MuiTypography-button-89">
  <b><sup>1</sup></b>
</span>
```

<b>Verse</b>

```html
<span class="Editor_word__1MSmS Editor_span__30Hlz">
  As a deer pants for flowing streams, so pants my soul for you, O God.
</span>
```

<b>Inline Footnotes</b>

```html
<span class="MuiTypography-root-85 MuiTypography-overline-98">
  <sup>(2)</sup>
</span>
```

Each of these are rendered as separate components.

Together, they could look something like this (additional line breaks added for ease of reading):

```html
<span class="MuiTypography-root-85 MuiTypography-button-89">
  <b><sup>1</sup></b>
</span>

<span class="Editor_word__1MSmS Editor_span__30Hlz">
  After this Jesus went about in Galilee. He would not go about in Judea,
  because the Jews
</span>

<span class="MuiTypography-root-85 MuiTypography-overline-98">
  <sup>(1)</sup>
</span>

<span class="Editor_word__1MSmS Editor_span__30Hlz">
  were seeking to kill him.
</span>
```

We need to be able support highlighting as well. A snippet of what this might look like at render time:

<b>Scenario with "in Galilee" highlighted</b>

```html
<span class="MuiTypography-root-85 MuiTypography-button-89">
  <b><sup>1</sup></b>
</span>

<span class="Editor_word__1MSmS Editor_span__30Hlz">
  After this Jesus went about
</span>

<span class="Editor_highlighted">in Galilee</span>

<span class="Editor_word__1MSmS Editor_span__30Hlz">
  . He would not go about in Judea, because the Jews
</span>

<span class="MuiTypography-root-85 MuiTypography-overline-98">
  <sup>(1)</sup>
</span>

<span class="Editor_word__1MSmS Editor_span__30Hlz">
  were seeking to kill him.
</span>
```

Note the span with class `Editor_highlighted` as a new component that is being rendered.

Inline footnotes are only split towards the leaves of the component tree, instead of during formatting time.

Highlighted elements should be treated the same way, and split up during component render rather than during formatting time.

The easiest way to implement this would be: within the component that splits into the highlighted, inline footnotes, and unhighlighted components, we hook into the Highlighting context to determine how the splitting should be done. Once the splitting can be determined, the respective components can be rendered.

The downside of such an approach is that since every child component is hooked into the Highlighting context, any change to the Highlighting context will cause all the child components to render. To reduce the amount of re-rendering, we will have to wrap child components in React.memo to memoize these child components, or live with the re-rendering (if the memoization takes up too much memory).
