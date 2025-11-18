import { useState } from 'react'
import FileUpload from './components/FileUpload'
import JobDescription from './components/JobDescription'
import Results from './components/Results'
import { optimizeForJob } from './api'


export default function App() {
const [cvFile, setCvFile] = useState(null)
const [jobDesc, setJobDesc] = useState('')
const [loading, setLoading] = useState(false)
const [results, setResults] = useState(null)
const [pdfFilename, setPdfFilename] = useState(null)


const handleSubmit = async () => {
if (!cvFile) return alert('Please upload a CV PDF file!')
if (!jobDesc) return alert('Please provide job description!')


setLoading(true)
const formData = new FormData()
formData.append('cv', cvFile)
formData.append('jobDescription', jobDesc)


try {
const response = await optimizeForJob(formData)
setResults(response.analysis)
setPdfFilename(response.filename)
} catch (err) {
console.error(err)
alert('Error analyzing CV')
}


setLoading(false)
}


return (
<div className="container">
<h1>CV Optimizer — Job Specific</h1>


<FileUpload onFileSelect={setCvFile} />
<JobDescription jobDesc={jobDesc} setJobDesc={setJobDesc} />


<button onClick={handleSubmit} disabled={loading}>
{loading ? 'Optimizing...' : 'Optimize for Job'}
</button>


{results && (
<Results data={results} filename={pdfFilename} />
)}
</div>
)
}