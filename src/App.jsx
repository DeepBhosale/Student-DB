import React, { useState } from 'react'
import Students from './components/Students'
import Subjects from './components/Subjects'
import Marks from './components/Marks'
import Attendance from './components/Attendance'
import './styles.css'

export default function App() {
  const [page, setPage] = useState('students')

  return (
    <div className="app-container">
      <header>
        <h1>VIT College Student Portal</h1>
        <nav>
          <button className={page==='students'?'active':''} onClick={() => setPage('students')}>Students</button>
          <button className={page==='subjects'?'active':''} onClick={() => setPage('subjects')}>Subjects</button>
          <button className={page==='marks'?'active':''} onClick={() => setPage('marks')}>Marks</button>
          <button className={page==='attendance'?'active':''} onClick={() => setPage('attendance')}>Attendance</button>
        </nav>
      </header>

      <main>
        {page === 'students' && <Students />}
        {page === 'subjects' && <Subjects />}
        {page === 'marks' && <Marks />}
        {page === 'attendance' && <Attendance />}
      </main>

      <footer>
        &copy; {new Date().getFullYear()} VIT College | All rights reserved
      </footer>
    </div>
  )
}
