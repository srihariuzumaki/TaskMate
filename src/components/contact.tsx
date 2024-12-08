import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { auth, db } from '@/firebase/config';
import { addDoc, collection, serverTimestamp, query, where, getDocs, orderBy } from 'firebase/firestore';
import { toast } from 'sonner';

interface ContactRequest {
  id: string;
  name: string;
  email: string;
  message: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: any;
}

export function ContactComponent() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userRequests, setUserRequests] = useState<ContactRequest[]>([]);

  const fetchUserRequests = async () => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      const q = query(
        collection(db, 'contactRequests'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const requests: ContactRequest[] = [];
      querySnapshot.forEach((doc) => {
        requests.push({ id: doc.id, ...doc.data() } as ContactRequest);
      });

      setUserRequests(requests);
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast.error('Failed to load your requests');
    }
  };

  useEffect(() => {
    fetchUserRequests();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const user = auth.currentUser;
    if (!user) {
      toast.error('Please sign in to submit a request');
      return;
    }

    if (!name || !email || !message.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsSubmitting(true);

    try {
      const docRef = await addDoc(collection(db, 'contactRequests'), {
        userId: user.uid,
        name,
        email,
        message: message.trim(),
        status: 'pending',
        createdAt: serverTimestamp(),
      });

      if (docRef.id) {
        toast.success('Message sent successfully');
        setName('');
        setEmail('');
        setMessage('');
        await fetchUserRequests();
      }
    } catch (error) {
      console.error('Error submitting message:', error);
      toast.error('Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#E6F3F5]">
      <header className="bg-[#A0D2DB] text-[#1A5F7A] p-4">
        <h1 className="text-xl font-bold">Contact Us</h1>
      </header>

      <main className="flex-1 p-4 space-y-6">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-[#1A5F7A]">Send us a Message</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  required
                />
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                />
              </div>

              <div>
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your message here"
                  className="h-32"
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-[#57A7B3] hover:bg-[#1A5F7A]"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Sending...' : 'Send Message'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-[#1A5F7A]">Your Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {userRequests.length === 0 ? (
                <p className="text-[#57A7B3] text-center">No requests yet</p>
              ) : (
                userRequests.map((request) => (
                  <div
                    key={request.id}
                    className="border rounded-lg p-4 space-y-2"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-[#1A5F7A]">{request.message}</p>
                        <p className="text-sm text-[#57A7B3]">
                          {new Date(request.createdAt?.toDate()).toLocaleDateString()}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          request.status === 'approved'
                            ? 'bg-green-100 text-green-800'
                            : request.status === 'rejected'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
} 