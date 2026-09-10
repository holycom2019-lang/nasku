import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
import type { ExternalBlob } from "@caffeineai/object-storage";
export type { ExternalBlob } from "@caffeineai/object-storage";
export interface ActivityEntry {
    id: ActivityId;
    itemId: bigint;
    action: ActivityAction;
    owner: Principal;
    atNs: bigint;
    itemKind: ItemKind;
    itemName: string;
}
export interface SearchResult {
    files: Array<FileEntry>;
    folders: Array<Folder>;
}
export interface FolderContents {
    files: Array<FileEntry>;
    folders: Array<Folder>;
}
export interface Share {
    id: ShareId;
    permission: Permission;
    itemId: bigint;
    sharedBy: Principal;
    createdAt: bigint;
    sharedWith: Principal;
    itemKind: ItemKind;
}
export type Result__1 = {
    __kind__: "ok";
    ok: null;
} | {
    __kind__: "err";
    err: Error_;
};
export type Error_ = {
    __kind__: "FrontendOriginsNotConfigured";
    FrontendOriginsNotConfigured: null;
} | {
    __kind__: "MixedSsoSources";
    MixedSsoSources: {
        otherKeys: Array<string>;
        ssoKeys: Array<string>;
    };
} | {
    __kind__: "Stale";
    Stale: {
        ageNs: bigint;
    };
} | {
    __kind__: "MalformedCandid";
    MalformedCandid: null;
} | {
    __kind__: "AmbiguousAttribute";
    AmbiguousAttribute: {
        field: string;
        sources: Array<string>;
    };
} | {
    __kind__: "NoAttributes";
    NoAttributes: null;
} | {
    __kind__: "UnknownNonce";
    UnknownNonce: null;
} | {
    __kind__: "UntrustedSsoSource";
    UntrustedSsoSource: {
        domain: string;
    };
} | {
    __kind__: "MissingField";
    MissingField: string;
} | {
    __kind__: "FrontendOriginMismatch";
    FrontendOriginMismatch: {
        got: string;
        expected: Array<string>;
    };
};
export interface Result {
    hasMore: boolean;
    rows: Array<Array<Cell>>;
}
export interface FileEntry {
    id: FileId;
    owner: Principal;
    blob: ExternalBlob;
    name: string;
    createdAt: bigint;
    size: bigint;
    mimeType: string;
    updatedAt: bigint;
    folderId: FolderId;
}
export interface Cell {
    value: Value;
    name: string;
}
export type ActivityId = bigint;
export interface Folder {
    id: FolderId;
    owner: Principal;
    name: string;
    createdAt: bigint;
    updatedAt: bigint;
    parentId?: FolderId;
}
export type FileId = bigint;
export type Value = {
    __kind__: "int";
    int: bigint;
} | {
    __kind__: "nat";
    nat: bigint;
} | {
    __kind__: "float";
    float: number;
} | {
    __kind__: "bool";
    bool: boolean;
} | {
    __kind__: "null";
    null: null;
} | {
    __kind__: "text";
    text: string;
};
export type FolderId = bigint;
export type ShareId = bigint;
export enum ActivityAction {
    rename = "rename",
    revoke = "revoke",
    move = "move",
    delete_ = "delete",
    create = "create",
    share = "share",
    upload = "upload",
    permissionChange = "permissionChange"
}
export enum ItemKind {
    file = "file",
    folder = "folder"
}
export enum Permission {
    edit = "edit",
    readOnly = "readOnly"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createFolder(name: string, parentId: FolderId | null): Promise<Folder>;
    deleteFile(fileId: FileId): Promise<boolean>;
    deleteFolder(folderId: FolderId): Promise<boolean>;
    execute(qJson: string): Promise<Result>;
    getActivity(limit: bigint): Promise<Array<ActivityEntry>>;
    getApiDoc(): Promise<string>;
    getCallerUserRole(): Promise<UserRole>;
    getFile(fileId: FileId): Promise<FileEntry | null>;
    isCallerAdmin(): Promise<boolean>;
    listFolderContents(folderId: FolderId): Promise<FolderContents>;
    listShares(): Promise<Array<Share>>;
    moveFolder(folderId: FolderId, newParentId: FolderId | null): Promise<Folder | null>;
    renameFolder(folderId: FolderId, newName: string): Promise<Folder | null>;
    revokeShare(shareId: ShareId): Promise<boolean>;
    schema(): Promise<string>;
    searchFiles(term: string): Promise<SearchResult>;
    shareItem(itemKind: ItemKind, itemId: bigint, sharedWith: Principal, permission: Permission): Promise<Share>;
    uploadFile(name: string, folderId: FolderId, blob: ExternalBlob, size: bigint, mimeType: string): Promise<FileEntry>;
}
