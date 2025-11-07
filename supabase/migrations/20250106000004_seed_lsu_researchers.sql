-- Seed LSU AgCenter Researchers
-- Initial data for expert escalation system

INSERT INTO lsu_researchers (name, title, email, specialties, available, typical_response_time, bio) VALUES
('Dr. Sarah Martinez', 'Soybean Pathologist', 'smartinez@lsuagcenter.com', ARRAY['soybean_pathology', 'disease_diagnostics', 'soybean_diseases'], true, '4-8 hours', 'Specializes in soybean diseases including Asian Rust, Cercospora, and Frogeye Leaf Spot. 15 years of experience in Louisiana Delta conditions.'),
('Dr. James Chen', 'Rice Specialist', 'jchen@lsuagcenter.com', ARRAY['rice_specialist', 'rice_diseases', 'rice_blast', 'water_management'], true, '4-8 hours', 'Expert in rice production, disease management, and water systems. Lead researcher at LSU Rice Research Station.'),
('Dr. Maria Rodriguez', 'Soil Health Specialist', 'mrodriguez@lsuagcenter.com', ARRAY['soil_health', 'nutrient_management', 'fertilizer_recommendations'], true, '24 hours', 'Focuses on soil fertility, nutrient deficiencies, and sustainable soil management practices for Delta agriculture.'),
('Dr. Robert Thompson', 'Integrated Pest Management', 'rthompson@lsuagcenter.com', ARRAY['pest_management', 'insect_identification', 'pest_control'], true, '6-12 hours', 'Specializes in pest identification and IPM strategies for cotton, soybeans, and corn.'),
('Dr. Lisa Anderson', 'Crop Physiology', 'landerson@lsuagcenter.com', ARRAY['crop_physiology', 'stress_management', 'yield_optimization'], true, '24 hours', 'Expert in crop stress responses, yield optimization, and physiological disorders.'),
('Dr. Michael Brown', 'Extension Specialist', 'mbrown@lsuagcenter.com', ARRAY['general_agriculture', 'field_diagnostics', 'best_practices'], true, '8-24 hours', 'General agricultural extension specialist covering all crops and common issues in Louisiana Delta.')

ON CONFLICT DO NOTHING;

