import { describe, it, expect } from "vitest";
import { renderOrcid } from "../../scripts/core/components/orcid.js";

describe("renderOrcid", () => {
  it("renders a basic orcid block with no data", () => {
    const block = {
      type: "orcid",
      data: {
        orcidId: "0000-0000-0000-0000",
        sections: ["works"]
      }
    };

    const html = renderOrcid(block);
    expect(html).toContain("orcid-profile");
    expect(html).toContain("0000-0000-0000-0000");
  });

  it("renders orcid block with cached works data", () => {
    const block = {
      type: "orcid",
      data: {
        orcidId: "0000-0000-0000-0000",
        sections: ["works"],
        cachedData: {
          sections: {
            works: [
              {
                title: "Test Publication",
                type: "journal-article",
                publicationDate: { year: { value: "2023" } },
                journalTitle: "Test Journal",
                externalIds: {
                  externalIdentifier: [
                    {
                      externalIdentifierType: "DOI",
                      externalIdentifierId: { value: "10.1234/test" }
                    }
                  ]
                }
              }
            ]
          }
        }
      }
    };

    const html = renderOrcid(block);
    expect(html).toContain("Publications");
    expect(html).toContain("Test Publication");
    expect(html).toContain("Journal Article");
    expect(html).toContain("2023");
    expect(html).toContain("DOI");
  });

  it("renders citation and extra metadata inside a collapsed panel by default", () => {
    const block = {
      type: "orcid",
      data: {
        orcidId: "0000-0000-0000-0000",
        sections: ["works"],
        cachedData: {
          sections: {
            works: [
              {
                title: "Sample Research Article",
                type: "journal-article",
                publicationDate: { year: { value: "2024" } },
                journalTitle: "Journal of Tests",
                volume: "17",
                issue: "2",
                number: "45",
                pages: "101-118",
                contributors: [
                  { name: "Ada Lovelace", sequence: "first" },
                  { name: "Alan Turing", sequence: "additional" }
                ],
                citationType: "apa",
                citationText: "Lovelace, A., & Turing, A. (2024). Sample Research Article.",
                externalIds: {
                  externalIdentifier: [
                    {
                      externalIdentifierType: "DOI",
                      externalIdentifierId: { value: "10.1234/sample.2024.45" }
                    }
                  ]
                }
              }
            ]
          }
        }
      }
    };

    const html = renderOrcid(block);
    expect(html).toContain("Authors:");
    expect(html).toContain("Cite & details");
    expect(html).toContain("work-metadata-panel");
    expect(html).toContain("Volume");
    expect(html).toContain("Issue");
    expect(html).toContain("Number");
    expect(html).toContain("Pages");
    expect(html).toContain("VANCOUVER (generated)");
    expect(html).toContain("https://doi.org/10.1234/sample.2024.45");
    expect(html).not.toContain("<dt>Journal</dt>");
  });

  it("renders generated IEEE citation when configured", () => {
    const block = {
      type: "orcid",
      data: {
        orcidId: "0000-0000-0000-0000",
        sections: ["works"],
        displayOptions: {
          citationStyle: "ieee"
        },
        cachedData: {
          sections: {
            works: [
              {
                title: "Signal Processing for Networks",
                type: "journal-article",
                publicationDate: { year: { value: "2025" } },
                journalTitle: "IEEE Access",
                volume: "13",
                issue: "4",
                pages: "88-102",
                contributors: [
                  { name: "Grace Hopper", sequence: "first" },
                  { name: "Claude Shannon", sequence: "additional" }
                ]
              }
            ]
          }
        }
      }
    };

    const html = renderOrcid(block);
    expect(html).toContain("IEEE (generated)");
    expect(html).toContain("[1]");
    expect(html).toContain("&quot;Signal Processing for Networks,&quot;");
  });

  it("supports disabling selected work metadata from JSON displayOptions", () => {
    const block = {
      type: "orcid",
      data: {
        orcidId: "0000-0000-0000-0000",
        sections: ["works"],
        displayOptions: {
          workMetadata: {
            volume: false,
            issue: false,
            number: false,
            pages: false,
            authors: false,
            providedCitation: false,
            generatedCitation: false
          }
        },
        cachedData: {
          sections: {
            works: [
              {
                title: "Metadata Controlled Publication",
                type: "journal-article",
                publicationDate: { year: { value: "2022" } },
                journalTitle: "Journal of Controls",
                volume: "10",
                issue: "1",
                number: "9",
                pages: "12-20",
                contributors: [{ name: "Katherine Johnson", sequence: "first" }]
              }
            ]
          }
        }
      }
    };

    const html = renderOrcid(block);
    expect(html).not.toContain("Authors:");
    expect(html).not.toContain("<dt>Volume</dt>");
    expect(html).not.toContain("<dt>Issue</dt>");
    expect(html).not.toContain("<dt>Number</dt>");
    expect(html).not.toContain("<dt>Pages</dt>");
    expect(html).not.toContain("(generated)");
  });

  it("renders orcid block with cached education data", () => {
    const block = {
      type: "orcid",
      data: {
        orcidId: "0000-0000-0000-0000",
        sections: ["education"],
        cachedData: {
          sections: {
            education: [
              {
                institution: "Test University",
                degree: "Ph.D.",
                field: "Computer Science",
                startDate: { year: { value: "2015" } },
                endDate: { year: { value: "2020" } }
              }
            ]
          }
        }
      }
    };

    const html = renderOrcid(block);
    expect(html).toContain("Education");
    expect(html).toContain("Test University");
    expect(html).toContain("Ph.D.");
    expect(html).toContain("Computer Science");
  });

  it("renders orcid block with cached employment data", () => {
    const block = {
      type: "orcid",
      data: {
        orcidId: "0000-0000-0000-0000",
        sections: ["employment"],
        cachedData: {
          sections: {
            employment: [
              {
                organization: "Test Corp",
                position: "Senior Researcher",
                department: "R&D",
                startDate: { year: { value: "2020" } },
                endDate: null
              }
            ]
          }
        }
      }
    };

    const html = renderOrcid(block);
    expect(html).toContain("Employment");
    expect(html).toContain("Test Corp");
    expect(html).toContain("Senior Researcher");
  });

  it("renders peer review cards with expanded metadata", () => {
    const block = {
      type: "orcid",
      data: {
        orcidId: "0000-0000-0000-0000",
        sections: ["peer-review"],
        cachedData: {
          sections: {
            peerReviews: [
              {
                type: "peer-review",
                role: "editor",
                reviewType: "review",
                completionDate: {
                  year: { value: "2024" },
                  month: { value: "11" },
                  day: { value: "02" }
                },
                organization: "Nature",
                groupId: "PR-42",
                reviewJournal: "Nature Machine Intelligence",
                subjectName: "Robust ML Study",
                subjectType: "journal-article",
                subjectUrl: "https://example.org/subject/42",
                reviewUrl: "https://example.org/review/42"
              }
            ]
          }
        }
      }
    };

    const html = renderOrcid(block);
    expect(html).toContain("Peer Reviews");
    expect(html).toContain("View Review Record");
    expect(html).toContain("View Subject");
    expect(html).toContain("Group ID");
    expect(html).toContain("PR-42");
    expect(html).toContain("Journal");
    expect(html).toContain("Nature Machine Intelligence");
    expect(html).toContain("Robust ML Study");
  });

  it("renders empty state for missing sections", () => {
    const block = {
      type: "orcid",
      data: {
        orcidId: "0000-0000-0000-0000",
        sections: ["works"],
        cachedData: {
          sections: {
            works: []
          }
        }
      }
    };

    const html = renderOrcid(block);
    expect(html).toContain("No publications available");
  });

  it("renders multiple sections", () => {
    const block = {
      type: "orcid",
      data: {
        orcidId: "0000-0000-0000-0000",
        sections: ["works", "education"],
        cachedData: {
          sections: {
            works: [
              {
                title: "Paper",
                type: "journal-article",
                publicationDate: { year: { value: "2023" } }
              }
            ],
            education: [
              {
                institution: "University",
                degree: "PhD",
                startDate: { year: { value: "2020" } },
                endDate: { year: { value: "2023" } }
              }
            ]
          }
        }
      }
    };

    const html = renderOrcid(block);
    expect(html).toContain("Publications");
    expect(html).toContain("Education");
    expect(html).toContain("Paper");
    expect(html).toContain("University");
  });

  it("handles blocks with custom styles", () => {
    const block = {
      type: "orcid",
      data: {
        orcidId: "0000-0000-0000-0000"
      },
      style: ["custom-class"]
    };

    const html = renderOrcid(block);
    expect(html).toContain("custom-class");
  });

  it("renders ORCID profile link", () => {
    const block = {
      type: "orcid",
      data: {
        orcidId: "0000-0000-0000-0000",
        displayOptions: { showTitle: true },
        cachedData: {
          sections: {}
        }
      }
    };

    const html = renderOrcid(block);
    expect(html).toContain("https://orcid.org/0000-0000-0000-0000");
    expect(html).toContain("ORCID Profile");
  });
});


