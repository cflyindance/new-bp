-- PayRoll P0 — PostgreSQL schema (calculation-only mode)
-- @see docs/项目文档/PayRoll-P0-设计与开发规格.md §4.3

CREATE TABLE IF NOT EXISTS payroll_company (
  company_id UUID PRIMARY KEY,
  legal_name VARCHAR(200) NOT NULL,
  fein VARCHAR(10) NOT NULL,
  adp_co_code VARCHAR(16),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payroll_period (
  period_id UUID PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES payroll_company(company_id),
  period_number INT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  paycheck_date DATE NOT NULL,
  status VARCHAR(16) NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id, period_number)
);

CREATE TABLE IF NOT EXISTS payroll_employee_period (
  id UUID PRIMARY KEY,
  period_id UUID NOT NULL REFERENCES payroll_period(period_id) ON DELETE CASCADE,
  employee_id UUID NOT NULL,
  adp_file_number VARCHAR(20),
  confirmed BOOLEAN NOT NULL DEFAULT false,
  confirmed_at TIMESTAMPTZ,
  confirmed_by UUID,
  rate_cents INT NOT NULL DEFAULT 0,
  ot_rate_cents INT NOT NULL DEFAULT 0,
  ot2_rate_cents INT NOT NULL DEFAULT 0,
  adjustments_json JSONB NOT NULL DEFAULT '{}',
  segments_json JSONB NOT NULL DEFAULT '[]',
  snapshot_hash VARCHAR(64),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (period_id, employee_id)
);

CREATE TABLE IF NOT EXISTS payroll_audit_log (
  id UUID PRIMARY KEY,
  company_id UUID NOT NULL,
  period_id UUID,
  employee_id UUID,
  action VARCHAR(32) NOT NULL,
  before_json JSONB,
  after_json JSONB,
  actor_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payroll_audit_period ON payroll_audit_log (period_id, created_at DESC);

CREATE TABLE IF NOT EXISTS adp_column_mapping (
  id UUID PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES payroll_company(company_id),
  version_label VARCHAR(64) NOT NULL,
  co_code VARCHAR(16) NOT NULL,
  mapping_json JSONB NOT NULL,
  effective_from DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
