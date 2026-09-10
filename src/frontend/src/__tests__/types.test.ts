import { describe, expect, it } from "vitest";

import {
  ActivityAction,
  Permission,
  activityActionLabel,
  formatBytes,
  formatDate,
  isImage,
  isText,
  permissionLabel,
  timestampToDate,
} from "@/types";

describe("formatBytes", () => {
  it("formats bytes in Indonesian units", () => {
    expect(formatBytes(0n)).toBe("0 B");
    expect(formatBytes(1023n)).toBe("1023 B");
    expect(formatBytes(1024n)).toBe("1.0 KB");
    expect(formatBytes(2048n)).toBe("2.0 KB");
    expect(formatBytes(5n * 1024n * 1024n)).toBe("5.0 MB");
  });
});

describe("timestampToDate", () => {
  it("converts nanosecond timestamps to dates", () => {
    const date = timestampToDate(1_700_000_000_000_000_000n);
    expect(date).not.toBeNull();
    expect(date!.getTime()).toBe(1_700_000_000_000);
  });

  it("returns null for invalid timestamps", () => {
    expect(timestampToDate(999999999999999999999999999999999999n)).toBeNull();
  });
});

describe("formatDate", () => {
  it("returns an em dash for invalid timestamps", () => {
    expect(formatDate(999999999999999999999999999999999999n)).toBe("—");
  });
});

describe("isImage / isText", () => {
  it("detects image mime types", () => {
    expect(isImage("image/png")).toBe(true);
    expect(isImage("text/plain")).toBe(false);
  });

  it("detects text mime types", () => {
    expect(isText("text/plain")).toBe(true);
    expect(isText("application/json")).toBe(true);
    expect(isText("image/png")).toBe(false);
  });
});

describe("activityActionLabel", () => {
  it("maps each action to an Indonesian label", () => {
    expect(activityActionLabel(ActivityAction.upload)).toBe("mengunggah");
    expect(activityActionLabel(ActivityAction.delete_)).toBe("menghapus");
    expect(activityActionLabel(ActivityAction.share)).toBe("membagikan");
    expect(activityActionLabel(ActivityAction.revoke)).toBe("mencabut akses");
    expect(activityActionLabel(ActivityAction.permissionChange)).toBe(
      "mengubah izin",
    );
  });
});

describe("permissionLabel", () => {
  it("maps permissions to Indonesian labels", () => {
    expect(permissionLabel(Permission.edit)).toBe("Bisa edit");
    expect(permissionLabel(Permission.readOnly)).toBe("Baca saja");
  });
});
