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
    notes: ''
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
      // Check if there's an unclosed entry before this exit
      const hasUnclosedEntry = entries.some(entry => 
        entry.type === 'ENTRY' && 
        new Date(entry.date) < new Date(submissionData.date) &&
        !entries.some(exit => 
          exit.type === 'EXIT' && 
          new Date(exit.date) > new Date(entry.date) && 
          new Date(exit.date) < new Date(submissionData.date)
        )
      );
      
      if (!hasUnclosedEntry) {
        alert('Cannot add EXIT without a corresponding ENTRY. Please add an ENTRY first.');
        return;
      }
    } else if (submissionData.type === 'ENTRY') {
      // Check if there's already an unclosed entry
      const hasUnclosedEntry = entries.some(entry => 
        entry.type === 'ENTRY' && 
        !entries.some(exit => 
          exit.type === 'EXIT' && 
          new Date(exit.date) > new Date(entry.date)
        )
      );
      
      if (hasUnclosedEntry) {
        alert('Cannot add ENTRY while there is an unclosed entry. Please add an EXIT first.');
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
      notes: entry.notes || ''
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      type: 'ENTRY',
      date: new Date().toISOString().slice(0, 16), // Format for datetime-local input
      portOfEntry: '',
      notes: ''
    });
    setEditingEntry(null);
    setShowForm(false);
  };

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

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="form-container">
              <h3 className="form-title">
                {editingEntry ? 'Edit Entry' : 'Add Entry/Exit'}
              </h3>
              
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
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    className="form-textarea"
                    rows={3}
                    placeholder="Any additional notes..."
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="btn btn-primary"
                  >
                    {editingEntry ? 'Update' : 'Save'}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="btn btn-secondary"
                  >
                    Cancel
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
                      <span className={`entry-type ${entry.type.toLowerCase()} ${entry.type === 'ENTRY' && !hasExit ? 'entry-open' : ''}`}>
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
