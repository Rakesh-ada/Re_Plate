-- Seed data for RePlate Campus

-- Insert sample canteens
INSERT INTO canteens (id, name, location, contact_email, contact_phone, operating_hours) VALUES
(uuid_generate_v4(), 'Main Campus Cafeteria', 'Building A, Ground Floor', 'main.cafeteria@college.edu', '+1-555-0101', '{"monday": "7:00-22:00", "tuesday": "7:00-22:00", "wednesday": "7:00-22:00", "thursday": "7:00-22:00", "friday": "7:00-22:00", "saturday": "8:00-20:00", "sunday": "8:00-20:00"}'),
(uuid_generate_v4(), 'Engineering Block Canteen', 'Engineering Building, 2nd Floor', 'eng.canteen@college.edu', '+1-555-0102', '{"monday": "8:00-18:00", "tuesday": "8:00-18:00", "wednesday": "8:00-18:00", "thursday": "8:00-18:00", "friday": "8:00-18:00", "saturday": "9:00-17:00", "sunday": "closed"}'),
(uuid_generate_v4(), 'Library Cafe', 'Central Library, 1st Floor', 'library.cafe@college.edu', '+1-555-0103', '{"monday": "9:00-21:00", "tuesday": "9:00-21:00", "wednesday": "9:00-21:00", "thursday": "9:00-21:00", "friday": "9:00-21:00", "saturday": "10:00-18:00", "sunday": "10:00-18:00"}'),
(uuid_generate_v4(), 'Sports Complex Snack Bar', 'Sports Complex, Main Entrance', 'sports.snacks@college.edu', '+1-555-0104', '{"monday": "6:00-22:00", "tuesday": "6:00-22:00", "wednesday": "6:00-22:00", "thursday": "6:00-22:00", "friday": "6:00-22:00", "saturday": "6:00-22:00", "sunday": "6:00-22:00"}');

-- Insert sample NGOs
INSERT INTO ngos (id, name, contact_person, email, phone, address, capacity_per_day) VALUES
(uuid_generate_v4(), 'City Food Bank', 'Sarah Johnson', 'sarah@cityfoodbank.org', '+1-555-0201', '123 Charity Street, Downtown', 500),
(uuid_generate_v4(), 'Helping Hands Foundation', 'Michael Chen', 'michael@helpinghands.org', '+1-555-0202', '456 Community Ave, Midtown', 300),
(uuid_generate_v4(), 'Campus Care Network', 'Emily Rodriguez', 'emily@campuscare.org', '+1-555-0203', '789 University Blvd, Campus Area', 200),
(uuid_generate_v4(), 'Local Shelter Alliance', 'David Kim', 'david@shelteralliance.org', '+1-555-0204', '321 Hope Lane, Eastside', 400);

-- Insert sample food categories and items (these will be created by staff in real usage)
-- This is just for demonstration purposes

-- Create some sample analytics data for the past week
INSERT INTO analytics (date, canteen_id, total_food_logged, total_food_sold, total_food_donated, total_food_wasted, revenue_generated, co2_saved, meals_provided)
SELECT 
    CURRENT_DATE - INTERVAL '7 days' + (i || ' days')::INTERVAL,
    c.id,
    FLOOR(RANDOM() * 50) + 20,
    FLOOR(RANDOM() * 30) + 10,
    FLOOR(RANDOM() * 15) + 5,
    FLOOR(RANDOM() * 5) + 1,
    ROUND((RANDOM() * 500 + 100)::NUMERIC, 2),
    ROUND((RANDOM() * 50 + 10)::NUMERIC, 2),
    FLOOR(RANDOM() * 100) + 20
FROM generate_series(0, 6) AS i
CROSS JOIN (SELECT id FROM canteens LIMIT 2) AS c;
