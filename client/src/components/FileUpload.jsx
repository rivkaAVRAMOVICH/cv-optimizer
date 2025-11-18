export default function FileUpload({ onFileSelect }) {
return (
<div>
<h3>Upload CV (PDF only)</h3>
<input
type="file"
accept="application/pdf"
onChange={(e) => onFileSelect(e.target.files[0])}
/>
</div>
)
}