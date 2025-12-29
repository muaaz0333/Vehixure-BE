-- Migration: Create warranty tables
-- Description: Creates warranty_terms and warranties tables for the warranty management system
-- Version: Final
-- Date: December 2024

-- Create warranty_terms table
CREATE TABLE IF NOT EXISTS warranty_terms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    warranty_name VARCHAR(255) NOT NULL,
    description TEXT,
    revision VARCHAR(100) NOT NULL,
    generator_light_colour VARCHAR(100),
    terms_and_conditions TEXT,
    add_type VARCHAR(20) NOT NULL CHECK (add_type IN ('ADD_WARRANTY', 'REPLACE_WARRANTY')),
    warranty_to_replace_id UUID,
    inspection_instructions TEXT,
    is_active BOOLEAN DEFAULT true,
    is_deleted BOOLEAN DEFAULT false,
    created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    
    -- Foreign key constraint for self-reference
    CONSTRAINT fk_warranty_terms_replace FOREIGN KEY (warranty_to_replace_id) REFERENCES warranty_terms(id)
);

-- Create warranties table
CREATE TABLE IF NOT EXISTS warranties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ref_stock_id VARCHAR(100),
    agent_id UUID NOT NULL,
    warranty_terms_id UUID NOT NULL,
    
    -- Vehicle Owner Details
    company_name VARCHAR(255),
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(50) NOT NULL,
    email VARCHAR(255) NOT NULL,
    
    -- Vehicle Details
    make VARCHAR(255) NOT NULL,
    model VARCHAR(255) NOT NULL,
    registration_number VARCHAR(100),
    build_date DATE NOT NULL,
    vin_number VARCHAR(255) NOT NULL,
    
    -- Installation Details
    installers_name VARCHAR(255) NOT NULL,
    date_installed DATE NOT NULL,
    generator_serial_number VARCHAR(255) NOT NULL,
    number_of_couplers_installed INTEGER,
    voltage_in_coupler_supply_line DECIMAL(10,2),
    position_of_couplers TEXT,
    
    -- Corrosion Details
    corrosion_found BOOLEAN DEFAULT false,
    corrosion_details TEXT,
    
    -- Confirmation
    installation_confirmed BOOLEAN DEFAULT false,
    
    -- Status
    status VARCHAR(20) DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'ACTIVE', 'EXPIRED', 'CANCELLED')),
    is_deleted BOOLEAN DEFAULT false,
    
    created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    
    -- Foreign key constraints
    CONSTRAINT fk_warranties_agent FOREIGN KEY (agent_id) REFERENCES users(id),
    CONSTRAINT fk_warranties_warranty_terms FOREIGN KEY (warranty_terms_id) REFERENCES warranty_terms(id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_warranty_terms_active ON warranty_terms(is_active, is_deleted);
CREATE INDEX IF NOT EXISTS idx_warranty_terms_warranty_name ON warranty_terms(warranty_name);
CREATE INDEX IF NOT EXISTS idx_warranty_terms_add_type ON warranty_terms(add_type);
CREATE INDEX IF NOT EXISTS idx_warranty_terms_replace_id ON warranty_terms(warranty_to_replace_id);
CREATE INDEX IF NOT EXISTS idx_warranty_terms_revision ON warranty_terms(revision);

CREATE INDEX IF NOT EXISTS idx_warranties_agent_id ON warranties(agent_id);
CREATE INDEX IF NOT EXISTS idx_warranties_warranty_terms_id ON warranties(warranty_terms_id);
CREATE INDEX IF NOT EXISTS idx_warranties_status ON warranties(status, is_deleted);
CREATE INDEX IF NOT EXISTS idx_warranties_corrosion ON warranties(corrosion_found, is_deleted);
CREATE INDEX IF NOT EXISTS idx_warranties_email ON warranties(email);
CREATE INDEX IF NOT EXISTS idx_warranties_vin ON warranties(vin_number);
CREATE INDEX IF NOT EXISTS idx_warranties_ref_stock_id ON warranties(ref_stock_id);
CREATE INDEX IF NOT EXISTS idx_warranties_created ON warranties(created);
CREATE INDEX IF NOT EXISTS idx_warranties_deleted_at ON warranties(deleted_at);

-- Insert sample warranty terms matching the images provided
INSERT INTO warranty_terms (warranty_name, description, revision, generator_light_colour, terms_and_conditions, add_type, inspection_instructions, is_active) VALUES
('ECO-PRO - 10 Year Corrosion, 5 Year Product - Rev 8', 'Electronic Corrosion Protection System with 10 year corrosion and 5 year product warranty', 'Rev 8', 'Blue', 'Standard terms and conditions for ECO-PRO system with 10 year corrosion protection and 5 year product warranty coverage.', 'ADD_WARRANTY', 'Standard inspection procedures for ECO-PRO system. Check all connections, verify generator operation, and document coupler positions.', true),
('ECO-PRO - Limited Lifetime Corrosion, 5 Year Product - Rev 8', 'Electronic Corrosion Protection System with limited lifetime corrosion and 5 year product warranty', 'Rev 8', 'Green', 'Limited lifetime terms and conditions for ECO-PRO system with lifetime corrosion protection and 5 year product warranty coverage.', 'ADD_WARRANTY', 'Extended inspection procedures for lifetime warranty. Comprehensive system check including voltage measurements and corrosion assessment.', true),
('ERPS - 10 Year Corrosion, 10 Year Product - Rev 6', 'Electronic Rust Protection System with 10 year corrosion and 10 year product warranty', 'Rev 6', 'Red', 'Standard terms and conditions for ERPS system with 10 year corrosion and product warranty coverage.', 'ADD_WARRANTY', 'Standard inspection procedures for ERPS system. Verify system operation, check all electrical connections, and document installation details.', true)
ON CONFLICT DO NOTHING;

-- Create functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_warranty_terms_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.modified = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION update_warranties_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.modified = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_warranty_terms_modified 
    BEFORE UPDATE ON warranty_terms 
    FOR EACH ROW 
    EXECUTE FUNCTION update_warranty_terms_modified_column();

CREATE TRIGGER update_warranties_modified 
    BEFORE UPDATE ON warranties 
    FOR EACH ROW 
    EXECUTE FUNCTION update_warranties_modified_column();

-- Add table and column comments for documentation
COMMENT ON TABLE warranty_terms IS 'Warranty terms and conditions for different products with replacement functionality';
COMMENT ON TABLE warranties IS 'Individual warranty records created by admins for specific vehicles and installations';

-- Warranty Terms table comments
COMMENT ON COLUMN warranty_terms.warranty_name IS 'Name of the warranty (e.g., ECO-PRO - 10 Year Corrosion, 5 Year Product - Rev 8)';
COMMENT ON COLUMN warranty_terms.description IS 'Optional description of the warranty terms';
COMMENT ON COLUMN warranty_terms.revision IS 'Revision number of the warranty terms (e.g., Rev 8)';
COMMENT ON COLUMN warranty_terms.generator_light_colour IS 'Color of the generator light indicator (e.g., Blue, Green, Red)';
COMMENT ON COLUMN warranty_terms.terms_and_conditions IS 'Full terms and conditions text for the warranty';
COMMENT ON COLUMN warranty_terms.add_type IS 'Type of warranty addition - ADD_WARRANTY for new, REPLACE_WARRANTY for replacement';
COMMENT ON COLUMN warranty_terms.warranty_to_replace_id IS 'ID of warranty being replaced (if add_type is REPLACE_WARRANTY)';
COMMENT ON COLUMN warranty_terms.inspection_instructions IS 'Detailed instructions for warranty inspections and maintenance';
COMMENT ON COLUMN warranty_terms.is_active IS 'Whether the warranty terms are currently active and available for use';
COMMENT ON COLUMN warranty_terms.is_deleted IS 'Soft delete flag - true if warranty terms have been deleted';

-- Warranties table comments
COMMENT ON COLUMN warranties.ref_stock_id IS 'Reference or stock ID for the warranty record';
COMMENT ON COLUMN warranties.agent_id IS 'ID of the agent who created the warranty (foreign key to users table)';
COMMENT ON COLUMN warranties.warranty_terms_id IS 'ID of the warranty terms being used (foreign key to warranty_terms table)';
COMMENT ON COLUMN warranties.company_name IS 'Company name of the vehicle owner (optional)';
COMMENT ON COLUMN warranties.first_name IS 'First name of the vehicle owner';
COMMENT ON COLUMN warranties.last_name IS 'Last name of the vehicle owner';
COMMENT ON COLUMN warranties.phone_number IS 'Phone number of the vehicle owner';
COMMENT ON COLUMN warranties.email IS 'Email address of the vehicle owner (required for inspection notifications)';
COMMENT ON COLUMN warranties.make IS 'Vehicle manufacturer (e.g., Toyota, Ford)';
COMMENT ON COLUMN warranties.model IS 'Vehicle model (e.g., Camry, F-150)';
COMMENT ON COLUMN warranties.registration_number IS 'Vehicle registration/license plate number';
COMMENT ON COLUMN warranties.build_date IS 'Date when the vehicle was manufactured';
COMMENT ON COLUMN warranties.vin_number IS 'Vehicle Identification Number (VIN)';
COMMENT ON COLUMN warranties.installers_name IS 'Name of the person who installed the system';
COMMENT ON COLUMN warranties.date_installed IS 'Date when the system was installed';
COMMENT ON COLUMN warranties.generator_serial_number IS 'Serial number of the generator unit';
COMMENT ON COLUMN warranties.number_of_couplers_installed IS 'Number of couplers installed in the system';
COMMENT ON COLUMN warranties.voltage_in_coupler_supply_line IS 'Voltage measurement in the coupler supply line';
COMMENT ON COLUMN warranties.position_of_couplers IS 'Description of where the couplers are positioned on the vehicle';
COMMENT ON COLUMN warranties.corrosion_found IS 'Whether corrosion was found during inspection';
COMMENT ON COLUMN warranties.corrosion_details IS 'Detailed description of any corrosion found';
COMMENT ON COLUMN warranties.installation_confirmed IS 'Whether the installation was confirmed by the installer';
COMMENT ON COLUMN warranties.status IS 'Current status of the warranty (DRAFT, ACTIVE, EXPIRED, CANCELLED)';
COMMENT ON COLUMN warranties.is_deleted IS 'Soft delete flag - true if warranty has been deleted';

-- Create a view for active warranty terms (commonly used)
CREATE OR REPLACE VIEW active_warranty_terms AS
SELECT 
    id,
    warranty_name,
    description,
    revision,
    generator_light_colour,
    terms_and_conditions,
    add_type,
    warranty_to_replace_id,
    inspection_instructions,
    created,
    modified
FROM warranty_terms 
WHERE is_active = true AND is_deleted = false
ORDER BY warranty_name;

COMMENT ON VIEW active_warranty_terms IS 'View of all active warranty terms for easy querying';

-- Create a view for warranty summary (commonly used for reporting)
CREATE OR REPLACE VIEW warranty_summary AS
SELECT 
    w.id,
    w.ref_stock_id,
    w.first_name || ' ' || w.last_name AS customer_name,
    w.company_name,
    w.email,
    w.phone_number,
    w.make || ' ' || w.model AS vehicle,
    w.vin_number,
    w.status,
    w.corrosion_found,
    w.created,
    wt.warranty_name,
    wt.revision,
    u.full_name AS agent_name,
    u.business_name AS agent_business
FROM warranties w
LEFT JOIN warranty_terms wt ON w.warranty_terms_id = wt.id
LEFT JOIN users u ON w.agent_id = u.id
WHERE w.is_deleted = false
ORDER BY w.created DESC;

COMMENT ON VIEW warranty_summary IS 'Summary view of warranties with related warranty terms and agent information';

-- Grant permissions (adjust as needed for your environment)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON warranty_terms TO your_app_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON warranties TO your_app_user;
-- GRANT SELECT ON active_warranty_terms TO your_app_user;
-- GRANT SELECT ON warranty_summary TO your_app_user;

-- Final verification queries (uncomment to run after migration)
-- SELECT 'Warranty Terms Count: ' || COUNT(*) FROM warranty_terms;
-- SELECT 'Active Warranty Terms Count: ' || COUNT(*) FROM warranty_terms WHERE is_active = true AND is_deleted = false;
-- SELECT 'Warranties Count: ' || COUNT(*) FROM warranties;

PRINT 'Warranty tables migration completed successfully!';
PRINT 'Created tables: warranty_terms, warranties';
PRINT 'Created views: active_warranty_terms, warranty_summary';
PRINT 'Inserted sample warranty terms matching provided images';
PRINT 'All indexes, triggers, and constraints have been applied';