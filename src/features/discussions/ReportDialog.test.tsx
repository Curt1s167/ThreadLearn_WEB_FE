import { fireEvent, render, screen } from '@testing-library/react';
import { ReportDialog } from './ContextualDiscussionRoom';

describe('ReportDialog accessibility', () => {
  it('uses a labelled modal, submits structured data, and closes on Escape', () => {
    const onClose = vi.fn();
    const onSubmit = vi.fn();
    render(<ReportDialog open pending={false} onClose={onClose} onSubmit={onSubmit} />);

    expect(screen.getByRole('dialog', { name: 'Báo cáo nội dung' })).toHaveAttribute('aria-modal', 'true');
    fireEvent.change(screen.getByLabelText('Lý do'), { target: { value: 'UNSAFE_CODE' } });
    fireEvent.change(screen.getByLabelText(/Chi tiết/), { target: { value: '  suspicious process call  ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Gửi báo cáo' }));
    expect(onSubmit).toHaveBeenCalledWith({ reason: 'UNSAFE_CODE', details: 'suspicious process call' });

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });

  it('keeps Tab focus inside the dialog', () => {
    render(<ReportDialog open pending={false} onClose={vi.fn()} onSubmit={vi.fn()} />);
    const buttons = screen.getAllByRole('button');
    const last = buttons[buttons.length - 1];
    last.focus();
    fireEvent.keyDown(window, { key: 'Tab' });
    expect(document.activeElement).toBe(screen.getByLabelText('Lý do'));
  });
});
