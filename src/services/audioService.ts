const audio = new Audio('/sounds/notification.mp3');

export const playNotificationSound = () => {
  audio.play().catch(error => {
    // Autoplay was prevented. This is a common browser policy.
    // We can ignore this error as it's not critical.
    console.warn("Notification sound was blocked by the browser.", error);
  });
}; 