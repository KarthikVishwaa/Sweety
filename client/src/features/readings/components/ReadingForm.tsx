import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'motion/react';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { FieldShell, describedBy } from '@/components/form/FieldShell';
import { FormError } from '@/components/form/FormError';
import { SubmitButton } from '@/components/form/SubmitButton';
import { TextField } from '@/components/form/TextField';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useShakeOnError } from '@/hooks/useShakeOnError';
import { applyApiError } from '@/lib/applyApiError';
import { shake as shakeVariants } from '@/lib/motion';
import { SLOTS } from '../readings.constants';
import {
  readingFormSchema,
  type ReadingFormInput,
  type ReadingFormValues,
} from '../readings.schemas';
import type { ReadingInput } from '../types';
import { useCreateReading, useUpdateReading } from '../useReadings';
import { DatePickerButton } from './DatePickerButton';
import type { ReadingEditor } from './readingEditor';

const FIELDS = ['value', 'date', 'slot'] as const;
const SLOT_ITEMS = SLOTS.map(({ key, label }) => ({ value: key, label }));

interface ReadingFormProps {
  editor: ReadingEditor;
  defaultDate: string;
  onDone: () => void;
  onCancel: () => void;
}

function toDefaultValues(editor: ReadingEditor, defaultDate: string): ReadingFormInput {
  if (editor.mode === 'edit') {
    const { date, slot, value } = editor.reading;
    return { date, slot, value: String(value) };
  }
  return { date: defaultDate, slot: editor.slot, value: '' };
}

export function ReadingForm({ editor, defaultDate, onDone, onCancel }: ReadingFormProps) {
  const createReading = useCreateReading();
  const updateReading = useUpdateReading();
  const { controls, shake } = useShakeOnError();
  const [serverError, setServerError] = useState<string>();
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ReadingFormInput, unknown, ReadingFormValues>({
    resolver: zodResolver(readingFormSchema),
    defaultValues: toDefaultValues(editor, defaultDate),
  });

  const isPending = createReading.isPending || updateReading.isPending;

  const submit = (input: ReadingInput) => {
    setServerError(undefined);
    const options = {
      onSuccess: onDone,
      onError: (error: Error) => {
        setServerError(
          applyApiError(error, FIELDS, (name, fieldError) =>
            setError(name, fieldError, { shouldFocus: true }),
          ),
        );
        shake();
      },
    };

    if (editor.mode === 'edit') {
      updateReading.mutate({ id: editor.reading.id, input }, options);
    } else {
      createReading.mutate(input, options);
    }
  };

  return (
    <motion.form
      onSubmit={handleSubmit(submit, shake)}
      noValidate
      className="space-y-4"
      variants={shakeVariants}
      animate={controls}
    >
      <FormError
        message={serverError}
        className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
      />
      <Controller
        control={control}
        name="date"
        render={({ field }) => (
          <FieldShell id="reading-date" label="Date" error={errors.date?.message}>
            <DatePickerButton
              id="reading-date"
              ref={field.ref}
              value={field.value}
              onChange={field.onChange}
              className="w-full"
              aria-invalid={errors.date ? true : undefined}
              aria-describedby={describedBy('reading-date', errors.date?.message)}
            />
          </FieldShell>
        )}
      />
      <Controller
        control={control}
        name="slot"
        render={({ field }) => (
          <FieldShell id="reading-slot" label="Time slot" error={errors.slot?.message}>
            <Select
              items={SLOT_ITEMS}
              value={field.value || null}
              onValueChange={(slot) => field.onChange(slot ?? '')}
            >
              <SelectTrigger
                id="reading-slot"
                ref={field.ref}
                className="w-full"
                aria-invalid={errors.slot ? true : undefined}
                aria-describedby={describedBy('reading-slot', errors.slot?.message)}
              >
                <SelectValue placeholder="Choose a time slot" />
              </SelectTrigger>
              <SelectContent>
                {SLOTS.map(({ key, label }) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldShell>
        )}
      />
      <TextField
        id="reading-value"
        label="Glucose value (mg/dl)"
        inputMode="numeric"
        autoComplete="off"
        error={errors.value?.message}
        {...register('value')}
      />
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" size="lg" onClick={onCancel}>
          Cancel
        </Button>
        <SubmitButton pending={isPending} fullWidth={false}>
          {editor.mode === 'edit' ? 'Save changes' : 'Save reading'}
        </SubmitButton>
      </div>
    </motion.form>
  );
}
