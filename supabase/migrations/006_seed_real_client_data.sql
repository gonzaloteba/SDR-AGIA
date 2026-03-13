-- ============================================================
-- Migration 006: Seed real client data from CSV exports
-- Generated: 2026-03-13
-- Source: Base de Datos - Clientes Zalud (Google Sheets)
-- ============================================================

BEGIN;

-- ============================================================
-- PART 1: Add missing columns to clients and check_ins tables
-- ============================================================

ALTER TABLE clients ADD COLUMN IF NOT EXISTS birth_date date;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS height_cm numeric(5,1);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS initial_weight_kg numeric(5,1);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS initial_body_fat_pct numeric(4,1);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS motivation text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS diagnosis text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS diagnosis_detail text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS has_event boolean DEFAULT false;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS event_name text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS event_date date;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS training_days_per_week integer;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS sleep_hours_avg numeric(3,1);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS energy_level_initial integer;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS stress_level_initial integer;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS initial_photo_url text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS onboarding_notes text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS onboarding_submitted_at timestamptz;

ALTER TABLE check_ins ADD COLUMN IF NOT EXISTS phase integer;
ALTER TABLE check_ins ADD COLUMN IF NOT EXISTS protocol_adherence text;
ALTER TABLE check_ins ADD COLUMN IF NOT EXISTS daily_energy text;
ALTER TABLE check_ins ADD COLUMN IF NOT EXISTS cravings text;
ALTER TABLE check_ins ADD COLUMN IF NOT EXISTS digestion text;
ALTER TABLE check_ins ADD COLUMN IF NOT EXISTS difficulties text;
ALTER TABLE check_ins ADD COLUMN IF NOT EXISTS stress_level integer;
ALTER TABLE check_ins ADD COLUMN IF NOT EXISTS sleep_hours numeric(3,1);

-- ============================================================
-- PART 2: Update client profiles from Onboarding Antiguo
-- (includes phone, email, birth_date, height, weight, etc.)
-- ============================================================

-- Abdi Campos de Leon
UPDATE clients SET email = 'abdii.campos@gmail.com', phone = '+524492126117', birth_date = '1991-10-08', height_cm = 185, initial_weight_kg = 105, initial_body_fat_pct = 34, motivation = '*Rendimiento* — Energía y enfoque, *Estética* — Verme fuerte y definido, *Salud y Longevidad *— Largo plazo', diagnosis = 'FALSE', has_event = true, energy_level_initial = 7, stress_level_initial = 10, initial_photo_url = 'https://api.typeform.com/responses/files/3aadcc1048079a1e21568b1edf9a0437eb4b12da6bc8a5182e8f8861be1cc634/IMG_0454_2.HEIC', updated_at = NOW() WHERE id = '45b5edbb-e29b-476c-89b0-7da7fbe02ea9';

-- Alejandro Ramones Iacoviello
UPDATE clients SET email = 'ramoalex17@gmail.com', phone = '+34609305580', birth_date = '1999-06-17', height_cm = 186, initial_weight_kg = 100, initial_body_fat_pct = 25, motivation = '*Estética* — Verme fuerte y definido, *Rendimiento* — Energía y enfoque, *Salud y Longevidad *— Largo plazo', diagnosis = 'TRUE', diagnosis_detail = 'Tengo una lesión en el psoas iliaco, dolor lumbar en la parte derecha baja, por falta de movilidad en la cadera y falta de musculatura y fuerza en la zona del core y gluteos y espalda baja, se me pone mal cuando entreno baloncesto o hago muchos saltos, pero no siempre me duele, aun con el dolor puedo entrenar aunque no al 100% , aparte de falta de dorsiflexion de los tobillos y una tendinitis en la rodilla izquierda pero con estas 2 ultimas no me molestan en los entrenamientos mucho', has_event = true, energy_level_initial = 6, stress_level_initial = 9, onboarding_notes = 'Me gustaría mucho volver a jugar baloncesto la temporada que viene sin dolor, ya que la temporada pasada cada vez que terminaba de jugar o entrenar tenía dolor por lo de la espalda, eso sería lo mejor, me gustan que me digan las cosas claras sin rodeos, acepto muy bien los feedbacks tanto positivos como negativos, vamos a darle 💪🏽', initial_photo_url = 'https://api.typeform.com/responses/files/ccc66823742a5736e71ddd49a7c202bc8e7ee39d76e4e18b750b2e48cbb4ab05/IMG_2855.jpeg', updated_at = NOW() WHERE id = '20680dd6-ee74-4f2f-840a-c3989f9fa7ba';

-- Andre Bilse Cisneros
UPDATE clients SET email = 'andrebilsecis@gmail.com', phone = '+525633926201', birth_date = '1999-10-19', height_cm = 181, initial_weight_kg = 97, initial_body_fat_pct = 30, motivation = '*Estética* — Verme fuerte y definido, *Rendimiento* — Energía y enfoque, *Salud y Longevidad *— Largo plazo', diagnosis = 'FALSE', has_event = true, energy_level_initial = 7, stress_level_initial = 6, onboarding_notes = 'Tengo colesterol alto no sé si afecte algo', onboarding_submitted_at = '2026-02-01 16:48:57+00', initial_photo_url = 'https://api.typeform.com/responses/files/ffc0c59f3df0144b6d611e637f117a23fa7cc0f5a88f70dd0c9bf06d6a932395/image.jpg', updated_at = NOW() WHERE id = '4af6e30f-3f5e-40bb-95c8-1474ba2f9d04';

-- Christian Lopez
UPDATE clients SET email = 'christian_cdb@hotmail.com', phone = '+573202466481', birth_date = '1987-06-04', height_cm = 177, initial_weight_kg = 85, initial_body_fat_pct = 22, motivation = '*Estética* — Verme fuerte y definido, *Rendimiento* — Energía y enfoque, *Salud y Longevidad *— Largo plazo', diagnosis = 'TRUE', diagnosis_detail = 'Laminectomia L4-L5, Higado Graso', has_event = true, energy_level_initial = 6, stress_level_initial = 5, onboarding_submitted_at = '2026-08-01 02:30:39+00', initial_photo_url = 'https://api.typeform.com/responses/files/9fdcf584116e28f5103054a85e8438c20dbeabf5a56f0980a2b5b2a3935994a6/Image_2026_01_07_at_9.28.44_PM.jpeg', updated_at = NOW() WHERE id = '3905ddc8-d477-40b6-9051-0cb83bf75db4';

-- Christian Garcia Rojas
UPDATE clients SET email = 'christian-alfonso@hotmail.com', phone = '+34664027459', birth_date = '1990-01-20', height_cm = 185, initial_weight_kg = 83, initial_body_fat_pct = 24, motivation = '*Estética* — Verme fuerte y definido, *Salud y Longevidad *— Largo plazo, *Rendimiento* — Energía y enfoque', diagnosis = 'FALSE', has_event = true, energy_level_initial = 2, stress_level_initial = 7, onboarding_submitted_at = '2026-03-02 16:36:06+00', initial_photo_url = 'https://api.typeform.com/responses/files/10eba2c72181d9277e01abc84977ba13f041e56d8dc0e0adc166a0f6e90ce1ea/WhatsApp_Image_2026_02_03_at_17.35.11.jpeg', updated_at = NOW() WHERE id = 'e72dd1bb-a9ba-4f54-9f7a-24df4cec12cb';

