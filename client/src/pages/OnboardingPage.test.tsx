import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import * as authApi from '@/features/auth/authApi';
import { ApiError } from '@/lib/api';
import { OnboardingPage } from './OnboardingPage';

vi.mock('@/features/auth/authApi');

const TODAY = new Date('2026-11-21T06:00:00Z');
const CREATED_USER = {
  id: '1',
  name: 'Asha Rao',
  email: 'asha@example.com',
  role: 'patient' as const,
  dateOfBirth: '1990-05-15',
};

function renderOnboarding() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/signup']}>
        <Routes>
          <Route path="/signup" element={<OnboardingPage />} />
          <Route path="/" element={<p>Dashboard page</p>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

async function completeAccountStep() {
  await userEvent.type(await screen.findByLabelText('Name'), 'Asha Rao');
  await userEvent.type(screen.getByLabelText('Email'), 'Asha@Example.com');
  await userEvent.type(screen.getByLabelText('Password'), 'sweet1234');
  await userEvent.click(screen.getByRole('button', { name: 'Continue' }));
  await screen.findByRole('heading', { name: 'A little about you' });
}

const dateOfBirthInput = () => screen.getByLabelText('Date of birth');
const setDateOfBirth = (value: string) =>
  fireEvent.change(dateOfBirthInput(), { target: { value } });
const ageText = () => document.querySelector('[aria-live="polite"]')?.textContent;
const createAccount = () =>
  userEvent.click(screen.getByRole('button', { name: 'Create my account' }));

describe('onboarding', () => {
  beforeAll(() => {
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: query.includes('reduce'),
      media: query,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      addListener: () => undefined,
      removeListener: () => undefined,
    }));
  });

  beforeEach(() => {
    vi.resetAllMocks();
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(TODAY);
    vi.mocked(authApi.getMe).mockResolvedValue(null);
    vi.mocked(authApi.register).mockResolvedValue(CREATED_USER);
  });

  afterEach(() => {
    vi.useRealTimers();
    localStorage.clear();
    sessionStorage.clear();
  });

  describe('step 1: create your account', () => {
    it('shows the progress and blocks Next with inline errors when fields are invalid', async () => {
      renderOnboarding();

      await userEvent.click(await screen.findByRole('button', { name: 'Continue' }));

      expect(await screen.findByText('Name must be at least 2 characters')).toBeInTheDocument();
      expect(screen.getByText('Enter a valid email address')).toBeInTheDocument();
      expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Create your account' })).toBeInTheDocument();
      expect(screen.getByText(/Step 1 of 2/)).toBeInTheDocument();
      expect(screen.getByLabelText('Name')).toHaveAttribute('aria-invalid', 'true');
      expect(authApi.register).not.toHaveBeenCalled();
    });

    it('uses the right autocomplete attributes', async () => {
      renderOnboarding();

      expect(await screen.findByLabelText('Name')).toHaveAttribute('autocomplete', 'name');
      expect(screen.getByLabelText('Email')).toHaveAttribute('autocomplete', 'email');
      expect(screen.getByLabelText('Password')).toHaveAttribute('autocomplete', 'new-password');
    });

    it('advances with Enter', async () => {
      renderOnboarding();
      await userEvent.type(await screen.findByLabelText('Name'), 'Asha Rao');
      await userEvent.type(screen.getByLabelText('Email'), 'asha@example.com');
      await userEvent.type(screen.getByLabelText('Password'), 'sweet1234{Enter}');

      expect(
        await screen.findByRole('heading', { name: 'A little about you' }),
      ).toBeInTheDocument();
      expect(authApi.register).not.toHaveBeenCalled();
    });
  });

  describe('step 2: about you', () => {
    it('moves focus to the step heading', async () => {
      renderOnboarding();
      await completeAccountStep();

      await waitFor(() =>
        expect(screen.getByRole('heading', { name: 'A little about you' })).toHaveFocus(),
      );
    });

    it('keeps what was typed when going Back and forward again', async () => {
      renderOnboarding();
      await completeAccountStep();
      setDateOfBirth('1990-05-15');

      await userEvent.click(screen.getByRole('button', { name: 'Back' }));

      expect(
        await screen.findByRole('heading', { name: 'Create your account' }),
      ).toBeInTheDocument();
      expect(screen.getByLabelText('Name')).toHaveValue('Asha Rao');
      expect(screen.getByLabelText('Email')).toHaveValue('Asha@Example.com');
      expect(screen.getByLabelText('Password')).toHaveValue('sweet1234');

      await userEvent.click(screen.getByRole('button', { name: 'Continue' }));
      await screen.findByRole('heading', { name: 'A little about you' });
      expect(dateOfBirthInput()).toHaveValue('1990-05-15');
    });

    it('limits the date picker to today and 120 years ago, and asks for the birthday', async () => {
      renderOnboarding();
      await completeAccountStep();

      expect(dateOfBirthInput()).toHaveAttribute('max', '2026-11-21');
      expect(dateOfBirthInput()).toHaveAttribute('min', '1906-11-21');
      expect(dateOfBirthInput()).toHaveAttribute('autocomplete', 'bday');
    });

    it.each([
      ['1990-05-15', 'You are 36 years and 6 months old'],
      ['2026-11-01', 'You are 20 days old'],
      ['2026-11-21', 'You were born today'],
      ['2026-05-10', 'You are 6 months and 11 days old'],
    ])('shows the live age for %s', async (dateOfBirth, expected) => {
      renderOnboarding();
      await completeAccountStep();

      setDateOfBirth(dateOfBirth);

      expect(ageText()).toBe(expected);
    });

    it('shows nothing for an empty, future or too-old date', async () => {
      renderOnboarding();
      await completeAccountStep();
      expect(ageText()).toBe('');

      for (const value of ['2026-11-22', '2999-01-01', '1906-11-20']) {
        setDateOfBirth(value);
        expect(ageText()).toBe('');
      }
      setDateOfBirth('1990-05-15');
      expect(ageText()).toBe('You are 36 years and 6 months old');
      setDateOfBirth('');
      expect(ageText()).toBe('');
    });

    it('requires a date of birth and rejects a future one on submit', async () => {
      renderOnboarding();
      await completeAccountStep();

      await createAccount();
      expect(await screen.findByText('Please enter your date of birth.')).toBeInTheDocument();

      setDateOfBirth('2026-11-22');
      await createAccount();
      expect(await screen.findByText('Date of birth cannot be in the future.')).toBeInTheDocument();
      expect(authApi.register).not.toHaveBeenCalled();
    });

    it('registers once with name, email, password and date of birth', async () => {
      renderOnboarding();
      await completeAccountStep();
      setDateOfBirth('1990-05-15');

      await createAccount();

      await waitFor(() => expect(authApi.register).toHaveBeenCalledOnce());
      expect(authApi.register).toHaveBeenCalledWith({
        name: 'Asha Rao',
        email: 'asha@example.com',
        password: 'sweet1234',
        dateOfBirth: '1990-05-15',
      });
    });

    it('shows a spinner and disables the button while the account is created', async () => {
      vi.mocked(authApi.register).mockReturnValue(new Promise(() => undefined));
      renderOnboarding();
      await completeAccountStep();
      setDateOfBirth('1990-05-15');

      await createAccount();

      const button = await screen.findByRole('button', { name: 'Create my account' });
      await waitFor(() => expect(button).toBeDisabled());
      expect(button.querySelector('svg.animate-spin')).not.toBeNull();
    });
  });

  describe('server responses', () => {
    it('returns to step 1 with the error on the email field when the email exists (409)', async () => {
      const message = 'An account with this email already exists.';
      vi.mocked(authApi.register).mockRejectedValue(new ApiError(message, 409, { email: message }));
      renderOnboarding();
      await completeAccountStep();
      setDateOfBirth('1990-05-15');

      await createAccount();

      expect(await screen.findByText(message)).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Create your account' })).toBeInTheDocument();
      expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true');
      await waitFor(() => expect(screen.getByLabelText('Email')).toHaveFocus());
      expect(screen.getByLabelText('Name')).toHaveValue('Asha Rao');
    });

    it('keeps a date-of-birth error from the server on step 2', async () => {
      const message = 'Please enter a valid date of birth.';
      vi.mocked(authApi.register).mockRejectedValue(
        new ApiError(message, 400, { dateOfBirth: message }),
      );
      renderOnboarding();
      await completeAccountStep();
      setDateOfBirth('1990-05-15');

      await createAccount();

      expect(await screen.findByText(message)).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'A little about you' })).toBeInTheDocument();
    });

    it('shows an error that is not tied to a field at the top of step 2', async () => {
      vi.mocked(authApi.register).mockRejectedValue(new ApiError('Something went wrong.', 500));
      renderOnboarding();
      await completeAccountStep();
      setDateOfBirth('1990-05-15');

      await createAccount();

      expect(await screen.findByRole('alert')).toHaveTextContent('Something went wrong.');
      expect(screen.getByRole('heading', { name: 'A little about you' })).toBeInTheDocument();
    });

    it('celebrates on success with the first name, no progress bar, and a dashboard button', async () => {
      renderOnboarding();
      await completeAccountStep();
      setDateOfBirth('1990-05-15');

      await createAccount();

      expect(
        await screen.findByRole('heading', { name: 'Welcome to Sweety, Asha!' }),
      ).toBeInTheDocument();
      expect(screen.queryByText(/Step \d of 2/)).not.toBeInTheDocument();
      expect(screen.queryByText('Dashboard page')).not.toBeInTheDocument();
      expect(localStorage.length).toBe(0);
      expect(sessionStorage.length).toBe(0);

      await userEvent.click(screen.getByRole('button', { name: 'Go to my dashboard' }));
      expect(await screen.findByText('Dashboard page')).toBeInTheDocument();
    });
  });

  it('sends someone who is already signed in straight to the dashboard', async () => {
    vi.mocked(authApi.getMe).mockResolvedValue(CREATED_USER);

    renderOnboarding();

    expect(await screen.findByText('Dashboard page')).toBeInTheDocument();
  });
});
