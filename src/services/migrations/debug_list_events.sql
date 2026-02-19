-- List all catering events for debugging
SELECT id, client_name, status, order_type, date, venue, guests, budget, created_at
FROM catering_events
WHERE client_name ILIKE '%Goka%' OR client_name ILIKE '%Braithwaite%'
ORDER BY created_at DESC;
