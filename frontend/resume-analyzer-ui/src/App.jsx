import { useState } from "react";

export default function App() {
  const [jobDescription, setJobDescription] = useState("");
  const [pdfFile, setPdfFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const analyzePdf = async () => {
    if (!pdfFile || !jobDescription) return;

    const formData = new FormData();
    formData.append("file", pdfFile);
    formData.append("job_description", jobDescription);

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("http://localhost:8000/analyze-pdf", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Analysis failed");
      const data = await response.json();
      setResult(data);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          AI Resume Analyzer
        </h1>
        <p className="text-gray-600 mb-8">
          Upload your PDF resume and compare it against a job description to get actionable feedback.
        </p>

        {/* PDF Upload */}
        <div className="mb-6">
          <input
            type="file"
            accept="application/pdf"
            id="pdf-upload"
            className="hidden"
            onChange={(e) => setPdfFile(e.target.files[0])}
          />
          <label
            htmlFor="pdf-upload"
            className="inline-block px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-400 cursor-pointer"
          >
            {pdfFile ? `Selected: ${pdfFile.name.substring(0, 25)}...` : "Choose PDF File"}
          </label>
        </div>

        {/* Job Description */}
        <textarea
          className="w-full h-64 p-4 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
          placeholder="Paste the job description here..."
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
        />

        {/* Analyze PDF Button */}
        <button
          onClick={analyzePdf}
          disabled={!pdfFile || !jobDescription || loading}
          className="mb-6 px-6 py-3 bg-green-500 text-white font-medium rounded-lg hover:bg-green-600 disabled:opacity-50"
        >
          {loading ? "Analyzing PDF..." : "Analyze PDF"}
        </button>

        {/* Error message */}
        {error && <p className="mt-4 text-red-600">{error}</p>}

        {/* Result */}
        {result && (
          <div className="mt-10 bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Results</h2>
              <div className="text-lg font-bold text-blue-600">
                <div className="w-32 bg-gray-200 rounded-full h-5 overflow-hidden">
                  <div
                    className="h-5 bg-blue-600"
                    style={{ width: `${result.match_score}%` }}
                  ></div>
                </div>
                <span className="block text-center mt-1">{result.match_score}% Match</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Section title="Strengths" items={result.strengths} />
              <Section title="Missing Skills" items={result.missing_skills} />
              <Section title="Suggestions" items={result.suggestions} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ title, items }) {
  return (
    <div>
      <h3 className="font-semibold text-gray-800 mb-2">{title}</h3>
      <ul className="list-disc list-inside text-gray-700 space-y-1">
        {items.map((item, idx) => (
          <li key={idx}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
