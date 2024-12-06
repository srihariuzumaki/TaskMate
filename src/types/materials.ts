export interface File {
  id: string;
  name: string;
  url: string;
  type: string;
  createdAt: string;
}

export interface Folder {
  id: string;
  name: string;
  tags: string[];
  files: File[];
  createdAt: string;
  parentId: string | null;
  subFolders: Folder[];
}