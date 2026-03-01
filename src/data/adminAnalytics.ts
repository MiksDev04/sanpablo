import type { GuestRecord, Business, MonthlySubmission, RegistrationRequest } from '../types';

export function getTotalActiveBusinesses(businesses: Business[]): number {
  return businesses.length;
}

export function getTotalTouristsMonth(guestRecords: GuestRecord[]): number {
  const now = new Date();
  return guestRecords
    .filter((r) => {
      const d = new Date(r.checkIn);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((sum, r) => sum + r.numberOfGuests, 0);
}

export function getTotalTouristsYear(guestRecords: GuestRecord[]): number {
  const now = new Date();
  return guestRecords
    .filter((r) => new Date(r.checkIn).getFullYear() === now.getFullYear())
    .reduce((sum, r) => sum + r.numberOfGuests, 0);
}

export function getPendingRegistrations(registrationRequests: RegistrationRequest[]): number {
  return registrationRequests.filter((r) => r.status === 'pending').length;
}

export function getSubmissionComplianceRate(
  businesses: Business[],
  monthlySubmissions: MonthlySubmission[]
): string {
  const total = businesses.length;
  const now = new Date();
  const prevMonth = now.getMonth() === 0 ? 11 : now.getMonth();
  const prevYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
  const submittedCount = monthlySubmissions.filter(
    (s) => s.month === prevMonth + 1 && s.year === prevYear && s.status === 'submitted'
  ).length;
  const rate = total > 0 ? Math.round((submittedCount / total) * 100) : 0;
  return `${rate}%`;
}

export function getTopNationalities(guestRecords: GuestRecord[], count = 5) {
  const map = new Map<string, number>();
  guestRecords.forEach((r) => {
    const total = (map.get(r.nationality) || 0) + r.numberOfGuests;
    map.set(r.nationality, total);
  });
  return Array.from(map.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, count)
    .map(([name, value]) => ({ name, value }));
}

export function getTouristTrendData(guestRecords: GuestRecord[], months = 12) {
  const now = new Date();
  const result: { month: string; guests: number }[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const month = d.getMonth() + 1;
    const year = d.getFullYear();
    const total = guestRecords
      .filter((r) => {
        const checkIn = new Date(r.checkIn);
        return checkIn.getMonth() + 1 === month && checkIn.getFullYear() === year;
      })
      .reduce((sum, r) => sum + r.numberOfGuests, 0);
    result.push({
      month: d.toLocaleString('default', { month: 'short', year: '2-digit' }),
      guests: total,
    });
  }
  return result;
}
