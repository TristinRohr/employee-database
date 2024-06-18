-- Connect to PostgreSQL and create the database
CREATE DATABASE company_db;

-- Connect to the database
\c company_db;

-- Create tables
CREATE TABLE departments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL
);

CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    title VARCHAR(50) NOT NULL,
    salary DECIMAL NOT NULL,
    department_id INTEGER REFERENCES departments(id)
);

CREATE TABLE employees (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    role_id INTEGER REFERENCES roles(id),
    manager_id INTEGER REFERENCES employees(id)
);