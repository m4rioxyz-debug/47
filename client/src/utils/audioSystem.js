const createBeep = (freq, duration, type='sine') => {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
    
    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration + 0.1);
  } catch(e) {}
};

export const playMessageSound = () => createBeep(523.25, 0.2, 'sine'); // C5
export const playJoinSound = () => createBeep(659.25, 0.3, 'triangle'); // E5

// Request desktop notifications
export const requestDesktopNotifications = async () => {
  if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
    await Notification.requestPermission();
  }
};

export const showDesktopNotification = (title, body) => {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, { body });
  }
};
