"use client";
import React, { useState, useEffect } from 'react';
import AddDepartment from './add-Department';

const DepartmentsPage = () => {
  const [departments, setDepartments] = useState([]);
  const [addOpen, setAddOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editingDepartment, setEditingDepartment] = useState(null);
  const [editName, setEditName] = useState('');
  const [editOpen, setEditOpen] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch departments from database
  const fetchDepartments = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch('/api/departments');
      if (response.ok) {
        const data = await response.json();
        setDepartments(data.departments || []);
      } else {
        console.error('Failed to fetch departments:', response.status);
        setError('Failed to load departments. Please try again.');
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  // Load departments on component mount
  useEffect(() => {
    fetchDepartments();
  }, []);

  // Cleanup edit state when component unmounts
  useEffect(() => {
    return () => {
      setEditingDepartment(null);
      setEditName('');
      setEditOpen(false);
    };
  }, []);

  const handleEdit = (department) => {
    // Set edit state and open modal
    setEditingDepartment(department);
    setEditName(department.name);
    setEditOpen(true);
  };

  const handleEditSave = async () => {
    if (!editingDepartment || !editName.trim()) return;

    try {
      setEditSaving(true);
      
      const response = await fetch('/api/departments', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          id: editingDepartment._id || editingDepartment.id, 
          name: editName.trim() 
        }),
      });

      const result = await response.json();

      if (response.ok) {
        // Close modal and clear edit state first
        setEditOpen(false);
        setEditingDepartment(null);
        setEditName('');
        
        // Clear search to show all departments after edit
        setSearchTerm('');
        
        // Refresh the departments data to ensure UI shows correct data
        await fetchDepartments();
        
        // Dispatch event to notify other components
        window.dispatchEvent(new CustomEvent('departmentCountUpdated'));
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error updating department:', error);
      alert('Failed to update department. Please try again.');
    } finally {
      setEditSaving(false);
    }
  };

  const handleEditCancel = () => {
    // Close modal and clear edit state
    setEditOpen(false);
    setEditingDepartment(null);
    setEditName('');
  };

  const handleDelete = async (id) => {
    // Set the department to be deleted for confirmation popup
    const deptToDelete = departments.find(d => d._id === id || d.id === id);
    setDeleteConfirm(deptToDelete);
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    
    const id = deleteConfirm._id || deleteConfirm.id;
    
    try {
      const response = await fetch(`/api/departments?id=${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (response.ok) {
        // Remove from local state
        setDepartments(prev => prev.filter(d => d._id !== id && d.id !== id));
        
        // Dispatch event to notify other components
        window.dispatchEvent(new CustomEvent('departmentCountUpdated'));
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error deleting department:', error);
      alert('Failed to delete department. Please try again.');
    } finally {
      setDeleteConfirm(null); // Close the popup
    }
  };

  const cancelDelete = () => {
    setDeleteConfirm(null);
  };

  const handleToggleStatus = async (id) => {
    console.log('=== TOGGLE STATUS DEBUG ===');
    console.log('Toggle status called for ID:', id);
    console.log('ID type:', typeof id);
    console.log('Current departments:', departments);
    
    // Find the specific department by ID
    const current = departments.find((d) => {
      const deptId = d._id || d.id;
      const isMatch = deptId === id;
      console.log(`Comparing: deptId="${deptId}" (${typeof deptId}) with id="${id}" (${typeof id}) - Match: ${isMatch}`);
      return isMatch;
    });
    
    console.log('Found department:', current);
    
    if (!current) {
      console.error('Department not found for ID:', id);
      alert('Department not found. Please refresh and try again.');
      return;
    }

    const newStatus = current.status === 'Active' ? 'Inactive' : 'Active';
    console.log(`Changing status from ${current.status} to ${newStatus} for department: ${current.name}`);

    try {
      const response = await fetch('/api/departments', {
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
        // Update only the specific department in local state
        setDepartments(prev => {
          console.log('Updating departments state...');
          const updated = prev.map(d => {
            const deptId = d._id || d.id;
            const isTarget = deptId === id;
            if (isTarget) {
              console.log(`✅ Updating department: ${d.name} (ID: ${deptId}) from ${d.status} to ${newStatus}`);
              return { ...d, status: newStatus };
            } else {
              console.log(`⏭️ Skipping department: ${d.name} (ID: ${deptId}) - not the target`);
            }
            return d;
          });
          console.log('Final updated departments:', updated);
          return updated;
        });
        
        // Dispatch event to notify other components
        window.dispatchEvent(new CustomEvent('departmentCountUpdated'));
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error updating department status:', error);
      alert('Failed to update department status. Please try again.');
    }
  };

  const handleCreate = async (newDepartment) => {
    // Add the new department to the local state
    setDepartments(prev => [newDepartment, ...prev]);
    setAddOpen(false);
    
    // Clear search to show all departments including the new one
    setSearchTerm('');
    
    // Dispatch event to notify other components
    window.dispatchEvent(new CustomEvent('departmentCountUpdated'));
  };

  // Filter departments based on search criteria
  const filteredDepartments = departments.filter(department => {
    if (!searchTerm.trim()) return true;
    
    const term = searchTerm.toLowerCase().trim();
    return department.name.toLowerCase().includes(term);
  });

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Departments</h1>
        <div className="flex items-center gap-4">
          {/* <button 
            onClick={() => {
              console.log('=== DEBUG INFO ===');
              console.log('Current departments state:', departments);
              console.log('Departments with their IDs:');
              departments.forEach((dept, index) => {
                console.log(`${index + 1}. ${dept.name} - ID: ${dept._id || dept.id} (${typeof (dept._id || dept.id)}) - Status: ${dept.status}`);
              });
            }}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded"
          >
            Debug Info
          </button> */}
          <button 
            onClick={fetchDepartments} 
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded"
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
          <button onClick={() => setAddOpen(true)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">
            <span className="text-lg">+</span>
            <span>Add Department</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {/* Search Section */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="flex-1 min-w-0">
            <input
              type="text"
              placeholder="Search by department name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-md transition-colors"
              title="Clear search"
            >
              ✕ Clear
            </button>
          )}
        </div>
        {searchTerm && (
          <div className="mt-3 text-sm text-gray-600">
            Found {filteredDepartments.length} department{filteredDepartments.length !== 1 ? 's' : ''} 
            {searchTerm && ` matching "${searchTerm}"`}
          </div>
        )}
      </div>

      {addOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-3xl bg-white rounded shadow-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-xl font-semibold">Add Department</h2>
              <button onClick={() => setAddOpen(false)} className="text-gray-600 hover:text-gray-900">✕</button>
            </div>
            <div className="p-6">
              <AddDepartment onSubmit={handleCreate} />
            </div>
          </div>
        </div>
      )}

      {editOpen && editingDepartment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md bg-white rounded shadow-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-xl font-semibold">Edit Department</h2>
              <button onClick={handleEditCancel} className="text-gray-600 hover:text-gray-900">✕</button>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Department Name
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter department name"
                  autoFocus
                />
              </div>
              <div className="flex justify-end gap-3">
                                 <button
                   onClick={handleEditCancel}
                   disabled={editSaving}
                   className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 disabled:bg-gray-200 disabled:cursor-not-allowed"
                 >
                   Cancel
                 </button>
                                 <button
                   onClick={handleEditSave}
                   disabled={editSaving}
                   className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed"
                 >
                   {editSaving ? 'Saving...' : 'Save Changes'}
                 </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md bg-white rounded shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Confirm Deletion</h3>
            <p className="mb-4">Are you sure you want to delete "{deleteConfirm.name}"?</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Delete
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
              <th className="px-4 py-3 border">Department</th>
              <th className="px-4 py-3 border">Status</th>
              <th className="px-4 py-3 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="4" className="px-4 py-8 text-center text-gray-500">
                  Loading departments...
                </td>
              </tr>
            ) : filteredDepartments.length === 0 ? (
              <tr>
                <td colSpan="4" className="px-4 py-8 text-center text-gray-500">
                  {searchTerm ? `No departments found matching "${searchTerm}". Try a different search term.` : 'No departments found. Add your first department above.'}
                </td>
              </tr>
            ) : (
              filteredDepartments.map((dept, index) => (
                <tr key={dept._id || dept.id}>
                  <td className="px-4 py-3 border">{index + 1}</td>
                                    <td className="px-4 py-3 border">
                    <div>
                      <div>{dept.name}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3 border">
                    {dept.status === 'Active' ? (
                      <span className="inline-block text-xs px-3 py-1 rounded bg-green-200 text-green-800">Active</span>
                    ) : (
                      <span className="inline-block text-xs px-3 py-1 rounded bg-gray-300 text-gray-700">Inactive</span>
                    )}
                  </td>
                  <td className="px-4 py-3 border">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(dept)}
                        className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(dept._id || dept.id)}
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
                      >
                        Delete
                      </button>
                      {dept.status === 'Active' ? (
                        <button
                          onClick={() => {
                            console.log('Deactivate clicked for:', dept.name, 'ID:', dept._id || dept.id);
                            handleToggleStatus(dept._id || dept.id);
                          }}
                          className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded"
                        >
                          Deactivate
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            console.log('Activate clicked for:', dept.name, 'ID:', dept._id || dept.id);
                            handleToggleStatus(dept._id || dept.id);
                          }}
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

export default DepartmentsPage;