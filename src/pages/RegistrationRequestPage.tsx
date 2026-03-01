import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  businessName: z.string().min(2, 'Business name is required'),
  permitNumber: z.string().min(1, 'Permit number is required'),
  ownerName: z.string().min(2, 'Owner name is required'),
  email: z.string().email('Invalid email'),
  contactNumber: z.string().min(10, 'Valid contact number required'),
  address: z.string().min(5, 'Address is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type FormData = z.infer<typeof schema>;

export default function RegistrationRequestPage() {
  const { addRegistrationRequest } = useData();
  const [submitted, setSubmitted] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = (data: FormData) => {
    addRegistrationRequest({
      businessName: data.businessName,
      permitNumber: data.permitNumber,
      ownerName: data.ownerName,
      email: data.email,
      contactNumber: data.contactNumber,
      address: data.address,
      status: 'pending',
    });
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gov-blue mb-2">Registration Submitted</h2>
          <p className="text-gray-600 mb-6">Your registration request has been received. The Tourism Office will review your application. You will be notified via email once approved.</p>
          <Link to="/login" className="text-primary-600 font-medium hover:underline">Back to Login</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      <div className="hidden lg:flex flex-1 items-center justify-center p-12 bg-gradient-to-br from-gov-blue to-primary-700">
        <div className="text-white max-w-md">
          <h1 className="text-2xl font-bold mb-4">Register Your Accommodation Business</h1>
          <p>Hotels, resorts, inns, and lodging establishments in San Pablo City can register to participate in the tourist demographic data collection program.</p>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 overflow-auto">
        <div className="w-full max-w-lg">
          <div className="mb-6">
            <Link to="/login" className="text-primary-600 hover:underline text-sm">← Back to Login</Link>
          </div>
          <h2 className="text-2xl font-bold text-gov-blue mb-6">Request Registration</h2>
          <p className="text-sm text-gray-600 mb-6">Your account will be activated only after approval by the Tourism Office.</p>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Business Name *</label>
              <input {...register('businessName')} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" placeholder="e.g. Palm Spring Resort" />
              {errors.businessName && <p className="text-red-600 text-sm mt-1">{errors.businessName.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Business Permit Number *</label>
              <input {...register('permitNumber')} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" placeholder="e.g. BP-2024-001" />
              {errors.permitNumber && <p className="text-red-600 text-sm mt-1">{errors.permitNumber.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Owner Name *</label>
              <input {...register('ownerName')} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
              {errors.ownerName && <p className="text-red-600 text-sm mt-1">{errors.ownerName.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <input type="email" {...register('email')} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
              {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number *</label>
              <input {...register('contactNumber')} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" placeholder="0917-123-4567" />
              {errors.contactNumber && <p className="text-red-600 text-sm mt-1">{errors.contactNumber.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
              <textarea {...register('address')} rows={2} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
              {errors.address && <p className="text-red-600 text-sm mt-1">{errors.address.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Upload Business Permit (PDF/Image)</label>
              <input type="file" accept=".pdf,image/*" className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Upload Valid ID</label>
              <input type="file" accept=".pdf,image/*" className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
              <input type="password" {...register('password')} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
              {errors.password && <p className="text-red-600 text-sm mt-1">{errors.password.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password *</label>
              <input type="password" {...register('confirmPassword')} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
              {errors.confirmPassword && <p className="text-red-600 text-sm mt-1">{errors.confirmPassword.message}</p>}
            </div>
            <button type="submit" className="w-full py-3 bg-gov-blue text-white rounded-lg font-medium hover:bg-gov-blue/90 transition-colors">
              Submit Registration Request
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
