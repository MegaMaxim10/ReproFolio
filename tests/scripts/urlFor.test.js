import { describe, it, expect } from "vitest";
import { buildSiteGraph, urlFor } from "../../scripts/builders/site-graph.js";
import { pages } from "../fixtures/site.nested.js";

describe("urlFor()", () => {
  const graph = buildSiteGraph(pages);

  it("generates correct root URL", () => {
    const root = pages[0];
    expect(urlFor(root, graph)).toBe("/index.html");
  });

  it("respects nested structure", () => {
    const proj = pages.find(p => p.dir === "content/research/projects");
    expect(urlFor(proj, graph)).toBe("/research/projects/index.html");
  });

  it("supports basePath", () => {
    const teaching = pages.find(p => p.dir === "content/teaching");
    expect(urlFor(teaching, graph, "/my-site"))
      .toBe("/my-site/teaching/index.html");
  });

  it("uses title slug when meta.slugFromTitle is enabled", () => {
    const newsPage = {
      file: "content/news/post-1.json",
      dir: "content/news",
      name: "post-1.json",
      json: {
        meta: {
          id: "news-post-1",
          title: "ReproFolio Framework Starter Published",
          language: "en",
          slugFromTitle: true
        }
      }
    };
    const slugGraph = buildSiteGraph([...pages, newsPage]);

    expect(urlFor(newsPage, slugGraph)).toBe("/news/reprofolio-framework-starter-published.html");
  });
});


