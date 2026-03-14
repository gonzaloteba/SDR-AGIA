-- Seed coach_actions for existing calls

-- Elías Fernandez - Call 1 (2026-01-14) - Initial call, coach needs to create meal plan
UPDATE calls SET
  coach_actions = '1. Crear plan de alimentación Fase 1 Detox
2. Enviar lista de alimentos permitidos por WhatsApp
3. Configurar recordatorios de comidas en la app',
  coach_actions_completed = true
WHERE client_id = (SELECT id FROM clients WHERE first_name = 'Elías' AND last_name = 'Fernandez' LIMIT 1)
  AND call_date = '2026-01-14';

-- Elías Fernandez - Call 2 (2026-02-11) - Transition to phase 2
UPDATE calls SET
  coach_actions = '1. Actualizar plan de alimentación con carbohidratos complejos (arroz, avena, boniato, legumbres)
2. Enviar cantidades exactas de carbohidratos según horario de entreno
3. Registrar progreso: -2.5kg en fase 1',
  coach_actions_completed = true
WHERE client_id = (SELECT id FROM clients WHERE first_name = 'Elías' AND last_name = 'Fernandez' LIMIT 1)
  AND call_date = '2026-02-11';

-- Elías Fernandez - Call 3 (2026-03-11) - Planning phase 3
UPDATE calls SET
  coach_actions = '1. Preparar protocolo Fase 3 - Optimización
2. Ajustar macros según nuevo peso (-4kg total)
3. Evaluar si añadir suplementación',
  coach_actions_completed = false
WHERE client_id = (SELECT id FROM clients WHERE first_name = 'Elías' AND last_name = 'Fernandez' LIMIT 1)
  AND call_date = '2026-03-11';

-- Santiago Arce - Call 1 (2026-01-19) - Initial call
UPDATE calls SET
  coach_actions = '1. Enviar recetas de batch cooking (meal prep domingo)
2. Crear alternativas para salidas de fin de semana
3. Preparar plan de alimentación Fase 1 adaptado a entreno PPL',
  coach_actions_completed = true
WHERE client_id = (SELECT id FROM clients WHERE first_name = 'Santiago' AND last_name = 'Arce' LIMIT 1)
  AND call_date = '2026-01-19';

-- Santiago Arce - Call 2 (2026-02-16) - Supplementation
UPDATE calls SET
  coach_actions = '1. Añadir magnesio bisglicinato 400mg al protocolo de suplementación
2. Actualizar plan con ajustes de fase 2
3. Revisar evolución de composición corporal',
  coach_actions_completed = false
WHERE client_id = (SELECT id FROM clients WHERE first_name = 'Santiago' AND last_name = 'Arce' LIMIT 1)
  AND call_date = '2026-02-16';

-- Pablo Lozano - Call 1 (2026-02-16) - Initial call
UPDATE calls SET
  coach_actions = '1. Crear plan de alimentación con desayuno incluido (huevos + pan centeno)
2. Ajustar horario de cenas (antes de las 21:00)
3. Enviar plan detallado por WhatsApp',
  coach_actions_completed = false
WHERE client_id = (SELECT id FROM clients WHERE first_name = 'Pablo' AND last_name = 'Lozano' LIMIT 1)
  AND call_date = '2026-02-16';
