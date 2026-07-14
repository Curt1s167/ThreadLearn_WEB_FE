'use client';

import React, { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, BookOpen, Edit2, FileQuestion, Plus, Trash2, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { quizService } from '../../services';
import { Badge, Button, Card, EmptyState, Skeleton } from '../../components/shared';
import { ConfirmModal, Modal } from '../../components/shared/Modal';
import { useUIStore } from '../../store';
import type { Quiz } from '../../types';
import { AdminQuizForm } from './AdminQuizForm';

const QUIZ_FORM_MODAL = 'admin-quiz-form';
const DELETE_QUIZ_MODAL = 'delete-admin-quiz';

const getQuizId = (quiz: Quiz) => quiz.id ?? quiz._id;

const formatLessonId = (lessonId: string) =>
  lessonId.length > 10 ? `...${lessonId.slice(-8)}` : lessonId;

export const AdminQuizManagementPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { openModal, closeModal } = useUIStore();
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);
  const [quizToDelete, setQuizToDelete] = useState<Quiz | null>(null);

  const {
    data: quizzes,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['admin-quizzes'],
    queryFn: quizService.listAll,
  });

  useEffect(() => {
    if (isError) toast.error('Failed to load quizzes');
  }, [isError]);

  const deleteQuizMutation = useMutation({
    mutationFn: (quizId: string) => quizService.remove(quizId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-quizzes'] });
      toast.success('Quiz deleted');
      setQuizToDelete(null);
    },
    onError: () => toast.error('Failed to delete quiz'),
  });

  const openCreateForm = () => {
    setEditingQuiz(null);
    openModal(QUIZ_FORM_MODAL);
  };

  const openEditForm = (quiz: Quiz) => {
    setEditingQuiz(quiz);
    openModal(QUIZ_FORM_MODAL);
  };

  const openDeleteConfirm = (quiz: Quiz) => {
    setQuizToDelete(quiz);
    openModal(DELETE_QUIZ_MODAL);
  };

  const handleFormSaved = () => {
    closeModal();
    setEditingQuiz(null);
  };

  const quizList = quizzes ?? [];

  if (isLoading) {
    return (
      <div className="flex flex-col gap-5 animate-fade-in">
        <div className="flex items-center justify-between gap-4">
          <Skeleton className="h-12 w-64 rounded-xl" />
          <Skeleton className="h-10 w-32 rounded-lg" />
        </div>
        <Card className="p-4">
          <Skeleton className="h-9 rounded-lg" count={6} />
        </Card>
      </div>
    );
  }

  if (isError) {
    return (
      <EmptyState
        icon={<AlertCircle size={36} />}
        title="Could not load quizzes"
        description="Please try again in a moment"
        action={(
          <Button variant="outline" onClick={() => queryClient.invalidateQueries({ queryKey: ['admin-quizzes'] })}>
            Retry
          </Button>
        )}
      />
    );
  }

  return (
    <div className="flex flex-col gap-5 animate-fade-in">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="size-9 rounded-xl bg-brand-lime/40 border border-black/10 flex items-center justify-center shrink-0">
            <FileQuestion size={18} className="text-ink-muted" />
          </div>
          <div className="min-w-0">
            <h1 className="font-mono font-bold text-2xl text-ink text-balance">Quiz Management</h1>
            <p className="text-ink-faint font-mono text-sm text-pretty">
              {quizList.length} admin quizzes configured
            </p>
          </div>
        </div>
        <Button onClick={openCreateForm}>
          <Plus size={14} />
          New quiz
        </Button>
      </div>

      {quizList.length === 0 ? (
        <Card className="p-6">
          <EmptyState
            icon={<FileQuestion size={36} />}
            title="No quizzes found"
            description="Create the first quiz for a lesson"
            action={(
              <Button onClick={openCreateForm}>
                <Plus size={14} />
                New quiz
              </Button>
            )}
          />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-black/10">
                  {['Title', 'Lesson', 'Passing', 'XP', 'Questions', 'Actions'].map((heading) => (
                    <th key={heading} className="text-left text-xs text-ink-faint font-mono px-4 py-3">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {quizList.map((quiz) => {
                  const quizId = getQuizId(quiz);
                  const passingScore = quiz.passingScorePercent ?? quiz.passingScore;

                  return (
                    <tr key={quizId} className="border-b border-white/[0.03] hover:bg-black/[0.03] transition-colors">
                      <td className="px-4 py-3 min-w-56">
                        <p className="text-sm text-ink font-mono font-medium truncate max-w-xs">{quiz.title}</p>
                        {quiz.description && (
                          <p className="text-xs text-ink-faint font-mono mt-1 line-clamp-1">{quiz.description}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 text-xs text-ink-muted font-mono">
                          <BookOpen size={12} />
                          {formatLessonId(quiz.lessonId)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge color={passingScore >= 70 ? 'green' : 'amber'}>
                          {passingScore}%
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 text-xs text-amber-400 font-mono tabular-nums">
                          <Zap size={12} />
                          {quiz.xpReward}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-ink-muted font-mono tabular-nums">
                          {quiz.questions.length}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => openEditForm(quiz)}>
                            <Edit2 size={13} />
                            Edit
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => openDeleteConfirm(quiz)}
                            loading={deleteQuizMutation.isPending && quizToDelete ? getQuizId(quizToDelete) === quizId : false}
                          >
                            <Trash2 size={13} />
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Modal
        name={QUIZ_FORM_MODAL}
        title={editingQuiz ? 'Edit quiz' : 'Create quiz'}
        description={editingQuiz ? 'Update quiz settings and questions' : 'Create a quiz linked to a lesson'}
        size="xl"
        onClose={() => setEditingQuiz(null)}
      >
        <AdminQuizForm quiz={editingQuiz} onSaved={handleFormSaved} />
      </Modal>

      <ConfirmModal
        name={DELETE_QUIZ_MODAL}
        title="Delete quiz"
        description={quizToDelete ? `Delete "${quizToDelete.title}"? This action cannot be undone.` : 'Delete this quiz?'}
        confirmLabel="Delete"
        danger
        onConfirm={() => {
          if (!quizToDelete) return;
          deleteQuizMutation.mutate(getQuizId(quizToDelete));
        }}
      />
    </div>
  );
};
