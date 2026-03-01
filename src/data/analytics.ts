import type { GuestRecord } from '../types';

function differenceInDays(dateLeft: Date, dateRight: Date): number {
  const msPerDay = 86_400_000;
  return Math.round((dateRight.getTime() - dateLeft.getTime()) / msPerDay);
}

export function getBusinessRecords(guestRecords: GuestRecord[], businessId: string): GuestRecord[] {
  return guestRecords.filter((r) => r.businessId === businessId);
}

export function getRecordsForMonth(guestRecords: GuestRecord[], businessId: string, month: number, year: number): GuestRecord[] {
  return getBusinessRecords(guestRecords, businessId).filter((r) => {
    const checkIn = new Date(r.checkIn);
    return checkIn.getMonth() + 1 === month && checkIn.getFullYear() === year;
  });
}

export function getRecordsForYear(guestRecords: GuestRecord[], businessId: string, year: number): GuestRecord[] {
  return getBusinessRecords(guestRecords, businessId).filter((r) => new Date(r.checkIn).getFullYear() === year);
}

export function getTotalGuestsThisMonth(guestRecords: GuestRecord[], businessId: string): number {
  const now = new Date();
  return getRecordsForMonth(guestRecords, businessId, now.getMonth() + 1, now.getFullYear()).reduce(
    (sum, r) => sum + r.numberOfGuests,
    0
  );
}

export function getTotalGuestsThisYear(guestRecords: GuestRecord[], businessId: string): number {
  const now = new Date();
  return getRecordsForYear(guestRecords, businessId, now.getFullYear()).reduce((sum, r) => sum + r.numberOfGuests, 0);
}

export function getNationalityBreakdown(guestRecords: GuestRecord[], businessId: string, month?: number, year?: number) {
  const records = month && year
    ? getRecordsForMonth(guestRecords, businessId, month, year)
    : getBusinessRecords(guestRecords, businessId);
  const map = new Map<string, number>();
  records.forEach((r) => {
    const total = (map.get(r.nationality) || 0) + r.numberOfGuests;
    map.set(r.nationality, total);
  });
  return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
}

export function getMonthlyTouristCount(guestRecords: GuestRecord[], businessId: string, year: number) {
  const records = getRecordsForYear(guestRecords, businessId, year);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  return months.map((month) => {
    const total = records
      .filter((r) => new Date(r.checkIn).getMonth() + 1 === month)
      .reduce((sum, r) => sum + r.numberOfGuests, 0);
    return {
      month: new Date(year, month - 1).toLocaleString('default', { month: 'short' }),
      guests: total,
    };
  });
}

export function getGenderDistribution(guestRecords: GuestRecord[], businessId: string, month?: number, year?: number) {
  const records = month && year
    ? getRecordsForMonth(guestRecords, businessId, month, year)
    : getBusinessRecords(guestRecords, businessId);
  const map = new Map<string, number>();
  records.forEach((r) => {
    const label = r.gender === 'lgbt' ? 'LGBT+' : r.gender.charAt(0).toUpperCase() + r.gender.slice(1);
    const total = (map.get(label) || 0) + r.numberOfGuests;
    map.set(label, total);
  });
  return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
}

export function getAverageLengthOfStay(guestRecords: GuestRecord[], businessId: string, month?: number, year?: number): number {
  const records = month && year
    ? getRecordsForMonth(guestRecords, businessId, month, year)
    : getBusinessRecords(guestRecords, businessId);
  if (records.length === 0) return 0;
  const totalNights = records.reduce((sum, r) => {
    const checkIn = new Date(r.checkIn);
    const checkOut = new Date(r.checkOut);
    return sum + differenceInDays(checkIn, checkOut) * r.numberOfGuests;
  }, 0);
  const totalGuests = records.reduce((sum, r) => sum + r.numberOfGuests, 0);
  return totalGuests > 0 ? Math.round((totalNights / totalGuests) * 10) / 10 : 0;
}

export function getTransportationModeData(guestRecords: GuestRecord[], businessId: string, month?: number, year?: number) {
  const records = month && year
    ? getRecordsForMonth(guestRecords, businessId, month, year)
    : getBusinessRecords(guestRecords, businessId);
  const labels: Record<string, string> = {
    private_car: 'Private Car',
    bus: 'Bus',
    van: 'Van',
    motorcycle: 'Motorcycle',
    plane: 'Plane',
    other: 'Other',
  };
  const map = new Map<string, number>();
  records.forEach((r) => {
    const label = labels[r.transportationMode] || r.transportationMode;
    const total = (map.get(label) || 0) + r.numberOfGuests;
    map.set(label, total);
  });
  const sorted = Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  return sorted.slice(0, 1).map(([name, value]) => ({ name, value })); // Most common
}
