'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  AlignCenter, AlignJustify, AlignLeft, AlignRight, ArrowLeft, Check, CheckCircle2,
  Circle, Code2, Download, FileText, Highlighter, Link2, List, ListOrdered,
  Loader2, Palette, Printer, Redo2, Save, Sparkles, Strikethrough, Table2,
  Trash2, Type, Underline, Undo2, X
} from 'lucide-react'
import { Roadmap, Resource, SelectedNode, SubTopic, Topic } from '@/types'
import { addResource, deleteResource, deleteSubTopic, deleteTopic, updateSubTopic, updateTopic } from '@/lib/db'
import { getDomain, TOPIC_COLORS } from '@/lib/utils'

interface NotesPanelProps {
  roadmap: Roadmap
  selected: SelectedNode
  onClose: () => void
  onRoadmapUpdate: (r: Roadmap) => void
}

type ExportFormat = 'pdf' | 'md' | 'txt'

const ICONS = ['📘', '🌐', '💻', '☁️', '🔒', '⚙️', '🧠', '📝', '🚀', '✅']
const FONT_SIZES: Record<string, string> = { '12': '2', '14': '3', '16': '3', '18': '4', '20': '4', '24': '5', '28': '6', '32': '6' }

function downloadText(filename: string, text: string, mime: string) {
  const blob = new Blob([text], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

function safeName(name: string) {
  return name.replace(/[^a-z0-9\-_]+/gi, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').toLowerCase() || 'notes'
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[c]!))
}

function plainTextToHtml(value: string) {
  if (!value.trim()) return ''
  if (/<[a-z][\s\S]*>/i.test(value)) return value
  return value
    .split(/\n{2,}/)
    .map(block => `<p>${escapeHtml(block).replace(/\n/g, '<br>')}</p>`)
    .join('')
}

function stripHtml(html: string) {
  if (typeof window === 'undefined') return html.replace(/<[^>]+>/g, ' ')
  const div = document.createElement('div')
  div.innerHTML = html
  return div.innerText
}

export default function NotesPanel({ roadmap, selected, onClose, onRoadmapUpdate }: NotesPanelProps) {
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editColor, setEditColor] = useState(TOPIC_COLORS[0])
  const [editIcon, setEditIcon] = useState('📘')
  const [addingResource, setAddingResource] = useState(false)
  const [resourceTitle, setResourceTitle] = useState('')
  const [resourceUrl, setResourceUrl] = useState('')
  const [downloadOpen, setDownloadOpen] = useState(false)
  const saveTimer = useRef<NodeJS.Timeout | null>(null)
  const editorRef = useRef<HTMLDivElement | null>(null)

  const topic: Topic | null = selected.type === 'topic' || selected.type === 'subtopic'
    ? roadmap.topics[selected.topicId] ?? null
    : null
  const subTopic: SubTopic | null = selected.type === 'subtopic' && topic
    ? topic.subTopics[selected.subTopicId] ?? null
    : null
  const item = selected.type === 'topic' ? topic : selected.type === 'subtopic' ? subTopic : null
  const title = selected.type === 'roadmap' ? roadmap.title : item?.title ?? ''
  const description = selected.type === 'roadmap' ? roadmap.description : item?.description ?? ''
  const completed = item?.completed ?? false
  const resources: Resource[] = selected.type === 'topic' ? topic?.resources ?? [] : selected.type === 'subtopic' ? subTopic?.resources ?? [] : []

  const breadcrumbs = useMemo(() => {
    if (selected.type === 'roadmap') return [roadmap.title]
    if (selected.type === 'topic') return [roadmap.title, topic?.title ?? 'Topic']
    return [roadmap.title, topic?.title ?? 'Topic', subTopic?.title ?? 'Subtopic']
  }, [roadmap.title, selected, topic?.title, subTopic?.title])

  useEffect(() => {
    const currentNotes = selected.type === 'topic' ? topic?.notes ?? '' : selected.type === 'subtopic' ? subTopic?.notes ?? '' : ''
    const html = plainTextToHtml(currentNotes)
    setNotes(html)
    if (editorRef.current) editorRef.current.innerHTML = html
    setSaved(false)
    setEditOpen(false)
    setEditTitle(title)
    setEditDescription(description)
    setEditColor(topic?.color ?? TOPIC_COLORS[0])
    setEditIcon((item as any)?.icon ?? '📘')
  }, [selected, title, description, topic?.color, (item as any)?.icon])

  const saveNotes = async (value: string) => {
    if (selected.type === 'roadmap') return
    setSaving(true)
    try {
      if (selected.type === 'topic') await updateTopic(roadmap.id, selected.topicId, { notes: value })
      if (selected.type === 'subtopic') await updateSubTopic(roadmap.id, selected.topicId, selected.subTopicId, { notes: value })
      const updated = JSON.parse(JSON.stringify(roadmap)) as Roadmap
      if (selected.type === 'topic') updated.topics[selected.topicId].notes = value
      if (selected.type === 'subtopic') updated.topics[selected.topicId].subTopics[selected.subTopicId].notes = value
      onRoadmapUpdate(updated)
      setSaved(true)
    } finally {
      setSaving(false)
    }
  }

  const handleNotesChange = (value: string) => {
    setNotes(value)
    setSaved(false)
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => saveNotes(value), 800)
  }

  const syncFromEditor = () => {
    handleNotesChange(editorRef.current?.innerHTML ?? '')
  }

  const runCommand = (command: string, value?: string) => {
    editorRef.current?.focus()
    document.execCommand(command, false, value)
    syncFromEditor()
  }

  const changeFontSize = (size: string) => {
    runCommand('fontSize', FONT_SIZES[size] ?? '3')
    const fonts = editorRef.current?.querySelectorAll('font[size]') ?? []
    fonts.forEach(font => {
      const el = font as HTMLElement
      el.removeAttribute('size')
      el.style.fontSize = `${size}px`
    })
    syncFromEditor()
  }

  const insertTable = () => {
    editorRef.current?.focus()
    const html = `<table style="width:100%;border-collapse:collapse;margin:12px 0"><tbody>${Array.from({ length: 3 }).map(() => `<tr>${Array.from({ length: 3 }).map(() => '<td style="border:1px solid #cbd5e1;padding:8px;min-width:80px">&nbsp;</td>').join('')}</tr>`).join('')}</tbody></table><p><br></p>`
    document.execCommand('insertHTML', false, html)
    syncFromEditor()
  }

  const insertLink = () => {
    const url = prompt('Paste link URL')
    if (!url) return
    runCommand('createLink', url)
  }

  const insertCodeBlock = () => {
    editorRef.current?.focus()
    document.execCommand('insertHTML', false, '<pre style="background:#f1f5f9;border:1px solid #cbd5e1;border-radius:10px;padding:12px;white-space:pre-wrap"><code>code here</code></pre><p><br></p>')
    syncFromEditor()
  }

  const toggleCompleted = async () => {
    if (!item || selected.type === 'roadmap') return
    const newVal = !completed
    const updated = JSON.parse(JSON.stringify(roadmap)) as Roadmap
    if (selected.type === 'topic') {
      await updateTopic(roadmap.id, selected.topicId, { completed: newVal })
      updated.topics[selected.topicId].completed = newVal
    } else {
      await updateSubTopic(roadmap.id, selected.topicId, selected.subTopicId, { completed: newVal })
      updated.topics[selected.topicId].subTopics[selected.subTopicId].completed = newVal
    }
    onRoadmapUpdate(updated)
  }

  const saveTopicDetails = async () => {
    if (!item || selected.type === 'roadmap' || !editTitle.trim()) return
    const updated = JSON.parse(JSON.stringify(roadmap)) as Roadmap
    if (selected.type === 'topic') {
      await updateTopic(roadmap.id, selected.topicId, {
        title: editTitle.trim(),
        description: editDescription.trim(),
        color: editColor,
        icon: editIcon,
      } as Partial<Topic>)
      Object.assign(updated.topics[selected.topicId], {
        title: editTitle.trim(), description: editDescription.trim(), color: editColor, icon: editIcon,
      })
    } else {
      await updateSubTopic(roadmap.id, selected.topicId, selected.subTopicId, {
        title: editTitle.trim(),
        description: editDescription.trim(),
        icon: editIcon,
      } as Partial<SubTopic>)
      Object.assign(updated.topics[selected.topicId].subTopics[selected.subTopicId], {
        title: editTitle.trim(), description: editDescription.trim(), icon: editIcon,
      })
    }
    onRoadmapUpdate(updated)
    setEditOpen(false)
  }

  const handleDeleteCurrent = async () => {
    if (!item || selected.type === 'roadmap') return
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return
    const updated = JSON.parse(JSON.stringify(roadmap)) as Roadmap
    if (selected.type === 'topic') {
      await deleteTopic(roadmap.id, selected.topicId)
      delete updated.topics[selected.topicId]
    } else {
      await deleteSubTopic(roadmap.id, selected.topicId, selected.subTopicId)
      delete updated.topics[selected.topicId].subTopics[selected.subTopicId]
    }
    onRoadmapUpdate(updated)
    onClose()
  }

  const handleExport = (format: ExportFormat) => {
    const htmlNotes = notes || '<p>No notes added yet.</p>'
    const plain = stripHtml(htmlNotes)
    const md = `# ${title}\n\n${description ? `${description}\n\n` : ''}## Notes\n\n${plain}\n\n${resources.length ? `## Resources\n\n${resources.map(r => `- [${r.title}](${r.url})`).join('\n')}\n` : ''}`
    const base = safeName(title)
    setDownloadOpen(false)
    if (format === 'md') return downloadText(`${base}.md`, md, 'text/markdown')
    if (format === 'txt') return downloadText(`${base}.txt`, plain, 'text/plain')

    const html = `<!doctype html><html><head><title>${escapeHtml(title)}</title><style>body{font-family:Calibri,Arial,sans-serif;line-height:1.65;max-width:850px;margin:40px auto;padding:0 24px;color:#111}h1{font-size:32px}table{width:100%;border-collapse:collapse}td,th{border:1px solid #cbd5e1;padding:8px}pre{background:#f4f4f5;padding:14px;border-radius:10px;white-space:pre-wrap}a{color:#2563eb}</style></head><body><h1>${escapeHtml(title)}</h1>${description ? `<p>${escapeHtml(description)}</p>` : ''}<h2>Notes</h2>${htmlNotes}${resources.length ? `<h2>Resources</h2><ul>${resources.map(r => `<li><a href="${escapeHtml(r.url)}">${escapeHtml(r.title)}</a></li>`).join('')}</ul>` : ''}<script>setTimeout(()=>window.print(),300)</script></body></html>`
    const w = window.open('', '_blank')
    if (w) {
      w.document.write(html)
      w.document.close()
    }
  }

  const handleAddResource = async () => {
    if (!resourceUrl.trim() || selected.type === 'roadmap') return
    const subTopicId = selected.type === 'subtopic' ? selected.subTopicId : null
    const topicId = selected.topicId
    const r = await addResource(roadmap.id, topicId, subTopicId, {
      type: resourceUrl.includes('youtube') || resourceUrl.includes('youtu.be') ? 'youtube' : 'link',
      title: resourceTitle.trim() || getDomain(resourceUrl.trim()),
      url: resourceUrl.trim(),
    })
    const updated = JSON.parse(JSON.stringify(roadmap)) as Roadmap
    if (selected.type === 'topic') updated.topics[topicId].resources = [...(updated.topics[topicId].resources ?? []), r]
    if (selected.type === 'subtopic') updated.topics[topicId].subTopics[selected.subTopicId].resources = [...(updated.topics[topicId].subTopics[selected.subTopicId].resources ?? []), r]
    onRoadmapUpdate(updated)
    setAddingResource(false); setResourceTitle(''); setResourceUrl('')
  }

  const handleDeleteResource = async (id: string) => {
    if (selected.type === 'roadmap') return
    const subTopicId = selected.type === 'subtopic' ? selected.subTopicId : null
    await deleteResource(roadmap.id, selected.topicId, subTopicId, id)
    const updated = JSON.parse(JSON.stringify(roadmap)) as Roadmap
    if (selected.type === 'topic') updated.topics[selected.topicId].resources = updated.topics[selected.topicId].resources.filter(r => r.id !== id)
    if (selected.type === 'subtopic') updated.topics[selected.topicId].subTopics[selected.subTopicId].resources = updated.topics[selected.topicId].subTopics[selected.subTopicId].resources.filter(r => r.id !== id)
    onRoadmapUpdate(updated)
  }

  const isEditable = selected.type !== 'roadmap'

  const toolbarButton = 'inline-flex h-9 min-w-9 items-center justify-center gap-1.5 rounded-lg px-2 text-sm transition hover:bg-slate-100 active:scale-95'

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-100">
      <header className="flex items-center gap-3 border-b border-slate-200 bg-white px-5 py-3">
        <button onClick={onClose} className="rounded-lg p-2 hover:bg-slate-100" title="Back to roadmap">
          <ArrowLeft size={20} />
        </button>
        <div className="min-w-0 flex-1">
          <div className="text-xs text-slate-500 truncate">{breadcrumbs.join(' / ')}</div>
          <h1 className="truncate text-xl font-bold text-slate-950">
            {(item as any)?.icon ? `${(item as any).icon} ` : ''}{title}
          </h1>
        </div>
        {isEditable && (
          <>
            <button onClick={toggleCompleted} className="flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2 text-sm text-slate-900 hover:bg-slate-200">
              {completed ? <CheckCircle2 size={16} className="text-emerald-500" /> : <Circle size={16} />} {completed ? 'Completed' : 'Mark complete'}
            </button>
            <button onClick={() => setEditOpen(true)} className="rounded-xl bg-slate-100 px-4 py-2 text-sm text-slate-900 hover:bg-slate-200">Edit Topic</button>
            <button onClick={() => handleExport('pdf')} className="flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2 text-sm text-slate-900 hover:bg-slate-200"><Printer size={16} /> Print</button>
            <div className="relative">
              <button onClick={() => setDownloadOpen(v => !v)} className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"><Download size={16} /> Download</button>
              {downloadOpen && (
                <div className="absolute right-0 top-full z-20 mt-2 w-44 rounded-xl border border-slate-200 bg-white p-1 shadow-xl">
                  <button onClick={() => handleExport('pdf')} className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-100">PDF / Print</button>
                  <button onClick={() => handleExport('md')} className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-100">Markdown</button>
                  <button onClick={() => handleExport('txt')} className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-100">Text</button>
                </div>
              )}
            </div>
          </>
        )}
      </header>

      {isEditable && (
        <div className="flex flex-wrap items-center gap-1 border-b border-slate-200 bg-white px-3 py-2 text-slate-800">
          <select onChange={e => runCommand('fontName', e.target.value)} className="h-9 rounded-lg border border-slate-300 bg-white px-2 text-sm">
            <option>Calibri</option><option>Arial</option><option>Times New Roman</option><option>Verdana</option><option>Georgia</option><option>Courier New</option>
          </select>
          <select onChange={e => changeFontSize(e.target.value)} className="h-9 rounded-lg border border-slate-300 bg-white px-2 text-sm" defaultValue="16">
            {Object.keys(FONT_SIZES).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <span className="mx-1 h-8 w-px bg-slate-200" />
          <button className={toolbarButton} onClick={() => runCommand('bold')} title="Bold"><b>B</b></button>
          <button className={toolbarButton} onClick={() => runCommand('italic')} title="Italic"><i>I</i></button>
          <button className={toolbarButton} onClick={() => runCommand('underline')} title="Underline"><Underline size={17} /></button>
          <button className={toolbarButton} onClick={() => runCommand('strikeThrough')} title="Strikethrough"><Strikethrough size={17} /></button>
          <span className="mx-1 h-8 w-px bg-slate-200" />
          <label className={toolbarButton} title="Text color"><Palette size={17} /><input type="color" className="h-5 w-5 cursor-pointer border-0 bg-transparent p-0" onChange={e => runCommand('foreColor', e.target.value)} /></label>
          <label className={toolbarButton} title="Highlight"><Highlighter size={17} /><input type="color" className="h-5 w-5 cursor-pointer border-0 bg-transparent p-0" defaultValue="#fff200" onChange={e => runCommand('hiliteColor', e.target.value)} /></label>
          <span className="mx-1 h-8 w-px bg-slate-200" />
          <button className={toolbarButton} onClick={() => runCommand('formatBlock', 'h1')} title="Heading 1">H1</button>
          <button className={toolbarButton} onClick={() => runCommand('formatBlock', 'h2')} title="Heading 2">H2</button>
          <button className={toolbarButton} onClick={() => runCommand('formatBlock', 'p')} title="Normal"><Type size={17} /></button>
          <span className="mx-1 h-8 w-px bg-slate-200" />
          <button className={toolbarButton} onClick={() => runCommand('justifyLeft')} title="Align left"><AlignLeft size={17} /></button>
          <button className={toolbarButton} onClick={() => runCommand('justifyCenter')} title="Align center"><AlignCenter size={17} /></button>
          <button className={toolbarButton} onClick={() => runCommand('justifyRight')} title="Align right"><AlignRight size={17} /></button>
          <button className={toolbarButton} onClick={() => runCommand('justifyFull')} title="Justify"><AlignJustify size={17} /></button>
          <span className="mx-1 h-8 w-px bg-slate-200" />
          <button className={toolbarButton} onClick={() => runCommand('insertUnorderedList')} title="Bullet list"><List size={17} /></button>
          <button className={toolbarButton} onClick={() => runCommand('insertOrderedList')} title="Number list"><ListOrdered size={17} /></button>
          <button className={toolbarButton} onClick={insertTable} title="Insert table"><Table2 size={17} /></button>
          <button className={toolbarButton} onClick={insertLink} title="Insert link"><Link2 size={17} /></button>
          <button className={toolbarButton} onClick={insertCodeBlock} title="Code block"><Code2 size={17} /></button>
          <span className="mx-1 h-8 w-px bg-slate-200" />
          <button className={toolbarButton} onClick={() => runCommand('undo')} title="Undo"><Undo2 size={17} /></button>
          <button className={toolbarButton} onClick={() => runCommand('redo')} title="Redo"><Redo2 size={17} /></button>
          <div className="ml-auto flex items-center gap-1.5 pr-2 text-xs text-slate-500">
            {saving && <><Loader2 size={13} className="animate-spin" /> Saving...</>}
            {!saving && saved && <><CheckCircle2 size={13} className="text-emerald-500" /> Saved</>}
            {!saving && !saved && <><Save size={13} /> Auto-save</>}
          </div>
        </div>
      )}

      <main className="flex-1 overflow-y-auto px-6 py-8">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 xl:grid-cols-[1fr_330px]">
          <section className="mx-auto w-full max-w-[850px] bg-white shadow-sm ring-1 ring-slate-200">
            <div
              ref={editorRef}
              contentEditable={isEditable}
              suppressContentEditableWarning
              onInput={syncFromEditor}
              className="word-editor min-h-[1050px] w-full px-20 py-16 text-[16px] leading-8 text-slate-950 outline-none"
              style={{ fontFamily: 'Calibri, Arial, sans-serif' }}
              data-placeholder="Start writing your learning notes here..."
            />
          </section>

          <aside className="space-y-4">
            <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-950"><Sparkles size={16} /> Topic Details</h3>
              <p className="text-sm leading-6 text-slate-500">{description || 'No description added yet.'}</p>
            </div>
            <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-sm font-bold text-slate-950"><FileText size={16} /> Resources</h3>
                {isEditable && <button onClick={() => setAddingResource(true)} className="rounded-lg bg-slate-100 px-2 py-1 text-xs text-slate-900 hover:bg-slate-200">+ Add</button>}
              </div>
              {addingResource && (
                <div className="mb-3 space-y-2">
                  <input value={resourceTitle} onChange={e => setResourceTitle(e.target.value)} placeholder="Title" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none" />
                  <input value={resourceUrl} onChange={e => setResourceUrl(e.target.value)} placeholder="https://..." className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none" />
                  <div className="flex gap-2"><button onClick={handleAddResource} className="flex-1 rounded-xl bg-blue-600 px-3 py-2 text-sm text-white">Save</button><button onClick={() => setAddingResource(false)} className="rounded-xl bg-slate-100 px-3 py-2 text-sm">Cancel</button></div>
                </div>
              )}
              <div className="space-y-2">
                {resources.map(r => <div key={r.id} className="group flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2"><Link2 size={14} className="text-blue-600" /><a href={r.url} target="_blank" className="min-w-0 flex-1 truncate text-sm text-slate-900">{r.title}</a><button onClick={() => handleDeleteResource(r.id)} className="opacity-0 group-hover:opacity-100 text-rose-500"><Trash2 size={13} /></button></div>)}
                {resources.length === 0 && <p className="text-sm text-slate-500">No resources yet.</p>}
              </div>
            </div>
          </aside>
        </div>
      </main>

      {editOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-bold text-slate-950">Edit Topic</h2><button onClick={() => setEditOpen(false)}><X size={18} /></button></div>
            <div className="space-y-3">
              <input value={editTitle} onChange={e => setEditTitle(e.target.value)} placeholder="Topic title" className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none" />
              <textarea value={editDescription} onChange={e => setEditDescription(e.target.value)} placeholder="Description" rows={3} className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none" />
              <div><p className="mb-2 text-xs font-semibold uppercase text-slate-500">Icon</p><div className="flex flex-wrap gap-2">{ICONS.map(i => <button key={i} onClick={() => setEditIcon(i)} className="h-9 w-9 rounded-xl text-lg" style={{ background: editIcon === i ? 'rgba(59,130,246,.14)' : '#f8fafc', border: `1px solid ${editIcon === i ? '#3b82f6' : '#e2e8f0'}` }}>{i}</button>)}</div></div>
              {selected.type === 'topic' && <div><p className="mb-2 text-xs font-semibold uppercase text-slate-500">Color</p><div className="flex flex-wrap gap-2">{TOPIC_COLORS.map(c => <button key={c} onClick={() => setEditColor(c)} className="h-8 w-8 rounded-full" style={{ background: c, outline: editColor === c ? `3px solid ${c}66` : 'none', outlineOffset: 3 }} />)}</div></div>}
              <div className="flex gap-2 pt-2"><button onClick={saveTopicDetails} className="flex-1 rounded-xl bg-blue-600 px-4 py-2 text-white"><Check size={15} className="inline mr-1" /> Save</button><button onClick={handleDeleteCurrent} className="rounded-xl bg-rose-50 px-4 py-2 text-rose-500"><Trash2 size={15} className="inline mr-1" /> Delete</button></div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
