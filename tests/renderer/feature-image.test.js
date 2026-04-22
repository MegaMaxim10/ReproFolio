import { describe, it, expect } from "vitest";
import { renderFeatureImage } from "../../scripts/core/components/feature-image.js";
import { renderPage } from "../../scripts/core/renderer.js";

describe("renderFeatureImage", () => {
  it("renders feature image with configured style classes", () => {
    const block = {
      type: "feature-image",
      data: {
        src: "src/assets/images/profile/profile-placeholder.svg",
        alt: "Portrait",
        shape: "circle",
        shadow: true,
        loadEffect: "slide-ltr"
      }
    };

    const html = renderFeatureImage(block);
    expect(html).toContain("block-feature-image");
    expect(html).toContain("shape-circle");
    expect(html).toContain("effect-slide-ltr");
    expect(html).toContain("has-shadow");
    expect(html).toContain('{{basePath}}/assets/images/profile/profile-placeholder.svg');
  });

  it("adds zoom markup when zoom is enabled", () => {
    const block = {
      type: "feature-image",
      id: "avatar",
      data: {
        src: "src/assets/images/profile/profile-placeholder.svg",
        zoom: true
      }
    };

    const html = renderFeatureImage(block);
    expect(html).toContain("is-zoomable");
    expect(html).toContain("feature-image-zoom-toggle");
    expect(html).toContain('for="feature-image-zoom-avatar"');
    expect(html).toContain("feature-image-zoom-overlay");
  });

  it("keeps legacy profile-image type working through renderer alias", () => {
    const page = {
      meta: { id: "legacy-image", title: "Legacy Image", language: "en" },
      body: [
        {
          type: "profile-image",
          data: {
            src: "src/assets/images/profile/profile-placeholder.svg",
            shape: "circle"
          }
        }
      ]
    };

    const html = renderPage(page);
    expect(html).toContain("block-feature-image");
  });
});

