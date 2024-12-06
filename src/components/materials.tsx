'use client'

import React, { useState, useEffect } from 'react'
import {  Plus, Search, ChevronRight,  ArrowLeft, FolderIcon, Trash2 } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { auth } from '@/firebase/config'
import { useRouter } from 'next/navigation'
import type { Folder, File } from '@/types/materials'
import { Badge } from "@/components/ui/badge"
import { useFolderStore } from '@/store/folderStore'
import { updateUserFolders } from '@/firebase/firestore'


export function MaterialsComponent() {
  const { folders, setFolders } = useFolderStore()
  const [currentFolder, setCurrentFolder] = useState<Folder | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [newFolderName, setNewFolderName] = useState('')
  const [newFolderTags, setNewFolderTags] = useState('')
  const router = useRouter()

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
      showAlert('Failed to create folder. Please try again.');
    }
  };

  useEffect(() => {
    const selectedFolderId = localStorage.getItem('selectedFolderId');
    if (selectedFolderId) {
      const folder = folders.find(f => f.id === selectedFolderId);
      if (folder) {
        setCurrentFolder(folder);
      }
      localStorage.removeItem('selectedFolderId'); // Clear after use
    }
  }, [folders]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!currentFolder) return
    const file = event.target.files?.[0]
    if (!file) return

    // TODO: Implement actual file upload to storage
    const newFile: File = {
      id: Date.now().toString(),
      name: file.name,
      url: URL.createObjectURL(file),
      type: file.type,
      createdAt: new Date().toISOString()
    }

    const updatedFolders = folders.map(folder => {
      if (folder.id === currentFolder.id) {
        return {
          ...folder,
          files: [...folder.files, newFile]
        }
      }
      return folder
    })

    setFolders(updatedFolders)
    setCurrentFolder(prev => prev ? {
      ...prev,
      files: [...prev.files, newFile]
    } : null)
  }

  const renderFolderContent = () => {
    if (!currentFolder) return null

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
        </div>

        <Card className="bg-white border-[#A0D2DB]">
          <CardHeader>
            <CardTitle className="text-[#1A5F7A]">{currentFolder.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] w-full pr-4">
              {currentFolder.files.length === 0 ? (
                <p className="text-center text-[#57A7B3] py-8">This folder is empty</p>
              ) : (
                currentFolder.files.map((file) => (
                  <div key={file.id} className="mb-4 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {/* Assuming FileIconComponent is a custom component that needs to be imported or defined */}
                      {/* If FileIconComponent is not defined, replace it with a suitable icon or placeholder */}
                      <img src="/path/to/file/icon.png" alt="File Icon" className="h-5 w-5 text-[#57A7B3]" />
                      <div>
                        <p className="text-sm font-medium text-[#1A5F7A]">{file.name}</p>
                        <p className="text-xs text-[#57A7B3]">Added {new Date(file.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </>
    )
  }

  const filteredFolders = folders.filter(folder => {
    const searchLower = searchQuery.toLowerCase()
    return (
      folder.name.toLowerCase().includes(searchLower) ||
      folder.tags.some(tag => tag.toLowerCase().includes(searchLower))
    )
  })
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
        {folder.subFolders.length > 0 && (
          <div className="ml-6 mt-2">
            {renderFolderItems(folder.subFolders)}
          </div>
        )}
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
      </div>

      <Card className="bg-white border-[#A0D2DB]">
        <CardHeader>
          <CardTitle className="text-[#1A5F7A]">Subject Folders</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] w-full pr-4">
            {folders.length === 0 ? (
              <p className="text-center text-[#57A7B3] py-8">No folders created yet</p>
            ) : (
              filteredFolders.map((folder) => (
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
                        <p className="text-xs text-[#57A7B3] mt-1">{folder.files.length} files</p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <ChevronRight className="h-4 w-4 text-[#57A7B3]" />
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-red-500 hover:text-red-700"
                        onClick={async (e) => {
                          e.stopPropagation(); // Prevent folder from opening when clicking delete
                          const currentUser = auth.currentUser;
                          if (!currentUser) return;
                          
                          const newFolders = folders.filter(f => f.id !== folder.id);
                          try {
                            await updateUserFolders(currentUser.uid, newFolders);
                            setFolders(newFolders);
                          } catch (error) {
                            console.error('Error deleting folder:', error);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </>
  )

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

function showAlert(arg0: string) {
  throw new Error('Function not implemented.')
}
