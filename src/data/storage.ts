import type {
  User,
  Business,
  GuestRecord,
  MonthlySubmission,
  Message,
  RegistrationRequest,
} from '../types';

const STORAGE_KEYS = {
  users: 'sanpablo_users',
  businesses: 'sanpablo_businesses',
  guestRecords: 'sanpablo_guest_records',
  monthlySubmissions: 'sanpablo_monthly_submissions',
  registrationRequests: 'sanpablo_registration_requests',
  messages: 'sanpablo_messages',
} as const;

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function save<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

const seedUsers: User[] = [
  { id: 'user-1', email: 'admin@sanpablo.gov.ph', role: 'admin', status: 'approved' },
  {
    id: 'user-2',
    email: 'resort@palmspring.com',
    role: 'business',
    status: 'approved',
    business: {
      id: 'biz-1',
      userId: 'user-2',
      businessName: 'Palm Spring Resort & Hotel',
      permitNumber: 'BP-2024-001',
      address: 'Banaybanay, San Pablo City, Laguna',
      contactNumber: '0917-123-4567',
      ownerName: 'Juan Dela Cruz',
    },
  },
  {
    id: 'user-3',
    email: 'hotel@sevenlakes.com',
    role: 'business',
    status: 'approved',
    business: {
      id: 'biz-2',
      userId: 'user-3',
      businessName: 'Seven Lakes Hotel',
      permitNumber: 'BP-2024-002',
      address: 'San Lorenzo, San Pablo City, Laguna',
      contactNumber: '0918-234-5678',
      ownerName: 'Maria Santos',
    },
  },
];

const seedBusinesses: Business[] = [
  {
    id: 'biz-1',
    userId: 'user-2',
    businessName: 'Palm Spring Resort & Hotel',
    permitNumber: 'BP-2024-001',
    address: 'Banaybanay, San Pablo City, Laguna',
    contactNumber: '0917-123-4567',
    ownerName: 'Juan Dela Cruz',
  },
  {
    id: 'biz-2',
    userId: 'user-3',
    businessName: 'Seven Lakes Hotel',
    permitNumber: 'BP-2024-002',
    address: 'San Lorenzo, San Pablo City, Laguna',
    contactNumber: '0918-234-5678',
    ownerName: 'Maria Santos',
  },
];

const seedGuestRecords: GuestRecord[] = [];

const seedMonthlySubmissions: MonthlySubmission[] = [];

const seedRegistrationRequests: RegistrationRequest[] = [
  {
    id: 'req-1',
    userId: 'user-pending',
    businessName: 'Lakeview Inn',
    permitNumber: 'BP-2025-003',
    address: 'San Antonio, San Pablo City, Laguna',
    contactNumber: '0919-345-6789',
    ownerName: 'Pedro Reyes',
    email: 'lakeview@inn.com',
    status: 'pending',
  },
];

const seedMessages: Message[] = [
  { id: 'msg-1', senderId: 'user-1', receiverId: 'user-2', subject: 'Monthly Submission Reminder', message: 'Please submit your February 2025 guest data by March 5, 2025.', readStatus: false, createdAt: '2025-02-25T09:00:00Z' },
  { id: 'msg-2', senderId: 'user-1', receiverId: 'user-2', subject: 'System Maintenance Notice', message: 'Scheduled maintenance on March 10, 2025 from 12AM-4AM. The system will be temporarily unavailable.', readStatus: true, createdAt: '2025-02-20T14:00:00Z' },
];

function initSeed(): void {
  if (!localStorage.getItem(STORAGE_KEYS.users)) {
    save(STORAGE_KEYS.users, seedUsers);
    save(STORAGE_KEYS.businesses, seedBusinesses);
    save(STORAGE_KEYS.guestRecords, seedGuestRecords);
    save(STORAGE_KEYS.monthlySubmissions, seedMonthlySubmissions);
    save(STORAGE_KEYS.registrationRequests, seedRegistrationRequests);
    save(STORAGE_KEYS.messages, seedMessages);
  }
}

