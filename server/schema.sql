-- Users table for Super Admin and Call Agents
CREATE TABLE IF NOT EXISTS users (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    role ENUM('admin', 'agent') NOT NULL DEFAULT 'agent',
    can_view_chat BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

-- Leads table (existing, but ensured)
CREATE TABLE IF NOT EXISTS leads (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    phone VARCHAR(30) NOT NULL UNIQUE,
    name VARCHAR(120) NULL,
    source VARCHAR(80) NOT NULL DEFAULT 'unknown',
    status VARCHAR(40) NOT NULL DEFAULT 'new',
    assigned_to_id INT UNSIGNED NULL, -- Changed from string to foreign key
    notes TEXT NULL,
    follow_up_at DATETIME NULL,
    last_call_outcome VARCHAR(255) NULL,
    last_called_at DATETIME NULL,
    last_message TEXT NULL,
    last_message_at DATETIME NULL,
    raw_payload JSON NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_status (status),
    INDEX idx_assigned_to (assigned_to_id),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (assigned_to_id) REFERENCES users (id) ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

-- Messages table to store chat history
CREATE TABLE IF NOT EXISTS messages (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    lead_id BIGINT UNSIGNED NOT NULL,
    sender_type ENUM('customer', 'system', 'agent') NOT NULL,
    sender_id INT UNSIGNED NULL, -- If agent sent it, their user ID
    message_text TEXT NOT NULL,
    message_type VARCHAR(50) DEFAULT 'text',
    raw_payload JSON NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lead_id) REFERENCES leads (id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users (id) ON DELETE SET NULL,
    INDEX idx_lead (lead_id),
    INDEX idx_created_at (created_at)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;