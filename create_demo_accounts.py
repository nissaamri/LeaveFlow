
import getpass
import sys

sys.path.insert(0, "backend")

from app.core.security import hash_password


def main():
    password = getpass.getpass("Enter shared demo password (minimum 8 characters): ")
    confirm = getpass.getpass("Confirm demo password: ")

    if len(password) < 8:
        print("Password must be at least 8 characters.")
        return

    if password != confirm:
        print("Passwords do not match.")
        return

    password_hash = hash_password(password)
    safe_hash = password_hash.replace("'", "''")

    sql = f"""
WITH dept AS (
    INSERT INTO departments (department_name)
    VALUES ('Information Technology')
    RETURNING department_id
),
admin_account AS (
    INSERT INTO employees
        (full_name, email, password_hash, role, department_id, manager_id)
    SELECT
        'LeaveFlow Administrator',
        'admin@leaveflow.com',
        '{safe_hash}',
        'hr_admin',
        department_id,
        NULL
    FROM dept
),
manager_account AS (
    INSERT INTO employees
        (full_name, email, password_hash, role, department_id, manager_id)
    SELECT
        'Daniel Wong',
        'manager@leaveflow.com',
        '{safe_hash}',
        'manager',
        department_id,
        NULL
    FROM dept
    RETURNING employee_id
)
INSERT INTO employees
    (full_name, email, password_hash, role, department_id, manager_id)
SELECT
    v.full_name,
    v.email,
    '{safe_hash}',
    'employee',
    d.department_id,
    m.employee_id
FROM (
    VALUES
        ('Sarah Lim', 'sarah@leaveflow.com'),
        ('Alex Tan', 'alex@leaveflow.com'),
        ('Aisha Rahman', 'aisha@leaveflow.com')
) AS v(full_name, email)
CROSS JOIN dept d
CROSS JOIN manager_account m;
"""

    print("\n--- COPY THE SQL BELOW INTO NEON SQL EDITOR ---")
    print(sql)
    print("--- END SQL ---")


if __name__ == "__main__":
    main()
