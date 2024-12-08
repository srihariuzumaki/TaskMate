import { toast } from 'sonner';

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

export const scheduleTaskReminder = (task: { name: string; time: string }) => {
  const [startTime] = task.time.split(' - ');
  const [hours, minutes] = startTime.split(':');
  
  const scheduledTime = new Date();
  scheduledTime.setHours(parseInt(hours));
  scheduledTime.setMinutes(parseInt(minutes));
  
  // Set reminder 15 minutes before the task
  scheduledTime.setMinutes(scheduledTime.getMinutes() - 15);
  
  const now = new Date();
  const delay = scheduledTime.getTime() - now.getTime();
  
  if (delay > 0) {
    scheduleNotification(
      "Task Reminder",
      {
        body: `Your task "${task.name}" starts in 15 minutes`,
        icon: "/favicon.ico",
      },
      delay
    );
  }
};

export const scheduleDueDateReminder = (item: { name: string; date: string }, type: string) => {
  const dueDate = new Date(item.date);
  
  // Set reminder for 1 day before
  const reminderDate = new Date(dueDate);
  reminderDate.setDate(reminderDate.getDate() - 1);
  reminderDate.setHours(9, 0, 0); // Set to 9 AM
  
  const now = new Date();
  const delay = reminderDate.getTime() - now.getTime();
  
  if (delay > 0) {
    scheduleNotification(
      `${type} Due Tomorrow`,
      {
        body: `Your ${type.toLowerCase()} "${item.name}" is due tomorrow`,
        icon: "/favicon.ico",
      },
      delay
    );
  }
}; 