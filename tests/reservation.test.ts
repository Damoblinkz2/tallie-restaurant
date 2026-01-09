import request from "supertest";
import app from "../app.js";
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
  let reservationId: string;

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

    await request(app).post("/api/tables").send({
      restaurantId,
      tableNumber: 1,
      capacity: 4,
    });

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

  describe("PUT /api/reservations/:id", () => {
    it("should modify reservation time", async () => {
      const response = await request(app)
        .put(`/api/reservations/${reservationId}`)
        .send({ startTime: "19:00" })
        .expect(200);

      expect(response.body.data.startTime).toBe("19:00");
    });
  });

  describe("PATCH /api/reservations/:id/confirm", () => {
    it("should confirm reservation", async () => {
      const response = await request(app)
        .patch(`/api/reservations/${reservationId}/confirm`)
        .expect(200);

      expect(response.body.data.status).toBe("confirmed");
    });
  });
});
