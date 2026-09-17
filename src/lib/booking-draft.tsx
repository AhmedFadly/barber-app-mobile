import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

export type BookingDraft = {
  branchId: string | null;
  serviceIds: string[];
  /** null = any available barber */
  barberId: string | null;
  date: string | null;
  slot: { startsAt: string; time: string } | null;
  notes: string;
  /** Set when moving an existing booking rather than creating one. */
  rescheduleId: string | null;
};

const empty: BookingDraft = { branchId: null, serviceIds: [], barberId: null, date: null, slot: null, notes: "", rescheduleId: null };

type DraftState = {
  draft: BookingDraft;
  update: (patch: Partial<BookingDraft>) => void;
  start: (initial?: Partial<BookingDraft>) => void;
  toggleService: (id: string) => void;
};

const DraftContext = createContext<DraftState | null>(null);

export function BookingDraftProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState<BookingDraft>(empty);
  const value = useMemo<DraftState>(
    () => ({
      draft,
      update: (patch) => setDraft((d) => ({ ...d, ...patch })),
      start: (initial) => setDraft({ ...empty, ...initial }),
      // Changing services changes duration, so any picked time is no longer valid.
      toggleService: (id) =>
        setDraft((d) => ({ ...d, slot: null, serviceIds: d.serviceIds.includes(id) ? d.serviceIds.filter((s) => s !== id) : [...d.serviceIds, id] })),
    }),
    [draft],
  );
  return <DraftContext.Provider value={value}>{children}</DraftContext.Provider>;
}

export function useBookingDraft() {
  const ctx = useContext(DraftContext);
  if (!ctx) throw new Error("useBookingDraft must be used inside BookingDraftProvider");
  return ctx;
}
