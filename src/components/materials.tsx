'use client'

import React, { useState, useEffect } from 'react'
import {  Plus, Search, ChevronRight,  ArrowLeft, FolderIcon, Trash2, Upload, FileIcon } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { auth } from '@/firebase/config'
import { useRouter } from 'next/navigation'
import type { Folder, MaterialFile } from '@/types/materials'
import { Badge } from "@/components/ui/badge"
import { useFolderStore } from '@/store/folderStore'
import { updateUserFolders, getUserFolders } from '@/firebase/firestore'
import { uploadFile, deleteFile } from '@/firebase/storage'
import { toast } from 'sonner'

interface FolderSelectDialogProps {
  folders: Folder[];
  onSelect: (folderId: string) => void;
  onClose: () => void;
}

function FolderSelectDialog({ folders, onSelect, onClose }: FolderSelectDialogProps) {
  const [selectedFolder, setSelectedFolder] = useState<string>('');

  const handleSelect = () => {
    if (selectedFolder) {
      onSelect(selectedFolder);
      onClose();
    }
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Select Destination Folder</DialogTitle>
      </DialogHeader>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Choose Folder</Label>
          <select
            className="w-full p-2 border rounded-md"
            value={selectedFolder}
            onChange={(e) => setSelectedFolder(e.target.value)}
          >
            <option value="">Select a folder...</option>
            {folders.map((folder) => (
              <option key={folder.id} value={folder.id}>
                {folder.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSelect} disabled={!selectedFolder}>Upload</Button>
        </div>
      </div>
    </DialogContent>
  );
}

export function MaterialsComponent() {
  const { folders, setFolders } = useFolderStore()
  const [currentFolder, setCurrentFolder] = useState<Folder | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [newFolderName, setNewFolderName] = useState('')
  const [newFolderTags, setNewFolderTags] = useState('')
  const router = useRouter()
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFolders = async () => {
      try {
        const fetchedFolders = await getUserFolders();
        if (fetchedFolders) {
          setFolders(fetchedFolders);
        }
      } catch (error) {
        console.error('Error loading folders:', error);
        toast.error('Failed to load materials. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadFolders();
  }, [setFolders]);

  useEffect(() => {
    const selectedFolderId = localStorage.getItem('selectedFolderId');
    if (selectedFolderId && folders.length > 0) {
      const folder = folders.find(f => f.id === selectedFolderId);
      if (folder) {
        setCurrentFolder(folder);
      }
      localStorage.removeItem('selectedFolderId');
    }
  }, [folders]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#E6F3F5]">
        <div className="text-[#1A5F7A] text-lg">Loading materials...</div>
      </div>
    );
  }

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    const tags = newFolderTags
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);

    const newFolder: Folder = {
      id: Date.now().toString(),
      name: newFolderName,
      tags,
      files: [],
      createdAt: new Date().toISOString(),
      parentId: currentFolder?.id || null,
      subFolders: []
    };

    try {
      let newFolders;
      if (currentFolder) {
        // Add to subfolder using recursive function
        const addSubFolder = (folders: Folder[]): Folder[] => {
          return folders.map(folder => {
            if (folder.id === currentFolder.id) {
              return {
                ...folder,
                subFolders: [...(folder.subFolders || []), newFolder]
              };
            }
            if (folder.subFolders?.length) {
              return {
                ...folder,
                subFolders: addSubFolder(folder.subFolders)
              };
            }
            return folder;
          });
        };
        
        newFolders = addSubFolder([...folders]);
      } else {
        // Add to root level
        newFolders = [...folders, newFolder];
      }

      await updateUserFolders(currentUser.uid, newFolders);
      setFolders(newFolders);
      setNewFolderName('');
      setNewFolderTags('');
    } catch (error) {
      console.error('Error saving folder:', error);
      toast.error('Failed to create folder. Please try again.');
    }
  };

  const handleFileUpload = async (file: globalThis.File, destinationFolderId: string) => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
  
    const toastId = toast.loading('Uploading file...');
  
    try {
      // Construct proper file path
      const fileUrl = await uploadFile(file, `folders/${destinationFolderId}`);
      
      const newFile: MaterialFile = {
        id: Date.now().toString(),
        name: file.name,
        url: fileUrl,
        type: file.type,
        createdAt: new Date().toISOString(),
        uploadedBy: {
          uid: currentUser.uid,
          email: currentUser.email || 'Unknown'
        }
      };
  
      const findAndUpdateFolder = (folders: Folder[]): Folder[] => {
        return folders.map(folder => {
          if (folder.id === destinationFolderId) {
            return {
              ...folder,
              files: [...folder.files, newFile]
            };
          }
          if (folder.subFolders?.length) {
            return {
              ...folder,
              subFolders: findAndUpdateFolder(folder.subFolders)
            };
          }
          return folder;
        });
      };
  
      const updatedFolders = findAndUpdateFolder([...folders]);
      await updateUserFolders(currentUser.uid, updatedFolders);
      setFolders(updatedFolders);
  
      if (currentFolder?.id === destinationFolderId) {
        setCurrentFolder(prev => prev ? {
          ...prev,
          files: [...prev.files, newFile]
        } : null);
      }
  
      toast.success('File uploaded successfully!');
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Failed to upload file. Please try again.');
    } finally {
      toast.dismiss(toastId);
    }
  };

  const renderFolderContent = () => {
    if (!currentFolder) return null;

    return (
      <>
        <div className="mb-4 flex items-center space-x-2">
          <Button variant="ghost" onClick={() => setCurrentFolder(null)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Folders
          </Button>
          <div className="flex-grow" />
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="icon">
                <Plus className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Folder in {currentFolder.name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="folder-name">Folder Name</Label>
                  <Input
                    id="folder-name"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="folder-tags">Tags (comma-separated)</Label>
                  <Input
                    id="folder-tags"
                    value={newFolderTags}
                    onChange={(e) => setNewFolderTags(e.target.value)}
                    placeholder="e.g., math, homework, important"
                  />
                </div>
                <Button onClick={handleCreateFolder}>Create Folder</Button>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="icon">
                <Upload className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <FolderSelectDialog
              folders={folders}
              onSelect={(folderId) => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '*/*';
                input.onchange = (e) => {
                  const target = e.target as HTMLInputElement;
                  if (target.files?.[0]) {
                    handleFileUpload(target.files[0], folderId);
                  }
                };
                input.click();
              }}
              onClose={() => {
                const dialogTrigger = document.querySelector('[role="dialog"]');
                if (dialogTrigger) {
                  (dialogTrigger as HTMLElement).click();
                }
              }}
            />
          </Dialog>
        </div>

        <Card className="bg-white border-[#A0D2DB]">
          <CardHeader>
            <CardTitle className="text-[#1A5F7A]">{currentFolder.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] w-full pr-4">
              {/* Render subfolders first */}
              {currentFolder.subFolders && currentFolder.subFolders.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-[#1A5F7A] mb-2">Subfolders</h3>
                  {currentFolder.subFolders.map((subfolder) => (
                    <div
                      key={subfolder.id}
                      className="mb-2 flex items-center justify-between bg-white p-3 rounded-lg border border-[#A0D2DB] cursor-pointer hover:bg-[#E6F3F5]"
                    >
                      <div 
                        className="flex items-center space-x-3 flex-grow"
                        onClick={() => setCurrentFolder(subfolder)}
                      >
                        <FolderIcon className="h-5 w-5 text-[#57A7B3]" />
                        <div>
                          <p className="text-sm font-medium text-[#1A5F7A]">{subfolder.name}</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {subfolder.tags.map((tag, index) => (
                              <Badge key={index} variant="secondary" className="text-xs bg-[#E6F3F5] text-[#57A7B3]">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                          <p className="text-xs text-[#57A7B3] mt-1">
                            {subfolder.files.length} files, {subfolder.subFolders.length} folders
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <ChevronRight className="h-4 w-4 text-[#57A7B3]" />
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-red-500 hover:text-red-700"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteSubFolder(subfolder.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Render files */}
              <div>
                <h3 className="text-sm font-medium text-[#1A5F7A] mb-2">Files</h3>
                {currentFolder.files.length === 0 ? (
                  <p className="text-center text-[#57A7B3] py-4">No files in this folder</p>
                ) : (
                  currentFolder.files.map((file) => (
                    <div key={file.id} className="mb-4 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <FileIcon className="h-5 w-5 text-[#57A7B3]" />
                        <div>
                          <a 
                            href={file.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm font-medium text-[#1A5F7A] hover:underline"
                          >
                            {file.name}
                          </a>
                          <p className="text-xs text-[#57A7B3]">
                            Added {new Date(file.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500 hover:text-red-700"
                        onClick={() => handleDeleteFile(file.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </>
    );
  };

  const searchFoldersRecursively = (folders: Folder[], searchQuery: string): Folder[] => {
    return folders.reduce((acc: Folder[], folder) => {
      const searchLower = searchQuery.toLowerCase();
      const folderMatches = 
        folder.name.toLowerCase().includes(searchLower) ||
        folder.tags.some(tag => tag.toLowerCase().includes(searchLower));

      if (folderMatches) {
        acc.push(folder);
      }

      return acc;
    }, []);
  };

  const filteredFolders = searchQuery
    ? searchFoldersRecursively(folders, searchQuery)
    : folders;

  const renderFolderItems = (folderList: Folder[]) => (
    folderList.map((folder) => (
      <div key={folder.id} className="mb-4">
        <div 
          className="flex items-center justify-between bg-white p-3 rounded-lg border border-[#A0D2DB] cursor-pointer hover:bg-[#E6F3F5]"
          onClick={() => setCurrentFolder(folder)}
        >
          <div className="flex items-center space-x-3">
            <FolderIcon className="h-5 w-5 text-[#57A7B3]" />
            <div>
              <p className="text-sm font-medium text-[#1A5F7A]">{folder.name}</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {folder.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="text-xs bg-[#E6F3F5] text-[#57A7B3]">
                    {tag}
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-[#57A7B3] mt-1">
                {folder.files.length} files, {folder.subFolders.length} folders
              </p>
            </div>
          </div>
          <div className="flex space-x-2">
            <ChevronRight className="h-4 w-4 text-[#57A7B3]" />
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-red-500 hover:text-red-700"
              onClick={(e) => {
                e.stopPropagation();
                handleCreateFolder();
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    ))
  );

  

  const renderFolderList = () => (
    <>
      <div className="mb-4 flex items-center space-x-2">
        <div className="relative flex-grow">
          <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-[#57A7B3]" />
          <Input
            type="text"
            placeholder="Search materials..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="icon">
              <Plus className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                Create New Folder {currentFolder ? `in ${currentFolder.name}` : ''}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="folder-name">Folder Name</Label>
                <Input
                  id="folder-name"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="folder-tags">Tags (comma-separated)</Label>
                <Input
                  id="folder-tags"
                  value={newFolderTags}
                  onChange={(e) => setNewFolderTags(e.target.value)}
                  placeholder="e.g., math, homework, important"
                />
              </div>
              <Button onClick={handleCreateFolder}>Create Folder</Button>
            </div>
          </DialogContent>
        </Dialog>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="icon">
              <Upload className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <FolderSelectDialog
            folders={folders}
            onSelect={(folderId) => {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = '*/*';
              input.onchange = (e) => {
                const target = e.target as HTMLInputElement;
                if (target.files?.[0]) {
                  handleFileUpload(target.files[0], folderId);
                }
              };
              input.click();
            }}
            onClose={() => {
              const dialogTrigger = document.querySelector('[role="dialog"]');
              if (dialogTrigger) {
                (dialogTrigger as HTMLElement).click();
              }
            }}
          />
        </Dialog>
      </div>

      <Card className="bg-white border-[#A0D2DB]">
        <CardHeader>
          <CardTitle className="text-[#1A5F7A]">Subject Folders</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] w-full pr-4">
            {filteredFolders.length === 0 ? (
              <p className="text-center text-[#57A7B3] py-8">
                {searchQuery ? "No matching folders found" : "No folders created yet"}
              </p>
            ) : (
              renderFolderItems(filteredFolders)
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </>
  )

  const deleteSubFolder = async (subfolderId: string) => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    const deleteSubFolderRecursive = (folders: Folder[]): Folder[] => {
      return folders.map(folder => {
        if (folder.id === currentFolder?.id) {
          return {
            ...folder,
            subFolders: folder.subFolders.filter(sf => sf.id !== subfolderId)
          };
        }
        if (folder.subFolders?.length) {
          return {
            ...folder,
            subFolders: deleteSubFolderRecursive(folder.subFolders)
          };
        }
        return folder;
      });
    };

    try {
      const newFolders = deleteSubFolderRecursive([...folders]);
      await updateUserFolders(currentUser.uid, newFolders);
      setFolders(newFolders);
      
      // Update current folder state to reflect changes
      const updatedCurrentFolder = newFolders.find(f => f.id === currentFolder?.id);
      if (updatedCurrentFolder) {
        setCurrentFolder(updatedCurrentFolder);
      }
    } catch (error) {
      console.error('Error deleting subfolder:', error);
      toast.error('Failed to delete folder. Please try again.');
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    if (!currentFolder) return;
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    const toastId = toast.loading('Deleting file...');

    try {
      // Find the file to get its path
      const fileToDelete = currentFolder.files.find(f => f.id === fileId);
      if (!fileToDelete) throw new Error('File not found');

      // Delete from storage first
      const filePath = `folders/${currentFolder.id}/${fileToDelete.name}`;
      await deleteFile(filePath);

      // Then update Firestore
      const findAndUpdateFolder = (folders: Folder[]): Folder[] => {
        return folders.map(folder => {
          if (folder.id === currentFolder.id) {
            return {
              ...folder,
              files: folder.files.filter(f => f.id !== fileId)
            };
          }
          if (folder.subFolders?.length) {
            return {
              ...folder,
              subFolders: findAndUpdateFolder(folder.subFolders)
            };
          }
          return folder;
        });
      };

      const updatedFolders = findAndUpdateFolder([...folders]);
      await updateUserFolders(currentUser.uid, updatedFolders);
      setFolders(updatedFolders);

      // Update current folder state
      setCurrentFolder(prev => prev ? {
        ...prev,
        files: prev.files.filter(f => f.id !== fileId)
      } : null);

      toast.success('File deleted successfully');
    } catch (error) {
      console.error('Error deleting file:', error);
      toast.error('Failed to delete file. Please try again.');
    } finally {
      toast.dismiss(toastId);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#E6F3F5]">
      <header className="bg-[#A0D2DB] text-[#1A5F7A] p-4">
        <h1 className="text-xl font-bold">Study Materials</h1>
      </header>

      <main className="flex-1 p-4">
        {currentFolder ? renderFolderContent() : renderFolderList()}
      </main>
    </div>
  )
}
