export async function optimizeForJob(formData) {
const res = await fetch('http://localhost:3001/api/optimize-for-job', {
method: 'POST',
body: formData
})
return res.json()
}