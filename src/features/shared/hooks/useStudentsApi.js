import { useCallback, useState } from "react";
import { useAuth } from "../../../auth/AuthContext";
import {
  listStudents,
  createStudent,
  updateStudent,
  deleteStudent,
} from "../api/studentsApi";

export function useStudentsApi() {
  const { token } = useAuth();

  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");

  const list = useCallback(
    async (params) => {
      if (!token) return null;
      return await listStudents(params, token);
    },
    [token]
  );

  const create = useCallback(
    async (payload) => {
      if (!token) return;
      setError("");
      setActionLoading(true);
      try {
        await createStudent(payload, token);
      } catch (e) {
        setError(e?.message || "Create student failed.");
        throw e;
      } finally {
        setActionLoading(false);
      }
    },
    [token]
  );

  const update = useCallback(
    async (id, payload) => {
      if (!token || !id) return;
      setError("");
      setActionLoading(true);
      try {
        await updateStudent(id, payload, token);
      } catch (e) {
        setError(e?.message || "Update student failed.");
        throw e;
      } finally {
        setActionLoading(false);
      }
    },
    [token]
  );

  const remove = useCallback(
    async (id) => {
      if (!token || !id) return;
      setError("");
      setActionLoading(true);
      try {
        await deleteStudent(id, token);
      } catch (e) {
        setError(e?.message || "Delete student failed.");
        throw e;
      } finally {
        setActionLoading(false);
      }
    },
    [token]
  );

  return {
    list,
    create,
    update,
    remove,
    actionLoading,
    error,
    clearError: () => setError(""),
  };
}
