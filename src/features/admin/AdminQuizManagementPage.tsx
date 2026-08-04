'use client';

import React, { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, BookOpen, Edit2, FileQuestion, Plus, Trash2, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { quizService } from '../../services';
import { Button, EmptyState, Skeleton } from '../../components/shared';
import { ConfirmModal, Modal } from '../../components/shared/Modal';
import { useUIStore } from '../../store';
import type { Quiz } from '../../types';
import { AdminQuizForm } from './AdminQuizForm';
import {
  DemoDisplayTitle,
  DemoHeroWhite,
  DemoMuted,
  DemoPageRoot,
  DemoPill,
  DemoWhitePanel,
} from '../ui-reskin/demo-ui';

const QUIZ_FORM_MODAL = 'admin-quiz-form';
const DELETE_QUIZ_MODAL = 'delete-admin-quiz';

const getQuizId = (quiz: Quiz) => quiz.id ?? quiz._id;

const formatLessonId = (lessonId: string) =>
  lessonId.length > 10 ? `…${lessonId.slice(-8)}` : lessonId;

/**
 * PR8 — admin quiz list visual polish.
 * LOGIC LOCK: listAll, remove, modal form create/edit.
 */
export const AdminQuizManagementPage: React.FC<{ managementScope?: 'admin' | 'instructor' }> = ({ managementScope = 'admin' }) => {
  const queryClient = useQueryClient();
  const { openModal, closeModal } = useUIStore();
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);
  const [quizToDelete, setQuizToDelete] = useState<Quiz | null>(null);

  const {
    data: quizzes,
    isLoading,
    isError,
  } = useQuery({
    queryKey: [managementScope, 'quizzes'],
    queryFn: quizService.listAll,
  });

  useEffect(() => {
    if (isError) toast.error('Failed to load quizzes');
  }, [isError]);

  const deleteQuizMutation = useMutation({
    mutationFn: (quizId: string) => quizService.remove(quizId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [managementScope, 'quizzes'] });
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
      <DemoPageRoot>
        <Skeleton className="h-36 rounded-lg" />
        <Skeleton className="h-64 rounded-lg" />
      </DemoPageRoot>
    );
  }

  if (isError) {
    return (
      <EmptyState
        icon={<AlertCircle size={36} />}
        title="Could not load quizzes"
        description="Please try again in a moment"
        action={(
          <Button
            variant="outline"
            onClick={() => queryClient.invalidateQueries({ queryKey: [managementScope, 'quizzes'] })}
          >
            Retry
          </Button>
        )}
      />
    );
  }

  return (
    <DemoPageRoot>
      <DemoHeroWhite>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <DemoPill tone="blue">Admin · UC36–39</DemoPill>
              <FileQuestion size={18} className="text-black/45" />
            </div>
            <DemoDisplayTitle>Quiz management</DemoDisplayTitle>
            <DemoMuted>
              {quizList.length} quiz{quizList.length === 1 ? '' : 'zes'} configured. Create, edit
              questions, or delete via admin quiz APIs.
            </DemoMuted>
          </div>
          <button
            type="button"
            onClick={openCreateForm}
            className="inline-flex items-center gap-2 rounded-full bg-black px-5 py-2.5 text-sm font-medium text-white hover:bg-black/90"
          >
            <Plus size={14} />
            New quiz
          </button>
        </div>
      </DemoHeroWhite>

      {quizList.length === 0 ? (
        <DemoWhitePanel className="p-8">
          <EmptyState
            icon={<FileQuestion size={36} />}
            title="No quizzes found"
            description="Create the first quiz for a lesson"
            action={(
              <button
                type="button"
                onClick={openCreateForm}
                className="inline-flex items-center gap-2 rounded-full bg-black px-4 py-2 text-sm font-medium text-white"
              >
                <Plus size={14} />
                New quiz
              </button>
            )}
          />
        </DemoWhitePanel>
      ) : (
        <DemoWhitePanel>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px]">
              <thead>
                <tr className="border-b border-black/10 bg-[#f7f4ee]/80">
                  {['Title', 'Lesson', 'Passing', 'XP', 'Questions', 'Actions'].map((heading) => (
                    <th
                      key={heading}
                      className="px-4 py-3 text-left text-xs font-medium uppercase tracking-[0.12em] text-black/45"
                    >
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
                    <tr
                      key={quizId}
                      className="border-b border-black/10 last:border-b-0 hover:bg-black/[0.02] transition-colors"
                    >
                      <td className="px-4 py-3 min-w-56">
                        <p className="truncate text-sm font-medium text-ink max-w-xs">{quiz.title}</p>
                        {quiz.description ? (
                          <p className="mt-0.5 line-clamp-1 text-xs text-black/50">{quiz.description}</p>
                        ) : null}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 text-xs text-black/60">
                          <BookOpen size={12} />
                          {formatLessonId(quiz.lessonId)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            (passingScore ?? 0) >= 70
                              ? 'bg-[#d9f99d] text-black'
                              : 'bg-[#fde68a] text-black'
                          }`}
                        >
                          {passingScore}%
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 text-xs tabular-nums text-black/70">
                          <Zap size={12} />
                          {quiz.xpReward}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm tabular-nums text-black/70">
                        {quiz.useQuestionBank
                          ? `${quiz.randomQuestionCount ?? 5} random`
                          : quiz.questions.length}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openEditForm(quiz)}
                            className="inline-flex items-center gap-1.5 rounded-full border border-black/10 px-3 py-1.5 text-xs font-medium text-ink hover:bg-black/[0.03]"
                          >
                            <Edit2 size={12} />
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => openDeleteConfirm(quiz)}
                            disabled={
                              deleteQuizMutation.isPending &&
                              quizToDelete != null &&
                              getQuizId(quizToDelete) === quizId
                            }
                            className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-100 disabled:opacity-50"
                          >
                            <Trash2 size={12} />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </DemoWhitePanel>
      )}

      <Modal
        name={QUIZ_FORM_MODAL}
        title={editingQuiz ? 'Edit quiz' : 'Create quiz'}
        description={
          editingQuiz
            ? 'Update quiz settings and questions'
            : 'Create a quiz linked to a lesson'
        }
        size="xl"
        onClose={() => setEditingQuiz(null)}
      >
        <AdminQuizForm quiz={editingQuiz} onSaved={handleFormSaved} managementScope={managementScope} />
      </Modal>

      <ConfirmModal
        name={DELETE_QUIZ_MODAL}
        title="Delete quiz"
        description={
          quizToDelete
            ? `Delete "${quizToDelete.title}"? This action cannot be undone.`
            : 'Delete this quiz?'
        }
        confirmLabel="Delete"
        danger
        onConfirm={() => {
          if (!quizToDelete) return;
          deleteQuizMutation.mutate(getQuizId(quizToDelete));
        }}
      />
    </DemoPageRoot>
  );
};
