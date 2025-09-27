import React, { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

export default function Students(){
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

  useEffect(() => { fetchStudents() }, [])

  async function fetchStudents(){
    setLoading(true)
    const { data, error } = await supabase.from('students').select('*').order('created_at', { ascending: false })
    if (error) {
      alert('Error loading students: ' + error.message)
    } else {
      setStudents(data || [])
    }
    setLoading(false)
  }

  async function addStudent(e){
    e.preventDefault()
    // simple validation
    if (!form.admission_no || !form.first_name) return alert('Admission No and First name required')
    const { error } = await supabase.from('students').insert([form])
    if (error) return alert('Insert failed: ' + error.message)
    setForm({ admission_no: '', first_name: '', last_name: '', email: '', phone: '', branch: '', year: 1 })
    fetchStudents()
  }

  async function deleteStudent(id){
    if (!window.confirm('Delete this student?')) return
    const { error } = await supabase.from('students').delete().eq('id', id)
    if (error) alert('Delete failed: ' + error.message)
    else fetchStudents()
  }

  return (
    <div>
      <h2>Students</h2>

      <form onSubmit={addStudent} className="card">
        <input placeholder="Admission No" required value={form.admission_no} onChange={e => setForm({...form, admission_no: e.target.value})} />
        <input placeholder="First name" required value={form.first_name} onChange={e => setForm({...form, first_name: e.target.value})} />
        <input placeholder="Last name" value={form.last_name} onChange={e => setForm({...form, last_name: e.target.value})} />
        <input placeholder="Email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
        <input placeholder="Phone" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
        <input placeholder="Branch" value={form.branch} onChange={e => setForm({...form, branch: e.target.value})} />
        <input type="number" min="1" placeholder="Year" value={form.year} onChange={e => setForm({...form, year: Number(e.target.value)})} />
        <button type="submit">Add Student</button>
      </form>

      {loading ? <p>Loading...</p> : (
        <table className="table">
          <thead>
            <tr><th>Admission</th><th>Name</th><th>Branch</th><th>Year</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {students.map(s => (
              <tr key={s.id}>
                <td>{s.admission_no}</td>
                <td>{s.first_name} {s.last_name}</td>
                <td>{s.branch}</td>
                <td>{s.year}</td>
                <td>
                  <button onClick={() => deleteStudent(s.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
