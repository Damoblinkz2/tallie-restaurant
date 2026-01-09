import { Restaurant, Table, Reservation } from "../types/index.js";

class DataStorage {
  private restaurants: Map<string, Restaurant> = new Map();
  private tables: Map<string, Table> = new Map();
  private reservations: Map<string, Reservation> = new Map();

  // Restaurant methods
  addRestaurant(restaurant: Restaurant): void {
    this.restaurants.set(restaurant.id, restaurant);
  }

  getRestaurant(id: string): Restaurant | undefined {
    return this.restaurants.get(id);
  }

  getAllRestaurants(): Restaurant[] {
    return Array.from(this.restaurants.values());
  }

  // Table methods
  addTable(table: Table): void {
    this.tables.set(table.id, table);
  }

  getTable(id: string): Table | undefined {
    return this.tables.get(id);
  }

  getTablesByRestaurant(restaurantId: string): Table[] {
    return Array.from(this.tables.values()).filter(
      (table) => table.restaurantId === restaurantId
    );
  }

  // Reservation methods
  addReservation(reservation: Reservation): void {
    this.reservations.set(reservation.id, reservation);
  }

  getReservation(id: string): Reservation | undefined {
    return this.reservations.get(id);
  }

  getReservationsByRestaurantAndDate(
    restaurantId: string,
    date: string
  ): Reservation[] {
    return Array.from(this.reservations.values()).filter(
      (reservation) =>
        reservation.restaurantId === restaurantId && reservation.date === date
    );
  }

  getAllReservations(): Reservation[] {
    return Array.from(this.reservations.values());
  }
}

export const storage = new DataStorage();
