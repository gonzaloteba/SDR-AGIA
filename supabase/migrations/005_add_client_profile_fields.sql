-- Add profile fields from onboarding data
ALTER TABLE clients ADD COLUMN IF NOT EXISTS birth_date DATE;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS height_cm INTEGER;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS initial_weight_kg DECIMAL;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS initial_body_fat_pct DECIMAL;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS training_level TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS motivation TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS medical_notes TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS goals TEXT;

-- Seed profile data from Onboarding Antiguo (matched by first_name + last_name)

UPDATE clients SET birth_date='1991-10-08', height_cm=185, initial_weight_kg=105, initial_body_fat_pct=34,
  location='Ciudad de México, México', training_level='Inicio', motivation='Rendimiento, Estética, Salud y Longevidad',
  medical_notes=NULL, goals=NULL
WHERE first_name='Abdi' AND last_name='Campos';

UPDATE clients SET birth_date='1999-06-17', height_cm=186, initial_weight_kg=100, initial_body_fat_pct=25,
  location='Canarias, España', training_level='Avanzado', motivation='Estética, Rendimiento, Salud y Longevidad',
  medical_notes='Lesión psoas iliaco, dolor lumbar derecho, falta de movilidad cadera, tendinitis rodilla izquierda',
  goals='Volver a jugar baloncesto sin dolor'
WHERE first_name='Alejandro' AND last_name='Ramones Iacoviello';

UPDATE clients SET birth_date='1999-10-19', height_cm=181, initial_weight_kg=97, initial_body_fat_pct=30,
  location='Ciudad de México, México', training_level='Inicio', motivation='Estética, Rendimiento, Salud y Longevidad',
  medical_notes='Colesterol alto', goals=NULL
WHERE first_name='André' AND last_name='Bilse';

UPDATE clients SET birth_date='1987-06-04', height_cm=177, initial_weight_kg=85, initial_body_fat_pct=22,
  location='Bogotá, Colombia', training_level='Inicio', motivation='Estética, Rendimiento, Salud y Longevidad',
  medical_notes='Laminectomia L4-L5, Hígado Graso', goals=NULL
WHERE first_name='Christian' AND last_name='Lopez';

UPDATE clients SET birth_date='1990-01-20', height_cm=185, initial_weight_kg=83, initial_body_fat_pct=24,
  location='Madrid, España', training_level='Avanzado', motivation='Estética, Salud y Longevidad, Rendimiento',
  medical_notes=NULL, goals=NULL
WHERE first_name='Christian' AND last_name='Garcia';

UPDATE clients SET birth_date='1998-07-23', height_cm=171, initial_weight_kg=59, initial_body_fat_pct=11,
  location='Ciudad de México, México', training_level='Inicio', motivation='Estética, Rendimiento',
  medical_notes=NULL, goals='Quiero tener disciplina, me desanimo rápido'
WHERE first_name='Cristian' AND last_name='Pacheco';

UPDATE clients SET birth_date='1993-07-09', height_cm=180, initial_weight_kg=78, initial_body_fat_pct=15,
  location='Madrid, España', training_level='Avanzado', motivation='Rendimiento, Estética, Salud y Longevidad',
  medical_notes=NULL, goals='Más flexibilidad caderas y escápulas'
WHERE first_name='Davide' AND last_name='Fedrizzi';

UPDATE clients SET birth_date='1983-02-01', height_cm=179, initial_weight_kg=97, initial_body_fat_pct=22,
  location='Madrid, España', training_level='Avanzado', motivation='Estética, Rendimiento, Salud y Longevidad',
  medical_notes='Riñones, rodillas', goals='Dieta sencilla de preparar sin repercusión en riñones'
WHERE first_name='Eduardo' AND last_name='Medina';

UPDATE clients SET birth_date='1995-02-23', height_cm=183, initial_weight_kg=83, initial_body_fat_pct=20,
  location='Ciudad de México, México', training_level='Avanzado', motivation='Estética, Rendimiento, Salud y Longevidad',
  medical_notes=NULL, goals='Maratón, Medio Maratón y Ultra Maratón'
WHERE first_name='Elvis' AND last_name='Rodriguez';

UPDATE clients SET birth_date='1983-01-06', height_cm=185, initial_weight_kg=101, initial_body_fat_pct=18,
  location='Ciudad de México, México', training_level='Avanzado', motivation='Salud y Longevidad',
  medical_notes='Resistencia a la insulina', goals=NULL
WHERE first_name='Ernesto' AND last_name='Castañeda';

UPDATE clients SET birth_date='1990-05-20', height_cm=180, initial_weight_kg=82, initial_body_fat_pct=24,
  location='Ciudad de México, México', training_level='Atleta', motivation='Rendimiento',
  medical_notes=NULL, goals='Ironman 70.3 Monterrey'
WHERE first_name='Hector' AND last_name='Flores Lara';

UPDATE clients SET birth_date='1987-09-30', height_cm=179, initial_weight_kg=62, initial_body_fat_pct=11,
  location='Ciudad de México, México', training_level='Inicio', motivation='Estética, Rendimiento',
  medical_notes=NULL, goals=NULL
WHERE first_name='Hermes Octavio' AND last_name='Contla Gutiérrez';

UPDATE clients SET birth_date='1984-03-28', height_cm=163, initial_weight_kg=85, initial_body_fat_pct=33,
  location='Ciudad de México, México', training_level='Inicio', motivation='Salud y Longevidad, Estética',
  medical_notes='Colesterol y triglicéridos altos', goals=NULL
WHERE first_name='Israel' AND last_name='Villa';

