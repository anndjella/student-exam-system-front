import { useAuth } from "../../../auth/AuthContext";
import { StudentsTablePage } from "../../shared/pages/StudentsTablePage";

export function TeacherStudentsPage() {
  const { role } = useAuth();
  if (role !== "Teacher") {
    return (
      <div className="container">
        <div className="alert-error">Forbidden</div>
      </div>
    );
  }

  return <StudentsTablePage readOnly={true} allowCreate={false} title="Students" />;
}
