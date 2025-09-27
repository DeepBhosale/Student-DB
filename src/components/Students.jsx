import React, { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

export default function Students({ role = 'student' }) {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    admission_no: '',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    branch: '',
    year: 1
  })
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({})

  useEffect(() => { fetchStudents() }, [])

  async function fetchStudents() {
    setLoading(true)
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .order('created_at', { ascending: false })
    setLoading(false)
    if (error) return alert('Error loading students: ' + error.message)
    setStudents(data || [])
  }

  // Add student (admin only)
  async function addStudent(e) {
    e.preventDefault()
    if (role !== 'admin') return alert('Unauthorized')
    if (!form.admission_no || !form.first_name) return alert('Admission No and First name required')
    const { error } = await supabase.from('students').insert([form])
    if (error) return alert('Insert failed: ' + error.message)
    setForm({ admission_no: '', first_name: '', last_name: '', email: '', phone: '', branch: '', year: 1 })
    fetchStudents()
  }

  // Start editing
  function startEdit(s) {
    setEditingId(s.id)
    setEditForm({
      admission_no: s.admission_no,
      first_name: s.first_name,
      last_name: s.last_name,
      email: s.email,
      phone: s.phone,
      branch: s.branch,
      year: s.year
    })
  }

  // Cancel edit
  function cancelEdit() {
    setEditingId(null)
    setEditForm({})
  }

  // Save edit (admin only)
  async function saveEdit(e) {
    e.preventDefault()
    if (role !== 'admin') return alert('Unauthorized')
    const { error } = await supabase.from('students').update(editForm).eq('id', editingId)
    if (error) return alert('Update failed: ' + error.message)
    setEditingId(null)
    setEditForm({})
    fetchStudents()
  }

  // Delete student (admin only)
  async function deleteStudent(id) {
    if (role !== 'admin') return alert('Unauthorized')
    if (!window.confirm('Delete this student?')) return
    const { error } = await supabase.from('students').delete().eq('id', id)
    if (error) return alert('Delete failed: ' + error.message)
    fetchStudents()
  }

  return (
    <div style={{ width: '100%', maxWidth: 1000 }}>
      <h2>Students</h2>

      {role === 'admin' && (
        <form onSubmit={addStudent} className="card" style={{ marginBottom: 20 }}>
          <input placeholder="Admission No" required value={form.admission_no} onChange={e => setForm({ ...form, admission_no: e.target.value })} />
          <input placeholder="First name" required value={form.first_name} onChange={e => setForm({ ...form, first_name: e.target.value })} />
          <input placeholder="Last name" value={form.last_name} onChange={e => setForm({ ...form, last_name: e.target.value })} />
          <input placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          <input placeholder="Phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
          <input placeholder="Branch" value={form.branch} onChange={e => setForm({ ...form, branch: e.target.value })} />
          <input type="number" min="1" placeholder="Year" value={form.year} onChange={e => setForm({ ...form, year: Number(e.target.value) })} />
          <button type="submit">Add Student</button>
        </form>
      )}

      {loading ? <p>Loading...</p> : (
        <div style={{ overflowX: 'auto' }}>
          <table className="table" style={{ minWidth: 800 }}>
            <thead>
              <tr>
                <th>Admission</th>
                <th>Name</th>
                <th>Branch</th>
                <th>Year</th>
                <th>Email</th>
                <th>Phone</th>
                {role === 'admin' && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {students.map(s => (
                <tr key={s.id}>
                  <td>{s.admission_no}</td>
                  <td>{s.first_name} {s.last_name}</td>
                  <td>{s.branch}</td>
                  <td>{s.year}</td>
                  <td>{s.email}</td>
                  <td>{s.phone}</td>
                  {role === 'admin' && (
                    <td>
                      <button onClick={() => startEdit(s)}>Edit</button>
                      <button onClick={() => deleteStudent(s.id)}>Delete</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Inline edit modal-like form */}
      {editingId && (
        <div style={{ marginTop: 20 }}>
          <h3>Edit student</h3>
          <form onSubmit={saveEdit} className="card" style={{ maxWidth: 600 }}>
            <input placeholder="Admission No" required value={editForm.admission_no || ''} onChange={e => setEditForm({ ...editForm, admission_no: e.target.value })} />
            <input placeholder="First name" required value={editForm.first_name || ''} onChange={e => setEditForm({ ...editForm, first_name: e.target.value })} />
            <input placeholder="Last name" value={editForm.last_name || ''} onChange={e => setEditForm({ ...editForm, last_name: e.target.value })} />
            <input placeholder="Email" value={editForm.email || ''} onChange={e => setEditForm({ ...editForm, email: e.target.value })} />
            <input placeholder="Phone" value={editForm.phone || ''} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} />
            <input placeholder="Branch" value={editForm.branch || ''} onChange={e => setEditForm({ ...editForm, branch: e.target.value })} />
            <input type="number" min="1" placeholder="Year" value={editForm.year || 1} onChange={e => setEditForm({ ...editForm, year: Number(e.target.value) })} />
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
