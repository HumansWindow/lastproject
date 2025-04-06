import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import 'react-quill/dist/quill.snow.css';

const ReactQuill = dynamic(() => import('react-quill'), { 
  ssr: false,
  loading: () => <div>Loading editor...</div>
});

interface RichTextEditorProps {
  value: string;
  onChange: (content: string) => void;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange }) => {
  const [editorValue, setEditorValue] = useState(value || '');
  
  useEffect(() => {
    setEditorValue(value || '');
  }, [value]);
  
  const handleEditorChange = (content: string) => {
    setEditorValue(content);
    onChange(content);
  };

  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'align': [] }],
      ['link', 'image'],
      ['clean']
    ],
  };
  
  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet',
    'color', 'background',
    'align',
    'link', 'image'
  ];

  return (
    <div className="rich-text-editor">
      <ReactQuill
        theme="snow"
        value={editorValue}
        onChange={handleEditorChange}
        modules={modules}
        formats={formats}
        placeholder="Write your diary content here..."
      />
      <style>{`
        .rich-text-editor {
          margin-bottom: 20px;
        }
        .rich-text-editor .ql-container {
          min-height: 200px;
          border-radius: 0 0 4px 4px;
        }
        .rich-text-editor .ql-toolbar {
          border-radius: 4px 4px 0 0;
        }
      `}</style>
    </div>
  );
};

export default RichTextEditor;