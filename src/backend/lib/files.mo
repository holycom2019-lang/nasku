import Map "mo:core/Map";
import List "mo:core/List";
import Int "mo:core/Int";
import Time "mo:core/Time";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import Storage "mo:caffeineai-object-storage/Storage";
import Types "../types/files";

module {

  func logActivity(state : Types.FilesState, owner : Principal, action : Types.ActivityAction, itemKind : Types.ItemKind, itemId : Nat, itemName : Text) {
    let id = state.nextActivityId;
    state.nextActivityId += 1;
    let entry : Types.ActivityEntry = {
      id;
      owner;
      action;
      itemKind;
      itemId;
      itemName;
      atNs = Time.now();
    };
    state.activity.add(entry);
  };

  func itemName(state : Types.FilesState, itemKind : Types.ItemKind, itemId : Nat) : Text {
    switch (itemKind) {
      case (#folder) {
        switch (state.folders.get(itemId)) { case (?f) f.name; case null "" };
      };
      case (#file) {
        switch (state.files.get(itemId)) { case (?f) f.name; case null "" };
      };
    };
  };

  func isSharedWith(state : Types.FilesState, user : Principal, itemKind : Types.ItemKind, itemId : Nat) : Bool {
    var found = false;
    for ((_, s) in state.shares.entries()) {
      if (s.itemKind == itemKind and s.itemId == itemId and s.sharedWith == user) {
        found := true;
      };
    };
    found;
  };

  func canAccessFolder(state : Types.FilesState, user : Principal, folderId : Types.FolderId) : Bool {
    switch (state.folders.get(folderId)) {
      case null { false };
      case (?f) { f.owner == user or isSharedWith(state, user, #folder, folderId) };
    };
  };

  func canAccessFile(state : Types.FilesState, user : Principal, fileId : Types.FileId) : Bool {
    switch (state.files.get(fileId)) {
      case null { false };
      case (?f) { f.owner == user or isSharedWith(state, user, #file, fileId) };
    };
  };

  func canEditItem(state : Types.FilesState, user : Principal, itemKind : Types.ItemKind, itemId : Nat) : Bool {
    let owns = switch (itemKind) {
      case (#folder) {
        switch (state.folders.get(itemId)) { case (?f) f.owner == user; case null false };
      };
      case (#file) {
        switch (state.files.get(itemId)) { case (?f) f.owner == user; case null false };
      };
    };
    if (owns) {
      true;
    } else {
      var found = false;
      for ((_, s) in state.shares.entries()) {
        if (s.itemKind == itemKind and s.itemId == itemId and s.sharedWith == user and s.permission == #edit) {
          found := true;
        };
      };
      found;
    };
  };

  func collectDescendants(state : Types.FilesState, rootId : Types.FolderId) : [Types.FolderId] {
    var result = List.empty<Types.FolderId>();
    result.add(rootId);
    var frontier = [rootId];
    var changed = true;
    while (changed) {
      changed := false;
      var next = List.empty<Types.FolderId>();
      for ((id, f) in state.folders.entries()) {
        switch (f.parentId) {
          case (?pid) {
            if (frontier.contains(pid) and not result.contains(id)) {
              result.add(id);
              next.add(id);
              changed := true;
            };
          };
          case null {};
        };
      };
      frontier := next.toArray();
    };
    result.toArray();
  };

  public func createFolder(state : Types.FilesState, owner : Principal, name : Text, parentId : ?Types.FolderId) : Types.Folder {
    switch (parentId) {
      case (?pid) {
        switch (state.folders.get(pid)) {
          case null { Runtime.trap("Parent folder not found") };
          case (?p) {
            if (p.owner != owner) {
              Runtime.trap("Unauthorized: Cannot create a folder inside another user's folder");
            };
          };
        };
      };
      case null {};
    };
    let id = state.nextFolderId;
    state.nextFolderId += 1;
    let now = Time.now();
    let folder : Types.Folder = {
      id;
      name;
      parentId;
      owner;
      createdAt = now;
      updatedAt = now;
    };
    state.folders.add(id, folder);
    logActivity(state, owner, #create, #folder, id, name);
    folder;
  };

  public func renameFolder(state : Types.FilesState, owner : Principal, folderId : Types.FolderId, newName : Text) : ?Types.Folder {
    switch (state.folders.get(folderId)) {
      case null { null };
      case (?f) {
        if (not canEditItem(state, owner, #folder, folderId)) {
          null;
        } else {
          let updated : Types.Folder = { f with name = newName; updatedAt = Time.now() };
          state.folders.add(folderId, updated);
          logActivity(state, owner, #rename, #folder, folderId, newName);
          ?updated;
        };
      };
    };
  };

  public func moveFolder(state : Types.FilesState, owner : Principal, folderId : Types.FolderId, newParentId : ?Types.FolderId) : ?Types.Folder {
    switch (state.folders.get(folderId)) {
      case null { null };
      case (?f) {
        if (not canEditItem(state, owner, #folder, folderId)) {
          null;
        } else {
          switch (newParentId) {
            case (?pid) {
              switch (state.folders.get(pid)) {
                case null { null };
                case (?p) {
                  if (not canEditItem(state, owner, #folder, pid)) {
                    null;
                  } else {
                    let updated : Types.Folder = { f with parentId = newParentId; updatedAt = Time.now() };
                    state.folders.add(folderId, updated);
                    logActivity(state, owner, #move, #folder, folderId, f.name);
                    ?updated;
                  };
                };
              };
            };
            case null {
              let updated : Types.Folder = { f with parentId = null; updatedAt = Time.now() };
              state.folders.add(folderId, updated);
              logActivity(state, owner, #move, #folder, folderId, f.name);
              ?updated;
            };
          };
        };
      };
    };
  };

  public func deleteFolder(state : Types.FilesState, owner : Principal, folderId : Types.FolderId) : Bool {
    switch (state.folders.get(folderId)) {
      case null { false };
      case (?folder) {
        if (not canEditItem(state, owner, #folder, folderId)) {
          false;
        } else {
          let ids = collectDescendants(state, folderId);
          var fileIds = List.empty<Types.FileId>();
          for ((fid, f) in state.files.entries()) {
            if (ids.contains(f.folderId)) {
              fileIds.add(fid);
            };
          };
          for (fid in fileIds.toArray().values()) {
            state.files.remove(fid);
          };
          for (id in ids.values()) {
            state.folders.remove(id);
          };
          logActivity(state, owner, #delete, #folder, folderId, folder.name);
          true;
        };
      };
    };
  };

  public func listFolderContents(state : Types.FilesState, owner : Principal, folderId : Types.FolderId) : Types.FolderContents {
    if (not canAccessFolder(state, owner, folderId)) {
      { folders = []; files = [] };
    } else {
      var folders = List.empty<Types.Folder>();
      var files = List.empty<Types.FileEntry>();
      for ((_, f) in state.folders.entries()) {
        if (f.parentId == ?folderId) {
          folders.add(f);
        };
      };
      for ((_, f) in state.files.entries()) {
        if (f.folderId == folderId) {
          files.add(f);
        };
      };
      { folders = folders.toArray(); files = files.toArray() };
    };
  };

  public func addFile(state : Types.FilesState, owner : Principal, name : Text, folderId : Types.FolderId, blob : Storage.ExternalBlob, size : Nat, mimeType : Text) : Types.FileEntry {
    switch (state.folders.get(folderId)) {
      case null { Runtime.trap("Folder not found") };
      case (?f) {
        if (not canEditItem(state, owner, #folder, folderId)) {
          Runtime.trap("Unauthorized: Cannot upload to this folder");
        };
      };
    };
    let id = state.nextFileId;
    state.nextFileId += 1;
    let now = Time.now();
    let file : Types.FileEntry = {
      id;
      name;
      folderId;
      owner;
      blob;
      size;
      mimeType;
      createdAt = now;
      updatedAt = now;
    };
    state.files.add(id, file);
    logActivity(state, owner, #upload, #file, id, name);
    file;
  };

  public func getFile(state : Types.FilesState, owner : Principal, fileId : Types.FileId) : ?Types.FileEntry {
    switch (state.files.get(fileId)) {
      case null { null };
      case (?f) {
        if (canAccessFile(state, owner, fileId)) { ?f } else { null };
      };
    };
  };

  public func deleteFile(state : Types.FilesState, owner : Principal, fileId : Types.FileId) : Bool {
    switch (state.files.get(fileId)) {
      case null { false };
      case (?f) {
        if (not canEditItem(state, owner, #file, fileId)) {
          false;
        } else {
          state.files.remove(fileId);
          logActivity(state, owner, #delete, #file, fileId, f.name);
          true;
        };
      };
    };
  };

  public func search(state : Types.FilesState, owner : Principal, term : Text) : Types.SearchResult {
    let lower = term.toLower();
    var folders = List.empty<Types.Folder>();
    var files = List.empty<Types.FileEntry>();
    for ((_, f) in state.folders.entries()) {
      if (canAccessFolder(state, owner, f.id) and f.name.toLower().contains(#text(lower))) {
        folders.add(f);
      };
    };
    for ((_, f) in state.files.entries()) {
      if (canAccessFile(state, owner, f.id) and f.name.toLower().contains(#text(lower))) {
        files.add(f);
      };
    };
    { folders = folders.toArray(); files = files.toArray() };
  };

  public func shareItem(state : Types.FilesState, owner : Principal, itemKind : Types.ItemKind, itemId : Nat, sharedWith : Principal, permission : Types.Permission) : Types.Share {
    let owns = switch (itemKind) {
      case (#folder) {
        switch (state.folders.get(itemId)) { case (?f) f.owner == owner; case null false };
      };
      case (#file) {
        switch (state.files.get(itemId)) { case (?f) f.owner == owner; case null false };
      };
    };
    if (not owns) {
      Runtime.trap("Unauthorized: You can only share items you own");
    };
    let id = state.nextShareId;
    state.nextShareId += 1;
    let share : Types.Share = {
      id;
      itemKind;
      itemId;
      sharedBy = owner;
      sharedWith;
      permission;
      createdAt = Time.now();
    };
    state.shares.add(id, share);
    logActivity(state, owner, #share, itemKind, itemId, itemName(state, itemKind, itemId));
    share;
  };

  public func revokeShare(state : Types.FilesState, owner : Principal, shareId : Types.ShareId) : Bool {
    switch (state.shares.get(shareId)) {
      case null { false };
      case (?s) {
        if (s.sharedBy != owner) {
          false;
        } else {
          state.shares.remove(shareId);
          logActivity(state, owner, #revoke, s.itemKind, s.itemId, itemName(state, s.itemKind, s.itemId));
          true;
        };
      };
    };
  };

  public func listShares(state : Types.FilesState, owner : Principal) : [Types.Share] {
    var result = List.empty<Types.Share>();
    for ((_, s) in state.shares.entries()) {
      if (s.sharedBy == owner) {
        result.add(s);
      };
    };
    result.toArray();
  };

  public func getActivity(state : Types.FilesState, owner : Principal, limit : Nat) : [Types.ActivityEntry] {
    let owned = state.activity.toArray().filter(func a = a.owner == owner);
    let sorted = owned.sort(func (a, b) = Int.compare(b.atNs, a.atNs));
    if (sorted.size() <= limit) {
      sorted;
    } else {
      var result = List.empty<Types.ActivityEntry>();
      var i = 0;
      while (i < limit) {
        result.add(sorted[i]);
        i += 1;
      };
      result.toArray();
    };
  };
};
