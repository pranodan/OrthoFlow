import React, { useState, useEffect } from 'react';
import { ExamData, Medicine, Patient, User } from '../types';
import RichTextEditor from './RichTextEditor';
import { Plus, Trash2, Wand2, Save } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

interface ExamFormProps {
  patient: Patient;
  consultant: User;
  previousVisits: ExamData[];
  onSave: (data: ExamData) => void;
  onCancel: () => void;
}

const DEFAULT_EXAM_DATA: Partial<ExamData> = {
  chiefComplaints: '',
  historyOfIllness: '',
  examination: '',
  specificTests: '',
  xray: '',
  ct: '',
  mri: '',
  otherInvestigations: '',
  diagnosis: '',
  plan: '',
  physiotherapy: '',
  nextReview: '',
  remarks: '',
  medicines: []
};

export const ExamForm: React.FC<ExamFormProps> = ({ patient, consultant, previousVisits, onSave, onCancel }) => {
  const [formData, setFormData] = useState<ExamData>({
    ...DEFAULT_EXAM_DATA as ExamData,
    id: crypto.randomUUID(),
    patientId: patient.id,
    consultantId: consultant.id,
    visitDate: new Date().toISOString().split('T')[0],
    visitTime: new Date().toLocaleTimeString(),
    type: 'NEW'
  });

  const [mode, setMode] = useState<'INITIAL' | 'NEW' | 'FOLLOW_UP_VIEW' | 'EDIT'>('INITIAL');
  const [viewVisit, setViewVisit] = useState<ExamData | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Initialize Mode
  useEffect(() => {
    if (previousVisits.length === 0) {
      setMode('NEW');
    } else {
       // Check if there is an edit intent (not implemented in this simplifed logic, assume if prev visits exist, ask user)
       // This component mounts when "Proceed" is clicked.
    }
  }, [previousVisits]);

  const handleAiAssist = async () => {
    if (!process.env.API_KEY) {
      alert("API Key not found in environment variables.");
      return;
    }
    setIsAiLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      // Example: Generate a structured summary based on filled fields
      const prompt = `
        Summarize the following clinical notes into a concise 'Remarks' section.
        Patient: ${patient.name}, Age: ${patient.age}, Gender: ${patient.gender}.
        Complaints: ${formData.chiefComplaints}
        Diagnosis: ${formData.diagnosis}
        Plan: ${formData.plan}
      `;
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });
      
      const text = response.text;
      if (text) {
        setFormData(prev => ({ ...prev, remarks: prev.remarks + `<br/><b>AI Summary:</b> ${text}` }));
      }
    } catch (e) {
      console.error("AI Error", e);
      alert("Failed to generate AI content.");
    } finally {
      setIsAiLoading(false);
    }
  };

  const addMedicine = () => {
    setFormData(prev => ({
      ...prev,
      medicines: [...prev.medicines, { id: crypto.randomUUID(), name: '', dose: '', interval: '', duration: '' }]
    }));
  };

  const updateMedicine = (index: number, field: keyof Medicine, val: string) => {
    const newMeds = [...formData.medicines];
    newMeds[index] = { ...newMeds[index], [field]: val };
    setFormData(prev => ({ ...prev, medicines: newMeds }));
  };

  const removeMedicine = (index: number) => {
    const newMeds = formData.medicines.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, medicines: newMeds }));
  };

  if (mode === 'INITIAL' && previousVisits.length > 0) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
          <h2 className="text-xl font-bold mb-4">Patient History Found</h2>
          <p className="mb-6 text-gray-600">This patient has visited before. How would you like to proceed?</p>
          <div className="space-y-3">
             <button
              onClick={() => {
                 setMode('NEW');
                 setFormData(prev => ({...prev, type: 'NEW'}));
              }}
              className="w-full p-3 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium"
            >
              Start New Consultation
            </button>
            <button
              onClick={() => setMode('FOLLOW_UP_VIEW')}
              className="w-full p-3 bg-green-600 text-white rounded hover:bg-green-700 font-medium"
            >
              Add Follow Up (View History)
            </button>
            <button onClick={onCancel} className="w-full p-3 text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'FOLLOW_UP_VIEW' && !viewVisit) {
    // Show history selector or last visit summary then allow creating new entry
    return (
      <div className="bg-white h-full flex flex-col p-4">
        <h2 className="text-2xl font-bold mb-4">History for {patient.name}</h2>
        <div className="flex-1 overflow-y-auto mb-4 space-y-4">
            {previousVisits.map((visit, idx) => (
                <div key={visit.id} className="border p-4 rounded bg-gray-50">
                    <div className="flex justify-between border-b pb-2 mb-2">
                        <span className="font-bold">Visit: {visit.visitDate}</span>
                        <span className="text-sm bg-gray-200 px-2 rounded">{visit.type}</span>
                    </div>
                    <div dangerouslySetInnerHTML={{__html: visit.diagnosis}} />
                </div>
            ))}
        </div>
        <div className="flex justify-end gap-4">
             <button onClick={() => setMode('INITIAL')} className="px-4 py-2 border rounded">Back</button>
             <button
                onClick={() => {
                    setMode('NEW');
                    setFormData(prev => ({...prev, type: 'FOLLOW_UP'}));
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded"
            >
                Create Follow-up Entry
            </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen flex flex-col">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b z-10 px-6 py-4 flex justify-between items-center shadow-sm">
        <div>
           <h1 className="text-xl font-bold text-gray-800">Consultation: {patient.name}</h1>
           <p className="text-sm text-gray-500">ID: {patient.id} | Age/Sex: {patient.age}/{patient.gender}</p>
        </div>
        <div className="flex gap-2">
            <button
              onClick={handleAiAssist}
              disabled={isAiLoading}
              className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded hover:bg-purple-200"
            >
              <Wand2 size={18} />
              {isAiLoading ? 'Thinking...' : 'AI Assist'}
            </button>
            <button onClick={onCancel} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
            <button
                onClick={() => onSave(formData)}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 shadow"
            >
                <Save size={18} /> Submit & Print
            </button>
        </div>
      </div>

      {/* Form Content */}
      <div className="flex-1 overflow-y-auto p-6 max-w-5xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <RichTextEditor label="1. Chief Complaints" value={formData.chiefComplaints} onChange={(v) => setFormData({...formData, chiefComplaints: v})} />
            <RichTextEditor label="2. History of Present Illness" value={formData.historyOfIllness} onChange={(v) => setFormData({...formData, historyOfIllness: v})} />
            <RichTextEditor label="3. Examination" value={formData.examination} onChange={(v) => setFormData({...formData, examination: v})} />
            <RichTextEditor label="4. Any Other Specific Test" value={formData.specificTests} onChange={(v) => setFormData({...formData, specificTests: v})} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
            <RichTextEditor label="5. X-Ray" value={formData.xray} onChange={(v) => setFormData({...formData, xray: v})} />
            <RichTextEditor label="6. CT" value={formData.ct} onChange={(v) => setFormData({...formData, ct: v})} />
            <RichTextEditor label="7. MRI" value={formData.mri} onChange={(v) => setFormData({...formData, mri: v})} />
            <RichTextEditor label="8. Other Investigations" value={formData.otherInvestigations} onChange={(v) => setFormData({...formData, otherInvestigations: v})} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
             <RichTextEditor label="9. Diagnosis" value={formData.diagnosis} onChange={(v) => setFormData({...formData, diagnosis: v})} />
             <RichTextEditor label="10. Plan" value={formData.plan} onChange={(v) => setFormData({...formData, plan: v})} />
        </div>

        {/* Medicines Table */}
        <div className="mt-8 mb-8">
            <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-semibold text-gray-700">11. Medical Treatment</label>
                <button onClick={addMedicine} className="flex items-center gap-1 text-sm text-blue-600 hover:underline"><Plus size={16}/> Add Medicine</button>
            </div>
            <table className="w-full border-collapse border border-gray-300 text-sm">
                <thead className="bg-gray-100">
                    <tr>
                        <th className="border p-2 w-10">SN</th>
                        <th className="border p-2">Medicine</th>
                        <th className="border p-2">Dose</th>
                        <th className="border p-2">Interval</th>
                        <th className="border p-2">Duration</th>
                        <th className="border p-2 w-10">Action</th>
                    </tr>
                </thead>
                <tbody>
                    {formData.medicines.map((med, idx) => (
                        <tr key={med.id}>
                            <td className="border p-2 text-center">{idx + 1}</td>
                            <td className="border p-2"><input type="text" className="w-full p-1 outline-none" placeholder="Name" value={med.name} onChange={(e) => updateMedicine(idx, 'name', e.target.value)} /></td>
                            <td className="border p-2"><input type="text" className="w-full p-1 outline-none" placeholder="e.g. 500mg" value={med.dose} onChange={(e) => updateMedicine(idx, 'dose', e.target.value)} /></td>
                            <td className="border p-2"><input type="text" className="w-full p-1 outline-none" placeholder="e.g. BD" value={med.interval} onChange={(e) => updateMedicine(idx, 'interval', e.target.value)} /></td>
                            <td className="border p-2"><input type="text" className="w-full p-1 outline-none" placeholder="e.g. 5 days" value={med.duration} onChange={(e) => updateMedicine(idx, 'duration', e.target.value)} /></td>
                            <td className="border p-2 text-center">
                                <button onClick={() => removeMedicine(idx)} className="text-red-500 hover:bg-red-50 p-1 rounded"><Trash2 size={16} /></button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <RichTextEditor label="12. Physiotherapy" value={formData.physiotherapy} onChange={(v) => setFormData({...formData, physiotherapy: v})} />
             <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-1">13. Next Review</label>
                <input type="date" className="w-full border p-2 rounded" value={formData.nextReview} onChange={(e) => setFormData({...formData, nextReview: e.target.value})} />
             </div>
        </div>

        <RichTextEditor label="14. Remarks" value={formData.remarks} onChange={(v) => setFormData({...formData, remarks: v})} />

      </div>
    </div>
  );
};