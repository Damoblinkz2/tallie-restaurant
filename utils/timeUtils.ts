/**
 * Utility functions for time string parsing, formatting, and overlap detection.
 *
 * All functions operate on HH:MM 24-hour time strings or minute-based integers.
 * These helpers are used throughout the reservation and availability logic to
 * compare operating hours, check booking conflicts, and generate time slots.
 */

/**
 * Converts an HH:MM time string to the equivalent number of minutes since midnight.
 *
 * @param time - Time string in HH:MM 24-hour format (e.g. "14:30")
 * @returns Total minutes from midnight (e.g. 870 for "14:30")
 */
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

/**
 * Converts a number of minutes since midnight back to an HH:MM time string.
 * Zero-pads both hours and minutes to ensure consistent two-digit output.
 *
 * @param minutes - Total minutes from midnight (e.g. 870)
 * @returns Time string in HH:MM format (e.g. "14:30")
 */
function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, "0")}:${mins
    .toString()
    .padStart(2, "0")}`;
}

/**
 * Determines whether a given time falls within a start–end range (inclusive start, exclusive end).
 * Used to validate that a reservation start time is within the restaurant's operating hours.
 *
 * @param time  - The time to test, in HH:MM format
 * @param start - Range start (inclusive), in HH:MM format
 * @param end   - Range end (exclusive), in HH:MM format
 * @returns `true` if `start <= time < end`, otherwise `false`
 */
const isTimeInRange = (time: string, start: string, end: string): boolean => {
  const timeMinutes = timeToMinutes(time);
  const startMinutes = timeToMinutes(start);
  const endMinutes = timeToMinutes(end);

  return timeMinutes >= startMinutes && timeMinutes < endMinutes;
};

/**
 * Checks whether two time slots overlap using the standard interval-intersection test.
 * Two slots overlap if and only if one starts before the other ends.
 *
 * @param start1    - Start time of the first slot in HH:MM format
 * @param duration1 - Duration of the first slot in minutes
 * @param start2    - Start time of the second slot in HH:MM format
 * @param duration2 - Duration of the second slot in minutes
 * @returns `true` if the two slots overlap, otherwise `false`
 */
const doTimeSlotsOverlap = (
  start1: string,
  duration1: number,
  start2: string,
  duration2: number,
): boolean => {
  const start1Minutes = timeToMinutes(start1);
  const end1Minutes = start1Minutes + duration1;
  const start2Minutes = timeToMinutes(start2);
  const end2Minutes = start2Minutes + duration2;

  // Overlap exists when slot1 starts before slot2 ends AND slot1 ends after slot2 starts
  return start1Minutes < end2Minutes && end1Minutes > start2Minutes;
};

export { timeToMinutes, minutesToTime, isTimeInRange, doTimeSlotsOverlap };
