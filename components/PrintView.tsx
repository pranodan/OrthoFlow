import React from 'react';
import { ExamData, Patient, User } from '../types';

interface PrintViewProps {
  data: ExamData;
  patient: Patient;
  consultant: User;
  onClose: () => void;
}

export const PrintView: React.FC<PrintViewProps> = ({ data, patient, consultant, onClose }) => {
  React.useEffect(() => {
    window.print();
  }, []);

  const Field = ({ label, value }: { label: string, value: string }) => {
    if (!value || value === '<br>') return null;
    return (
        <tr className="border-b border-gray-200 break-inside-avoid">
            <td className="py-2 pr-4 align-top w-[25%] font-bold text-gray-800 text-sm uppercase whitespace-nowrap">
                {label}
            </td>
            <td className="py-2 align-top text-sm text-gray-700 leading-relaxed">
                <div dangerouslySetInnerHTML={{ __html: value }} />
            </td>
        </tr>
    )
  }

  return (
    <div className="fixed inset-0 bg-white z-[100] overflow-auto">
       {/* Floating Close Button for Screen only */}
       <div className="fixed top-4 right-4 no-print">
         <button onClick={onClose} className="bg-red-600 text-white px-4 py-2 rounded shadow">Close Print View</button>
         <button onClick={() => window.print()} className="ml-2 bg-blue-600 text-white px-4 py-2 rounded shadow">Print Again</button>
       </div>

       {/* Paper Container */}
       <div className="max-w-[21cm] mx-auto min-h-[29.7cm] bg-white p-8 relative">
          
          {/* 1.5 inch top margin spacer (approx 3.8cm) */}
          <div style={{ height: '3.8cm' }} className="w-full">
            {/* Letterhead space */}
          </div>

          {/* Patient Header - 4 Columns */}
          <div className="border-b-2 border-gray-800 pb-4 mb-6">
            <div className="grid grid-cols-4 gap-4 text-sm">
                <div>
                    <span className="font-bold block text-gray-500 text-xs">Patient Name</span>
                    <span className="uppercase font-semibold">{patient.name}</span>
                </div>
                <div>
                    <span className="font-bold block text-gray-500 text-xs">Patient ID</span>
                    <span>{patient.id}</span>
                </div>
                 <div>
                    <span className="font-bold block text-gray-500 text-xs">Age / Gender</span>
                    <span>{patient.age} Y / {patient.gender}</span>
                </div>
                <div>
                    <span className="font-bold block text-gray-500 text-xs">Date</span>
                    <span>{data.visitDate} {data.visitTime}</span>
                </div>
                 <div>
                    <span className="font-bold block text-gray-500 text-xs">Mobile</span>
                    <span>{patient.mobile}</span>
                </div>
                 <div className="col-span-3">
                    <span className="font-bold block text-gray-500 text-xs">Address</span>
                    <span>{patient.address}</span>
                </div>
            </div>
          </div>

          {/* Clinical Content using Table Layout for Side-by-Side */}
          <table className="w-full">
            <tbody>
                <Field label="Chief Complaints" value={data.chiefComplaints} />
                <Field label="History of Illness" value={data.historyOfIllness} />
                <Field label="Examination" value={data.examination} />
                
                {(data.specificTests || data.xray || data.ct || data.mri || data.otherInvestigations) && (
                     <tr className="border-b border-gray-200 break-inside-avoid">
                        <td className="py-2 pr-4 align-top w-[25%] font-bold text-gray-800 text-sm uppercase">
                            Investigations
                        </td>
                        <td className="py-2 align-top text-sm text-gray-700">
                             <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                                {data.specificTests && <div><span className="font-semibold text-xs">Specific:</span> <span dangerouslySetInnerHTML={{__html: data.specificTests}}/></div>}
                                {data.xray && <div><span className="font-semibold text-xs">X-Ray:</span> <span dangerouslySetInnerHTML={{__html: data.xray}}/></div>}
                                {data.ct && <div><span className="font-semibold text-xs">CT:</span> <span dangerouslySetInnerHTML={{__html: data.ct}}/></div>}
                                {data.mri && <div><span className="font-semibold text-xs">MRI:</span> <span dangerouslySetInnerHTML={{__html: data.mri}}/></div>}
                                {data.otherInvestigations && <div><span className="font-semibold text-xs">Other:</span> <span dangerouslySetInnerHTML={{__html: data.otherInvestigations}}/></div>}
                             </div>
                        </td>
                    </tr>
                )}

                <Field label="Diagnosis" value={data.diagnosis} />
                <Field label="Plan" value={data.plan} />

                {data.medicines.length > 0 && (
                     <tr className="border-b border-gray-200 break-inside-avoid">
                        <td className="py-2 pr-4 align-top w-[25%] font-bold text-gray-800 text-sm uppercase">
                            Rx (Treatment)
                        </td>
                        <td className="py-2 align-top text-sm text-gray-700">
                            <table className="w-full text-sm border-collapse">
                                <thead>
                                    <tr className="border-b border-gray-300">
                                        <th className="text-left py-1 w-8">SN</th>
                                        <th className="text-left py-1">Medicine</th>
                                        <th className="text-left py-1">Dose</th>
                                        <th className="text-left py-1">Interval</th>
                                        <th className="text-left py-1">Duration</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.medicines.map((m, i) => (
                                        <tr key={i} className="border-b border-gray-100 last:border-0">
                                            <td className="py-1">{i + 1}</td>
                                            <td className="py-1 font-medium">{m.name}</td>
                                            <td className="py-1">{m.dose}</td>
                                            <td className="py-1">{m.interval}</td>
                                            <td className="py-1">{m.duration}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </td>
                    </tr>
                )}

                <Field label="Physiotherapy" value={data.physiotherapy} />
                
                {data.nextReview && (
                    <tr className="border-b border-gray-200 break-inside-avoid">
                         <td className="py-2 pr-4 align-top w-[25%] font-bold text-gray-800 text-sm uppercase">
                            Next Review
                        </td>
                        <td className="py-2 align-top text-sm text-gray-700">
                            {data.nextReview}
                        </td>
                    </tr>
                )}

                <Field label="Remarks" value={data.remarks} />
            </tbody>
          </table>

          {/* Footer / Signature */}
          <div className="mt-12 flex justify-end">
             <div className="text-center w-64">
                <div className="h-px bg-gray-800 mb-2"></div>
                <p className="font-bold text-sm uppercase">{consultant.fullName}</p>
                <p className="text-xs text-gray-500">Consultant Surgeon</p>
                <p className="text-[10px] text-gray-400 mt-1">Generated by: {consultant.username}</p>
             </div>
          </div>

       </div>
    </div>
  );
};