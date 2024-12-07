'use client'

import React, { useState, useEffect } from 'react'
import {  Plus, Search, ChevronRight,  ArrowLeft, FolderIcon, Trash2, Upload, FileIcon, ArrowRight, Loader2 } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { auth } from '@/firebase/config'
import { useRouter } from 'next/navigation'
import type { Folder, MaterialFile } from '@/types/materials'
import { Badge } from "@/components/ui/badge"
import { useFolderStore } from '@/store/folderStore'
import { updateUserFolders, getUserFolders } from '@/firebase/firestore'
import { uploadFile, deleteFile } from '@/firebase/storage'
import { toast } from 'sonner'
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { storage } from '@/firebase/config'
import { findFolder } from '@/utils/folderUtils'

interface FolderSelectDialogProps {
  folders: Folder[];
  onSelect: (folderId: string) => void;
  onClose: () => void;
  currentFolderId?: string;
}

function FolderSelectDialog({ folders, onSelect, onClose, currentFolderId }: FolderSelectDialogProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
  };

  const renderFolderOption = (folder: Folder, depth = 0) => {
    const isExpanded = expandedFolders.has(folder.id);
    const hasSubfolders = folder.subFolders && folder.subFolders.length > 0;
    const isCurrentFolder = folder.id === currentFolderId;

    return (
      <div key={folder.id} className="w-full">
        <div
          className={`flex items-center p-2 hover:bg-[#E6F3F5] rounded ${
            isCurrentFolder && !hasSubfolders ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
          }`}
          style={{ paddingLeft: `${depth * 1.5 + 0.5}rem` }}
          onClick={() => {
            if (hasSubfolders) {
              toggleFolder(folder.id);
            } else if (!isCurrentFolder) {
              onSelect(folder.id);
              onClose();
            }
          }}
        >
          {hasSubfolders && (
            <ChevronRight
              className={`h-4 w-4 mr-2 transition-transform ${
                isExpanded ? 'transform rotate-90' : ''
              }`}
            />
          )}
          <FolderIcon className="h-4 w-4 mr-2 text-[#57A7B3]" />
          <span className={`text-sm ${isCurrentFolder && !hasSubfolders ? 'text-gray-400' : 'text-[#1A5F7A]'}`}>
            {folder.name}
            {isCurrentFolder && !hasSubfolders && " (current folder)"}
          </span>
        </div>
        {isExpanded && hasSubfolders && (
          <div className="ml-4">
            {folder.subFolders.map(subfolder => renderFolderOption(subfolder, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>Select Destination Folder</DialogTitle>
      </DialogHeader>
      <div className="max-h-[400px] overflow-y-auto">
        {folders.map(folder => renderFolderOption(folder))}
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
      </DialogFooter>
    </DialogContent>
  );
}

const calculateTotalFiles = (folder: Folder): number => {
  let total = folder.files?.length || 0;
  if (folder.subFolders) {
    folder.subFolders.forEach(subfolder => {
      total += calculateTotalFiles(subfolder);
    });
  }
  return total;
};

function MaterialUploadDialog({ onClose }: { onClose: () => void }) {
  const { folders, setFolders } = useFolderStore();
  const [selectedFolderId, setSelectedFolderId] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !selectedFolderId) {
      toast.error('Please select both a folder and a file');
      return;
    }

    // Check for duplicate files
    const targetFolder = findFolder(folders, selectedFolderId);
    if (targetFolder && targetFolder.files.some(f => f.name === selectedFile.name)) {
      toast.error('A file with this name already exists in the selected folder');
      return;
    }

    setIsUploading(true);
    const toastId = toast.loading('Uploading file...');

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        toast.dismiss(toastId);
        throw new Error('No user logged in');
      }

      const fileUrl = await uploadFile(selectedFile, `folders/${selectedFolderId}`);
      
      const newFile: MaterialFile = {
        id: Date.now().toString(),
        name: selectedFile.name,
        url: fileUrl,
        type: selectedFile.type,
        createdAt: new Date().toISOString(),
        uploadedBy: {
          uid: currentUser.uid,
          email: currentUser.email || 'Unknown'
        }
      };

      const findAndUpdateFolder = (folders: Folder[]): Folder[] => {
        return folders.map(folder => {
          if (folder.id === selectedFolderId) {
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
      toast.success('File uploaded successfully');
      onClose();
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Failed to upload file. Please try again.');
    } finally {
      setIsUploading(false);
      toast.dismiss(toastId);
    }
  };

  const renderFolderOption = (folder: Folder, depth = 0) => {
    const hasSubfolders = folder.subFolders && folder.subFolders.length > 0;
    const isSelected = folder.id === selectedFolderId;
    const isExpanded = expandedFolders.has(folder.id);

    return (
      <div key={folder.id} className="w-full">
        <div
          className={`flex items-center p-2 hover:bg-[#E6F3F5] rounded cursor-pointer ${
            isSelected ? 'bg-[#E6F3F5]' : ''
          }`}
          style={{ paddingLeft: `${depth * 1.5 + 0.5}rem` }}
          onClick={() => {
            setSelectedFolderId(folder.id);
            if (hasSubfolders) {
              toggleFolder(folder.id);
            }
          }}
        >
          {hasSubfolders && (
            <ChevronRight
              className={`h-4 w-4 mr-2 transition-transform ${
                isExpanded ? 'transform rotate-90' : ''
              }`}
            />
          )}
          <FolderIcon className="h-4 w-4 mr-2 text-[#57A7B3]" />
          <span className="text-sm text-[#1A5F7A]">{folder.name}</span>
        </div>
        {isExpanded && hasSubfolders && (
          <div className="ml-4">
            {folder.subFolders.map(subfolder => renderFolderOption(subfolder, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Upload Material</DialogTitle>
      </DialogHeader>
      <div className="space-y-6 p-4">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Select Folder</h3>
          <div className="border rounded-lg p-2">
            {folders.map(renderFolderOption)}
          </div>
        </div>
        
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Select File</h3>
          <div 
            className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:bg-gray-50"
            onClick={() => document.getElementById('file-input')?.click()}
          >
            <input
              id="file-input"
              type="file"
              className="hidden"
              accept=".pdf,.doc,.docx,.txt"
              onChange={handleFileSelect}
              disabled={isUploading}
            />
            <span className="text-gray-500">
              {selectedFile ? selectedFile.name : 'No file chosen'}
            </span>
          </div>
          <p className="text-sm text-[#57A7B3]">
            Supported formats: PDF, DOC, DOCX, TXT (max. 10MB)
          </p>
        </div>

        <Button 
          className="w-full bg-[#A0D2DB] hover:bg-[#57A7B3] text-white flex items-center justify-center"
          onClick={handleUpload}
          disabled={isUploading || !selectedFile || !selectedFolderId}
        >
          {isUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Upload File
            </>
          )}
        </Button>
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

  const renderFileItem = (file: MaterialFile) => (
    <div
      key={file.id}
      className="mb-4 flex items-center justify-between cursor-move"
      draggable
      onDragStart={(e) => {
        e.stopPropagation();
        e.dataTransfer.setData('application/json', JSON.stringify({
          fileId: file.id,
          sourceFolderId: currentFolder?.id || ''
        }));
        e.dataTransfer.effectAllowed = 'move';
      }}
    >
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
      <div className="flex space-x-2">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon">
              <ArrowRight className="h-4 w-4 text-[#57A7B3]" />
            </Button>
          </DialogTrigger>
          <FolderSelectDialog
            folders={folders}
            currentFolderId={currentFolder?.id}
            onSelect={(destinationFolderId) => {
              if (currentFolder) {
                moveFile(file.id, currentFolder, destinationFolderId);
              }
            }}
            onClose={() => {
              const dialogTrigger = document.querySelector('[role="dialog"]');
              if (dialogTrigger) {
                (dialogTrigger as HTMLElement).click();
              }
            }}
          />
        </Dialog>
        <Button
          variant="ghost"
          size="icon"
          className="text-red-500 hover:text-red-700"
          onClick={() => handleDeleteFile(file.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

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
      // Update the file path to include 'global'
      const fileUrl = await uploadFile(file, `global/folders/${destinationFolderId}`);
      
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
            <MaterialUploadDialog 
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
                            {calculateTotalFiles(subfolder)} files, {subfolder.subFolders.length} folders
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
                  currentFolder.files.map((file) => renderFileItem(file))
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
      <div
        key={folder.id}
        className="mb-4"
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          e.currentTarget.classList.add('bg-[#E6F3F5]');
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          e.stopPropagation();
          e.currentTarget.classList.remove('bg-[#E6F3F5]');
        }}
        onDrop={async (e) => {
          e.preventDefault();
          e.stopPropagation();
          e.currentTarget.classList.remove('bg-[#E6F3F5]');
          
          try {
            const data = JSON.parse(e.dataTransfer.getData('application/json'));
            const { fileId, sourceFolderId } = data;
            
            if (sourceFolderId && fileId && sourceFolderId !== folder.id) {
              const sourceFolder = findFolderById(folders, sourceFolderId);
              if (sourceFolder) {
                await moveFile(fileId, sourceFolder, folder.id);
              }
            }
          } catch (error) {
            console.error('Error processing drop:', error);
          }
        }}
      >
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
                {calculateTotalFiles(folder)} files, {folder.subFolders.length} folders
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
          <MaterialUploadDialog 
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
      const fileToDelete = currentFolder.files.find(f => f.id === fileId);
      if (!fileToDelete) throw new Error('File not found');

      // Delete from storage first
      const filePath = `global/folders/${currentFolder.id}/${fileToDelete.name}`;
      const fileRef = ref(storage, filePath);
      await deleteObject(fileRef);

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

  const moveFile = async (fileId: string, sourceFolder: Folder, destinationFolderId: string) => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    const toastId = toast.loading('Moving file...');

    try {
      const fileToMove = sourceFolder.files.find(f => f.id === fileId);
      if (!fileToMove) throw new Error('File not found');

      // Get the old and new storage paths
      const oldPath = `folders/${sourceFolder.id}/${fileToMove.name}`;
      const newPath = `folders/${destinationFolderId}/${fileToMove.name}`;

      // Create a reference to the old file location
      const oldFileRef = ref(storage, oldPath);

      // Get the download URL of the old file
      const fileBlob = await fetch(fileToMove.url).then(r => r.blob());
      
      // Upload to new location
      const newFileRef = ref(storage, newPath);
      await uploadBytes(newFileRef, fileBlob);
      
      // Get the new download URL
      const newUrl = await getDownloadURL(newFileRef);

      // Create updated file object with new URL
      const updatedFile = {
        ...fileToMove,
        url: newUrl
      };

      // Update folders in Firestore
      const findAndUpdateFolders = (folders: Folder[]): Folder[] => {
        return folders.map(folder => {
          if (folder.id === sourceFolder.id) {
            return {
              ...folder,
              files: folder.files.filter(f => f.id !== fileId)
            };
          }
          if (folder.id === destinationFolderId) {
            return {
              ...folder,
              files: [...folder.files, updatedFile]
            };
          }
          if (folder.subFolders?.length) {
            const updatedSubFolders = findAndUpdateFolders(folder.subFolders);
            if (JSON.stringify(updatedSubFolders) !== JSON.stringify(folder.subFolders)) {
              return {
                ...folder,
                subFolders: updatedSubFolders
              };
            }
          }
          return folder;
        });
      };

      const updatedFolders = findAndUpdateFolders([...folders]);
      await updateUserFolders(currentUser.uid, updatedFolders);
      setFolders(updatedFolders);

      // Update current folder state if needed
      if (currentFolder) {
        if (currentFolder.id === sourceFolder.id) {
          setCurrentFolder(prev => prev ? {
            ...prev,
            files: prev.files.filter(f => f.id !== fileId)
          } : null);
        } else if (currentFolder.id === destinationFolderId) {
          setCurrentFolder(prev => prev ? {
            ...prev,
            files: [...prev.files, updatedFile]
          } : null);
        }
      }

      // Delete the old file from storage
      await deleteObject(oldFileRef);

      toast.success('File moved successfully');
    } catch (error) {
      console.error('Error moving file:', error);
      toast.error('Failed to move file. Please try again.');
    } finally {
      toast.dismiss(toastId);
    }
  };

  const findFolderById = (folderList: Folder[], folderId: string): Folder | undefined => {
    for (const folder of folderList) {
      if (folder.id === folderId) {
        return folder;
      }
      if (folder.subFolders?.length) {
        const foundFolder = findFolderById(folder.subFolders, folderId);
        if (foundFolder) {
          return foundFolder;
        }
      }
    }
    return undefined;
  };

  const findFolder = (folders: Folder[], targetId: string): Folder | null => {
    for (const folder of folders) {
      if (folder.id === targetId) return folder;
      if (folder.subFolders) {
        const found = findFolder(folder.subFolders, targetId);
        if (found) return found;
      }
    }
    return null;
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

