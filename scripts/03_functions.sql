-- Utility functions for RePlate Campus

-- Function to automatically update food item status based on expiry
CREATE OR REPLACE FUNCTION update_expired_food_items()
RETURNS void AS $$
BEGIN
    UPDATE food_items 
    SET status = 'expired'
    WHERE expiry_time < NOW() 
    AND status IN ('available', 'flash_sale');
END;
$$ LANGUAGE plpgsql;

-- Function to calculate CO2 savings (approximate)
CREATE OR REPLACE FUNCTION calculate_co2_savings(food_weight_kg DECIMAL)
RETURNS DECIMAL AS $$
BEGIN
    -- Approximate CO2 savings: 2.5 kg CO2 per kg of food waste prevented
    RETURN food_weight_kg * 2.5;
END;
$$ LANGUAGE plpgsql;

-- Function to get real-time dashboard stats
CREATE OR REPLACE FUNCTION get_dashboard_stats(canteen_uuid UUID DEFAULT NULL)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_items_today', (
            SELECT COUNT(*) FROM food_items 
            WHERE DATE(created_at) = CURRENT_DATE
            AND (canteen_uuid IS NULL OR canteen_id = canteen_uuid)
        ),
        'active_flash_sales', (
            SELECT COUNT(*) FROM flash_sales fs
            JOIN food_items fi ON fs.food_item_id = fi.id
            WHERE fs.is_active = true 
            AND fs.end_time > NOW()
            AND (canteen_uuid IS NULL OR fi.canteen_id = canteen_uuid)
        ),
        'pending_donations', (
            SELECT COUNT(*) FROM donations d
            JOIN food_items fi ON d.food_item_id = fi.id
            WHERE d.status = 'pending'
            AND (canteen_uuid IS NULL OR fi.canteen_id = canteen_uuid)
        ),
        'revenue_today', (
            SELECT COALESCE(SUM(amount_paid), 0) FROM claims c
            JOIN food_items fi ON c.food_item_id = fi.id
            WHERE DATE(c.created_at) = CURRENT_DATE
            AND (canteen_uuid IS NULL OR fi.canteen_id = canteen_uuid)
        ),
        'co2_saved_today', (
            SELECT COALESCE(SUM(calculate_co2_savings(quantity * 0.5)), 0) 
            FROM claims c
            JOIN food_items fi ON c.food_item_id = fi.id
            WHERE DATE(c.created_at) = CURRENT_DATE
            AND (canteen_uuid IS NULL OR fi.canteen_id = canteen_uuid)
        )
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to create flash sale
CREATE OR REPLACE FUNCTION create_flash_sale(
    item_id UUID,
    discount_percent INTEGER,
    duration_minutes INTEGER DEFAULT 60,
    max_claims_limit INTEGER DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    sale_id UUID;
BEGIN
    -- Update food item status
    UPDATE food_items 
    SET status = 'flash_sale', 
        discounted_price = original_price * (100 - discount_percent) / 100
    WHERE id = item_id;
    
    -- Create flash sale record
    INSERT INTO flash_sales (food_item_id, discount_percentage, end_time, max_claims)
    VALUES (
        item_id, 
        discount_percent, 
        NOW() + (duration_minutes || ' minutes')::INTERVAL,
        max_claims_limit
    )
    RETURNING id INTO sale_id;
    
    RETURN sale_id;
END;
$$ LANGUAGE plpgsql;

-- Function to claim food item
CREATE OR REPLACE FUNCTION claim_food_item(
    item_id UUID,
    student_uuid UUID,
    claim_quantity INTEGER
)
RETURNS UUID AS $$
DECLARE
    claim_id UUID;
    item_price DECIMAL;
    available_qty INTEGER;
BEGIN
    -- Check availability
    SELECT quantity, COALESCE(discounted_price, original_price)
    INTO available_qty, item_price
    FROM food_items 
    WHERE id = item_id AND status IN ('available', 'flash_sale');
    
    IF available_qty < claim_quantity THEN
        RAISE EXCEPTION 'Insufficient quantity available';
    END IF;
    
    -- Create claim
    INSERT INTO claims (food_item_id, student_id, quantity, amount_paid)
    VALUES (item_id, student_uuid, claim_quantity, item_price * claim_quantity)
    RETURNING id INTO claim_id;
    
    -- Update food item quantity
    UPDATE food_items 
    SET quantity = quantity - claim_quantity
    WHERE id = item_id;
    
    -- Update flash sale claims if applicable
    UPDATE flash_sales 
    SET current_claims = current_claims + claim_quantity
    WHERE food_item_id = item_id AND is_active = true;
    
    -- Mark as claimed if quantity reaches zero
    UPDATE food_items 
    SET status = 'claimed'
    WHERE id = item_id AND quantity = 0;
    
    RETURN claim_id;
END;
$$ LANGUAGE plpgsql;
