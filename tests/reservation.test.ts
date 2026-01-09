import request from "supertest";

import app from "../index.js";
import { setupTestDB, teardownTestDB, clearTestDB } from "./setup.js";

describe("Advanced Reservation Features", () => {
  beforeAll(async () => {
    await setupTestDB();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  afterEach(async () => {
    await clearTestDB();
  });

  let restaurantId: string;
  let tableId: string;
  let reservationId: string;

  beforeEach(async () => {
    // Create restaurant
    const restaurantResponse = await request(app)
      .post("/api/restaurants")
      .send({
        name: "Test Restaurant",
        openingTime: "09:00",
        closingTime: "22:00",
        totalTables: 5,
      });
    restaurantId = restaurantResponse.body.data._id;

    // Add table
    const tableResponse = await request(app).post("/api/tables").send({
      restaurantId,
      tableNumber: 1,
      capacity: 4,
    });
    tableId = tableResponse.body.data._id;

    // Create a reservation
    const reservationResponse = await request(app)
      .post("/api/reservations")
      .send({
        restaurantId,
        customerName: "John Doe",
        phone: "+1234567890",
        email: "john@example.com",
        partySize: 4,
        date: "2026-12-25",
        startTime: "18:00",
        duration: 120,
      });
    reservationId = reservationResponse.body.data._id;
  });

  describe("PUT /api/reservations/:id - Modify Reservation", () => {
    it("should modify reservation time", async () => {
      const response = await request(app)
        .put(`/api/reservations/${reservationId}`)
        .send({
          startTime: "19:00",
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.startTime).toBe("19:00");
      expect(response.body.message).toContain("modified");
    });

    it("should modify party size", async () => {
      const response = await request(app)
        .put(`/api/reservations/${reservationId}`)
        .send({
          partySize: 3,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.partySize).toBe(3);
    });

    it("should not modify cancelled reservation", async () => {
      // Cancel first
      await request(app).delete(`/api/reservations/${reservationId}`);

      // Try to modify
      const response = await request(app)
        .put(`/api/reservations/${reservationId}`)
        .send({
          startTime: "20:00",
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("cancelled");
    });

    it("should return error if no fields provided", async () => {
      const response = await request(app)
        .put(`/api/reservations/${reservationId}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("At least one field");
    });
  });

  describe("DELETE /api/reservations/:id - Cancel Reservation", () => {
    it("should cancel a reservation", async () => {
      const response = await request(app)
        .delete(`/api/reservations/${reservationId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe("cancelled");
      expect(response.body.message).toContain("cancelled successfully");
    });

    it("should not cancel already cancelled reservation", async () => {
      // Cancel once
      await request(app).delete(`/api/reservations/${reservationId}`);

      // Try to cancel again
      const response = await request(app)
        .delete(`/api/reservations/${reservationId}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("already cancelled");
    });
  });

  describe("PATCH /api/reservations/:id/confirm - Confirm Reservation", () => {
    it("should confirm a pending reservation", async () => {
      const response = await request(app)
        .patch(`/api/reservations/${reservationId}/confirm`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe("confirmed");
    });

    it("should not confirm cancelled reservation", async () => {
      // Cancel first
      await request(app).delete(`/api/reservations/${reservationId}`);

      const response = await request(app)
        .patch(`/api/reservations/${reservationId}/confirm`)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe("PATCH /api/reservations/:id/complete - Complete Reservation", () => {
    it("should complete a reservation", async () => {
      const response = await request(app)
        .patch(`/api/reservations/${reservationId}/complete`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe("completed");
    });
  });

  describe("Reservation Status Workflow", () => {
    it("should follow status workflow: pending -> confirmed -> completed", async () => {
      // Check initial status
      let reservation = await request(app).get(
        `/api/reservations/by-date?restaurantId=${restaurantId}&date=2026-12-25`
      );
      expect(reservation.body.data[0].status).toBe("pending");

      // Confirm
      await request(app).patch(`/api/reservations/${reservationId}/confirm`);
      reservation = await request(app).get(
        `/api/reservations/by-date?restaurantId=${restaurantId}&date=2026-12-25`
      );
      expect(reservation.body.data[0].status).toBe("confirmed");

      // Complete
      await request(app).patch(`/api/reservations/${reservationId}/complete`);
      reservation = await request(app).get(
        `/api/reservations/by-date?restaurantId=${restaurantId}&date=2026-12-25`
      );
      expect(reservation.body.data[0].status).toBe("completed");
    });
  });
});
