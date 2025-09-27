import React, { useState } from 'react'
import Students from './components/Students'
import Subjects from './components/Subjects'   // ✅ this line is required
import Marks from './components/Marks'
import Attendance from './components/Attendance'
import './styles.css'


export default function App(){
  const [page, setPage] = useState('students')
  return (
    <div className="app">
      <header className="header">
        <h1>Student DBMS — Simple</h1>
        <nav>
            <button onClick={() => setPage('students')}>Students</button>
            <button onClick={() => setPage('subjects')}>Subjects</button>
            <button onClick={() => setPage('marks')}>Marks</button>      
            <button onClick={() => setPage('attendance')}>Attendance</button> 
       </nav>
      </header>

      <main>
        {page === 'students' && <Students />}
        {page === 'subjects' && <Subjects />}
        {page === 'marks' && <Marks />}
        {page === 'attendance' && <Attendance />}
      </main>

      <footer style={{ marginTop: 24, textAlign: 'center' }}>
        <small>Supabase + React — demo</small>
      </footer>
    </div>
  )
}
