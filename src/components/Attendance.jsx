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
        <div style={{ marginBottom: '30px', padding: '20px', background: '#f8fafc', borderRadius: '12px', border: '2px solid #e2e8f0' }}>
          <h4 style={{ marginBottom: '20px', color: '#1e40af' }}>➕ Mark Attendance</h4>
          <form onSubmit={saveAttendance} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
            <select 
              value={form.student_id} 
              onChange={e => setForm({ ...form, student_id: e.target.value })}
              required
              style={{ padding: '8px' }}
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
              style={{ padding: '8px' }}
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
              style={{ padding: '8px' }}
            />

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', background: 'white', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
              <input 
                type="checkbox" 
                checked={form.present} 
                onChange={e => setForm({ ...form, present: e.target.checked })} 
              />
              <span style={{ fontWeight: form.present ? 'bold' : 'normal', color: form.present ? '#16a34a' : '#ef4444' }}>
                {form.present ? '✅ Present' : '❌ Absent'}
              </span>
            </label>

            <button type="submit" style={{ background: '#16a34a', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
              Save Attendance
            </button>
          </form>
        </div>
      )}

      {/* ATTENDANCE RECORDS LIST */}
      <div style={{ background: 'white', padding: '20px', borderRadius: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3>Attendance Records ({records.length})</h3>
          <button onClick={fetchRecords} style={{ background: '#2563eb', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}>
            🔄 Refresh
          </button>
        </div>

        {loading ? (
          <p>Loading attendance...</p>
        ) : records.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
            <p>No attendance records found.</p>
            {(userRole === 'faculty' || userRole === 'admin') && <p>Use the form above to mark the first attendance.</p>}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ minWidth: '900px' }}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Student</th>
                  <th>Subject</th>
                  <th>Status</th>
                  <th>Recorded On</th>
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
                      <span 
                        style={{ 
                          padding: '4px 8px', 
                          borderRadius: '6px', 
                          fontSize: '12px', 
                          fontWeight: 'bold',
                          background: r.present ? '#dcfce7' : '#fee2e2',
                          color: r.present ? '#166534' : '#991b1b'
                        }}
                      >
                        {r.present ? '✅ Present' : '❌ Absent'}
                      </span>
                    </td>
                    <td>{r.created_at ? new Date(r.created_at).toLocaleDateString() : 'N/A'}</td>
                    {(userRole === 'faculty' || userRole === 'admin') && (
                      <td>
                        <div style={{ display: 'flex', gap: '5px' }}>
                          <button 
                            onClick={() => toggleAttendance(r)}
                            style={{ 
                              background: r.present ? '#f59e0b' : '#16a34a', 
                              color: 'white', 
                              border: 'none', 
                              padding: '2px 6px', 
                              borderRadius: '4px', 
                              cursor: 'pointer', 
                              fontSize: '11px' 
                            }}
                          >
                            {r.present ? '❌ Mark Absent' : '✅ Mark Present'}
                          </button>
                          <button 
                            onClick={() => deleteRecord(r.id)} 
                            style={{ background: '#ef4444', color: 'white', border: 'none', padding: '2px 6px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}
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

      {/* ATTENDANCE SUMMARY - Show some stats */}
      {records.length > 0 && (
        <div style={{ marginTop: '20px', padding: '15px', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <h4 style={{ marginBottom: '10px', color: '#1e40af' }}>📊 Quick Stats</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px' }}>
            <div style={{ textAlign: 'center', padding: '10px', background: '#dcfce7', borderRadius: '8px' }}>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#166534' }}>
                {records.filter(r => r.present).length}
              </div>
              <div style={{ fontSize: '12px', color: '#166534' }}>Total Present</div>
            </div>
            <div style={{ textAlign: 'center', padding: '10px', background: '#fee2e2', borderRadius: '8px' }}>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#991b1b' }}>
                {records.filter(r => !r.present).length}
              </div>
              <div style={{ fontSize: '12px', color: '#991b1b' }}>Total Absent</div>
            </div>
            <div style={{ textAlign: 'center', padding: '10px', background: '#dbeafe', borderRadius: '8px' }}>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1e40af' }}>
                {Math.round((records.filter(r => r.present).length / records.length) * 100)}%
              </div>
              <div style={{ fontSize: '12px', color: '#1e40af' }}>Overall Attendance</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}