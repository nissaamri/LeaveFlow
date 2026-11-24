
import getpass

from app.core.database import SessionLocal
from app.core.security import hash_password
from app.models.employee import Employee


def create_admin():
    db = SessionLocal()

    try:
        email = "admin@leaveflow.com"

        existing_admin = db.query(Employee).filter(
            Employee.email == email
        ).first()

        if existing_admin:
            print("An account with this email already exists.")
            print("No new account was created.")
            return

        full_name = "LeaveFlow Administrator"

        password = getpass.getpass("Enter a password (minimum 8 characters): ")
        confirm_password = getpass.getpass("Confirm your password: ")

        if len(password) < 8:
            print("Password must contain at least 8 characters.")
            return

        if password != confirm_password:
            print("Passwords do not match.")
            return

        admin = Employee(
            full_name=full_name,
            email=email,
            password_hash=hash_password(password),
            role="hr_admin",
            department_id=2,
            manager_id=None
        )

        db.add(admin)
        db.commit()
        db.refresh(admin)

        print("\nHR Admin account created successfully!")
        print(f"Employee ID: {admin.employee_id}")
        print(f"Name: {admin.full_name}")
        print(f"Email: {admin.email}")
        print(f"Role: {admin.role}")

    except Exception as error:
        db.rollback()
        print(f"Error creating HR Admin: {error}")

    finally:
        db.close()


if __name__ == "__main__":
    create_admin()
