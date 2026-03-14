import { useState } from "react";
import { useAuth } from "../../../auth/AuthContext";
import { StudentsTablePage } from "../../shared/pages/StudentsTablePage";
import { AddStudentModal } from "../components/AddStudentModal";

export function SSStudentsPage() {
  const { role } = useAuth();
  const [addOpen, setAddOpen] = useState(false);

  if (role !== "StudentService") {
    return (
      <div className="container">
        <div className="alert-error">Forbidden</div>
      </div>
    );
  }

  return (
    <>
      <StudentsTablePage
        title="Students"
        readOnly={false}
        showDeletedTabs={true}
        allowAdd={true}
        allowEdit={true}
        allowDelete={true}
        onAddStudent={() => setAddOpen(true)}
      />

      <AddStudentModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onCreated={() => window.location.reload()}
      />
    </>
  );
}