"use client";
import React, { useState, useEffect } from 'react';
import AddLanguage from './addLanguage';

const LanguagesPage = () => {
  const [languages, setLanguages] = useState([]);
  const [addOpen, setAddOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editingLanguage, setEditingLanguage] = useState(null);
  const [editName, setEditName] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Fetch languages from database
  const fetchLanguages = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch('/api/languages');
      if (response.ok) {
        const data = await response.json();
        setLanguages(data.languages || []);
      } else {
        console.error('Failed to fetch languages:', response.status);
        setError('Failed to load languages. Please try again.');
      }
    } catch (error) {
      console.error('Error fetching languages:', error);
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  // Load languages on component mount
  useEffect(() => {
    fetchLanguages();
  }, []);

  const updateLanguage = (id, updates) => {
    setLanguages((prev) => prev.map((l) => (l.id === id || l._id === id ? { ...l, ...updates } : l)));
  };

  const handleEdit = (language) => {
    setEditingLanguage(language);
    setEditName(language.name);
  };

  const handleEditSave = async () => {
    if (!editingLanguage || !editName.trim()) return;

    try {
      const response = await fetch('/api/languages', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          id: editingLanguage._id || editingLanguage.id, 
          name: editName.trim() 
        }),
      });

      const result = await response.json();

      if (response.ok) {
        // Update local state
        updateLanguage(editingLanguage._id || editingLanguage.id, { name: editName.trim() });
        setEditingLanguage(null);
        setEditName('');
        alert('Language updated successfully!');
        
        // Dispatch event to notify other components
        window.dispatchEvent(new CustomEvent('languageCountUpdated'));
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error updating language:', error);
      alert('Failed to update language. Please try again.');
    }
  };

  const handleEditCancel = () => {
    setEditingLanguage(null);
    setEditName('');
  };

  const handleDelete = async (id) => {
    // Set the language to be deleted for confirmation popup
    const langToDelete = languages.find(l => l._id === id || l.id === id);
    setDeleteConfirm(langToDelete);
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    
    const id = deleteConfirm._id || deleteConfirm.id;
    
    try {
      const response = await fetch(`/api/languages?id=${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (response.ok) {
        // Remove from local state
        setLanguages(prev => prev.filter(l => l._id !== id && l.id !== id));
        
        // Dispatch event to notify other components
        window.dispatchEvent(new CustomEvent('languageCountUpdated'));
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error deleting language:', error);
      alert('Failed to delete language. Please try again.');
    } finally {
      setDeleteConfirm(null); // Close the popup
    }
  };

  const cancelDelete = () => {
    setDeleteConfirm(null);
  };

  const handleToggleStatus = async (id) => {
    const current = languages.find((l) => l.id === id || l._id === id);
    if (!current) return;

    const newStatus = current.status === 'Active' ? 'Inactive' : 'Active';

    try {
      const response = await fetch('/api/languages', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          id: current._id || current.id, 
          status: newStatus 
        }),
      });

      const result = await response.json();

      if (response.ok) {
        // Update local state
        updateLanguage(current._id || current.id, { status: newStatus });
        
        // Dispatch event to notify other components
        window.dispatchEvent(new CustomEvent('languageCountUpdated'));
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error updating language status:', error);
      alert('Failed to update language status. Please try again.');
    }
  };

  const handleCreate = async (newLanguage) => {
    // Add the new language to the local state
    setLanguages(prev => [newLanguage, ...prev]);
    setAddOpen(false);
    
    // Dispatch event to notify other components
    window.dispatchEvent(new CustomEvent('languageCountUpdated'));
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Configure - Languages</h1>
        <div className="flex items-center gap-4">
          <button 
            onClick={fetchLanguages} 
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded"
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
          <button onClick={() => setAddOpen(true)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">
            <span className="text-lg">+</span>
            <span>Add Language</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {addOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-2xl bg-white rounded shadow-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-xl font-semibold">Add Language</h2>
              <button onClick={() => setAddOpen(false)} className="text-gray-600 hover:text-gray-900">✕</button>
            </div>
            <div className="p-6">
              <AddLanguage onCreate={handleCreate} />
            </div>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md bg-white rounded shadow-lg p-6">
            <h3 className="text-xl font-semibold mb-4">Confirm Deletion</h3>
            <p className="mb-4">Are you sure you want to delete "{deleteConfirm.name}"?</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded"
              >
                Delete
              </button>
              <button
                onClick={cancelDelete}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="overflow-x-auto bg-white rounded shadow">
        <table className="min-w-full bg-white">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="px-4 py-3 border">S.No</th>
              <th className="px-4 py-3 border">Language</th>
              <th className="px-4 py-3 border">Status</th>
              <th className="px-4 py-3 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="4" className="px-4 py-8 text-center text-gray-500">
                  Loading languages...
                </td>
              </tr>
            ) : languages.length === 0 ? (
              <tr>
                <td colSpan="4" className="px-4 py-8 text-center text-gray-500">
                  No languages found. Add your first language above.
                </td>
              </tr>
            ) : (
              languages.map((lang, index) => (
                <tr key={lang._id || lang.id}>
                  <td className="px-4 py-3 border">{index + 1}</td>
                  <td className="px-4 py-3 border">
                    {editingLanguage && editingLanguage._id === lang._id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <button
                          onClick={handleEditSave}
                          className="px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-xs"
                        >
                          Save
                        </button>
                        <button
                          onClick={handleEditCancel}
                          className="px-2 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 text-xs"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      lang.name
                    )}
                  </td>
                  <td className="px-4 py-3 border">
                    {lang.status === 'Active' ? (
                      <span className="inline-block text-xs px-3 py-1 rounded bg-green-200 text-green-800">Active</span>
                    ) : (
                      <span className="inline-block text-xs px-3 py-1 rounded bg-gray-300 text-gray-700">Inactive</span>
                    )}
                  </td>
                  <td className="px-4 py-3 border">
                    <div className="flex gap-2">
                      {!editingLanguage || editingLanguage._id !== lang._id ? (
                        <button
                          onClick={() => handleEdit(lang)}
                          className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded"
                        >
                          Edit
                        </button>
                      ) : null}
                      <button
                        onClick={() => handleDelete(lang._id || lang.id)}
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
                      >
                        Delete
                      </button>
                      {lang.status === 'Active' ? (
                        <button
                          onClick={() => handleToggleStatus(lang._id || lang.id)}
                          className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded"
                        >
                          Deactivate
                        </button>
                      ) : (
                        <button
                          onClick={() => handleToggleStatus(lang._id || lang.id)}
                          className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded"
                        >
                          Activate
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LanguagesPage;