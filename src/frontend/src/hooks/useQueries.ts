import { createActor } from "@/backend";
import type { ItemKind, Permission } from "@/types";
import { useActor } from "@caffeineai/core-infrastructure";
import { ExternalBlob } from "@caffeineai/object-storage";
import type { Principal } from "@icp-sdk/core/principal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

/* ------------------------------- Queries ------------------------------- */

export function useFolderContents(folderId: bigint) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["folderContents", folderId.toString()],
    queryFn: async () => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.listFolderContents(folderId);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSearchFiles(term: string) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["search", term],
    queryFn: async () => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.searchFiles(term);
    },
    enabled: !!actor && !isFetching && term.trim().length > 0,
  });
}

export function useActivity(limit: bigint) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["activity", limit.toString()],
    queryFn: async () => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.getActivity(limit);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useShares() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["shares"],
    queryFn: async () => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.listShares();
    },
    enabled: !!actor && !isFetching,
  });
}

/* ------------------------------ Mutations ------------------------------ */

export function useCreateFolder() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      name,
      parentId,
    }: { name: string; parentId: bigint }) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.createFolder(name, parentId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["folderContents"] });
      void queryClient.invalidateQueries({ queryKey: ["activity"] });
    },
  });
}

export function useRenameFolder() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      folderId,
      newName,
    }: { folderId: bigint; newName: string }) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.renameFolder(folderId, newName);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["folderContents"] });
      void queryClient.invalidateQueries({ queryKey: ["activity"] });
    },
  });
}

export function useMoveFolder() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      folderId,
      newParentId,
    }: {
      folderId: bigint;
      newParentId: bigint | null;
    }) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.moveFolder(folderId, newParentId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["folderContents"] });
      void queryClient.invalidateQueries({ queryKey: ["activity"] });
    },
  });
}

export function useDeleteFolder() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (folderId: bigint) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.deleteFolder(folderId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["folderContents"] });
      void queryClient.invalidateQueries({ queryKey: ["activity"] });
    },
  });
}

export function useDeleteFile() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (fileId: bigint) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.deleteFile(fileId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["folderContents"] });
      void queryClient.invalidateQueries({ queryKey: ["activity"] });
    },
  });
}

export function useUploadFile() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      file,
      folderId,
      onProgress,
    }: {
      file: File;
      folderId: bigint;
      onProgress?: (percentage: number) => void;
    }) => {
      if (!actor) throw new Error("Backend is not ready");
      const bytes = new Uint8Array(await file.arrayBuffer());
      let blob = ExternalBlob.fromBytes(bytes, file.type, file.name);
      if (onProgress) {
        blob = blob.withUploadProgress(onProgress);
      }
      return actor.uploadFile(
        file.name,
        folderId,
        blob,
        BigInt(file.size),
        file.type,
      );
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["folderContents"] });
      void queryClient.invalidateQueries({ queryKey: ["activity"] });
    },
  });
}

export function useShareItem() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      itemKind,
      itemId,
      sharedWith,
      permission,
    }: {
      itemKind: ItemKind;
      itemId: bigint;
      sharedWith: Principal;
      permission: Permission;
    }) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.shareItem(itemKind, itemId, sharedWith, permission);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["shares"] });
      void queryClient.invalidateQueries({ queryKey: ["activity"] });
    },
  });
}

export function useRevokeShare() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (shareId: bigint) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.revokeShare(shareId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["shares"] });
      void queryClient.invalidateQueries({ queryKey: ["activity"] });
    },
  });
}
