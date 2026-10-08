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
