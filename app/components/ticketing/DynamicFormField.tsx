// ============================================
// app/components/ticketing/DynamicFormField.tsx
// Renders form fields based on formSchema
// NOW WITH IMPROVED FILE UPLOAD UI AND THEME CONTEXT
// FIXED: Files are now properly converted to base64 for upload
// ============================================

import React, { useState, useRef } from 'react';
import { Plus, Trash2, AlertCircle, Upload, X, FileText, Image as ImageIcon, File } from 'lucide-react';
import { useTheme } from '@/app/context/ThemeContext';

interface FormField {
  id: string;
  type: string;
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
  tableConfig?: {
    columns: Array<{
      id: string;
      label: string;
      type: string;
      options?: string[];
    }>;
    minRows?: number;
    maxRows?: number;
  };
}

interface Props {
  field: FormField;
  value: any;
  onChange: (value: any) => void;
  error?: string;
}

interface FileWithPreview {
  file: File;
  preview?: string;
  id: string;
}

export default function DynamicFormField({ field, value, onChange, error }: Props) {
  const { colors, cardCharacters } = useTheme();
  const charColors = cardCharacters.informative;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<FileWithPreview[]>([]);

  const inputClasses = `w-full px-4 py-3 rounded-xl text-sm transition-all duration-300 focus:outline-none ${colors.inputBg} border ${error ? cardCharacters.urgent.border : colors.inputBorder} ${colors.inputText} ${colors.inputPlaceholder}`;

  // File upload handlers - FIXED TO SEND BASE64 DATA
  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newFiles: FileWithPreview[] = [];
    
    for (const file of Array.from(files)) {
      const fileWithPreview: FileWithPreview = {
        file,
        id: `${Date.now()}-${Math.random()}`
      };

      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          fileWithPreview.preview = reader.result as string;
          setUploadedFiles(prev => [...prev]);
        };
        reader.readAsDataURL(file);
      }

      newFiles.push(fileWithPreview);
    }

    const updatedFiles = [...uploadedFiles, ...newFiles];
    setUploadedFiles(updatedFiles);
    
    // Convert files to base64 for upload
    const fileDataPromises = updatedFiles.map(async (f) => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result as string;
          // Remove the data:mime/type;base64, prefix
          const base64Data = base64String.includes(',') 
            ? base64String.split(',')[1] 
            : base64String;
          
          resolve({
            name: f.file.name,
            data: base64Data,
            type: f.file.type
          });
        };
        reader.readAsDataURL(f.file);
      });
    });

    const fileDataArray = await Promise.all(fileDataPromises);
    onChange(fileDataArray);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const removeFile = async (id: string) => {
    const newFiles = uploadedFiles.filter(f => f.id !== id);
    setUploadedFiles(newFiles);
    
    if (newFiles.length === 0) {
      onChange([]);
      return;
    }
    
    // Convert remaining files to base64
    const fileDataPromises = newFiles.map(async (f) => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result as string;
          const base64Data = base64String.includes(',') 
            ? base64String.split(',')[1] 
            : base64String;
          
          resolve({
            name: f.file.name,
            data: base64Data,
            type: f.file.type
          });
        };
        reader.readAsDataURL(f.file);
      });
    });

    const fileDataArray = await Promise.all(fileDataPromises);
    onChange(fileDataArray);
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext || '')) {
      return ImageIcon;
    }
    if (['pdf', 'doc', 'docx', 'txt'].includes(ext || '')) {
      return FileText;
    }
    return File;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  // Table field handler
  const handleTableChange = (rowIndex: number, colId: string, cellValue: string) => {
    const newRows = [...(value || [])];
    if (!newRows[rowIndex]) {
      newRows[rowIndex] = {};
    }
    newRows[rowIndex][colId] = cellValue;
    onChange(newRows);
  };

  const addTableRow = () => {
    const maxRows = field.tableConfig?.maxRows || 10;
    const currentRows = value || [];
    if (currentRows.length < maxRows) {
      onChange([...currentRows, {}]);
    }
  };

  const removeTableRow = (index: number) => {
    const newRows = [...(value || [])];
    newRows.splice(index, 1);
    onChange(newRows);
  };

  // Render based on field type
  switch (field.type) {
    case 'text':
    case 'number':
      return (
        <div>
          <label className={`block text-sm font-bold ${colors.textPrimary} mb-2 flex items-center gap-2`}>
            {field.label} 
            {field.required && <span className={cardCharacters.urgent.text}>*</span>}
          </label>
          <input
            type={field.type}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            className={inputClasses}
            required={field.required}
          />
          {error && (
            <div className={`flex items-center gap-2 mt-2 text-xs ${cardCharacters.urgent.text}`}>
              <AlertCircle className="w-3 h-3" />
              <span>{error}</span>
            </div>
          )}
        </div>
      );

    case 'textarea':
      return (
        <div>
          <label className={`block text-sm font-bold ${colors.textPrimary} mb-2 flex items-center gap-2`}>
            {field.label} 
            {field.required && <span className={cardCharacters.urgent.text}>*</span>}
          </label>
          <textarea
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            rows={4}
            className={`${inputClasses} resize-none`}
            required={field.required}
          />
          {error && (
            <div className={`flex items-center gap-2 mt-2 text-xs ${cardCharacters.urgent.text}`}>
              <AlertCircle className="w-3 h-3" />
              <span>{error}</span>
            </div>
          )}
        </div>
      );

    case 'dropdown':
      return (
        <div>
          <label className={`block text-sm font-bold ${colors.textPrimary} mb-2 flex items-center gap-2`}>
            {field.label} 
            {field.required && <span className={cardCharacters.urgent.text}>*</span>}
          </label>
          <select
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className={`${inputClasses} cursor-pointer`}
            required={field.required}
          >
            <option value="">Select an option...</option>
            {field.options?.map((opt, i) => (
              <option key={i} value={opt}>{opt}</option>
            ))}
          </select>
          {error && (
            <div className={`flex items-center gap-2 mt-2 text-xs ${cardCharacters.urgent.text}`}>
              <AlertCircle className="w-3 h-3" />
              <span>{error}</span>
            </div>
          )}
        </div>
      );

    case 'radio':
      return (
        <div>
          <label className={`block text-sm font-bold ${colors.textPrimary} mb-3 flex items-center gap-2`}>
            {field.label} 
            {field.required && <span className={cardCharacters.urgent.text}>*</span>}
          </label>
          <div className="space-y-3">
            {field.options?.map((opt, i) => (
              <label 
                key={i} 
                className={`group flex items-center gap-3 cursor-pointer px-4 py-3 rounded-xl border-2 transition-all duration-300 ${
                  value === opt
                    ? `border ${charColors.border} bg-gradient-to-br ${charColors.bg}`
                    : `${colors.inputBg} border ${colors.inputBorder} hover:border-opacity-60`
                }`}
              >
                <input
                  type="radio"
                  name={field.id}
                  value={opt}
                  checked={value === opt}
                  onChange={(e) => onChange(e.target.value)}
                  className={`w-5 h-5 focus:ring-2`}
                  style={{ 
                    accentColor: charColors.iconColor.replace('text-', ''),
                  }}
                  required={field.required}
                />
                <span className={`text-sm font-semibold ${colors.textPrimary}`}>{opt}</span>
              </label>
            ))}
          </div>
          {error && (
            <div className={`flex items-center gap-2 mt-2 text-xs ${cardCharacters.urgent.text}`}>
              <AlertCircle className="w-3 h-3" />
              <span>{error}</span>
            </div>
          )}
        </div>
      );

    case 'checkbox':
      return (
        <div>
          <label className={`block text-sm font-bold ${colors.textPrimary} mb-3 flex items-center gap-2`}>
            {field.label} 
            {field.required && <span className={cardCharacters.urgent.text}>*</span>}
          </label>
          <div className="space-y-3">
            {field.options?.map((opt, i) => (
              <label 
                key={i} 
                className={`group flex items-center gap-3 cursor-pointer px-4 py-3 rounded-xl border-2 transition-all duration-300 ${
                  (value || []).includes(opt)
                    ? `border ${charColors.border} bg-gradient-to-br ${charColors.bg}`
                    : `${colors.inputBg} border ${colors.inputBorder} hover:border-opacity-60`
                }`}
              >
                <input
                  type="checkbox"
                  value={opt}
                  checked={(value || []).includes(opt)}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    const newValue = value || [];
                    if (checked) {
                      onChange([...newValue, opt]);
                    } else {
                      onChange(newValue.filter((v: string) => v !== opt));
                    }
                  }}
                  className="w-5 h-5 rounded"
                  style={{ 
                    accentColor: charColors.iconColor.replace('text-', ''),
                  }}
                />
                <span className={`text-sm font-semibold ${colors.textPrimary}`}>{opt}</span>
              </label>
            ))}
          </div>
          {error && (
            <div className={`flex items-center gap-2 mt-2 text-xs ${cardCharacters.urgent.text}`}>
              <AlertCircle className="w-3 h-3" />
              <span>{error}</span>
            </div>
          )}
        </div>
      );

    case 'date':
      return (
        <div>
          <label className={`block text-sm font-bold ${colors.textPrimary} mb-2 flex items-center gap-2`}>
            {field.label} 
            {field.required && <span className={cardCharacters.urgent.text}>*</span>}
          </label>
          <input
            type="date"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className={inputClasses}
            required={field.required}
          />
          {error && (
            <div className={`flex items-center gap-2 mt-2 text-xs ${cardCharacters.urgent.text}`}>
              <AlertCircle className="w-3 h-3" />
              <span>{error}</span>
            </div>
          )}
        </div>
      );

    case 'file':
      return (
        <div>
          <label className={`block text-sm font-bold ${colors.textPrimary} mb-2 flex items-center gap-2`}>
            {field.label} 
            {field.required && <span className={cardCharacters.urgent.text}>*</span>}
          </label>
          
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
            required={field.required && uploadedFiles.length === 0}
          />

          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 ${
              isDragging
                ? `border ${charColors.border} bg-gradient-to-br ${charColors.bg} scale-[1.02]`
                : error
                  ? `border ${cardCharacters.urgent.border} hover:border-opacity-80`
                  : `border ${colors.inputBorder} ${colors.inputBg} hover:border-opacity-60`
            }`}
          >
            <div className="flex flex-col items-center gap-3">
              <div className={`p-4 rounded-full bg-gradient-to-r ${charColors.bg}`}>
                <Upload className={`w-8 h-8 ${isDragging ? `${charColors.iconColor} animate-bounce` : charColors.iconColor}`} />
              </div>
              
              <div>
                <p className={`text-sm font-bold ${colors.textPrimary} mb-1`}>
                  {isDragging ? 'Drop files here' : 'Click to upload or drag and drop'}
                </p>
                <p className={`text-xs ${colors.textSecondary}`}>
                  {field.placeholder || 'Upload any file type'}
                </p>
              </div>
            </div>
          </div>

          {uploadedFiles.length > 0 && (
            <div className="mt-4 space-y-2">
              {uploadedFiles.map((fileItem) => {
                const FileIcon = getFileIcon(fileItem.file.name);
                return (
                  <div
                    key={fileItem.id}
                    className={`group flex items-center gap-3 p-3 rounded-xl border-2 transition-all duration-300 ${colors.inputBg} ${colors.inputBorder}`}
                  >
                    {fileItem.preview ? (
                      <img
                        src={fileItem.preview}
                        alt={fileItem.file.name}
                        className={`w-12 h-12 rounded-lg object-cover border-2 ${charColors.border}`}
                      />
                    ) : (
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center bg-gradient-to-r ${charColors.bg}`}>
                        <FileIcon className={`w-6 h-6 ${charColors.iconColor}`} />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold ${colors.textPrimary} truncate`}>
                        {fileItem.file.name}
                      </p>
                      <p className={`text-xs ${colors.textSecondary}`}>
                        {formatFileSize(fileItem.file.size)}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(fileItem.id);
                      }}
                      className={`opacity-0 group-hover:opacity-100 p-2 rounded-lg transition-all duration-300 hover:scale-110 hover:${cardCharacters.urgent.bg}`}
                    >
                      <X className={`w-4 h-4 ${cardCharacters.urgent.iconColor}`} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {uploadedFiles.length > 0 && (
            <p className={`text-xs ${colors.textSecondary} mt-2`}>
              {uploadedFiles.length} file{uploadedFiles.length !== 1 ? 's' : ''} selected
            </p>
          )}

          {error && (
            <div className={`flex items-center gap-2 mt-2 text-xs ${cardCharacters.urgent.text}`}>
              <AlertCircle className="w-3 h-3" />
              <span>{error}</span>
            </div>
          )}
        </div>
      );

    case 'table':
      const rows = value || [];
      const minRows = field.tableConfig?.minRows || 1;
      const maxRows = field.tableConfig?.maxRows || 10;
      
      while (rows.length < minRows) {
        rows.push({});
      }

      return (
        <div>
          <label className={`block text-sm font-bold ${colors.textPrimary} mb-3 flex items-center gap-2`}>
            {field.label} 
            {field.required && <span className={cardCharacters.urgent.text}>*</span>}
          </label>
          
          <div className={`overflow-x-auto rounded-xl border-2 ${colors.inputBorder}`}>
            <table className="w-full">
              <thead>
                <tr className={colors.inputBg}>
                  {field.tableConfig?.columns.map((col) => (
                    <th 
                      key={col.id}
                      className={`px-4 py-3 text-left text-xs font-bold ${colors.textPrimary} border-b-2 ${colors.inputBorder}`}
                    >
                      {col.label}
                    </th>
                  ))}
                  <th 
                    className={`px-4 py-3 text-center text-xs font-bold ${colors.textPrimary} border-b-2 w-20 ${colors.inputBorder}`}
                  >
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row: any, rowIndex: number) => (
                  <tr key={rowIndex} className="transition-colors hover:bg-opacity-50">
                    {field.tableConfig?.columns.map((col) => (
                      <td 
                        key={col.id}
                        className={`px-2 py-2 border-b ${colors.borderSubtle}`}
                      >
                        {col.type === 'dropdown' ? (
                          <select
                            value={row[col.id] || ''}
                            onChange={(e) => handleTableChange(rowIndex, col.id, e.target.value)}
                            className={`w-full px-3 py-2 text-xs rounded-lg transition-all cursor-pointer ${colors.inputBg} border ${colors.inputBorder} ${colors.inputText}`}
                          >
                            <option value="">Select...</option>
                            {col.options?.map((opt, i) => (
                              <option key={i} value={opt}>{opt}</option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type={col.type}
                            value={row[col.id] || ''}
                            onChange={(e) => handleTableChange(rowIndex, col.id, e.target.value)}
                            className={`w-full px-3 py-2 text-xs rounded-lg transition-all ${colors.inputBg} border ${colors.inputBorder} ${colors.inputText}`}
                          />
                        )}
                      </td>
                    ))}
                    <td 
                      className={`px-2 py-2 border-b text-center ${colors.borderSubtle}`}
                    >
                      {rows.length > minRows && (
                        <button
                          type="button"
                          onClick={() => removeTableRow(rowIndex)}
                          className={`group p-2 rounded-lg transition-all duration-300 hover:scale-110 hover:${cardCharacters.urgent.bg}`}
                        >
                          <Trash2 className={`w-4 h-4 transition-transform duration-300 group-hover:rotate-12 ${cardCharacters.urgent.iconColor}`} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {rows.length < maxRows && (
            <button
              type="button"
              onClick={addTableRow}
              className={`group relative mt-3 px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all duration-300 hover:scale-105 overflow-hidden border-2 bg-gradient-to-br ${colors.cardBg} ${charColors.border} ${charColors.text}`}
            >
              <div 
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{ boxShadow: `inset 0 0 20px ${colors.glowPrimary}` }}
              ></div>
              <Plus className="w-4 h-4 relative z-10 transition-transform duration-300 group-hover:rotate-90" />
              <span className="relative z-10">Add Row</span>
            </button>
          )}
          
          {error && (
            <div className={`flex items-center gap-2 mt-2 text-xs ${cardCharacters.urgent.text}`}>
              <AlertCircle className="w-3 h-3" />
              <span>{error}</span>
            </div>
          )}
        </div>
      );

    default:
      return null;
  }
}