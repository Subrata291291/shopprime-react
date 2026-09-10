<?php
/**
 * Plugin Name: Zyra Luxe Headless API
 * Description: Headless authentication, customer data, WooCommerce checkout, and booking/order endpoints for the Zyra Luxe React storefront.
 * Version: 1.0.6
 * Author: Zyra Luxe
 * Requires at least: 6.4
 * Requires PHP: 7.4
 */

defined('ABSPATH') || exit;

final class Zyra_Luxe_Headless_API {
    private const NAMESPACE = 'zyra/v1';
    private const TOKEN_META = '_zyra_headless_tokens';

    public static function boot(): void {
        add_action('init', [__CLASS__, 'handle_preflight'], 0);
        add_action('send_headers', [__CLASS__, 'send_cors_headers_early'], 0);
        add_action('rest_api_init', [__CLASS__, 'register_routes']);
        add_filter('rest_pre_serve_request', [__CLASS__, 'cors_headers'], 10, 4);
        add_filter('woocommerce_get_return_url', [__CLASS__, 'return_to_storefront'], 99, 2);
        add_filter('allowed_redirect_hosts', [__CLASS__, 'allow_storefront_redirect_hosts']);
        add_action('woocommerce_admin_order_data_after_order_details', [__CLASS__, 'render_admin_order_details']);
    }

    public static function send_cors_headers_early(): void {
        if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'OPTIONS') return;

