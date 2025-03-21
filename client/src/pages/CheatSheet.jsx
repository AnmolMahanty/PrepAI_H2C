import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import { Printer, Download, Loader2, ArrowLeft } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import html2pdf from "html2pdf.js";

const CheatSheetPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const contentRef = useRef(null);

  // State for form inputs
  const [topic, setTopic] = useState(location.state?.topic || "");
  const [description, setDescription] = useState(
    location.state?.details?.join("\n") || location.state?.description || ""
  );

  // Map incoming type to cheatsheet format
  const mapCheatSheetType = (type) => {
    const typeMap = {
      short: "Quick Reference",
      brief: "Exam Prep",
      detailed: "Comprehensive",
    };
    return typeMap[type] || "Comprehensive";
  };

  const [cheatSheetType, setCheatSheetType] = useState(
    location.state?.type
      ? mapCheatSheetType(location.state.type)
      : "Comprehensive"
  );

  // State for API results
  const [loading, setLoading] = useState(false);
  const [cheatSheet, setCheatSheet] = useState(null);
  const [error, setError] = useState(null);
  const [autoGenerated, setAutoGenerated] = useState(false);

  // Auto-generate cheatsheet if data is received from location state
  useEffect(() => {
    if (location.state?.topic && location.state?.details && !autoGenerated) {
      generateCheatSheet();
      setAutoGenerated(true);
    }
  }, [location.state]);

  const generateCheatSheet = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(
        "http://localhost:5000/generate-cheatsheet",
        {
          topic: topic,
          topic_description: description,
          cheatsheet_type: cheatSheetType,
        }
      );

      setCheatSheet(response.data);
      setLoading(false);
    } catch (err) {
      console.error("Error generating cheat sheet:", err);
      setError(err.response?.data?.error || "Failed to generate cheat sheet");
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await generateCheatSheet();
  };

  const handlePrint = () => {
    const printContent = document.getElementById("printable-content");
    const originalContents = document.body.innerHTML;

    // Create a new window for printing
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>${topic} Cheat Sheet</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1, h2, h3 { color: #333; }
            h1 { font-size: 24px; margin-bottom: 16px; }
            h2 { font-size: 20px; margin-top: 20px; margin-bottom: 10px; }
            h3 { font-size: 16px; margin-top: 16px; }
            p { margin-bottom: 8px; line-height: 1.5; }
            ul, ol { margin-bottom: 16px; padding-left: 24px; }
            li { margin-bottom: 4px; }
            code { background-color: #f5f5f5; padding: 2px 4px; border-radius: 4px; }
            pre { background-color: #f5f5f5; padding: 12px; border-radius: 4px; overflow-x: auto; }
            table { border-collapse: collapse; width: 100%; margin-bottom: 16px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .header { display: flex; justify-content: space-between; margin-bottom: 20px; }
            .content { margin-top: 20px; }
            @media print {
              body { padding: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${topic} Cheat Sheet</h1>
            <p>${cheatSheet?.metadata?.cheatsheet_type || cheatSheetType}</p>
          </div>
          <div class="content">
            ${printContent.innerHTML}
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const handleDownload = () => {
    const element = document.getElementById("printable-content");
    const filename = `${topic.replace(/\s+/g, "_")}_cheatsheet.pdf`;

    // PDF options
    const opt = {
      margin: [10, 10, 10, 10],
      filename: filename,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    };

    // Creating a styled wrapper for PDF export
    const wrapper = document.createElement("div");
    wrapper.innerHTML = `
      <div style="padding: 20px; font-family: Arial, sans-serif;">
        <h1 style="font-size: 24px; color: #333; margin-bottom: 16px;">
          ${topic} Cheat Sheet - ${
      cheatSheet?.metadata?.cheatsheet_type || cheatSheetType
    }
        </h1>
        <div>${element.innerHTML}</div>
      </div>
    `;

    // Generate PDF
    html2pdf()
      .set(opt)
      .from(wrapper)
      .save()
      .catch((err) => console.error("Error generating PDF:", err));
  };

  const goBack = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8f8ec] to-[#f2f2e6] p-3 sm:p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center mb-4 sm:mb-6 gap-2">
          <button
            onClick={goBack}
            className="flex items-center text-gray-700 hover:text-gray-900 transition-colors duration-200 hover:bg-white hover:bg-opacity-50 p-2 rounded-lg w-fit"
          >
            <ArrowLeft size={20} />
            <span className="ml-1 font-medium">Back</span>
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
            {topic} Cheat Sheet
          </h1>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col sm:flex-row justify-center items-center py-8 sm:py-12">
            <Loader2 size={40} className="animate-spin text-[#c4e456] mb-2 sm:mb-0" />
            <span className="text-base sm:text-lg text-gray-700 sm:ml-3 text-center">
              Generating your cheat sheet...
            </span>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 sm:px-4 sm:py-3 rounded-lg mb-4 sm:mb-6 text-sm sm:text-base">
            {error}
          </div>
        )}

        {/* Results Section */}
        {cheatSheet && (
          <div className="bg-white rounded-lg shadow-md p-3 sm:p-6 mb-4 sm:mb-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-3">
              <h2 className="text-lg sm:text-xl font-bold text-gray-800">
                {cheatSheet.metadata.topic} - {cheatSheet.metadata.cheatsheet_type} Cheat Sheet
              </h2>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handlePrint}
                  className="flex items-center bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-md transition duration-200 text-sm"
                >
                  <Printer size={16} className="mr-1" />
                  Print
                </button>
                <button
                  onClick={handleDownload}
                  className="flex items-center bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-md transition duration-200 text-sm"
                >
                  <Download size={16} className="mr-1" />
                  Download PDF
                </button>
              </div>
            </div>

            <div
              id="printable-content"
              ref={contentRef}
              className="prose max-w-none p-2 sm:p-4 border border-gray-100 rounded-md bg-gray-50 print:bg-white overflow-x-auto text-sm sm:text-base"
            >
              <ReactMarkdown>{cheatSheet.content}</ReactMarkdown>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default CheatSheetPage;