-- Cristian Pacheco
UPDATE clients SET email = 'cristianpachecom@hotmail.com', phone = '+15513423464', birth_date = '1998-07-23', height_cm = 171, initial_weight_kg = 59, initial_body_fat_pct = 11, motivation = '*Estética* — Verme fuerte y definido, *Rendimiento* — Energía y enfoque', diagnosis = 'FALSE', has_event = true, energy_level_initial = 5, stress_level_initial = 8, onboarding_notes = 'Quiero teee disciplina me desanimo rápido', initial_photo_url = 'https://api.typeform.com/responses/files/7e94be07c31d9656cb9b18468161688905801fb44fe5fd75cc1ef2558f41399a/IMG_0758.jpeg', updated_at = NOW() WHERE id = '18a8b4dd-fc1e-4b21-8bde-e3188b6db39a';

-- Davide Fedrizzi
UPDATE clients SET email = 'davide.fedrizzi@hotmail.it', phone = '+41762366522', birth_date = '1993-07-09', height_cm = 180, initial_weight_kg = 78, initial_body_fat_pct = 15, motivation = '*Rendimiento* — Energía y enfoque, *Estética* — Verme fuerte y definido, *Salud y Longevidad *— Largo plazo', diagnosis = 'FALSE', has_event = true, energy_level_initial = 7, stress_level_initial = 3, onboarding_notes = 'Más flexibilidad caderas y escápulas (shoulder blades)', onboarding_submitted_at = '2026-07-01 23:07:57+00', initial_photo_url = 'https://api.typeform.com/responses/files/ba52f05bcfd2c57ee0a174d629474790658d3b0273f7384f8996ca121d85000a/PXL_20260107_224833984.jpg', updated_at = NOW() WHERE id = 'd7c0b846-5aa5-48c6-b381-4a4db2998d60';

-- Eduardo Medina
UPDATE clients SET email = 'l4l01983@gmail.com', phone = '+352621835397', birth_date = '1983-02-01', height_cm = 179, initial_weight_kg = 97, initial_body_fat_pct = 22, motivation = '*Estética* — Verme fuerte y definido, *Rendimiento* — Energía y enfoque, *Salud y Longevidad *— Largo plazo', diagnosis = 'TRUE', diagnosis_detail = 'Riñones, rodillas', has_event = true, energy_level_initial = 6, stress_level_initial = 9, onboarding_notes = 'La dieta tiene que ser sencilla de preparar y que no tenga repercusión en los riñones. Respondí avanzado en entrenamiento porque he entrenado antes, pero llevo 4 meses sin hacer nada. Para considerar que no puedo empezar al 100.', onboarding_submitted_at = '2025-11-12 20:46:06+00', initial_photo_url = 'https://api.typeform.com/responses/files/2cb39a1d4a21e833eb2a4fb2b29081f6f6cef73fda948a7e61449d42fde38ed9/ECA.jpg', updated_at = NOW() WHERE id = '77199a71-93be-4fed-9240-fa667d9d1205';

-- Elvis Rodríguez
UPDATE clients SET email = 'rodriguezve1995@gmail.com', phone = '+525545453251', birth_date = '1995-02-23', height_cm = 183, initial_weight_kg = 83, initial_body_fat_pct = 20, motivation = '*Estética* — Verme fuerte y definido, *Rendimiento* — Energía y enfoque, *Salud y Longevidad *— Largo plazo', diagnosis = 'FALSE', has_event = true, event_name = 'Maraton, Medio Maraton y Ultra Maraton', event_date = '2026-12-12', energy_level_initial = 8, stress_level_initial = 5, onboarding_notes = 'Por el momento no', onboarding_submitted_at = '2026-10-01 15:59:57+00', initial_photo_url = 'https://api.typeform.com/responses/files/9e17c9f85a66ad140aa46b548da0f96b552c5bc4c049668dca5b98890fb2b2c9/IMG_0493.HEIC', updated_at = NOW() WHERE id = '8c367357-b05e-4fe6-84fa-9af33d80379e';

-- Ernesto Castañeda Baños
UPDATE clients SET email = 'efcastanedab@gmail.com', phone = '+525545220830', birth_date = '1983-01-06', height_cm = 185, initial_weight_kg = 101, initial_body_fat_pct = 18, motivation = '*Salud y Longevidad *— Largo plazo', diagnosis = 'TRUE', diagnosis_detail = 'resistencia a la insulina', has_event = true, energy_level_initial = 7, stress_level_initial = 8, onboarding_notes = '.', initial_photo_url = 'https://api.typeform.com/responses/files/07fbfbf4ec4b66baec453f0e4b4264445b14bc9124b896e241101ea64651e7c2/WhatsApp_Image_2025_11_30_at_9.43.06_AM.jpeg', updated_at = NOW() WHERE id = '3efd43bb-92be-48e4-9627-2821e5211779';

-- Héctor Emilio Flores Lara
UPDATE clients SET email = 'laraemilio@gmail.com', phone = '+524811000179', birth_date = '1990-05-20', height_cm = 180, initial_weight_kg = 82, initial_body_fat_pct = 24, motivation = '*Rendimiento* — Energía y enfoque', diagnosis = 'FALSE', has_event = true, event_name = 'Ironman 70.3 Mty', event_date = '2026-03-01', energy_level_initial = 7, stress_level_initial = 6, onboarding_submitted_at = '2025-08-12 18:38:57+00', initial_photo_url = 'https://api.typeform.com/responses/files/c769a4cc753c56baef97c29ae04ef568aad95a8be9d7c985d51c8b9ce8cc777b/Imagen_de_WhatsApp_2025_12_08_a_las_12.38.29_89927b0d.jpg', updated_at = NOW() WHERE id = 'd794d681-4f3f-44ea-b267-60ef791717c7';

-- Hermes Octavio Contla Gutiérrez
UPDATE clients SET email = 'hcontla@icloud.com', phone = '+527712902550', birth_date = '1987-09-30', height_cm = 179, initial_weight_kg = 62, initial_body_fat_pct = 11, motivation = '*Estética* — Verme fuerte y definido, *Rendimiento* — Energía y enfoque', diagnosis = 'FALSE', has_event = true, energy_level_initial = 5, stress_level_initial = 8, onboarding_submitted_at = '2026-04-01 00:34:32+00', initial_photo_url = 'https://api.typeform.com/responses/files/3f63cdc6faa9e6ed45fd09e005e76f712fbe3bca5c4627023d6be72fa1d3e218/image.jpg', updated_at = NOW() WHERE id = '7d485588-58fa-4197-91ae-32b4f6752823';

