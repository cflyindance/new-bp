CREATE TABLE IF NOT EXISTS schema_migrations (
  version INTEGER PRIMARY KEY,
  applied_at TEXT NOT NULL
);

CREATE TABLE system_settings (
  key TEXT PRIMARY KEY,
  value_json TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL,
  display_name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'editor', 'viewer')),
  active INTEGER NOT NULL CHECK (active IN (0, 1)),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE sessions (
  id_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  csrf_hash TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  absolute_expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL
);

CREATE TABLE dictionaries (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  code TEXT NOT NULL,
  label TEXT NOT NULL,
  sort_order INTEGER NOT NULL,
  active INTEGER NOT NULL CHECK (active IN (0, 1)),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE import_jobs (
  id TEXT PRIMARY KEY,
  file_name TEXT NOT NULL,
  file_hash TEXT NOT NULL,
  status TEXT NOT NULL,
  summary_json TEXT NOT NULL,
  source_path TEXT,
  error_message TEXT,
  created_by TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TEXT NOT NULL,
  committed_at TEXT
);

CREATE TABLE requirements (
  id TEXT PRIMARY KEY,
  requirement_no TEXT NOT NULL,
  jira_ticket TEXT,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  use_case TEXT,
  notes TEXT,
  status TEXT NOT NULL CHECK (
    status IN (
      'review_pending',
      'design_pending',
      'scheduling_pending',
      'development',
      'testing',
      'completed',
      'paused',
      'rejected'
    )
  ),
  priority TEXT CHECK (priority IS NULL OR priority IN ('urgent', 'high', 'medium', 'low')),
  requirement_type_id TEXT REFERENCES dictionaries(id) ON DELETE RESTRICT,
  source_id TEXT REFERENCES dictionaries(id) ON DELETE RESTRICT,
  problem_category_id TEXT REFERENCES dictionaries(id) ON DELETE RESTRICT,
  industry_id TEXT REFERENCES dictionaries(id) ON DELETE RESTRICT,
  customer_manager TEXT,
  implementation_side TEXT CHECK (
    implementation_side IS NULL OR implementation_side IN ('frontend', 'backend', 'both')
  ),
  proposed_at TEXT,
  planned_year INTEGER,
  planned_month INTEGER CHECK (planned_month IS NULL OR planned_month BETWEEN 1 AND 12),
  version_no TEXT,
  development_started_at TEXT,
  development_completed_at TEXT,
  pos_merge_version TEXT,
  is_highlighted INTEGER NOT NULL CHECK (is_highlighted IN (0, 1)),
  paused_from_status TEXT CHECK (
    paused_from_status IS NULL OR paused_from_status IN (
      'review_pending',
      'design_pending',
      'scheduling_pending',
      'development',
      'testing',
      'completed'
    )
  ),
  source_sheet TEXT,
  source_row INTEGER,
  source_status TEXT,
  import_job_id TEXT REFERENCES import_jobs(id) ON DELETE RESTRICT,
  row_version INTEGER NOT NULL DEFAULT 1,
  deleted_at TEXT,
  deleted_by TEXT REFERENCES users(id) ON DELETE RESTRICT,
  created_by TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  updated_by TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE requirement_product_lines (
  requirement_id TEXT REFERENCES requirements(id) ON DELETE CASCADE,
  dictionary_id TEXT REFERENCES dictionaries(id) ON DELETE RESTRICT,
  PRIMARY KEY (requirement_id, dictionary_id)
);

CREATE TABLE requirement_mids (
  requirement_id TEXT REFERENCES requirements(id) ON DELETE CASCADE,
  mid TEXT NOT NULL,
  PRIMARY KEY (requirement_id, mid)
);

CREATE TABLE requirement_assignees (
  id TEXT PRIMARY KEY,
  requirement_id TEXT REFERENCES requirements(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'developer', 'tester')),
  user_id TEXT REFERENCES users(id) ON DELETE RESTRICT,
  display_name TEXT NOT NULL,
  sort_order INTEGER NOT NULL
);

CREATE TABLE requirement_followers (
  requirement_id TEXT REFERENCES requirements(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  PRIMARY KEY (requirement_id, user_id)
);

CREATE TABLE audit_events (
  id TEXT PRIMARY KEY,
  actor_user_id TEXT REFERENCES users(id) ON DELETE RESTRICT,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  before_json TEXT,
  after_json TEXT,
  metadata_json TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE import_rows (
  id TEXT PRIMARY KEY,
  import_job_id TEXT NOT NULL REFERENCES import_jobs(id) ON DELETE RESTRICT,
  sheet_name TEXT NOT NULL,
  row_number INTEGER NOT NULL,
  raw_json TEXT NOT NULL,
  normalized_json TEXT NOT NULL,
  issue_json TEXT NOT NULL,
  decision_json TEXT
);

CREATE TABLE export_jobs (
  id TEXT PRIMARY KEY,
  filter_json TEXT NOT NULL,
  row_count INTEGER,
  file_name TEXT,
  status TEXT NOT NULL,
  error_message TEXT,
  created_by TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TEXT NOT NULL,
  completed_at TEXT,
  expires_at TEXT
);

CREATE TABLE backup_records (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL,
  file_name TEXT NOT NULL,
  manifest_name TEXT NOT NULL,
  sha256 TEXT NOT NULL,
  byte_size INTEGER NOT NULL,
  schema_version INTEGER NOT NULL,
  created_by TEXT REFERENCES users(id) ON DELETE RESTRICT,
  created_at TEXT NOT NULL
);

CREATE UNIQUE INDEX users_username_unique ON users(lower(username));
CREATE UNIQUE INDEX requirements_number_unique ON requirements(requirement_no);
CREATE INDEX requirements_active_updated_idx ON requirements(deleted_at, updated_at DESC);
CREATE INDEX requirements_jira_idx ON requirements(jira_ticket);
CREATE UNIQUE INDEX dictionaries_type_code_unique ON dictionaries(type, code);
CREATE UNIQUE INDEX followers_unique ON requirement_followers(requirement_id, user_id);
CREATE INDEX sessions_id_hash_idx ON sessions(id_hash);
CREATE INDEX audit_resource_idx ON audit_events(resource_type, resource_id, created_at DESC);
CREATE UNIQUE INDEX requirement_assignees_one_owner_idx
  ON requirement_assignees(requirement_id)
  WHERE role = 'owner';
