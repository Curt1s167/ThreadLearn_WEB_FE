import { calculateSelectionAnchor } from './LessonReader';

describe('calculateSelectionAnchor', () => {
  it('uses the DOM range so duplicate selected text points to the actual occurrence', () => {
    const container = document.createElement('div');
    container.innerHTML = '<p>same <strong>same</strong></p>';
    const secondOccurrence = container.querySelector('strong')!.firstChild!;
    const range = document.createRange();
    range.setStart(secondOccurrence, 0);
    range.setEnd(secondOccurrence, 4);

    expect(calculateSelectionAnchor(container, range, 'same', 10)).toEqual({
      text: 'same',
      anchorStart: 15,
      anchorEnd: 19,
    });
  });

  it('accounts for trimmed leading whitespace without shifting the source anchor', () => {
    const container = document.createElement('div');
    container.textContent = 'before   selected  ';
    const node = container.firstChild!;
    const range = document.createRange();
    range.setStart(node, 6);
    range.setEnd(node, 18);

    expect(calculateSelectionAnchor(container, range, '   selected', 0)).toEqual({
      text: 'selected',
      anchorStart: 9,
      anchorEnd: 17,
    });
  });
});
