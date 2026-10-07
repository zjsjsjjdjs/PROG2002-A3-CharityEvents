-- A3 fresh installation into an EMPTY database selected by the operator.
-- No DROP/CREATE DATABASE or hard-coded USE statements. Never import over live data.
-- A2: Tianyi Li <id_09188388@foxmail.com>.
-- Registration schema and samples: Hongke Ouyang <2838356314@qq.com>.
-- Deployment assembly: Tianyi Li <id_09188388@foxmail.com>.

CREATE TABLE organisations (
    organisation_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    mission VARCHAR(500) NOT NULL,
    contact_email VARCHAR(120) NOT NULL,
    contact_phone VARCHAR(30) NOT NULL,
    website_url VARCHAR(255)
);

CREATE TABLE categories (
    category_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(80) NOT NULL UNIQUE,
    description VARCHAR(255)
);

CREATE TABLE events (
    event_id INT AUTO_INCREMENT PRIMARY KEY,
    organisation_id INT NOT NULL,
    category_id INT NOT NULL,
    name VARCHAR(150) NOT NULL,
    event_datetime DATETIME NOT NULL,
    location VARCHAR(180) NOT NULL,
    purpose VARCHAR(255) NOT NULL,
    short_description VARCHAR(300) NOT NULL,
    full_description TEXT NOT NULL,
    ticket_price DECIMAL(8, 2) NOT NULL DEFAULT 0.00,
    fundraising_goal DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    current_progress DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    status ENUM('active', 'suspended') NOT NULL DEFAULT 'active',
    latitude DECIMAL(9, 6),
    longitude DECIMAL(9, 6),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_events_organisation
        FOREIGN KEY (organisation_id)
        REFERENCES organisations (organisation_id),
    CONSTRAINT fk_events_category
        FOREIGN KEY (category_id)
        REFERENCES categories (category_id),
    CONSTRAINT chk_ticket_price_non_negative
        CHECK (ticket_price >= 0),
    CONSTRAINT chk_fundraising_goal_non_negative
        CHECK (fundraising_goal >= 0),
    CONSTRAINT chk_current_progress_non_negative
        CHECK (current_progress >= 0)
);

INSERT INTO organisations
    (name, mission, contact_email, contact_phone, website_url)
VALUES
    (
        'Harbour Hope Charity',
        'Supporting local families through community fundraising events, emergency relief, and youth programs.',
        'contact@harbourhope.org',
        '02 5550 1200',
        'https://www.harbourhope.org'
    );

INSERT INTO categories
    (name, description)
VALUES
    ('Fun Run', 'Community running and walking events for all ages.'),
    ('Gala Dinner', 'Formal fundraising dinners with entertainment and guest speakers.'),
    ('Auction', 'Silent and live auctions supporting charity programs.'),
    ('Concert', 'Music events that raise funds through ticket sales.'),
    ('Workshop', 'Educational and creative sessions connected to charitable causes.');

INSERT INTO events
    (
        organisation_id,
        category_id,
        name,
        event_datetime,
        location,
        purpose,
        short_description,
        full_description,
        ticket_price,
        fundraising_goal,
        current_progress,
        status,
        latitude,
        longitude
    )
