-- Migration 007: Fix accent/name mismatches from 006
-- The original 006 migration used LOWER() for name matching, but PostgreSQL
-- LOWER() preserves accents (e.g. 'andré' != 'andre'), causing some clients
-- to not match their check-in or onboarding data.

-- ============================================
-- STEP 1: Fix onboarding profile data for accent-mismatched clients
-- ============================================

-- André Bilse (CSV had 'Andre', DB has 'André')
UPDATE clients SET
    phone = COALESCE(phone, '+525633926201'),
        email = COALESCE(email, 'andrebilsecis@gmail.com'),
            birth_date = COALESCE(birth_date, '1999-10-19'::date),
                height_cm = COALESCE(height_cm, 181.0),
                    initial_weight_kg = COALESCE(initial_weight_kg, 97.0),
                        initial_body_fat_pct = COALESCE(initial_body_fat_pct, 30.0),
                            motivation = COALESCE(motivation, 'Estética — Verme fuerte y definido, Rendimiento — Energía y enfoque, Salud y Longevidad — Largo plazo'),
                                initial_photo_url = COALESCE(initial_photo_url, 'https://api.typeform.com/responses/files/ffc0c59f3df0144b6d611e637f117a23fa7cc0f5a88f70dd0c9bf06d6a932395/image.jpg')
                                WHERE first_name = 'André' AND last_name = 'Bilse';

                                -- Elías Fernandez (CSV had 'Elias', DB has 'Elías')
                                UPDATE clients SET
                                    phone = COALESCE(phone, '+524492479736'),
                                        email = COALESCE(email, 'eliasfernandez0107@gmail.com'),
                                            birth_date = COALESCE(birth_date, '2003-01-07'::date),
                                                height_cm = COALESCE(height_cm, 174.0),
                                                    initial_weight_kg = COALESCE(initial_weight_kg, 79.0),
                                                        initial_body_fat_pct = COALESCE(initial_body_fat_pct, 16.0),
                                                            motivation = COALESCE(motivation, 'Estética — Verme fuerte y definido, Rendimiento — Energía y enfoque, Salud y Longevidad — Largo plazo')
                                                            WHERE first_name = 'Elías' AND last_name = 'Fernandez';

                                                            -- ============================================
                                                            -- STEP 2: Fix check-ins for accent/compound-name mismatches
                                                            -- ============================================

                                                            DO $$
                                                            DECLARE
                                                              v_client_id UUID;
                                                              BEGIN

                                                                -- André Bilse (CSV: 'Andre Bilse')
                                                                  SELECT id INTO v_client_id FROM clients WHERE first_name = 'André' AND last_name = 'Bilse';
                                                                    IF v_client_id IS NOT NULL THEN
                                                                        INSERT INTO check_ins (client_id, submitted_at, typeform_response_id, weight, body_fat_percentage, energy_level, sleep_quality, stress_level, nutrition_adherence, phase, cravings, digestion, carb_sensation, notes, photo_urls)
                                                                            VALUES (v_client_id, '2026-02-12T19:53:45'::timestamptz, 'qpsc2hlq7gf0cpbsq4qm8dqpscwaal0l', 95.0, 30.0, NULL, 7, NULL, 5, 'Fase 1', TRUE, 'Peor', NULL, 'Dificultad: Solo el lunes me costó el ejercicio', ARRAY['https://api.typeform.com/responses/files/1253c4ddf11d96e6c8436a780f6c3cbaba7ff906dd67f7018541a099c293d1fd/IMG_1830.jpeg'])
                                                                                ON CONFLICT (typeform_response_id) DO NOTHING;
                                                                                  END IF;

                                                                                    -- Elías Fernandez (CSV: 'Elias Fernández')
                                                                                      SELECT id INTO v_client_id FROM clients WHERE first_name = 'Elías' AND last_name = 'Fernandez';
                                                                                        IF v_client_id IS NOT NULL THEN
                                                                                            INSERT INTO check_ins (client_id, submitted_at, typeform_response_id, weight, body_fat_percentage, energy_level, sleep_quality, stress_level, nutrition_adherence, phase, cravings, digestion, carb_sensation, notes, photo_urls)
                                                                                                VALUES (v_client_id, '2026-02-02T21:06:43'::timestamptz, 'ffs8zvi7jkiqnnufggffs8zv1cnmdm2m', 78.0, 11.0, NULL, 5, NULL, NULL, 'Fase 2', NULL, NULL, 'Igual', 'Pérdida de control: En la tarde noche, gula', ARRAY['https://api.typeform.com/responses/files/4364e819578948849638a0bc674de043515e7cccd7b2ece78dec0e1e9f1d2c06/IMG_8504.jpeg'])
                                                                                                    ON CONFLICT (typeform_response_id) DO NOTHING;
                                                                                                      END IF;
                                                                                                      
                                                                                                        -- Hermes Octavio Contla Gutiérrez (CSV: 'Hermes Contla')
                                                                                                          SELECT id INTO v_client_id FROM clients WHERE first_name = 'Hermes Octavio' AND last_name LIKE 'Contla%';
                                                                                                            IF v_client_id IS NOT NULL THEN
                                                                                                                INSERT INTO check_ins (client_id, submitted_at, typeform_response_id, weight, body_fat_percentage, energy_level, sleep_quality, stress_level, nutrition_adherence, phase, cravings, digestion, carb_sensation, notes, photo_urls)
                                                                                                                    VALUES (v_client_id, '2026-02-02T01:46:42'::timestamptz, '1sugwuzudnk927k1sugw2mnnct35gn34', 64.0, 11.0, NULL, 6, NULL, NULL, 'Fase 2', NULL, NULL, 'Igual', NULL, ARRAY['https://api.typeform.com/responses/files/2b7a86ade2d19659234862edee7a1d9db02aa15eeff32a82d1fc58aaca132e4d/IMG_1547.jpeg'])
                                                                                                                        ON CONFLICT (typeform_response_id) DO NOTHING;
                                                                                                                          END IF;
                                                                                                                          
                                                                                                                            -- Hector Flores Lara (CSV: 'Héctor Emilio Flores')
                                                                                                                              SELECT id INTO v_client_id FROM clients WHERE first_name = 'Hector' AND last_name LIKE 'Flores%';
                                                                                                                                IF v_client_id IS NOT NULL THEN
                                                                                                                                    INSERT INTO check_ins (client_id, submitted_at, typeform_response_id, weight, body_fat_percentage, energy_level, sleep_quality, stress_level, nutrition_adherence, phase, cravings, digestion, carb_sensation, notes, photo_urls)
                                                                                                                                        VALUES (v_client_id, '2026-02-19T02:01:44'::timestamptz, 'spkwi3zogsrppdbn4bmfa5y2spkwi3z2', 80.0, 23.0, NULL, 6, NULL, NULL, 'Fase 2', NULL, NULL, 'Mejor', NULL, ARRAY['https://api.typeform.com/responses/files/4cd9b18efcc27b9ffc9efc35c3c34cc5f50c2f00ef5b369a6bd1554d858c1b35/image.jpg'])
                                                                                                                                            ON CONFLICT (typeform_response_id) DO NOTHING;
                                                                                                                                              END IF;
                                                                                                                                              
                                                                                                                                                -- Leonel Alejandro Vizcaino (CSV: 'leonel vizcaino')
                                                                                                                                                  SELECT id INTO v_client_id FROM clients WHERE first_name = 'Leonel Alejandro' AND last_name = 'Vizcaino';
                                                                                                                                                    IF v_client_id IS NOT NULL THEN
                                                                                                                                                        INSERT INTO check_ins (client_id, submitted_at, typeform_response_id, weight, body_fat_percentage, energy_level, sleep_quality, stress_level, nutrition_adherence, phase, cravings, digestion, carb_sensation, notes, photo_urls)
                                                                                                                                                            VALUES (v_client_id, '2026-02-27T14:47:33'::timestamptz, 'j0bvz17v4mkli5vae3xij0bvx6opsvyo', 89.0, 16.0, NULL, 7, NULL, NULL, 'Fase 2', NULL, NULL, 'Mejor', NULL, ARRAY['https://api.typeform.com/responses/files/08262cc4e7c48c4345c896de83bec8c4b1bace68dbe449d6da09d05e0b428df1/image.jpg'])
                                                                                                                                                                ON CONFLICT (typeform_response_id) DO NOTHING;
                                                                                                                                                                  END IF;
                                                                                                                                                                  
                                                                                                                                                                    -- Juan Pablo Martinez A (CSV: 'Juan Pablo Martínez Andrade' — accent on í)
                                                                                                                                                                      SELECT id INTO v_client_id FROM clients WHERE first_name = 'Juan Pablo' AND last_name = 'Martinez A';
                                                                                                                                                                        IF v_client_id IS NOT NULL THEN
                                                                                                                                                                            INSERT INTO check_ins (client_id, submitted_at, typeform_response_id, weight, body_fat_percentage, energy_level, sleep_quality, stress_level, nutrition_adherence, phase, cravings, digestion, carb_sensation, notes, photo_urls)
                                                                                                                                                                                VALUES (v_client_id, '2026-01-02T19:55:29'::timestamptz, 'eneyn6dgd5e0ptnmfgmeneyn6uhb9z6t', NULL, 35.0, NULL, NULL, NULL, NULL, 'Fase 3', NULL, NULL, NULL, NULL, ARRAY['https://api.typeform.com/responses/files/cf4f835ce8207837b4d558714e1e06acbbeb796e00759f7ae78e7b1f665af2c0/IMG_1146.jpeg'])
                                                                                                                                                                                    ON CONFLICT (typeform_response_id) DO NOTHING;
                                                                                                                                                                                      END IF;
                                                                                                                                                                                      
                                                                                                                                                                                      END $$;
