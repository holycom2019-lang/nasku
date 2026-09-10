import Map "mo:core/Map";
import List "mo:core/List";
import Principal "mo:core/Principal";
import Storage "mo:caffeineai-object-storage/Storage";

module {
  public type FolderId = Nat;
  public type FileId = Nat;
  public type ShareId = Nat;
  public type ActivityId = Nat;

  public type Permission = {
    #readOnly;
    #edit;
  };

  public type ItemKind = {
    #folder;
    #file;
  };

  public type Folder = {
    id : FolderId;
    name : Text;
    parentId : ?FolderId;
    owner : Principal;
    createdAt : Int;
    updatedAt : Int;
  };

  public type FileEntry = {
    id : FileId;
    name : Text;
    folderId : FolderId;
    owner : Principal;
    blob : Storage.ExternalBlob;
    size : Nat;
    mimeType : Text;
    createdAt : Int;
    updatedAt : Int;
  };

  public type Share = {
    id : ShareId;
    itemKind : ItemKind;
    itemId : Nat;
    sharedBy : Principal;
    sharedWith : Principal;
    permission : Permission;
    createdAt : Int;
  };

  public type ActivityAction = {
    #create;
    #rename;
    #move;
    #upload;
    #delete;
    #share;
    #revoke;
    #permissionChange;
  };

  public type ActivityEntry = {
    id : ActivityId;
    owner : Principal;
    action : ActivityAction;
    itemKind : ItemKind;
    itemId : Nat;
    itemName : Text;
    atNs : Int;
  };

  public type FolderContents = {
    folders : [Folder];
    files : [FileEntry];
  };

  public type SearchResult = {
    folders : [Folder];
    files : [FileEntry];
  };

  public type FilesState = {
    folders : Map.Map<FolderId, Folder>;
    files : Map.Map<FileId, FileEntry>;
    shares : Map.Map<ShareId, Share>;
    activity : List.List<ActivityEntry>;
    var nextFolderId : Nat;
    var nextFileId : Nat;
    var nextShareId : Nat;
    var nextActivityId : Nat;
  };
};
