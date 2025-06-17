import React, { useState } from 'react';
import { Upload, FileText, Download, Copy, BookOpen, List, Search } from 'lucide-react';

const ResearchPaperExtractor = () => {
  const [extractedData, setExtractedData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [fileName, setFileName] = useState('');
  const [activeTab, setActiveTab] = useState('full');

  // Citation patterns for different formats
  const citationPatterns = {
    // In-text citations: (Author, Year), [1], (1), etc.
    inText: [
      /\([A-Za-z\s&,]+,?\s+\d{4}[a-z]?\)/g, // (Author, 2023)
      /\([A-Za-z\s&,]+\s+et\s+al\.?,?\s+\d{4}[a-z]?\)/g, // (Author et al., 2023)
      /\[\d+\]/g, // [1]
      /\(\d+\)/g, // (1)
    ],
    // Reference list patterns
    references: [
      // APA format
      /^[A-Za-z\s,&.]+\(\d{4}\)\.\s*.+$/gm,
      // IEEE format
      /^\[\d+\]\s+[A-Za-z\s,&.]+,?\s*".+,"\s*.+,?\s*\d{4}\.?$/gm,
      // Nature format
      /^\d+\.\s+[A-Za-z\s,&.]+\s*.+\s*\(\d{4}\)\.?$/gm,
    ]
  };

  const extractPaperStructure = (text) => {
    const sections = {};
    const citations = {
      inText: new Set(),
      references: [],
      count: 0
    };

    // Extract sections
    const sectionHeaders = [
      'abstract', 'introduction', 'methodology', 'methods', 'results', 
      'discussion', 'conclusion', 'references', 'bibliography', 'acknowledgments'
    ];

    let currentSection = 'content';
    const lines = text.split('\n');
    
    sectionHeaders.forEach(header => {
      sections[header] = '';
    });
    sections.content = '';

    // Simple section detection
    lines.forEach(line => {
      const lowerLine = line.toLowerCase().trim();
      
      // Check if line is a section header
      const foundSection = sectionHeaders.find(section => 
        lowerLine === section || 
        lowerLine.startsWith(section + ' ') ||
        lowerLine === section + ':'
      );

      if (foundSection) {
        currentSection = foundSection;
      } else {
        sections[currentSection] += line + '\n';
      }
    });

    // Extract in-text citations
    citationPatterns.inText.forEach(pattern => {
      const matches = text.match(pattern) || [];
      matches.forEach(match => citations.inText.add(match));
    });

    // Extract references
    const referencesText = sections.references || sections.bibliography || '';
    if (referencesText) {
      // Try different reference formats
      citationPatterns.references.forEach(pattern => {
        const matches = referencesText.match(pattern) || [];
        citations.references.push(...matches);
      });

      // If no structured references found, split by double newlines or numbered lists
      if (citations.references.length === 0) {
        const refLines = referencesText
          .split(/\n\s*\n|\n\d+\.|\n\[\d+\]/)
          .filter(line => line.trim().length > 50) // Filter out short lines
          .map(line => line.trim());
        citations.references = refLines;
      }
    }

    citations.count = citations.inText.size + citations.references.length;

    return {
      sections,
      citations,
      title: extractTitle(text),
      authors: extractAuthors(text)
    };
  };

  const extractTitle = (text) => {
    const lines = text.split('\n').slice(0, 10); // Check first 10 lines
    for (let line of lines) {
      line = line.trim();
      if (line.length > 10 && line.length < 200 && 
          !line.toLowerCase().includes('abstract') &&
          !line.match(/^\d+/) &&
          line.split(' ').length > 2) {
        return line;
      }
    }
    return 'Title not detected';
  };

  const extractAuthors = (text) => {
    // Simple author extraction - looks for patterns like "Name, Name and Name"
    const lines = text.split('\n').slice(0, 20);
    for (let line of lines) {
      const authorPattern = /^[A-Z][a-z]+\s+[A-Z][a-z]+(?:,\s+[A-Z][a-z]+\s+[A-Z][a-z]+)*(?:\s+and\s+[A-Z][a-z]+\s+[A-Z][a-z]+)?/;
      const match = line.match(authorPattern);
      if (match) {
        return match[0];
      }
    }
    return 'Authors not detected';
  };

  const extractFromPDF = async (file) => {
    setIsLoading(true);
    setError('');
    setFileName(file.name);

    try {
      // Load PDF.js
      if (!window.pdfjsLib) {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
        document.head.appendChild(script);
        
        await new Promise((resolve) => {
          script.onload = resolve;
        });
        
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      }

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      let fullText = '';
      
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        
        const pageText = textContent.items
          .map(item => item.str)
          .join(' ');
        
        fullText += pageText + '\n';
      }
      
      const structuredData = extractPaperStructure(fullText);
      structuredData.fullText = fullText;
      structuredData.pageCount = pdf.numPages;
      
      setExtractedData(structuredData);
    } catch (err) {
      setError(`Error processing PDF: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      extractFromPDF(file);
    } else {
      setError('Please select a valid PDF file');
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && file.type === 'application/pdf') {
      extractFromPDF(file);
    } else {
      setError('Please drop a valid PDF file');
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      alert('Copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const downloadData = (data, filename) => {
    const blob = new Blob([data], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-800">Research Paper Citation Extractor</h1>
        <p className="text-gray-600">Extract citations, references, and structure from academic papers</p>
      </div>

      {/* Upload Area */}
      <div
        className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <p className="text-lg font-medium text-gray-700 mb-2">
          Drop your research paper PDF here
        </p>
        <input
          type="file"
          accept=".pdf"
          onChange={handleFileUpload}
          className="hidden"
          id="pdf-upload"
        />
        <label
          htmlFor="pdf-upload"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer transition-colors"
        >
          <BookOpen className="mr-2 h-4 w-4" />
          Choose PDF File
        </label>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Analyzing research paper...</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Results */}
      {extractedData && (
        <div className="space-y-6">
          {/* Paper Info */}
          <div className="bg-white border rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Paper Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <p className="text-gray-900">{extractedData.title}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Authors</label>
                <p className="text-gray-900">{extractedData.authors}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pages</label>
                <p className="text-gray-900">{extractedData.pageCount}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Total Citations Found</label>
                <p className="text-gray-900 font-semibold text-blue-600">{extractedData.citations.count}</p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8">
              {['full', 'citations', 'references', 'abstract'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm capitalize ${
                    activeTab === tab
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab === 'full' ? 'Full Text' : tab}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="bg-white border rounded-lg shadow-sm">
            {activeTab === 'full' && (
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Full Text</h3>
                  <div className="space-x-2">
                    <button
                      onClick={() => copyToClipboard(extractedData.fullText)}
                      className="inline-flex items-center px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      Copy
                    </button>
                    <button
                      onClick={() => downloadData(extractedData.fullText, `${fileName}_full_text.txt`)}
                      className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </button>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono">
                    {extractedData.fullText}
                  </pre>
                </div>
              </div>
            )}

            {activeTab === 'citations' && (
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">In-Text Citations ({extractedData.citations.inText.size})</h3>
                  <button
                    onClick={() => copyToClipboard(Array.from(extractedData.citations.inText).join('\n'))}
                    className="inline-flex items-center px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Copy All
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {Array.from(extractedData.citations.inText).map((citation, index) => (
                    <div key={index} className="bg-blue-50 border border-blue-200 rounded px-3 py-2 text-sm">
                      {citation}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'references' && (
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">References ({extractedData.citations.references.length})</h3>
                  <button
                    onClick={() => copyToClipboard(extractedData.citations.references.join('\n\n'))}
                    className="inline-flex items-center px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Copy All
                  </button>
                </div>
                <div className="space-y-3">
                  {extractedData.citations.references.map((ref, index) => (
                    <div key={index} className="bg-gray-50 border rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded">
                          {index + 1}
                        </span>
                        <p className="text-sm text-gray-800 flex-1">{ref}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'abstract' && (
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Abstract</h3>
                  <button
                    onClick={() => copyToClipboard(extractedData.sections.abstract)}
                    className="inline-flex items-center px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Copy
                  </button>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-800 leading-relaxed">
                    {extractedData.sections.abstract || 'Abstract not detected'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ResearchPaperExtractor;