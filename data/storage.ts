import {
  IRestaurant as Restaurant,
  ITable as Table,
  IReservation as Reservation,
} from "../types/index.js";

/**
 * In-memory data storage layer.
 *
 * `DataStorage` is a lightweight, Map-backed alternative to the MongoDB models.
 * It is used by tests and prototyping scenarios where a live database is not
 * needed.  Each entity type (restaurants, tables, reservations) is stored in
 * its own `Map<string, T>` keyed by the document's `_id`.
 *
 * NOTE: Data is only held in process memory and is lost on restart.
 * For production use, rely on the Mongoose service layer instead.
 */
class DataStorage {
  private restaurants: Map<string, Restaurant> = new Map();
  private tables: Map<string, Table> = new Map();
  private reservations: Map<string, Reservation> = new Map();

  // Restaurant methods
  /** Inserts a restaurant document into the in-memory store */
  addRestaurant(restaurant: Restaurant): void {
    this.restaurants.set(String(restaurant._id), restaurant);
  }

  /** Returns the restaurant with the given ID, or `undefined` if not found */
  getRestaurant(id: string): Restaurant | undefined {
    return this.restaurants.get(id);
  }

  /** Returns all stored restaurants as an array */
  getAllRestaurants(): Restaurant[] {
    return Array.from(this.restaurants.values());
  }

  // Table methods
  /** Inserts a table document into the in-memory store */
  addTable(table: Table): void {
    this.tables.set(String(table._id), table);
  }

  /** Returns the table with the given ID, or `undefined` if not found */
  getTable(id: string): Table | undefined {
    return this.tables.get(id);
  }

  /** Returns all tables belonging to the specified restaurant */
  getTablesByRestaurant(restaurantId: string): Table[] {
    return Array.from(this.tables.values()).filter(
      (table) => String(table.restaurantId) === restaurantId,
    );
  }

  // Reservation methods
  /** Inserts a reservation document into the in-memory store */
  addReservation(reservation: Reservation): void {
    this.reservations.set(String(reservation._id), reservation);
  }

  /** Returns the reservation with the given ID, or `undefined` if not found */
  getReservation(id: string): Reservation | undefined {
    return this.reservations.get(id);
  }

  getReservationsByRestaurantAndDate(
    restaurantId: string,
    date: string,
  ): Reservation[] {
    // Returns all reservations for a restaurant on a specific date
    return Array.from(this.reservations.values()).filter(
      (reservation) =>
        String(reservation.restaurantId) === restaurantId &&
        reservation.date === date,
    );
  }

  /** Returns all stored reservations as an array */
  getAllReservations(): Reservation[] {
    return Array.from(this.reservations.values());
  }
}

/** Singleton in-memory storage instance shared across the application */
export const storage = new DataStorage();
