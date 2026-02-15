import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardSidebar from '@/components/DashboardSidebar';
import { useToast } from '@/components/ToastNotification';
import {
  getCurrentUser, saveMaterial, saveQuiz, getAttempts, getLeaderboard,
  getProjects, updateProjectStatus, genId,
  type User, type QuizQuestion
} from '@/lib/storage';
import {
  Upload, PlusCircle, BarChart3, Trophy, CheckSquare,
  Trash2, Download, Eye, Check, X
} from 'lucide-react';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { showToast, ToastComponent } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [activeSection, setActiveSection] = useState('upload-material');

  useEffect(() => {
    const u = getCurrentUser();
    if (!u || u.role !== 'admin') { navigate('/'); return; }
    setUser(u);
  }, [navigate]);

  const sidebarItems = [
    { id: 'upload-material', label: 'Upload Material', icon: <Upload className="w-5 h-5" /> },
    { id: 'create-quiz', label: 'Create Quiz', icon: <PlusCircle className="w-5 h-5" /> },
    { id: 'monitor', label: 'Monitor Attempts', icon: <BarChart3 className="w-5 h-5" /> },
    { id: 'leaderboard', label: 'Leaderboard', icon: <Trophy className="w-5 h-5" /> },
    { id: 'approvals', label: 'Project Approvals', icon: <CheckSquare className="w-5 h-5" /> },
  ];

  if (!user) return null;

  return (
    <div className="flex h-screen bg-background">
      {ToastComponent}
      <DashboardSidebar
        items={sidebarItems}
        activeId={activeSection}
        onSelect={setActiveSection}
        userName={user.name}
        role="admin"
      />
      <main className="flex-1 overflow-auto">
        <div className="p-6 lg:p-8 max-w-6xl mx-auto fade-in">
          {activeSection === 'upload-material' && <UploadMaterial showToast={showToast} />}
          {activeSection === 'create-quiz' && <CreateQuiz showToast={showToast} />}
          {activeSection === 'monitor' && <MonitorAttempts />}
          {activeSection === 'leaderboard' && <AdminLeaderboard />}
          {activeSection === 'approvals' && <ProjectApprovals showToast={showToast} />}
        </div>
      </main>
    </div>
  );
};

// Upload Material
const UploadMaterial = ({ showToast }: { showToast: (m: string, t?: 'success'|'error'|'info') => void }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [pdfData, setPdfData] = useState('');
  const [pdfName, setPdfName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !content) { showToast('Fill all fields', 'error'); return; }
    saveMaterial({ id: genId(), title, description, content, pdfData, pdfName, createdAt: new Date().toISOString() });
    showToast('Material uploaded!');
    setTitle(''); setDescription(''); setContent(''); setPdfData(''); setPdfName('');
  };

  const handlePdf = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { setPdfData(reader.result as string); setPdfName(file.name); };
    reader.readAsDataURL(file);
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-foreground mb-6">Upload Study Material</h2>
      <form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl p-6 space-y-4">
        <input placeholder="Title" value={title} onChange={e => setTitle(e.target.value)}
          className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
        <input placeholder="Description" value={description} onChange={e => setDescription(e.target.value)}
          className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
        <textarea placeholder="Text Content" value={content} onChange={e => setContent(e.target.value)} rows={6}
          className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
        <div>
          <label className="text-sm font-medium text-foreground mb-1 block">PDF File (optional)</label>
          <input type="file" accept=".pdf" onChange={handlePdf}
            className="w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary file:text-primary-foreground file:font-medium" />
        </div>
        <button type="submit" className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity">
          Upload Material
        </button>
      </form>
    </div>
  );
};