        self::add_cors_headers();
    }

    public static function handle_preflight(): void {
        if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'OPTIONS') return;

        $origin = isset($_SERVER['HTTP_ORIGIN']) ? esc_url_raw(wp_unslash($_SERVER['HTTP_ORIGIN'])) : '';
        $allowed = [
            'http://localhost:5173',
            'http://localhost:4173',
            'http://127.0.0.1:5173',
            'http://127.0.0.1:4173',
            'https://shopprime-react.netlify.app',
        ];
        $allowed = apply_filters('zyra_headless_allowed_origins', $allowed);

        if (!$origin || !in_array($origin, $allowed, true)) return;

        header('Access-Control-Allow-Origin: ' . $origin);
        header('Access-Control-Allow-Credentials: true');
        header('Access-Control-Allow-Headers: Authorization, Content-Type');
        header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, OPTIONS');
        header('Access-Control-Max-Age: 600');
        header('Vary: Origin', false);
        status_header(204);
        exit;
    }

    public static function register_routes(): void {
        register_rest_route(self::NAMESPACE, '/auth/register', [
            'methods' => WP_REST_Server::CREATABLE,
            'callback' => [__CLASS__, 'register'],
            'permission_callback' => '__return_true',
        ]);
        register_rest_route(self::NAMESPACE, '/auth/login', [
            'methods' => WP_REST_Server::CREATABLE,
            'callback' => [__CLASS__, 'login'],
            'permission_callback' => '__return_true',
        ]);
        register_rest_route(self::NAMESPACE, '/auth/logout', [
            'methods' => WP_REST_Server::CREATABLE,
            'callback' => [__CLASS__, 'logout'],
            'permission_callback' => [__CLASS__, 'require_user'],
        ]);
        register_rest_route(self::NAMESPACE, '/auth/me', [
            'methods' => WP_REST_Server::READABLE,
            'callback' => [__CLASS__, 'me'],
            'permission_callback' => [__CLASS__, 'require_user'],
        ]);
        register_rest_route(self::NAMESPACE, '/auth/forgot-password', [
            'methods' => WP_REST_Server::CREATABLE,
            'callback' => [__CLASS__, 'forgot_password'],
            'permission_callback' => '__return_true',
        ]);

        register_rest_route(self::NAMESPACE, '/orders', [
            'methods' => WP_REST_Server::CREATABLE,
            'callback' => [__CLASS__, 'create_order'],
            'permission_callback' => '__return_true',
        ]);
        register_rest_route(self::NAMESPACE, '/orders', [
            'methods' => WP_REST_Server::READABLE,
            'callback' => [__CLASS__, 'orders'],
            'permission_callback' => [__CLASS__, 'require_user'],
        ]);
        register_rest_route(self::NAMESPACE, '/orders/(?P<id>\d+)', [
            'methods' => WP_REST_Server::READABLE,
            'callback' => [__CLASS__, 'order'],
            'permission_callback' => [__CLASS__, 'require_user'],
        ]);
        register_rest_route(self::NAMESPACE, '/bookings', [
            'methods' => WP_REST_Server::CREATABLE,
            'callback' => [__CLASS__, 'create_booking'],
            'permission_callback' => '__return_true',
        ]);
        register_rest_route(self::NAMESPACE, '/customer/address', [
            'methods' => WP_REST_Server::READABLE,
            'callback' => [__CLASS__, 'get_address'],
            'permission_callback' => [__CLASS__, 'require_user'],
        ]);
        register_rest_route(self::NAMESPACE, '/customer/address', [
            'methods' => WP_REST_Server::EDITABLE,
            'callback' => [__CLASS__, 'save_address'],
            'permission_callback' => [__CLASS__, 'require_user'],
        ]);
    }

    public static function cors_headers($served, $result, $request, $server) {
        self::add_cors_headers();

        return $served;
    }

    private static function add_cors_headers(): void {
        $origin = isset($_SERVER['HTTP_ORIGIN']) ? esc_url_raw(wp_unslash($_SERVER['HTTP_ORIGIN'])) : '';
        $allowed = apply_filters('zyra_headless_allowed_origins', [
            'http://localhost:5173',
            'http://localhost:4173',
            'http://127.0.0.1:5173',
            'http://127.0.0.1:4173',
            'https://shopprime-react.netlify.app',
        ]);

        if ($origin && in_array($origin, $allowed, true)) {
            header('Access-Control-Allow-Origin: ' . $origin);
            header('Access-Control-Allow-Credentials: true');
            header('Access-Control-Allow-Headers: Authorization, Content-Type');
            header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, OPTIONS');
            header('Vary: Origin', false);
        }
    }

    private static function allowed_origins(): array {
        return apply_filters('zyra_headless_allowed_origins', [
            'http://localhost:5173',
            'http://localhost:4173',
            'http://127.0.0.1:5173',
            'http://127.0.0.1:4173',
            'https://shopprime-react.netlify.app',
        ]);
    }

    private static function storefront_url($value): string {
        $origin = rtrim(esc_url_raw((string) $value), '/');
        return in_array($origin, self::allowed_origins(), true) ? $origin : '';
    }

    public static function return_to_storefront($return_url, $order): string {
        if (!$order instanceof WC_Order) return $return_url;

        $storefront_url = self::storefront_url($order->get_meta('_zyra_headless_storefront_url'));
        return $storefront_url ? $storefront_url . '/thank-you' : $return_url;
    }

    public static function allow_storefront_redirect_hosts(array $hosts): array {
        foreach (self::allowed_origins() as $origin) {
            $host = wp_parse_url($origin, PHP_URL_HOST);
            if ($host) $hosts[] = $host;
        }
        return array_values(array_unique($hosts));
    }

    private static function error(string $message, int $status = 400): WP_Error {
        return new WP_Error('zyra_api_error', $message, ['status' => $status]);
    }

    private static function body(WP_REST_Request $request): array {
        $body = $request->get_json_params();
        return is_array($body) ? $body : [];
    }

    private static function token(): string {
        $header = $GLOBALS['wp']->query_vars['rest_route'] ?? '';
        unset($header);
        $authorization = isset($_SERVER['HTTP_AUTHORIZATION']) ? trim(wp_unslash($_SERVER['HTTP_AUTHORIZATION'])) : '';
        if (!$authorization && function_exists('getallheaders')) {
            $headers = getallheaders();
            $authorization = isset($headers['Authorization']) ? trim($headers['Authorization']) : '';
        }
        return preg_match('/^Bearer\s+(.+)$/i', $authorization, $matches) ? sanitize_text_field($matches[1]) : '';
    }

    private static function issue_token(int $user_id): string {
        $token = wp_generate_password(64, false, false);
        $tokens = get_user_meta($user_id, self::TOKEN_META, true);
        $tokens = is_array($tokens) ? $tokens : [];
        $tokens[hash('sha256', $token)] = time() + DAY_IN_SECONDS * 30;
        update_user_meta($user_id, self::TOKEN_META, $tokens);
        return $token;
    }

    private static function user_from_token(): ?WP_User {
        $token = self::token();
        if (!$token) return null;
        $hash = hash('sha256', $token);
        foreach (get_users(['meta_key' => self::TOKEN_META, 'fields' => 'ID', 'number' => 100]) as $user_id) {
            $tokens = get_user_meta((int) $user_id, self::TOKEN_META, true);
            if (!is_array($tokens) || !isset($tokens[$hash])) continue;
            if ((int) $tokens[$hash] < time()) {
                unset($tokens[$hash]);
                update_user_meta((int) $user_id, self::TOKEN_META, $tokens);
                return null;
            }
            return get_user_by('id', (int) $user_id) ?: null;
        }
        return null;
    }

    public static function require_user(): bool {
        $user = self::user_from_token();
        if ($user) {
            wp_set_current_user($user->ID);
            return true;
        }
        return false;
    }

    private static function user_response(WP_User $user, string $token = ''): array {
        $customer = function_exists('wc_get_customer') ? new WC_Customer($user->ID) : null;
        return [
            'token' => $token,
            'user' => [
                'id' => $user->ID,
                'username' => $user->user_login,
                'name' => trim(($customer ? $customer->get_first_name() : '') . ' ' . ($customer ? $customer->get_last_name() : '')) ?: $user->display_name,
                'email' => $user->user_email,
                'avatar' => get_avatar_url($user->ID),
            ],
        ];
    }

    public static function register(WP_REST_Request $request) {
        $body = self::body($request);
        $username = sanitize_user((string) ($body['username'] ?? ''), true);
        $email = sanitize_email((string) ($body['email'] ?? ''));
        $password = (string) ($body['password'] ?? '');

        if (!$username || !is_email($email) || strlen($password) < 8) {
            return self::error('Username, valid email, and a password of at least 8 characters are required.');
        }
        if (username_exists($username)) return self::error('This username is already registered.', 409);
        if (email_exists($email)) return self::error('This email is already registered.', 409);

        $user_id = wp_create_user($username, $password, $email);
        if (is_wp_error($user_id)) return self::error($user_id->get_error_message(), 400);
        $user = new WP_User($user_id);
        $user->set_role('customer');
        wp_update_user(['ID' => $user_id, 'display_name' => sanitize_text_field((string) ($body['name'] ?? $username))]);

        return new WP_REST_Response(self::user_response(get_user_by('id', $user_id), self::issue_token($user_id)), 201);
    }

    public static function login(WP_REST_Request $request) {
        $body = self::body($request);
        $identity = sanitize_text_field((string) ($body['username'] ?? $body['email'] ?? ''));
        $password = (string) ($body['password'] ?? '');
        $user = is_email($identity) ? get_user_by('email', $identity) : get_user_by('login', $identity);
        $authenticated = $user ? wp_authenticate($user->user_login, $password) : new WP_Error('invalid_login');
        if (is_wp_error($authenticated)) return self::error('Invalid username/email or password.', 401);
        return self::user_response($authenticated, self::issue_token($authenticated->ID));
    }

    public static function logout() {
        $user = self::user_from_token();
        if ($user) {
            $tokens = get_user_meta($user->ID, self::TOKEN_META, true);
            $token = self::token();
            if (is_array($tokens) && $token) {
                unset($tokens[hash('sha256', $token)]);
                update_user_meta($user->ID, self::TOKEN_META, $tokens);
            }
        }
        return ['success' => true];
    }

    public static function me() {
        $user = self::user_from_token();
        return $user ? self::user_response($user) : self::error('Authentication required.', 401);
    }

    public static function forgot_password(WP_REST_Request $request) {
        $body = self::body($request);
        $login = sanitize_text_field((string) ($body['email'] ?? $body['username'] ?? ''));
        $user = is_email($login) ? get_user_by('email', $login) : get_user_by('login', $login);
        if ($user) retrieve_password($user->user_login);
        return ['success' => true, 'message' => 'If the account exists, a password reset email has been sent.'];
    }

    private static function require_woocommerce() {
        if (!class_exists('WooCommerce') || !function_exists('wc_get_product')) {
            return self::error('WooCommerce must be active.', 503);
        }
        return null;
    }

    private static function address(array $source): array {
        return [
            'first_name' => sanitize_text_field((string) ($source['first_name'] ?? '')),
            'last_name' => sanitize_text_field((string) ($source['last_name'] ?? '')),
            'company' => sanitize_text_field((string) ($source['company'] ?? '')),
            'address_1' => sanitize_text_field((string) ($source['address_1'] ?? $source['address'] ?? '')),
            'address_2' => sanitize_text_field((string) ($source['address_2'] ?? '')),
            'city' => sanitize_text_field((string) ($source['city'] ?? '')),
            'state' => sanitize_text_field((string) ($source['state'] ?? '')),
            'postcode' => sanitize_text_field((string) ($source['postcode'] ?? $source['postalCode'] ?? '')),
            'country' => sanitize_text_field((string) ($source['country'] ?? 'IN')),
            'email' => sanitize_email((string) ($source['email'] ?? '')),
            'phone' => sanitize_text_field((string) ($source['phone'] ?? '')),
        ];
    }

    private static function make_order(array $body, bool $booking = false) {
        $woocommerce_error = self::require_woocommerce();
        if ($woocommerce_error) return $woocommerce_error;
        $items = isset($body['items']) && is_array($body['items']) ? $body['items'] : [];
        if (!$items) return self::error('At least one product is required.');

        $order = wc_create_order();
        if (is_wp_error($order)) return self::error($order->get_error_message(), 500);
        foreach ($items as $item) {
            $product_id = absint($item['product_id'] ?? $item['productId'] ?? 0);
            $quantity = max(1, absint($item['quantity'] ?? $item['qty'] ?? 1));
            $product = wc_get_product($product_id);
            if (!$product || !$product->is_purchasable() || !$product->is_in_stock()) {
                $order->delete(true);
                return self::error('One of the selected products is unavailable.', 409);
            }
            $line_id = $order->add_product($product, $quantity);
            $line_item = $order->get_item($line_id);
            if ($line_item) {
                foreach (['selectedColor' => 'Color', 'selectedSize' => 'Size'] as $input => $label) {
                    if (!empty($item[$input])) $line_item->add_meta_data($label, sanitize_text_field((string) $item[$input]), true);
                }
                $line_item->save();
            }
        }

        $billing = self::address((array) ($body['billing'] ?? $body['shipping'] ?? []));
        $shipping = self::address((array) ($body['shipping'] ?? []));
        $order->set_address($billing, 'billing');
        $order->set_address($shipping, 'shipping');
        $payment_method = sanitize_key((string) ($body['payment_method'] ?? 'razorpay'));
        $payment_title = sanitize_text_field((string) ($body['payment_method_title'] ?? 'Pay by Razorpay'));
        $order->set_payment_method($payment_method);
        $order->set_payment_method_title($payment_title);
        $shipping_methods = [
            'Xpressbees Surface' => 118.36,
            'Xpressbees Air' => 147.36,
            'Delhivery Surface' => 131.36,
            'Delhivery Air' => 164.36,
            'Blue Dart Air' => 215.25,
        ];
        $shipping_method = sanitize_text_field((string) ($body['shipping_method'] ?? 'Xpressbees Surface'));
        $shipping_cost = isset($shipping_methods[$shipping_method]) ? (float) $shipping_methods[$shipping_method] : $shipping_methods['Xpressbees Surface'];
        $shipping_item = new WC_Order_Item_Shipping();
        $shipping_item->set_method_title($shipping_method);
        $shipping_item->set_method_id(sanitize_title($shipping_method));
        $shipping_item->set_total($shipping_cost);
        $order->add_item($shipping_item);
        $order->calculate_totals();
        $order->update_meta_data('_zyra_headless_source', 'react');
        $storefront_url = self::storefront_url($body['storefront_url'] ?? '');
        if ($storefront_url) $order->update_meta_data('_zyra_headless_storefront_url', $storefront_url);
        $order->add_order_note('Order created by the Zyra Luxe React storefront.');
        if ($booking) {
            $booking_data = (array) ($body['booking'] ?? []);
            $order->update_meta_data('_zyra_booking', 'yes');
            foreach (['date', 'time', 'timezone', 'notes', 'service'] as $key) {
                if (isset($booking_data[$key])) $order->update_meta_data('_zyra_booking_' . $key, sanitize_text_field((string) $booking_data[$key]));
            }
            $order->add_order_note('Booking request details were saved to this order.');
        }
        $order->set_status('pending');
        $order->save();
        return $order;
    }

    public static function create_order(WP_REST_Request $request) {
        $order = self::make_order(self::body($request));
        if (is_wp_error($order)) return $order;
        return new WP_REST_Response(self::order_response($order), 201);
    }

    public static function create_booking(WP_REST_Request $request) {
        $order = self::make_order(self::body($request), true);
        if (is_wp_error($order)) return $order;
        return new WP_REST_Response(self::order_response($order), 201);
    }

    private static function order_response(WC_Order $order): array {
        $line_items = [];
        foreach ($order->get_items() as $item) {
            $product = $item->get_product();
            $line_items[] = [
                'product_id' => $product ? $product->get_id() : 0,
                'name' => $item->get_name(),
                'quantity' => $item->get_quantity(),
                'price' => (float) $order->get_item_total($item, false, true),
                'image' => $product ? wp_get_attachment_image_url($product->get_image_id(), 'thumbnail') : '',
                'meta_data' => array_map(static function ($meta) {
                    return ['key' => $meta->key, 'value' => $meta->value];
                }, $item->get_meta_data()),
            ];
        }

        return [
            'id' => $order->get_id(),
            'number' => $order->get_order_number(),
            'status' => $order->get_status(),
            'total' => $order->get_total(),
            'total_tax' => $order->get_total_tax(),
            'shipping_total' => $order->get_shipping_total(),
            'date_created' => $order->get_date_created() ? $order->get_date_created()->date('c') : '',
            'date_modified' => $order->get_date_modified() ? $order->get_date_modified()->date('c') : '',
            'line_items' => $line_items,
            'currency' => $order->get_currency(),
            'payment_url' => $order->get_checkout_payment_url(),
        ];
    }

    public static function orders() {
        $user = self::user_from_token();
        $orders = self::orders_for_user($user);
        return array_map([__CLASS__, 'order_response'], $orders);
    }

    public static function order(WP_REST_Request $request) {
        $user = self::user_from_token();
        $order = wc_get_order(absint($request['id']));
        if (!$order || !self::order_belongs_to_user($order, $user)) return self::error('Order not found.', 404);
        return self::order_response($order);
    }

    private static function orders_for_user(WP_User $user): array {
        $orders = wc_get_orders(['customer_id' => $user->ID, 'limit' => 50, 'orderby' => 'date', 'order' => 'DESC']);
        $email_orders = wc_get_orders(['billing_email' => $user->user_email, 'limit' => 50, 'orderby' => 'date', 'order' => 'DESC']);
        $orders_by_id = [];
        foreach (array_merge($orders, $email_orders) as $order) {
            $orders_by_id[$order->get_id()] = $order;
        }
        usort($orders_by_id, static fn(WC_Order $left, WC_Order $right): int => $right->get_date_created()->getTimestamp() <=> $left->get_date_created()->getTimestamp());
        return array_slice($orders_by_id, 0, 50);
    }

    private static function order_belongs_to_user(WC_Order $order, WP_User $user): bool {
        return (int) $order->get_customer_id() === (int) $user->ID
            || strtolower((string) $order->get_billing_email()) === strtolower((string) $user->user_email);
    }

    public static function get_address() {
        $user = self::user_from_token();
        $customer = new WC_Customer($user->ID);
        return ['billing' => $customer->get_billing(), 'shipping' => $customer->get_shipping()];
    }

    public static function save_address(WP_REST_Request $request) {
        $user = self::user_from_token();
        $body = self::body($request);
        $customer = new WC_Customer($user->ID);
        if (isset($body['billing'])) $customer->set_billing(self::address((array) $body['billing']));
        if (isset($body['shipping'])) $customer->set_shipping(self::address((array) $body['shipping']));
        $customer->save();
        return self::get_address();
    }

    public static function render_admin_order_details($order): void {
        if (!$order instanceof WC_Order || $order->get_meta('_zyra_headless_source') !== 'react') return;

        echo '<div class="zyra-headless-order-details" style="margin-top:16px;padding:12px;border:1px solid #dcdcde;background:#f6f7f7;">';
        echo '<h3 style="margin:0 0 8px;">Zyra Luxe React order</h3>';
        echo '<p style="margin:0 0 8px;">This order was created through the headless React storefront.</p>';

        if ($order->get_meta('_zyra_booking') === 'yes') {
            echo '<strong>Booking details</strong><ul style="margin:6px 0 0 18px;">';
            foreach (['service' => 'Service', 'date' => 'Date', 'time' => 'Time', 'timezone' => 'Timezone', 'notes' => 'Notes'] as $key => $label) {
                $value = $order->get_meta('_zyra_booking_' . $key);
                if ($value !== '') echo '<li><strong>' . esc_html($label) . ':</strong> ' . esc_html($value) . '</li>';
            }
            echo '</ul>';
        }
        echo '</div>';
    }
}

Zyra_Luxe_Headless_API::boot();
