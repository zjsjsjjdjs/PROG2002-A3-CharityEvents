-- Fictional A3 samples; apply once after the A2 seed and m02-registrations.sql.
-- example.com addresses are demonstration data, not real attendee contacts.
SET @previous_time_zone = @@session.time_zone;
SET time_zone = '+00:00';
INSERT INTO registrations (event_id, name, email, registered_at, tickets) VALUES
    (1, 'Alex Chen', 'alex.chen@example.com', '2026-09-20 01:00:00', 2),
    (1, 'Jordan Lee', 'jordan.lee@example.com', '2026-09-20 02:00:00', 1),
    (2, 'Alex Chen', 'alex.chen@example.com', '2026-09-21 01:00:00', 2),
    (2, 'Sam Taylor', 'sam.taylor@example.com', '2026-09-21 02:00:00', 3),
    (3, 'Morgan Wu', 'morgan.wu@example.com', '2026-09-22 01:00:00', 1),
    (3, 'Riley Brown', 'riley.brown@example.com', '2026-09-22 02:00:00', 2),
    (3, 'Alex Chen', 'alex.chen@example.com', '2026-09-22 02:00:00', 1),
    (4, 'Casey Wang', 'casey.wang@example.com', '2026-09-23 01:00:00', 4),
    (4, 'Jamie Smith', 'jamie.smith@example.com', '2026-09-23 02:00:00', 2),
    (5, 'Avery Liu', 'avery.liu@example.com', '2026-09-24 01:00:00', 1),
    (5, 'Robin Green', 'robin.green@example.com', '2026-09-24 02:00:00', 2),
    (5, 'Drew Wilson', 'drew.wilson@example.com', '2026-09-24 03:00:00', 3);
SET time_zone = @previous_time_zone;
