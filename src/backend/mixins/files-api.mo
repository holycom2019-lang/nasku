import AccessControl "mo:caffeineai-authorization/access-control";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import Storage "mo:caffeineai-object-storage/Storage";
import Types "../types/files";
import FilesLib "../lib/files";

mixin (
  accessControlState : AccessControl.AccessControlState,
  state : Types.FilesState,
) {
  func requireUser(caller : Principal) {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can perform this action");
    };
  };

  public shared ({ caller }) func createFolder(name : Text, parentId : ?Types.FolderId) : async Types.Folder {
    requireUser(caller);
    FilesLib.createFolder(state, caller, name, parentId);
  };

  public shared ({ caller }) func renameFolder(folderId : Types.FolderId, newName : Text) : async ?Types.Folder {
    requireUser(caller);
    FilesLib.renameFolder(state, caller, folderId, newName);
  };

  public shared ({ caller }) func moveFolder(folderId : Types.FolderId, newParentId : ?Types.FolderId) : async ?Types.Folder {
    requireUser(caller);
    FilesLib.moveFolder(state, caller, folderId, newParentId);
  };

  public shared ({ caller }) func deleteFolder(folderId : Types.FolderId) : async Bool {
    requireUser(caller);
    FilesLib.deleteFolder(state, caller, folderId);
  };

  public query ({ caller }) func listFolderContents(folderId : Types.FolderId) : async Types.FolderContents {
    requireUser(caller);
    FilesLib.listFolderContents(state, caller, folderId);
  };

  public shared ({ caller }) func uploadFile(name : Text, folderId : Types.FolderId, blob : Storage.ExternalBlob, size : Nat, mimeType : Text) : async Types.FileEntry {
    requireUser(caller);
    FilesLib.addFile(state, caller, name, folderId, blob, size, mimeType);
  };

  public query ({ caller }) func getFile(fileId : Types.FileId) : async ?Types.FileEntry {
    requireUser(caller);
    FilesLib.getFile(state, caller, fileId);
  };

  public shared ({ caller }) func deleteFile(fileId : Types.FileId) : async Bool {
    requireUser(caller);
    FilesLib.deleteFile(state, caller, fileId);
  };

  public query ({ caller }) func searchFiles(term : Text) : async Types.SearchResult {
    requireUser(caller);
    FilesLib.search(state, caller, term);
  };

  public shared ({ caller }) func shareItem(itemKind : Types.ItemKind, itemId : Nat, sharedWith : Principal, permission : Types.Permission) : async Types.Share {
    requireUser(caller);
    FilesLib.shareItem(state, caller, itemKind, itemId, sharedWith, permission);
  };

  public shared ({ caller }) func revokeShare(shareId : Types.ShareId) : async Bool {
    requireUser(caller);
    FilesLib.revokeShare(state, caller, shareId);
  };

  public query ({ caller }) func listShares() : async [Types.Share] {
    requireUser(caller);
    FilesLib.listShares(state, caller);
  };

  public query ({ caller }) func getActivity(limit : Nat) : async [Types.ActivityEntry] {
    requireUser(caller);
    FilesLib.getActivity(state, caller, limit);
  };
};
