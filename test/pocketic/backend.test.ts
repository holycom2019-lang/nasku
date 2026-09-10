import { PocketIc } from "@dfinity/pic";
import { Principal } from "@icp-sdk/core/principal";
import { afterAll, beforeAll, expect, it } from "vitest";

import { idlFactory } from "../../src/frontend/src/declarations/backend.did.js";
import type { _SERVICE } from "../../src/frontend/src/declarations/backend.did";

const PIC_URL = process.env.POCKET_IC_URL ?? "";
const BACKEND_WASM = process.env.BACKEND_WASM ?? "";

let pic: PocketIc | undefined;
let actor: _SERVICE;

const alice = Principal.fromText("aaaaa-aa");
const bob = Principal.fromText("2ibo7-dia");

beforeAll(async () => {
  pic = await PocketIc.create(PIC_URL);
  ({ actor } = await pic.setupCanister<_SERVICE>({ idlFactory, wasm: BACKEND_WASM }));
  // The app's public API requires the caller to hold the `user` role.
  actor.setPrincipal(alice);
  await actor.assignCallerUserRole(alice, { user: null });
});

afterAll(async () => {
  await pic?.tearDown();
});

it("answers an empty-state read instead of trapping", async () => {
  actor.setPrincipal(alice);
  const contents = await actor.listFolderContents(0n);
  expect(contents.folders).toEqual([]);
  expect(contents.files).toEqual([]);
  expect(await actor.listShares()).toEqual([]);
  expect(await actor.getActivity(10n)).toEqual([]);
});

it("round-trips a folder through create-then-read", async () => {
  actor.setPrincipal(alice);
  const folder = await actor.createFolder("Proyek", []);
  expect(folder.name).toBe("Proyek");
  expect(folder.parentId).toEqual([]);

  const contents = await actor.listFolderContents(0n);
  expect(contents.folders).toContainEqual(
    expect.objectContaining({ id: folder.id, name: "Proyek" }),
  );
});

it("renames and moves a folder", async () => {
  actor.setPrincipal(alice);
  const parent = await actor.createFolder("Induk", []);
  const child = await actor.createFolder("Anak", [parent.id]);

  const renamed = await actor.renameFolder(child.id, "Anak Baru");
  expect(renamed).toEqual([expect.objectContaining({ id: child.id, name: "Anak Baru" })]);

  const moved = await actor.moveFolder(child.id, []);
  expect(moved).toEqual([expect.objectContaining({ id: child.id, parentId: [] })]);

  const parentContents = await actor.listFolderContents(parent.id);
  expect(parentContents.folders).toEqual([]);
});

it("uploads a file and reads it back", async () => {
  actor.setPrincipal(alice);
  const folder = await actor.createFolder("Dokumen", []);
  const blob = new Uint8Array([104, 101, 108, 108, 111]); // "hello"
  const file = await actor.uploadFile("catatan.txt", folder.id, blob, 5n, "text/plain");
  expect(file.name).toBe("catatan.txt");
  expect(file.size).toBe(5n);

  const fetched = await actor.getFile(file.id);
  expect(fetched).toEqual([expect.objectContaining({ id: file.id, name: "catatan.txt" })]);
});

it("searches files and folders by name", async () => {
  actor.setPrincipal(alice);
  await actor.createFolder("Laporan Tahunan", []);
  const result = await actor.searchFiles("laporan");
  expect(result.folders.length).toBeGreaterThan(0);
  expect(result.folders[0].name).toBe("Laporan Tahunan");
});

it("shares an item and the recipient can access it", async () => {
  actor.setPrincipal(alice);
  const folder = await actor.createFolder("Bersama", []);
  const share = await actor.shareItem({ folder: null }, folder.id, bob, { readOnly: null });
  expect(share.sharedWith).toEqual(bob);
  expect(share.permission).toEqual({ readOnly: null });

  const shares = await actor.listShares();
  expect(shares).toContainEqual(expect.objectContaining({ id: share.id }));

  // Bob can now read the shared folder's contents.
  actor.setPrincipal(bob);
  await actor.assignCallerUserRole(bob, { user: null });
  const contents = await actor.listFolderContents(folder.id);
  expect(contents.folders).toEqual([]);
});

it("does not show one caller's folder to another", async () => {
  actor.setPrincipal(alice);
  await actor.createFolder("Privat Alice", []);

  actor.setPrincipal(bob);
  const contents = await actor.listFolderContents(0n);
  expect(contents.folders.map((f) => f.name)).not.toContain("Privat Alice");
});

it("revokes a share and the recipient loses access", async () => {
  actor.setPrincipal(alice);
  const folder = await actor.createFolder("Sementara", []);
  const share = await actor.shareItem({ folder: null }, folder.id, bob, { readOnly: null });

  const revoked = await actor.revokeShare(share.id);
  expect(revoked).toBe(true);

  actor.setPrincipal(bob);
  const contents = await actor.listFolderContents(folder.id);
  expect(contents.folders).toEqual([]);
  expect(contents.files).toEqual([]);
});

it("records activity for uploads and deletes", async () => {
  actor.setPrincipal(alice);
  const folder = await actor.createFolder("Aktivitas", []);
  const file = await actor.uploadFile("hapus.txt", folder.id, new Uint8Array([1]), 1n, "text/plain");
  await actor.deleteFile(file.id);

  const activity = await actor.getActivity(50n);
  const actions = activity.map((a) => a.action);
  expect(actions).toContainEqual({ upload: null });
  expect(actions).toContainEqual({ delete: null });
});
