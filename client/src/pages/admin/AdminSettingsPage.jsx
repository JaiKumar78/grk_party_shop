import React, { useState, useEffect } from 'react';
import { useGetSettingsQuery, useUpdateSettingsMutation } from '../../store/api/settingsApi';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import { Trash2 } from 'lucide-react';

const defaultShipping = [
  { city: 'Chennai', normal: 50, quick: 100 },
  { city: 'Other', normal: 50 },
];

const AdminSettingsPage = () => {
  const { data: settings, isLoading } = useGetSettingsQuery();
  const [updateSettings, { isLoading: isSaving }] = useUpdateSettingsMutation();
  const [taxEnabled, setTaxEnabled] = useState(true);
  const [taxPercentage, setTaxPercentage] = useState(5);
  const [shipping, setShipping] = useState(defaultShipping);
  const [newCity, setNewCity] = useState({ city: '', normal: '', quick: '' });

  useEffect(() => {
    if (settings) {
      setTaxEnabled(settings.taxEnabled);
      setTaxPercentage(settings.taxPercentage);
      setShipping(settings.shipping && settings.shipping.length > 0 ? settings.shipping : defaultShipping);
    }
  }, [settings]);

  const handleShippingChange = async (idx, field, value) => {
    const newShipping = shipping.map((s, i) => i === idx ? { ...s, [field]: value } : s);
    
    try {
      await updateSettings({ 
        taxEnabled, 
        taxPercentage, 
        shipping: newShipping 
      }).unwrap();
      
      setShipping(newShipping);
    } catch (err) {
      toast.error('Failed to update shipping price. Please try again.');
    }
  };

  const handleAddCity = async (e) => {
    e.preventDefault();
    if (!newCity.city.trim() || newCity.normal === '') {
      toast.error('City name and normal price are required');
      return;
    }
    if (shipping.some(s => s.city.trim().toLowerCase() === newCity.city.trim().toLowerCase())) {
      toast.error('City already exists');
      return;
    }
    
    const newShipping = [...shipping, {
      city: newCity.city.trim(),
      normal: Number(newCity.normal),
      quick: newCity.quick ? Number(newCity.quick) : undefined
    }];
    
    try {
      await updateSettings({ 
        taxEnabled, 
        taxPercentage, 
        shipping: newShipping 
      }).unwrap();
      
      setShipping(newShipping);
      setNewCity({ city: '', normal: '', quick: '' });
      toast.success('City added successfully!');
    } catch (err) {
      toast.error('Failed to add city. Please try again.');
    }
  };

  const handleDeleteCity = async (cityToDelete) => {
    if (cityToDelete.toLowerCase() === 'other') {
      toast.error('Cannot delete the "Other" city as it is required for fallback');
      return;
    }
    
    const newShipping = shipping.filter(s => s.city !== cityToDelete);
    
    try {
      await updateSettings({ 
        taxEnabled, 
        taxPercentage, 
        shipping: newShipping 
      }).unwrap();
      
      setShipping(newShipping);
      toast.success(`City "${cityToDelete}" deleted successfully!`);
    } catch (err) {
      toast.error('Failed to delete city. Please try again.');
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await updateSettings({ taxEnabled, taxPercentage, shipping: shipping.map(s => ({ ...s, normal: Number(s.normal), quick: s.quick ? Number(s.quick) : undefined })) }).unwrap();
      toast.success('Settings updated!');
    } catch (err) {
      toast.error('Failed to update settings');
    }
  };

  if (isLoading) return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div></div>;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-8 mt-8 mb-12"
    >
      <h1 className="text-3xl font-bold mb-2 text-primary-600">Store Settings</h1>
      <p className="text-gray-500 mb-6">Configure tax and shipping options for your store. These settings affect checkout calculations for all users.</p>
      <form onSubmit={handleSave} className="space-y-8">
        {/* Tax Section */}
        <div>
          <h2 className="text-xl font-semibold mb-2 text-gray-800">Tax Settings</h2>
          <div className="flex items-center gap-3 mb-3">
            <span className="font-medium text-gray-700">Enable Tax</span>
            <button
              type="button"
              className={`relative inline-flex h-7 w-14 items-center rounded-full border transition-colors duration-200 ${
                taxEnabled ? 'bg-green-500 border-green-500' : 'bg-gray-300 border-gray-300'
              }`}
              onClick={async () => {
                const previous = taxEnabled;
                const next = !previous;
                setTaxEnabled(next);
                try {
                  await updateSettings({
                    taxEnabled: next,
                    taxPercentage,
                    shipping,
                  }).unwrap();
                  toast.success('Tax setting updated!');
                } catch (err) {
                  setTaxEnabled(previous); // Revert on error
                  toast.error('Failed to update tax setting');
                }
              }}
              aria-pressed={taxEnabled}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white shadow transition-transform duration-200 ${
                  taxEnabled ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
            <span
              className={`ml-2 text-sm font-medium ${
                taxEnabled ? 'text-green-600' : 'text-gray-400'
              }`}
            >
              {taxEnabled ? 'On' : 'Off'}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <label className="block text-gray-700 font-medium">Tax Percentage</label>
            <input
              type="number"
              min="0"
              max="100"
              value={taxPercentage}
              onChange={async (e) => {
                const newTaxPercentage = Number(e.target.value);
                setTaxPercentage(newTaxPercentage);
                try {
                  await updateSettings({ 
                    taxEnabled, 
                    taxPercentage: newTaxPercentage, 
                    shipping 
                  }).unwrap();
                  toast.success('Tax percentage updated!');
                } catch (err) {
                  setTaxPercentage(taxPercentage); // Revert on error
                  toast.error('Failed to update tax percentage');
                }
              }}
              className="border rounded px-3 py-2 w-24 focus:outline-none focus:ring-2 focus:ring-primary-400"
              disabled={!taxEnabled}
            />
            <span className="text-gray-500">%</span>
          </div>
        </div>
        {/* Add City Section */}
        <hr className="my-6 border-gray-200" />
        <div>
          <h2 className="text-xl font-semibold mb-2 text-gray-800">Add New City</h2>
          <p className="text-sm text-gray-600 mb-4">Add new cities with their shipping prices. Quick delivery is optional.</p>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-gray-700 mb-1">City Name *</label>
              <input
                type="text"
                value={newCity.city}
                onChange={e => setNewCity(c => ({ ...c, city: e.target.value }))}
                className="border rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-primary-400"
                placeholder="e.g. Mumbai"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-1">Normal Delivery Price *</label>
              <input
                type="number"
                min="0"
                value={newCity.normal}
                onChange={e => setNewCity(c => ({ ...c, normal: e.target.value }))}
                className="border rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-primary-400"
                placeholder="INR"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-1">Quick Delivery Price (optional)</label>
              <input
                type="number"
                min="0"
                value={newCity.quick}
                onChange={e => setNewCity(c => ({ ...c, quick: e.target.value }))}
                className="border rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-primary-400"
                placeholder="INR"
              />
            </div>
            <div>
              <button
                type="button"
                onClick={handleAddCity}
                disabled={!newCity.city.trim() || !newCity.normal}
                className="bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold px-6 py-2 rounded shadow-md transition-colors duration-200 w-full"
              >
                Add City
              </button>
            </div>
          </div>
        </div>
        {/* Shipping Section */}
        <div>
          <h2 className="text-xl font-semibold mb-2 text-gray-800">Shipping Prices</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {shipping.map((s, idx) => (
              <div key={s.city} className="border rounded-lg p-4 bg-gray-50 relative">
                <div className="flex justify-between items-start mb-3">
                  <div className="font-medium text-primary-700">{s.city}</div>
                  {s.city.toLowerCase() !== 'other' && (
                    <button
                      type="button"
                      onClick={() => handleDeleteCity(s.city)}
                      className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors"
                      title="Delete city"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
                <div className="mb-3">
                  <label className="block text-gray-700 mb-1">Normal Delivery Price</label>
                  <input
                    type="number"
                    min="0"
                    value={s.normal}
                    onChange={e => handleShippingChange(idx, 'normal', e.target.value)}
                    className="border rounded px-3 py-2 w-32 focus:outline-none focus:ring-2 focus:ring-primary-400"
                  />
                  <span className="ml-2 text-gray-500">INR</span>
                </div>
                {s.city.toLowerCase() === 'chennai' && (
                  <div className="mb-3">
                    <label className="block text-gray-700 mb-1">Quick Delivery Price</label>
                    <input
                      type="number"
                      min="0"
                      value={s.quick || ''}
                      onChange={e => handleShippingChange(idx, 'quick', e.target.value)}
                      className="border rounded px-3 py-2 w-32 focus:outline-none focus:ring-2 focus:ring-primary-400"
                    />
                    <span className="ml-2 text-gray-500">INR</span>
                  </div>
                )}
                {s.city.toLowerCase() !== 'chennai' && s.city.toLowerCase() !== 'other' && (
                  <div className="mb-3">
                    <label className="block text-gray-700 mb-1">Quick Delivery Price (optional)</label>
                    <input
                      type="number"
                      min="0"
                      value={s.quick || ''}
                      onChange={e => handleShippingChange(idx, 'quick', e.target.value)}
                      className="border rounded px-3 py-2 w-32 focus:outline-none focus:ring-2 focus:ring-primary-400"
                      placeholder="Leave empty for no quick delivery"
                    />
                    <span className="ml-2 text-gray-500">INR</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

      </form>
    </motion.div>
  );
};

export default AdminSettingsPage; 