VALUES
    (
        1,
        1,
        'Spring Steps Fun Run',
        '2026-09-27 08:30:00',
        'Riverside Park, Brisbane',
        'Raise funds for school breakfast programs.',
        'A family-friendly 5 km fun run through Riverside Park.',
        'Spring Steps Fun Run invites runners, walkers, families, and community teams to raise funds for school breakfast programs. Participants can complete a 5 km course at their own pace, with volunteer marshals, water stations, and a community picnic area at the finish line.',
        20.00,
        6000.00,
        2850.00,
        'active',
        -27.470125,
        153.021072
    ),
    (
        1,
        2,
        'Hope Under the Stars Gala',
        '2026-10-04 18:30:00',
        'City Hall Ballroom, Brisbane',
        'Fund emergency accommodation for families in crisis.',
        'An evening gala with dinner, music, and community awards.',
        'Hope Under the Stars Gala brings donors, volunteers, and local businesses together for a formal fundraising dinner. The evening includes guest speakers, live music, community awards, and donation opportunities that support emergency accommodation for families in crisis.',
        95.00,
        18000.00,
        7200.00,
        'active',
        -27.468968,
        153.023499
    ),
    (
        1,
        3,
        'Artists for Relief Silent Auction',
        '2026-10-11 14:00:00',
        'West End Community Gallery',
        'Support disaster relief packs for local households.',
        'A silent auction featuring donated work from local artists.',
        'Artists for Relief Silent Auction showcases paintings, ceramics, photography, and handmade items donated by local artists. Guests can browse the gallery, place bids, and learn how disaster relief packs help households recover after storms and floods.',
        10.00,
        8500.00,
        3100.00,
        'active',
        -27.481600,
        153.009300
    ),
    (
        1,
        4,
        'Voices of Hope Concert',
        '2026-10-18 19:00:00',
        'South Bank Cultural Centre',
        'Fund youth counselling sessions.',
        'A benefit concert with local choirs and acoustic performers.',
        'Voices of Hope Concert features local choirs, acoustic performers, and student musicians. Ticket sales help fund youth counselling sessions and follow-up support for young people experiencing hardship.',
        35.00,
        12000.00,
        4650.00,
        'active',
        -27.477200,
        153.021500
    ),
    (
        1,
        5,
        'Community Cooking for Care',
        '2026-11-02 10:00:00',
        'New Farm Community Kitchen',
        'Provide meal kits for elderly residents.',
        'A hands-on cooking workshop supporting meal kit delivery.',
        'Community Cooking for Care is a practical cooking workshop where attendees learn affordable meal preparation skills. Funds raised from registrations support meal kit delivery for elderly residents living alone.',
        25.00,
        5000.00,
        1350.00,
        'active',
        -27.469800,
        153.045000
    ),
    (
        1,
        1,
        'Harbour Dash Charity Run',
        '2026-08-30 07:45:00',
        'Manly Harbour Village',
        'Support sports equipment grants for children.',
        'A completed harbour-side run kept for testing past event logic.',
        'Harbour Dash Charity Run was a morning community run along the harbour. It is included in the seed data so the application can test past event handling and date-based labels without showing the event on the active homepage.',
        18.00,
        4500.00,
        5100.00,
        'active',
        -27.454200,
        153.186800
    ),
    (
        1,
        2,
        'Winter Warmth Dinner',
        '2026-07-19 18:00:00',
        'Fortitude Valley Community Hall',
        'Purchase blankets and warm clothing for winter outreach.',
        'A completed fundraising dinner for winter outreach support.',
        'Winter Warmth Dinner is a past fundraising event included to test event date handling. The dinner raised money for blankets, warm clothing, and outreach supplies distributed during winter.',
        60.00,
        9000.00,
        9400.00,
        'active',
        -27.456900,
        153.034600
    ),
    (
        1,
        3,
        'Paused Premium Auction',
        '2026-10-25 15:00:00',
        'Online',
        'Raise funds for technology access programs.',
        'A suspended event that should not appear on the public homepage.',
        'Paused Premium Auction is intentionally marked as suspended in the seed data. It allows the API and client side to demonstrate that suspended events are excluded from public homepage results while remaining available for later admin-side testing.',
        0.00,
        10000.00,
        500.00,
        'suspended',
        NULL,
        NULL
    );

-- A3 M02, Hongke Ouyang <2838356314@qq.com>.
-- Apply once to the selected A2 database. Existing A2 tables/data are preserved.
CREATE TABLE registrations (
    registration_id INT AUTO_INCREMENT PRIMARY KEY,
    event_id INT NOT NULL,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(254) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
    registered_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    tickets INT NOT NULL,
    CONSTRAINT uq_registration_event_email UNIQUE (event_id, email),
    CONSTRAINT fk_registration_event FOREIGN KEY (event_id)
        REFERENCES events (event_id) ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT chk_registration_name CHECK (CHAR_LENGTH(TRIM(name)) > 0),
    CONSTRAINT chk_registration_email CHECK (CHAR_LENGTH(TRIM(email)) > 0),
    CONSTRAINT chk_registration_tickets CHECK (tickets > 0),
    INDEX idx_registration_event_time (event_id, registered_at, registration_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

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
