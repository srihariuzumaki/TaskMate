import { toast } from 'sonner';
import { db } from '@/firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export const requestNotificationPermission = async () => {
  if (!("Notification" in window)) {
    toast.error("This browser does not support notifications");
    return false;
  }

  const permission = await Notification.requestPermission();
  return permission === "granted";
};

export const scheduleNotification = (title: string, options: NotificationOptions, delay: number) => {
  if (Notification.permission !== "granted") return;

  setTimeout(() => {
    new Notification(title, options);
    toast(title, {
      description: options.body,
      duration: 5000,
    });
  }, delay);
};

export const createNotification = async (userId: string, notification: {
  type: 'task' | 'dueDate' | 'admin';
  title: string;
  message: string;
}) => {
  try {
    await addDoc(collection(db, 'notifications'), {
      userId,
      ...notification,
      read: false,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};

export const scheduleTaskReminder = async (userId: string, task: { name: string; time: string }) => {
  const [startTime] = task.time.split(' - ');
  const [hours, minutes] = startTime.split(':');
  
  const scheduledTime = new Date();
  scheduledTime.setHours(parseInt(hours));
  scheduledTime.setMinutes(parseInt(minutes));
  
  // Create notification 10 minutes before
  const tenMinBefore = new Date(scheduledTime);
  tenMinBefore.setMinutes(tenMinBefore.getMinutes() - 10);
  
  // Create notification 5 minutes before
  const fiveMinBefore = new Date(scheduledTime);
  fiveMinBefore.setMinutes(fiveMinBefore.getMinutes() - 5);
  
  const now = new Date();
  
  // Schedule 10-minute reminder
  if (tenMinBefore > now) {
    setTimeout(async () => {
      await createNotification(userId, {
        type: 'task',
        title: 'Task Starting Soon',
        message: `Your task "${task.name}" starts in 10 minutes`,
      });
    }, tenMinBefore.getTime() - now.getTime());
  }
  
  // Schedule 5-minute reminder
  if (fiveMinBefore > now) {
    setTimeout(async () => {
      await createNotification(userId, {
        type: 'task',
        title: 'Task Starting Soon',
        message: `Your task "${task.name}" starts in 5 minutes`,
      });
    }, fiveMinBefore.getTime() - now.getTime());
  }
};

export const scheduleDueDateReminder = async (userId: string, item: { name: string; date: string }, type: string) => {
  const dueDate = new Date(item.date);
  const reminderDate = new Date(dueDate);
  reminderDate.setDate(reminderDate.getDate() - 1);
  reminderDate.setHours(9, 0, 0); // Set to 9 AM
  
  const now = new Date();
  const delay = reminderDate.getTime() - now.getTime();
  
  if (delay > 0) {
    setTimeout(async () => {
      await createNotification(userId, {
        type: 'dueDate',
        title: `${type} Due Tomorrow`,
        message: `Your ${type.toLowerCase()} "${item.name}" is due tomorrow`,
      });
    }, delay);
  }
}; 