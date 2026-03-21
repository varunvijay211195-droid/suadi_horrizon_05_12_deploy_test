"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface Banner {
  _id?: string;
  title: string;
  content: string;
  imageUrl?: string;
  linkUrl?: string;
  position: 'top' | 'bottom' | 'sidebar' | 'modal';
  displayOrder: number;
  startDate: string | Date;
  endDate: string | Date;
  isActive: boolean;
  targetAudience?: 'all' | 'new_users' | 'returning_users' | 'specific_users';
  targetUserIds?: string[];
  createdBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface BannerForm {
  _id?: string;
  title: string;
  content: string;
  imageUrl?: string;
  linkUrl?: string;
  position: 'top' | 'bottom' | 'sidebar' | 'modal';
  displayOrder: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  targetAudience?: 'all' | 'new_users' | 'returning_users' | 'specific_users';
  targetUserIds?: string[];
}

const DEFAULT_FORM: BannerForm = {
  title: '',
  content: '',
  position: 'top',
  displayOrder: 0,
  startDate: new Date().toISOString().slice(0, 16),
  endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
  isActive: true,
  targetAudience: 'all'
};

export default function BannerManagement() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [editingBanner, setEditingBanner] = useState<BannerForm | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : '';
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) return;

    fetchBanners();
  }, [user]);

  const fetchBanners = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/notifications/banners', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch banners');
      }

      const data = await response.json();
      setBanners(data);
    } catch (error) {
      console.error('Error fetching banners:', error);
      setHasError(true);
    } finally {
      setLoading(false);
    }
  };

  const createBanner = async (bannerData: BannerForm) => {
    try {
      setFormLoading(true);
      setFormError('');

      const response = await fetch('/api/notifications/banners', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(bannerData),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to create banner';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          // Ignore JSON parse errors
        }
        throw new Error(errorMessage);
      }

      setShowForm(false);
      setEditingBanner(null);
      fetchBanners();
    } catch (error: unknown) {
      console.error('Error creating banner:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create banner';
      setFormError(errorMessage);
    } finally {
      setFormLoading(false);
    }
  };

  const updateBanner = async (bannerData: BannerForm) => {
    try {
      setFormLoading(true);
      setFormError('');

      const response = await fetch(`/api/notifications/banners?id=${editingBanner?._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(bannerData),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to update banner';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          // Ignore JSON parse errors
        }
        throw new Error(errorMessage);
      }

      setShowForm(false);
      setEditingBanner(null);
      fetchBanners();
    } catch (error: unknown) {
      console.error('Error updating banner:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update banner';
      setFormError(errorMessage);
    } finally {
      setFormLoading(false);
    }
  };

  const deleteBanner = async (bannerId: string) => {
    try {
      await fetch(`/api/notifications/banners?id=${bannerId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      fetchBanners();
    } catch (error) {
      console.error('Error deleting banner:', error);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBanner) return;
    
    if (editingBanner._id) {
      updateBanner(editingBanner);
    } else {
      createBanner(editingBanner);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString();
  };

  if (!user) return null;

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center space-x-2">
          <div className="animate-pulse bg-gray-400 h-4 w-4 rounded-full" />
          <span className="text-sm text-gray-600">Loading banners...</span>
        </div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="p-6">
        <div className="flex items-center space-x-2">
          <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <span className="text-sm text-red-600">Failed to load banners</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Banner Management</h2>
      
      <button
        onClick={() => {
          setEditingBanner(DEFAULT_FORM);
          setShowForm(true);
        }}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        + Create New Banner
      </button>

      {showForm && (
        <div className="mt-6 p-6 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-4">{editingBanner ? 'Edit Banner' : 'Create Banner'}</h3>
          
          {formError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <span className="text-sm text-red-600">{formError}</span>
            </div>
          )}

          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={editingBanner?.title || ''}
                  onChange={(e) => setEditingBanner(prev => prev ? { ...prev, title: e.target.value } : { ...DEFAULT_FORM, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                <select
                  value={editingBanner?.position || 'top'}
                  onChange={(e) => setEditingBanner(prev => prev ? { ...prev, position: e.target.value as any } : { ...DEFAULT_FORM, position: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="top">Top</option>
                  <option value="bottom">Bottom</option>
                  <option value="sidebar">Sidebar</option>
                  <option value="modal">Modal</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Display Order</label>
                <input
                  type="number"
                  min="0"
                  value={editingBanner?.displayOrder || 0}
                  onChange={(e) => setEditingBanner(prev => prev ? { ...prev, displayOrder: parseInt(e.target.value) } : { ...DEFAULT_FORM, displayOrder: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Active</label>
                <select
                  value={editingBanner?.isActive ? '1' : '0'}
                  onChange={(e) => setEditingBanner(prev => prev ? { ...prev, isActive: e.target.value === '1' } : { ...DEFAULT_FORM, isActive: e.target.value === '1' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="1">Yes</option>
                  <option value="0">No</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="datetime-local"
                  required
                  value={editingBanner?.startDate ? String(editingBanner.startDate).slice(0, 16) : ''}
                  onChange={(e) => setEditingBanner(prev => prev ? { ...prev, startDate: e.target.value } : { ...DEFAULT_FORM, startDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="datetime-local"
                  required
                  value={editingBanner?.endDate ? String(editingBanner.endDate).slice(0, 16) : ''}
                  onChange={(e) => setEditingBanner(prev => prev ? { ...prev, endDate: e.target.value } : { ...DEFAULT_FORM, endDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
              <textarea
                required
                value={editingBanner?.content || ''}
                onChange={(e) => setEditingBanner(prev => prev ? { ...prev, content: e.target.value } : { ...DEFAULT_FORM, content: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Image URL (Optional)</label>
              <input
                type="url"
                value={editingBanner?.imageUrl || ''}
                onChange={(e) => setEditingBanner(prev => prev ? { ...prev, imageUrl: e.target.value } : { ...DEFAULT_FORM, imageUrl: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Link URL (Optional)</label>
              <input
                type="url"
                value={editingBanner?.linkUrl || ''}
                onChange={(e) => setEditingBanner(prev => prev ? { ...prev, linkUrl: e.target.value } : { ...DEFAULT_FORM, linkUrl: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Target Audience</label>
              <select
                value={editingBanner?.targetAudience || 'all'}
                onChange={(e) => setEditingBanner(prev => prev ? { ...prev, targetAudience: e.target.value as any } : { ...DEFAULT_FORM, targetAudience: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Users</option>
                <option value="new_users">New Users Only</option>
                <option value="returning_users">Returning Users Only</option>
                <option value="specific_users">Specific Users</option>
              </select>
            </div>

            {editingBanner?.targetAudience === 'specific_users' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Target User IDs (comma-separated)</label>
                <input
                  type="text"
                  placeholder="user1,user2,user3"
                  value={editingBanner?.targetUserIds?.join(',') || ''}
                  onChange={(e) => setEditingBanner(prev => {
                    const ids = e.target.value.split(',').map(id => id.trim()).filter(id => id);
                    return prev ? { ...prev, targetUserIds: ids } : { ...DEFAULT_FORM, targetUserIds: ids };
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            )}

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >Cancel</button>
              <button
                type="submit"
                disabled={formLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {formLoading ? 'Saving...' : editingBanner ? 'Update Banner' : 'Create Banner'}
              </button>
            </div>
          </form>
        </div>
      )}

      {banners.length > 0 && (
        <div className="mt-6 space-y-4">
          {banners.map((banner) => (
            <div
              key={banner._id}
              className="p-4 bg-gray-50 rounded-lg border border-gray-200"
            >
              <div className="flex items-start justify-between space-x-4">
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-gray-900 mb-1">{banner.title}</h4>
                  <div className="text-xs text-gray-500 mb-2">
                    {banner.position} - Display Order: {banner.displayOrder}
                  </div>
                  <div className="text-xs text-gray-500 mb-2">
                    {formatDate(new Date(banner.startDate))} - {formatDate(new Date(banner.endDate))}
                  </div>
                  <div className="text-xs text-gray-500 mb-2">
                    Target: {banner.targetAudience || 'all'}
                  </div>
                  <div className="text-sm text-gray-700">{banner.content}</div>
                </div>
                <div className="flex items-center space-x-2">
                  {banner.imageUrl && (
                    <img
                      src={banner.imageUrl}
                      alt={banner.title}
                      className="w-16 h-16 object-cover rounded"
                    />
                  )}
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setEditingBanner({
                          ...banner,
                          startDate: new Date(banner.startDate).toISOString().slice(0, 16),
                          endDate: new Date(banner.endDate).toISOString().slice(0, 16)
                        } as BannerForm);
                        setShowForm(true);
                      }}
                      className="px-2 py-1 text-xs text-blue-600 bg-blue-50 rounded hover:bg-blue-100"
                    >Edit</button>
                    <button
                      onClick={() => deleteBanner(banner._id!)}
                      className="px-2 py-1 text-xs text-red-600 bg-red-50 rounded hover:bg-red-100"
                    >Delete</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

