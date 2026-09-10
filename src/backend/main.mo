import AccessControl "mo:caffeineai-authorization/access-control";
import MixinAuthorization "mo:caffeineai-authorization/MixinAuthorization";
import Expose "mo:caffeineai-oql/Expose";
import MixinObjectStorage "mo:caffeineai-object-storage/Mixin";
import Principal "mo:core/Principal";
import Entity "mo:caffeineai-oql/Entity";
import MapEntity "mo:caffeineai-oql/MapEntity";
import ListEntity "mo:caffeineai-oql/ListEntity";
import NatValue "mo:caffeineai-oql/NatValue";
import IntValue "mo:caffeineai-oql/IntValue";
import TextValue "mo:caffeineai-oql/TextValue";
import PrincipalValue "mo:caffeineai-oql/PrincipalValue";
import Types "types/files";
import FilesApi "mixins/files-api";
import ApiDocMixin "mixins/api-doc";

actor {
  let accessControlState : AccessControl.AccessControlState;
  include MixinAuthorization(accessControlState, null);
  include MixinObjectStorage();

  let filesState : Types.FilesState;

  transient let anyP = Principal.fromText("aaaaa-aa");

  include Expose({
    entities = [
      filesState.folders.toEntityManual("folder", "Folder", "id")
        .sample({ id = 0; name = ""; parentId = null; owner = anyP; createdAt = 0; updatedAt = 0 })
        .payload("id", func f = f.id)
        .payload("name", func f = f.name)
        .payload("parentId", func f = switch (f.parentId) { case null 0; case (?p) p })
        .payload("owner", func f = f.owner)
        .payload("createdAt", func f = f.createdAt)
        .payload("updatedAt", func f = f.updatedAt)
        .ownedBy("owner")
        .controllerOrScoped()
        .build(),
      filesState.files.toEntityManual("file", "File", "id")
        .sample({ id = 0; name = ""; folderId = 0; owner = anyP; blob = "" : Blob; size = 0; mimeType = ""; createdAt = 0; updatedAt = 0 })
        .payload("id", func f = f.id)
        .payload("name", func f = f.name)
        .payload("folderId", func f = f.folderId)
        .payload("owner", func f = f.owner)
        .payload("size", func f = f.size)
        .payload("mimeType", func f = f.mimeType)
        .payload("createdAt", func f = f.createdAt)
        .payload("updatedAt", func f = f.updatedAt)
        .ownedBy("owner")
        .controllerOrScoped()
        .build(),
      filesState.shares.toEntityManual("share", "Share", "id")
        .sample({ id = 0; itemKind = #folder; itemId = 0; sharedBy = anyP; sharedWith = anyP; permission = #readOnly; createdAt = 0 })
        .payload("id", func s = s.id)
        .payload("itemKind", func s = switch (s.itemKind) { case (#folder) "folder"; case (#file) "file" })
        .payload("itemId", func s = s.itemId)
        .payload("sharedBy", func s = s.sharedBy)
        .payload("sharedWith", func s = s.sharedWith)
        .payload("permission", func s = switch (s.permission) { case (#readOnly) "readOnly"; case (#edit) "edit" })
        .payload("createdAt", func s = s.createdAt)
        .ownedBy("sharedBy")
        .controllerOrScoped()
        .build(),
      filesState.activity.toEntityManual("activity", "Activity", "id")
        .sample({ id = 0; owner = anyP; action = #create; itemKind = #folder; itemId = 0; itemName = ""; atNs = 0 })
        .payload("id", func a = a.id)
        .payload("owner", func a = a.owner)
        .payload("action", func a = switch (a.action) {
          case (#create) "create";
          case (#rename) "rename";
          case (#move) "move";
          case (#upload) "upload";
          case (#delete) "delete";
          case (#share) "share";
          case (#revoke) "revoke";
          case (#permissionChange) "permissionChange";
        })
        .payload("itemKind", func a = switch (a.itemKind) { case (#folder) "folder"; case (#file) "file" })
        .payload("itemId", func a = a.itemId)
        .payload("itemName", func a = a.itemName)
        .payload("atNs", func a = a.atNs)
        .ownedBy("owner")
        .controllerOrScoped()
        .build(),
    ];
  });

  include FilesApi(accessControlState, filesState);
  include ApiDocMixin();
};
