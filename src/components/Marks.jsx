import React, { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

export default function Marks({ userRole }) {
  const [students, setStudents] = useState([])
  const [subjects, setSubjects] = useState([])
  const [marksList, setMarksList] = useState([])
  const [form, setForm] = useState({ student_id: '', subject_id: '', semester: 1, marks: 0, max_marks: 100 })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchStudents()
    fetchSubjects()
    fetchMarks()
  }, [])

  async function fetchStudents() {
    const { data, error } = await supabase.from('students').select('id, admission_no, first_name, last_name')
    if (error) {
      console.error('Error loading students:', error)
      return
    }
    setStudents(data || [])
  }

  async function fetchSubjects() {
    const { data, error } = await supabase.from('subjects').select('id, code, name')
    if (error) {
      console.error('Error loading subjects:', error)
      return
    }
    setSubjects(data || [])
  }

  async function fetchMarks() {
    setLoading(true)
    const { data, error } = await supabase
      .from('marks')
      .select('id, student_id, subject_id, semester, marks, max_marks, created_at')
      .order('created_at', { ascending: false })
    setLoading(false)
    if (error) {
      console.error('Error loading marks:', error)
      alert('Error loading marks: ' + error.message)
      return
    }
    setMarksList(data || [])
  }

  async function addMarks(e) {
    e.preventDefault()
    if (userRole !== 'faculty' && userRole !== 'admin') {
      alert('Only faculty and admin can add marks')
      return
    }
    if (!form.student_id || !form.subject_id) {
      alert('Please select both student and subject')
      return
    }
    if (form.marks < 0 || form.marks > form.max_marks) {
      alert('Marks should be between 0 and max marks')
      return
    }

    const payload = {
      student_id: form.student_id,
      subject_id: form.subject_id,
      semester: Number(form.semester),
      marks: Number(form.marks),
      max_marks: Number(form.max_marks)
    }
    
    console.log('Adding marks:', payload)
    const { error } = await supabase.from('marks').insert([payload])
    if (error) {
      console.error('Insert error:', error)
      alert('Failed to add marks: ' + error.message)
      return
    }
    
    setForm({ student_id: '', subject_id: '', semester: 1, marks: 0, max_marks: 100 })
    alert('Marks added successfully!')
    fetchMarks()
  }

  // Update marks (faculty only)
  async function updateMarks(id, updated) {
    if (userRole !== 'faculty' && userRole !== 'admin') {
      alert('Only faculty and admin can update marks')
      return
    }
    
    console.log('Updating marks:', updated)
    const { error } = await supabase.from('marks').update(updated).eq('id', id)
    if (error) {
      console.error('Update error:', error)
      alert('Failed to update marks: ' + error.message)
      return
    }
    fetchMarks()
  }

  async function deleteMarks(id) {
    if (userRole !== 'faculty' && userRole !== 'admin') {
      alert('Only faculty and admin can delete marks')
      return
    }
    if (!window.confirm('Are you sure you want to delete this marks record?')) return
    
    console.log('Deleting marks:', id)
    const { error } = await supabase.from('marks').delete().eq('id', id)
    if (error) {
      console.error('Delete error:', error)
      alert('Failed to delete marks: ' + error.message)
      return
    }
    
    alert('Marks deleted successfully!')
    fetchMarks()
  }

  function studentLabel(id) {
    const s = students.find(x => x.id === id)
    return s ? `${s.admission_no} — ${s.first_name} ${s.last_name}` : 'Unknown Student'
  }
  
  function subjectLabel(id) {
    const s = subjects.find(x => x.id === id)
    return s ? `${s.code} — ${s.name}` : 'Unknown Subject'
  }

  return (
    <div style={{ width: '100%' }}>

      {/* ADD MARKS FORM - For Faculty and Admin */}
      {(userRole === 'faculty' || userRole === 'admin') && (
        <div className="form-section">
          <h4>➕ Add Student Marks</h4>
          <form onSubmit={addMarks}>
            <select 
              value={form.student_id} 
              onChange={e => setForm({ ...form, student_id: e.target.value })}
              required
            >
              <option value="">-- Select Student --</option>
              {students.map(s => (
                <option key={s.id} value={s.id}>
                  {s.admission_no} — {s.first_name} {s.last_name}
                </option>
              ))}
            </select>

            <select 
              value={form.subject_id} 
              onChange={e => setForm({ ...form, subject_id: e.target.value })}
              required
            >
              <option value="">-- Select Subject --</option>
              {subjects.map(s => (
                <option key={s.id} value={s.id}>
                  {s.code} — {s.name}
                </option>
              ))}
            </select>

            <input 
              type="number" 
              min="1" 
              max="8" 
              value={form.semester} 
              onChange={e => setForm({ ...form, semester: Number(e.target.value) })} 
              placeholder="Semester" 
              required
            />
            
            <input 
              type="number" 
              min="0" 
              value={form.marks} 
              onChange={e => setForm({ ...form, marks: Number(e.target.value) })} 
              placeholder="Marks Obtained" 
              required
            />
            
            <input 
              type="number" 
              min="1" 
              value={form.max_marks} 
              onChange={e => setForm({ ...form, max_marks: Number(e.target.value) })} 
              placeholder="Total Marks" 
              required
            />

            <button type="submit" className="btn-success">
              Add Marks
            </button>
          </form>
        </div>
      )}

      {/* MARKS LIST */}
      <div className="dashboard-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
          <h3>Student Marks ({marksList.length})</h3>
          <button onClick={fetchMarks} className="btn-primary">
            🔄 Refresh
          </button>
        </div>

        {loading ? (
          <div className="loading">Loading marks...</div>
        ) : marksList.length === 0 ? (
          <div className="empty-state">
            <p>No marks records found.</p>
            {(userRole === 'faculty' || userRole === 'admin') && <p>Use the form above to add the first marks record.</p>}
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Subject</th>
                  <th>Sem</th>
                  <th>Marks</th>
                  <th>%</th>
                  <th>Date</th>
                  {(userRole === 'faculty' || userRole === 'admin') && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {marksList.map(m => (
                  <MarkRow
                    key={m.id}
                    m={m}
                    students={students}
                    subjects={subjects}
                    userRole={userRole}
                    onUpdate={(upd) => updateMarks(m.id, upd)}
                    onDelete={() => deleteMarks(m.id)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

// Sub-component for editable mark rows
function MarkRow({ m, students, subjects, userRole, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false)
  const [local, setLocal] = useState({ marks: m.marks, max_marks: m.max_marks, semester: m.semester })

  useEffect(() => {
    setLocal({ marks: m.marks, max_marks: m.max_marks, semester: m.semester })
  }, [m])

  function studentLabel(id) {
    const s = students.find(x => x.id === id)
    return s ? `${s.admission_no} — ${s.first_name} ${s.last_name}` : 'Unknown'
  }
  
  function subjectLabel(id) {
    const s = subjects.find(x => x.id === id)
    return s ? `${s.code} — ${s.name}` : 'Unknown'
  }

  const percentage = Math.round((m.marks / m.max_marks) * 100)
  const percentageColor = percentage >= 90 ? '#16a34a' : percentage >= 75 ? '#f59e0b' : percentage >= 40 ? '#ef4444' : '#dc2626'

  return (
    <tr>
      <td>{studentLabel(m.student_id)}</td>
      <td>{subjectLabel(m.subject_id)}</td>
      <td>
        {editing ? 
          <input type="number" min="1" max="8" value={local.semester} onChange={e => setLocal({ ...local, semester: Number(e.target.value) })} style={{ width: '50px', fontSize: '12px', padding: '4px' }} /> 
          : m.semester}
      </td>
      <td>
        {editing ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
            <input type="number" min="0" value={local.marks} onChange={e => setLocal({ ...local, marks: Number(e.target.value) })} style={{ width: '40px', fontSize: '12px', padding: '2px' }} />
            <span>/</span>
            <input type="number" min="1" value={local.max_marks} onChange={e => setLocal({ ...local, max_marks: Number(e.target.value) })} style={{ width: '40px', fontSize: '12px', padding: '2px' }} />
          </div>
        ) : (
          <strong>{m.marks}/{m.max_marks}</strong>
        )}
      </td>
      <td>
        <span style={{ color: percentageColor, fontWeight: 'bold' }}>
          {percentage}%
        </span>
      </td>
      <td>{m.created_at ? new Date(m.created_at).toLocaleDateString() : 'N/A'}</td>
      {(userRole === 'faculty' || userRole === 'admin') && (
        <td>
          {editing ? (
            <div className="button-group">
              <button 
                onClick={() => { 
                  onUpdate({ semester: local.semester, marks: local.marks, max_marks: local.max_marks }); 
                  setEditing(false) 
                }} 
                className="btn-small btn-success"
              >
                💾
              </button>
              <button 
                onClick={() => { 
                  setEditing(false); 
                  setLocal({ marks: m.marks, max_marks: m.max_marks, semester: m.semester }) 
                }} 
                className="btn-small btn-secondary"
              >
                ❌
              </button>
            </div>
          ) : (
            <div className="button-group">
              <button 
                onClick={() => setEditing(true)} 
                className="btn-small btn-edit"
              >
                ✏️
              </button>
              <button 
                onClick={onDelete} 
                className="btn-small btn-delete"
              >
                🗑️
              </button>
            </div>
          )}
        </td>
      )}
    </tr>
  )
}