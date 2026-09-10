# Zyra Luxe Headless API

This plugin provides the API used by the React storefront.

React-created orders appear in **WooCommerce > Orders** with normal WooCommerce line items, customer billing/shipping details, order notes, and a Zyra Luxe React order panel. Existing orders are unchanged; install plugin version `1.0.2` before testing a new authenticated order. This version also handles authenticated CORS preflight requests.

## Install

1. Zip the `zyraluxe-headless-api` folder.
2. In WordPress, open **Plugins > Add New > Upload Plugin**.
3. Upload the zip and activate it.
4. Confirm WooCommerce is active.
5. The live React origin `https://shopprime-react.netlify.app` and local Vite origins are already allowed. Add any additional React origin to the `zyra_headless_allowed_origins` filter. For example, in a small site plugin or the active theme:

```php
add_filter('zyra_headless_allowed_origins', function (array $origins): array {
    $origins[] = 'https://your-react-domain.example';
    return $origins;
});
```

For local development, `http://localhost:5173`, `http://localhost:4173`, `http://127.0.0.1:5173`, and `http://127.0.0.1:4173` are already allowed.

## Endpoints

Base URL: `https://zyraluxe.in/wp-json/zyra/v1`

- `POST /auth/register`: `{ username, email, password, name? }`
- `POST /auth/login`: `{ username, password }`
- `POST /auth/logout`: bearer token required
- `GET /auth/me`: bearer token required
- `POST /auth/forgot-password`: `{ email }`
- `POST /orders`: creates a pending WooCommerce order
- `GET /orders`: returns only the authenticated customer's orders
- `GET /orders/{id}`: returns an authenticated customer's order
- `POST /bookings`: creates a pending WooCommerce order and stores booking fields
- `GET /customer/address`: bearer token required
- `PUT /customer/address`: `{ billing, shipping }`, bearer token required

Send the returned token on protected requests:

```text
Authorization: Bearer <token>
```

## Order payload

```json
{
  "items": [
    {
      "product_id": 123,
      "quantity": 2,
      "selectedColor": "Gold",
      "selectedSize": "Medium"
    }
  ],
  "billing": {
    "first_name": "Asha",
    "last_name": "Roy",
    "email": "asha@example.com",
    "phone": "+919999999999",
    "address_1": "12 Park Street",
    "city": "Kolkata",
    "state": "WB",
    "postcode": "700016",
    "country": "IN"
  },
  "shipping": {},
  "payment_method": "cod",
  "payment_method_title": "Cash on delivery"
}
```

The server recalculates totals from WooCommerce products. Client totals are not trusted.

## Booking payload

`POST /bookings` uses the same order payload and accepts:

```json
{
  "booking": {
    "date": "2026-10-01",
    "time": "15:00",
    "timezone": "Asia/Kolkata",
    "service": "Consultation",
    "notes": "Please confirm the appointment"
  }
}
```

Bookings are represented as WooCommerce orders with `_zyra_booking_*` metadata. This is suitable for a simple booking request. For real time-slot availability, staff assignment, conflict prevention, rescheduling, and cancellation rules, WooCommerce Bookings or a dedicated booking model is still required.

## Payment

The plugin creates orders with `pending` status. Connect a real WooCommerce payment gateway before treating an order as paid. Do not send card numbers or CVV values to this API or store them in WordPress.
