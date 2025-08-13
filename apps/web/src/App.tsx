import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format, parseISO } from 'date-fns';
import { Calendar, MapPin, Plus, Trash2, Edit, TrendingUp, Target, Clock } from 'lucide-react';
import './App.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

interface EntryExit {
  id: string;
  type: 'ENTRY' | 'EXIT';
  date: string;
  portOfEntry: string;
  notes?: string;
  proofLink?: string; // Add proof link field
  i94Proof?: string; // Add I-94 proof field
  createdAt: string;
  updatedAt: string;
}

interface Stats {
  totalDaysInCanada: number;
  remainingDays: number;
  targetDays: number;
  percentageComplete: number;
}

function App() {
  const [entries, setEntries] = useState<EntryExit[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<EntryExit | null>(null);
  
  const [formData, setFormData] = useState({
    type: 'ENTRY' as 'ENTRY' | 'EXIT',
    date: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    portOfEntry: '',
    notes: '',
    correspondingEntryId: '', // New field for selecting corresponding entry
    proofLink: '', // New field for proof link
    i94Proof: '' // New field for I-94 proof
  });

  const commonPorts = [
    'Pacific Highway (Peace Arch)',
    'Douglas (Peace Arch)',
    'Pacific Highway (Truck Crossing)',
    'Aldergrove',
    'Huntingdon',
    'Abbotsford-Huntingdon',
    'Boundary Bay',
    'Point Roberts',
    'Blaine',
    'Lynden',
    'Sumas',
    'Osoyoos',
    'Coutts',
    'Emerson',
    'Windsor',
    'Niagara Falls',
    'Fort Erie',
    'Sarnia',
    'Windsor-Detroit',
    'Other'
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      console.log('Fetching data from:', `${API_BASE_URL}/entries`);
      const [entriesRes, statsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/entries`),
        axios.get(`${API_BASE_URL}/stats`)
      ]);
      console.log('Entries response:', entriesRes.data);
      console.log('Stats response:', statsRes.data);
      
      // Sort entries by date (oldest first)
      const sortedEntries = entriesRes.data.sort((a: EntryExit, b: EntryExit) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      
      setEntries(sortedEntries);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Convert the datetime-local input to ISO string
    const submissionData = {
      ...formData,
      date: new Date(formData.date).toISOString()
    };
    
    console.log('Form submitted with data:', submissionData);
    
    // Validate entry/exit logic
    if (submissionData.type === 'EXIT') {
      // Check if user selected a corresponding entry
      if (!submissionData.correspondingEntryId) {
        alert('Please select which entry you are exiting from.');
        return;
      }
      
      // Verify the selected entry exists and is unclosed
      const selectedEntry = entries.find(entry => entry.id === submissionData.correspondingEntryId);
      if (!selectedEntry) {
        alert('Selected entry not found. Please try again.');
        return;
      }
      
      if (selectedEntry.type !== 'ENTRY') {
        alert('Selected entry is not an ENTRY. Please select a valid entry.');
        return;
      }
      
      // Check if the selected entry already has an exit
      const hasExit = entries.some(exit => 
        exit.type === 'EXIT' && 
        new Date(exit.date) > new Date(selectedEntry.date)
      );
      
      if (hasExit) {
        alert('This entry already has an exit. Please select a different entry.');
        return;
      }
      
      // Verify exit date is after entry date
      if (new Date(submissionData.date) <= new Date(selectedEntry.date)) {
        alert('Exit date must be after the entry date.');
        return;
      }
      
    } else if (submissionData.type === 'ENTRY') {
      // Check if there's already an unclosed entry (any entry without a corresponding exit)
      const unclosedEntries = entries.filter(entry => 
        entry.type === 'ENTRY' && 
        !entries.some(exit => 
          exit.type === 'EXIT' && 
          new Date(exit.date) > new Date(entry.date)
        )
      );
      
      if (unclosedEntries.length > 0) {
        const oldestUnclosed = unclosedEntries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];
        const oldestDate = new Date(oldestUnclosed.date).toLocaleDateString();
        alert(`Cannot add ENTRY while there is an unclosed entry from ${oldestDate}. Please add an EXIT for that entry first.`);
        return;
      }
    }
    
    try {
      if (editingEntry) {
        console.log('Updating entry:', editingEntry.id);
        await axios.put(`${API_BASE_URL}/entries/${editingEntry.id}`, submissionData);
      } else {
        console.log('Creating new entry');
        await axios.post(`${API_BASE_URL}/entries`, submissionData);
      }
      console.log('API call successful, fetching updated data');
      await fetchData();
      resetForm();
    } catch (error: any) {
      console.error('Error saving entry:', error);
      if (error.response?.data?.details) {
        alert(`Validation error: ${error.response.data.details.map((d: any) => d.message).join(', ')}`);
      } else {
        alert('Error saving entry. Please check the console for details.');
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this entry?')) {
      try {
        await axios.delete(`${API_BASE_URL}/entries/${id}`);
        await fetchData();
      } catch (error) {
        console.error('Error deleting entry:', error);
      }
    }
  };

  const handleEdit = (entry: EntryExit) => {
    setEditingEntry(entry);
    setFormData({
      type: entry.type,
      date: new Date(entry.date).toISOString().slice(0, 16), // Format for datetime-local input
      portOfEntry: entry.portOfEntry,
      notes: entry.notes || '',
      correspondingEntryId: '', // Reset corresponding entry ID when editing
      proofLink: entry.proofLink || '', // Reset proof link when editing
      i94Proof: entry.i94Proof || '' // Reset I-94 proof when editing
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      type: 'ENTRY',
      date: new Date().toISOString().slice(0, 16), // Format for datetime-local input
      portOfEntry: '',
      notes: '',
      correspondingEntryId: '', // Reset corresponding entry ID
      proofLink: '', // Reset proof link
      i94Proof: '' // Reset I-94 proof
    });
    setEditingEntry(null);
    setShowForm(false);
  };

  // Helper function to get unclosed entries
  const getUnclosedEntries = () => {
    return entries.filter(entry => 
      entry.type === 'ENTRY' && 
      !entries.some(exit => 
        exit.type === 'EXIT' && 
        new Date(exit.date) > new Date(entry.date)
      )
    );
  };

  const unclosedEntries = getUnclosedEntries();

  if (loading) {
    return (
      <div className="container">
        <div className="text-center">
          <div className="spinner"></div>
          <p className="mt-4">Loading your residency tracker...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="container">
        {/* Header */}
        <div className="header">
          <h1 className="title">
            🇨🇦 Canada Residency Tracker
          </h1>
          <p className="subtitle">Track your 730-day residency obligation</p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="stats-grid">
            <div className="stat-card">
              <div className="flex items-center">
                <TrendingUp className="w-8 h-8" style={{ color: '#667eea' }} />
                <div className="ml-4">
                  <p className="stat-label">Total Days</p>
                  <p className="stat-number">{stats.totalDaysInCanada}</p>
                </div>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="flex items-center">
                <Target className="w-8 h-8" style={{ color: '#16a34a' }} />
                <div className="ml-4">
                  <p className="stat-label">Remaining</p>
                  <p className="stat-number">{stats.remainingDays}</p>
                </div>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="flex items-center">
                <Clock className="w-8 h-8" style={{ color: '#9333ea' }} />
                <div className="ml-4">
                  <p className="stat-label">Target</p>
                  <p className="stat-number">{stats.targetDays}</p>
                </div>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                  <span className="text-white text-sm font-bold">{Math.round(stats.percentageComplete)}%</span>
                </div>
                <div className="ml-4">
                  <p className="stat-label">Complete</p>
                  <p className="stat-number">{Math.round(stats.percentageComplete)}%</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Progress Bar */}
        {stats && (
          <div className="progress-container">
            <div className="progress-title">Progress to 730 days</div>
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ width: `${Math.min(100, stats.percentageComplete)}%` }}
              ></div>
            </div>
            <div className="progress-text">
              {stats.totalDaysInCanada} / {stats.targetDays} days
            </div>
          </div>
        )}

        {/* Add Entry Button */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Entry/Exit Records</h2>
          <button
            onClick={() => setShowForm(true)}
            className="btn btn-primary"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Entry/Exit
          </button>
        </div>

        {/* Warning for unclosed entries */}
        {unclosedEntries.length > 0 && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Unclosed Entries Found
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>The following entries need corresponding EXIT records:</p>
                  <ul className="mt-1 list-disc list-inside">
                    {unclosedEntries.map((entry, index) => (
                      <li key={entry.id}>
                        {format(parseISO(entry.date), 'MMM dd, yyyy HH:mm')} - {entry.portOfEntry}
                        {entry.notes && ` (${entry.notes})`}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-2 font-medium">Please add EXIT records for these entries to ensure accurate day counting.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Form Modal */}
        {showForm && (
          <div className="modal-overlay" onClick={() => setShowForm(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="form-title">
                  {editingEntry ? 'Edit Entry' : 'Add Entry/Exit'}
                </h3>
                <button
                  onClick={() => setShowForm(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
                  aria-label="Close modal"
                >
                  ×
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="form-grid">
                <div className="form-group">
                  <label className="form-label">
                    Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value as 'ENTRY' | 'EXIT'})}
                    className="form-select"
                  >
                    <option value="ENTRY">Entry to Canada</option>
                    <option value="EXIT">Exit from Canada</option>
                  </select>
                </div>

                {/* Show corresponding entry selector for EXIT */}
                {formData.type === 'EXIT' && (
                  <div className="form-group">
                    <label className="form-label">
                      Exit From Entry
                    </label>
                    <select
                      value={formData.correspondingEntryId}
                      onChange={(e) => {
                        const selectedId = e.target.value;
                        const selectedEntry = entries.find(entry => entry.id === selectedId);
                        setFormData({
                          ...formData, 
                          correspondingEntryId: selectedId,
                          portOfEntry: selectedEntry ? selectedEntry.portOfEntry : ''
                        });
                      }}
                      className="form-select"
                      required
                    >
                      <option value="">Select the entry you're exiting from</option>
                      {unclosedEntries.map(entry => (
                        <option key={entry.id} value={entry.id}>
                          {format(parseISO(entry.date), 'MMM dd, yyyy HH:mm')} - {entry.portOfEntry}
                          {entry.notes && ` (${entry.notes})`}
                        </option>
                      ))}
                    </select>
                    {unclosedEntries.length === 0 && (
                      <p className="text-sm text-red-600 mt-1">
                        No unclosed entries found. Please add an ENTRY first.
                      </p>
                    )}
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">
                    Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Port of Entry
                  </label>
                  <select
                    value={formData.portOfEntry}
                    onChange={(e) => setFormData({...formData, portOfEntry: e.target.value})}
                    className="form-select"
                    required
                  >
                    <option value="">Select port of entry</option>
                    {commonPorts.map(port => (
                      <option key={port} value={port}>{port}</option>
                    ))}
                  </select>
                  {formData.type === 'EXIT' && formData.correspondingEntryId && (
                    <p className="text-sm text-gray-600 mt-1">
                      Port auto-filled from selected entry (you can change this if needed)
                    </p>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    className="form-textarea"
                    placeholder="Any additional notes..."
                    rows={3}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Proof Link (Optional)
                  </label>
                  <input
                    type="url"
                    value={formData.proofLink}
                    onChange={(e) => setFormData({...formData, proofLink: e.target.value})}
                    className="form-input"
                    placeholder="https://example.com/proof or file:///path/to/file"
                  />
                  <p className="text-sm text-gray-600 mt-1">
                    Link to photo, receipt, or document as proof of entry/exit
                  </p>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    I-94 Proof (Optional)
                  </label>
                  <input
                    type="url"
                    value={formData.i94Proof}
                    onChange={(e) => setFormData({...formData, i94Proof: e.target.value})}
                    className="form-input"
                    placeholder="https://i94.cbp.dhs.gov/I94/ or screenshot link"
                  />
                  <p className="text-sm text-gray-600 mt-1">
                    Link to I-94 record from <a href="https://i94.cbp.dhs.gov/I94/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">cbp.dhs.gov</a> or screenshot
                  </p>
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={loading}
                  >
                    {loading ? 'Saving...' : (editingEntry ? 'Update' : 'Save')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Entries List */}
        <div className="entries-container">
          <h3 className="entries-title">Entry/Exit Records</h3>
          {entries.length === 0 ? (
            <div className="empty-state">
              <Calendar className="empty-icon" />
              <p className="empty-text">No entries yet</p>
              <p className="empty-subtext">Add your first entry/exit record!</p>
            </div>
          ) : (
            <div className="entries-list">
              {entries.map((entry) => {
                // Check if this entry has a corresponding exit
                const hasExit = entry.type === 'ENTRY' ? 
                  entries.some(exit => 
                    exit.type === 'EXIT' && 
                    new Date(exit.date) > new Date(entry.date)
                  ) : true;
                
                return (
                  <div key={entry.id} className={`entry-item ${entry.type === 'ENTRY' && !hasExit ? 'entry-open' : ''}`}>
                    <div className="entry-info">
                      <span className={`entry-type ${hasExit ? '' : 'entry-open'}`}>
                        {entry.type}
                        {entry.type === 'ENTRY' && !hasExit && ' (Open)'}
                      </span>
                      <div className="entry-date">
                        {format(parseISO(entry.date), 'MMM dd, yyyy HH:mm')}
                      </div>
                      <div className="entry-port">
                        <MapPin className="w-4 h-4 inline mr-1" />
                        {entry.portOfEntry}
                      </div>
                      {entry.notes && (
                        <div className="entry-notes">{entry.notes}</div>
                      )}
                      {entry.proofLink && (
                        <div className="entry-proof">
                          <a 
                            href={entry.proofLink} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="proof-link"
                          >
                            📎 View Proof
                          </a>
                        </div>
                      )}
                      {entry.i94Proof && (
                        <div className="entry-proof">
                          <a 
                            href={entry.i94Proof} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="proof-link i94-proof"
                          >
                            🛂 View I-94
                          </a>
                        </div>
                      )}
                    </div>
                    <div className="entry-actions">
                      <button
                        onClick={() => handleEdit(entry)}
                        className="btn btn-sm btn-secondary"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(entry.id)}
                        className="btn btn-sm btn-danger"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
