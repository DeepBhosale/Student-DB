import React, { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

export default function Attendance({ role = 'student' }) {
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
    const { data, error } = await supabase.from('students').select('id, admission_no, first_name')
    if (error) return alert('Error loading students: ' + error.message)
    setStudents(data || [])
  }

  async function fetchSubjects() {
    const { data, error } = await supabase.from('subjects').select('id, code, name')
    if (error) return alert('Error loading subjects: ' + error.message)
    setSubjects(data || [])
  }

  async function fetchRecords() {
    setLoading(true)
    const { data, error } = await supabase
      .from('attendance')
      .select('id, student_id, subject_id, date, present, created_at')
      .order('date', { ascending: false })
    setLoading(false)
    if (error) return alert('Error loading attendance: ' + error.message)
    setRecords(data || [])
  }

  // faculty add or update attendance (upsert)
  async function saveAttendance(e) {
    e?.preventDefault()
    if (role !== 'faculty') return alert('Unauthorized')
    if (!form.student_id || !form.subject_id || !form.date) return alert('Select student, subject and date')
    const payload = {
      student_id: form.student_id,
      subject_id: form.subject_id,
      date: form.date,
      present: form.present
    }
    const { error } = await supabase.from('attendance').upsert([payload], { onConflict: ['student_id', 'subject_id', 'date'] })
    if (error) return alert('Save failed: ' + error.message)
    fetchRecords()
  }

  async function deleteRecord(id) {
    if (role !== 'faculty') return alert('Unauthorized')
    if (!window.confirm('Delete this attendance record?')) return
    const { error } = await supabase.from('attendance').delete().eq('id', id)
    if (error) return alert('Delete failed: ' + error.message)
    fetchRecords()
  }

  function studentLabel(id) {
    const s = students.find(x => x.id === id)
    return s ? `${s.admission_no} — ${s.first_name}` : id
  }
  function subjectLabel(id) {
    const s = subjects.find(x => x.id === id)
    return s ? `${s.code} — ${s.name}` : id
  }

  return (
    <div style={{ width: '100%', maxWidth: 1000 }}>
      <h2>Attendance</h2>

      {role === 'faculty' && (
        <form onSubmit={saveAttendance} className="card" style={{ marginBottom: 20 }}>
          <select value={form.student_id} onChange={e => setForm({ ...form, student_id: e.target.value })}>
            <option value="">-- Select student --</option>
            {students.map(s => <option key={s.id} value={s.id}>{s.admission_no} — {s.first_name}</option>)}
          </select>

          <select value={form.subject_id} onChange={e => setForm({ ...form, subject_id: e.target.value })}>
            <option value="">-- Select subject --</option>
            {subjects.map(s => <option key={s.id} value={s.id}>{s.code} — {s.name}</option>)}
          </select>

          <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
          <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" checked={form.present} onChange={e => setForm({ ...form, present: e.target.checked })} />
            Present
          </label>

          <button type="submit">Save Attendance</button>
        </form>
      )}

      <h3>Recent attendance</h3>

      {loading ? <p>Loading...</p> : (
        <div style={{ overflowX: 'auto' }}>
          <table className="table" style={{ minWidth: 900 }}>
            <thead>
              <tr><th>Date</th><th>Student</th><th>Subject</th><th>Present</th>{role === 'faculty' && <th>Actions</th>}</tr>
            </thead>
            <tbody>
              {records.map(r => (
                <tr key={r.id}>
                  <td>{r.date}</td>
                  <td>{studentLabel(r.student_id)}</td>
                  <td>{subjectLabel(r.subject_id)}</td>
                  <td>{r.present ? 'Yes' : 'No'}</td>
                  {role === 'faculty' && (
                    <td>
                      <button onClick={() => {
                        // quick toggle: flip present value
                        const newVal = { present: !r.present }
                        supabase.from('attendance').update(newVal).eq('id', r.id).then(({ error }) => {
                          if (error) alert('Update failed: ' + error.message)
                          else fetchRecords()
                        })
                      }}>Toggle</button>
                      <button onClick={() => deleteRecord(r.id)}>Delete</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
