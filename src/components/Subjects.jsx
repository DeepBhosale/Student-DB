import React, { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

export default function Subjects({ userRole }) {
  const [subjects, setSubjects] = useState([])
  const [form, setForm] = useState({ code: '', name: '', credits: 3 })
  const [loading, setLoading] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({})

  useEffect(() => { fetchSubjects() }, [])

  async function fetchSubjects() {
    setLoading(true)
    const { data, error } = await supabase.from('subjects').select('*').order('code', { ascending: true })
    setLoading(false)
    if (error) {
      console.error('Error loading subjects:', error)
      alert('Error loading subjects: ' + error.message)
      return
    }
    setSubjects(data || [])
  }

  async function addSubject(e) {
    e.preventDefault()
    if (userRole !== 'admin') {
      alert('Only admins can add subjects')
      return
    }
    if (!form.code || !form.name) {
      alert('Subject code and name are required')
      return
    }

    console.log('Adding subject:', form)
    const { error } = await supabase.from('subjects').insert([form])
    if (error) {
      console.error('Insert error:', error)
      alert('Failed to add subject: ' + error.message)
      return
    }
    
    setForm({ code: '', name: '', credits: 3 })
    alert('Subject added successfully!')
    fetchSubjects()
  }

  function startEdit(s) {
    setEditingId(s.id)
    setEditForm({ code: s.code, name: s.name, credits: s.credits })
  }

  function cancelEdit() {
    setEditingId(null)
    setEditForm({})
  }

  async function saveEdit(e) {
    e.preventDefault()
    if (userRole !== 'admin') {
      alert('Only admins can edit subjects')
      return
    }
    
    console.log('Updating subject:', editForm)
    const { error } = await supabase.from('subjects').update(editForm).eq('id', editingId)
    if (error) {
      console.error('Update error:', error)
      alert('Failed to update subject: ' + error.message)
      return
    }
    
    setEditingId(null)
    setEditForm({})
    alert('Subject updated successfully!')
    fetchSubjects()
  }

  async function deleteSubject(id) {
    if (userRole !== 'admin') {
      alert('Only admins can delete subjects')
      return
    }
    if (!window.confirm('Are you sure? This will also delete related marks and attendance records.')) return
    
    console.log('Deleting subject:', id)
    const { error } = await supabase.from('subjects').delete().eq('id', id)
    if (error) {
      console.error('Delete error:', error)
      alert('Failed to delete subject: ' + error.message)
      return
    }
    
    alert('Subject deleted successfully!')
    fetchSubjects()
  }

  return (
    <div style={{ width: '100%' }}>
      
      {/* ADD SUBJECT FORM - Only for Admin */}
      {userRole === 'admin' && (
        <div className="form-section">
          <h4>➕ Add New Subject</h4>
          <form onSubmit={addSubject}>
            <input 
              placeholder="Subject Code (e.g., CS101)" 
              required 
              value={form.code} 
              onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} 
            />
            <input 
              placeholder="Subject Name (e.g., Data Structures)" 
              required 
              value={form.name} 
              onChange={e => setForm({ ...form, name: e.target.value })} 
            />
            <input 
              type="number" 
              min="1" 
              max="10" 
              placeholder="Credits" 
              value={form.credits} 
              onChange={e => setForm({ ...form, credits: Number(e.target.value) })} 
            />
            <button type="submit" className="btn-success">
              Add Subject
            </button>
          </form>
        </div>
      )}

      {/* SUBJECTS LIST */}
      <div className="dashboard-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
          <h3>All Subjects ({subjects.length})</h3>
          <button onClick={fetchSubjects} className="btn-primary">
            🔄 Refresh
          </button>
        </div>

        {loading ? (
          <div className="loading">Loading subjects...</div>
        ) : subjects.length === 0 ? (
          <div className="empty-state">
            <p>No subjects found.</p>
            {userRole === 'admin' && <p>Use the form above to add the first subject.</p>}
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Subject Name</th>
                  <th>Credits</th>
                  {userRole === 'admin' && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {subjects.map(s => (
                  <tr key={s.id}>
                    <td><strong style={{ color: '#1e40af' }}>{s.code}</strong></td>
                    <td>{s.name}</td>
                    <td>{s.credits}</td>
                    {userRole === 'admin' && (
                      <td>
                        <div className="button-group">
                          <button 
                            onClick={() => startEdit(s)} 
                            className="btn-small btn-edit"
                          >
                            ✏️ Edit
                          </button>
                          <button 
                            onClick={() => deleteSubject(s.id)} 
                            className="btn-small btn-delete"
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* EDIT SUBJECT MODAL */}
      {editingId && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Edit Subject</h3>
            <form onSubmit={saveEdit}>
              <input 
                placeholder="Subject Code" 
                required 
                value={editForm.code || ''} 
                onChange={e => setEditForm({ ...editForm, code: e.target.value.toUpperCase() })} 
              />
              <input 
                placeholder="Subject Name" 
                required 
                value={editForm.name || ''} 
                onChange={e => setEditForm({ ...editForm, name: e.target.value })} 
              />
              <input 
                type="number" 
                min="1" 
                max="10" 
                placeholder="Credits" 
                value={editForm.credits || 3} 
                onChange={e => setEditForm({ ...editForm, credits: Number(e.target.value) })} 
              />
              <div className="button-group">
                <button type="submit" className="btn-success">
                  💾 Save Changes
                </button>
                <button 
                  type="button" 
                  onClick={cancelEdit} 
                  className="btn-secondary"
                >
                  ❌ Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}