// Create Quiz
const CreateQuiz = ({ showToast }: { showToast: (m: string, t?: 'success'|'error'|'info') => void }) => {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [timeMinutes, setTimeMinutes] = useState(10);

  const addQuestion = () => {
    setQuestions([...questions, { id: genId(), text: '', options: ['', '', '', ''], correctIndex: 0 }]);
  };

  const updateQuestion = (idx: number, field: string, value: string | number) => {
    const q = [...questions];
    if (field === 'text') q[idx].text = value as string;
    else if (field === 'correctIndex') q[idx].correctIndex = value as number;
    setQuestions(q);
  };

  const updateOption = (qi: number, oi: number, value: string) => {
    const q = [...questions];
    q[qi].options[oi] = value;
    setQuestions(q);
  };

  const handleImage = (qi: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const q = [...questions];
      q[qi].imageData = reader.result as string;
      setQuestions(q);
    };
    reader.readAsDataURL(file);
  };

  const removeQuestion = (idx: number) => {
    setQuestions(questions.filter((_, i) => i !== idx));
  };

  const publishQuiz = () => {
    if (questions.length === 0) { showToast('Add at least one question', 'error'); return; }
    if (questions.some(q => !q.text || q.options.some(o => !o))) { showToast('Fill all fields', 'error'); return; }
    saveQuiz({ id: genId(), questions, timeMinutes, published: true, createdAt: new Date().toISOString() });
    showToast('Quiz published!');
    setQuestions([]);
    setTimeMinutes(10);
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-foreground mb-6">Create Quiz</h2>

      <div className="bg-card border border-border rounded-xl p-6 mb-6">
        <label className="text-sm font-medium text-foreground mb-1 block">Quiz Duration (minutes)</label>
        <input type="number" min={1} value={timeMinutes} onChange={e => setTimeMinutes(Number(e.target.value))}
          className="w-32 px-4 py-3 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
      </div>

      <div className="space-y-4 mb-6">
        {questions.map((q, qi) => (
          <div key={q.id} className="bg-card border border-border rounded-xl p-6 fade-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">Question {qi + 1}</h3>
              <button onClick={() => removeQuestion(qi)} className="text-destructive hover:opacity-70">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <input placeholder="Question text" value={q.text} onChange={e => updateQuestion(qi, 'text', e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring mb-3" />
            <div className="mb-3">
              <label className="text-sm text-muted-foreground mb-1 block">Question Image (optional)</label>
              <input type="file" accept="image/*" onChange={e => handleImage(qi, e)}
                className="text-sm text-muted-foreground file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-muted file:text-foreground file:font-medium" />
              {q.imageData && <img src={q.imageData} alt="" className="mt-2 max-w-xs rounded-lg border border-border" />}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
              {q.options.map((opt, oi) => (
                <input key={oi} placeholder={`Option ${oi + 1}`} value={opt} onChange={e => updateOption(qi, oi, e.target.value)}
                  className="px-4 py-2.5 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
              ))}
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Correct Answer</label>
              <select value={q.correctIndex} onChange={e => updateQuestion(qi, 'correctIndex', Number(e.target.value))}
                className="px-4 py-2.5 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
                {q.options.map((_, oi) => <option key={oi} value={oi}>Option {oi + 1}</option>)}
              </select>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <button onClick={addQuestion} className="flex items-center gap-2 px-5 py-3 bg-muted text-foreground rounded-lg font-medium hover:bg-muted/80 transition-colors">
          <PlusCircle className="w-4 h-4" /> Add Question
        </button>
        {questions.length > 0 && (
          <button onClick={publishQuiz} className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity">
            Publish Quiz
          </button>
        )}
      </div>
    </div>
  );
};

// Monitor Attempts
const MonitorAttempts = () => {
  const attempts = getAttempts();

  return (
    <div>
      <h2 className="text-2xl font-bold text-foreground mb-6">Monitor Attempts</h2>
      {attempts.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No quiz attempts yet.</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-6 py-3 text-sm font-medium text-muted-foreground">Student</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-muted-foreground">USN</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-muted-foreground">Score</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-muted-foreground">Time Taken</th>
              </tr>
            </thead>
            <tbody>
              {attempts.map(a => (
                <tr key={a.id} className="border-b border-border last:border-0">
                  <td className="px-6 py-4 font-medium text-foreground">{a.studentName}</td>
                  <td className="px-6 py-4 text-muted-foreground">{a.usn}</td>
                  <td className="px-6 py-4 text-foreground">{a.score}/{a.total}</td>
                  <td className="px-6 py-4 text-muted-foreground">{Math.floor(a.timeTaken / 60)}m {a.timeTaken % 60}s</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// Admin Leaderboard
const AdminLeaderboard = () => {
  const leaderboard = getLeaderboard();

  return (
    <div>
      <h2 className="text-2xl font-bold text-foreground mb-6">Leaderboard</h2>
      {leaderboard.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No quiz attempts yet.</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-6 py-3 text-sm font-medium text-muted-foreground">Rank</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-muted-foreground">Student</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-muted-foreground">Score</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((entry, i) => (
                <tr key={entry.id} className="border-b border-border last:border-0">
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                      i === 0 ? 'bg-accent text-accent-foreground' :
                      i === 1 ? 'bg-muted text-foreground' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {i + 1}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium text-foreground">{entry.studentName}</td>
                  <td className="px-6 py-4 text-foreground">{entry.score}/{entry.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// Project Approvals
const ProjectApprovals = ({ showToast }: { showToast: (m: string, t?: 'success'|'error'|'info') => void }) => {
  const [projects, setProjects] = useState(getProjects());
  const [viewing, setViewing] = useState<string | null>(null);

  const handleAction = (projectId: string, status: 'approved' | 'rejected') => {
    updateProjectStatus(projectId, status);
    setProjects(getProjects());
    if (status === 'approved') {
      const project = projects.find(p => p.id === projectId);
      // Simulated email
      console.log(`📧 Email sent to ${project?.studentEmail}: Subject: Project Approved. Message: Your project "${project?.title}" has been approved by admin.`);
      showToast(`Approved! Email sent to ${project?.studentEmail}`);
    } else {
      showToast('Project rejected', 'error');
    }
  };

  const viewingProject = projects.find(p => p.id === viewing);

  if (viewingProject) {
    return (
      <div className="fade-in">
        <button onClick={() => setViewing(null)} className="text-secondary hover:underline text-sm mb-4">← Back</button>
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-xl font-bold text-foreground mb-2">{viewingProject.title}</h3>
          <p className="text-sm text-muted-foreground mb-4">By {viewingProject.studentName} • {new Date(viewingProject.submittedAt).toLocaleDateString()}</p>
          <p className="text-foreground mb-4 whitespace-pre-wrap">{viewingProject.summary}</p>
          {viewingProject.imageData && <img src={viewingProject.imageData} alt="Project" className="max-w-md rounded-lg border border-border mb-4" />}
          {viewingProject.pdfData && (
            <a href={viewingProject.pdfData} download={viewingProject.pdfName || 'project.pdf'}
              className="inline-flex items-center gap-2 px-4 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80 mb-4">
              <Download className="w-4 h-4" /> Download PDF
            </a>
          )}
          {viewingProject.status === 'pending' && (
            <div className="flex gap-3 mt-4">
              <button onClick={() => handleAction(viewingProject.id, 'approved')}
                className="flex items-center gap-2 px-5 py-2.5 bg-success text-success-foreground rounded-lg font-medium hover:opacity-90">
                <Check className="w-4 h-4" /> Approve
              </button>
              <button onClick={() => handleAction(viewingProject.id, 'rejected')}
                className="flex items-center gap-2 px-5 py-2.5 bg-destructive text-destructive-foreground rounded-lg font-medium hover:opacity-90">
                <X className="w-4 h-4" /> Reject
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-foreground mb-6">Project Approvals</h2>
      {projects.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <CheckSquare className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No projects submitted yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {projects.map(p => (
            <div key={p.id} className="bg-card border border-border rounded-xl p-5 card-hover flex items-center justify-between">
              <div>
                <div className="font-medium text-foreground">{p.title}</div>
                <div className="text-sm text-muted-foreground">{p.studentName} • {new Date(p.submittedAt).toLocaleDateString()}</div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  p.status === 'approved' ? 'bg-success/10 text-success' :
                  p.status === 'rejected' ? 'bg-destructive/10 text-destructive' :
                  'bg-accent/20 text-accent-foreground'
                }`}>
                  {p.status.charAt(0).toUpperCase() + p.status.slice(1)}
                </span>
                <button onClick={() => setViewing(p.id)} className="p-2 text-muted-foreground hover:text-foreground">
                  <Eye className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
