-- ============================================================================
-- Migration 001: Enable Required Extensions
-- ============================================================================
-- Run this first to enable PostgreSQL extensions needed by the application.
-- ============================================================================

-- UUIDs generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Geographic/spatial search capabilities
CREATE EXTENSION IF NOT EXISTS "postgis";
