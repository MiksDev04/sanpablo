import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import {
  getUsers,
  getBusinesses,
  getGuestRecords,
  getMonthlySubmissions,
  getRegistrationRequests,
  getMessages,
  addGuestRecords as storageAddGuestRecords,
  addRegistrationRequest as storageAddRegistrationRequest,
  updateRegistrationRequest as storageUpdateRegistrationRequest,
  addMessage as storageAddMessage,
  submitMonthlySubmission as storageSubmitMonthlySubmission,
  clearGuestRecordsAndMonthlySubmissions as storageClearGuestRecordsAndMonthlySubmissions,
} from '../data/storage';
import type {
  User,
  Business,
  GuestRecord,
  MonthlySubmission,
  RegistrationRequest,
  Message,
} from '../types';

interface DataContextType {
  users: User[];
  businesses: Business[];
  guestRecords: GuestRecord[];
  monthlySubmissions: MonthlySubmission[];
  registrationRequests: RegistrationRequest[];
  messages: Message[];
  refresh: () => void;
  addGuestRecords: (records: Omit<GuestRecord, 'id' | 'createdAt'>[]) => void;
  addRegistrationRequest: (req: Omit<RegistrationRequest, 'id'>) => void;
  updateRegistrationRequest: (id: string, updates: Partial<RegistrationRequest>) => void;
  addMessage: (msg: Omit<Message, 'id' | 'createdAt'>) => void;
  submitMonthlySubmission: (businessId: string, month: number, year: number) => void;
  resetGuestRecordsAndReports: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<User[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [guestRecords, setGuestRecords] = useState<GuestRecord[]>([]);
  const [monthlySubmissions, setMonthlySubmissions] = useState<MonthlySubmission[]>([]);
  const [registrationRequests, setRegistrationRequests] = useState<RegistrationRequest[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);

  const refresh = useCallback(() => {
    setUsers(getUsers());
    setBusinesses(getBusinesses());
    setGuestRecords(getGuestRecords());
    setMonthlySubmissions(getMonthlySubmissions());
    setRegistrationRequests(getRegistrationRequests());
    setMessages(getMessages());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addGuestRecords = useCallback((records: Omit<GuestRecord, 'id' | 'createdAt'>[]) => {
    storageAddGuestRecords(records);
    refresh();
  }, [refresh]);

  const addRegistrationRequest = useCallback((req: Omit<RegistrationRequest, 'id'>) => {
    storageAddRegistrationRequest(req);
    refresh();
  }, [refresh]);

  const updateRegistrationRequest = useCallback((id: string, updates: Partial<RegistrationRequest>) => {
    storageUpdateRegistrationRequest(id, updates);
    refresh();
  }, [refresh]);

  const addMessage = useCallback((msg: Omit<Message, 'id' | 'createdAt'>) => {
    storageAddMessage(msg);
    refresh();
  }, [refresh]);

  const submitMonthlySubmission = useCallback((businessId: string, month: number, year: number) => {
    storageSubmitMonthlySubmission(businessId, month, year);
    refresh();
  }, [refresh]);

  const resetGuestRecordsAndReports = useCallback(() => {
    storageClearGuestRecordsAndMonthlySubmissions();
    refresh();
  }, [refresh]);

  return (
    <DataContext.Provider
      value={{
        users,
        businesses,
        guestRecords,
        monthlySubmissions,
        registrationRequests,
        messages,
        refresh,
        addGuestRecords,
        addRegistrationRequest,
        updateRegistrationRequest,
        addMessage,
        submitMonthlySubmission,
        resetGuestRecordsAndReports,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (ctx === undefined) {
    throw new Error('useData must be used within DataProvider');
  }
  return ctx;
}