-- Israel Villa
UPDATE clients SET email = 'isravill28@gmail.com', phone = '+525585419350', birth_date = '1984-03-28', height_cm = 163, initial_weight_kg = 85, initial_body_fat_pct = 33, motivation = '*Salud y Longevidad *— Largo plazo, *Estética* — Verme fuerte y definido', diagnosis = 'FALSE', has_event = true, energy_level_initial = 5, stress_level_initial = 7, onboarding_notes = 'Tengo colesterol y triglicéridos altos', onboarding_submitted_at = '2026-08-01 03:12:57+00', initial_photo_url = 'https://api.typeform.com/responses/files/a3edb8ed6e9f4c61a294f115330fa4a41988bdd5818571f4e1da442fe65dbf15/IMG_4346.jpeg', updated_at = NOW() WHERE id = '81daa4b1-5a7d-4eff-ae23-543324a078bd';

-- Jesús Demuner Chain
UPDATE clients SET email = 'jdemuner98@hotmail.com', phone = '+522711230553', birth_date = '1998-09-12', height_cm = 168, initial_weight_kg = 76, initial_body_fat_pct = 20, motivation = '*Salud y Longevidad *— Largo plazo, *Rendimiento* — Energía y enfoque', diagnosis = 'FALSE', has_event = true, energy_level_initial = 4, stress_level_initial = 8, onboarding_notes = 'Lo que mas busco es cambiar mi estilo de vida y esto hacerlo a través de estos nuevos hábitos. De igual manera quiero mejorar mucho mi salud mental y física.', onboarding_submitted_at = '2026-04-01 23:49:53+00', initial_photo_url = 'https://api.typeform.com/responses/files/ee3f7c574551c12280f20f8cd8a4563440cf69571cb95fdbf9335dc29ba0bb8d/d2c644a5_708d_4cfd_81df_bd68c85909a0.JPG', updated_at = NOW() WHERE id = 'cf22c5ab-f225-4892-b535-481af02aa9c7';

-- José Elías Fernández
UPDATE clients SET email = 'jefq27@outlook.com', phone = '+525551061265', birth_date = '2001-01-27', height_cm = 178, initial_weight_kg = 76, initial_body_fat_pct = 12, motivation = '*Salud y Longevidad *— Largo plazo, *Estética* — Verme fuerte y definido, *Rendimiento* — Energía y enfoque', diagnosis = 'FALSE', has_event = true, energy_level_initial = 7, stress_level_initial = 7, onboarding_notes = 'Busco subir considerablemente el músculo, si verme atlético pero con mucho músculo, empezar a meterle bastante peso a las pesas', onboarding_submitted_at = '2026-09-01 13:48:06+00', initial_photo_url = 'https://api.typeform.com/responses/files/b32cf5a4c4a405c0662705f82eaf94194fab39932f7b08864f38ab6bbeb1b5eb/image.jpg', updated_at = NOW() WHERE id = '28a3072d-16c7-49aa-8468-4f998246882b';

-- Kelvin eduardo Iribe avendaño
UPDATE clients SET email = 'kelvin.iribe@hotmail.com', phone = '+526673050681', birth_date = '1999-02-24', height_cm = 181, initial_weight_kg = 78, initial_body_fat_pct = 15, motivation = '*Salud y Longevidad *— Largo plazo', diagnosis = 'FALSE', has_event = true, event_name = 'Maratón internacional de Culiacán y rock n roll sandiego', event_date = '2026-05-31', energy_level_initial = 8, stress_level_initial = 5, onboarding_notes = 'Aprender mejor las técnicas de running', initial_photo_url = 'https://api.typeform.com/responses/files/d7208f99e28cc21dc8f3df152109e06c2403cfcac4dc9eccc304271c359c296e/IMG_9265.jpeg', updated_at = NOW() WHERE id = 'b787eb98-9e6e-43ca-a975-6b00cf461d5b';

-- Leonel Alejandro Vizcaino
UPDATE clients SET email = 'lvizcainodelmar@gmail.com', phone = '+526642870521', birth_date = '2006-07-15', height_cm = 178, initial_weight_kg = 90, initial_body_fat_pct = 16, motivation = '*Salud y Longevidad *— Largo plazo', diagnosis = 'FALSE', has_event = true, energy_level_initial = 9, stress_level_initial = 5, onboarding_submitted_at = '2026-07-01 19:51:10+00', initial_photo_url = 'https://api.typeform.com/responses/files/07070c9665829024dd0a69a408806fca3b59ace6fbd9890f2efcd590b68b59de/image.jpg', updated_at = NOW() WHERE id = '37c7ce9e-1717-4418-a697-9d950590151f';

-- Mauro Gonzalez
UPDATE clients SET email = 'mauro.gf95@gmail.com', phone = '+525529001425', birth_date = '1995-02-13', height_cm = 170, initial_weight_kg = 70, initial_body_fat_pct = 15, motivation = '*Estética* — Verme fuerte y definido', diagnosis = 'FALSE', has_event = true, event_name = 'Media maraton Madrid', event_date = '2026-03-22', energy_level_initial = 7, stress_level_initial = 6, initial_photo_url = 'https://api.typeform.com/responses/files/7e6f0d8389d5e2e2428b09f86771ccff82ec423b241772e9c404747c24d86893/image.jpg', updated_at = NOW() WHERE id = 'c2210162-b361-41e8-b892-3f4f3303f43b';

-- Miguel Lendof
UPDATE clients SET email = 'miguellendof47@gmail.com', phone = '+18495396155', birth_date = '2004-05-25', height_cm = 155, initial_weight_kg = 80, initial_body_fat_pct = 20, motivation = '*Salud y Longevidad *— Largo plazo', diagnosis = 'FALSE', has_event = true, energy_level_initial = 9, stress_level_initial = 4, initial_photo_url = 'https://api.typeform.com/responses/files/ec19365a23ed149cf29f70116c8b9d70a20a6deccffea5a57afa447d5334cdd5/IMG_3140.jpeg', updated_at = NOW() WHERE id = 'c6ce5d8f-f74c-4518-8c59-76d5cc89cd49';

-- Pablo Lozano Rubio
UPDATE clients SET email = 'lozanop89@gmail.com', phone = '+34682380270', birth_date = '1999-11-06', height_cm = 173, initial_weight_kg = 64, initial_body_fat_pct = 12, motivation = '*Estética* — Verme fuerte y definido, *Rendimiento* — Energía y enfoque, *Salud y Longevidad *— Largo plazo', diagnosis = 'FALSE', has_event = true, energy_level_initial = 7, stress_level_initial = 6, onboarding_notes = 'Hago mucho deporte, running unos 50km semanales y pádel 3 días', onboarding_submitted_at = '2026-02-02 12:19:57+00', initial_photo_url = 'https://api.typeform.com/responses/files/c92c16dd58d9fd5107e28f7a5e2dd08fc626bb38e000e65cf284f2b64f972f17/IMG_2542.jpeg', updated_at = NOW() WHERE id = '285fd5ac-a9c0-4869-b00c-ea23c321d0b4';

-- Pablo Avilés Sanz
UPDATE clients SET email = 'pablo.aviles@gesperbaleares.es', phone = '+34687912496', birth_date = '1995-07-18', height_cm = 170, initial_weight_kg = 60, initial_body_fat_pct = 20, diagnosis = 'FALSE', has_event = true, energy_level_initial = 4, stress_level_initial = 7, onboarding_notes = 'Busco mayor productividad, mejor descanso, más vitalidad y energía en mi día.', onboarding_submitted_at = '2026-05-02 20:10:05+00', initial_photo_url = 'https://api.typeform.com/responses/files/217dcbe889bc37c739b02677709b9ad6d0d24355945231554b11c64e3193d58e/image.jpg', updated_at = NOW() WHERE id = '294c2930-d93a-47c2-a662-a7e62e0db4be';

