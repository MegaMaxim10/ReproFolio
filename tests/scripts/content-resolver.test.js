import { describe, it, expect } from "vitest";
import { resolveContentConfigReferences } from "../../scripts/builders/content-resolver.js";

const config = {
  site: {
    title: "Demo",
    contact: {
      role: "Senior Lecturer/Researcher",
      institution: "Example University",
      department: "Department of Example Studies",
      postalAddress: "123 Example Avenue, Example City",
      office: "Building A, Office 101",
      coordinates: { latitude: 48.8566, longitude: 2.3522 },
      phones: ["+10000000000", "+10000000001"],
      emails: {
        institutional: "contact@example.edu",
        personal: ["a@x.com"],
        professional: []
      },
      socials: [{ key: "github", label: "GitHub", url: "https://github.com/example" }]
    }
  }
};

describe("content resolver", () => {
  it("resolves cfg and hook tokens", () => {
    const input = {
      text: "{{cfg:site.contact.role}} at {{cfg:site.contact.institution}}",
      map: {
        latitude: "{{cfg:site.contact.coordinates.latitude}}"
      },
      phoneLabel: "{{hook:contact.phoneDisplay(0)}}",
      phoneUrl: "{{hook:contact.phoneTelUrl(0)}}",
      mailto: "{{hook:contact.emailMailto(institutional)}}",
      social: "{{hook:contact.socialUrl(github)}}",
      profile: "{{hook:contact.profileLine}}",
      relativeUrl: "{{hook:url.resolve(6-contact/contact.html)}}",
      absoluteUrl: "{{hook:url.resolve(https://example.org/path)}}"
    };

    const resolved = resolveContentConfigReferences(input, config);
    expect(resolved.text).toContain("Senior Lecturer/Researcher");
    expect(resolved.map.latitude).toBe(48.8566);
    expect(resolved.phoneUrl).toBe("tel:+10000000000");
    expect(resolved.mailto).toBe("mailto:contact@example.edu");
    expect(resolved.social).toBe("https://github.com/example");
    expect(resolved.profile).toContain("Example University");
    expect(resolved.relativeUrl).toBe("{{basePath}}/6-contact/contact.html");
    expect(resolved.absoluteUrl).toBe("https://example.org/path");
  });
});


