-- Run this first after connecting VS Code to PostgreSQL.
-- Goal: confirm that the query editor is connected to the right database.

SELECT
    current_database() AS database_name,
    current_user AS user_name,
    inet_server_addr() AS server_address,
    inet_server_port() AS server_port;

SHOW search_path;

SELECT schema_name
FROM information_schema.schemata
WHERE schema_name = 'olist';
