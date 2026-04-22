# Components Reference

This document describes every supported `body` block type.

All string fields in page JSON may use content-reference tokens:
- `{{cfg:...}}`
- `{{hook:...}}`

Reference details: `docs/content-references.md`

Each block follows:

```json
{
  "type": "block-type",
  "id": "optional-id",
  "style": ["optional", "custom-class"],
  "data": {}
}
```

## `paragraph`

Purpose: paragraph text with safe inline link support.

```json
{
  "type": "paragraph",
  "data": { "text": "Read [latest news](1-news/news.html)." }
}
```

Notes:
- Markdown-style links are supported with `[label](url)`.
- Relative links are auto-prefixed with `{{basePath}}/`.

## `heading`

Purpose: semantic heading in content area (supports inline rich text formatting).

```json
{
  "type": "heading",
  "data": { "level": 2, "text": "Research Interests" }
}
```

## `list`

Purpose: bullet or ordered list.

```json
{
  "type": "list",
  "data": {
    "ordered": false,
    "items": ["Software Engineering", "Workflows", "Formal Methods"]
  }
}
```

## Inline Text Formatting

The following inline formats are supported in text fields used by `paragraph`, `heading`, list items, and table cells:

- Links: `[label](url)`
- Bold: `[b]text[/b]` or `**text**`
- Italic: `[i]text[/i]` or `*text*`
- Underline: `[u]text[/u]` or `__text__`
- Strike: `[s]text[/s]` or `~~text~~`
- Code: `[code]text[/code]` or `` `text` ``
- Highlight: `[mark]text[/mark]`
- Color: `[color=#0d6adf]text[/color]`
- Font family: `[font=heading]text[/font]`, `[font=sans]`, `[font=serif]`, `[font=mono]`
- Font size: `[size=1.1rem]text[/size]` (supports `px`, `rem`, `em`, `%`)

## `timeline`

Purpose: chronological entries.

```json
{
  "type": "timeline",
  "data": {
    "items": [
      {
        "period": "2023-Now",
        "title": "Senior Lecturer",
        "description": "University role and scope."
      }
    ]
  }
}
```

## `link`

Purpose: explicit CTA link.

```json
{
  "type": "link",
  "data": {
    "label": "Visit Profile",
    "url": "https://example.org",
    "external": true
  }
}
```

Notes:
- `url` accepts URI references (absolute URLs, `mailto:`, `tel:`, or relative paths).
- For relative links, prefer `{{hook:url.resolve(...)}}`.

## `card-grid`

Purpose: responsive cards.

```json
{
  "type": "card-grid",
  "data": {
    "cards": [
      {
        "title": "Project A",
        "description": "Short description",
        "image": "assets/images/research/a.jpg",
        "link": "https://example.org/a"
      }
    ]
  }
}
```

## `asset`

Purpose: download/document/image references.

```json
{
  "type": "asset",
  "data": {
    "kind": "pdf",
    "src": "assets/documents/publications/sample-publication.pdf",
    "label": "Download CV"
  }
}
```

## `form`

Purpose: generic HTML form with framework validation hooks.

Required:
- `provider`
- `endpoint`
- `fields[]`

Field options:
- `name`, `label`, `type`, `required`
- `placeholder`, `autocomplete`, `helpText`
- `validation`: `minLength`, `maxLength`, `pattern`, `min`, `max`, `step`
- `messages`: custom error messages by validity key

Example:

```json
{
  "type": "form",
  "data": {
    "provider": "formspree",
    "endpoint": "https://formspree.io/f/xxxxxxx",
    "fields": [
      {
        "name": "email",
        "label": "Your email",
        "type": "email",
        "required": true,
        "placeholder": "name@example.com",
        "autocomplete": "email",
        "validation": { "minLength": 6 },
        "messages": {
          "required": "Please provide your email address.",
          "typeMismatch": "Please enter a valid email address."
        }
      },
      {
        "name": "message",
        "label": "Message",
        "type": "textarea",
        "required": true,
        "validation": { "minLength": 20 }
      }
    ]
  }
}
```

## `html-content`

Purpose: embed HTML from file.

```json
{
  "type": "html-content",
  "data": {
    "url": "src/content/carroussel.html"
  }
}
```

## `feature-image`

Purpose: render a single feature image with configurable shape, shadow, load animation, and click-to-zoom.

```json
{
  "type": "feature-image",
  "data": {
    "src": "src/assets/images/profile/profile-placeholder.svg",
    "alt": "Profile portrait",
    "shape": "circle",
    "shadow": true,
    "loadEffect": "slide-ltr",
    "zoom": true
  }
}
```

Compatibility note:
- Legacy `type: "profile-image"` is still accepted.

Supported `shape` values:
- `square`
- `rounded`
- `circle`
- `octagon`
- `hexagon`
- `diamond`

Supported `loadEffect` values:
- `none`
- `slide-ltr`
- `slide-rtl`
- `slide-ttb`
- `slide-btt`
- `fade-in`
- `blink`

## `media-image`

Purpose: single image with optional legend/caption and click-to-zoom lightbox behavior.

```json
{
  "type": "media-image",
  "data": {
    "src": "src/assets/images/activities/event.jpg",
    "alt": "Event photo",
    "legend": "Opening session",
    "zoom": true
  }
}
```

## `image-gallery`

Purpose: multi-image gallery with layout variants and lightbox carousel.

