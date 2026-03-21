SELECT 'CREATE DATABASE mic_orchestrator'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'mic_orchestrator')\gexec
