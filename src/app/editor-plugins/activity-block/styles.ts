export const ACTIVITY_BLOCK_STYLES = `
.editorjs-activity-block {
  background: #f8fafc;
  border: 1.5px solid #e2e8f0;
  border-radius: 1rem;
  padding: 1.5rem;
  margin: 1rem 0;
  font-family: 'Inter', system-ui, sans-serif;
  box-shadow: 0 4px 12px rgba(0,0,0,0.02);
}
.activity-editor-label {
  font-weight: 700;
  font-size: 0.85rem;
  color: #475569;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  display: block;
  margin-bottom: 0.5rem;
}
.activity-editor-select {
  width: 100%;
  padding: 0.65rem;
  border-radius: 0.5rem;
  border: 1.5px solid #cbd5e1;
  background: white;
  color: #0f172a;
  font-weight: 600;
  outline: none;
  margin-bottom: 1.25rem;
}
.activity-form-group {
  margin-bottom: 1.25rem;
}
.activity-input-text, .activity-textarea {
  width: 100%;
  padding: 0.65rem 0.85rem;
  border-radius: 0.5rem;
  border: 1.5px solid #cbd5e1;
  color: #1e293b;
  font-weight: 500;
  outline: none;
  transition: all 0.2s ease;
}
.activity-input-text:focus, .activity-textarea:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59,130,246,0.1);
}
.activity-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}
.activity-btn {
  border: none;
  border-radius: 0.5rem;
  padding: 0.5rem 1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
}
.activity-btn-primary {
  background: #3b82f6;
  color: white;
}
.activity-btn-primary:hover {
  background: #2563eb;
}
.activity-btn-danger {
  background: #fee2e2;
  color: #ef4444;
}
.activity-btn-danger:hover {
  background: #ef4444;
  color: white;
}
.activity-helper-text {
  font-size: 0.75rem;
  color: #64748b;
  margin-top: 0.25rem;
  display: block;
}
.activity-radio {
  width: 1.15rem;
  height: 1.15rem;
  accent-color: #3b82f6;
  cursor: pointer;
}
.activity-preview-card {
  background: #ffffff;
  border: 1.5px solid #e2e8f0;
  border-radius: 0.75rem;
  padding: 1.25rem;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03);
  transition: border-color 0.2s, box-shadow 0.2s;
}
.activity-preview-card:hover {
  border-color: #cbd5e1;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
}
.activity-preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}
.activity-preview-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: #f1f5f9;
  padding: 0.35rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.85rem;
  font-weight: 600;
  color: #334155;
}
.badge-icon i {
  color: #3b82f6;
  font-size: 0.95rem;
  display: inline-flex;
}
.activity-preview-edit-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 50%;
  width: 2.2rem;
  height: 2.2rem;
  font-size: 0.95rem;
  cursor: pointer;
  transition: background-color 0.15s, transform 0.15s;
}
.activity-preview-edit-btn:hover {
  background: #2563eb;
  transform: scale(1.05);
}
.activity-preview-body {
  color: #475569;
}
.activity-preview-title {
  font-size: 0.8rem;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0 0 0.25rem 0;
}
.activity-preview-desc {
  font-size: 0.95rem;
  font-weight: 500;
  color: #0f172a;
  margin: 0 0 0.5rem 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.activity-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(15, 23, 42, 0.4);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 99999;
  animation: fadeIn 0.2s ease-out;
}
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
.activity-modal-content {
  background: white;
  border-radius: 1rem;
  width: 90%;
  max-width: 650px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  animation: slideUp 0.2s ease-out;
  border: 1px solid rgba(255, 255, 255, 0.2);
  overflow: hidden;
}
@keyframes slideUp {
  from { transform: translateY(15px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
.activity-modal-header {
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f8fafc;
}
.activity-modal-body {
  padding: 1.5rem;
  overflow-y: auto;
  flex-grow: 1;
}
.activity-modal-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  background: #f8fafc;
}
`;
