import "@testing-library/jest-dom/vitest";
import { cleanup, configure } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// The generated components use `data-ocid` for test hooks.
configure({ testIdAttribute: "data-ocid" });

// RTL's auto-cleanup relies on a global `afterEach`, which is only registered
// when Vitest `globals` is enabled. Register it explicitly so renders do not
// accumulate across tests.
afterEach(() => cleanup());

// The published `@caffeineai/object-storage` package ships an `exports` map that
// does not expose its internal `./blob` subpath, so Vitest cannot resolve the
// package's own `dist/index.js` (which imports `./blob`). The production build
// resolves it through a different path, but the Vitest resolver rejects the
// internal relative import. Provide a typed mock so tests can construct file
// entries without loading the broken package.
class MockExternalBlob {
  _blob: Uint8Array | null;
  directURL = "https://example.test/blob";
  contentType?: string;
  filename?: string;
  onProgress?: (percentage: number) => void;

  private constructor(
    blob: Uint8Array | null,
    contentType?: string,
    filename?: string,
  ) {
    this._blob = blob;
    this.contentType = contentType;
    this.filename = filename;
  }

  static fromURL(_url: string): MockExternalBlob {
    return new MockExternalBlob(null, undefined, undefined);
  }

  static fromBytes(
    blob: Uint8Array,
    contentType?: string,
    filename?: string,
  ): MockExternalBlob {
    return new MockExternalBlob(blob, contentType, filename);
  }

  async getBytes(): Promise<Uint8Array> {
    return this._blob ?? new Uint8Array();
  }

  getDirectURL(): string {
    return this.directURL;
  }

  withUploadProgress(
    onProgress: (percentage: number) => void,
  ): MockExternalBlob {
    this.onProgress = onProgress;
    return this;
  }
}

vi.mock("@caffeineai/object-storage", () => ({
  ExternalBlob: MockExternalBlob,
}));
