// LocalStorage utilities for Smart Learning Portal

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: 'student' | 'admin';
  usn?: string;
  adminId?: string;
}

export interface StudyMaterial {
  id: string;
  title: string;
  description: string;
  content: string;
  pdfData?: string; // base64
  pdfName?: string;
  createdAt: string;
}

export interface QuizQuestion {
  id: string;
  text: string;
  imageData?: string; // base64
  options: string[];
  correctIndex: number;
}

export interface Quiz {
  id: string;
  questions: QuizQuestion[];
  timeMinutes: number;
  published: boolean;
  createdAt: string;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  studentId: string;
  studentName: string;
  usn: string;
  score: number;
  total: number;
  timeTaken: number; // seconds
  answers: number[];
  submittedAt: string;
}

export interface Project {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  title: string;
  summary: string;
  imageData?: string;
  pdfData?: string;
  pdfName?: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
}

// Helpers
const get = <T>(key: string, fallback: T): T => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch { return fallback; }
};

const set = (key: string, value: unknown) => {
  localStorage.setItem(key, JSON.stringify(value));
};

// Users
export const getUsers = (): User[] => get('slp_users', []);
export const saveUser = (user: User) => {
  const users = getUsers();
  users.push(user);
  set('slp_users', users);
};
export const findUser = (email: string, password: string, role: string): User | undefined =>
  getUsers().find(u => u.email === email && u.password === password && u.role === role);
export const findUserByEmail = (email: string): User | undefined =>
  getUsers().find(u => u.email === email);

// Current session
export const setCurrentUser = (user: User) => set('slp_current_user', user);
export const getCurrentUser = (): User | null => get('slp_current_user', null);
export const logout = () => localStorage.removeItem('slp_current_user');

// Study Materials
export const getMaterials = (): StudyMaterial[] => get('slp_materials', []);
export const saveMaterial = (m: StudyMaterial) => {
  const list = getMaterials();
  list.unshift(m);
  set('slp_materials', list);
};

// Quizzes
export const getQuizzes = (): Quiz[] => get('slp_quizzes', []);
export const saveQuiz = (q: Quiz) => {
  const list = getQuizzes();
  list.push(q);
  set('slp_quizzes', list);
};
export const getPublishedQuiz = (): Quiz | undefined =>
  getQuizzes().find(q => q.published);

// Quiz Attempts
export const getAttempts = (): QuizAttempt[] => get('slp_attempts', []);
export const saveAttempt = (a: QuizAttempt) => {
  const list = getAttempts();
  list.push(a);
  set('slp_attempts', list);
};
export const getStudentAttempt = (studentId: string, quizId: string): QuizAttempt | undefined =>
  getAttempts().find(a => a.studentId === studentId && a.quizId === quizId);
export const getLeaderboard = (): QuizAttempt[] => {
  const attempts = getAttempts();
  // Best score per student
  const best: Record<string, QuizAttempt> = {};
  attempts.forEach(a => {
    if (!best[a.studentId] || a.score > best[a.studentId].score) {
      best[a.studentId] = a;
    }
  });
  return Object.values(best).sort((a, b) => b.score - a.score);
};

// Projects
export const getProjects = (): Project[] => get('slp_projects', []);
export const saveProject = (p: Project) => {
  const list = getProjects();
  list.push(p);
  set('slp_projects', list);
};
export const updateProjectStatus = (projectId: string, status: 'approved' | 'rejected') => {
  const list = getProjects();
  const idx = list.findIndex(p => p.id === projectId);
  if (idx >= 0) list[idx].status = status;
  set('slp_projects', list);
};
export const getStudentProjects = (studentId: string): Project[] =>
  getProjects().filter(p => p.studentId === studentId);

// Generate ID
export const genId = () => Math.random().toString(36).substring(2, 10);
