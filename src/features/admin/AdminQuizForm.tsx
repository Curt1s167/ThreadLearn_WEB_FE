'use client';

import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Save, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { coursesService, lessonsService, quizService, sectionsService } from '../../services';
import { Button, Input } from '../../components/shared';
import { cn } from '../../utils';
import type { QuestionPayload, Quiz, QuizBankImport, QuizCreatePayload, QuizUpdatePayload } from '../../types';

type DraftQuestion = QuestionPayload & {
  id?: string;
  localId: string;
};

type QuizEditPayload = Omit<QuizUpdatePayload, 'questions'> & {
  questions: DraftQuestion[];
};

interface AdminQuizFormProps {
  quiz?: Quiz | null;
  onSaved: () => void;
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

export const AdminQuizForm: React.FC<AdminQuizFormProps> = ({ quiz, onSaved }) => {
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
  const [errors, setErrors] = useState<FormErrors>({ questionErrors: {} });

  const originalQuestionIds = useMemo(
    () => new Set((quiz?.questions ?? []).map(getQuestionId)),
    [quiz]
  );

  const { data: coursesPage } = useQuery({
    queryKey: ['admin-courses', 'quiz-selector'],
    queryFn: () => coursesService.list({ includeAll: true, limit: 100 }),
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
      if (!quiz || !libraryFile) throw new Error('Choose a .xlsx or .docx library first.');
      return quizService.uploadQuestionBank({
        quizId: getQuizId(quiz),
        file: libraryFile,
        questionCount: Number(libraryQuestionCount),
      });
    },
    onSuccess: (result) => {
      setLibraryImport(result);
      toast.success(`${result.validCount} valid questions parsed. Review then publish.`);
    },
    onError: () => toast.error('Could not parse the question library'),
  });

  const publishLibraryMutation = useMutation({
    mutationFn: async () => {
      if (!libraryImport) throw new Error('No question library to publish.');
      return quizService.commitQuestionBankImport(libraryImport.id);
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['admin-quizzes'] });
      toast.success(`Question library published with ${result.activeQuestionCount} active questions.`);
      setLibraryImport((current) => current ? { ...current, status: 'committed' } : current);
    },
    onError: () => toast.error('Question library could not be published'),
  });

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
    if (questions.length < 1) {
      nextErrors.questions = 'At least one question is required';
    }

    questions.forEach((question, index) => {
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

  const isSubmitting = createQuizMutation.isPending || updateQuizMutation.isPending;

  return (
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
              {(coursesPage?.items ?? []).map((course) => <option key={course.id ?? course._id} value={course.id ?? course._id}>{course.title}</option>)}
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

      {isEditing ? (
        <section className="rounded-xl border border-dashed border-black/15 bg-[#f7f4ee]/60 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-ink">Question library</h3>
              <p className="mt-1 text-xs text-black/55">Upload a structured .xlsx or .docx file. The library is only used after you review and publish it.</p>
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
              disabled={!libraryFile || Number(libraryQuestionCount) < 5 || Number(libraryQuestionCount) > 10}
              onClick={() => uploadLibraryMutation.mutate()}
            >
              Parse & preview
            </Button>
          </div>
          {libraryImport ? (
            <div className="mt-4 rounded-lg bg-white p-3 text-xs text-black/70">
              <p><span className="font-semibold text-ink">{libraryImport.validCount}</span> valid · {libraryImport.invalidCount} invalid · {libraryImport.items.length} total</p>
              {libraryImport.invalidCount > 0 ? (
                <ul className="mt-2 list-disc space-y-1 pl-4 text-rose-700">
                  {libraryImport.items.filter((item) => item.errors.length > 0).slice(0, 3).map((item) => (
                    <li key={item.row}>Row {item.row}: {item.errors.join(' ')}</li>
                  ))}
                </ul>
              ) : null}
              <Button
                type="button"
                size="sm"
                className="mt-3"
                loading={publishLibraryMutation.isPending}
                disabled={libraryImport.status === 'committed' || libraryImport.validCount < Number(libraryQuestionCount)}
                onClick={() => publishLibraryMutation.mutate()}
              >
                {libraryImport.status === 'committed' ? 'Published' : 'Publish question library'}
              </Button>
            </div>
          ) : null}
        </section>
      ) : null}

      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-ink">Questions</h3>
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

      <div className="flex flex-col gap-3 max-h-[50dvh] overflow-y-auto pr-1">
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

      <div className="flex justify-end gap-3 border-t border-black/10 pt-4">
        <Button type="submit" loading={isSubmitting}>
          <Save size={14} />
          {isEditing ? 'Save changes' : 'Create quiz'}
        </Button>
      </div>
    </form>
  );
};
