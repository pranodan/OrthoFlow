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
    if (contentRef.current && contentRef.current.innerHTML !== value) {
      contentRef.current.innerHTML = value;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only sync on mount to avoid cursor jumping

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
    <div className="mb-4">
      <label className="block text-sm font-semibold text-gray-700 mb-1">{label}</label>
      <div className="border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500">
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
          className="p-3 min-h-[80px] outline-none text-sm max-h-[200px] overflow-y-auto"
          onInput={handleInput}
          dangerouslySetInnerHTML={{ __html: value }}
        />
      </div>
    </div>
  );
};

export default RichTextEditor;