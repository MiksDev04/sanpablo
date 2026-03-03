import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Eye, FileDown, Download } from 'lucide-react';
import { useData } from '../../contexts/DataContext';

interface ReportFilters {
  month: string;
  year: string;
  accommodation: string;
}

function differenceInDays(dateLeft: Date, dateRight: Date): number {
  const msPerDay = 86_400_000;
  return Math.round((dateRight.getTime() - dateLeft.getTime()) / msPerDay);
}

// Occupancy rate: avg rooms occupied on active days ÷ totalRooms × 100
function calcOccupancyRate(
  records: import('../../types').GuestRecord[],
  month: number,
  year: number,
  totalRooms: number | undefined,
): number {
  if (!totalRooms || totalRooms <= 0) return 0;
  // Fall back to 1 when roomsRented is missing/zero (records created before the field existed)
  const entryMap = new Map<string, { roomsRented: number; checkIn: string; checkOut: string }>();
  records.forEach((r) => {
    if (!entryMap.has(r.createdAt)) {
      entryMap.set(r.createdAt, { roomsRented: r.roomsRented > 0 ? r.roomsRented : 1, checkIn: r.checkIn, checkOut: r.checkOut });
    }
  });
  const pad = (n: number) => String(n).padStart(2, '0');
  const daysInMonth = new Date(year, month, 0).getDate();
  let totalRoomDays = 0;
  let activeDays = 0;
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${pad(month)}-${pad(d)}`;
    let roomsToday = 0;
    entryMap.forEach(({ roomsRented, checkIn, checkOut }) => {
      if (checkIn <= dateStr && dateStr < checkOut) roomsToday += roomsRented;
    });
    if (roomsToday > 0) { totalRoomDays += roomsToday; activeDays += 1; }
  }
  if (activeDays === 0) return 0;
  return (totalRoomDays / activeDays / totalRooms) * 100;
}

export default function AdminReports() {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => (currentYear - i).toString());
  const months = Array.from({ length: 12 }, (_, i) => (i + 1).toString());

  const { guestRecords, businesses, monthlySubmissions } = useData();
  const accommodationOptions = ['All', ...businesses.map((b) => b.businessName)];

  const { register, watch } = useForm<ReportFilters>({
    defaultValues: {
      month: '',
      year: currentYear.toString(),
      accommodation: 'All',
    },
  });

  const filters = watch();
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());

  const toggleKey = (key: string) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const rows = useMemo(() => {
    let subs = monthlySubmissions.filter((s) => s.status === 'submitted');

    if (filters.year) {
      const y = parseInt(filters.year, 10);
      if (!Number.isNaN(y)) {
        subs = subs.filter((s) => s.year === y);
      }
    }
    if (filters.month) {
      const m = parseInt(filters.month, 10);
      if (!Number.isNaN(m)) {
        subs = subs.filter((s) => s.month === m);
      }
    }
    if (filters.accommodation && filters.accommodation !== 'All') {
      const biz = businesses.find((b) => b.businessName === filters.accommodation);
      if (biz) {
        subs = subs.filter((s) => s.businessId === biz.id);
      } else {
        subs = [];
      }
    }

    return subs
      .map((s) => {
        const biz = businesses.find((b) => b.id === s.businessId);
        const key = `${s.businessId}-${s.year}-${s.month}`;
        return {
          key,
          businessId: s.businessId,
          businessName: biz?.businessName ?? 'Unknown Accommodation',
          month: s.month,
          year: s.year,
          submittedAt: s.submittedAt ?? '',
        };
      })
      .sort((a, b) => (b.year - a.year) * 12 + (b.month - a.month));
  }, [businesses, monthlySubmissions, filters]);

  const selectedRow = rows.find((r) => r.key === selectedKey) ?? null;

  const getRecordsForRow = (row: { businessId: string; month: number; year: number }) => {
    return guestRecords.filter(
      (r) =>
        r.businessId === row.businessId &&
        new Date(r.checkIn).getMonth() + 1 === row.month &&
        new Date(r.checkIn).getFullYear() === row.year,
    );
  };

  const summary = useMemo(() => {
    if (!selectedRow) return null;
    const records = getRecordsForRow(selectedRow);

    const biz = businesses.find((b) => b.id === selectedRow.businessId) ?? null;

    const totalGuests = records.reduce((sum, r) => sum + r.numberOfGuests, 0);
    const totalGuestNights = records.reduce((sum, r) => {
      const checkIn = new Date(r.checkIn);
      const checkOut = new Date(r.checkOut);
      return sum + differenceInDays(checkIn, checkOut) * r.numberOfGuests;
    }, 0);
    const averageLengthOfStay = totalGuests > 0 ? totalGuestNights / totalGuests : 0;

    const genderMap = new Map<string, number>();
    records.forEach((r) => {
      const label = r.gender === 'lgbt' ? 'LGBT+' : r.gender.charAt(0).toUpperCase() + r.gender.slice(1);
      genderMap.set(label, (genderMap.get(label) || 0) + r.numberOfGuests);
    });
    const genderData = Array.from(genderMap.entries()).map(([name, value]) => ({ name, value }));

    const ageBracketMap = new Map<string, number>();
    records.forEach((r) => {
      const src = r.age;
      let label = '';
      if (src === '1-9' || src === '10-17') {
        label = '0–17 years old';
      } else if (src === '18-25' || src === '26-35') {
        label = '18–30 years old';
      } else if (src === '36-45') {
        label = '31–45 years old';
      } else if (src === '46-55') {
        label = '46–60 years old';
      } else if (src === '56+') {
        label = '61 years old and above';
      } else {
        label = 'Prefer not to say';
      }
      ageBracketMap.set(label, (ageBracketMap.get(label) || 0) + r.numberOfGuests);
    });
    const ageData = Array.from(ageBracketMap.entries()).map(([name, value]) => ({ name, value }));

    const nationalityMap = new Map<string, number>();
    records.forEach((r) => {
      nationalityMap.set(r.nationality, (nationalityMap.get(r.nationality) || 0) + r.numberOfGuests);
    });
    const nationalityData = Array.from(nationalityMap.entries()).map(([name, value]) => ({ name, value }));

    const purposeMap = new Map<string, number>();
    records.forEach((r) => {
      const key =
        r.purpose === 'leisure'
          ? 'Leisure / Vacation'
          : r.purpose === 'business'
            ? 'Business'
            : r.purpose === 'event'
              ? 'Events / Conference'
              : 'Others';
      purposeMap.set(key, (purposeMap.get(key) || 0) + r.numberOfGuests);
    });
    const purposeData = Array.from(purposeMap.entries()).map(([name, value]) => ({ name, value }));

    const transportationMap = new Map<string, number>();
    records.forEach((r) => {
      const label =
        r.transportationMode === 'private_car' ? 'Private Car'
        : r.transportationMode === 'bus' ? 'Bus'
        : r.transportationMode === 'van' ? 'Van'
        : r.transportationMode === 'motorcycle' ? 'Motorcycle'
        : r.transportationMode === 'plane' ? 'Plane'
        : 'Other';
      transportationMap.set(label, (transportationMap.get(label) || 0) + r.numberOfGuests);
    });
    const transportationData = Array.from(transportationMap.entries()).map(([name, value]) => ({ name, value }));

    const averageOccupancyRate = calcOccupancyRate(
      records,
      selectedRow.month,
      selectedRow.year,
      biz?.totalRooms,
    );

    return {
      business: biz,
      month: selectedRow.month,
      year: selectedRow.year,
      totalGuests,
      totalGuestNights,
      averageLengthOfStay,
      genderData,
      ageData,
      nationalityData,
      purposeData,
      transportationData,
      averageOccupancyRate,
      submittedAt: selectedRow.submittedAt,
    };
  }, [businesses, guestRecords, selectedRow]);

  const exportPDF = () => {
    const exportRows = rows.filter((r) => selectedKeys.has(r.key));
    if (!exportRows.length) return;
    const doc = new jsPDF();

    if (exportRows.length >= 2) {
      const allRecords = exportRows.flatMap((r) =>
        getRecordsForRow({ businessId: r.businessId, month: r.month, year: r.year }),
      );
      const accommodationNames = exportRows.map((r) => r.businessName).join(', ');
      const uniquePeriods = [
        ...new Set(
          exportRows.map((r) =>
            new Date(r.year, r.month - 1).toLocaleString('default', { month: 'long', year: 'numeric' }),
          ),
        ),
      ];
      const reportingPeriod = uniquePeriods.length === 1 ? uniquePeriods[0] : uniquePeriods.join('; ');

      const totalGuests = allRecords.reduce((sum, rec) => sum + rec.numberOfGuests, 0);
      const totalGuestNights = allRecords.reduce((sum, rec) => {
        return sum + differenceInDays(new Date(rec.checkIn), new Date(rec.checkOut)) * rec.numberOfGuests;
      }, 0);
      const averageLengthOfStay = totalGuests > 0 ? totalGuestNights / totalGuests : 0;

      const genderMap = new Map<string, number>();
      allRecords.forEach((rec) => {
        const label = rec.gender === 'lgbt' ? 'LGBT+' : rec.gender.charAt(0).toUpperCase() + rec.gender.slice(1);
        genderMap.set(label, (genderMap.get(label) || 0) + rec.numberOfGuests);
      });
      const genderData = Array.from(genderMap.entries()).map(([name, value]) => ({ name, value }));

      const ageBracketMap = new Map<string, number>();
      allRecords.forEach((rec) => {
        const src = rec.age;
        let label = '';
        if (src === '1-9' || src === '10-17') label = '0–17 years old';
        else if (src === '18-25' || src === '26-35') label = '18–30 years old';
        else if (src === '36-45') label = '31–45 years old';
        else if (src === '46-55') label = '46–60 years old';
        else if (src === '56+') label = '61 years old and above';
        else label = 'Prefer not to say';
        ageBracketMap.set(label, (ageBracketMap.get(label) || 0) + rec.numberOfGuests);
      });
      const ageData = Array.from(ageBracketMap.entries()).map(([name, value]) => ({ name, value }));

      const nationalityMap = new Map<string, number>();
      allRecords.forEach((rec) => {
        nationalityMap.set(rec.nationality, (nationalityMap.get(rec.nationality) || 0) + rec.numberOfGuests);
      });
      const nationalityData = Array.from(nationalityMap.entries()).map(([name, value]) => ({ name, value }));

      const purposeMap = new Map<string, number>();
      allRecords.forEach((rec) => {
        const key =
          rec.purpose === 'leisure' ? 'Leisure / Vacation'
          : rec.purpose === 'business' ? 'Business'
          : rec.purpose === 'event' ? 'Events / Conference'
          : 'Others';
        purposeMap.set(key, (purposeMap.get(key) || 0) + rec.numberOfGuests);
      });
      const purposeData = Array.from(purposeMap.entries()).map(([name, value]) => ({ name, value }));

      const transportationMapC = new Map<string, number>();
      allRecords.forEach((rec) => {
        const label =
          rec.transportationMode === 'private_car' ? 'Private Car'
          : rec.transportationMode === 'bus' ? 'Bus'
          : rec.transportationMode === 'van' ? 'Van'
          : rec.transportationMode === 'motorcycle' ? 'Motorcycle'
          : rec.transportationMode === 'plane' ? 'Plane'
          : 'Other';
        transportationMapC.set(label, (transportationMapC.get(label) || 0) + rec.numberOfGuests);
      });
      const transportationDataC = Array.from(transportationMapC.entries()).map(([name, value]) => ({ name, value }));

      doc.setFontSize(14);
      doc.text('COMBINED MONTHLY TOURISM DEMOGRAPHIC REPORT', 14, 18);
      doc.setFontSize(10);
      doc.text('Lakbay San Pablo System – Auto Generated Report', 14, 26);

      let y = 36;
      const nameLines = doc.splitTextToSize(`Accommodation(s) Included: ${accommodationNames}`, 180) as string[];
      doc.text(nameLines, 14, y);
      y += nameLines.length * 6;
      doc.text(`Reporting Period: ${reportingPeriod}`, 14, y); y += 6;
      doc.text(`Date Generated: ${new Date().toLocaleString()}`, 14, y); y += 10;

      // Combined occupancy: weighted average across rows that have totalRooms set
      const combinedOccupancy = (() => {
        let weightedSum = 0; let totalCap = 0;
        exportRows.forEach((row) => {
          const rowBiz = businesses.find((b) => b.id === row.businessId);
          if (!rowBiz?.totalRooms) return;
          const rowRecords = getRecordsForRow({ businessId: row.businessId, month: row.month, year: row.year });
          const rate = calcOccupancyRate(rowRecords, row.month, row.year, rowBiz.totalRooms);
          weightedSum += rate * rowBiz.totalRooms;
          totalCap += rowBiz.totalRooms;
        });
        return totalCap > 0 ? weightedSum / totalCap : 0;
      })();

      doc.text('1. Summary of Tourist Arrivals (Combined)', 14, y); y += 6;
      doc.text(`Total Guests Checked-in: ${totalGuests}`, 18, y); y += 6;
      doc.text(`Total Guest Nights: ${totalGuestNights}`, 18, y); y += 6;
      doc.text(`Average Length of Stay: ${averageLengthOfStay.toFixed(1)} nights`, 18, y); y += 6;
      doc.text(`Average Occupancy Rate: ${combinedOccupancy.toFixed(1)}%`, 18, y); y += 10;

      autoTable(doc, { startY: y, head: [['Gender', 'Guests']], body: genderData.map((g) => [g.name, g.value.toString()]), styles: { fontSize: 9 }, theme: 'grid', headStyles: { fillColor: [30, 58, 95] } });
      const cAfterGenderY = (doc as any).lastAutoTable.finalY + 8;
      autoTable(doc, { startY: cAfterGenderY, head: [['Age Group', 'Guests']], body: ageData.map((a) => [a.name, a.value.toString()]), styles: { fontSize: 9 }, theme: 'grid', headStyles: { fillColor: [30, 58, 95] } });
      const cAfterAgeY = (doc as any).lastAutoTable.finalY + 8;
      autoTable(doc, { startY: cAfterAgeY, head: [['Nationality', 'Guests']], body: nationalityData.map((n) => [n.name, n.value.toString()]), styles: { fontSize: 9 }, theme: 'grid', headStyles: { fillColor: [30, 58, 95] } });
      const cAfterNationalityY = (doc as any).lastAutoTable.finalY + 8;
      autoTable(doc, { startY: cAfterNationalityY, head: [['Purpose of Visit', 'Guests']], body: purposeData.map((p) => [p.name, p.value.toString()]), styles: { fontSize: 9 }, theme: 'grid', headStyles: { fillColor: [30, 58, 95] } });
      let cAfterPurposeY = (doc as any).lastAutoTable.finalY + 10;
      doc.text('5. Mode of Transportation', 14, cAfterPurposeY); cAfterPurposeY += 4;
      autoTable(doc, { startY: cAfterPurposeY, head: [['Transportation Mode', 'Guests']], body: transportationDataC.map((t) => [t.name, t.value.toString()]), styles: { fontSize: 9 }, theme: 'grid', headStyles: { fillColor: [30, 58, 95] } });

      const cFinalY = (doc as any).lastAutoTable.finalY + 10;
      doc.setFontSize(10);
      doc.text('System Validation Details', 14, cFinalY);
      doc.text(`Accommodations Included (${exportRows.length}): ${accommodationNames}`, 18, cFinalY + 6);
      doc.text('Data Status: Verified and Synced to Central Database', 18, cFinalY + 12);
      doc.text(`Digital Authentication Code: LSP-VER-${Date.now().toString().slice(-8)}`, 18, cFinalY + 18);

      doc.save(`monthly-tourism-reports-${Date.now()}.pdf`);
      return;
    }

    exportRows.forEach((r, index) => {
      const records = getRecordsForRow({ businessId: r.businessId, month: r.month, year: r.year });
      const biz = businesses.find((b) => b.id === r.businessId) ?? null;

      const totalGuests = records.reduce((sum, rec) => sum + rec.numberOfGuests, 0);
      const totalGuestNights = records.reduce((sum, rec) => {
        const checkIn = new Date(rec.checkIn);
        const checkOut = new Date(rec.checkOut);
        return sum + differenceInDays(checkIn, checkOut) * rec.numberOfGuests;
      }, 0);
      const averageLengthOfStay = totalGuests > 0 ? totalGuestNights / totalGuests : 0;

      const genderMap = new Map<string, number>();
      records.forEach((rec) => {
        const label =
          rec.gender === 'lgbt' ? 'LGBT+' : rec.gender.charAt(0).toUpperCase() + rec.gender.slice(1);
        genderMap.set(label, (genderMap.get(label) || 0) + rec.numberOfGuests);
      });
      const genderData = Array.from(genderMap.entries()).map(([name, value]) => ({ name, value }));

      const ageBracketMap = new Map<string, number>();
      records.forEach((rec) => {
        const src = rec.age;
        let label = '';
        if (src === '1-9' || src === '10-17') {
          label = '0–17 years old';
        } else if (src === '18-25' || src === '26-35') {
          label = '18–30 years old';
        } else if (src === '36-45') {
          label = '31–45 years old';
        } else if (src === '46-55') {
          label = '46–60 years old';
        } else if (src === '56+') {
          label = '61 years old and above';
        } else {
          label = 'Prefer not to say';
        }
        ageBracketMap.set(label, (ageBracketMap.get(label) || 0) + rec.numberOfGuests);
      });
      const ageData = Array.from(ageBracketMap.entries()).map(([name, value]) => ({ name, value }));

      const nationalityMap = new Map<string, number>();
      records.forEach((rec) => {
        nationalityMap.set(
          rec.nationality,
          (nationalityMap.get(rec.nationality) || 0) + rec.numberOfGuests,
        );
      });
      const nationalityData = Array.from(nationalityMap.entries()).map(([name, value]) => ({
        name,
        value,
      }));

      const purposeMap = new Map<string, number>();
      records.forEach((rec) => {
        const key =
          rec.purpose === 'leisure'
            ? 'Leisure / Vacation'
            : rec.purpose === 'business'
              ? 'Business'
              : rec.purpose === 'event'
                ? 'Events / Conference'
                : 'Others';
        purposeMap.set(key, (purposeMap.get(key) || 0) + rec.numberOfGuests);
      });
      const purposeData = Array.from(purposeMap.entries()).map(([name, value]) => ({ name, value }));

      const transportationMapS = new Map<string, number>();
      records.forEach((rec) => {
        const label =
          rec.transportationMode === 'private_car' ? 'Private Car'
          : rec.transportationMode === 'bus' ? 'Bus'
          : rec.transportationMode === 'van' ? 'Van'
          : rec.transportationMode === 'motorcycle' ? 'Motorcycle'
          : rec.transportationMode === 'plane' ? 'Plane'
          : 'Other';
        transportationMapS.set(label, (transportationMapS.get(label) || 0) + rec.numberOfGuests);
      });
      const transportationDataS = Array.from(transportationMapS.entries()).map(([name, value]) => ({ name, value }));

      const averageOccupancyRate = calcOccupancyRate(records, r.month, r.year, biz?.totalRooms);

      if (index > 0) {
        doc.addPage();
      }

    doc.setFontSize(14);
      doc.text('MONTHLY TOURISM DEMOGRAPHIC REPORT', 14, 18);
      doc.setFontSize(10);
      doc.text('Lakbay San Pablo System – Auto Generated Report', 14, 26);

      let y = 36;
      doc.text(`Accommodation Name: ${biz?.businessName ?? 'Unknown Accommodation'}`, 14, y);
      y += 6;
      doc.text(`Accreditation / Permit No.: ${biz?.permitNumber ?? 'N/A'}`, 14, y);
      y += 6;
      doc.text(`Location: ${biz?.address ?? 'N/A'}`, 14, y);
      y += 6;
      doc.text(
        `Reporting Month: ${new Date(r.year, r.month - 1).toLocaleString('default', {
          month: 'long',
          year: 'numeric',
        })}`,
        14,
        y,
      );
      y += 6;
      doc.text(`Date Generated: ${new Date().toLocaleString()}`, 14, y);
      y += 10;

      doc.text('1. Summary of Tourist Arrivals', 14, y);
      y += 6;
      doc.text(`Total Guests Checked-in: ${totalGuests}`, 18, y);
      y += 6;
      doc.text(`Total Guest Nights: ${totalGuestNights}`, 18, y);
      y += 6;
      doc.text(`Average Length of Stay: ${averageLengthOfStay.toFixed(1)} nights`, 18, y);
      y += 6;
      doc.text(`Average Occupancy Rate: ${averageOccupancyRate.toFixed(1)}%`, 18, y);
      y += 10;

      autoTable(doc, {
        startY: y,
        head: [['Gender', 'Guests']],
        body: genderData.map((g) => [g.name, g.value.toString()]),
        styles: { fontSize: 9 },
        theme: 'grid',
        headStyles: { fillColor: [30, 58, 95] },
      });

      const afterGenderY = (doc as any).lastAutoTable.finalY + 8;

      autoTable(doc, {
        startY: afterGenderY,
        head: [['Age Group', 'Guests']],
        body: ageData.map((a) => [a.name, a.value.toString()]),
        styles: { fontSize: 9 },
        theme: 'grid',
        headStyles: { fillColor: [30, 58, 95] },
      });

      const afterAgeY = (doc as any).lastAutoTable.finalY + 8;

      autoTable(doc, {
        startY: afterAgeY,
        head: [['Nationality', 'Guests']],
        body: nationalityData.map((n) => [n.name, n.value.toString()]),
        styles: { fontSize: 9 },
        theme: 'grid',
        headStyles: { fillColor: [30, 58, 95] },
      });

      const afterNationalityY = (doc as any).lastAutoTable.finalY + 8;

      autoTable(doc, {
        startY: afterNationalityY,
        head: [['Purpose of Visit', 'Guests']],
        body: purposeData.map((p) => [p.name, p.value.toString()]),
        styles: { fontSize: 9 },
        theme: 'grid',
        headStyles: { fillColor: [30, 58, 95] },
      });

      let afterPurposeY = (doc as any).lastAutoTable.finalY + 10;

      doc.text('5. Mode of Transportation', 14, afterPurposeY);
      afterPurposeY += 4;
      autoTable(doc, {
        startY: afterPurposeY,
        head: [['Transportation Mode', 'Guests']],
        body: transportationDataS.map((t) => [t.name, t.value.toString()]),
        styles: { fontSize: 9 },
        theme: 'grid',
        headStyles: { fillColor: [30, 58, 95] },
      });

      const finalY = (doc as any).lastAutoTable.finalY + 10;

    doc.setFontSize(10);
      doc.text('System Validation Details', 14, finalY);
      const vY = finalY + 6;
      doc.text(`Submitted by: ${biz?.ownerName ?? 'Accommodation Representative'}`, 18, vY);
      doc.text('Account Role: Establishment Administrator', 18, vY + 6);
      doc.text(
        `Submission Timestamp: ${r.submittedAt ? new Date(r.submittedAt).toLocaleString() : 'N/A'}`,
        18,
        vY + 12,
      );
      doc.text('Data Status: Verified and Synced to Central Database', 18, vY + 18);
      doc.text(
        `Digital Authentication Code: LSP-VER-${Date.now().toString().slice(-8)}`,
        18,
        vY + 24,
      );
    });

    doc.save(`monthly-tourism-reports-${Date.now()}.pdf`);
  };

  const exportCSV = () => {
    const exportRows = rows.filter((r) => selectedKeys.has(r.key));
    if (!exportRows.length) return;
    const lines: string[] = [];

    if (exportRows.length >= 2) {
      const allRecords = exportRows.flatMap((r) =>
        getRecordsForRow({ businessId: r.businessId, month: r.month, year: r.year }),
      );
      const accommodationNames = exportRows.map((r) => r.businessName).join('; ');
      const uniquePeriods = [
        ...new Set(
          exportRows.map((r) =>
            new Date(r.year, r.month - 1).toLocaleString('default', { month: 'long', year: 'numeric' }),
          ),
        ),
      ];
      const reportingPeriod = uniquePeriods.length === 1 ? uniquePeriods[0] : uniquePeriods.join('; ');

      const totalGuests = allRecords.reduce((sum, rec) => sum + rec.numberOfGuests, 0);
      const totalGuestNights = allRecords.reduce((sum, rec) => {
        return sum + differenceInDays(new Date(rec.checkIn), new Date(rec.checkOut)) * rec.numberOfGuests;
      }, 0);
      const averageLengthOfStay = totalGuests > 0 ? totalGuestNights / totalGuests : 0;

      const genderMap = new Map<string, number>();
      allRecords.forEach((rec) => {
        const label = rec.gender === 'lgbt' ? 'LGBT+' : rec.gender.charAt(0).toUpperCase() + rec.gender.slice(1);
        genderMap.set(label, (genderMap.get(label) || 0) + rec.numberOfGuests);
      });
      const ageBracketMap = new Map<string, number>();
      allRecords.forEach((rec) => {
        const src = rec.age;
        let label = '';
        if (src === '1-9' || src === '10-17') label = '0–17 years old';
        else if (src === '18-25' || src === '26-35') label = '18–30 years old';
        else if (src === '36-45') label = '31–45 years old';
        else if (src === '46-55') label = '46–60 years old';
        else if (src === '56+') label = '61 years old and above';
        else label = 'Prefer not to say';
        ageBracketMap.set(label, (ageBracketMap.get(label) || 0) + rec.numberOfGuests);
      });
      const nationalityMap = new Map<string, number>();
      allRecords.forEach((rec) => {
        nationalityMap.set(rec.nationality, (nationalityMap.get(rec.nationality) || 0) + rec.numberOfGuests);
      });
      const purposeMap = new Map<string, number>();
      allRecords.forEach((rec) => {
        const key =
          rec.purpose === 'leisure' ? 'Leisure / Vacation'
          : rec.purpose === 'business' ? 'Business'
          : rec.purpose === 'event' ? 'Events / Conference'
          : 'Others';
        purposeMap.set(key, (purposeMap.get(key) || 0) + rec.numberOfGuests);
      });

      const combinedName = `"${accommodationNames}"`;
      lines.push('Accommodations,Reporting Period,Section,Label,Value');
      lines.push(`${combinedName},"${reportingPeriod}",Summary,Total Guests Checked-in,${totalGuests}`);
      lines.push(`${combinedName},"${reportingPeriod}",Summary,Total Guest Nights,${totalGuestNights}`);
      lines.push(`${combinedName},"${reportingPeriod}",Summary,Average Length of Stay,${averageLengthOfStay.toFixed(1)}`);
      const combinedOccupancyCSV = (() => {
        let weightedSum = 0; let totalCap = 0;
        exportRows.forEach((row) => {
          const rowBiz = businesses.find((b) => b.id === row.businessId);
          if (!rowBiz?.totalRooms) return;
          const rowRecords = getRecordsForRow({ businessId: row.businessId, month: row.month, year: row.year });
          const rate = calcOccupancyRate(rowRecords, row.month, row.year, rowBiz.totalRooms);
          weightedSum += rate * rowBiz.totalRooms;
          totalCap += rowBiz.totalRooms;
        });
        return totalCap > 0 ? weightedSum / totalCap : 0;
      })();
      lines.push(`${combinedName},"${reportingPeriod}",Summary,Average Occupancy Rate,${combinedOccupancyCSV.toFixed(1)}%`);
      genderMap.forEach((value, name) => lines.push(`${combinedName},"${reportingPeriod}",Gender,${name},${value}`));
      ageBracketMap.forEach((value, name) => lines.push(`${combinedName},"${reportingPeriod}",Age Group,${name},${value}`));
      nationalityMap.forEach((value, name) => lines.push(`${combinedName},"${reportingPeriod}",Nationality,${name},${value}`));
      purposeMap.forEach((value, name) => lines.push(`${combinedName},"${reportingPeriod}",Purpose,${name},${value}`));
      const transportationMapCSV = new Map<string, number>();
      allRecords.forEach((rec) => {
        const label =
          rec.transportationMode === 'private_car' ? 'Private Car'
          : rec.transportationMode === 'bus' ? 'Bus'
          : rec.transportationMode === 'van' ? 'Van'
          : rec.transportationMode === 'motorcycle' ? 'Motorcycle'
          : rec.transportationMode === 'plane' ? 'Plane'
          : 'Other';
        transportationMapCSV.set(label, (transportationMapCSV.get(label) || 0) + rec.numberOfGuests);
      });
      transportationMapCSV.forEach((value, name) => lines.push(`${combinedName},"${reportingPeriod}",Transportation Mode,${name},${value}`));

      const csv = lines.join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `monthly-tourism-summary-combined-${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      return;
    }

    lines.push('Accommodation,Section,Label,Value');

    exportRows.forEach((r) => {
      const records = getRecordsForRow({ businessId: r.businessId, month: r.month, year: r.year });
      const biz = businesses.find((b) => b.id === r.businessId) ?? null;

      const totalGuests = records.reduce((sum, rec) => sum + rec.numberOfGuests, 0);
      const totalGuestNights = records.reduce((sum, rec) => {
        const checkIn = new Date(rec.checkIn);
        const checkOut = new Date(rec.checkOut);
        return sum + differenceInDays(checkIn, checkOut) * rec.numberOfGuests;
      }, 0);
      const averageLengthOfStay = totalGuests > 0 ? totalGuestNights / totalGuests : 0;
      const averageOccupancyRate = calcOccupancyRate(records, r.month, r.year, biz?.totalRooms);

      const genderMap = new Map<string, number>();
      records.forEach((rec) => {
        const label =
          rec.gender === 'lgbt' ? 'LGBT+' : rec.gender.charAt(0).toUpperCase() + rec.gender.slice(1);
        genderMap.set(label, (genderMap.get(label) || 0) + rec.numberOfGuests);
      });
      const genderData = Array.from(genderMap.entries()).map(([name, value]) => ({ name, value }));

      const ageBracketMap = new Map<string, number>();
      records.forEach((rec) => {
        const src = rec.age;
        let label = '';
        if (src === '1-9' || src === '10-17') {
          label = '0–17 years old';
        } else if (src === '18-25' || src === '26-35') {
          label = '18–30 years old';
        } else if (src === '36-45') {
          label = '31–45 years old';
        } else if (src === '46-55') {
          label = '46–60 years old';
        } else if (src === '56+') {
          label = '61 years old and above';
        } else {
          label = 'Prefer not to say';
        }
        ageBracketMap.set(label, (ageBracketMap.get(label) || 0) + rec.numberOfGuests);
      });
      const ageData = Array.from(ageBracketMap.entries()).map(([name, value]) => ({ name, value }));

      const nationalityMap = new Map<string, number>();
      records.forEach((rec) => {
        nationalityMap.set(
          rec.nationality,
          (nationalityMap.get(rec.nationality) || 0) + rec.numberOfGuests,
        );
      });
      const nationalityData = Array.from(nationalityMap.entries()).map(([name, value]) => ({
        name,
        value,
      }));

      const purposeMap = new Map<string, number>();
      records.forEach((rec) => {
        const key =
          rec.purpose === 'leisure'
            ? 'Leisure / Vacation'
            : rec.purpose === 'business'
              ? 'Business'
              : rec.purpose === 'event'
                ? 'Events / Conference'
                : 'Others';
        purposeMap.set(key, (purposeMap.get(key) || 0) + rec.numberOfGuests);
      });
      const purposeData = Array.from(purposeMap.entries()).map(([name, value]) => ({ name, value }));

      const name = biz?.businessName ?? 'Unknown Accommodation';

      lines.push(`${name},Summary,Total Guests Checked-in,${totalGuests}`);
      lines.push(`${name},Summary,Total Guest Nights,${totalGuestNights}`);
      lines.push(`${name},Summary,Average Length of Stay,${averageLengthOfStay.toFixed(1)}`);
      lines.push(`${name},Summary,Average Occupancy Rate,${averageOccupancyRate.toFixed(1)}%`);

      genderData.forEach((g) => {
        lines.push(`${name},Gender,${g.name},${g.value}`);
      });
      ageData.forEach((a) => {
        lines.push(`${name},Age Group,${a.name},${a.value}`);
      });
      nationalityData.forEach((n) => {
        lines.push(`${name},Nationality,${n.name},${n.value}`);
      });
      purposeData.forEach((p) => {
        lines.push(`${name},Purpose,${p.name},${p.value}`);
      });
      const transportationMapSCSV = new Map<string, number>();
      records.forEach((rec) => {
        const label =
          rec.transportationMode === 'private_car' ? 'Private Car'
          : rec.transportationMode === 'bus' ? 'Bus'
          : rec.transportationMode === 'van' ? 'Van'
          : rec.transportationMode === 'motorcycle' ? 'Motorcycle'
          : rec.transportationMode === 'plane' ? 'Plane'
          : 'Other';
        transportationMapSCSV.set(label, (transportationMapSCSV.get(label) || 0) + rec.numberOfGuests);
      });
      transportationMapSCSV.forEach((value, tName) => {
        lines.push(`${name},Transportation Mode,${tName},${value}`);
      });
    });

    const csv = lines.join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `monthly-tourism-summary-aggregate-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-gov-blue mb-6">Reports</h1>

      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gov-blue mb-4">Filters</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Month</label>
            <select {...register('month')} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
              <option value="">All</option>
              {months.map((m) => (
                <option key={m} value={m}>
                  {new Date(2000, parseInt(m, 10) - 1).toLocaleString('default', { month: 'long' })}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Year</label>
            <select {...register('year')} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Accommodation</label>
            <select {...register('accommodation')} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
              {accommodationOptions.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 mb-6 print:hidden">
        <button
          onClick={exportPDF}
          disabled={selectedKeys.size === 0}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gov-blue text-white hover:bg-gov-blue/90 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <FileDown size={18} /> Export PDF
        </button>
        <button
          onClick={exportCSV}
          disabled={selectedKeys.size === 0}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Download size={18} /> Export CSV
        </button>
        {selectedKeys.size === 0 && (
          <p className="text-xs text-gray-400 italic">Select at least one report below to export.</p>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm mb-6">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-semibold text-gov-blue">Monthly Reports from Accommodations</h2>
          <p className="text-xs text-gray-500">
            {rows.length} submitted report{rows.length !== 1 ? 's' : ''}
            {selectedKeys.size > 0 && ` · ${selectedKeys.size} selected for export`}
          </p>
        </div>
        {rows.length > 0 && (
          <div className="px-4 py-2 border-b border-gray-200 flex items-center gap-2 bg-gray-50">
            <input
              type="checkbox"
              id="select-all-export"
              checked={rows.length > 0 && selectedKeys.size === rows.length}
              onChange={() => {
                if (selectedKeys.size === rows.length) {
                  setSelectedKeys(new Set());
                } else {
                  setSelectedKeys(new Set(rows.map((r) => r.key)));
                }
              }}
              className="h-4 w-4 accent-gov-blue cursor-pointer"
            />
            <label htmlFor="select-all-export" className="text-xs text-gray-600 cursor-pointer select-none">
              Select All for Export
            </label>
          </div>
        )}
        <div className="divide-y divide-gray-100">
          {rows.length === 0 ? (
            <div className="p-4 text-sm text-gray-500">
              No monthly reports have been submitted yet.
            </div>
          ) : (
            rows.map((r) => (
              <div
                key={r.key}
                className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={selectedKeys.has(r.key)}
                    onChange={() => toggleKey(r.key)}
                    className="mt-1 h-4 w-4 accent-gov-blue cursor-pointer flex-shrink-0"
                  />
                  <div>
                    <p className="font-medium text-gov-blue">
                      {r.businessName}
                    </p>
                    <p className="text-sm text-gray-700">
                      {new Date(r.year, r.month - 1).toLocaleString('default', {
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                    <p className="text-xs text-gray-500">
                      Submitted on{' '}
                      {r.submittedAt ? new Date(r.submittedAt).toLocaleString() : 'N/A'}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedKey(r.key)}
                    className="inline-flex items-center gap-2 px-3 py-1.5 text-xs bg-gov-blue text-white rounded-lg hover:bg-gov-blue/90"
                  >
                    <Eye size={14} />
                    View Details
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {selectedRow && summary && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
        <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
              <div>
                <h2 className="text-lg font-semibold text-gov-blue">Monthly Tourism Demographic Report</h2>
                <p className="text-xs text-gray-500">
                {new Date(summary.year, summary.month - 1).toLocaleString('default', {
                  month: 'long',
                  year: 'numeric',
                })}{' '}
                • {summary.business?.businessName ?? 'Unknown Accommodation'}
                </p>
              </div>
              <button
                type="button"
              onClick={() => setSelectedKey(null)}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Close
              </button>
            </div>
            <div className="px-6 py-4 text-sm text-gray-700 space-y-4">
              <div>
                <p className="font-semibold text-gov-blue mb-1">Accommodation Details</p>
                <p>
                  Accommodation Name:{' '}
                  {summary.business ? summary.business.businessName : 'Unknown Accommodation'}
                </p>
                <p>
                  Accreditation / Permit No.:{' '}
                  {summary.business ? summary.business.permitNumber : 'N/A'}
                </p>
                <p>
                  Location:{' '}
                  {summary.business ? summary.business.address : 'N/A'}
                </p>
                <p>
                  Reporting Month:{' '}
                  {new Date(summary.year, summary.month - 1).toLocaleString('default', {
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
                <p>Date Generated: {new Date().toLocaleString()}</p>
                <p>Submitted Via: Lakbay San Pablo System</p>
              </div>

              <div>
                <p className="font-semibold text-gov-blue mb-1">1. Summary of Tourist Arrivals</p>
                <p>Total Guests Checked-in: {summary.totalGuests}</p>
                <p>Total Guest Nights: {summary.totalGuestNights}</p>
                <p>Average Length of Stay: {summary.averageLengthOfStay.toFixed(1)} nights</p>
                <p>Average Occupancy Rate: {summary.averageOccupancyRate.toFixed(1)}%</p>
              </div>

              <div>
                <p className="font-semibold text-gov-blue mb-1">2. Demographic Breakdown</p>
                <p className="font-medium mt-1">By Gender</p>
                {summary.genderData.length === 0 ? (
                  <p className="text-xs text-gray-500">No data for this month.</p>
                ) : (
                  <ul className="list-disc list-inside">
                    {summary.genderData.map((g) => (
                      <li key={g.name}>
                        {g.name}: {g.value}
                      </li>
                    ))}
                  </ul>
                )}
                <p className="font-medium mt-2">By Age Group</p>
                {summary.ageData.length === 0 ? (
                  <p className="text-xs text-gray-500">No data for this month.</p>
                ) : (
                  <ul className="list-disc list-inside">
                    {summary.ageData.map((a) => (
                      <li key={a.name}>
                        {a.name}: {a.value}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <p className="font-semibold text-gov-blue mb-1">3. Nationality Distribution</p>
                {summary.nationalityData.length === 0 ? (
                  <p className="text-xs text-gray-500">No data for this month.</p>
                ) : (
                  <ul className="list-disc list-inside">
                    {summary.nationalityData.map((n) => (
                      <li key={n.name}>
                        {n.name}: {n.value}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <p className="font-semibold text-gov-blue mb-1">4. Purpose of Visit</p>
                {summary.purposeData.length === 0 ? (
                  <p className="text-xs text-gray-500">No data for this month.</p>
                ) : (
                  <ul className="list-disc list-inside">
                    {summary.purposeData.map((p) => (
                      <li key={p.name}>
                        {p.name}: {p.value}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <p className="font-semibold text-gov-blue mb-1">5. Mode of Transportation</p>
                {summary.transportationData.length === 0 ? (
                  <p className="text-xs text-gray-500">No data for this month.</p>
                ) : (
                  <ul className="list-disc list-inside">
                    {summary.transportationData.map((t) => (
                      <li key={t.name}>
                        {t.name}: {t.value}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <p className="font-semibold text-gov-blue mb-1">System Validation Details</p>
                <p>Data Source: Guest records submitted through Lakbay San Pablo System.</p>
                <p>Data Status: Aggregated and generated by Tourism Office.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
