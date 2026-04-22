# Style Hook Reference

This file lists stable CSS hooks intended for customization.

## Global Layout

- `.site-header`
- `.breadcrumb`
- `.main`
- `.content`
- `.related-pages`
- `.site-footer`

## Header And Navigation

- `.nav-container`
- `.site-brand`
- `.brand-link`
- `.brand-logo`
- `.site-nav`
- `.menu-root`
- `.menu-item`
- `.menu-link`
- `.submenu`
- `.submenu-link`
- `.nav-toggle`
- `.theme-toggle`

## Footer

- `.site-footer-inner`
- `.footer-copyright`
- `.footer-socials`
- `.footer-socials-links`
- `.footer-social-link`
- `.footer-socials-contact`
- `.footer-updated`

## Block Wrappers

- `.block-paragraph`
- `.block-list`
- `.block-card-grid`
- `.block-timeline`
- `.block-form`
- `.block-asset`
- `.block-html-content`
- `.block-map`
- `.block-link-groups`
- `.block-layout-row`
- `.block-feature-image`

## Form System

- `.form-block`
- `.form-field`
- `.form-label`
- `.form-label-text`
- `.form-required`
- `.form-help`
- `.form-error`
- `.captcha-fieldset`
- `.captcha-question`
- `.captcha-input`

## Dialog (Framework Confirmation)

- `.framework-dialog`
- `.framework-dialog-content`
- `.framework-dialog-title`
- `.framework-dialog-message`
- `.framework-dialog-actions`
- `.framework-dialog-btn`
- `.framework-dialog-btn.is-primary`

## Map And Link Groups

- `.map-block`
- `.map-frame`
- `.map-meta`
- `.map-address`
- `.map-coordinates`
- `.map-open-link`
- `.link-groups`
- `.link-groups-grid`
- `.link-group`
- `.link-groups-list`
- `.link-groups-link`
- `.link-groups-label`
- `.link-groups-icon`
- `.layout-row`
- `.layout-row-line`
- `.layout-row-item`
- `.feature-image`
- `.feature-image-frame`
- `.feature-image-zoom-overlay`

## Home Page (Current Composition)

- `.demo-hero-row`
- `.demo-intro-stack`
- `.demo-feature-image`
- `.demo-kicker`
- `.demo-title`
- `.demo-lead`
- `.demo-quick-actions`

## Extension Rule

Preferred approach:
1. add custom class names with block/page `style` or `presentation.bodyClass`
2. target those classes in `src/css/custom.css` or additional files under `src/css/`

Avoid direct edits to framework selectors unless you are evolving framework behavior.

For content-level data reuse, prefer `cfg`/`hook` tokens in JSON over styling workarounds.
