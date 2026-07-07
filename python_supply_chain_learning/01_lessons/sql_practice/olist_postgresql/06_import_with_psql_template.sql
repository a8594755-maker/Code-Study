-- Import Olist CSV files with psql.
-- Run this from the repo root after connecting to Supabase with psql.
--
-- Required local folder:
-- 03_data/raw/olist/
--
-- This file uses psql's client-side \copy command. It reads CSV files from
-- your Mac and inserts rows into Supabase tables.
--
-- Keep each \copy command on one line. psql meta-commands are line-based.

\copy olist.customers_raw (customer_id, customer_unique_id, customer_zip_code_prefix, customer_city, customer_state) FROM '03_data/raw/olist/olist_customers_dataset.csv' WITH (FORMAT csv, HEADER true, NULL '', QUOTE '"', ESCAPE '"');

\copy olist.geolocation_raw (geolocation_zip_code_prefix, geolocation_lat, geolocation_lng, geolocation_city, geolocation_state) FROM '03_data/raw/olist/olist_geolocation_dataset.csv' WITH (FORMAT csv, HEADER true, NULL '', QUOTE '"', ESCAPE '"');

\copy olist.order_items_raw (order_id, order_item_id, product_id, seller_id, shipping_limit_date, price, freight_value) FROM '03_data/raw/olist/olist_order_items_dataset.csv' WITH (FORMAT csv, HEADER true, NULL '', QUOTE '"', ESCAPE '"');

\copy olist.order_payments_raw (order_id, payment_sequential, payment_type, payment_installments, payment_value) FROM '03_data/raw/olist/olist_order_payments_dataset.csv' WITH (FORMAT csv, HEADER true, NULL '', QUOTE '"', ESCAPE '"');

\copy olist.order_reviews_raw (review_id, order_id, review_score, review_comment_title, review_comment_message, review_creation_date, review_answer_timestamp) FROM '03_data/raw/olist/olist_order_reviews_dataset.csv' WITH (FORMAT csv, HEADER true, NULL '', QUOTE '"', ESCAPE '"');

\copy olist.orders_raw (order_id, customer_id, order_status, order_purchase_timestamp, order_approved_at, order_delivered_carrier_date, order_delivered_customer_date, order_estimated_delivery_date) FROM '03_data/raw/olist/olist_orders_dataset.csv' WITH (FORMAT csv, HEADER true, NULL '', QUOTE '"', ESCAPE '"');

\copy olist.products_raw (product_id, product_category_name, product_name_lenght, product_description_lenght, product_photos_qty, product_weight_g, product_length_cm, product_height_cm, product_width_cm) FROM '03_data/raw/olist/olist_products_dataset.csv' WITH (FORMAT csv, HEADER true, NULL '', QUOTE '"', ESCAPE '"');

\copy olist.sellers_raw (seller_id, seller_zip_code_prefix, seller_city, seller_state) FROM '03_data/raw/olist/olist_sellers_dataset.csv' WITH (FORMAT csv, HEADER true, NULL '', QUOTE '"', ESCAPE '"');

\copy olist.product_category_translation_raw (product_category_name, product_category_name_english) FROM '03_data/raw/olist/product_category_name_translation.csv' WITH (FORMAT csv, HEADER true, NULL '', QUOTE '"', ESCAPE '"');
