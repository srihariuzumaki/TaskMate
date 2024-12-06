'use client'

import React, { useEffect, useState } from 'react';
import { auth, db, storage } from '@/firebase/config';
import { collection, query, getDocs, doc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { ref, listAll, deleteObject } from 'firebase/storage';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Users, Folder, File, Settings, Trash2, Search, Edit, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import type { Folder as FolderType } from '@/types/materials';
import { useRouter } from 'next/navigation';

interface User {
  uid: string;
  email: string;
  username?: string;
  role?: string;
}

export function AdminComponent() {
  const [users, setUsers] = useState<User[]>([]);
  const [folders, setFolders] = useState<FolderType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    const checkAdminAccess = async () => {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        toast.error('Unauthorized access');
        router.push('/admin/login');
        return;
      }

      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (!userDoc.exists() || userDoc.data()?.role !== 'admin') {
        toast.error('Unauthorized access');
        router.push('/admin/login');
        return;
      }
    };

    const loadData = async () => {
      try {
        // Load users
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const usersData = usersSnapshot.docs.map(doc => ({
          uid: doc.id,
          ...doc.data()
        } as User));
        setUsers(usersData);

        // Load global folders
        const foldersSnapshot = await getDocs(collection(db, 'folders'));
        const foldersData = foldersSnapshot.docs.flatMap(doc => {
          const data = doc.data();
          return data.folders || [];
        });
        setFolders(foldersData);

      } catch (error) {
        console.error('Error loading admin data:', error);
        toast.error('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    checkAdminAccess();
    loadData();
  }, []);

  const handleUpdateUser = async (userId: string, updates: Partial<User>) => {
    try {
      await updateDoc(doc(db, 'users', userId), updates);
      setUsers(users.map(user => 
        user.uid === userId ? { ...user, ...updates } : user
      ));
      toast.success('User updated successfully');
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Failed to update user');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      // Delete user's folders and files
      const userFolders = folders.filter(folder => folder.createdBy === userId);
      for (const folder of userFolders) {
        const storageRef = ref(storage, `folders/${folder.id}`);
        const files = await listAll(storageRef);
        await Promise.all(files.items.map(file => deleteObject(file)));
      }

      // Delete user document
      await deleteDoc(doc(db, 'users', userId));
      setUsers(users.filter(user => user.uid !== userId));
      toast.success('User deleted successfully');
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    }
  };

  const handleUpdateFolder = async (folderId: string, updates: Partial<FolderType>) => {
    try {
      const updatedFolders = folders.map(folder =>
        folder.id === folderId ? { ...folder, ...updates } : folder
      );
      await updateDoc(doc(db, 'folders', 'global'), { folders: updatedFolders });
      setFolders(updatedFolders);
      toast.success('Folder updated successfully');
    } catch (error) {
      console.error('Error updating folder:', error);
      toast.error('Failed to update folder');
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    if (!confirm('Are you sure you want to delete this folder? This action cannot be undone.')) {
      return;
    }

    try {
      // Delete folder files from storage
      const storageRef = ref(storage, `folders/${folderId}`);
      const files = await listAll(storageRef);
      await Promise.all(files.items.map(file => deleteObject(file)));

      // Update Firestore
      const updatedFolders = folders.filter(folder => folder.id !== folderId);
      await updateDoc(doc(db, 'folders', 'global'), { folders: updatedFolders });
      setFolders(updatedFolders);
      toast.success('Folder deleted successfully');
    } catch (error) {
      console.error('Error deleting folder:', error);
      toast.error('Failed to delete folder');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading admin panel...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#E6F3F5] p-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-[#1A5F7A]">Admin Dashboard</h1>
      </header>

      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="folders">Folders</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>User Management</span>
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-[#57A7B3]" />
                  <Input
                    type="text"
                    placeholder="Search users..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                {users
                  .filter(user => 
                    user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    user.username?.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map(user => (
                    <div key={user.uid} className="flex items-center justify-between p-4 border-b">
                      <div>
                        <p className="font-medium">{user.username || user.email}</p>
                        <p className="text-sm text-gray-500">{user.role || 'user'}</p>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedUser(user)}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteUser(user.uid)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="folders">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Global Folders Management</span>
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-[#57A7B3]" />
                  <Input
                    type="text"
                    placeholder="Search folders..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                {folders
                  .filter(folder => 
                    folder.name.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map(folder => (
                    <div key={folder.id} className="flex items-center justify-between p-4 border-b">
                      <div>
                        <p className="font-medium">{folder.name}</p>
                        <p className="text-sm text-gray-500">
                          {folder.files?.length || 0} files • {folder.tags?.join(', ')}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUpdateFolder(folder.id, {
                            name: folder.name,
                            tags: folder.tags
                          })}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteFolder(folder.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                {folders.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No folders found
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>System Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium mb-2">Storage Settings</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span>Maximum file size</span>
                      <span className="font-medium">10 MB</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span>Allowed file types</span>
                      <span className="font-medium">Documents, Images, Text</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-2">User Settings</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span>Total users</span>
                      <span className="font-medium">{users.length}</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span>Admin users</span>
                      <span className="font-medium">
                        {users.filter(user => user.role === 'admin').length}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit User Dialog */}
      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Username</Label>
              <Input
                value={selectedUser?.username || ''}
                onChange={(e) => setSelectedUser(prev => 
                  prev ? { ...prev, username: e.target.value } : null
                )}
              />
            </div>
            <div>
              <Label>Role</Label>
              <select
                className="w-full p-2 border rounded"
                value={selectedUser?.role || 'user'}
                onChange={(e) => setSelectedUser(prev =>
                  prev ? { ...prev, role: e.target.value } : null
                )}
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <Button
              onClick={() => {
                if (selectedUser) {
                  handleUpdateUser(selectedUser.uid, {
                    username: selectedUser.username,
                    role: selectedUser.role
                  });
                  setSelectedUser(null);
                }
              }}
            >
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 