```json
{
  "type": "image-gallery",
  "data": {
    "layout": "photomontage",
    "zoom": true,
    "carousel": true,
    "images": [
      { "src": "src/assets/images/a.jpg", "caption": "Photo A" },
      { "src": "src/assets/images/b.jpg", "caption": "Photo B" }
    ]
  }
}
```

Supported `layout` values:
- `masonry`
- `photo`
- `justified`
- `moodboard`
- `photomontage`

## `embed`

Purpose: embed external content (iframe) or local/external videos.

```json
{
  "type": "embed",
  "data": {
    "kind": "iframe",
    "src": "https://example.org/embed/resource",
    "title": "Embedded resource",
    "ratio": "16 / 9"
  }
}
```

## `code-block`

Purpose: render formatted code snippets with optional line numbers.

```json
{
  "type": "code-block",
  "data": {
    "language": "js",
    "lineNumbers": true,
    "code": "console.log('hello');"
  }
}
```

## `table`

Purpose: render tabular data with optional caption and headers.

```json
{
  "type": "table",
  "data": {
    "caption": "Quick facts",
    "headers": ["Item", "Value"],
    "rows": [
      ["Date", "2026-02-17"],
      ["Location", "Example City"]
    ]
  }
}
```

## `content-collection`

Purpose: generic folder-based listing component (news, events, publications, etc.) rendered as cards with sort/filter controls.

```json
{
  "type": "content-collection",
  "data": {
    "source": "1-news",
    "includeRootFiles": false,
    "exclude": ["news.json"],
    "publishedOnly": true,
    "maxColumns": 3,
    "enableSort": true,
    "enableFilter": true
  }
}
```

Notes:
- Tag filters are shown in a dropdown panel to stay compact with large tag sets.
- Sorting/filtering is applied on already rendered HTML (client-side).

## `content-carousel`

Purpose: fixed-size, ordered folder listing in a horizontal carousel with previous/next controls and optional “view more” link.

```json
{
  "type": "content-carousel",
  "data": {
    "source": "1-news",
    "exclude": ["news.json"],
    "publishedOnly": true,
    "defaultSort": "date-desc",
    "limit": 10,
    "viewMoreUrl": "{{hook:url.resolve(1-news/news.html)}}",
    "viewMoreLabel": "View all news"
  }
}
```

## `map`

Purpose: embeddable location map with metadata.

```json
{
  "type": "map",
  "data": {
    "title": "Office map",
    "provider": "openstreetmap",
    "address": "Campus C, Faculty of Science",
    "latitude": 5.438799,
    "longitude": 10.071175,
    "height": 380
  }
}
```

`embedUrl` and `linkUrl` are optional overrides.  
If omitted, they are derived from `provider` + `latitude` + `longitude`.

## `layout-row`

Purpose: render one or more rows, each containing 1 to 6 components with optional width ratios.

```json
{
  "type": "layout-row",
  "data": {
    "rows": [
      {
        "components": [
          {
            "type": "feature-image",
            "data": {
              "src": "src/assets/images/profile/profile-placeholder.svg",
              "shape": "circle"
            }
          },
          {
            "type": "layout-row",
            "data": {
              "rows": [
                {
                  "components": [
                    { "type": "paragraph", "data": { "text": "Nested row content" } }
                  ]
                }
              ]
            }
          }
        ],
        "widths": [35, 65]
      },
      {
        "components": [
          {
            "type": "paragraph",
            "data": { "text": "Second row below the first row" }
          }
        ]
      }
    ]
  }
}
```

Notes:
- Backward-compatible single-row form is still supported with top-level `components` + `widths`.
- New multi-row form uses `rows[]`, each row having its own `components` and optional `widths`.
- A `layout-row` can now be nested inside another `layout-row`.
- default widths are equal (`2 -> 50/50`, `3 -> 33.33/33.33/33.33`, etc).
- widths accept numbers or percentage strings and are normalized to 100 (`[3,1]` becomes `75/25`).

## `link-groups`

Purpose: categorized multi-column links with optional icons.

```json
{
  "type": "link-groups",
  "data": {
    "title": "Profiles",
    "columns": 2,
    "groups": [
      {
        "title": "Professional",
        "links": [
          {
            "label": "GitHub",
            "url": "https://github.com/example",
            "external": true,
            "icon": "github"
          }
        ]
      }
    ]
  }
}
```

Notes:
- `links[].url` accepts URI references.
- For content-level relative links, you can use `{{hook:url.resolve(...)}}`.
- Built-in icon keys include `phone`, `email`, `whatsapp`, `contact`, `github`, `linkedin`, `x`, `researchgate`, `orcid`, `googlescholar`, `link`.

## `orcid`

Purpose: pull and render ORCID profile sections.

```json
{
  "type": "orcid",
  "data": {
    "orcidId": "0000-0000-0000-0000",
    "sections": ["works", "education", "employment"],
    "filters": {
      "workType": ["journal-article"],
      "sortBy": "date-desc",
      "limit": 20
    }
  }
}
```

## Tips

1. Use `style` to apply page-specific custom classes without editing framework CSS.
2. Use `cfg`/`hook` tokens to avoid duplicating contact/profile data in multiple pages.
3. Validate content with `npm run validate:content` after block edits.
4. To generate SEO-friendly page filenames from titles, set `"meta": { "slugFromTitle": true }` on that page.


