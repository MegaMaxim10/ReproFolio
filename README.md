# ReproFolio

A schema-driven static site framework for academic and professional portfolios.

It converts structured JSON content into production-ready static HTML/CSS/JS, with:
- declarative page components
- config-driven content references (`cfg` and `hook` tokens)
- generated navigation/breadcrumb/related links
- configurable templates, styles, scripts, and SEO
- framework runtime behavior separated from developer custom code

## What This Framework Is

This project is a static site framework, not a theme-only starter.

You define content as JSON files in `src/content/`.  
The build system validates JSON against `schemas/page.schema.json`, renders component blocks, applies templates, copies assets, and minifies output into `public/`.

## Starter Content

This repository ships with sanitized placeholder content only.

- Sample pages live in `src/content/`.
- Placeholder assets live in `src/assets/images/placeholders/` and `src/assets/images/profile/profile-placeholder.svg`.
- Update `portfolio-config.json` with your own public metadata before production deployment.

## Core Principles

1. Content-first: content is data (`.json`) and validated before build.
2. Declarative presentation: named template bundles (html/css/js) are selected in config, not hardcoded per page.
3. Framework vs custom separation: reusable framework logic lives in `scripts/core`; developer-specific logic lives in `src/css` and `src/js`.

## Quick Start

### Requirements
- Node.js 18+
- npm

### Install

```bash
npm install
```

### Main Commands

```bash
# validate all content JSON files
npm run validate:content

# run test suite
npm test

# build site into public/
npm run build

# serve existing public/ output locally
npm run serve

# build and serve the full site locally (preview)
npm run preview

# build only one content page (still with assets and full navigation context)
npm run build:page -- src/content/1-news/1/1-post-1.json

# serve and open root redirected to one page (expects an existing build)
npm run serve:page -- src/content/1-news/1/1-post-1.json

# build and serve one page in one command
npm run preview:page -- src/content/1-news/1/1-post-1.json

# full verification pipeline
npm run verify
```

Open `public/index.html` after build, or use `npm run serve` / `npm run preview`.

## Build Pipeline

1. Load and merge `portfolio-config.json` with framework defaults.
2. Resolve content references (`{{cfg:...}}`, `{{hook:...}}`) in page JSON.
3. Validate resolved content against `schemas/page.schema.json`.
4. Build site graph from `src/content/` directory structure.
5. Render page blocks via component renderers in `scripts/core/components/`.
6. Apply selected template and inject navigation/breadcrumb/related links.
7. Generate SEO/social tags and structured data.
8. Copy static assets and framework/custom scripts.
9. Minify final output.

## Project Structure

```text
templates/                  Named template folders with template-config.json
schemas/                    JSON schema definitions
scripts/                    Build pipeline modules
  builders/                 Build orchestration, config, navigation, graph
  core/                     Renderers, block processors, reusable core logic
src/
  content/                  Page content JSON
  assets/                   Static images/documents/icons
  css/                      Developer custom styles (includes custom.css)
  js/                       Developer custom scripts (includes custom.js)
public/                     Build output
portfolio-config.json       Main framework customization file
```

## Configuration Overview

Main configuration file: `portfolio-config.json`

Top-level sections:
- `site`: site title, branding, author, contact/social metadata used by build and footer.
- `templates`: default template selection.
- `custom` (optional): global custom styles/scripts loaded for all pages.
- `seo` (optional): global SEO/social defaults.

See:
- `docs/templating-and-styling.md`
- `docs/seo-metadata.md`
- `docs/components-reference.md`
- `docs/content-references.md`
- `docs/style-reference.md`
- `docs/runtime-and-scripts.md`

## Content Authoring Model

Each page uses this shape:

```json
{
  "meta": {
    "id": "contact",
    "title": "Contact",
    "language": "en"
  },
  "header": {
    "title": "Contact",
    "lead": "Get in touch."
  },
  "body": [
    { "type": "paragraph", "data": { "text": "Hello" } }
  ],
  "footer": {
    "notes": "Optional page footer notes"
  }
}
```

Supported block types are documented in detail in `docs/components-reference.md`.

### Content References (`cfg` and `hook`)

Content JSON can reference configuration values and computed values:

- `{{cfg:site.contact.fullName}}` -> reads directly from `portfolio-config.json`
- `{{hook:contact.phoneTelUrl(0)}}` -> resolves through framework hooks

Resolution happens before validation and rendering, so referenced values behave like normal JSON content values.

## Framework Runtime vs Custom Runtime

Framework core runtime entry:
- `scripts/core/runtime/runtime.js`

Template runtime entry (template-owned):
- `templates/default/assets/js/runtime.js`

Developer runtime entry:
- `src/js/custom.js`

By default, core runtime, template runtime, and developer runtime are loaded.  
Core runtime handles component-level reusable behavior (content collections/carousels/lightbox, form validation/security).  
Template runtime handles template-specific behavior (theme/nav/layout).  
Developer code should only contain project-specific behavior.

## Form System Highlights

The `form` block supports:
- required markers
- field help text
- declarative validation (`minLength`, `pattern`, ranges, ...)
- declarative custom messages (`required`, `tooShort`, ...)
- provider-specific behavior (for example Formspree with anti-bot challenge and confirmation dialog)

See `docs/components-reference.md` for full form schema and examples.

## Deployment

This is static output, deployable anywhere:
- GitHub Pages
- Netlify
- Vercel
- S3/CloudFront
- nginx/Apache static hosting

If deploying under a sub-path:

```bash
BASE_PATH=/portfolio npm run build
```

## Testing

Tests are in:
- `tests/renderer/` component rendering tests
- `tests/scripts/` build/navigation/graph tests

Run:

```bash
npm test
```

Run one test file:

```bash
npm test -- tests/renderer/paragraph.test.js
```

Run one test by name (within one or many files):

```bash
npm test -- -t "renders inline formatting"
```

Run one named test inside one file:

```bash
npm test -- tests/renderer/paragraph.test.js -t "renders inline formatting"
```

## License

MIT
