import React, { useState, useEffect } from 'react';
import { ExamData, Medicine, Patient, User } from '../types';
import RichTextEditor from './RichTextEditor';
import { Plus, Trash2, Wand2, Save, History, ArrowLeft, Edit } from 'lucide-react';
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
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Initialize Mode
  useEffect(() => {
    if (previousVisits.length === 0) {
      setMode('NEW');
    }
  }, [previousVisits]);

  const loadVisitForEdit = (visit: ExamData) => {
      setFormData({
          ...visit,
          // If we are editing an old visit, we keep the ID. 
          // If the user INTENDS to create a new visit based on old data, we would generate new ID.
          // Based on prompt "Edit mode... update the data", we assume updating the existing record.
      });
      setMode('EDIT');
  };

  const handleAiAssist = async () => {
    if (!process.env.API_KEY) {
      alert("API Key not found in environment variables.");
      return;
    }
    setIsAiLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
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

  // --- Render Logic ---

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
                 setFormData(prev => ({...prev, type: 'NEW', id: crypto.randomUUID()}));
              }}
              className="w-full p-3 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium"
            >
              Start New Consultation
            </button>
            <button
              onClick={() => setMode('FOLLOW_UP_VIEW')}
              className="w-full p-3 bg-green-600 text-white rounded hover:bg-green-700 font-medium"
            >
              Add Follow Up / View History
            </button>
            <button onClick={onCancel} className="w-full p-3 text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'FOLLOW_UP_VIEW') {
    return (
      <div className="bg-white h-full flex flex-col p-6 max-w-4xl mx-auto w-full">
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">History: {patient.name}</h2>
            <button onClick={() => setMode('INITIAL')} className="text-gray-500 hover:text-gray-800">
                <ArrowLeft />
            </button>
        </div>
        
        <div className="flex-1 overflow-y-auto mb-6 space-y-4">
            <div className="bg-blue-50 border border-blue-200 p-4 rounded text-center">
                <p className="text-blue-800 font-medium mb-2">Create a new entry?</p>
                <button
                    onClick={() => {
                        setMode('NEW');
                        setFormData({
                             ...DEFAULT_EXAM_DATA as ExamData,
                             id: crypto.randomUUID(),
                             patientId: patient.id,
                             consultantId: consultant.id,
                             visitDate: new Date().toISOString().split('T')[0],
                             visitTime: new Date().toLocaleTimeString(),
                             type: 'FOLLOW_UP'
                        });
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                    + New Follow-up Entry
                </button>
            </div>

            <h3 className="text-lg font-semibold text-gray-700 mt-4">Previous Visits (Click to Edit)</h3>
            {previousVisits.map((visit) => (
                <div 
                    key={visit.id} 
                    onClick={() => loadVisitForEdit(visit)}
                    className="border p-4 rounded bg-white hover:bg-gray-50 cursor-pointer shadow-sm transition-all group"
                >
                    <div className="flex justify-between border-b pb-2 mb-2">
                        <span className="font-bold flex items-center gap-2">
                            <History size={16} /> {visit.visitDate} <span className="text-gray-400 font-normal">| {visit.visitTime}</span>
                        </span>
                        <div className="flex items-center gap-2">
                             <span className="text-sm bg-gray-200 px-2 rounded">{visit.type}</span>
                             <span className="text-blue-600 opacity-0 group-hover:opacity-100 flex items-center gap-1 text-sm"><Edit size={14}/> Edit</span>
                        </div>
                    </div>
                    <div className="text-sm text-gray-600 line-clamp-2" dangerouslySetInnerHTML={{__html: visit.diagnosis || 'No Diagnosis'}} />
                </div>
            ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen flex flex-col">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b z-10 px-6 py-4 flex justify-between items-center shadow-sm">
        <div>
           <h1 className="text-xl font-bold text-gray-800">
               {mode === 'EDIT' ? 'Editing Visit' : 'Consultation'}: {patient.name}
           </h1>
           <p className="text-sm text-gray-500">ID: {patient.id} | {patient.age}Y / {patient.gender}</p>
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
                <Save size={18} /> {mode === 'EDIT' ? 'Update & Print' : 'Submit & Print'}
            </button>
        </div>
      </div>

      {/* Form Content - Stacked Layout */}
      <div className="flex-1 overflow-y-auto p-6 max-w-4xl mx-auto w-full">
        <div className="space-y-6">
            <RichTextEditor label="1. Chief Complaints" value={formData.chiefComplaints} onChange={(v) => setFormData({...formData, chiefComplaints: v})} />
            <RichTextEditor label="2. History of Present Illness" value={formData.historyOfIllness} onChange={(v) => setFormData({...formData, historyOfIllness: v})} />
            <RichTextEditor label="3. Examination" value={formData.examination} onChange={(v) => setFormData({...formData, examination: v})} />
            <RichTextEditor label="4. Any Other Specific Test" value={formData.specificTests} onChange={(v) => setFormData({...formData, specificTests: v})} />
            
            <div className="p-4 bg-gray-50 rounded border border-gray-200 space-y-4">
                <h3 className="font-semibold text-gray-700">Radiology & Investigations</h3>
                <RichTextEditor label="5. X-Ray" value={formData.xray} onChange={(v) => setFormData({...formData, xray: v})} />
                <RichTextEditor label="6. CT" value={formData.ct} onChange={(v) => setFormData({...formData, ct: v})} />
                <RichTextEditor label="7. MRI" value={formData.mri} onChange={(v) => setFormData({...formData, mri: v})} />
                <RichTextEditor label="8. Other Investigations" value={formData.otherInvestigations} onChange={(v) => setFormData({...formData, otherInvestigations: v})} />
            </div>

            <RichTextEditor label="9. Diagnosis" value={formData.diagnosis} onChange={(v) => setFormData({...formData, diagnosis: v})} />
            <RichTextEditor label="10. Plan" value={formData.plan} onChange={(v) => setFormData({...formData, plan: v})} />

            {/* Medicines Table */}
            <div className="border border-gray-300 rounded overflow-hidden">
                <div className="flex justify-between items-center bg-gray-100 p-2 border-b">
                    <label className="text-sm font-semibold text-gray-700">11. Medical Treatment</label>
                    <button onClick={addMedicine} className="flex items-center gap-1 text-sm text-blue-600 hover:underline"><Plus size={16}/> Add Medicine</button>
                </div>
                <table className="w-full border-collapse text-sm">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="border-b p-2 w-10 text-left">SN</th>
                            <th className="border-b p-2 text-left">Medicine</th>
                            <th className="border-b p-2 text-left">Dose</th>
                            <th className="border-b p-2 text-left">Interval</th>
                            <th className="border-b p-2 text-left">Duration</th>
                            <th className="border-b p-2 w-10"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {formData.medicines.map((med, idx) => (
                            <tr key={med.id}>
                                <td className="border-b p-2 text-center">{idx + 1}</td>
                                <td className="border-b p-2"><input type="text" className="w-full p-1 outline-none bg-transparent" placeholder="Name" value={med.name} onChange={(e) => updateMedicine(idx, 'name', e.target.value)} /></td>
                                <td className="border-b p-2"><input type="text" className="w-full p-1 outline-none bg-transparent" placeholder="e.g. 500mg" value={med.dose} onChange={(e) => updateMedicine(idx, 'dose', e.target.value)} /></td>
                                <td className="border-b p-2"><input type="text" className="w-full p-1 outline-none bg-transparent" placeholder="e.g. BD" value={med.interval} onChange={(e) => updateMedicine(idx, 'interval', e.target.value)} /></td>
                                <td className="border-b p-2"><input type="text" className="w-full p-1 outline-none bg-transparent" placeholder="e.g. 5 days" value={med.duration} onChange={(e) => updateMedicine(idx, 'duration', e.target.value)} /></td>
                                <td className="border-b p-2 text-center">
                                    <button onClick={() => removeMedicine(idx)} className="text-red-500 hover:bg-red-50 p-1 rounded"><Trash2 size={16} /></button>
                                </td>
                            </tr>
                        ))}
                        {formData.medicines.length === 0 && (
                            <tr><td colSpan={6} className="p-4 text-center text-gray-400 italic">No medicines prescribed</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            <RichTextEditor label="12. Physiotherapy" value={formData.physiotherapy} onChange={(v) => setFormData({...formData, physiotherapy: v})} />
             
             <div className="bg-gray-50 p-4 rounded border">
                <label className="block text-sm font-semibold text-gray-700 mb-1">13. Next Review</label>
                <input type="date" className="w-full border p-2 rounded bg-white" value={formData.nextReview} onChange={(e) => setFormData({...formData, nextReview: e.target.value})} />
             </div>

            <RichTextEditor label="14. Remarks" value={formData.remarks} onChange={(v) => setFormData({...formData, remarks: v})} />
        </div>
      </div>
    </div>
  );
};