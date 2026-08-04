'use client';

import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, Power, Save, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { coursesService, lessonsService, quizService, sectionsService } from '../../services';
import { instructorService } from '../../services/instructor.service';
import { Button, Input } from '../../components/shared';
import { ConfirmModal } from '../../components/shared/Modal';
import { cn } from '../../utils';
import { useUIStore } from '../../store';
import type { QuestionPayload, Quiz, QuizBankImport, QuizBankQuestion, QuizCreatePayload, QuizUpdatePayload } from '../../types';

type DraftQuestion = QuestionPayload & {
  id?: string;
  localId: string;
};

type QuizEditPayload = Omit<QuizUpdatePayload, 'questions'> & {
  questions: DraftQuestion[];
};

type BankQuestionDraft = Omit<QuizBankQuestion, 'id' | 'quizId' | 'status' | 'bankVersion' | 'createdAt' | 'updatedAt'>;

interface AdminQuizFormProps {
  quiz?: Quiz | null;
  onSaved: () => void;
  managementScope?: 'admin' | 'instructor';
}

interface FormErrors {
  lessonId?: string;
  title?: string;
  passingScorePercent?: string;
  timeLimitSeconds?: string;
  xpReward?: string;
  questions?: string;
  questionErrors: Record<string, string>;
}

const makeLocalId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const getQuizId = (quiz: Quiz) => quiz.id ?? quiz._id;
const getQuestionId = (question: { id?: string; _id: string }) => question.id ?? question._id;
const normalizeOptionValue = (option: string) => option.trim().replace(/\s+/g, ' ').toLowerCase();
const clampCorrectAnswerIndex = (index: number, optionCount: number) =>
  Math.min(Math.max(index, 0), Math.max(optionCount - 1, 0));

const REPLACE_LIBRARY_CONFIRM_MODAL = 'replace-question-library-confirm';
const DELETE_LIBRARY_QUESTION_CONFIRM_MODAL = 'delete-library-question-confirm';

const createBlankQuestion = (): DraftQuestion => ({
  localId: makeLocalId(),
  questionText: '',
  options: ['', ''],
  correctAnswerIndex: 0,
});

const toDraftQuestion = (question: Quiz['questions'][number]): DraftQuestion => {
  const options = question.options.length >= 2 ? [...question.options] : ['', ''];
  const questionId = getQuestionId(question);

  return {
    id: questionId,
    localId: questionId,
    questionText: question.questionText,
    options,
    correctAnswerIndex: clampCorrectAnswerIndex(question.correctAnswerIndex ?? 0, options.length),
  };
};

const cleanQuestion = (question: DraftQuestion): QuestionPayload => ({
  questionText: question.questionText.trim(),
  options: question.options.map((option) => option.trim()),
  correctAnswerIndex: clampCorrectAnswerIndex(question.correctAnswerIndex, question.options.length),
});

const createBlankBankQuestion = (): BankQuestionDraft => ({
  questionText: '',
  options: [
    { optionId: 'o1', text: '' },
    { optionId: 'o2', text: '' },
  ],
  correctOptionId: 'o1',
  explanation: '',
  difficulty: 'medium',
  tags: [],
});

const toBankQuestionDraft = (question: QuizBankQuestion): BankQuestionDraft => ({
  questionText: question.questionText,
  options: question.options.map((option) => ({ ...option })),
  correctOptionId: question.correctOptionId,
  explanation: question.explanation ?? '',
  difficulty: question.difficulty,
  tags: [...question.tags],
});

