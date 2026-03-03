import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Building2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';

const schema = z.object({
  ownerName: z.string().min(1, 'Owner name is required'),
  address: z.string().min(1, 'Address is required'),
  contactNumber: z.string().min(1, 'Contact number is required'),
  totalRooms: z
    .number({ invalid_type_error: 'Must be a number' })
    .int('Must be a whole number')
    .min(1, 'Must be at least 1'),
});

type FormData = z.infer<typeof schema>;

export default function BusinessProfile() {
  const { user, refreshUser } = useAuth();
  const { updateBusiness } = useData();
  const business = user?.business;

  const [saved, setSaved] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      ownerName: business?.ownerName ?? '',
      address: business?.address ?? '',
      contactNumber: business?.contactNumber ?? '',
      totalRooms: business?.totalRooms ?? ('' as unknown as number),
    },
  });

  // Keep form in sync if user refreshes
  useEffect(() => {
    if (business) {
      reset({
        ownerName: business.ownerName ?? '',
        address: business.address ?? '',
        contactNumber: business.contactNumber ?? '',
        totalRooms: business.totalRooms ?? ('' as unknown as number),
      });
    }
  }, [business, reset]);

  const onSubmit = (data: FormData) => {
    if (!business?.id) return;
    updateBusiness(business.id, {
      ownerName: data.ownerName,
      address: data.address,
      contactNumber: data.contactNumber,
      totalRooms: data.totalRooms,
    });
    refreshUser();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  if (!business) {
    return (
      <div className="p-6 text-gray-500">No business profile found.</div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-gov-blue/10 rounded-lg">
          <Building2 size={24} className="text-gov-blue" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gov-blue">Business Profile</h1>
          <p className="text-sm text-gray-500">Manage your accommodation details</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        {/* Read-only info */}
        <div className="mb-6 pb-6 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
            Registered Information
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Business Name</p>
              <p className="text-sm font-medium text-gray-800">{business.businessName}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Permit / Accreditation No.</p>
              <p className="text-sm font-medium text-gray-800">{business.permitNumber}</p>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-3">
            These fields are set during registration and cannot be changed here. Contact the admin to request corrections.
          </p>
        </div>

        {/* Editable form */}
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
          Editable Details
        </h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Owner / Manager Name *
            </label>
            <input
              type="text"
              {...register('ownerName')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
            />
            {errors.ownerName && (
              <p className="text-red-600 text-sm mt-1">{errors.ownerName.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
            <input
              type="text"
              {...register('address')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
            />
            {errors.address && (
              <p className="text-red-600 text-sm mt-1">{errors.address.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contact Number *
            </label>
            <input
              type="text"
              {...register('contactNumber')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
            />
            {errors.contactNumber && (
              <p className="text-red-600 text-sm mt-1">{errors.contactNumber.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Total Rooms / Units *
            </label>
            <p className="text-xs text-gray-400 mb-1.5">
              Used to calculate the Average Occupancy Rate in monthly reports.
            </p>
            <input
              type="number"
              min={1}
              {...register('totalRooms', { valueAsNumber: true })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
              placeholder="e.g. 20"
            />
            {errors.totalRooms && (
              <p className="text-red-600 text-sm mt-1">{errors.totalRooms.message}</p>
            )}
          </div>

          <div className="flex items-center gap-4 pt-2">
            <button
              type="submit"
              disabled={!isDirty}
              className="px-6 py-2.5 bg-gov-blue text-white rounded-lg font-medium hover:bg-gov-blue/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save Changes
            </button>
            {saved && (
              <span className="flex items-center gap-1.5 text-sm text-green-600 font-medium">
                <CheckCircle2 size={16} />
                Saved successfully
              </span>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
