import request from "supertest";

import app from "../index.js";
import { setupTestDB, teardownTestDB, clearTestDB } from "./setup.js";

describe("Waitlist API", () => {
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

    // Book the table
    await request(app).post("/api/reservations").send({
      restaurantId,
      customerName: "First Customer",
      phone: "+1111111111",
      partySize: 4,
      date: "2026-12-25",
      startTime: "18:00",
      duration: 120,
    });
  });

  describe("POST /api/waitlist", () => {
    it("should add customer to waitlist when no tables available", async () => {
      const response = await request(app)
        .post("/api/waitlist")
        .send({
          restaurantId,
          customerName: "Jane Smith",
          phone: "+2222222222",
          email: "jane@example.com",
          partySize: 4,
          date: "2026-12-25",
          preferredTime: "18:00",
          duration: 120,
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.customerName).toBe("Jane Smith");
      expect(response.body.data.status).toBe("waiting");
      expect(response.body.message).toContain("Added to waitlist");
    });

    it("should return error for missing fields", async () => {
      const response = await request(app)
        .post("/api/waitlist")
        .send({
          restaurantId,
          customerName: "Jane Smith",
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("Missing required fields");
    });
  });

  describe("GET /api/waitlist", () => {
    it("should get waitlist for a date", async () => {
      // Add to waitlist
      await request(app).post("/api/waitlist").send({
        restaurantId,
        customerName: "Jane Smith",
        phone: "+2222222222",
        partySize: 4,
        date: "2026-12-25",
        preferredTime: "18:00",
        duration: 120,
      });

      const response = await request(app)
        .get("/api/waitlist")
        .query({
          restaurantId,
          date: "2026-12-25",
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(1);
      expect(response.body.data[0].customerName).toBe("Jane Smith");
    });

    it("should filter waitlist by status", async () => {
      await request(app).post("/api/waitlist").send({
        restaurantId,
        customerName: "Jane Smith",
        phone: "+2222222222",
        partySize: 4,
        date: "2026-12-25",
        preferredTime: "18:00",
        duration: 120,
      });

      const response = await request(app)
        .get("/api/waitlist")
        .query({
          restaurantId,
          date: "2026-12-25",
          status: "waiting",
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data[0].status).toBe("waiting");
    });
  });

  describe("POST /api/waitlist/:id/convert", () => {
    it("should convert waitlist to reservation when available", async () => {
      // Add to waitlist
      const waitlistResponse = await request(app).post("/api/waitlist").send({
        restaurantId,
        customerName: "Jane Smith",
        phone: "+2222222222",
        partySize: 2,
        date: "2026-12-26",
        preferredTime: "18:00",
        duration: 120,
      });

      const waitlistId = waitlistResponse.body.data._id;

      // Convert to reservation
      const response = await request(app)
        .post(`/api/waitlist/${waitlistId}/convert`)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.customerName).toBe("Jane Smith");
      expect(response.body.message).toContain("converted");
    });
  });

  describe("DELETE /api/waitlist/:id", () => {
    it("should remove customer from waitlist", async () => {
      // Add to waitlist
      const waitlistResponse = await request(app).post("/api/waitlist").send({
        restaurantId,
        customerName: "Jane Smith",
        phone: "+2222222222",
        partySize: 4,
        date: "2026-12-25",
        preferredTime: "18:00",
        duration: 120,
      });

      const waitlistId = waitlistResponse.body.data._id;

      // Remove from waitlist
      const response = await request(app)
        .delete(`/api/waitlist/${waitlistId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe("expired");
    });
  });
});
