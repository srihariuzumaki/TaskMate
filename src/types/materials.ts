export interface MaterialFile {
  id: string;
  name: string;
  url: string;
  type: string;
  createdAt: string;
  uploadedBy: {
    uid: string;
    email: string;
  };
}
export interface Folder {
  id: string;
  name: string;
  tags: string[];
  files: MaterialFile[];
  createdAt: string;
  parentId: string | null;
  subFolders: Folder[];
}
