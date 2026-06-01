import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Plus, Pencil, Trash2, Eye, EyeOff, BookOpen, X,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Button, Badge, Modal, DataTable, type Column,
} from '../../components/shared';
import { useUIStore } from '../../store';
import {
  useCourses, useCreateCourse, useUpdateCourse,
  useTogglePublish, useDeleteCourse,
} from '../../hooks/useCourses';
import type { CourseLevel } from '../../types';

interface FormState {
  _id?:          string;
  title:         string;
  description:   string;
  level:         CourseLevel;
  category:      string;
  tags:          string;
  price:         number;
  thumbnailUrl:  string;
}

const EMPTY: FormState = {
  title: '', description: '', level: 'BEGINNER',
  category: '', tags: '', price: 0, thumbnailUrl: '',
};

const MODAL = 'admin-course-form';

export const AdminCoursesPage: React.FC = () => {
  const navigate = useNavigate();
  const { openModal, closeModal } = useUIStore();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  const { data, isLoading } = useCourses({ limit: 100 });
  const { mutate: create,        isPending: creating } = useCreateCourse();
  const { mutate: update,        isPending: updating } = useUpdateCourse();
  const { mutate: publish }                            = useTogglePublish();
  const { mutate: remove }                             = useDeleteCourse();

  const courses = (data?.data ?? []) as any[];

  const openCreate = () => { setForm(EMPTY); setErrors({}); openModal(MODAL); };
  const openEdit   = (c: any) => {
    setForm({
      _id:          c._id,
      title:        c.title,
      description:  c.description,
      level:        c.level ?? 'BEGINNER',
      category:     c.category ?? '',
      tags:         (c.tags ?? []).join(', '),
      price:        c.price ?? 0,
      thumbnailUrl: c.thumbnailUrl ?? '',
    });
    setErrors({});
    openModal(MODAL);
  };

  const validate = (): boolean => {
    const e: typeof errors = {};
    if (form.title.length < 3)       e.title = 'Tiêu đề cần ≥ 3 ký tự';
    if (form.description.length < 10) e.description = 'Mô tả cần ≥ 10 ký tự';
    if (form.price < 0)               e.price = 'Giá không thể âm';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    const payload = {
      title:        form.title,
      description:  form.description,
      level:        form.level,
      category:     form.category || undefined,
      tags:         form.tags.split(',').map((t) => t.trim()).filter(Boolean),
      price:        form.price,
      thumbnailUrl: form.thumbnailUrl || undefined,
    } as any;
    if (form._id) {
      update({ id: form._id, payload }, { onSuccess: closeModal });
    } else {
      create(payload, { onSuccess: closeModal });
    }
  };

  const handleDelete = (id: string, title: string) => {
    if (!confirm(`Xóa khóa học "${title}"?`)) return;
    remove(id);
  };

  // ── DataTable columns ──────────────────────────────────────────────────────
  const columns: Column<any>[] = [
    {
      key: 'thumb', header: '', width: 'w-12',
      accessor: (c) => c.thumbnailUrl
        ? <img src={c.thumbnailUrl} alt="" className="w-9 h-9 rounded-lg object-cover"/>
        : <div className="w-9 h-9 rounded-lg bg-violet-500/10 flex items-center justify-center">
            <BookOpen size={14} className="text-violet-400"/>
          </div>,
    },
    {
      key: 'title', header: 'Tiêu đề',
      sortValue: (c) => c.title?.toLowerCase(),
      accessor:  (c) => (
        <div>
          <p className="text-sm text-gray-200 truncate max-w-xs">{c.title}</p>
          {c.category && <p className="text-[10px] text-gray-600 mt-0.5">{c.category}</p>}
        </div>
      ),
    },
    {
      key: 'level', header: 'Level', width: 'w-28',
      sortValue: (c) => c.level,
      accessor:  (c) => <Badge color="purple">{c.level}</Badge>,
    },
    {
      key: 'lessons', header: 'Bài học', align: 'right', width: 'w-20',
      sortValue: (c) => c.totalLessons ?? 0,
      accessor:  (c) => <span className="text-gray-300">{c.totalLessons ?? 0}</span>,
    },
    {
      key: 'enrolls', header: 'Học viên', align: 'right', width: 'w-24',
      sortValue: (c) => c.totalEnrollments ?? 0,
      accessor:  (c) => <span className="text-gray-300">{c.totalEnrollments ?? 0}</span>,
    },
    {
      key: 'status', header: 'Trạng thái', width: 'w-28',
      sortValue: (c) => c.isPublished ? 1 : 0,
      accessor:  (c) => (
        <Badge color={c.isPublished ? 'green' : 'gray'}>
          {c.isPublished ? 'PUBLISHED' : 'HIDDEN'}
        </Badge>
      ),
    },
    {
      key: 'actions', header: '', align: 'right', width: 'w-36',
      accessor: (c) => (
        <div className="flex items-center gap-1 justify-end" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => publish({ id: c._id, isPublished: !c.isPublished })}
            className="p-1.5 text-gray-600 hover:text-gray-300 rounded-lg hover:bg-white/5"
            title={c.isPublished ? 'Ẩn' : 'Công khai'}
          >
            {c.isPublished ? <EyeOff size={13}/> : <Eye size={13}/>}
          </button>
          <button
            onClick={() => navigate(`/admin/courses/${c._id}/lessons`)}
            className="p-1.5 text-gray-600 hover:text-violet-400 rounded-lg hover:bg-white/5"
            title="Quản lý bài học"
          >
            <BookOpen size={13}/>
          </button>
          <button
            onClick={() => openEdit(c)}
            className="p-1.5 text-gray-600 hover:text-gray-300 rounded-lg hover:bg-white/5"
            title="Sửa"
          >
            <Pencil size={13}/>
          </button>
          <button
            onClick={() => handleDelete(c._id, c.title)}
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-mono font-bold text-2xl text-gray-100">Quản lý khóa học</h1>
          <p className="text-xs text-gray-600 font-mono mt-1">
            Tạo, chỉnh sửa, ẩn/hiện và xóa khóa học
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus size={14}/> Tạo khóa học
        </Button>
      </div>

      <DataTable
        data={courses}
        columns={columns}
        loading={isLoading}
        searchOn={(c, q) =>
          c.title?.toLowerCase().includes(q)
          || c.description?.toLowerCase().includes(q)
          || (c.tags ?? []).some((t: string) => t.toLowerCase().includes(q))
        }
        searchPlaceholder="Tìm theo tiêu đề, mô tả hoặc tag..."
        filters={{
          Level: [
            { label: 'Cơ bản',    match: (c) => c.level === 'BEGINNER' },
            { label: 'Trung cấp', match: (c) => c.level === 'INTERMEDIATE' },
            { label: 'Nâng cao',  match: (c) => c.level === 'ADVANCED' },
          ],
          Status: [
            { label: 'Đã đăng',    match: (c) =>  c.isPublished },
            { label: 'Đã ẩn',      match: (c) => !c.isPublished },
          ],
        }}
        pageSize={10}
        rowKey={(c) => c._id}
        emptyTitle="Chưa có khóa học nào"
        emptyDescription="Nhấn 'Tạo khóa học' để thêm khóa học đầu tiên."
      />

      {/* Form modal */}
      <Modal
        name={MODAL}
        title={form._id ? 'Chỉnh sửa khóa học' : 'Khóa học mới'}
        description={form._id ? 'Cập nhật nội dung khóa học' : 'Điền thông tin để tạo khóa học mới'}
        size="xl"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="md:col-span-2">
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Tiêu đề khóa học"
              className="input-field"
              autoFocus
            />
            {errors.title && <p className="text-[10px] text-rose-400 mt-1 font-mono">{errors.title}</p>}
          </div>

          <div className="md:col-span-2">
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Mô tả khóa học (markdown OK)"
              rows={4}
              className="input-field resize-none"
            />
            {errors.description && <p className="text-[10px] text-rose-400 mt-1 font-mono">{errors.description}</p>}
          </div>

          <select
            value={form.level}
            onChange={(e) => setForm({ ...form, level: e.target.value as CourseLevel })}
            className="input-field"
          >
            <option value="BEGINNER">Cơ bản</option>
            <option value="INTERMEDIATE">Trung cấp</option>
            <option value="ADVANCED">Nâng cao</option>
          </select>

          <input
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            placeholder="Danh mục (vd: concurrency)"
            className="input-field"
          />

          <input
            value={form.tags}
            onChange={(e) => setForm({ ...form, tags: e.target.value })}
            placeholder="Tags (cách nhau bằng dấu phẩy)"
            className="input-field"
          />

          <input
            type="number" min={0} value={form.price}
            onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
            placeholder="Giá (VNĐ)"
            className="input-field"
          />

          <input
            value={form.thumbnailUrl}
            onChange={(e) => setForm({ ...form, thumbnailUrl: e.target.value })}
            placeholder="Thumbnail URL (https://...)"
            className="input-field md:col-span-2"
          />
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
            {form._id ? 'Cập nhật' : 'Tạo khóa học'}
          </Button>
        </div>
      </Modal>
    </motion.div>
  );
};
