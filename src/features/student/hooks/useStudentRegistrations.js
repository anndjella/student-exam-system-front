import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../../../auth/AuthContext";
import {
  cancelRegistration,
  createRegistration,
  fetchMyActiveRegistrations,
  fetchNotPassedSubjects,
  fetchOpenTermsForRegistration,
} from "../api/studentRegistrationsApi";

function prettyErrorMessage(message) {
  if (!message) return "Request failed.";
  try {
    const obj = JSON.parse(message);
    return obj.detail || obj.Detail || obj.title || obj.Title || "Request failed.";
  } catch {
    return message;
  }
}

function termIdOf(t) {
  if (!t) return null;
  return t.termID ?? t.id ?? t.termId ?? null;
}

function termLabel(t) {
  if (!t) return "Term";
  return t.name ?? t.termName ?? t.label ?? "Term";
}

export function useStudentRegistrations() {
  const { token } = useAuth();

  const [activeRegs, setActiveRegs] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [terms, setTerms] = useState([]);
  const [selectedTermId, setSelectedTermId] = useState(null);

  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");

  const reloadAll = useCallback(async () => {
    setError("");
    setLoading(true);
    try {
      const [regs, subs, openTerms] = await Promise.all([
        fetchMyActiveRegistrations(token),
        fetchNotPassedSubjects(token),
        fetchOpenTermsForRegistration(token),
      ]);

      setActiveRegs(regs || []);
      setSubjects(subs || []);
      setTerms(openTerms || []);

      const first = (openTerms || [])[0];
      setSelectedTermId(termIdOf(first));
    } catch (e) {
      setError(prettyErrorMessage(e?.message));
      setActiveRegs([]);
      setSubjects([]);
      setTerms([]);
      setSelectedTermId(null);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    reloadAll();
  }, [reloadAll]);

  const canRegister = useMemo(() => {
    return Boolean(selectedTermId) && (subjects?.length || 0) > 0;
  }, [selectedTermId, subjects]);

  const create = useCallback(
    async (subjectId) => {
      if (!selectedTermId) return;
      setError("");
      setActionLoading(true);
      try {
        await createRegistration({ subjectID: subjectId, termID: selectedTermId }, token);
        const regs = await fetchMyActiveRegistrations(token);
        setActiveRegs(regs || []);
      } catch (e) {
        setError(prettyErrorMessage(e?.message));
        throw e;
      } finally {
        setActionLoading(false);
      }
    },
    [token, selectedTermId]
  );

  const cancel = useCallback(
    async (subjectId, termId) => {
      setError("");
      setActionLoading(true);
      try {
        await cancelRegistration(subjectId, termId, token);
        const regs = await fetchMyActiveRegistrations(token);
        setActiveRegs(regs || []);
      } catch (e) {
        setError(prettyErrorMessage(e?.message));
        throw e;
      } finally {
        setActionLoading(false);
      }
    },
    [token]
  );

  return {
    activeRegs,
    subjects,
    terms,
    selectedTermId,
    setSelectedTermId,

    termIdOf,
    termLabel,

    loading,
    actionLoading,
    error,

    reloadAll,
    canRegister,
    create,
    cancel,
  };
}
