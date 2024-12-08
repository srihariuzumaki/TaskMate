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