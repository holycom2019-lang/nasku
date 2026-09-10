mixin () {
  public query func getApiDoc() : async Text {
    "# NAS File Sharing — Backend API

A personal file-management and sharing backend (a lightweight NAS-style
service) built on the Internet Computer. Each signed-in user manages their own
nested folder tree, uploads files (stored via the platform object-storage
service), shares folders/files with other users, and reviews a recent activity
history. Every user only ever sees their own items or items explicitly shared
with them.

## Public methods

### Authentication & account

- `_initialize_access_control() : async ()` — registers the caller. The first
  signed-in caller to call it becomes the **admin**; every later caller becomes
  a regular **user**. Anonymous callers are ignored (no role is assigned).
- `_internet_identity_sign_in_start() : async Blob` — begins an Internet
  Identity sign-in, returning a challenge blob.
- `_internet_identity_sign_in_finish() : async Result<(), Error>` — completes
  the sign-in and registers the caller (same first-admin rule as
  `_initialize_access_control`).
- `getCallerUserRole() : async UserRole` — returns the caller's role
  (`#admin`, `#user`, or `#guest` for anonymous callers).
- `isCallerAdmin() : async Bool` — whether the caller is the admin.
- `assignCallerUserRole(user : Principal, role : UserRole) : async ()` — admin
  only; assigns a role to another principal.

### Folders

- `createFolder(name : Text, parentId : ?FolderId) : async Folder` — creates a
  folder. A non-null `parentId` must reference a folder owned by the caller.
- `renameFolder(folderId : FolderId, newName : Text) : async ?Folder` — renames
  a folder the caller owns. Returns `null` if the folder does not exist or is
  not owned by the caller.
- `moveFolder(folderId : FolderId, newParentId : ?FolderId) : async ?Folder` —
  moves a folder the caller owns under a new parent (or to the root when
  `newParentId` is `null`). Returns `null` on failure.
- `deleteFolder(folderId : FolderId) : async Bool` — deletes a folder the
  caller owns, together with all descendant folders and every file inside them.
- `listFolderContents(folderId : FolderId) : async FolderContents` — lists the
  immediate child folders and files of a folder the caller owns or that is
  shared with them. Returns empty lists when access is denied.

### Files

- `uploadFile(name : Text, folderId : FolderId, blob : ExternalBlob, size : Nat, mimeType : Text) : async FileEntry` — uploads a file into a folder the
  caller owns. `blob` is the raw file bytes (stored via object storage),
  `size` its byte length, `mimeType` its content type.
- `getFile(fileId : FileId) : async ?FileEntry` — returns a file the caller
  owns or that is shared with them; `null` otherwise.
- `deleteFile(fileId : FileId) : async Bool` — deletes a file the caller owns.
- `searchFiles(term : Text) : async SearchResult` — case-insensitive name
  search across folders and files the caller can access.

### Sharing

- `shareItem(itemKind : ItemKind, itemId : Nat, sharedWith : Principal, permission : Permission) : async Share` — shares an item the caller owns with
  another user. `permission` is `#readOnly` or `#edit`.
- `revokeShare(shareId : ShareId) : async Bool` — removes a share the caller
  created.
- `listShares() : async [Share]` — lists shares the caller created.

### Activity

- `getActivity(limit : Nat) : async [ActivityEntry]` — returns the caller's
  most recent activity entries (uploads, deletes, permission changes, etc.),
  newest first, capped at `limit`.

### Data intelligence (OQL)

- `schema() : async Text` — JSON schema of the queryable entities.
- `execute(qJson : Text) : async Result` — runs an OQL query over the exposed
  entities (`folder`, `file`, `share`, `activity`).

### Documentation

- `getApiDoc() : async Text` — this document.

## Authentication & authorization

Every file/folder/share/activity method requires a **signed-in (non-anonymous)
caller** with the `#user` role or higher; anonymous callers are rejected with a
trap (`Unauthorized: Only users can perform this action`). Role management
(`assignCallerUserRole`) requires the `#admin` role and traps otherwise
(`Unauthorized: Only admins can assign user roles`).

Ownership is enforced per item: a user can only rename/move/delete folders and
files they own, upload into folders they own, and share/revoke items they own.
Reads (`listFolderContents`, `getFile`, `searchFiles`) additionally admit items
shared with the caller. Attempting to act on another user's item returns
`null`/`false` (for the `?`/`Bool` methods) or traps (for `createFolder`,
`uploadFile`, `shareItem`).

### Registration prerequisite

A caller is only registered (has a role) after signing in through the app's
own frontend, which calls `_initialize_access_control` (or the sign-in finish
flow) once. A principal that never did so is **unregistered** even if it
belongs to the app's owner, and any role-guarded call — including guarded
queries — traps with `User is not registered`. The first initializer becomes
admin; all subsequent callers become users.

### Identity derivation

The app's frontend pins an Internet Identity derivation origin, published at
`/.well-known/ii-derivation-origin` when available. An agent already holding
the user's Internet Identity authorization derives the correct per-app
principal against that origin (for example
`icp identity link web <name> --app <host>`). Such a delegation acts with the
user's full authority in this app until it expires. A signed-in caller derived
against a different origin is a different principal than the one the frontend
registered, so it is treated as unregistered.

## Units & encodings

- **Identifiers** — `FolderId`, `FileId`, `ShareId`, and activity `id` are
  `Nat`, assigned sequentially per item type.
- **Timestamps** — `createdAt`, `updatedAt`, and activity `atNs` are `Int`
  nanoseconds since the Unix epoch (`Time.now()`).
- **File bytes** — `blob` is the raw file content (`ExternalBlob`, an alias
  for `Blob`); `size` is its length in bytes.
- **Enums** — `Permission` is `#readOnly` / `#edit`; `ItemKind` is `#folder` /
  `#file`; `ActivityAction` is `#create` / `#rename` / `#move` / `#upload` /
  `#delete` / `#share` / `#revoke` / `#permissionChange`.
- **Optional parent** — `parentId : ?FolderId`; `null` means the folder is at
  the root.

## Lifecycle & polling

- Folder/file/share IDs are assigned on creation and never reused.
- `getActivity(limit)` is a snapshot query; poll it to observe new activity.
  There is no long-running job — every mutation is synchronous and completes
  within its own call.
- `deleteFolder` is recursive and synchronous: it removes the folder, all
  descendant folders, and all contained files in one call.

## Mutation retry safety & idempotency

- Mutations are **not** idempotent by design: `createFolder`, `uploadFile`,
  and `shareItem` create a new item on every call (IDs increment). Retrying a
  failed create duplicates the item.
- `renameFolder`, `moveFolder`, `deleteFolder`, `deleteFile`, and
  `revokeShare` are naturally idempotent in effect — repeating them after
  success returns `null`/`false` because the item is gone.
- `deleteFolder`/`deleteFile` permanently remove data; there is no
  undo/recycle bin.

## Errors, traps, limits & gotchas

- **Traps** (opaque rejects, not catchable variants): unregistered caller
  (`User is not registered`), non-user caller, non-admin role assignment,
  creating a folder inside another user's folder, uploading to another user's
  folder, sharing an item you do not own, and referencing a missing parent
  folder (`Parent folder not found`) or missing target folder
  (`Folder not found`).
- **`null`/`false` returns** (normal outcomes): renaming/moving/deleting an
  item you do not own or that does not exist, reading an item you cannot
  access, and revoking a share you did not create.
- **Sharing is by principal**: `sharedWith` must be the exact principal of the
  recipient; there are no share links or tokens.
- **`#edit` permission** is recorded but the current read endpoints
  (`listFolderContents`, `getFile`, `searchFiles`) treat shared items as
  readable; write access to shared items is not exposed.
- **OQL scoping**: the `folder`, `file`, `share`, and `activity` entities are
  `controllerOrScoped` — a signed-in caller only sees rows they own (via the
  `owner`/`sharedBy` column), while the platform controller can read all rows.
  File `blob` content is not exposed through OQL.
"
  };
};
