import { IReservation, IWaitlist } from "../types/index.js";

const notificationService = {
  /**
   * Sends a reservation confirmation notification to the customer via email and SMS.
   * Includes all reservation details such as date, time, party size, and reservation ID.
   * Currently logs the notifications to console (in a real implementation, this would send actual emails/SMS).
   *
   * @param {IReservation} reservation - The reservation object containing customer and booking details
   * @returns {void}
   */
  sendReservationConfirmation(reservation: IReservation): void {
    console.log("\n📧 ===== EMAIL NOTIFICATION =====");
    console.log(`To: ${reservation.email || "N/A"}`);
    console.log(`Subject: Reservation Confirmed`);
    console.log(`\nDear ${reservation.customerName},`);
    console.log(`\nYour reservation has been confirmed!`);
    console.log(`\nDetails:`);
    console.log(`- Date: ${reservation.date}`);
    console.log(`- Time: ${reservation.startTime}`);
    console.log(`- Party Size: ${reservation.partySize} guests`);
    console.log(`- Duration: ${reservation.duration} minutes`);
    console.log(`- Reservation ID: ${reservation._id}`);
    console.log(`- Status: ${reservation.status.toUpperCase()}`);
    console.log(`\nWe look forward to serving you!`);
    console.log("================================\n");

    console.log("📱 ===== SMS NOTIFICATION =====");
    console.log(`To: ${reservation.phone}`);
    console.log(
      `Message: Hi ${reservation.customerName}! Your reservation for ${reservation.partySize} on ${reservation.date} at ${reservation.startTime} is confirmed. Ref: ${reservation._id}`
    );
    console.log("===============================\n");
  },

  /**
   * Sends a reservation cancellation notification to the customer via email and SMS.
   * Informs the customer that their reservation has been cancelled and provides the cancelled reservation details.
   * Currently logs the notifications to console (in a real implementation, this would send actual emails/SMS).
   *
   * @param {IReservation} reservation - The cancelled reservation object containing customer and booking details
   * @returns {void}
   */
  sendCancellationNotification(reservation: IReservation): void {
    console.log("\n📧 ===== EMAIL NOTIFICATION =====");
    console.log(`To: ${reservation.email || "N/A"}`);
    console.log(`Subject: Reservation Cancelled`);
    console.log(`\nDear ${reservation.customerName},`);
    console.log(`\nYour reservation has been cancelled.`);
    console.log(`\nCancelled Reservation Details:`);
    console.log(`- Date: ${reservation.date}`);
    console.log(`- Time: ${reservation.startTime}`);
    console.log(`- Party Size: ${reservation.partySize} guests`);
    console.log(`- Reservation ID: ${reservation._id}`);
    console.log(`\nWe hope to serve you another time!`);
    console.log("================================\n");

    console.log("📱 ===== SMS NOTIFICATION =====");
    console.log(`To: ${reservation.phone}`);
    console.log(
      `Message: Your reservation for ${reservation.date} at ${reservation.startTime} has been cancelled. Ref: ${reservation._id}`
    );
    console.log("===============================\n");
  },

  /**
   * Sends a reservation modification notification to the customer via email and SMS.
   * Informs the customer that their reservation has been modified and provides the updated reservation details.
   * Currently logs the notifications to console (in a real implementation, this would send actual emails/SMS).
   *
   * @param {IReservation} reservation - The modified reservation object containing updated customer and booking details
   * @returns {void}
   */
  sendModificationNotification(reservation: IReservation): void {
    console.log("\n📧 ===== EMAIL NOTIFICATION =====");
    console.log(`To: ${reservation.email || "N/A"}`);
    console.log(`Subject: Reservation Modified`);
    console.log(`\nDear ${reservation.customerName},`);
    console.log(`\nYour reservation has been modified.`);
    console.log(`\nUpdated Details:`);
    console.log(`- Date: ${reservation.date}`);
    console.log(`- Time: ${reservation.startTime}`);
    console.log(`- Party Size: ${reservation.partySize} guests`);
    console.log(`- Duration: ${reservation.duration} minutes`);
    console.log(`- Reservation ID: ${reservation._id}`);
    console.log(`\nSee you soon!`);
    console.log("================================\n");

    console.log("📱 ===== SMS NOTIFICATION =====");
    console.log(`To: ${reservation.phone}`);
    console.log(
      `Message: Your reservation has been updated. New time: ${reservation.date} at ${reservation.startTime}. Party size: ${reservation.partySize}. Ref: ${reservation._id}`
    );
    console.log("===============================\n");
  },

  /**
   * Sends a waitlist notification to the customer via email and SMS when a table becomes available.
   * Informs the customer that their requested time slot is now available and they need to confirm within 30 minutes.
   * Currently logs the notifications to console (in a real implementation, this would send actual emails/SMS).
   *
   * @param {IWaitlist} waitlist - The waitlist entry object containing customer and requested booking details
   * @returns {void}
   */
  sendWaitlistNotification(waitlist: IWaitlist): void {
    console.log("\n📧 ===== EMAIL NOTIFICATION =====");
    console.log(`To: ${waitlist.email || "N/A"}`);
    console.log(`Subject: Table Available - Waitlist Update`);
    console.log(`\nDear ${waitlist.customerName},`);
    console.log(
      `\nGood news! A table is now available for your requested time.`
    );
    console.log(`\nDetails:`);
    console.log(`- Date: ${waitlist.date}`);
    console.log(`- Time: ${waitlist.preferredTime}`);
    console.log(`- Party Size: ${waitlist.partySize} guests`);
    console.log(`- Duration: ${waitlist.duration} minutes`);
    console.log(
      `\nPlease confirm your reservation within 30 minutes to secure your spot.`
    );
    console.log(`Waitlist ID: ${waitlist._id}`);
    console.log("================================\n");

    console.log("📱 ===== SMS NOTIFICATION =====");
    console.log(`To: ${waitlist.phone}`);
    console.log(
      `Message: Great news ${waitlist.customerName}! A table for ${waitlist.partySize} is available on ${waitlist.date} at ${waitlist.preferredTime}. Confirm within 30 min. Ref: ${waitlist._id}`
    );
    console.log("===============================\n");
  },

  /**
   * Sends a waitlist confirmation notification to the customer via email and SMS when they are added to the waitlist.
   * Confirms that the customer has been successfully added to the waitlist and provides their requested details.
   * Currently logs the notifications to console (in a real implementation, this would send actual emails/SMS).
   *
   * @param {IWaitlist} waitlist - The waitlist entry object containing customer and requested booking details
   * @returns {void}
   */
  sendWaitlistConfirmation(waitlist: IWaitlist): void {
    console.log("\n📧 ===== EMAIL NOTIFICATION =====");
    console.log(`To: ${waitlist.email || "N/A"}`);
    console.log(`Subject: Added to Waitlist`);
    console.log(`\nDear ${waitlist.customerName},`);
    console.log(`\nYou've been added to our waitlist.`);
    console.log(`\nRequested Details:`);
    console.log(`- Date: ${waitlist.date}`);
    console.log(`- Preferred Time: ${waitlist.preferredTime}`);
    console.log(`- Party Size: ${waitlist.partySize} guests`);
    console.log(`\nWe'll notify you as soon as a table becomes available.`);
    console.log(`Waitlist ID: ${waitlist._id}`);
    console.log("================================\n");

    console.log("📱 ===== SMS NOTIFICATION =====");
    console.log(`To: ${waitlist.phone}`);
    console.log(
      `Message: You're on the waitlist for ${waitlist.date} at ${waitlist.preferredTime} for ${waitlist.partySize} guests. We'll notify you when a table opens up. Ref: ${waitlist._id}`
    );
    console.log("===============================\n");
  },
};

export { notificationService };