UPDATE clients SET birth_date='1998-09-12', height_cm=168, initial_weight_kg=76, initial_body_fat_pct=20,
  location='Ciudad de México, México', training_level='Avanzado', motivation='Salud y Longevidad, Rendimiento',
  medical_notes=NULL, goals='Cambiar estilo de vida a través de nuevos hábitos. Mejorar salud mental y física.'
WHERE first_name='Jesús' AND last_name='Demuner';

UPDATE clients SET birth_date='2001-01-27', height_cm=178, initial_weight_kg=76, initial_body_fat_pct=12,
  location='Ciudad de México, México', training_level='Avanzado', motivation='Salud y Longevidad, Estética, Rendimiento',
  medical_notes=NULL, goals='Subir músculo considerablemente, verse atlético con mucho músculo'
WHERE first_name='Elías' AND last_name='Fernandez';

UPDATE clients SET birth_date='1999-02-24', height_cm=181, initial_weight_kg=78, initial_body_fat_pct=15,
  location='Los Cabos, México', training_level='Atleta', motivation='Salud y Longevidad',
  medical_notes=NULL, goals='Maratón Internacional de Culiacán, Rock n Roll San Diego. Mejorar técnicas de running.'
WHERE first_name='Kelvin' AND last_name='Iribe';

UPDATE clients SET birth_date='2006-07-15', height_cm=178, initial_weight_kg=90, initial_body_fat_pct=16,
  location='Ciudad de México, México', training_level='Avanzado', motivation='Salud y Longevidad',
  medical_notes=NULL, goals=NULL
WHERE first_name='Leonel Alejandro' AND last_name='Vizcaino';

UPDATE clients SET birth_date='1995-02-13', height_cm=170, initial_weight_kg=70, initial_body_fat_pct=15,
  location='Madrid, España', training_level='Avanzado', motivation='Estética',
  medical_notes=NULL, goals='Media Maratón Madrid'
WHERE first_name='Mauro' AND last_name='Gonzalez';

UPDATE clients SET birth_date='2004-05-25', height_cm=155, initial_weight_kg=80, initial_body_fat_pct=20,
  location='Santo Domingo, Rep. Dominicana', training_level='Avanzado', motivation='Salud y Longevidad',
  medical_notes=NULL, goals=NULL
WHERE first_name='Miguel' AND last_name='Lendoff';

UPDATE clients SET birth_date='1995-06-26', height_cm=177, initial_weight_kg=74, initial_body_fat_pct=20,
  location='Madrid, España', training_level='Avanzado', motivation=NULL,
  medical_notes=NULL, goals=NULL
WHERE first_name='Nacho' AND last_name='Porcar';

UPDATE clients SET birth_date='1999-11-06', height_cm=173, initial_weight_kg=64, initial_body_fat_pct=12,
  location='Madrid, España', training_level='Avanzado', motivation='Estética, Rendimiento, Salud y Longevidad',
  medical_notes=NULL, goals='Running 50km semanales y pádel 3 días'
WHERE first_name='Pablo' AND last_name='Lozano';

UPDATE clients SET birth_date='1995-07-18', height_cm=170, initial_weight_kg=60, initial_body_fat_pct=20,
  location='Ciudad de México, México', training_level='Inicio', motivation=NULL,
  medical_notes=NULL, goals='Mayor productividad, mejor descanso, más vitalidad y energía'
WHERE first_name='Pablo' AND last_name='Aviles';

UPDATE clients SET birth_date='1995-02-01', height_cm=162, initial_weight_kg=75, initial_body_fat_pct=26,
  location='Ciudad de México, México', training_level='Inicio', motivation=NULL,
  medical_notes=NULL, goals='Convertirme en atleta híbrido'
WHERE first_name='Rafael' AND last_name='Pineda';

UPDATE clients SET birth_date='1989-09-12', height_cm=176, initial_weight_kg=80, initial_body_fat_pct=30,
  location='Ciudad de México, México', training_level='Inicio', motivation='Salud y Longevidad',
  medical_notes='Hernia discal y discos deshidratados', goals=NULL
WHERE first_name='Santiago' AND last_name='Arce';

UPDATE clients SET birth_date='2003-04-25', height_cm=170, initial_weight_kg=64, initial_body_fat_pct=19,
  location='Madrid, España', training_level='Atleta', motivation=NULL,
  medical_notes=NULL, goals=NULL
WHERE first_name='Guillem' AND last_name='Ribas';

UPDATE clients SET birth_date='1983-07-25', height_cm=175, initial_weight_kg=90, initial_body_fat_pct=19,
  location='Santo Domingo, Rep. Dominicana', training_level='Avanzado', motivation=NULL,
  medical_notes='Rinitis alérgica estacional', goals=NULL
WHERE first_name='Elvis' AND last_name='Florentino';

-- Clients without onboarding data - set location from timezone
UPDATE clients SET location='Ciudad de México, México'
WHERE location IS NULL AND timezone='America/Mexico_City';

UPDATE clients SET location='Madrid, España'
WHERE location IS NULL AND timezone='Europe/Madrid';

UPDATE clients SET location='Canarias, España'
WHERE location IS NULL AND timezone='Atlantic/Canary';

UPDATE clients SET location='Bogotá, Colombia'
WHERE location IS NULL AND timezone='America/Bogota';

UPDATE clients SET location='Santo Domingo, Rep. Dominicana'
WHERE location IS NULL AND timezone='America/Santo_Domingo';

UPDATE clients SET location='Los Cabos, México'
WHERE location IS NULL AND timezone='America/Mazatlan';

UPDATE clients SET location='Cancún, México'
WHERE location IS NULL AND timezone='America/Cancun';
