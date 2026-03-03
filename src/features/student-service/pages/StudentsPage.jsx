import { useAuth } from "../../../auth/AuthContext";
import { StudentsTablePage } from "../../shared/pages/StudentsTablePage";

export function SSStudentsPage() {
  const { role } = useAuth();
  if (role !== "StudentService") {
    return (
      <div className="container">
        <div className="alert-error">Forbidden</div>
      </div>
    );
  }

  return <StudentsTablePage readOnly={false} allowCreate={true} title="Students" showDeletedTabs={true} />;

}
