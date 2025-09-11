"use client";
import React, { useState, useEffect } from 'react';
import AddQuestion from './addQuestion';

const QuestionBankPage = () => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [newlyAddedQuestion, setNewlyAddedQuestion] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [editText, setEditText] = useState('');
  const [editDepartment, setEditDepartment] = useState('');
  const [editSaving, setEditSaving] = useState(false);
  const [availableDepartments, setAvailableDepartments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchBy, setSearchBy] = useState('question'); // 'question' or 'department'

  // Load questions from API when component mounts
  useEffect(() => {
    loadQuestions();
    loadDepartments();
  }, []);

  const loadQuestions = async () => {
    try {
      setLoading(true);
      console.log('Loading questions from API...');
      const response = await fetch('/api/questions');
      console.log('API Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Loaded questions:', data.questions);
        setQuestions(data.questions);
      } else {
        console.error('Failed to load questions:', response.status);
        const errorData = await response.json();
        console.error('Error details:', errorData);
      }
    } catch (error) {
      console.error('Error loading questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDepartments = async () => {
    try {
      const response = await fetch('/api/departments');
      if (response.ok) {
        const data = await response.json();
        const activeDepartments = (data.departments || [])
          .filter(dept => dept.status === 'Active')
          .map(dept => dept.name);
        setAvailableDepartments(activeDepartments);
      } else {
        console.error('Failed to load departments');
        setAvailableDepartments(['Oncology', 'Cardiology', 'Neurology', 'Orthopedics', 'Pediatrics', 'General Medicine']);
      }
    } catch (error) {
      console.error('Error loading departments:', error);
      setAvailableDepartments(['Oncology', 'Cardiology', 'Neurology', 'Orthopedics', 'Pediatrics', 'General Medicine']);
    }
  };

  // Filter questions based on search criteria
  const filteredQuestions = questions.filter(question => {
    if (!searchTerm.trim()) return true;
    
    const term = searchTerm.toLowerCase().trim();
    
    if (searchBy === 'question') {
      return question.text.toLowerCase().includes(term);
    } else if (searchBy === 'department') {
      return question.department.toLowerCase().includes(term);
    }
    
    return true;
  });

  const handleEdit = (question) => {
    console.log('🔍 Opening edit form for question:', question);
    console.log('🔍 Question text:', question.text);
    console.log('🔍 Question department:', question.department);
    
    setEditingQuestion(question);
    setEditText(question.text);
    setEditDepartment(question.department);
    
    console.log('🔍 Form state set to:', {
      editText: question.text,
      editDepartment: question.department
    });
  };

  const handleEditSave = async () => {
    if (!editingQuestion || !editText.trim() || !editDepartment) return;

    try {
      setEditSaving(true);
      
      console.log('🔍 Updating question with data:', {
        id: editingQuestion._id || editingQuestion.id,
        text: editText.trim(),
        department: editDepartment,
        originalDepartment: editingQuestion.department
      });
      
      const response = await fetch('/api/questions', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          id: editingQuestion._id || editingQuestion.id, 
          text: editText.trim(),
          department: editDepartment.trim()
        }),
      });

      const result = await response.json();
      console.log('🔍 Update response:', result);

      if (response.ok) {
        // Close edit modal and clear state first
        setEditingQuestion(null);
        setEditText('');
        setEditDepartment('');
        
        // Clear search to show all questions after edit
        setSearchTerm('');
        
        // Refresh the questions data to ensure UI shows correct data
        await loadQuestions();
        
        // Dispatch event to notify other components
        window.dispatchEvent(new CustomEvent('questionCountUpdated'));
        
        // Show success message
        alert(`Question updated successfully! Department changed from "${editingQuestion.department}" to "${editDepartment}"`);
      } else {
        console.error('❌ Failed to update question:', result);
        alert(`Error updating question: ${result.error || 'Unknown error occurred'}`);
      }
    } catch (error) {
      console.error('❌ Error updating question:', error);
      alert(`Failed to update question: ${error.message}`);
    } finally {
      setEditSaving(false);
    }
  };

  const handleEditCancel = () => {
    setEditingQuestion(null);
    setEditText('');
    setEditDepartment('');
  };

  const handleDelete = (id) => {
    // Set the question to be deleted for confirmation popup
    const questionToDelete = questions.find(q => q._id === id || q.id === id);
    setDeleteConfirm(questionToDelete);
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    
    const id = deleteConfirm._id || deleteConfirm.id;
    
    try {
      const response = await fetch(`/api/questions?id=${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (response.ok) {
        // Reload questions from database to ensure data consistency
        await loadQuestions();
        
        // Dispatch event to notify other components
        window.dispatchEvent(new CustomEvent('questionCountUpdated'));
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error deleting question:', error);
      alert('Failed to delete question. Please try again.');
    } finally {
      setDeleteConfirm(null); // Close the popup
    }
  };

  const cancelDelete = () => {
    setDeleteConfirm(null);
  };

  const handleToggleStatus = async (id) => {
    const current = questions.find((q) => q._id === id || q.id === id);
    if (!current) return;

    const newStatus = current.status === 'Active' ? 'Inactive' : 'Active';

    try {
      const response = await fetch('/api/questions', {
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
        // Reload questions from database to ensure data consistency
        await loadQuestions();
        
        // Dispatch event to notify other components
        window.dispatchEvent(new CustomEvent('questionCountUpdated'));
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error updating question status:', error);
      alert('Failed to update question status. Please try again.');
    }
  };

  const handleCreate = async (newQuestion) => {
    try {
      console.log('Question created successfully:', newQuestion);
      
      // Reload questions from database to ensure data consistency
      await loadQuestions();
      
      // Set newly added question for highlighting (use the returned question from API)
      if (newQuestion._id) {
        setNewlyAddedQuestion(newQuestion._id);
        // Remove highlight after 3 seconds
        setTimeout(() => setNewlyAddedQuestion(null), 3000);
      }
      
      // Clear search to show all questions including the new one
      setSearchTerm('');
      
      // Dispatch custom event to notify other components to update question lists
      window.dispatchEvent(new CustomEvent('questionCountUpdated'));
      
      // Close the modal
      setAddOpen(false);
      
      // Return success
      return Promise.resolve();
    } catch (error) {
      console.error('Error handling question creation:', error);
      return Promise.reject(error);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Questions</h1>
        <div className="flex gap-2">
          {/* <button 
            onClick={loadQuestions} 
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded flex items-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Loading...
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </>
            )}
          </button> */}
          <button onClick={() => setAddOpen(true)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">
            <span className="text-lg">+</span>
            <span>Add Question</span>
          </button>
        </div>
      </div>

      {/* Search Section */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="flex-1 min-w-0">
            <input
              type="text"
              placeholder={`Search by ${searchBy === 'question' ? 'question text' : 'department'}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-3">
            <select
              value={searchBy}
              onChange={(e) => setSearchBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="question">Search by Question</option>
              <option value="department">Search by Department</option>
            </select>
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
        </div>
        {searchTerm && (
          <div className="mt-3 text-sm text-gray-600">
            Found {filteredQuestions.length} question{filteredQuestions.length !== 1 ? 's' : ''} 
            {searchTerm && ` matching "${searchTerm}"`}
          </div>
        )}
      </div>

      {addOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-4xl bg-white rounded shadow-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-xl font-semibold">Add Question</h2>
              <button onClick={() => setAddOpen(false)} className="text-gray-600 hover:text-gray-900">✕</button>
            </div>
            <div className="p-6">
              <AddQuestion onSubmit={handleCreate} onClose={() => setAddOpen(false)} />
            </div>
          </div>
        </div>
      )}

      {editingQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-2xl bg-white rounded shadow-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-xl font-semibold">Edit Question</h2>
              <button onClick={handleEditCancel} className="text-gray-600 hover:text-gray-900">✕</button>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {/* Current Values Display */}
                <div className="bg-gray-50 p-3 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Current Values:</h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div><strong>Question:</strong> {editingQuestion.text}</div>
                    <div><strong>Department:</strong> {editingQuestion.department}</div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Question Text *
                  </label>
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your question here..."
                    rows="4"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Department *
                  </label>
                  <select
                    value={editDepartment}
                    onChange={(e) => setEditDepartment(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select a department</option>
                    {availableDepartments.map((dept) => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                  {editDepartment && editDepartment !== editingQuestion.department && (
                    <div className="mt-1 text-sm text-blue-600">
                      ⚠️ Department will be changed from "{editingQuestion.department}" to "{editDepartment}"
                    </div>
                  )}
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={handleEditCancel}
                    disabled={editSaving}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 disabled:bg-gray-200 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleEditSave}
                    disabled={!editText.trim() || !editDepartment || editSaving}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {editSaving ? 'Updating...' : 'Update Question'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md bg-white rounded shadow-lg p-6">
            <h3 className="text-xl font-semibold mb-4">Confirm Deletion</h3>
            <p className="mb-4">Are you sure you want to delete "{deleteConfirm.text}"?</p>
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
              <th className="px-4 py-3 border">Question</th>
              <th className="px-4 py-3 border">Department</th>
              <th className="px-4 py-3 border">Status</th>
              <th className="px-4 py-3 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" className="px-4 py-3 border text-center text-gray-500">
                  Loading questions...
                </td>
              </tr>
            ) : filteredQuestions.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-4 py-3 border text-center text-gray-500">
                  {searchTerm ? `No questions found matching "${searchTerm}". Try a different search term.` : 'No questions found. Add your first question!'}
                </td>
              </tr>
            ) : (
              filteredQuestions.map((q, index) => (
                <tr 
                  key={q._id || q.id || `question-${index}`} 
                  className={`text-left transition-all duration-300 ${
                    newlyAddedQuestion === (q._id || q.id)
                      ? 'bg-green-50 border-l-4 border-l-green-500 shadow-md' 
                      : ''
                  }`}
                >
                  <td className="px-4 py-3 border">{index + 1}</td>
                  <td className="px-4 py-3 border">{q.text}</td>
                  <td className="px-4 py-3 border">{q.department}</td>
                  <td className="px-4 py-3 border">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      q.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {q.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 border">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(q)}
                        className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded"
                        title="Edit"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(q._id || q.id)}
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
                        title="Delete"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => handleToggleStatus(q._id || q.id)}
                        className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded"
                      >
                        {q.status === 'Active' ? 'Deactivate' : 'Activate'}
                      </button>
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

export default QuestionBankPage;


