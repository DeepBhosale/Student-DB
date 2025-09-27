import React, { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

export default function Subjects({ role = 'student' }) {
  const [subjects, setSubjects] = useState([])
  const [form, setForm] = useState({ code: '', name: '', credits: 0 })
  const [loading, setLoading] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({})

  useEffect(() => { fetchSubjects() }, [])

  async function fetchSubjects() {
    setLoading(true)
    const { data, error } = await supabase.from('subjects').select('*').order('code', { ascending: true })
    setLoading(false)
    if (error) return alert('Error loading subjects: ' + error.message)
    setSubjects(data || [])
  }

  async function addSubject(e) {
    e.preventDefault()
    if (role !== 'admin') return alert('Unauthorized')
    if (!form.code || !form.name) return alert('Code and Name required')
    const { error } = await supabase.from('subjects').insert([form])
    if (error) return alert('Insert failed: ' + error.message)
    setForm({ code: '', name: '', credits: 0 })
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
    if (role !== 'admin') return alert('Unauthorized')
    const { error } = await supabase.from('subjects').update(editForm).eq('id', editingId)
    if (error) return alert('Update failed: ' + error.message)
    setEditingId(null)
    setEditForm({})
    fetchSubjects()
  }

  async function deleteSubject(id) {
    if (role !== 'admin') return alert('Unauthorized')
    if (!window.confirm('Delete this subject? Note: related marks/attendance will be removed (cascade).')) return
    const { error } = await supabase.from('subjects').delete().eq('id', id)
    if (error) return alert('Delete failed: ' + error.message)
    fetchSubjects()
  }

  return (
    <div style={{ width: '100%', maxWidth: 900 }}>
      <h2>Subjects</h2>

      {role === 'admin' && (
        <form onSubmit={addSubject} className="card" style={{ marginBottom: 20 }}>
          <input placeholder="Code (e.g., CS101)" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} />
          <input placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          <input type="number" min="0" placeholder="Credits" value={form.credits} onChange={e => setForm({ ...form, credits: Number(e.target.value) })} />
          <button type="submit">Add Subject</button>
        </form>
      )}

      {loading ? <p>Loading...</p> : (
        <div style={{ overflowX: 'auto' }}>
          <table className="table" style={{ minWidth: 700 }}>
            <thead>
              <tr>
                <th>Code</th>
                <th>Name</th>
                <th>Credits</th>
                {role === 'admin' && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {subjects.map(s => (
                <tr key={s.id}>
                  <td>{s.code}</td>
                  <td>{s.name}</td>
                  <td>{s.credits}</td>
                  {role === 'admin' && (
                    <td>
                      <button onClick={() => startEdit(s)}>Edit</button>
                      <button onClick={() => deleteSubject(s.id)}>Delete</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editingId && (
        <div style={{ marginTop: 20 }}>
          <h3>Edit subject</h3>
          <form onSubmit={saveEdit} className="card" style={{ maxWidth: 560 }}>
            <input placeholder="Code" value={editForm.code || ''} onChange={e => setEditForm({ ...editForm, code: e.target.value })} />
            <input placeholder="Name" value={editForm.name || ''} onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
            <input type="number" min="0" placeholder="Credits" value={editForm.credits || 0} onChange={e => setEditForm({ ...editForm, credits: Number(e.target.value) })} />
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="submit">Save</button>
              <button type="button" onClick={cancelEdit} style={{ background: '#888', color: '#fff' }}>Cancel</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