-- Rafael Pineda
UPDATE clients SET email = 'rafa.pq@hotmail.com', phone = '+526622768157', birth_date = '1995-02-01', height_cm = 162, initial_weight_kg = 75, initial_body_fat_pct = 26, diagnosis = 'FALSE', has_event = true, energy_level_initial = 3, stress_level_initial = 10, onboarding_notes = 'No soy muy fan del gym aunque sé que es necesario. Ahorita estoy empezando a jugar tennis. Me gustaría convertirme en un atleta híbrido,', onboarding_submitted_at = '2026-06-02 17:50:47+00', initial_photo_url = 'https://api.typeform.com/responses/files/e32f64bae1ffa6a09533cd071e9a5c18b34fc07bc9b618517c5f57fb2e7a2564/76045AA5_BA94_479F_9983_2FC6AD2E6123.png', updated_at = NOW() WHERE id = 'f9b6f2aa-2d18-453f-bdc8-93afef8aedc8';

-- Santiago Arce Gomez
UPDATE clients SET email = 'santiarcego@gmail.com', phone = '+524422267268', birth_date = '1989-09-12', height_cm = 176, initial_weight_kg = 80, initial_body_fat_pct = 30, motivation = '*Salud y Longevidad *— Largo plazo', diagnosis = 'TRUE', diagnosis_detail = 'Hernia discal y discos deshidratados', has_event = true, event_date = '2026-05-30', energy_level_initial = 4, stress_level_initial = 8, onboarding_notes = 'Dar seguimiento', onboarding_submitted_at = '2026-09-01 19:53:54+00', initial_photo_url = 'https://api.typeform.com/responses/files/1ac000b09edf46e8a15970be8b49fbcdca47e1e06a86871dbfdfcb8b400c816c/image.jpg', updated_at = NOW() WHERE id = 'bd9669bf-6131-4b83-b4ea-32b55038b9d4';

-- Guillem Ribas Gris
UPDATE clients SET email = 'guilliribas05@gmail.com', phone = '+34648477208', birth_date = '2003-04-25', height_cm = 170, initial_weight_kg = 64, initial_body_fat_pct = 19, diagnosis = 'FALSE', has_event = true, energy_level_initial = 8, stress_level_initial = 5, onboarding_notes = 'Puedo entrenar toda la semana, no he puesto viernes o domingo porque acostumbro a tener partidos, pero se podria añadir un dia mas si solo tengo un partido', initial_photo_url = 'https://api.typeform.com/responses/files/5784443dab49618f2f2f886cf0592c6be18d08f754091eb3832534dbc596f67f/IMG_3728.jpeg', updated_at = NOW() WHERE id = '766a52b0-3992-4e0e-b2b1-135f09516dc6';

-- Elvis Florentino
UPDATE clients SET email = 'elvisflorentino@gmail.com', phone = '+18098893251', birth_date = '1983-07-25', height_cm = 175, initial_weight_kg = 90, initial_body_fat_pct = 19, diagnosis = 'TRUE', diagnosis_detail = 'Rinitis alérgica estacional', has_event = true, energy_level_initial = 6, stress_level_initial = 8, onboarding_notes = 'Rinitis alérgica estacional', initial_photo_url = 'https://api.typeform.com/responses/files/cc601716a5edd83b34e4b5bcd8be1dc54a2acfebddc10028217a021b054fa9d8/IMG_1084.jpeg', updated_at = NOW() WHERE id = '3ec5cf0e-852f-46f1-8565-68cd5ecaa74d';

-- Nacho Porcar
UPDATE clients SET email = 'naporcare@gmail.com', phone = '+34607757210', birth_date = '1995-06-26', height_cm = 177, initial_weight_kg = 74, initial_body_fat_pct = 20, diagnosis = 'FALSE', has_event = true, energy_level_initial = 7, stress_level_initial = 6, initial_photo_url = 'https://api.typeform.com/responses/files/835587fb5ca451da52a7b7a08b6452dc5d0152e457f432d4455d129627904e44/IMG_5436.jpeg', updated_at = NOW() WHERE id = 'c95307c8-c9f6-42a0-9214-d2aa4add4a35';

-- 26 profile updates

-- ============================================================
-- PART 3: Insert historical check-ins
-- ============================================================

