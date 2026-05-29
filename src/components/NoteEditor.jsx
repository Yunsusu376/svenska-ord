import { useState, useEffect } from 'react';
import { getNote, saveNote } from '../services/wordbank';
import './NoteEditor.css';

export default function NoteEditor({ wordId, onSave }) {
  const [note, setNote]       = useState('');
  const [editing, setEditing] = useState(false);
  const [draft, setDraft]     = useState('');

  useEffect(() => {
    setEditing(false);
    getNote(wordId).then(setNote);
  }, [wordId]);

  async function handleSave() {
    const trimmed = draft.trim();
    await saveNote(wordId, trimmed);
    setNote(trimmed);
    setEditing(false);
    onSave?.();
  }

  async function handleDelete() {
    await saveNote(wordId, '');
    setNote('');
    setEditing(false);
    onSave?.();
  }

  if (!note && !editing) {
    return (
      <div className="note-editor">
        <button className="note-add-btn" onClick={() => { setDraft(''); setEditing(true); }}>
          ＋ Add note
        </button>
      </div>
    );
  }

  if (editing) {
    return (
      <div className="note-editor">
        <textarea
          className="note-textarea"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          placeholder="Write your notes, associations, extra examples…"
          rows={3}
          autoFocus
        />
        <div className="note-actions">
          <button className="note-save" onClick={handleSave}>Save</button>
          <button className="note-cancel" onClick={() => setEditing(false)}>Cancel</button>
          {note && (
            <button className="note-delete" onClick={handleDelete}>Delete note</button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="note-editor">
      <div className="note-view">
        <div className="note-view-header">
          <span className="note-view-label">📝 Note</span>
          <div className="note-view-btns">
            <button className="note-edit-btn" onClick={() => { setDraft(note); setEditing(true); }}>Edit</button>
            <button className="note-delete-btn" onClick={handleDelete}>Delete</button>
          </div>
        </div>
        <p className="note-view-text">{note}</p>
      </div>
    </div>
  );
}
