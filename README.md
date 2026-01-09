# Tallie - Restaurant Reservation API

A comprehensive REST API for managing restaurant reservations, tables, and waitlists built with Node.js, TypeScript, Express, and MongoDB.

## Features

- **Restaurant Management**: Create and retrieve restaurant details
- **Table Management**: Add tables to restaurants and retrieve tables by restaurant
- **Reservation System**: Create, modify, cancel, confirm, and complete reservations
- **Reservation Modification**: Update existing reservations
- **Reservation Cancellation**: Cancel reservations with proper handling
- **Reservation Status Tracking**: Track reservation statuses (confirmed, completed)
- **Waitlist Management**: Add customers to waitlist, convert to reservations, remove from waitlist
- **Notification System (Mock)**: Placeholder for notification services
- **Availability Checking**: Check table availability for specific dates and times
- **Time Slot Management**: Retrieve available time slots for reservations

## Installation

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd tallie1
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory with the following variables:

   ```
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/tallie
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

## Usage

The API will be running at `http://localhost:3000`.

### Health Check

Visit `http://localhost:3000` to check if the API is running and see available features.

## API Endpoints

### Restaurants

- `POST /api/restaurants` - Create a new restaurant
- `GET /api/restaurants` - Get all restaurants
- `GET /api/restaurants/:id` - Get restaurant details by ID

### Tables

- `POST /api/tables` - Add a table to a restaurant
- `GET /api/tables/:restaurantId` - Get tables by restaurant ID

### Reservations

- `POST /api/reservations` - Create a new reservation
- `PUT /api/reservations/:id` - Modify an existing reservation
- `DELETE /api/reservations/:id` - Cancel a reservation
- `PATCH /api/reservations/:id/confirm` - Confirm a reservation
- `PATCH /api/reservations/:id/complete` - Mark a reservation as completed
- `GET /api/reservations/check-availability` - Check availability for a date/time
- `GET /api/reservations/by-date` - Get reservations by date
- `GET /api/reservations/available-slots` - Get available time slots

### Waitlist

- `POST /api/waitlist` - Add a customer to the waitlist
- `GET /api/waitlist` - Get waitlist by date
- `POST /api/waitlist/:id/convert` - Convert waitlist entry to reservation
- `DELETE /api/waitlist/:id` - Remove from waitlist

## Testing

Run the test suite using Jest:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run tests verbosely
npm run test:verbose

# Run tests silently
npm run test:silent
```

## Building and Production

1. Build the project:

   ```bash
   npm run build
   ```

2. Start the production server:
   ```bash
   npm start
   ```

## Project Structure

```
tallie1/
├── config/          # Database configuration
├── controllers/     # Route controllers
├── data/            # Data storage utilities
├── middleware/      # Express middleware
├── models/          # Mongoose models
├── routes/          # API routes
├── services/        # Business logic services
├── tests/           # Test files
├── types/           # TypeScript type definitions
├── utils/           # Utility functions
├── index.ts         # Main application entry point
├── package.json     # Dependencies and scripts
└── tsconfig.json    # TypeScript configuration
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License.
