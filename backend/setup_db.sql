-- Run as the postgres superuser:
--   & "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -h localhost -f setup_db.sql
-- The password below must match DATABASE_URL in backend/.env.
CREATE USER finance_user WITH PASSWORD 'change_me';
CREATE DATABASE finance_db OWNER finance_user;
