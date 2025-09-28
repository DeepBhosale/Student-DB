import React, { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

export default function Attendance({ userRole }) {
  const [students, setStudents] = useState([])
  const [subjects, setSubjects] = useState([])
  const [records, setRecords] = useState([])
  const [form, setForm] = useState({
    student_id: '',
    subject_id: '',
    date: new Date().toISOString().slice(0, 10),
    present: true
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchStudents()
    fetchSubjects()
    fetchRecords()
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

  async function fetchRecords() {
    setLoading(true)
    const { data, error } = await supabase
      .from('attendance')
      .select('id, student_id, subject_id, date, present, created_at')
      .order('date', { ascending: false })
    setLoading(false)
    if (error) {
      console.error('Error loading attendance:', error)
      alert('Error loading attendance: ' + error.message)
      return
    }
    setRecords(data || [])
  }

  // faculty add or update attendance (upsert)
  async function saveAttendance(e) {
    e?.preventDefault()
    if (userRole !== 'faculty' && userRole !== 'admin') {
      alert('Only faculty and admin can manage attendance')
      return
    }
    if (!form.student_id || !form.subject_id || !form.date) {
      alert('Please select student, subject, and date')
      return
    }
    
    const payload = {
      student_id: form.student_id,
      subject_id: form.subject_id,
      date: form.date,
      present: form.present
    }
    
    console.log('Saving attendance:', payload)
    const { error } = await supabase
      .from('attendance')
      .upsert([payload], { onConflict: ['student_id', 'subject_id', 'date'] })
    
    if (error) {
      console.error('Save error:', error)
      alert('Failed to save attendance: ' + error.message)
      return
    }
    
    alert('Attendance saved successfully!')
    fetchRecords()
  }

  async function deleteRecord(id) {
    if (userRole !== 'faculty' && userRole !== 'admin') {
      alert('Only faculty and admin can delete attendance')
      return
    }
    if (!window.confirm('Are you sure you want to delete this attendance record?')) return
    
    console.log('Deleting attendance:', id)
    const { error } = await supabase.from('attendance').delete().eq('id', id)
    if (error) {
      console.error('Delete error:', error)
      alert('Failed to delete attendance: ' + error.message)
      return
    }
    
    alert('Attendance deleted successfully!')
    fetchRecords()
  }

  // Toggle attendance (quick action)
  async function toggleAttendance(record) {
    if (userRole !== 'faculty' && userRole !== 'admin') {
      alert('Only faculty and admin can update attendance')
      return
    }
    
    const newVal = { present: !record.present }
    console.log('Toggling attendance:', newVal)
    const { error } = await supabase.from('attendance').update(newVal).eq('id', record.id)
    if (error) {
      console.error('Toggle error:', error)
      alert('Failed to update attendance: ' + error.message)
      return
    }
    fetchRecords()
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

      {/* ADD ATTENDANCE FORM - For Faculty and Admin */}
      {(userRole === 'faculty' || userRole === 'admin') && (
        <div className="form-section">
          <h4>➕ Mark Attendance</h4>
          <form onSubmit={saveAttendance}>
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
              type="date" 
              value={form.date} 
              onChange={e => setForm({ ...form, date: e.target.value })} 
              required
            />

            <label style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              padding: '12px', 
              background: 'white', 
              borderRadius: '6px', 
              border: '1px solid #cbd5e1',
              cursor: 'pointer'
            }}>
              <input 
                type="checkbox" 
                checked={form.present} 
                onChange={e => setForm({ ...form, present: e.target.checked })} 
              />
              <span style={{ 
                fontWeight: form.present ? 'bold' : 'normal', 
                color: form.present ? '#16a34a' : '#ef4444',
                fontSize: '16px'
              }}>
                {form.present ? '✅ Present' : '❌ Absent'}
              </span>
            </label>

            <button type="submit" className="btn-success">
              Save Attendance
            </button>
          </form>
        </div>
      )}

      {/* ATTENDANCE RECORDS LIST */}
      <div className="dashboard-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
          <h3>Attendance Records ({records.length})</h3>
          <button onClick={fetchRecords} className="btn-primary">
            🔄 Refresh
          </button>
        </div>

        {loading ? (
          <div className="loading">Loading attendance...</div>
        ) : records.length === 0 ? (
          <div className="empty-state">
            <p>No attendance records found.</p>
            {(userRole === 'faculty' || userRole === 'admin') && <p>Use the form above to mark the first attendance.</p>}
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Student</th>
                  <th>Subject</th>
                  <th>Status</th>
                  <th>Recorded</th>
                  {(userRole === 'faculty' || userRole === 'admin') && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {records.map(r => (
                  <tr key={r.id}>
                    <td><strong>{r.date}</strong></td>
                    <td>{studentLabel(r.student_id)}</td>
                    <td>{subjectLabel(r.subject_id)}</td>
                    <td>
                      <span className={`status-badge ${r.present ? 'status-present' : 'status-absent'}`}>
                        {r.present ? '✅ Present' : '❌ Absent'}
                      </span>
                    </td>
                    <td>{r.created_at ? new Date(r.created_at).toLocaleDateString() : 'N/A'}</td>
                    {(userRole === 'faculty' || userRole === 'admin') && (
                      <td>
                        <div className="button-group">
                          <button 
                            onClick={() => toggleAttendance(r)}
                            className={`btn-small ${r.present ? 'btn-warning' : 'btn-success'}`}
                          >
                            {r.present ? '❌' : '✅'}
                          </button>
                          <button 
                            onClick={() => deleteRecord(r.id)} 
                            className="btn-small btn-delete"
                          >
                            🗑️
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

      {/* ATTENDANCE SUMMARY - Show some stats */}
      {records.length > 0 && (
        <div className="dashboard-section" style={{ marginTop: '20px' }}>
          <h4 style={{ marginBottom: '15px', color: '#1e40af' }}>📊 Quick Stats</h4>
          <div className="stats-grid">
            <div className="stat-card" style={{ background: '#dcfce7' }}>
              <div className="stat-value" style={{ color: '#166534' }}>
                {records.filter(r => r.present).length}
              </div>
              <div className="stat-label" style={{ color: '#166534' }}>Total Present</div>
            </div>
            <div className="stat-card" style={{ background: '#fee2e2' }}>
              <div className="stat-value" style={{ color: '#991b1b' }}>
                {records.filter(r => !r.present).length}
              </div>
              <div className="stat-label" style={{ color: '#991b1b' }}>Total Absent</div>
            </div>
            <div className="stat-card" style={{ background: '#dbeafe' }}>
              <div className="stat-value" style={{ color: '#1e40af' }}>
                {Math.round((records.filter(r => r.present).length / records.length) * 100)}%
              </div>
              <div className="stat-label" style={{ color: '#1e40af' }}>Overall Attendance</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}