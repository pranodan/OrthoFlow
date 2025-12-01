import React, { useRef, useEffect } from 'react';
import { Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, Superscript, Subscript, Indent, Outdent } from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  label: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange, label }) => {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check if the content is effectively different to avoid cursor jumping loops
    if (contentRef.current && contentRef.current.innerHTML !== value) {
        // Only update if we are NOT currently typing in this box (not the active element)
        // This ensures that when we click "Edit", the data loads, 
        // but when we type, we don't overwrite our own cursor position.
        if (document.activeElement !== contentRef.current) {
             contentRef.current.innerHTML = value;
        }
    }
  }, [value]); // Added value dependency so updates from parent (like loading a previous visit) reflect here.

  const exec = (command: string, value: string = '') => {
    document.execCommand(command, false, value);
    if (contentRef.current) {
      onChange(contentRef.current.innerHTML);
    }
  };

  const handleInput = () => {
    if (contentRef.current) {
      onChange(contentRef.current.innerHTML);
    }
  };

  const Btn = ({ cmd, icon: Icon, arg }: { cmd: string; icon: any; arg?: string }) => (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); exec(cmd, arg); }}
      className="p-1 hover:bg-gray-200 rounded text-gray-600"
    >
      <Icon size={16} />
    </button>
  );

  return (
    <div className="mb-4 w-full">
      <label className="block text-sm font-semibold text-gray-700 mb-1">{label}</label>
      <div className="border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 bg-white">
        <div className="flex flex-wrap gap-1 bg-gray-50 p-1 border-b border-gray-200">
          <Btn cmd="bold" icon={Bold} />
          <Btn cmd="italic" icon={Italic} />
          <Btn cmd="underline" icon={Underline} />
          <div className="w-px h-6 bg-gray-300 mx-1"></div>
          <Btn cmd="justifyLeft" icon={AlignLeft} />
          <Btn cmd="justifyCenter" icon={AlignCenter} />
          <Btn cmd="justifyRight" icon={AlignRight} />
          <div className="w-px h-6 bg-gray-300 mx-1"></div>
          <Btn cmd="superscript" icon={Superscript} />
          <Btn cmd="subscript" icon={Subscript} />
          <div className="w-px h-6 bg-gray-300 mx-1"></div>
          <Btn cmd="indent" icon={Indent} />
          <Btn cmd="outdent" icon={Outdent} />
          <div className="w-px h-6 bg-gray-300 mx-1"></div>
          <button onMouseDown={(e) => {e.preventDefault(); exec('fontSize', '4');}} className="text-xs font-bold px-1 hover:bg-gray-200">A+</button>
          <button onMouseDown={(e) => {e.preventDefault(); exec('fontSize', '2');}} className="text-xs font-bold px-1 hover:bg-gray-200">A-</button>
        </div>
        <div
          ref={contentRef}
          contentEditable
          dir="ltr"
          style={{ textAlign: 'left' }}
          className="p-3 min-h-[80px] outline-none text-sm max-h-[300px] overflow-y-auto text-left"
          onInput={handleInput}
          dangerouslySetInnerHTML={{ __html: value }}
        />
      </div>
    </div>
  );
};

export default RichTextEditor;