export function getUsers(): User[] {
  initSeed();
  return load(STORAGE_KEYS.users, seedUsers);
}

export function getBusinesses(): Business[] {
  initSeed();
  return load(STORAGE_KEYS.businesses, seedBusinesses);
}

export function getGuestRecords(): GuestRecord[] {
  initSeed();
  return load(STORAGE_KEYS.guestRecords, seedGuestRecords);
}

export function getMonthlySubmissions(): MonthlySubmission[] {
  initSeed();
  return load(STORAGE_KEYS.monthlySubmissions, seedMonthlySubmissions);
}

export function getRegistrationRequests(): RegistrationRequest[] {
  initSeed();
  return load(STORAGE_KEYS.registrationRequests, seedRegistrationRequests);
}

export function getMessages(): Message[] {
  initSeed();
  return load(STORAGE_KEYS.messages, seedMessages);
}

function generateId(): string {
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export function addGuestRecords(records: Omit<GuestRecord, 'id' | 'createdAt'>[]): void {
  const existing = getGuestRecords();
  const now = new Date().toISOString();
  const newRecords: GuestRecord[] = records.map((r) => ({
    ...r,
    id: generateId(),
    createdAt: now,
  }));
  save(STORAGE_KEYS.guestRecords, [...existing, ...newRecords]);
}

export function addRegistrationRequest(req: Omit<RegistrationRequest, 'id'>): void {
  const existing = getRegistrationRequests();
  const newReq: RegistrationRequest = { ...req, id: generateId() };
  save(STORAGE_KEYS.registrationRequests, [...existing, newReq]);
}

export function updateRegistrationRequest(id: string, updates: Partial<RegistrationRequest>): void {
  const existing = getRegistrationRequests();
  const idx = existing.findIndex((r) => r.id === id);
  if (idx === -1) return;
  const updated = { ...existing[idx], ...updates };
  const next = [...existing];
  next[idx] = updated;
  save(STORAGE_KEYS.registrationRequests, next);

  if (updates.status === 'approved') {
    const r = updated;
    const userId = generateId();
    const bizId = generateId();
    const newUser: User = {
      id: userId,
      email: r.email,
      role: 'business',
      status: 'approved',
      business: {
        id: bizId,
        userId,
        businessName: r.businessName,
        permitNumber: r.permitNumber,
        address: r.address,
        contactNumber: r.contactNumber,
        ownerName: r.ownerName,
      },
    };
    const newBiz: Business = {
      id: bizId,
      userId,
      businessName: r.businessName,
      permitNumber: r.permitNumber,
      address: r.address,
      contactNumber: r.contactNumber,
      ownerName: r.ownerName,
    };
    save(STORAGE_KEYS.users, [...getUsers(), newUser]);
    save(STORAGE_KEYS.businesses, [...getBusinesses(), newBiz]);
  }
}

export function addMessage(msg: Omit<Message, 'id' | 'createdAt'>): void {
  const existing = getMessages();
  const newMsg: Message = {
    ...msg,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };
  save(STORAGE_KEYS.messages, [...existing, newMsg]);
}

export function submitMonthlySubmission(businessId: string, month: number, year: number): void {
  const existing = getMonthlySubmissions();
  const idx = existing.findIndex((s) => s.businessId === businessId && s.month === month && s.year === year);
  const updated: MonthlySubmission = {
    id: idx >= 0 ? existing[idx].id : generateId(),
    businessId,
    month,
    year,
    status: 'submitted',
    submittedAt: new Date().toISOString(),
  };
  const next = idx >= 0 ? [...existing] : [...existing, updated];
  if (idx >= 0) next[idx] = updated;
  save(STORAGE_KEYS.monthlySubmissions, next);
}

export function clearGuestRecordsAndMonthlySubmissions(): void {
  save(STORAGE_KEYS.guestRecords, []);
  save(STORAGE_KEYS.monthlySubmissions, []);
}
