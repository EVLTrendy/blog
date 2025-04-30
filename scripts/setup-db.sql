-- Function to drop table if it exists
CREATE OR REPLACE FUNCTION drop_table_if_exists(table_name text)
RETURNS void AS $$
BEGIN
    EXECUTE format('DROP TABLE IF EXISTS %I CASCADE', table_name);
END;
$$ LANGUAGE plpgsql;

-- Function to create the short_urls table
CREATE OR REPLACE FUNCTION create_short_urls_table()
RETURNS void AS $$
BEGIN
    CREATE TABLE IF NOT EXISTS short_urls (
        id SERIAL PRIMARY KEY,
        short_url TEXT UNIQUE NOT NULL,
        title TEXT NOT NULL,
        slug TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
END;
$$ LANGUAGE plpgsql; 