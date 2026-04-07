export const generateId = () => crypto.randomUUID();

export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export const parseTime = (timeStr: string): number => {
  if (!timeStr.includes(':')) {
    const secs = parseInt(timeStr, 10);
    return isNaN(secs) ? 0 : secs;
  }
  const [mins, secs] = timeStr.split(':').map(s => parseInt(s, 10));
  return (isNaN(mins) ? 0 : mins * 60) + (isNaN(secs) ? 0 : secs);
};
