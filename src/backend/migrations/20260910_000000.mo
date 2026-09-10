import Map "mo:core/Map";
import List "mo:core/List";
import Principal "mo:core/Principal";

module {
  type UserRole = {
    #admin;
    #user;
    #guest;
  };

  type AccessControlState = {
    var adminAssigned : Bool;
    userRoles : Map.Map<Principal, UserRole>;
  };

  type Folder = {
    id : Nat;
    name : Text;
    parentId : ?Nat;
    owner : Principal;
    createdAt : Int;
    updatedAt : Int;
  };

  type FileEntry = {
    id : Nat;
    name : Text;
    folderId : Nat;
    owner : Principal;
    blob : Blob;
    size : Nat;
    mimeType : Text;
    createdAt : Int;
    updatedAt : Int;
  };

  type Share = {
    id : Nat;
    itemKind : { #folder; #file };
    itemId : Nat;
    sharedBy : Principal;
    sharedWith : Principal;
    permission : { #readOnly; #edit };
    createdAt : Int;
  };

  type ActivityEntry = {
    id : Nat;
    owner : Principal;
    action : { #create; #rename; #move; #upload; #delete; #share; #revoke; #permissionChange };
    itemKind : { #folder; #file };
    itemId : Nat;
    itemName : Text;
    atNs : Int;
  };

  type FilesState = {
    folders : Map.Map<Nat, Folder>;
    files : Map.Map<Nat, FileEntry>;
    shares : Map.Map<Nat, Share>;
    activity : List.List<ActivityEntry>;
    var nextFolderId : Nat;
    var nextFileId : Nat;
    var nextShareId : Nat;
    var nextActivityId : Nat;
  };

  type OldActor = {};

  type NewActor = {
    accessControlState : AccessControlState;
    filesState : FilesState;
  };

  public func migration(_old : OldActor) : NewActor {
    {
      accessControlState = {
        var adminAssigned = false;
        userRoles = Map.empty();
      };
      filesState = {
        folders = Map.empty();
        files = Map.empty();
        shares = Map.empty();
        activity = List.empty();
        var nextFolderId = 0;
        var nextFileId = 0;
        var nextShareId = 0;
        var nextActivityId = 0;
      };
    };
  };
};