export const AdminQuizForm: React.FC<AdminQuizFormProps> = ({ quiz, onSaved, managementScope = 'admin' }) => {
  const queryClient = useQueryClient();
  const isEditing = Boolean(quiz);
  const [lessonId, setLessonId] = useState(quiz?.lessonId ?? '');
  const [courseId, setCourseId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [title, setTitle] = useState(quiz?.title ?? '');
  const [description, setDescription] = useState(quiz?.description ?? '');
  const [passingScorePercent, setPassingScorePercent] = useState(
    String(quiz?.passingScorePercent ?? quiz?.passingScore ?? 80)
  );
  const [timeLimitSeconds, setTimeLimitSeconds] = useState(
    quiz?.timeLimitSeconds ? String(quiz.timeLimitSeconds) : ''
  );
  const [xpReward, setXpReward] = useState(String(quiz?.xpReward ?? 100));
  const [questions, setQuestions] = useState<DraftQuestion[]>(
    quiz?.questions.length ? quiz.questions.map(toDraftQuestion) : [createBlankQuestion()]
  );
  const [libraryFile, setLibraryFile] = useState<File | null>(null);
  const [libraryQuestionCount, setLibraryQuestionCount] = useState('5');
  const [libraryImport, setLibraryImport] = useState<QuizBankImport | null>(null);
  const [reviewPage, setReviewPage] = useState(1);
  const [editingImportRow, setEditingImportRow] = useState<number | null>(null);
  const [importRowDraft, setImportRowDraft] = useState({ questionText: '', options: '', correctAnswer: '', difficulty: '', explanation: '', tags: '' });
  const [bankPage, setBankPage] = useState(1);
  const [editingBankQuestionId, setEditingBankQuestionId] = useState<string | null>(null);
  const [bankQuestionDraft, setBankQuestionDraft] = useState<BankQuestionDraft | null>(null);
  const [pendingDeleteQuestionId, setPendingDeleteQuestionId] = useState<string | null>(null);
  const [errors, setErrors] = useState<FormErrors>({ questionErrors: {} });
  const { openModal } = useUIStore();

  const originalQuestionIds = useMemo(
    () => new Set((quiz?.questions ?? []).map(getQuestionId)),
    [quiz]
  );

  const { data: selectableCourses = [] } = useQuery({
    queryKey: [managementScope, 'quiz-course-selector'],
    queryFn: async () => managementScope === 'instructor'
      ? instructorService.listCourses()
      : (await coursesService.list({ includeAll: true, limit: 100 })).items,
    enabled: !isEditing,
  });
  const { data: sections = [] } = useQuery({
    queryKey: ['course-sections', courseId],
    queryFn: () => sectionsService.listByCourse(courseId),
    enabled: !isEditing && Boolean(courseId),
  });
  const { data: lessons = [] } = useQuery({
    queryKey: ['course-lessons', courseId],
    queryFn: () => lessonsService.getByCourse(courseId),
    enabled: !isEditing && Boolean(courseId),
  });
  const selectableLessons = sectionId ? lessons.filter((lesson) => lesson.sectionId === sectionId) : lessons;
  const { data: pagedImport } = useQuery({
    queryKey: ['quiz-bank-import', libraryImport?.id, reviewPage],
    queryFn: () => quizService.getQuestionBankImport(libraryImport!.id, reviewPage, 20),
    enabled: Boolean(libraryImport?.id),
  });
  const activeImport = pagedImport ?? libraryImport;
  const { data: bankQuestions } = useQuery({
    queryKey: ['quiz-bank-questions', quiz?.id ?? quiz?._id, bankPage],
    queryFn: () => quizService.getQuestionBankQuestions(getQuizId(quiz!), { page: bankPage, limit: 10 }),
    enabled: Boolean(quiz),
    retry: false,
  });
  const { data: bankSummary } = useQuery({
    queryKey: ['quiz-bank-summary', quiz?.id ?? quiz?._id],
    queryFn: () => quizService.getQuestionBankSummary(getQuizId(quiz!)),
    enabled: Boolean(quiz),
    retry: false,
  });
  const usesQuestionBank = quiz?.useQuestionBank === true || Boolean(bankQuestions?.items.length);

  const createQuizMutation = useMutation({
    mutationFn: (payload: QuizCreatePayload) => quizService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-quizzes'] });
      toast.success('Quiz created');
      onSaved();
    },
    onError: () => toast.error('Failed to create quiz'),
  });

  const updateQuizMutation = useMutation({
    mutationFn: async (payload: QuizEditPayload) => {
      if (!quiz) throw new Error('Missing quiz');
      const quizId = getQuizId(quiz);

      await quizService.update(quizId, {
        title: payload.title,
        description: payload.description,
        passingScorePercent: payload.passingScorePercent,
        timeLimitSeconds: payload.timeLimitSeconds,
        xpReward: payload.xpReward,
      });

      if (usesQuestionBank) return;

      const submittedExistingIds = new Set(
        payload.questions
          .map((question) => question.id)
          .filter((id): id is string => Boolean(id))
      );
      const removedQuestionIds = [...originalQuestionIds].filter(
        (questionId) => !submittedExistingIds.has(questionId)
      );

      for (const question of payload.questions) {
        const cleaned = cleanQuestion(question);
        if (question.id) {
          await quizService.updateQuestion(quizId, question.id, cleaned);
        } else {
          await quizService.addQuestion(quizId, cleaned);
        }
      }

      for (const questionId of removedQuestionIds) {
        await quizService.deleteQuestion(quizId, questionId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-quizzes'] });
      toast.success('Quiz updated');
      onSaved();
    },
    onError: () => toast.error('Failed to update quiz'),
  });

  const uploadLibraryMutation = useMutation({
    mutationFn: async () => {
      if (!libraryFile) throw new Error('Choose a .xlsx or .docx library first.');
      if (!quiz && !lessonId) throw new Error('Choose a lesson before uploading a question library.');
      return quizService.uploadQuestionBank({
        quizId: quiz ? getQuizId(quiz) : undefined,
        lessonId: quiz ? undefined : lessonId,
        title: title.trim() || undefined,
        file: libraryFile,
        questionCount: Number(libraryQuestionCount),
        replaceExisting: usesQuestionBank,
      });
    },
    onSuccess: (result) => {
      setLibraryImport(result);
      setReviewPage(1);
      toast.success(`${result.validCount} valid questions parsed. Review then publish.`);
    },
    onError: () => toast.error('Could not parse the question library'),
  });

  const publishLibraryMutation = useMutation({
    mutationFn: async () => {
      if (!activeImport) throw new Error('No question library to publish.');
      if (activeImport.mode === 'replace' || usesQuestionBank) return quizService.replaceQuestionBankImport(activeImport.id);
      return quizService.commitQuestionBankImport(activeImport.id);
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['admin-quizzes'] });
      queryClient.invalidateQueries({ queryKey: ['quiz-bank-questions'] });
      queryClient.invalidateQueries({ queryKey: ['quiz-bank-summary'] });
      queryClient.invalidateQueries({ queryKey: ['quiz-bank-import'] });
      toast.success(`Question library published with ${result.activeQuestionCount} active questions.`);
      setLibraryImport((current) => current ? { ...current, status: 'committed' } : current);
      if (!isEditing) onSaved();
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Question library could not be published'),
  });

  const updateImportRowMutation = useMutation({
    mutationFn: async () => {
      if (!activeImport || editingImportRow === null) throw new Error('No import row selected.');
      return quizService.updateQuestionBankImportItem(activeImport.id, editingImportRow, {
        questionText: importRowDraft.questionText,
        options: importRowDraft.options.split('|').map((option) => option.trim()).filter(Boolean),
        correctAnswer: importRowDraft.correctAnswer.trim().toUpperCase(),
        difficulty: (importRowDraft.difficulty.trim().toLowerCase() || undefined) as 'easy' | 'medium' | 'hard' | undefined,
        difficultyInput: importRowDraft.difficulty.trim().toLowerCase() || undefined,
        explanation: importRowDraft.explanation.trim() || undefined,
        tags: importRowDraft.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
      });
    },
    onSuccess: () => {
      setEditingImportRow(null);
      queryClient.invalidateQueries({ queryKey: ['quiz-bank-import'] });
      toast.success('Import row updated');
    },
    onError: () => toast.error('Could not update the import row'),
  });

  const removeImportRowMutation = useMutation({
    mutationFn: async (row: number) => {
      if (!activeImport) throw new Error('No import selected.');
      return quizService.removeQuestionBankImportItem(activeImport.id, row);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quiz-bank-import'] });
      toast.success('Import row removed');
    },
    onError: () => toast.error('Could not remove the import row'),
  });

  const toggleBankQuestionMutation = useMutation({
    mutationFn: ({ questionId, status }: { questionId: string; status: 'active' | 'disabled' }) => quizService.setQuestionBankQuestionStatus(getQuizId(quiz!), questionId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quiz-bank-questions'] });
      queryClient.invalidateQueries({ queryKey: ['quiz-bank-summary'] });
      toast.success('Question status updated');
    },
    onError: () => toast.error('The library must retain enough active questions for each attempt'),
  });

  const saveBankQuestionMutation = useMutation({
    mutationFn: async () => {
      if (!quiz || !bankQuestionDraft) throw new Error('Question draft is unavailable.');
      const quizId = getQuizId(quiz);
      if (editingBankQuestionId) {
        return quizService.updateQuestionBankQuestion(quizId, editingBankQuestionId, bankQuestionDraft);
      }
      return quizService.createQuestionBankQuestion(quizId, bankQuestionDraft);
    },
    onSuccess: () => {
      setEditingBankQuestionId(null);
      setBankQuestionDraft(null);
      queryClient.invalidateQueries({ queryKey: ['quiz-bank-questions'] });
      queryClient.invalidateQueries({ queryKey: ['quiz-bank-summary'] });
      toast.success('Question library entry saved');
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Could not save question library entry'),
  });

  const deleteBankQuestionMutation = useMutation({
    mutationFn: async (questionId: string) => {
      if (!quiz) throw new Error('Quiz is unavailable.');
      return quizService.deleteQuestionBankQuestion(getQuizId(quiz), questionId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quiz-bank-questions'] });
      queryClient.invalidateQueries({ queryKey: ['quiz-bank-summary'] });
      toast.success('Question removed from library');
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'The library must retain enough active questions for each attempt'),
  });

  const startEditingImportRow = (item: QuizBankImport['items'][number]) => {
    setEditingImportRow(item.row);
    setImportRowDraft({
      questionText: item.questionText ?? '',
      options: (item.options ?? []).join(' | '),
      correctAnswer: item.correctAnswer ?? '',
      difficulty: item.difficultyInput ?? item.difficulty ?? '',
      explanation: item.explanation ?? '',
      tags: (item.tags ?? []).join(', '),
    });
  };

  const validate = () => {
    const nextErrors: FormErrors = { questionErrors: {} };
    const passingScore = Number(passingScorePercent);
    const timeLimit = timeLimitSeconds ? Number(timeLimitSeconds) : undefined;
    const reward = Number(xpReward);

    if (!lessonId.trim()) nextErrors.lessonId = 'Lesson ID is required';
    if (!title.trim()) nextErrors.title = 'Title is required';
    if (!Number.isInteger(passingScore) || passingScore < 1 || passingScore > 100) {
      nextErrors.passingScorePercent = 'Passing score must be 1-100';
    }
    if (timeLimitSeconds && (!Number.isInteger(timeLimit) || Number(timeLimit) <= 0)) {
      nextErrors.timeLimitSeconds = 'Time limit must be positive';
    }
    if (!Number.isInteger(reward) || reward <= 0) {
      nextErrors.xpReward = 'XP reward must be positive';
    }
    if (!usesQuestionBank && questions.length < 1) {
      nextErrors.questions = 'At least one question is required';
    }

    if (!usesQuestionBank) questions.forEach((question, index) => {
      const trimmedOptions = question.options.map((option) => option.trim());
      const filledOptions = trimmedOptions.filter(Boolean);

      if (!question.questionText.trim()) {
        nextErrors.questionErrors[question.localId] = `Question ${index + 1} text is required`;
        return;
      }
      if (question.options.length < 2 || question.options.length > 6 || filledOptions.length !== question.options.length) {
        nextErrors.questionErrors[question.localId] = `Question ${index + 1} must have 2-6 filled options`;
        return;
      }
      if (new Set(trimmedOptions.map(normalizeOptionValue)).size !== trimmedOptions.length) {
        nextErrors.questionErrors[question.localId] = `Question ${index + 1} options must be unique`;
        return;
      }
      if (question.correctAnswerIndex < 0 || question.correctAnswerIndex >= question.options.length) {
        nextErrors.questionErrors[question.localId] = `Question ${index + 1} correct answer is invalid`;
      }
    });

    setErrors(nextErrors);
    return Object.keys(nextErrors.questionErrors).length === 0 &&
      !nextErrors.lessonId &&
      !nextErrors.title &&
      !nextErrors.passingScorePercent &&
      !nextErrors.timeLimitSeconds &&
      !nextErrors.xpReward &&
      !nextErrors.questions;
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate()) return;

    const cleanedDescription = description.trim();
    const basePayload = {
      title: title.trim(),
      description: isEditing ? cleanedDescription : cleanedDescription || undefined,
      passingScorePercent: Number(passingScorePercent),
      timeLimitSeconds: timeLimitSeconds ? Number(timeLimitSeconds) : undefined,
      xpReward: Number(xpReward),
    };

    if (isEditing) {
      updateQuizMutation.mutate({
        ...basePayload,
        questions,
      });
      return;
    }

    createQuizMutation.mutate({
      ...basePayload,
      lessonId: lessonId.trim(),
      questions: questions.map(cleanQuestion),
    });
  };

  const updateQuestion = (localId: string, patch: Partial<DraftQuestion>) => {
    setQuestions((current) =>
      current.map((question) =>
        question.localId === localId
          ? {
              ...question,
              ...patch,
              correctAnswerIndex:
                patch.correctAnswerIndex ??
                (patch.options
                  ? clampCorrectAnswerIndex(question.correctAnswerIndex, patch.options.length)
                  : question.correctAnswerIndex),
            }
          : question
      )
    );
  };

  const updateOption = (localId: string, optionIndex: number, value: string) => {
    setQuestions((current) =>
      current.map((question) => {
        if (question.localId !== localId) return question;
        const options = [...question.options];
        options[optionIndex] = value;
        return { ...question, options };
      })
    );
  };

  const addOption = (localId: string) => {
    setQuestions((current) =>
      current.map((question) =>
        question.localId === localId && question.options.length < 6
          ? { ...question, options: [...question.options, ''] }
          : question
      )
    );
  };

  const removeOption = (localId: string, optionIndex: number) => {
    setQuestions((current) =>
      current.map((question) => {
        if (question.localId !== localId || question.options.length <= 2) return question;
        const options = question.options.filter((_, index) => index !== optionIndex);
        const correctAnswerIndex =
          question.correctAnswerIndex === optionIndex
            ? clampCorrectAnswerIndex(optionIndex, options.length)
            : clampCorrectAnswerIndex(
                question.correctAnswerIndex > optionIndex
                  ? question.correctAnswerIndex - 1
                  : question.correctAnswerIndex,
                options.length
              );
        return { ...question, options, correctAnswerIndex };
      })
    );
  };

  const updateBankDraftOption = (optionId: string, text: string) => {
    setBankQuestionDraft((current) => current
      ? { ...current, options: current.options.map((option) => option.optionId === optionId ? { ...option, text } : option) }
      : current);
  };

  const addBankDraftOption = () => {
    setBankQuestionDraft((current) => {
      if (!current || current.options.length >= 6) return current;
      const optionId = `o${current.options.length + 1}`;
      return { ...current, options: [...current.options, { optionId, text: '' }] };
    });
  };

  const removeBankDraftOption = (optionId: string) => {
    setBankQuestionDraft((current) => {
      if (!current || current.options.length <= 2) return current;
      const options = current.options.filter((option) => option.optionId !== optionId);
      return { ...current, options, correctOptionId: current.correctOptionId === optionId ? options[0].optionId : current.correctOptionId };
    });
  };

  const beginBankQuestionEdit = (question?: QuizBankQuestion) => {
    setEditingBankQuestionId(question?.id ?? null);
    setBankQuestionDraft(question ? toBankQuestionDraft(question) : createBlankBankQuestion());
  };

  const isSubmitting = createQuizMutation.isPending || updateQuizMutation.isPending;

  return (
    <>
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="grid md:grid-cols-2 gap-4">
        {isEditing ? (
          <Input label="Lesson ID" value={lessonId} disabled error={errors.lessonId} />
        ) : (
          <div className="grid gap-2">
            <label className="text-xs font-medium text-ink-muted">Course / section / lesson</label>
            <select
              className="input-field"
              value={courseId}
              onChange={(event) => { setCourseId(event.target.value); setSectionId(''); setLessonId(''); }}
            >
              <option value="">Choose a course</option>
              {selectableCourses.map((course) => <option key={course.id ?? course._id} value={course.id ?? course._id}>{course.title}</option>)}
            </select>
            <select
              className="input-field"
              value={sectionId}
              disabled={!courseId}
              onChange={(event) => { setSectionId(event.target.value); setLessonId(''); }}
            >
              <option value="">All sections / unsectioned lessons</option>
              {sections.map((section) => <option key={section.id ?? section._id} value={section.id ?? section._id}>{section.title}</option>)}
            </select>
            <select className="input-field" value={lessonId} disabled={!courseId} onChange={(event) => setLessonId(event.target.value)}>
              <option value="">Choose a lesson</option>
              {selectableLessons.map((lesson) => <option key={lesson.id ?? lesson._id} value={lesson.id ?? lesson._id}>{lesson.title}</option>)}
            </select>
            {errors.lessonId ? <p className="text-xs text-rose-600">{errors.lessonId}</p> : null}
          </div>
        )}
        <Input
          label="Title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          error={errors.title}
          placeholder="JavaScript Event Loop Quiz"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-ink-muted">Description</label>
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          className="input-field min-h-24 resize-y"
          placeholder="Short admin description"
        />
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Input
          label="Passing %"
          type="number"
          min={1}
          max={100}
          value={passingScorePercent}
          onChange={(event) => setPassingScorePercent(event.target.value)}
          error={errors.passingScorePercent}
        />
        <Input
          label="Time limit seconds"
          type="number"
          min={1}
          value={timeLimitSeconds}
          onChange={(event) => setTimeLimitSeconds(event.target.value)}
          error={errors.timeLimitSeconds}
          placeholder="300"
        />
        <Input
          label="XP reward"
          type="number"
          min={1}
          value={xpReward}
          onChange={(event) => setXpReward(event.target.value)}
          error={errors.xpReward}
        />
      </div>

      <section className="rounded-xl border border-dashed border-black/15 bg-[#f7f4ee]/60 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-ink">Question library</h3>
            <p className="mt-1 text-xs text-black/55">
              {isEditing ? 'Upload another library for this quiz.' : 'Choose a lesson above, then upload a .xlsx or .docx library. A quiz is created automatically when the library is published.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => void quizService.downloadQuestionBankTemplate()}
            className="text-xs font-medium underline underline-offset-4"
          >
            Download .xlsx template
          </button>
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-[1fr_140px_auto] md:items-end">
          <label className="block text-xs font-medium text-ink-muted">
            Library file
            <input
              type="file"
              accept=".xlsx,.docx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={(event) => {
                setLibraryFile(event.target.files?.[0] ?? null);
                setLibraryImport(null);
                setReviewPage(1);
              }}
              className="mt-1 block w-full text-xs"
            />
          </label>
          <Input
            label="Questions / attempt"
            type="number"
            min={5}
            max={10}
            value={libraryQuestionCount}
            onChange={(event) => setLibraryQuestionCount(event.target.value)}
          />
          <Button
            type="button"
            variant="outline"
            loading={uploadLibraryMutation.isPending}
            disabled={!libraryFile || (!quiz && !lessonId) || Number(libraryQuestionCount) < 5 || Number(libraryQuestionCount) > 10}
            onClick={() => uploadLibraryMutation.mutate()}
          >
            Parse & preview
          </Button>
        </div>
        {activeImport ? (
          <div className="mt-4 rounded-lg bg-white p-3 text-xs text-black/70">
            <p><span className="font-semibold text-ink">{activeImport.validCount}</span> valid · {activeImport.invalidCount} invalid · {activeImport.duplicateCount} duplicate · {activeImport.meta?.total ?? activeImport.items.length} total</p>
            <div className="mt-3 space-y-2">
              {activeImport.items.map((item) => (
                <div key={item.row} className="rounded border border-black/10 p-2">
                  {editingImportRow === item.row ? (
                    <div className="grid gap-2">
                      <input className="input-field" value={importRowDraft.questionText} onChange={(event) => setImportRowDraft((draft) => ({ ...draft, questionText: event.target.value }))} placeholder="Question" />
                      <input className="input-field" value={importRowDraft.options} onChange={(event) => setImportRowDraft((draft) => ({ ...draft, options: event.target.value }))} placeholder="Options separated by |" />
                      <div className="grid grid-cols-2 gap-2">
                        <input className="input-field" value={importRowDraft.correctAnswer} onChange={(event) => setImportRowDraft((draft) => ({ ...draft, correctAnswer: event.target.value }))} placeholder="Correct answer (A-F)" />
                        <input className="input-field" value={importRowDraft.difficulty} onChange={(event) => setImportRowDraft((draft) => ({ ...draft, difficulty: event.target.value }))} placeholder="easy / medium / hard" />
                      </div>
                      <input className="input-field" value={importRowDraft.explanation} onChange={(event) => setImportRowDraft((draft) => ({ ...draft, explanation: event.target.value }))} placeholder="Explanation (optional)" />
                      <input className="input-field" value={importRowDraft.tags} onChange={(event) => setImportRowDraft((draft) => ({ ...draft, tags: event.target.value }))} placeholder="Tags separated by commas" />
                      <div className="flex gap-2"><Button type="button" size="sm" loading={updateImportRowMutation.isPending} onClick={() => updateImportRowMutation.mutate()}>Save row</Button><Button type="button" size="sm" variant="outline" onClick={() => setEditingImportRow(null)}>Cancel</Button></div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-3">
                      <div><p className="font-medium text-ink">Row {item.row}: {item.questionText || '(empty question)'}</p><p className="mt-1">{(item.options ?? []).join(' · ')} {item.correctAnswer ? `· Correct: ${item.correctAnswer}` : ''}</p>{item.errors.length > 0 ? <p className="mt-1 text-rose-700">{item.errors.join(' ')}</p> : null}</div>
                      {activeImport.status === 'needs_review' ? <div className="flex shrink-0 gap-2"><button type="button" className="underline" onClick={() => startEditingImportRow(item)}>Edit</button><button type="button" className="text-rose-700 underline" onClick={() => removeImportRowMutation.mutate(item.row)}>Delete</button></div> : null}
                    </div>
                  )}
                </div>
              ))}
            </div>
            {(activeImport.meta?.totalPages ?? 1) > 1 ? <div className="mt-3 flex items-center justify-between"><Button type="button" size="sm" variant="outline" disabled={reviewPage <= 1} onClick={() => setReviewPage((page) => page - 1)}>Previous</Button><span>Page {reviewPage} / {activeImport.meta?.totalPages}</span><Button type="button" size="sm" variant="outline" disabled={reviewPage >= (activeImport.meta?.totalPages ?? 1)} onClick={() => setReviewPage((page) => page + 1)}>Next</Button></div> : null}
            <Button
              type="button"
              size="sm"
              className="mt-3"
              loading={publishLibraryMutation.isPending}
              disabled={activeImport.status === 'committed' || activeImport.validCount < Number(libraryQuestionCount)}
              onClick={() => {
                if (activeImport.mode === 'replace' || usesQuestionBank) {
                  openModal(REPLACE_LIBRARY_CONFIRM_MODAL);
                  return;
                }
                publishLibraryMutation.mutate();
              }}
            >
              {activeImport.status === 'committed' ? 'Published' : 'Publish question library'}
            </Button>
          </div>
        ) : null}
        {bankSummary ? (
          <div className="mt-4 grid grid-cols-2 gap-2 rounded-lg bg-white p-3 text-xs text-black/70 sm:grid-cols-4">
            <p><span className="font-semibold text-ink">{bankSummary.totalQuestionCount}</span> total</p>
            <p><span className="font-semibold text-emerald-700">{bankSummary.activeQuestionCount}</span> active</p>
            <p><span className="font-semibold text-black/60">{bankSummary.disabledQuestionCount}</span> disabled</p>
            <p><span className="font-semibold text-ink">{bankSummary.questionCount}</span> random / attempt</p>
          </div>
        ) : null}
      </section>

      {usesQuestionBank ? (
        <div className="rounded-xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-950">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-semibold">Question library is active</p>
              <p className="mt-1 text-xs leading-5 text-sky-800">
                Each attempt receives {quiz?.randomQuestionCount ?? libraryQuestionCount} random questions from the active library. These are the live Question Bank records; legacy manual questions are retained only for backward compatibility.
              </p>
            </div>
            <Button type="button" size="sm" variant="outline" onClick={() => beginBankQuestionEdit()}>
              <Plus size={13} />
              Add library question
            </Button>
          </div>

          {bankQuestionDraft ? (
            <div className="mt-4 rounded-lg border border-sky-200 bg-white p-3 text-xs text-ink">
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold">{editingBankQuestionId ? 'Edit library question' : 'Add library question'}</p>
                <button type="button" className="underline" onClick={() => { setEditingBankQuestionId(null); setBankQuestionDraft(null); }}>Cancel</button>
              </div>
              <input className="input-field mt-3" value={bankQuestionDraft.questionText} onChange={(event) => setBankQuestionDraft((current) => current ? { ...current, questionText: event.target.value } : current)} placeholder="Question text" />
              <div className="mt-3 space-y-2">
                {bankQuestionDraft.options.map((option, index) => (
                  <div key={option.optionId} className="grid grid-cols-[1fr_auto_auto] items-center gap-2">
                    <input className="input-field" value={option.text} onChange={(event) => updateBankDraftOption(option.optionId, event.target.value)} placeholder={`Option ${index + 1}`} />
                    <button type="button" onClick={() => setBankQuestionDraft((current) => current ? { ...current, correctOptionId: option.optionId } : current)} className={cn('h-10 rounded-lg border px-3 text-xs', bankQuestionDraft.correctOptionId === option.optionId ? 'border-emerald-400 bg-emerald-50 text-emerald-700' : 'border-black/10 text-black/60')}>
                      {bankQuestionDraft.correctOptionId === option.optionId ? 'Correct' : 'Mark correct'}
                    </button>
                    <button type="button" aria-label={`Remove option ${index + 1}`} onClick={() => removeBankDraftOption(option.optionId)} disabled={bankQuestionDraft.options.length <= 2} className="inline-flex size-10 items-center justify-center rounded-lg border border-black/10 disabled:opacity-40"><X size={14} /></button>
                  </div>
                ))}
              </div>
              <Button type="button" size="sm" variant="outline" className="mt-3" onClick={addBankDraftOption} disabled={bankQuestionDraft.options.length >= 6}><Plus size={13} />Add option</Button>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <select className="input-field" value={bankQuestionDraft.difficulty} onChange={(event) => setBankQuestionDraft((current) => current ? { ...current, difficulty: event.target.value as QuizBankQuestion['difficulty'] } : current)}><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option></select>
                <input className="input-field" value={bankQuestionDraft.tags.join(', ')} onChange={(event) => setBankQuestionDraft((current) => current ? { ...current, tags: event.target.value.split(',').map((tag) => tag.trim()).filter(Boolean) } : current)} placeholder="Tags, separated by commas" />
              </div>
              <textarea className="input-field mt-2 min-h-20" value={bankQuestionDraft.explanation ?? ''} onChange={(event) => setBankQuestionDraft((current) => current ? { ...current, explanation: event.target.value } : current)} placeholder="Explanation (optional)" />
              <Button type="button" className="mt-3" size="sm" loading={saveBankQuestionMutation.isPending} onClick={() => saveBankQuestionMutation.mutate()}><Save size={13} />Save library question</Button>
            </div>
          ) : null}

          <div className="mt-4 space-y-3">
            {bankQuestions?.items.map((question, index) => (
              <article key={question.id} className="rounded-lg border border-sky-200 bg-white p-3 text-xs text-ink">
                <div className="flex items-start justify-between gap-3">
                  <div><p className="font-semibold">{((bankQuestions.meta?.page ?? 1) - 1) * (bankQuestions.meta?.limit ?? 10) + index + 1}. {question.questionText}</p><p className="mt-1 text-black/55">{question.difficulty} {question.tags.length ? `· ${question.tags.join(', ')}` : ''}</p></div>
                  <span className={question.status === 'active' ? 'text-emerald-700' : 'text-black/50'}>{question.status}</span>
                </div>
                <div className="mt-3 space-y-1">
                  {question.options.map((option, optionIndex) => <p key={option.optionId} className={option.optionId === question.correctOptionId ? 'rounded bg-emerald-50 px-2 py-1 font-semibold text-emerald-800' : 'px-2 py-1'}>{String.fromCharCode(65 + optionIndex)}. {option.text}{option.optionId === question.correctOptionId ? ' — Correct answer' : ''}</p>)}
                </div>
                {question.explanation ? <p className="mt-2 rounded bg-black/[0.03] p-2 text-black/65">Explanation: {question.explanation}</p> : null}
                <div className="mt-3 flex flex-wrap gap-3">
                  <Button type="button" size="sm" variant="outline" className="gap-1.5" onClick={() => beginBankQuestionEdit(question)}><Pencil size={13} />Edit</Button>
                  <Button type="button" size="sm" variant="outline" className="gap-1.5" loading={toggleBankQuestionMutation.isPending} disabled={toggleBankQuestionMutation.isPending} onClick={() => toggleBankQuestionMutation.mutate({ questionId: question.id, status: question.status === 'active' ? 'disabled' : 'active' })}><Power size={13} />{question.status === 'active' ? 'Disable' : 'Enable'}</Button>
                  <Button type="button" size="sm" variant="outline" className="gap-1.5 border-rose-200 text-rose-700 hover:bg-rose-50" loading={deleteBankQuestionMutation.isPending} disabled={deleteBankQuestionMutation.isPending} onClick={() => { setPendingDeleteQuestionId(question.id); openModal(DELETE_LIBRARY_QUESTION_CONFIRM_MODAL); }}><Trash2 size={13} />Delete</Button>
                </div>
              </article>
            ))}
            {!bankQuestions?.items.length ? <p className="rounded-lg bg-white p-3 text-xs text-black/60">No published library questions found yet.</p> : null}
          </div>
          {(bankQuestions?.meta?.totalPages ?? 1) > 1 ? <div className="mt-4 flex items-center justify-between"><Button type="button" size="sm" variant="outline" disabled={bankPage <= 1} onClick={() => setBankPage((page) => page - 1)}>Previous</Button><span className="text-xs">Page {bankPage} / {bankQuestions?.meta?.totalPages}</span><Button type="button" size="sm" variant="outline" disabled={bankPage >= (bankQuestions?.meta?.totalPages ?? 1)} onClick={() => setBankPage((page) => page + 1)}>Next</Button></div> : null}
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-ink">Manual questions</h3>
              {errors.questions && <p className="mt-1 text-xs text-rose-600">{errors.questions}</p>}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setQuestions((current) => [...current, createBlankQuestion()])}
            >
              <Plus size={13} />
              Add question
            </Button>
          </div>

          <div className="flex flex-col gap-3">
        {questions.map((question, questionIndex) => (
          <div key={question.localId} className="rounded-xl border border-black/10 bg-[#f7f4ee]/50 p-4">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex-1">
                <p className="text-xs font-medium text-ink-muted mb-2">Question {questionIndex + 1}</p>
                <Input
                  value={question.questionText}
                  onChange={(event) => updateQuestion(question.localId, { questionText: event.target.value })}
                  placeholder="Question text"
                  error={errors.questionErrors[question.localId]}
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setQuestions((current) => current.filter((item) => item.localId !== question.localId))}
                disabled={questions.length <= 1}
              >
                <Trash2 size={13} />
                Remove
              </Button>
            </div>

            <div className="flex flex-col gap-2">
              {question.options.map((option, optionIndex) => (
                <div key={optionIndex} className="grid grid-cols-[1fr_auto_auto] gap-2 items-center">
                  <Input
                    value={option}
                    onChange={(event) => updateOption(question.localId, optionIndex, event.target.value)}
                    placeholder={`Option ${optionIndex + 1}`}
                  />
                  <button
                    type="button"
                    aria-label={`Mark option ${optionIndex + 1} as correct`}
                    onClick={() => updateQuestion(question.localId, { correctAnswerIndex: optionIndex })}
                    className={cn(
                      'h-10 px-3 rounded-lg border text-xs font-mono transition-colors outline-none focus-visible:ring-2 focus-visible:ring-black/25 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas-cream',
                      question.correctAnswerIndex === optionIndex
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                        : 'border-black/10 text-ink-muted hover:text-ink/80 hover:bg-black/[0.04]'
                    )}
                  >
                    Correct
                  </button>
                  <button
                    type="button"
                    aria-label={`Remove option ${optionIndex + 1}`}
                    onClick={() => removeOption(question.localId, optionIndex)}
                    disabled={question.options.length <= 2}
                    className="size-10 inline-flex items-center justify-center rounded-lg border border-black/10 text-ink-muted hover:text-rose-400 hover:bg-rose-500/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors outline-none focus-visible:ring-2 focus-visible:ring-black/25 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas-cream"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addOption(question.localId)}
                disabled={question.options.length >= 6}
              >
                <Plus size={13} />
                Add option
              </Button>
            </div>
          </div>
        ))}
          </div>
        </>
      )}

      <div className="flex justify-end gap-3 border-t border-black/10 pt-4">
        <Button type="submit" loading={isSubmitting}>
          <Save size={14} />
          {isEditing ? 'Save changes' : 'Create quiz'}
        </Button>
      </div>
    </form>
    <ConfirmModal
      name={REPLACE_LIBRARY_CONFIRM_MODAL}
      title="Replace question library?"
      description="The current library is replaced only after this preview is published successfully."
      confirmLabel="Replace library"
      danger
      onConfirm={() => publishLibraryMutation.mutate()}
    />
    <ConfirmModal
      name={DELETE_LIBRARY_QUESTION_CONFIRM_MODAL}
      title="Delete library question?"
      description="This removes the question from the active library. Existing student attempts remain unchanged."
      confirmLabel="Delete question"
      danger
      onConfirm={() => {
        if (pendingDeleteQuestionId) deleteBankQuestionMutation.mutate(pendingDeleteQuestionId);
        setPendingDeleteQuestionId(null);
      }}
    />
    </>
  );
};
