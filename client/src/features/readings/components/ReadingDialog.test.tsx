import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/lib/api';
import * as readingsApi from '../readingsApi';
import type { Reading } from '../types';
import { ReadingDialog } from './ReadingDialog';
import type { ReadingEditor } from './readingEditor';

vi.mock('../readingsApi');

const DEFAULT_DATE = '2026-10-15';
const RANGE_MESSAGE = 'Value must be between 40 and 600 mg/dl.';
const addEditor: ReadingEditor = { mode: 'add', slot: 'after_lunch' };
const existing: Reading = {
  id: 'reading-1',
  date: '2026-01-15',
  slot: 'after_lunch',
  slotLabel: 'After lunch',
  value: 150,
  createdAt: '',
  updatedAt: '',
};

function renderDialog(editor: ReadingEditor = addEditor) {
  const onClose = vi.fn();
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <ReadingDialog editor={editor} defaultDate={DEFAULT_DATE} onClose={onClose} />
    </QueryClientProvider>,
  );
  return onClose;
}

const valueInput = () => screen.getByLabelText('Glucose value (mg/dl)');
const saveButton = (name = 'Save reading') => screen.getByRole('button', { name });

async function submitValue(value: string) {
  await userEvent.type(valueInput(), value);
  await userEvent.click(saveButton());
}

describe('ReadingDialog', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(readingsApi.createReading).mockResolvedValue(existing);
    vi.mocked(readingsApi.updateReading).mockResolvedValue(existing);
  });

  it('shows the required message and focuses the value input on an empty submit', async () => {
    renderDialog();

    await userEvent.click(saveButton());

    expect(await screen.findByText('Please enter a glucose value.')).toBeInTheDocument();
    await waitFor(() => expect(valueInput()).toHaveFocus());
    expect(readingsApi.createReading).not.toHaveBeenCalled();
  });

  it.each(['39', '601', '120.5', 'abc'])('rejects the value "%s"', async (value) => {
    renderDialog();

    await submitValue(value);

    expect(await screen.findByText(RANGE_MESSAGE)).toBeInTheDocument();
    expect(valueInput()).toHaveAttribute('aria-invalid', 'true');
    expect(readingsApi.createReading).not.toHaveBeenCalled();
  });

  it.each([40, 600])('accepts the boundary value %i', async (value) => {
    renderDialog();

    await submitValue(String(value));

    await waitFor(() =>
      expect(readingsApi.createReading).toHaveBeenCalledWith({
        date: DEFAULT_DATE,
        slot: 'after_lunch',
        value,
      }),
    );
  });

  it('creates the reading and closes the dialog on a valid submit', async () => {
    const onClose = renderDialog();

    await submitValue('132');

    await waitFor(() => expect(onClose).toHaveBeenCalledOnce());
    expect(readingsApi.createReading).toHaveBeenCalledWith({
      date: DEFAULT_DATE,
      slot: 'after_lunch',
      value: 132,
    });
  });

  it('prefills edit mode and updates the reading by id', async () => {
    const onClose = renderDialog({ mode: 'edit', reading: existing });

    expect(screen.getByRole('heading', { name: 'Edit reading' })).toBeInTheDocument();
    expect(valueInput()).toHaveValue('150');
    expect(screen.getByRole('button', { name: 'Date' })).toHaveTextContent('Thu, 15 Jan 2026');
    expect(screen.getByRole('combobox', { name: 'Time slot' })).toHaveTextContent('After lunch');

    await userEvent.clear(valueInput());
    await userEvent.type(valueInput(), '161');
    await userEvent.click(saveButton('Save changes'));

    await waitFor(() => expect(onClose).toHaveBeenCalledOnce());
    expect(readingsApi.updateReading).toHaveBeenCalledWith('reading-1', {
      date: '2026-01-15',
      slot: 'after_lunch',
      value: 161,
    });
    expect(readingsApi.createReading).not.toHaveBeenCalled();
  });

  it('shows a slot conflict on the slot field and keeps the dialog open', async () => {
    const message = 'You already have an After lunch reading for this date.';
    vi.mocked(readingsApi.createReading).mockRejectedValue(
      new ApiError(message, 409, { slot: message }),
    );
    const onClose = renderDialog();

    await submitValue('120');

    expect(await screen.findByText(message)).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Time slot' })).toHaveAttribute(
      'aria-invalid',
      'true',
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('shows an error that is not tied to a field as an alert at the top of the dialog', async () => {
    const message = 'You can add only 4 readings per day.';
    vi.mocked(readingsApi.createReading).mockRejectedValue(new ApiError(message, 409));
    const onClose = renderDialog();

    await submitValue('120');

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(message);
    expect(
      alert.compareDocumentPosition(within(screen.getByRole('dialog')).getByText('Date')) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('disables the submit button and shows a spinner while saving', async () => {
    vi.mocked(readingsApi.createReading).mockReturnValue(new Promise(() => undefined));
    renderDialog();

    await submitValue('120');

    await waitFor(() => expect(saveButton()).toBeDisabled());
    expect(saveButton().querySelector('svg.animate-spin')).not.toBeNull();
  });
});
