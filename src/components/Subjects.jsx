import React, { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

export default function Subjects(){
  const [subjects, setSubjects] = useState([])
  const [form, setForm] = useState({ code:'', name:'', credits:0 })

  useEffect(() => { fetchSubjects() }, [])

  async function fetchSubjects(){
    const { data, error } = await supabase.from('subjects').select('*').order('created_at', { ascending: false })
    if (error) alert('Error loading subjects: ' + error.message)
    else setSubjects(data || [])
  }

  async function addSubject(e){
    e.preventDefault()
    if(!form.code || !form.name) return alert('Code and Name required')
    const { error } = await supabase.from('subjects').insert([form])
    if(error) alert('Insert failed: ' + error.message)
    else { setForm({ code:'', name:'', credits:0 }); fetchSubjects() }
  }

  async function deleteSubject(id){
    if(!window.confirm('Delete this subject?')) return
    const { error } = await supabase.from('subjects').delete().eq('id', id)
    if(error) alert('Delete failed: ' + error.message)
    else fetchSubjects()
  }

  return (
    <div>
      <h2>Subjects</h2>

      <form onSubmit={addSubject} className="card">
        <input placeholder="Code" value={form.code} onChange={e=>setForm({...form, code:e.target.value})} />
        <input placeholder="Name" value={form.name} onChange={e=>setForm({...form, name:e.target.value})} />
        <input type="number" min="0" placeholder="Credits" value={form.credits} onChange={e=>setForm({...form, credits:Number(e.target.value)})} />
        <button type="submit">Add Subject</button>
      </form>

      <table className="table">
        <thead>
          <tr><th>Code</th><th>Name</th><th>Credits</th><th>Actions</th></tr>
        </thead>
        <tbody>
          {subjects.map(s => (
            <tr key={s.id}>
              <td>{s.code}</td>
              <td>{s.name}</td>
              <td>{s.credits}</td>
              <td><button onClick={()=>deleteSubject(s.id)}>Delete</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
