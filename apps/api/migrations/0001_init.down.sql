DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS audit_log;
DROP TRIGGER IF EXISTS users_set_updated_at ON users;
DROP TABLE IF EXISTS users;
DROP FUNCTION IF EXISTS set_updated_at();
-- Extensions are left in place; dropping them would affect other DBs sharing the cluster.
