import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Pencil, Trash2, Lock, Unlock, ArrowLeft, X } from 'lucide-react';
import {
  Button, Badge, Modal, DataTable, type Column,
} from '../../components/shared';
import { useUIStore } from '../../store';
import {
  useLessonsByCourse, useCreateLesson, useUpdateLesson,
  useToggleLessonLock, useDeleteLesson, useCourseDetail,
} from '../../hooks/useCourses';

interface FormState {
  _id?:            string;
  title:           string;
  content:         string;
  videoUrl:        string;
  attachmentUrl:   string;
  durationMinutes: number;
  isFreePreview:   boolean;
}
const EMPTY: FormState = {
  title: '', content: '', videoUrl: '',
  attachmentUrl: '', durationMinutes: 0, isFreePreview: false,
};
const MODAL = 'admin-lesson-form';

export const AdminLessonsPage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate     = useNavigate();
  const { openModal, closeModal } = useUIStore();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  const { data: courseResp }              = useCourseDetail(courseId ?? '');
  const { data: lessonsResp, isLoading }  = useLessonsByCourse(courseId ?? '');
  const lessons = (lessonsResp?.data ?? []) as any[];
  const course  = courseResp?.data?.course;

  const { mutate: create,      isPending: creating } = useCreateLesson();
  const { mutate: update,      isPending: updating } = useUpdateLesson();
  const { mutate: toggleLock }                       = useToggleLessonLock();
  const { mutate: remove }                           = useDeleteLesson();

  const openCreate = () => { setForm(EMPTY); setErrors({}); openModal(MODAL); };
  const openEdit   = (l: any) => {
    setForm({
      _id:             l._id,
      title:           l.title,
      content:         l.content,
      videoUrl:        l.videoUrl ?? '',
      attachmentUrl:   l.attachmentUrl ?? '',
      durationMinutes: l.durationMinutes ?? 0,
      isFreePreview:   l.isFreePreview ?? false,
    });
    setErrors({});
    openModal(MODAL);
  };

  const validate = (): boolean => {
    const e: typeof errors = {};
    if (form.title.length < 3) e.title = 'Tiêu đề cần ≥ 3 ký tự';
    if (form.content.length < 1) e.content = 'Nội dung không thể trống';
    if (form.durationMinutes < 0) e.durationMinutes = 'Thời lượng không thể âm';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate() || !courseId) return;
    const payload = {
      title:           form.title,
      content:         form.content,
      videoUrl:        form.videoUrl || undefined,
      attachmentUrl:   form.attachmentUrl || undefined,
      durationMinutes: form.durationMinutes,
      isFreePreview:   form.isFreePreview,
    };
    if (form._id) {
      update({ id: form._id, payload }, { onSuccess: closeModal });
    } else {
      create({ ...payload, courseId }, { onSuccess: closeModal });
    }
  };

  const handleDelete = (id: string, title: string) => {
    if (!confirm(`Xóa bài học "${title}"?`)) return;
    remove(id);
  };

  const columns: Column<any>[] = [
    {
      key: 'order', header: '#', width: 'w-12', align: 'center',
      sortValue: (l) => l.order,
      accessor:  (l) => <span className="text-gray-600">{l.order + 1}</span>,
    },
    {
      key: 'title', header: 'Tiêu đề',
      sortValue: (l) => l.title?.toLowerCase(),
      accessor:  (l) => (
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-200">{l.title}</span>
          {l.isFreePreview && <Badge color="green">Free</Badge>}
          {l.isLocked && <Badge color="amber">Locked</Badge>}
        </div>
      ),
    },
    {
      key: 'duration', header: 'Thời lượng', width: 'w-28', align: 'right',
      sortValue: (l) => l.durationMinutes ?? 0,
      accessor:  (l) => <span className="text-gray-400">{l.durationMinutes ?? 0} phút</span>,
    },
    {
      key: 'actions', header: '', align: 'right', width: 'w-32',
      accessor: (l) => (
        <div className="flex items-center gap-1 justify-end" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => toggleLock({ id: l._id, isLocked: !l.isLocked })}
            className="p-1.5 text-gray-600 hover:text-gray-300 rounded-lg hover:bg-white/5"
            title={l.isLocked ? 'Mở khóa' : 'Khóa'}
          >
            {l.isLocked ? <Unlock size={13}/> : <Lock size={13}/>}
          </button>
          <button
            onClick={() => openEdit(l)}
            className="p-1.5 text-gray-600 hover:text-gray-300 rounded-lg hover:bg-white/5"
            title="Sửa"
          >
            <Pencil size={13}/>
          </button>
          <button
            onClick={() => handleDelete(l._id, l.title)}
            className="p-1.5 text-gray-600 hover:text-rose-400 rounded-lg hover:bg-white/5"
            title="Xóa"
          >
            <Trash2 size={13}/>
          </button>
        </div>
      ),
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="flex flex-col gap-5"
    >
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/admin/courses')} className="btn-ghost">
          <ArrowLeft size={14}/>
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="font-mono font-bold text-2xl text-gray-100 truncate">
            Bài học · {course?.title ?? '...'}
          </h1>
          <p className="text-xs text-gray-600 font-mono mt-0.5">
            {lessons.length} bài học trong khóa này
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus size={14}/> Thêm bài
        </Button>
      </div>

      <DataTable
        data={lessons}
        columns={columns}
        loading={isLoading}
        searchOn={(l, q) => l.title?.toLowerCase().includes(q)}
        searchPlaceholder="Tìm bài học..."
        filters={{
          Visibility: [
            { label: 'Free preview', match: (l) =>  l.isFreePreview },
            { label: 'Đang khóa',    match: (l) =>  l.isLocked },
            { label: 'Đang mở',      match: (l) => !l.isLocked },
          ],
        }}
        pageSize={15}
        rowKey={(l) => l._id}
        emptyTitle="Chưa có bài học"
        emptyDescription="Thêm bài học đầu tiên để học viên có thể bắt đầu."
      />

      <Modal
        name={MODAL}
        title={form._id ? 'Chỉnh sửa bài học' : 'Bài học mới'}
        description={form._id ? 'Cập nhật nội dung bài học' : 'Bài học sẽ được thêm vào cuối danh sách'}
        size="xl"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="md:col-span-2">
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Tiêu đề bài học"
              className="input-field"
              autoFocus
            />
            {errors.title && <p className="text-[10px] text-rose-400 mt-1 font-mono">{errors.title}</p>}
          </div>

          <div className="md:col-span-2">
            <textarea
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              placeholder="Nội dung markdown..."
              rows={8}
              className="input-field resize-y font-mono text-xs"
            />
            {errors.content && <p className="text-[10px] text-rose-400 mt-1 font-mono">{errors.content}</p>}
          </div>

          <input
            value={form.videoUrl}
            onChange={(e) => setForm({ ...form, videoUrl: e.target.value })}
            placeholder="Video URL (YouTube/Vimeo embed)"
            className="input-field"
          />
          <input
            value={form.attachmentUrl}
            onChange={(e) => setForm({ ...form, attachmentUrl: e.target.value })}
            placeholder="Attachment URL"
            className="input-field"
          />
          <input
            type="number" min={0} value={form.durationMinutes}
            onChange={(e) => setForm({ ...form, durationMinutes: Number(e.target.value) })}
            placeholder="Thời lượng (phút)"
            className="input-field"
          />
          <label className="flex items-center gap-2 text-xs font-mono text-gray-400 px-1">
            <input
              type="checkbox"
              checked={form.isFreePreview}
              onChange={(e) => setForm({ ...form, isFreePreview: e.target.checked })}
              className="accent-violet-500"
            />
            Cho phép Guest xem (free preview)
          </label>
        </div>

        <div className="flex justify-end gap-2 mt-5">
          <Button variant="ghost" onClick={closeModal}>
            <X size={13}/> Hủy
          </Button>
          <Button
            onClick={handleSubmit}
            loading={creating || updating}
            disabled={creating || updating}
          >
            {form._id ? 'Cập nhật' : 'Tạo bài học'}
          </Button>
        </div>
      </Modal>
    </motion.div>
  );
};
