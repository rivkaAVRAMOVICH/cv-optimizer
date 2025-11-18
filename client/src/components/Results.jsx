import React from "react";
import "../styles.css";

export default function Results({ data, filename, loading }) {
  if (loading) {
    return (
      <div>
        <div className="spinner"></div>
        <p className="loading-text">Optimizing CV, please wait...</p>
      </div>
    );
  }

  return (
    <div className="results-container">
      <h2>CV Optimization Results</h2>

      <div className="result-card">
        <h3>Skills to Highlight</h3>
        <ul>
          {data.skills_to_highlight.map((skill, i) => <li key={i}>{skill}</li>)}
        </ul>
      </div>

      <div className="result-card">
        <h3>Suggested Changes</h3>
        <ul>
          {data.suggested_changes.map((change, i) => <li key={i}>{change}</li>)}
        </ul>
      </div>

      <div className="result-card">
        <h3>Missing Skills</h3>
        <ul>
          {data.missing_skills.map((skill, i) => <li key={i}>{skill}</li>)}
        </ul>
      </div>

      <div className="result-card">
        <h3>Match Score</h3>
        <p>{data.match_score}%</p>
      </div>

      <div className="result-card">
        <h3>Recommendations</h3>
        <p>{data.recommendations}</p>
      </div>

      <div className="result-card">
        <h3>Improved CV</h3>
        <pre>{data.improved_cv_text}</pre>
      </div>

      {filename && (
        <div style={{ textAlign: "center" }}>
          <a 
            href={`http://localhost:3001/api/download/${filename}`} 
            download 
            className="download-btn"
          >
            Download Improved PDF
          </a>
        </div>
      )}
    </div>
  );
}
