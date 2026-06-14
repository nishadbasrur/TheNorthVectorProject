CREATE INDEX IF NOT EXISTS memories_user_id_idx ON memories (user_id);
CREATE INDEX IF NOT EXISTS memories_review_state_idx ON memories (review_state);
CREATE INDEX IF NOT EXISTS memories_memory_type_idx ON memories (memory_type);

CREATE INDEX IF NOT EXISTS goals_user_id_idx ON goals (user_id);
CREATE INDEX IF NOT EXISTS goals_status_idx ON goals (status);
CREATE INDEX IF NOT EXISTS goals_target_date_idx ON goals (target_date);

CREATE INDEX IF NOT EXISTS projects_user_id_idx ON projects (user_id);
CREATE INDEX IF NOT EXISTS projects_status_idx ON projects (status);

CREATE INDEX IF NOT EXISTS plans_user_id_idx ON plans (user_id);
CREATE INDEX IF NOT EXISTS plans_project_id_idx ON plans (project_id);
CREATE INDEX IF NOT EXISTS plans_status_idx ON plans (status);

CREATE INDEX IF NOT EXISTS tasks_user_id_idx ON tasks (user_id);
CREATE INDEX IF NOT EXISTS tasks_project_id_idx ON tasks (project_id);
CREATE INDEX IF NOT EXISTS tasks_plan_id_idx ON tasks (plan_id);
CREATE INDEX IF NOT EXISTS tasks_status_idx ON tasks (status);
CREATE INDEX IF NOT EXISTS tasks_due_date_idx ON tasks (due_date);

CREATE INDEX IF NOT EXISTS decisions_user_id_idx ON decisions (user_id);
CREATE INDEX IF NOT EXISTS decisions_project_id_idx ON decisions (project_id);
CREATE INDEX IF NOT EXISTS decisions_plan_id_idx ON decisions (plan_id);
CREATE INDEX IF NOT EXISTS decisions_status_idx ON decisions (status);

CREATE INDEX IF NOT EXISTS approvals_user_id_idx ON approvals (user_id);
CREATE INDEX IF NOT EXISTS approvals_decision_id_idx ON approvals (decision_id);
CREATE INDEX IF NOT EXISTS approvals_plan_id_idx ON approvals (plan_id);
CREATE INDEX IF NOT EXISTS approvals_status_idx ON approvals (status);

CREATE INDEX IF NOT EXISTS executions_user_id_idx ON executions (user_id);
CREATE INDEX IF NOT EXISTS executions_task_id_idx ON executions (task_id);
CREATE INDEX IF NOT EXISTS executions_plan_id_idx ON executions (plan_id);
CREATE INDEX IF NOT EXISTS executions_approval_id_idx ON executions (approval_id);
CREATE INDEX IF NOT EXISTS executions_status_idx ON executions (status);

CREATE INDEX IF NOT EXISTS reviews_user_id_idx ON reviews (user_id);
CREATE INDEX IF NOT EXISTS reviews_status_idx ON reviews (status);
CREATE INDEX IF NOT EXISTS reviews_review_date_idx ON reviews (review_date);

CREATE INDEX IF NOT EXISTS goal_projects_project_id_idx ON goal_projects (project_id);
CREATE INDEX IF NOT EXISTS goal_tasks_task_id_idx ON goal_tasks (task_id);
CREATE INDEX IF NOT EXISTS goal_plans_plan_id_idx ON goal_plans (plan_id);
CREATE INDEX IF NOT EXISTS memory_entities_entity_idx ON memory_entities (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS review_entities_entity_idx ON review_entities (entity_type, entity_id);
