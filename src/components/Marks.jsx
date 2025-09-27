import React, { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

export default function Marks({ role = 'student' }) {
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
    if (error) return alert('Error loading students: ' + error.message)
    setStudents(data || [])
  }

  async function fetchSubjects() {
    const { data, error } = await supabase.from('subjects').select('id, code, name')
    if (error) return alert('Error loading subjects: ' + error.message)
    setSubjects(data || [])
  }

  async function fetchMarks() {
    setLoading(true)
    const { data, error } = await supabase
      .from('marks')
      .select('id, student_id, subject_id, semester, marks, max_marks, created_at')
      .order('created_at', { ascending: false })
    setLoading(false)
    if (error) return alert('Error loading marks: ' + error.message)
    setMarksList(data || [])
  }

  async function addMarks(e) {
    e.preventDefault()
    if (role !== 'faculty') return alert('Unauthorized')
    if (!form.student_id || !form.subject_id) return alert('Choose student and subject')
    const payload = {
      student_id: form.student_id,
      subject_id: form.subject_id,
      semester: Number(form.semester),
      marks: Number(form.marks),
      max_marks: Number(form.max_marks)
    }
    const { error } = await supabase.from('marks').insert([payload])
    if (error) return alert('Insert failed: ' + error.message)
    setForm({ student_id: '', subject_id: '', semester: 1, marks: 0, max_marks: 100 })
    fetchMarks()
  }

  // Update marks (faculty only)
  async function updateMarks(id, updated) {
    if (role !== 'faculty') return alert('Unauthorized')
    const { error } = await supabase.from('marks').update(updated).eq('id', id)
    if (error) return alert('Update failed: ' + error.message)
    fetchMarks()
  }

  async function deleteMarks(id) {
    if (role !== 'faculty') return alert('Unauthorized')
    if (!window.confirm('Delete this marks record?')) return
    const { error } = await supabase.from('marks').delete().eq('id', id)
    if (error) return alert('Delete failed: ' + error.message)
    fetchMarks()
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
      <h2>Marks</h2>

      {role === 'faculty' && (
        <form onSubmit={addMarks} className="card" style={{ marginBottom: 20 }}>
          <select value={form.student_id} onChange={e => setForm({ ...form, student_id: e.target.value })}>
            <option value="">-- Select student --</option>
            {students.map(s => <option key={s.id} value={s.id}>{s.admission_no} — {s.first_name}</option>)}
          </select>

          <select value={form.subject_id} onChange={e => setForm({ ...form, subject_id: e.target.value })}>
            <option value="">-- Select subject --</option>
            {subjects.map(s => <option key={s.id} value={s.id}>{s.code} — {s.name}</option>)}
          </select>

          <input type="number" min="1" value={form.semester} onChange={e => setForm({ ...form, semester: Number(e.target.value) })} placeholder="Semester" />
          <input type="number" min="0" value={form.marks} onChange={e => setForm({ ...form, marks: Number(e.target.value) })} placeholder="Marks" />
          <input type="number" min="1" value={form.max_marks} onChange={e => setForm({ ...form, max_marks: Number(e.target.value) })} placeholder="Max marks" />

          <button type="submit">Add Marks</button>
        </form>
      )}

      <h3>Recent marks</h3>
      {loading ? <p>Loading...</p> : (
        <div style={{ overflowX: 'auto' }}>
          <table className="table" style={{ minWidth: 900 }}>
            <thead>
              <tr><th>Student</th><th>Subject</th><th>Sem</th><th>Marks</th><th>Date</th>{role === 'faculty' && <th>Actions</th>}</tr>
            </thead>
            <tbody>
              {marksList.map(m => (
                <MarkRow
                  key={m.id}
                  m={m}
                  students={students}
                  subjects={subjects}
                  role={role}
                  onUpdate={(upd) => updateMarks(m.id, upd)}
                  onDelete={() => deleteMarks(m.id)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// Small subcomponent to allow inline update for faculty
function MarkRow({ m, students, subjects, role, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false)
  const [local, setLocal] = useState({ marks: m.marks, max_marks: m.max_marks, semester: m.semester })

  useEffect(() => {
    setLocal({ marks: m.marks, max_marks: m.max_marks, semester: m.semester })
  }, [m])

  function studentLabel(id) {
    const s = students.find(x => x.id === id)
    return s ? `${s.admission_no} — ${s.first_name}` : id
  }
  function subjectLabel(id) {
    const s = subjects.find(x => x.id === id)
    return s ? `${s.code} — ${s.name}` : id
  }

  if (!role || role === 'student') {
    return (
      <tr>
        <td>{studentLabel(m.student_id)}</td>
        <td>{subjectLabel(m.subject_id)}</td>
        <td>{m.semester}</td>
        <td>{m.marks}/{m.max_marks}</td>
        <td>{m.created_at ? new Date(m.created_at).toLocaleString() : ''}</td>
        <td></td>
      </tr>
    )
  }

  return (
    <tr>
      <td>{studentLabel(m.student_id)}</td>
      <td>{subjectLabel(m.subject_id)}</td>
      <td>
        {editing ? <input type="number" value={local.semester} onChange={e => setLocal({ ...local, semester: Number(e.target.value) })} /> : m.semester}
      </td>
      <td>
        {editing ? (
          <>
            <input type="number" value={local.marks} onChange={e => setLocal({ ...local, marks: Number(e.target.value) })} style={{ width: 80 }} />
            <span> / </span>
            <input type="number" value={local.max_marks} onChange={e => setLocal({ ...local, max_marks: Number(e.target.value) })} style={{ width: 80 }} />
          </>
        ) : (
          `${m.marks}/${m.max_marks}`
        )}
      </td>
      <td>{m.created_at ? new Date(m.created_at).toLocaleString() : ''}</td>
      <td>
        {editing ? (
          <>
            <button onClick={() => { onUpdate({ semester: local.semester, marks: local.marks, max_marks: local.max_marks }); setEditing(false) }}>Save</button>
            <button onClick={() => { setEditing(false); setLocal({ marks: m.marks, max_marks: m.max_marks, semester: m.semester }) }} style={{ background: '#888' }}>Cancel</button>
          </>
        ) : (
          <>
            <button onClick={() => setEditing(true)}>Edit</button>
            <button onClick={onDelete}>Delete</button>
          </>
        )}
      </td>
    </tr>
  )
}
