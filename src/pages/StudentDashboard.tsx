import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardSidebar from '@/components/DashboardSidebar';
import { useToast } from '@/components/ToastNotification';
import {
  getCurrentUser, getMaterials, getPublishedQuiz, getStudentAttempt,
  saveAttempt, getLeaderboard, getStudentProjects, saveProject, genId,
  type User, type StudyMaterial, type Quiz, type QuizAttempt, type Project
} from '@/lib/storage';
import {
  LayoutDashboard, BookText, ClipboardCheck, Upload, Trophy, FileText,
  Clock, Award, Download, Eye, ChevronRight, Timer
} from 'lucide-react';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const { showToast, ToastComponent } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [activeSection, setActiveSection] = useState('dashboard');

  useEffect(() => {
    const u = getCurrentUser();
    if (!u || u.role !== 'student') { navigate('/'); return; }
    setUser(u);
  }, [navigate]);

  const sidebarItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'updates', label: 'Daily Updates', icon: <BookText className="w-5 h-5" /> },
    { id: 'quiz', label: 'Attend Quiz', icon: <ClipboardCheck className="w-5 h-5" /> },
    { id: 'project', label: 'Upload Project', icon: <Upload className="w-5 h-5" /> },
    { id: 'leaderboard', label: 'Leaderboard', icon: <Trophy className="w-5 h-5" /> },
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
        role="student"
      />
      <main className="flex-1 overflow-auto">
        <div className="p-6 lg:p-8 max-w-6xl mx-auto fade-in">
          {activeSection === 'dashboard' && <DashboardHome user={user} />}
          {activeSection === 'updates' && <DailyUpdates />}
          {activeSection === 'quiz' && <QuizSection user={user} showToast={showToast} />}
          {activeSection === 'project' && <ProjectUpload user={user} showToast={showToast} />}
          {activeSection === 'leaderboard' && <LeaderboardView />}
        </div>
      </main>
    </div>
  );
};

