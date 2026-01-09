//  Utility functions for time calculations and validations

// Converts time string (HH:MM) to total minutes
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

// Converts total minutes to time string (HH:MM)
function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, "0")}:${mins
    .toString()
    .padStart(2, "0")}`;
}

//  Checks if a time is within a given range
const isTimeInRange = (time: string, start: string, end: string): boolean => {
  const timeMinutes = timeToMinutes(time);
  const startMinutes = timeToMinutes(start);
  const endMinutes = timeToMinutes(end);

  return timeMinutes >= startMinutes && timeMinutes < endMinutes;
};

//  Checks if two time slots overlap

const doTimeSlotsOverlap = (
  start1: string,
  duration1: number,
  start2: string,
  duration2: number
): boolean => {
  const start1Minutes = timeToMinutes(start1);
  const end1Minutes = start1Minutes + duration1;
  const start2Minutes = timeToMinutes(start2);
  const end2Minutes = start2Minutes + duration2;

  return start1Minutes < end2Minutes && end1Minutes > start2Minutes;
};

export { timeToMinutes, minutesToTime, isTimeInRange, doTimeSlotsOverlap };
