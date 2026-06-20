CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('client', 'artist', 'admin')),
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE artists (
    user_id INTEGER PRIMARY KEY,
    display_name TEXT NOT NULL,
    bio TEXT,
    profile_image TEXT,
    city TEXT,

    CONSTRAINT fk_artist_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

CREATE TABLE categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT
);

CREATE TABLE portfolios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    artist_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    image TEXT,
    category_id INTEGER,
    created_at TEXT DEFAULT (datetime('now')),

    CONSTRAINT fk_portfolio_artist
        FOREIGN KEY(artist_id)
        REFERENCES artists(user_id)
        ON DELETE CASCADE,
    
    CONSTRAINT fk_portfolio_category
        FOREIGN KEY (category_id)
        REFERENCES categories(id)
        ON DELETE SET NULL
);

CREATE TABLE services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    artist_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    price INTEGER NOT NULL,
    delivery_days INTEGER NOT NULL,
    category_id INTEGER,

    CONSTRAINT fk_artist_user
        FOREIGN KEY (artist_id)
        REFERENCES artists (user_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_service_category
        FOREIGN KEY (category_id)
        REFERENCES categories (id)
        ON DELETE SET NULL
);

CREATE TABLE commissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id  INTEGER,
    artist_id  INTEGER,
    service_id INTEGER,
    title TEXT,
    description TEXT,
    price INTEGER,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN('pending', 'accepted', 'rejected', 'in_progress', 'delivered', 'reviewed')),
    stripe_payment_id TEXT,
    payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
    delivery_image TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),

    CONSTRAINT fk_client 
        FOREIGN KEY (client_id)
        REFERENCES users(id)
        ON DELETE SET NULL,
    
    CONSTRAINT fk_artist_user
        FOREIGN KEY (artist_id)
        REFERENCES artists(user_id)
        ON DELETE SET NULL,
    
    CONSTRAINT fk_service 
        FOREIGN KEY (service_id)
        REFERENCES services(id)
        ON DELETE SET NULL
);

CREATE TABLE favorites (
    client_id INTEGER NOT NULL,
    artist_id INTEGER NOT NULL,

    PRIMARY KEY (client_id, artist_id),
    
    CONSTRAINT fk_client
        FOREIGN KEY (client_id)
        REFERENCES users(id)
        ON DELETE CASCADE,
    
    CONSTRAINT fk_artist_user
        FOREIGN KEY (artist_id)
        REFERENCES artists(user_id)
        ON DELETE CASCADE
);

CREATE TABLE reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    commission_id INTEGER NOT NULL,
    client_id INTEGER,
    rating INTEGER NOT NULL,
    text TEXT,
    created_at TEXT DEFAULT (datetime('now')),

    CONSTRAINT fk_commission
        FOREIGN KEY (commission_id)
        REFERENCES commissions(id)
        ON DELETE CASCADE,
    
    CONSTRAINT fk_client    
        FOREIGN KEY (client_id)
        REFERENCES users(id)
        ON DELETE SET NULL
);

CREATE TABLE notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    message TEXT NOT NULL,
    is_read INTEGER NOT NULL DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),

    CONSTRAINT fk_notification_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);
