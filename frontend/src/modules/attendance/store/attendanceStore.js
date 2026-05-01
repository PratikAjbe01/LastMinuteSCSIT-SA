// src/features/smart-attendance/store/attendanceStore.js
import { create } from "zustand";
import { persist } from "zustand/middleware";

const useAttendanceStore = create(
  persist(
    (set, get) => ({
      currentSession:  null,
      qrToken:         null,
      attendanceList:  [],
      isSessionActive: false,

      startSession: (session) =>
        set({
          currentSession:  session,
          isSessionActive: true,
          attendanceList:  [],
          qrToken:         null,
        }),

      endSession: () =>
        set({
          currentSession:  null,
          qrToken:         null,
          attendanceList:  [],
          isSessionActive: false,
        }),

      setQrToken: (token) => set({ qrToken: token }),

      addAttendanceRecord: (record) =>
        set((state) => {
          const exists = state.attendanceList.some(
            (r) => r.studentId === record.studentId
          );
          if (exists) return state;
          return { attendanceList: [record, ...state.attendanceList] };
        }),

      removeAttendanceRecord: (studentId) =>
        set((state) => ({
          attendanceList: state.attendanceList.filter(
            (s) => s.studentId !== studentId
          ),
        })),

      setAttendanceList: (list) => set({ attendanceList: list }),

      getSessionId: () => get().currentSession?.sessionId,
    }),
    {
      name: "attendance-storage",
      partialize: (state) => ({
        currentSession:  state.currentSession,
        isSessionActive: state.isSessionActive,
        attendanceList:  state.attendanceList,
      }),
    }
  )
);

export default useAttendanceStore;