// Dashboard Home
const DashboardHome = ({ user }: { user: User }) => {
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const materials = getMaterials();
  const quiz = getPublishedQuiz();
  const projects = getStudentProjects(user.id);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Welcome back, {user.name}! 👋</h1>
        <p className="text-muted-foreground mt-1">{today}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <StatCard icon={<BookText className="w-6 h-6" />} label="Study Materials" value={materials.length} color="bg-primary" />
        <StatCard icon={<ClipboardCheck className="w-6 h-6" />} label="Quiz Available" value={quiz ? 'Yes' : 'No'} color="bg-secondary" />
        <StatCard icon={<FileText className="w-6 h-6" />} label="Projects Submitted" value={projects.length} color="bg-accent" />
      </div>
      {quiz && (
        <div className="bg-card border border-border rounded-xl p-6 card-hover">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
              <Timer className="w-5 h-5 text-secondary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Quiz Available!</h3>
              <p className="text-sm text-muted-foreground">{quiz.questions.length} questions • {quiz.timeMinutes} minutes</p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground ml-auto" />
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color: string }) => (
  <div className="bg-card border border-border rounded-xl p-5 card-hover">
    <div className="flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center text-primary-foreground`}>
        {icon}
      </div>
      <div>
        <div className="text-2xl font-bold text-foreground">{value}</div>
        <div className="text-sm text-muted-foreground">{label}</div>
      </div>
    </div>
  </div>
);

// Daily Updates
const DailyUpdates = () => {
  const [materials] = useState(getMaterials());
  const [selectedMaterial, setSelectedMaterial] = useState<StudyMaterial | null>(null);

  if (selectedMaterial) {
    return (
      <div className="fade-in">
        <button onClick={() => setSelectedMaterial(null)} className="text-secondary hover:underline text-sm mb-4 flex items-center gap-1">
          ← Back to materials
        </button>
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-xl font-bold text-foreground mb-2">{selectedMaterial.title}</h2>
          <p className="text-muted-foreground mb-4">{selectedMaterial.description}</p>
          <div className="prose max-w-none text-foreground whitespace-pre-wrap mb-4">{selectedMaterial.content}</div>
          {selectedMaterial.pdfData && (
            <a
              href={selectedMaterial.pdfData}
              download={selectedMaterial.pdfName || 'document.pdf'}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90"
            >
              <Download className="w-4 h-4" /> Download PDF
            </a>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-foreground mb-6">Daily Study Materials</h2>
      {materials.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <BookText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No study materials available yet.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {materials.map(m => (
            <div key={m.id} className="bg-card border border-border rounded-xl p-5 card-hover">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-foreground">{m.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{m.description}</p>
                  <p className="text-xs text-muted-foreground mt-2">{new Date(m.createdAt).toLocaleDateString()}</p>
                </div>
                <button
                  onClick={() => setSelectedMaterial(m)}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-lg hover:opacity-90"
                >
                  <Eye className="w-4 h-4" /> Open
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Quiz Section
const QuizSection = ({ user, showToast }: { user: User; showToast: (m: string, t?: 'success'|'error'|'info') => void }) => {
  const [quiz, setQuiz] = useState<Quiz | undefined>(getPublishedQuiz());
  const [attempt, setAttempt] = useState<QuizAttempt | undefined>(
    quiz ? getStudentAttempt(user.id, quiz.id) : undefined
  );
  const [started, setStarted] = useState(false);
  const [answers, setAnswers] = useState<number[]>([]);
  const [timeLeft, setTimeLeft] = useState(0);

  const handleSubmit = useCallback(() => {
    if (!quiz) return;
    let score = 0;
    quiz.questions.forEach((q, i) => {
      if (answers[i] === q.correctIndex) score++;
    });
    const timeTaken = quiz.timeMinutes * 60 - timeLeft;
    const newAttempt: QuizAttempt = {
      id: genId(),
      quizId: quiz.id,
      studentId: user.id,
      studentName: user.name,
      usn: user.usn || '',
      score,
      total: quiz.questions.length,
      timeTaken,
      answers,
      submittedAt: new Date().toISOString(),
    };
    saveAttempt(newAttempt);
    setAttempt(newAttempt);
    setStarted(false);
    showToast(`Quiz submitted! Score: ${score}/${quiz.questions.length}`);
  }, [quiz, answers, timeLeft, user, showToast]);

  useEffect(() => {
    if (!started || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [started, timeLeft, handleSubmit]);

  if (!quiz) {
    return (
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-6">Attend Quiz</h2>
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <ClipboardCheck className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No quiz is currently available.</p>
        </div>
      </div>
    );
  }

  // Show results
  if (attempt) {
    const leaderboard = getLeaderboard();
    const rank = leaderboard.findIndex(a => a.studentId === user.id) + 1;
    return (
      <div className="fade-in">
        <h2 className="text-2xl font-bold text-foreground mb-6">Your Quiz Results</h2>
        <div className="bg-card border border-border rounded-xl p-8 text-center">
          <Award className="w-16 h-16 text-accent mx-auto mb-4" />
          <div className="text-4xl font-bold text-foreground mb-2">{attempt.score}/{attempt.total}</div>
          <p className="text-muted-foreground mb-4">Your Score</p>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-secondary/10 text-secondary rounded-full font-medium">
            <Trophy className="w-4 h-4" /> Rank #{rank}
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            Time taken: {Math.floor(attempt.timeTaken / 60)}m {attempt.timeTaken % 60}s
          </p>
        </div>
      </div>
    );
  }

  // Quiz taking
  if (started) {
    const mins = Math.floor(timeLeft / 60);
    const secs = timeLeft % 60;
    return (
      <div className="fade-in">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-foreground">Quiz in Progress</h2>
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full font-mono font-bold ${timeLeft < 60 ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}>
            <Clock className="w-4 h-4" />
            {mins}:{secs.toString().padStart(2, '0')}
          </div>
        </div>
        <div className="space-y-6">
          {quiz.questions.map((q, qi) => (
            <div key={q.id} className="bg-card border border-border rounded-xl p-6">
              <p className="font-medium text-foreground mb-3">Q{qi + 1}. {q.text}</p>
              {q.imageData && <img src={q.imageData} alt="Question" className="max-w-sm rounded-lg mb-4 border border-border" />}
              <div className="grid gap-2">
                {q.options.map((opt, oi) => (
                  <label
                    key={oi}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                      answers[qi] === oi ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`q-${qi}`}
                      checked={answers[qi] === oi}
                      onChange={() => {
                        const a = [...answers];
                        a[qi] = oi;
                        setAnswers(a);
                      }}
                      className="accent-primary"
                    />
                    <span className="text-foreground">{opt}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
        <button
          onClick={handleSubmit}
          className="mt-6 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
        >
          Submit Quiz
        </button>
      </div>
    );
  }

  // Start screen
  return (
    <div>
      <h2 className="text-2xl font-bold text-foreground mb-6">Attend Quiz</h2>
      <div className="bg-card border border-border rounded-xl p-8 text-center">
        <ClipboardCheck className="w-16 h-16 text-primary mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-foreground mb-2">Quiz Ready</h3>
        <p className="text-muted-foreground mb-1">{quiz.questions.length} Questions</p>
        <p className="text-muted-foreground mb-6">{quiz.timeMinutes} Minutes</p>
        <button
          onClick={() => {
            setAnswers(new Array(quiz.questions.length).fill(-1));
            setTimeLeft(quiz.timeMinutes * 60);
            setStarted(true);
          }}
          className="px-8 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
        >
          Start Quiz
        </button>
      </div>
    </div>
  );
};

// Project Upload
const ProjectUpload = ({ user, showToast }: { user: User; showToast: (m: string, t?: 'success'|'error'|'info') => void }) => {
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [imageData, setImageData] = useState('');
  const [pdfData, setPdfData] = useState('');
  const [pdfName, setPdfName] = useState('');
  const projects = getStudentProjects(user.id);

  const handleFileRead = (file: File, setter: (v: string) => void, nameSetter?: (v: string) => void) => {
    const reader = new FileReader();
    reader.onload = () => { setter(reader.result as string); if (nameSetter) nameSetter(file.name); };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !summary) { showToast('Fill title and summary', 'error'); return; }
    const project: Project = {
      id: genId(),
      studentId: user.id,
      studentName: user.name,
      studentEmail: user.email,
      title,
      summary,
      imageData,
      pdfData,
      pdfName,
      status: 'pending',
      submittedAt: new Date().toISOString(),
    };
    saveProject(project);
    showToast('Project submitted for review!');
    setTitle(''); setSummary(''); setImageData(''); setPdfData(''); setPdfName('');
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-foreground mb-6">Upload Project</h2>
      <form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl p-6 space-y-4 mb-6">
        <input
          placeholder="Project Title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <textarea
          placeholder="Project Summary"
          value={summary}
          onChange={e => setSummary(e.target.value)}
          rows={4}
          className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Project Image</label>
            <input type="file" accept="image/*" onChange={e => e.target.files?.[0] && handleFileRead(e.target.files[0], setImageData)}
              className="w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary file:text-primary-foreground file:font-medium hover:file:opacity-90" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Project PDF</label>
            <input type="file" accept=".pdf" onChange={e => e.target.files?.[0] && handleFileRead(e.target.files[0], setPdfData, setPdfName)}
              className="w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary file:text-primary-foreground file:font-medium hover:file:opacity-90" />
          </div>
        </div>
        <button type="submit" className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity">
          Submit Project
        </button>
      </form>

      {projects.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-4">Your Submissions</h3>
          <div className="space-y-3">
            {projects.map(p => (
              <div key={p.id} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between">
                <div>
                  <div className="font-medium text-foreground">{p.title}</div>
                  <div className="text-sm text-muted-foreground">{new Date(p.submittedAt).toLocaleDateString()}</div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  p.status === 'approved' ? 'bg-success/10 text-success' :
                  p.status === 'rejected' ? 'bg-destructive/10 text-destructive' :
                  'bg-accent/20 text-accent-foreground'
                }`}>
                  {p.status.charAt(0).toUpperCase() + p.status.slice(1)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Leaderboard
const LeaderboardView = () => {
  const leaderboard = getLeaderboard().slice(0, 10);

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
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((entry, i) => (
                <tr key={entry.id} className="border-b border-border last:border-0">
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                      i === 0 ? 'bg-accent text-accent-foreground' :
                      i === 1 ? 'bg-muted text-foreground' :
                      i === 2 ? 'bg-secondary/20 text-secondary' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {i + 1}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium text-foreground">{entry.studentName}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
