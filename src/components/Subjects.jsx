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
        <div style={{ marginBottom: '30px', padding: '20px', background: '#f8fafc', borderRadius: '12px', border: '2px solid #e2e8f0' }}>
          <h4 style={{ marginBottom: '20px', color: '#1e40af' }}>➕ Add New Subject</h4>
          <form onSubmit={addSubject} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
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
            <button type="submit" style={{ background: '#16a34a', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
              Add Subject
            </button>
          </form>
        </div>
      )}

      {/* SUBJECTS LIST */}
      <div style={{ background: 'white', padding: '20px', borderRadius: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3>All Subjects ({subjects.length})</h3>
          <button onClick={fetchSubjects} style={{ background: '#2563eb', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}>
            🔄 Refresh
          </button>
        </div>

        {loading ? (
          <p>Loading subjects...</p>
        ) : subjects.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
            <p>No subjects found.</p>
            {userRole === 'admin' && <p>Use the form above to add the first subject.</p>}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ minWidth: '600px' }}>
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
                        <button 
                          onClick={() => startEdit(s)} 
                          style={{ background: '#f59e0b', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', marginRight: '8px', fontSize: '12px' }}
                        >
                          ✏️ Edit
                        </button>
                        <button 
                          onClick={() => deleteSubject(s.id)} 
                          style={{ background: '#ef4444', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                        >
                          🗑️ Delete
                        </button>
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
        <div style={{ 
          position: 'fixed', 
          top: '0', 
          left: '0', 
          right: '0', 
          bottom: '0', 
          background: 'rgba(0,0,0,0.5)', 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          zIndex: 1000 
        }}>
          <div style={{ background: 'white', padding: '30px', borderRadius: '12px', maxWidth: '400px', width: '90%' }}>
            <h3 style={{ marginBottom: '20px', color: '#1e40af' }}>Edit Subject</h3>
            <form onSubmit={saveEdit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
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
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="submit" style={{ background: '#16a34a', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                  💾 Save Changes
                </button>
                <button 
                  type="button" 
                  onClick={cancelEdit} 
                  style={{ background: '#6b7280', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
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