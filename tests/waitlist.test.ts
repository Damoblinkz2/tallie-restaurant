import request from "supertest";
import app from "../app.js";
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
    const restaurantResponse = await request(app)
      .post("/api/restaurants")
      .send({
        name: "Test Restaurant",
        openingTime: "09:00",
        closingTime: "22:00",
        totalTables: 5,
      });

    restaurantId = restaurantResponse.body.data._id;

    const tableResponse = await request(app).post("/api/tables").send({
      restaurantId,
      tableNumber: 1,
      capacity: 4,
    });

    tableId = tableResponse.body.data._id;

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
    });
  });
});
