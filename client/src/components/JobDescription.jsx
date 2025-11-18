export default function JobDescription({ jobDesc, setJobDesc }) {
return (
<div style={{ marginTop: '20px' }}>
<h3>Paste Job Description</h3>
<textarea
value={jobDesc}
onChange={(e) => setJobDesc(e.target.value)}
placeholder="Paste job description here"
/>
</div>
)
}