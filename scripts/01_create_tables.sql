-- RePlate Campus Database Schema
-- Food Waste Management System

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User roles enum
CREATE TYPE user_role AS ENUM ('staff', 'student', 'volunteer', 'admin');

-- Food item status enum
CREATE TYPE food_status AS ENUM ('available', 'flash_sale', 'donated', 'claimed', 'expired');

-- Donation status enum
CREATE TYPE donation_status AS ENUM ('pending', 'scheduled', 'picked_up', 'completed');

-- Users table (extends Supabase auth.users)
CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    role user_role NOT NULL DEFAULT 'student',
    phone TEXT,
    student_id TEXT,
    canteen_id UUID,
    ngo_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Canteens table
CREATE TABLE canteens (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    location TEXT NOT NULL,
    contact_email TEXT,
    contact_phone TEXT,
    operating_hours JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- NGOs table
CREATE TABLE ngos (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    contact_person TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    capacity_per_day INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Food items table
CREATE TABLE food_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    canteen_id UUID REFERENCES canteens(id) NOT NULL,
    staff_id UUID REFERENCES profiles(id) NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    original_price DECIMAL(10,2),
    discounted_price DECIMAL(10,2),
    expiry_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status food_status DEFAULT 'available',
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Flash sales table
CREATE TABLE flash_sales (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    food_item_id UUID REFERENCES food_items(id) NOT NULL,
    discount_percentage INTEGER NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    max_claims INTEGER,
    current_claims INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Donations table
CREATE TABLE donations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    food_item_id UUID REFERENCES food_items(id) NOT NULL,
    ngo_id UUID REFERENCES ngos(id) NOT NULL,
    volunteer_id UUID REFERENCES profiles(id),
    quantity INTEGER NOT NULL,
    pickup_time TIMESTAMP WITH TIME ZONE,
    status donation_status DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Claims/Transactions table
CREATE TABLE claims (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    food_item_id UUID REFERENCES food_items(id) NOT NULL,
    student_id UUID REFERENCES profiles(id) NOT NULL,
    quantity INTEGER NOT NULL,
    amount_paid DECIMAL(10,2),
    claim_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    pickup_time TIMESTAMP WITH TIME ZONE,
    is_picked_up BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Analytics tracking table
CREATE TABLE analytics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    date DATE NOT NULL,
    canteen_id UUID REFERENCES canteens(id),
    total_food_logged INTEGER DEFAULT 0,
    total_food_sold INTEGER DEFAULT 0,
    total_food_donated INTEGER DEFAULT 0,
    total_food_wasted INTEGER DEFAULT 0,
    revenue_generated DECIMAL(10,2) DEFAULT 0,
    co2_saved DECIMAL(10,2) DEFAULT 0,
    meals_provided INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(date, canteen_id)
);

-- Create indexes for better performance
CREATE INDEX idx_food_items_canteen ON food_items(canteen_id);
CREATE INDEX idx_food_items_status ON food_items(status);
CREATE INDEX idx_food_items_expiry ON food_items(expiry_time);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_claims_student ON claims(student_id);
CREATE INDEX idx_donations_ngo ON donations(ngo_id);
CREATE INDEX idx_analytics_date ON analytics(date);

-- Row Level Security (RLS) policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE canteens ENABLE ROW LEVEL SECURITY;
ALTER TABLE ngos ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE flash_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Food items policies
CREATE POLICY "Anyone can view available food items" ON food_items
    FOR SELECT USING (status IN ('available', 'flash_sale'));

CREATE POLICY "Staff can manage food items in their canteen" ON food_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'staff' 
            AND profiles.canteen_id = food_items.canteen_id
        )
    );

-- Claims policies
CREATE POLICY "Students can view their own claims" ON claims
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'student'
        ) AND student_id = auth.uid()
    );

CREATE POLICY "Students can create claims" ON claims
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'student'
        ) AND student_id = auth.uid()
    );

-- Donations policies
CREATE POLICY "Volunteers can view donations for their NGO" ON donations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'volunteer' 
            AND profiles.ngo_id = donations.ngo_id
        )
    );

-- Admin policies (can access everything)
CREATE POLICY "Admins can access all data" ON profiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Create functions for automatic updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_canteens_updated_at BEFORE UPDATE ON canteens
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ngos_updated_at BEFORE UPDATE ON ngos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_food_items_updated_at BEFORE UPDATE ON food_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_donations_updated_at BEFORE UPDATE ON donations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
