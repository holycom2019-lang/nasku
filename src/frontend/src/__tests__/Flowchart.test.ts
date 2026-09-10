import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

// The flowchart documentation is a Mermaid diagram that must be renderable and
// cover every primary user flow of the Nasku app: login, browse files, upload,
// share, search, and activity.
const flowchartPath = resolve(__dirname, "../../../../docs/flowchart.md");

function readFlowchart(): string {
  return readFileSync(flowchartPath, "utf8");
}

describe("Flowchart documentation", () => {
  it("is present and contains renderable Mermaid flowchart diagrams", () => {
    const doc = readFlowchart();
    expect(doc).toContain("```mermaid");
    expect(doc).toContain("flowchart TD");
  });

  it("covers the login flow", () => {
    const doc = readFlowchart();
    expect(doc).toMatch(/login/i);
    expect(doc).toMatch(/Internet Identity/i);
  });

  it("covers the browse-files flow", () => {
    const doc = readFlowchart();
    expect(doc).toMatch(/jelajah/i);
    expect(doc).toMatch(/My Files/i);
  });

  it("covers the upload flow", () => {
    const doc = readFlowchart();
    expect(doc).toMatch(/unggah/i);
    expect(doc).toMatch(/uploadFile/i);
  });

  it("covers the share flow", () => {
    const doc = readFlowchart();
    expect(doc).toMatch(/berbagi/i);
    expect(doc).toMatch(/shareItem/i);
  });

  it("covers the search flow", () => {
    const doc = readFlowchart();
    expect(doc).toMatch(/pencarian/i);
    expect(doc).toMatch(/searchFiles/i);
  });

  it("covers the activity flow", () => {
    const doc = readFlowchart();
    expect(doc).toMatch(/aktivitas/i);
    expect(doc).toMatch(/getActivity/i);
  });
});
