import React, { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

export default function Students({ userRole }) {
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

  useEffect(() => { 
    fetchStudents()
  }, [])

  async function fetchStudents() {
    setLoading(true)
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .order('created_at', { ascending: false })
    setLoading(false)
    if (error) {
      console.error('Error loading students:', error)
      alert('Error loading students: ' + error.message)
      return
    }
    setStudents(data || [])
  }

  // Add student (admin only)
  async function addStudent(e) {
    e.preventDefault()
    if (userRole !== 'admin') {
      alert('Only admins can add students')
      return
    }
    if (!form.admission_no || !form.first_name) {
      alert('Admission No and First name are required')
      return
    }

    console.log('Adding student:', form)
    const { error } = await supabase.from('students').insert([form])
    if (error) {
      console.error('Insert error:', error)
      alert('Failed to add student: ' + error.message)
      return
    }
    
    // Reset form and refresh data
    setForm({ admission_no: '', first_name: '', last_name: '', email: '', phone: '', branch: '', year: 1 })
    alert('Student added successfully!')
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
    if (userRole !== 'admin') {
      alert('Only admins can edit students')
      return
    }
    
    console.log('Updating student:', editForm)
    const { error } = await supabase.from('students').update(editForm).eq('id', editingId)
    if (error) {
      console.error('Update error:', error)
      alert('Failed to update student: ' + error.message)
      return
    }
    
    setEditingId(null)
    setEditForm({})
    alert('Student updated successfully!')
    fetchStudents()
  }

  // Delete student (admin only)
  async function deleteStudent(id) {
    if (userRole !== 'admin') {
      alert('Only admins can delete students')
      return
    }
    if (!window.confirm('Are you sure you want to delete this student?')) return
    
    console.log('Deleting student:', id)
    const { error } = await supabase.from('students').delete().eq('id', id)
    if (error) {
      console.error('Delete error:', error)
      alert('Failed to delete student: ' + error.message)
      return
    }
    
    alert('Student deleted successfully!')
    fetchStudents()
  }

  // STUDENT VIEW - Simple view for students
  if (userRole === 'student') {
    return (
      <div style={{ padding: '20px', background: 'white', borderRadius: '12px' }}>
        <h3>Students in College</h3>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Admission No</th>
                  <th>Name</th>
                  <th>Branch</th>
                  <th>Year</th>
                </tr>
              </thead>
              <tbody>
                {students.map(s => (
                  <tr key={s.id}>
                    <td>{s.admission_no}</td>
                    <td>{s.first_name} {s.last_name}</td>
                    <td>{s.branch || 'N/A'}</td>
                    <td>{s.year || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    )
  }

  // ADMIN AND FACULTY VIEW
  return (
    <div style={{ width: '100%' }}>
      
      {/* ADD STUDENT FORM - Only for Admin */}
      {userRole === 'admin' && (
        <div style={{ marginBottom: '30px', padding: '20px', background: '#f8fafc', borderRadius: '12px', border: '2px solid #e2e8f0' }}>
          <h4 style={{ marginBottom: '20px', color: '#1e40af' }}>➕ Add New Student</h4>
          <form onSubmit={addStudent} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
            <input 
              placeholder="Admission No (e.g., 21BCE001)" 
              required 
              value={form.admission_no} 
              onChange={e => setForm({ ...form, admission_no: e.target.value })} 
            />
            <input 
              placeholder="First name" 
              required 
              value={form.first_name} 
              onChange={e => setForm({ ...form, first_name: e.target.value })} 
            />
            <input 
              placeholder="Last name" 
              value={form.last_name} 
              onChange={e => setForm({ ...form, last_name: e.target.value })} 
            />
            <input 
              placeholder="Email" 
              type="email"
              value={form.email} 
              onChange={e => setForm({ ...form, email: e.target.value })} 
            />
            <input 
              placeholder="Phone" 
              value={form.phone} 
              onChange={e => setForm({ ...form, phone: e.target.value })} 
            />
            <input 
              placeholder="Branch (e.g., Computer Science)" 
              value={form.branch} 
              onChange={e => setForm({ ...form, branch: e.target.value })} 
            />
            <input 
              type="number" 
              min="1" 
              max="4" 
              placeholder="Year" 
              value={form.year} 
              onChange={e => setForm({ ...form, year: Number(e.target.value) })} 
            />
            <button type="submit" style={{ background: '#16a34a', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
              Add Student
            </button>
          </form>
        </div>
      )}

      {/* STUDENTS LIST */}
      <div style={{ background: 'white', padding: '20px', borderRadius: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3>All Students ({students.length})</h3>
          <button onClick={fetchStudents} style={{ background: '#2563eb', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}>
            🔄 Refresh
          </button>
        </div>

        {loading ? (
          <p>Loading students...</p>
        ) : students.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
            <p>No students found.</p>
            {userRole === 'admin' && <p>Use the form above to add the first student.</p>}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ minWidth: '800px' }}>
              <thead>
                <tr>
                  <th>Admission No</th>
                  <th>Name</th>
                  <th>Branch</th>
                  <th>Year</th>
                  <th>Email</th>
                  <th>Phone</th>
                  {userRole === 'admin' && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {students.map(s => (
                  <tr key={s.id}>
                    <td><strong>{s.admission_no}</strong></td>
                    <td>{s.first_name} {s.last_name}</td>
                    <td>{s.branch || 'N/A'}</td>
                    <td>{s.year || 'N/A'}</td>
                    <td>{s.email || 'N/A'}</td>
                    <td>{s.phone || 'N/A'}</td>
                    {userRole === 'admin' && (
                      <td>
                        <button 
                          onClick={() => startEdit(s)} 
                          style={{ background: '#f59e0b', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', marginRight: '8px', fontSize: '12px' }}
                        >
                          ✏️ Edit
                        </button>
                        <button 
                          onClick={() => deleteStudent(s.id)} 
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

      {/* EDIT STUDENT MODAL */}
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
          <div style={{ background: 'white', padding: '30px', borderRadius: '12px', maxWidth: '500px', width: '90%', maxHeight: '90vh', overflow: 'auto' }}>
            <h3 style={{ marginBottom: '20px', color: '#1e40af' }}>Edit Student</h3>
            <form onSubmit={saveEdit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <input 
                placeholder="Admission No" 
                required 
                value={editForm.admission_no || ''} 
                onChange={e => setEditForm({ ...editForm, admission_no: e.target.value })} 
              />
              <input 
                placeholder="First name" 
                required 
                value={editForm.first_name || ''} 
                onChange={e => setEditForm({ ...editForm, first_name: e.target.value })} 
              />
              <input 
                placeholder="Last name" 
                value={editForm.last_name || ''} 
                onChange={e => setEditForm({ ...editForm, last_name: e.target.value })} 
              />
              <input 
                placeholder="Email" 
                type="email"
                value={editForm.email || ''} 
                onChange={e => setEditForm({ ...editForm, email: e.target.value })} 
              />
              <input 
                placeholder="Phone" 
                value={editForm.phone || ''} 
                onChange={e => setEditForm({ ...editForm, phone: e.target.value })} 
              />
              <input 
                placeholder="Branch" 
                value={editForm.branch || ''} 
                onChange={e => setEditForm({ ...editForm, branch: e.target.value })} 
              />
              <input 
                type="number" 
                min="1" 
                max="4" 
                placeholder="Year" 
                value={editForm.year || 1} 
                onChange={e => setEditForm({ ...editForm, year: Number(e.target.value) })} 
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