INSERT INTO check_ins (client_id, submitted_at, weight, body_fat_percentage, energy_level, nutrition_adherence, notes, photo_urls, phase, sleep_hours, stress_level)
VALUES ('20680dd6-ee74-4f2f-840a-c3989f9fa7ba', NOW(), 97, NULL, NULL, NULL, NULL, ARRAY['https://api.typeform.com/responses/files/a7ce364b34f7422c3c57e96979469cb50e3dd6b46edc5893b899f0ab5ada30f5/IMG_3148.jpeg']::text[], NULL, NULL, NULL);
INSERT INTO check_ins (client_id, submitted_at, weight, body_fat_percentage, energy_level, nutrition_adherence, notes, photo_urls, phase, sleep_hours, stress_level)
VALUES ('4af6e30f-3f5e-40bb-95c8-1474ba2f9d04', '2026-12-02 19:53:45+00', 95, NULL, NULL, 5, 'Energía: Mejor; Antojos: TRUE; Digestión: Peor; Dificultades: Solo el lunes me costó el ejercicio', ARRAY['https://api.typeform.com/responses/files/1253c4ddf11d96e6c8436a780f6c3cbaba7ff906dd67f7018541a099c293d1fd/IMG_1830.jpeg']::text[], NULL, NULL, NULL);
INSERT INTO check_ins (client_id, submitted_at, weight, body_fat_percentage, energy_level, nutrition_adherence, notes, photo_urls, phase, sleep_hours, stress_level)
VALUES ('c71f5886-e44d-412e-963e-65b68375fa8f', NOW(), 76, NULL, NULL, NULL, NULL, ARRAY['https://api.typeform.com/responses/files/78df6ad383a29d74a8a2be0a58425e1a8bb272621701856a2a5bc5af76fc6da8/IMG_4895.jpeg']::text[], NULL, NULL, NULL);
INSERT INTO check_ins (client_id, submitted_at, weight, body_fat_percentage, energy_level, nutrition_adherence, notes, photo_urls, phase, sleep_hours, stress_level)
VALUES ('c71f5886-e44d-412e-963e-65b68375fa8f', '2026-12-01 04:39:21+00', NULL, NULL, NULL, NULL, NULL, ARRAY['https://api.typeform.com/responses/files/84ddcde3a9561ee7287471805d988bf37d01bbb13fe1f62005e28bf765c30e62/IMG_4596.jpeg']::text[], NULL, NULL, NULL);
INSERT INTO check_ins (client_id, submitted_at, weight, body_fat_percentage, energy_level, nutrition_adherence, notes, photo_urls, phase, sleep_hours, stress_level)
VALUES ('c71f5886-e44d-412e-963e-65b68375fa8f', '2026-06-01 04:28:34+00', NULL, NULL, NULL, NULL, NULL, ARRAY['https://api.typeform.com/responses/files/382eb3e299bb0233e465c8f00683ff1342b4d4b03bc383c32c864ce449be0e2a/IMG_4551.jpeg']::text[], NULL, NULL, NULL);
INSERT INTO check_ins (client_id, submitted_at, weight, body_fat_percentage, energy_level, nutrition_adherence, notes, photo_urls, phase, sleep_hours, stress_level)
VALUES ('c71f5886-e44d-412e-963e-65b68375fa8f', NOW(), NULL, NULL, NULL, NULL, NULL, ARRAY['https://api.typeform.com/responses/files/1b95da89e8e173c7e48ce7103a4418673c29153cfca6b8ca5e7cf56e80816f73/IMG_4265.jpeg']::text[], NULL, NULL, NULL);
INSERT INTO check_ins (client_id, submitted_at, weight, body_fat_percentage, energy_level, nutrition_adherence, notes, photo_urls, phase, sleep_hours, stress_level)
VALUES ('c71f5886-e44d-412e-963e-65b68375fa8f', NOW(), NULL, NULL, NULL, NULL, NULL, ARRAY['https://api.typeform.com/responses/files/35495203585dceca8fe4bf7a0c8b0111f5cd015fc5d0a91a68454c9c30ec6865/IMG_3910.jpeg']::text[], NULL, NULL, NULL);
INSERT INTO check_ins (client_id, submitted_at, weight, body_fat_percentage, energy_level, nutrition_adherence, notes, photo_urls, phase, sleep_hours, stress_level)
VALUES ('c71f5886-e44d-412e-963e-65b68375fa8f', '2025-05-12 16:23:06+00', NULL, NULL, NULL, NULL, NULL, ARRAY['https://api.typeform.com/responses/files/3fa43da095dfc797d0b34451759539d0e9a3416de9f1226b290dc347a70e05e7/image.jpg']::text[], NULL, NULL, NULL);
INSERT INTO check_ins (client_id, submitted_at, weight, body_fat_percentage, energy_level, nutrition_adherence, notes, photo_urls, phase, sleep_hours, stress_level)
VALUES ('18a8b4dd-fc1e-4b21-8bde-e3188b6db39a', NOW(), 61, NULL, NULL, 8, 'Energía: Mejor; Antojos: TRUE; Digestión: Mejor; Dificultades: Nada todo 100', ARRAY['https://api.typeform.com/responses/files/4698b2f3d8a1b1a467ce8b67e5dfade48e9e4444a74617a4b3e35aca857f6306/image.jpg']::text[], NULL, NULL, NULL);
INSERT INTO check_ins (client_id, submitted_at, weight, body_fat_percentage, energy_level, nutrition_adherence, notes, photo_urls, phase, sleep_hours, stress_level)
VALUES ('d7c0b846-5aa5-48c6-b381-4a4db2998d60', '2026-02-02 08:52:19+00', 77, NULL, NULL, NULL, NULL, ARRAY['https://api.typeform.com/responses/files/98a649581fd14435255b9b06ed9fac1923555b73df8a530e64064ccd99854bd5/PXL_20260131_172203494.MP.jpg']::text[], NULL, NULL, NULL);
INSERT INTO check_ins (client_id, submitted_at, weight, body_fat_percentage, energy_level, nutrition_adherence, notes, photo_urls, phase, sleep_hours, stress_level)
VALUES ('d7c0b846-5aa5-48c6-b381-4a4db2998d60', NOW(), 77, NULL, NULL, NULL, NULL, ARRAY['https://api.typeform.com/responses/files/bab9ee4f5aadfca79bdeca74e83cc946197efbe25d970404c4ed85895e99ff29/PXL_20260213_204920246.jpg']::text[], NULL, NULL, NULL);
INSERT INTO check_ins (client_id, submitted_at, weight, body_fat_percentage, energy_level, nutrition_adherence, notes, photo_urls, phase, sleep_hours, stress_level)
VALUES ('77199a71-93be-4fed-9240-fa667d9d1205', '2026-12-01 19:38:30+00', NULL, NULL, NULL, NULL, ARRAY['https://api.typeform.com/responses/files/84905dfa2c457673f220e71371d8fc8d9ee49468c6fb28d5350e272991551fdf/WhatsApp_Image_2026_01_12_at_12.37.51.jpeg']::text[], NULL, NULL, NULL);
INSERT INTO check_ins (client_id, submitted_at, weight, body_fat_percentage, energy_level, nutrition_adherence, notes, photo_urls, phase, sleep_hours, stress_level)
VALUES ('77199a71-93be-4fed-9240-fa667d9d1205', '2026-09-01 20:43:13+00', NULL, NULL, NULL, NULL, NULL, ARRAY['https://api.typeform.com/responses/files/76f6c823e77ab9f3e13e9deb08340543d4728e3c15b55abfd4010c0e7c7996ff/IMG_2033.jpeg']::text[], NULL, NULL, NULL);
INSERT INTO check_ins (client_id, submitted_at, weight, body_fat_percentage, energy_level, nutrition_adherence, notes, photo_urls, phase, sleep_hours, stress_level)
VALUES ('77199a71-93be-4fed-9240-fa667d9d1205', '2025-03-12 23:41:26+00', NULL, NULL, NULL, NULL, NULL, ARRAY['https://api.typeform.com/responses/files/c6a5467681fba8514f4405d5718237ae4a7b01388fa73ee137c1cd1504a0ec6a/WhatsApp_Image_2025_10_31_at_10.39.38.jpeg']::text[], NULL, NULL, NULL);
INSERT INTO check_ins (client_id, submitted_at, weight, body_fat_percentage, energy_level, nutrition_adherence, notes, photo_urls, phase, sleep_hours, stress_level)
VALUES ('390151df-a387-4d62-a830-759b9408e1b9', '2026-02-02 21:06:43+00', 78, NULL, NULL, NULL, NULL, ARRAY['https://api.typeform.com/responses/files/4364e819578948849638a0bc674de043515e7cccd7b2ece78dec0e1e9f1d2c06/IMG_8504.jpeg']::text[], NULL, NULL, NULL);
INSERT INTO check_ins (client_id, submitted_at, weight, body_fat_percentage, energy_level, nutrition_adherence, notes, photo_urls, phase, sleep_hours, stress_level)
VALUES ('8c367357-b05e-4fe6-84fa-9af33d80379e', '2026-02-02 16:13:42+00', 83, NULL, NULL, NULL, NULL, ARRAY['https://api.typeform.com/responses/files/2d81d99e5f1783e4932ea8c4ff3d668b7236d2870f929c8a55abdb393a0ee19e/IMG_0532.HEIC']::text[], NULL, NULL, NULL);
INSERT INTO check_ins (client_id, submitted_at, weight, body_fat_percentage, energy_level, nutrition_adherence, notes, photo_urls, phase, sleep_hours, stress_level)
VALUES ('3efd43bb-92be-48e4-9627-2821e5211779', '2026-01-02 19:05:50+00', 99, NULL, NULL, NULL, NULL, ARRAY['https://api.typeform.com/responses/files/61e12582ef3d0b8b7489c025d3684bd108c3e18846d525bf5f79f566a50baa5c/IMG_5096.jpeg']::text[], NULL, NULL, NULL);
INSERT INTO check_ins (client_id, submitted_at, weight, body_fat_percentage, energy_level, nutrition_adherence, notes, photo_urls, phase, sleep_hours, stress_level)
VALUES ('3efd43bb-92be-48e4-9627-2821e5211779', '2026-02-01 18:54:57+00', NULL, NULL, NULL, NULL, NULL, ARRAY['https://api.typeform.com/responses/files/7b825343b0a278f699fa2dd773135b51c8e03efe1e861ab13d22ffae899d8c84/WhatsApp_Image_2026_01_02_at_12.54.14_PM.jpeg']::text[], NULL, NULL, NULL);
INSERT INTO check_ins (client_id, submitted_at, weight, body_fat_percentage, energy_level, nutrition_adherence, notes, photo_urls, phase, sleep_hours, stress_level)
VALUES ('3efd43bb-92be-48e4-9627-2821e5211779', NOW(), 100, NULL, NULL, NULL, NULL, ARRAY['https://api.typeform.com/responses/files/3a1ff549f93fb971e8496bdaa61c60ca0c33cfdbb008ee67f18e52c89c815157/IMG_5143.jpeg']::text[], NULL, NULL, NULL);
INSERT INTO check_ins (client_id, submitted_at, weight, body_fat_percentage, energy_level, nutrition_adherence, notes, photo_urls, phase, sleep_hours, stress_level)
VALUES ('7d485588-58fa-4197-91ae-32b4f6752823', '2026-02-02 01:46:42+00', 64, NULL, NULL, NULL, NULL, ARRAY['https://api.typeform.com/responses/files/2b7a86ade2d19659234862edee7a1d9db02aa15eeff32a82d1fc58aaca132e4d/IMG_1547.jpeg']::text[], NULL, NULL, NULL);
INSERT INTO check_ins (client_id, submitted_at, weight, body_fat_percentage, energy_level, nutrition_adherence, notes, photo_urls, phase, sleep_hours, stress_level)
VALUES ('81daa4b1-5a7d-4eff-ae23-543324a078bd', '2026-01-02 13:57:06+00', 78, NULL, NULL, NULL, NULL, ARRAY['https://api.typeform.com/responses/files/abbbcebde7f144bc583ba56c817801c9e914f449c6ee6f0b1ac270ba6e049f2b/IMG_4549.jpeg']::text[], NULL, NULL, NULL);
INSERT INTO check_ins (client_id, submitted_at, weight, body_fat_percentage, energy_level, nutrition_adherence, notes, photo_urls, phase, sleep_hours, stress_level)
VALUES ('81daa4b1-5a7d-4eff-ae23-543324a078bd', '2026-09-01 21:20:45+00', NULL, NULL, NULL, NULL, NULL, ARRAY['https://api.typeform.com/responses/files/5b76326bdedc95de4fb59e80faf0854f9ce59be30908a678c068ed306808021e/IMG_4346.jpeg']::text[], NULL, NULL, NULL);
INSERT INTO check_ins (client_id, submitted_at, weight, body_fat_percentage, energy_level, nutrition_adherence, notes, photo_urls, phase, sleep_hours, stress_level)
VALUES ('81daa4b1-5a7d-4eff-ae23-543324a078bd', NOW(), 77, NULL, NULL, NULL, NULL, ARRAY['https://api.typeform.com/responses/files/8a96996a515016a37c1f81b2a5c514a9fe26f51e6bc29eeab6f22d4eee4bf7bf/IMG_4633.jpeg']::text[], NULL, NULL, NULL);
INSERT INTO check_ins (client_id, submitted_at, weight, body_fat_percentage, energy_level, nutrition_adherence, notes, photo_urls, phase, sleep_hours, stress_level)
VALUES ('cf22c5ab-f225-4892-b535-481af02aa9c7', '2026-12-01 00:03:13+00', NULL, NULL, NULL, NULL, NULL, ARRAY['https://api.typeform.com/responses/files/fc0af54ca2d4bb36f199006768915313ab5d46e30bbf19bcb619bded58299ed6/image.jpg']::text[], NULL, NULL, NULL);
INSERT INTO check_ins (client_id, submitted_at, weight, body_fat_percentage, energy_level, nutrition_adherence, notes, photo_urls, phase, sleep_hours, stress_level)
VALUES ('d11e8b4a-0112-46f9-97b5-46e4bf55b6ec', '2025-06-12 15:36:01+00', NULL, NULL, NULL, NULL, NULL, ARRAY['https://api.typeform.com/responses/files/6389715d7786712ad615b02676e760325f723357075c2bb4bd1eec17cf750b18/5DD7DCF1_49EE_426A_90EC_D2D64128D976.jpeg']::text[], NULL, NULL, NULL);
INSERT INTO check_ins (client_id, submitted_at, weight, body_fat_percentage, energy_level, nutrition_adherence, notes, photo_urls, phase, sleep_hours, stress_level)
VALUES ('d11e8b4a-0112-46f9-97b5-46e4bf55b6ec', NOW(), 89, NULL, NULL, NULL, NULL, ARRAY['https://api.typeform.com/responses/files/b00da0a2ef60de8252fa9c8e4d3e576fbcbc71dd9f3f122965977dcf5bbbdad3/IMG_1886.jpeg']::text[], NULL, NULL, NULL);
INSERT INTO check_ins (client_id, submitted_at, weight, body_fat_percentage, energy_level, nutrition_adherence, notes, photo_urls, phase, sleep_hours, stress_level)
VALUES ('d11e8b4a-0112-46f9-97b5-46e4bf55b6ec', NOW(), 90, NULL, NULL, NULL, 'Antojos: FALSE; Dificultades: RESET DE CAFE', ARRAY['https://api.typeform.com/responses/files/055817ba00b9be4751810c168352eccc16651b9a3af8c794a493eb6ce2c6aa3b/IMG_1042.jpeg']::text[], NULL, NULL, NULL);
INSERT INTO check_ins (client_id, submitted_at, weight, body_fat_percentage, energy_level, nutrition_adherence, notes, photo_urls, phase, sleep_hours, stress_level)
VALUES ('cf22c5ab-f225-4892-b535-481af02aa9c7', NOW(), NULL, NULL, NULL, NULL, NULL, ARRAY['https://api.typeform.com/responses/files/c79d679e9d7ec75b82e8aac66d4ff0068857bc0f7e4646e52991031ead8d1ddd/IMG_1692.jpeg']::text[], NULL, NULL, NULL);
INSERT INTO check_ins (client_id, submitted_at, weight, body_fat_percentage, energy_level, nutrition_adherence, notes, photo_urls, phase, sleep_hours, stress_level)
VALUES ('cf22c5ab-f225-4892-b535-481af02aa9c7', '2025-05-12 16:19:14+00', NULL, NULL, NULL, NULL, NULL, ARRAY['https://api.typeform.com/responses/files/90c2bf46de47c34ccf3107e1017d527b1ebd15dbaefb9e95f98f3a8521a49037/IMG_1440.jpeg']::text[], NULL, NULL, NULL);
INSERT INTO check_ins (client_id, submitted_at, weight, body_fat_percentage, energy_level, nutrition_adherence, notes, photo_urls, phase, sleep_hours, stress_level)
VALUES ('28a3072d-16c7-49aa-8468-4f998246882b', NOW(), NULL, NULL, NULL, NULL, NULL, ARRAY['https://api.typeform.com/responses/files/18918c11bd33df78063c3ecb6a2a4334f21fae639e3639ed8e4003f877c46fb5/17661661528518665545221270438957.jpg']::text[], NULL, NULL, NULL);
INSERT INTO check_ins (client_id, submitted_at, weight, body_fat_percentage, energy_level, nutrition_adherence, notes, photo_urls, phase, sleep_hours, stress_level)
VALUES ('28a3072d-16c7-49aa-8468-4f998246882b', '2025-02-12 18:11:07+00', NULL, NULL, NULL, NULL, NULL, ARRAY['https://api.typeform.com/responses/files/d09cbb2ce23e7fb3b0c42556a0853f98dc78aad3134d4306915ad84d97c1f893/17646990403787938413103532715263.jpg']::text[], NULL, NULL, NULL);
INSERT INTO check_ins (client_id, submitted_at, weight, body_fat_percentage, energy_level, nutrition_adherence, notes, photo_urls, phase, sleep_hours, stress_level)
VALUES ('28a3072d-16c7-49aa-8468-4f998246882b', NOW(), NULL, NULL, NULL, NULL, NULL, ARRAY['https://api.typeform.com/responses/files/806d8bf4592196b3e60370d2ce3115f9200bf593937388be015be5ab7da53a17/17671154311811399916903167022442.jpg']::text[], NULL, NULL, NULL);
INSERT INTO check_ins (client_id, submitted_at, weight, body_fat_percentage, energy_level, nutrition_adherence, notes, photo_urls, phase, sleep_hours, stress_level)
VALUES ('28a3072d-16c7-49aa-8468-4f998246882b', '2026-04-02 10:29:03+00', 103, NULL, NULL, NULL, NULL, ARRAY['https://api.typeform.com/responses/files/659b2389fd48c41d6f1dadca21359e9e81a0565e597930402153703122debe79/1770200915594..jpg']::text[], NULL, NULL, NULL);
INSERT INTO check_ins (client_id, submitted_at, weight, body_fat_percentage, energy_level, nutrition_adherence, notes, photo_urls, phase, sleep_hours, stress_level)
VALUES ('28a3072d-16c7-49aa-8468-4f998246882b', NOW(), 102, NULL, NULL, NULL, NULL, ARRAY['https://api.typeform.com/responses/files/ef514120273f5a94e5bf05b0a97732aff582b016e8aa883460190f5e7a1cb3fb/IMG_20260213_184300.jpg']::text[], NULL, NULL, NULL);
INSERT INTO check_ins (client_id, submitted_at, weight, body_fat_percentage, energy_level, nutrition_adherence, notes, photo_urls, phase, sleep_hours, stress_level)
VALUES ('c24ca4ee-ff8c-406e-9779-5326e1336197', '2026-02-01 19:55:29+00', NULL, NULL, NULL, NULL, NULL, ARRAY['https://api.typeform.com/responses/files/cf4f835ce8207837b4d558714e1e06acbbeb796e00759f7ae78e7b1f665af2c0/IMG_1146.jpeg']::text[], NULL, NULL, NULL);
INSERT INTO check_ins (client_id, submitted_at, weight, body_fat_percentage, energy_level, nutrition_adherence, notes, photo_urls, phase, sleep_hours, stress_level)
VALUES ('b787eb98-9e6e-43ca-a975-6b00cf461d5b', '2026-02-01 21:24:00+00', NULL, NULL, NULL, NULL, NULL, ARRAY['https://api.typeform.com/responses/files/ab3ead5a7121699a8613fc046be1a15702b7f149545689029967004d85422558/IMG_9191.jpeg']::text[], NULL, NULL, NULL);
INSERT INTO check_ins (client_id, submitted_at, weight, body_fat_percentage, energy_level, nutrition_adherence, notes, photo_urls, phase, sleep_hours, stress_level)
VALUES ('b787eb98-9e6e-43ca-a975-6b00cf461d5b', NOW(), 78, NULL, NULL, 8, 'Antojos: FALSE; Dificultades: Dormir temprano', ARRAY['https://api.typeform.com/responses/files/23ece214b7e3d092da321438992fc787c9c856191eaf02d330d3800568be46b9/IMG_9265.jpeg']::text[], NULL, NULL, NULL);
INSERT INTO check_ins (client_id, submitted_at, weight, body_fat_percentage, energy_level, nutrition_adherence, notes, photo_urls, phase, sleep_hours, stress_level)
VALUES ('c2210162-b361-41e8-b892-3f4f3303f43b', '2026-02-02 19:59:16+00', 70, NULL, NULL, NULL, NULL, ARRAY['https://api.typeform.com/responses/files/3e6ec2ae8225dc14a6258c47c0bb601243eabe5840b2208044a0dad6f0a2fbdd/image.jpg']::text[], NULL, NULL, NULL);
INSERT INTO check_ins (client_id, submitted_at, weight, body_fat_percentage, energy_level, nutrition_adherence, notes, photo_urls, phase, sleep_hours, stress_level)
VALUES ('c6ce5d8f-f74c-4518-8c59-76d5cc89cd49', NOW(), NULL, NULL, NULL, NULL, NULL, ARRAY['https://api.typeform.com/responses/files/aa80bdd28db99221a361eb2409bde8ccf14cccd460923a6eddc857befabf3af3/IMG_2658.jpeg']::text[], NULL, NULL, NULL);
INSERT INTO check_ins (client_id, submitted_at, weight, body_fat_percentage, energy_level, nutrition_adherence, notes, photo_urls, phase, sleep_hours, stress_level)
VALUES ('c95307c8-c9f6-42a0-9214-d2aa4add4a35', '2026-03-02 13:42:11+00', 74, NULL, NULL, NULL, NULL, ARRAY['https://api.typeform.com/responses/files/44c3f14aecfb2806c5d9d3148a16619f66cafb5bed6ac643d9b8c2989136897b/IMG_5194.jpeg']::text[], NULL, NULL, NULL);
INSERT INTO check_ins (client_id, submitted_at, weight, body_fat_percentage, energy_level, nutrition_adherence, notes, photo_urls, phase, sleep_hours, stress_level)
VALUES ('c95307c8-c9f6-42a0-9214-d2aa4add4a35', NOW(), NULL, NULL, NULL, NULL, NULL, ARRAY['https://api.typeform.com/responses/files/72e1c277519d84d6bb1bad3c483c5451cb59a58dc47f698ce6ca5bc4c279e133/IMG_4437.jpeg']::text[], NULL, NULL, NULL);
INSERT INTO check_ins (client_id, submitted_at, weight, body_fat_percentage, energy_level, nutrition_adherence, notes, photo_urls, phase, sleep_hours, stress_level)
VALUES ('c95307c8-c9f6-42a0-9214-d2aa4add4a35', '2025-03-12 14:09:15+00', NULL, NULL, NULL, NULL, NULL, ARRAY['https://api.typeform.com/responses/files/2feb38336c0001e18b75adf5cf57db1591e6d476e712643a3399a41d591409cc/IMG_3398.jpeg']::text[], NULL, NULL, NULL);
INSERT INTO check_ins (client_id, submitted_at, weight, body_fat_percentage, energy_level, nutrition_adherence, notes, photo_urls, phase, sleep_hours, stress_level)
VALUES ('285fd5ac-a9c0-4869-b00c-ea23c321d0b4', NOW(), 64, NULL, NULL, 9, 'Energía: Igual; Antojos: FALSE; Digestión: Mejor; Dificultades: No comer hidratos', ARRAY['https://api.typeform.com/responses/files/baed29ecaa11874824f8611f913ff45ca441e80f6b2dc06a51c18f7a4bed0d60/IMG_2776.jpeg']::text[], NULL, NULL, NULL);
INSERT INTO check_ins (client_id, submitted_at, weight, body_fat_percentage, energy_level, nutrition_adherence, notes, photo_urls, phase, sleep_hours, stress_level)
VALUES ('77199a71-93be-4fed-9240-fa667d9d1205', NOW(), NULL, NULL, NULL, NULL, NULL, ARRAY['https://api.typeform.com/responses/files/1aa82b8a50330eb9c89c357f0a7f43182e8fb8a30d93bc2ab8a1379cd43d9896/IMG_9306.jpeg']::text[], NULL, NULL, NULL);
INSERT INTO check_ins (client_id, submitted_at, weight, body_fat_percentage, energy_level, nutrition_adherence, notes, photo_urls, phase, sleep_hours, stress_level)
VALUES ('bd9669bf-6131-4b83-b4ea-32b55038b9d4', NOW(), 80, NULL, NULL, 9, 'Energía: Igual; Antojos: TRUE; Digestión: Igual; Dificultades: La comida', ARRAY['https://api.typeform.com/responses/files/e0277b7a2a9d9b5fc42373e5f0251a18b783a1bbd47ec9864e0869de1bb04167/IMG_2366.jpeg']::text[], NULL, NULL, NULL);
INSERT INTO check_ins (client_id, submitted_at, weight, body_fat_percentage, energy_level, nutrition_adherence, notes, photo_urls, phase, sleep_hours, stress_level)
VALUES ('8c367357-b05e-4fe6-84fa-9af33d80379e', NOW(), 81, NULL, NULL, NULL, NULL, ARRAY['https://api.typeform.com/responses/files/22802cc9953c6cfbc5d3d209f6aae4fcdafbd1abfc74db2bec81e9b8d29dc02b/IMG_1447.HEIC']::text[], NULL, NULL, NULL);
INSERT INTO check_ins (client_id, submitted_at, weight, body_fat_percentage, energy_level, nutrition_adherence, notes, photo_urls, phase, sleep_hours, stress_level)
VALUES ('c2210162-b361-41e8-b892-3f4f3303f43b', NOW(), 71, NULL, NULL, NULL, NULL, ARRAY['https://api.typeform.com/responses/files/1bd165c8de722d7dc840c3eb5fa553086f46d88b182e29cea03ace124d255301/image.jpg']::text[], NULL, NULL, NULL);
INSERT INTO check_ins (client_id, submitted_at, weight, body_fat_percentage, energy_level, nutrition_adherence, notes, photo_urls, phase, sleep_hours, stress_level)
VALUES ('d794d681-4f3f-44ea-b267-60ef791717c7', NOW(), 80, NULL, NULL, NULL, NULL, ARRAY['https://api.typeform.com/responses/files/4cd9b18efcc27b9ffc9efc35c3c34cc5f50c2f00ef5b369a6bd1554d858c1b35/image.jpg']::text[], NULL, NULL, NULL);
INSERT INTO check_ins (client_id, submitted_at, weight, body_fat_percentage, energy_level, nutrition_adherence, notes, photo_urls, phase, sleep_hours, stress_level)
VALUES ('05768576-d606-4b74-aab2-eb35858c5f52', NOW(), NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO check_ins (client_id, submitted_at, weight, body_fat_percentage, energy_level, nutrition_adherence, notes, photo_urls, phase, sleep_hours, stress_level)
VALUES ('cf22c5ab-f225-4892-b535-481af02aa9c7', NOW(), 73, NULL, NULL, NULL, NULL, ARRAY['https://api.typeform.com/responses/files/dc4f3304af6d3dc29c5ec5c661fcae44fc1870e4a496054811f34e8368de665d/IMG_4926.HEIC']::text[], NULL, NULL, NULL);
INSERT INTO check_ins (client_id, submitted_at, weight, body_fat_percentage, energy_level, nutrition_adherence, notes, photo_urls, phase, sleep_hours, stress_level)
VALUES ('c71f5886-e44d-412e-963e-65b68375fa8f', NOW(), 76, NULL, NULL, NULL, NULL, ARRAY['https://api.typeform.com/responses/files/a7c7934611c5bc85500320491251da546ca74487eef6560ad863e26d6a7fe3b9/IMG_4999.jpeg']::text[], NULL, NULL, NULL);
INSERT INTO check_ins (client_id, submitted_at, weight, body_fat_percentage, energy_level, nutrition_adherence, notes, photo_urls, phase, sleep_hours, stress_level)
VALUES ('766a52b0-3992-4e0e-b2b1-135f09516dc6', NOW(), 64, NULL, NULL, NULL, NULL, ARRAY['https://api.typeform.com/responses/files/8d11ae0e801090b359ed28eea64850396cb11b49d0e12feaae2ad8b0a6a5e255/IMG_3801.jpeg']::text[], NULL, NULL, NULL);
INSERT INTO check_ins (client_id, submitted_at, weight, body_fat_percentage, energy_level, nutrition_adherence, notes, photo_urls, phase, sleep_hours, stress_level)
VALUES ('37c7ce9e-1717-4418-a697-9d950590151f', NOW(), 89, NULL, NULL, NULL, NULL, ARRAY['https://api.typeform.com/responses/files/08262cc4e7c48c4345c896de83bec8c4b1bace68dbe449d6da09d05e0b428df1/image.jpg']::text[], NULL, NULL, NULL);
INSERT INTO check_ins (client_id, submitted_at, weight, body_fat_percentage, energy_level, nutrition_adherence, notes, photo_urls, phase, sleep_hours, stress_level)
VALUES ('cf22c5ab-f225-4892-b535-481af02aa9c7', NOW(), 71, NULL, NULL, 5, 'Energía: Igual; Antojos: TRUE; Digestión: Mejor; Dificultades: Intimida mala concentración inestable pensamiento negativo', ARRAY['https://api.typeform.com/responses/files/0028684f739878884c0365d6ea013ddf3c931099a1be490a9cef5b611aa1c575/IMG_6888.jpeg']::text[], NULL, NULL, NULL);

-- 54 check-ins inserted

COMMIT;
