import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { contactFormSchema, type ContactFormValues } from '@shared/schemas';
import type { Contact, ContactStatus } from '@shared/types';

import { Banner } from '@/components/ui/Banner';
import { Button } from '@/components/ui/Button';
import { SelectPill, type SelectPillOption } from '@/components/ui/SelectPill';
import { TextField } from '@/components/ui/TextField';

import { clearDraft } from './draftStorage';
import { useFormDraft } from './useFormDraft';

interface ContactFormProps {
  mode: 'create' | 'edit';
  /** Данные записи в режиме редактирования. */
  contact?: Contact;
  statuses: ContactStatus[];
  submitLabel: string;
  onSubmit: (values: ContactFormValues) => Promise<void>;
  onCancel?: () => void;
  /** Текст ошибки с сервера. */
  serverError?: string | null;
}

/** Форма создания и редактирования контакта. */
export function ContactForm({
  mode,
  contact,
  statuses,
  submitLabel,
  onSubmit,
  onCancel,
  serverError,
}: ContactFormProps) {
  const defaultValues: ContactFormValues = {
    name: contact?.name ?? '',
    company: contact?.company ?? '',
    email: contact?.email ?? '',
    statusId: contact?.statusId ?? statuses[0]?.id ?? '',
  };

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues,
    mode: 'onBlur',
  });

  const { draftKey, isRestored, discardDraft } = useFormDraft({
    mode,
    contactId: contact?.id,
    form,
    defaultValues,
  });

  const statusOptions: SelectPillOption[] = statuses.map((status) => ({
    value: status.id,
    label: status.label,
  }));

  const handleSubmit = form.handleSubmit(async (values) => {
    await onSubmit(values);

    // Данные сохранены — черновик больше не нужен.
    clearDraft(draftKey);
    form.reset(values);
  });

  return (
    <form className="contact-form" onSubmit={handleSubmit} noValidate>
      {isRestored ? (
        <Banner
          tone="info"
          title="Восстановлены несохранённые данные"
          action={
            <Button variant="ghost" onClick={discardDraft}>
              Очистить
            </Button>
          }
        >
          Поля были сохранены автоматически. Проверьте их перед сохранением или очистите черновик.
        </Banner>
      ) : null}

      {serverError ? (
        <Banner tone="error" title="Не удалось сохранить контакт">
          {serverError}
        </Banner>
      ) : null}

      <TextField
        label="ФИО"
        autoComplete="name"
        placeholder="Иванов Иван Иванович"
        error={form.formState.errors.name?.message}
        {...form.register('name')}
      />

      <TextField
        label="Компания"
        autoComplete="organization"
        placeholder="ООО «Компания»"
        error={form.formState.errors.company?.message}
        {...form.register('company')}
      />

      <TextField
        label="Email"
        type="email"
        autoComplete="email"
        placeholder="ivanov@example.ru"
        hint="Необязательное поле"
        error={form.formState.errors.email?.message}
        {...form.register('email')}
      />

      <div className={['field', form.formState.errors.statusId ? 'field--invalid' : null].filter(Boolean).join(' ')}>
        <span className="field__label">Статус</span>
        <Controller
          control={form.control}
          name="statusId"
          render={({ field }) => (
            <SelectPill
              value={field.value}
              options={statusOptions}
              onChange={field.onChange}
              invalid={Boolean(form.formState.errors.statusId)}
              ariaLabel="Статус"
            />
          )}
        />
        {form.formState.errors.statusId ? (
          <p className="field__error">{form.formState.errors.statusId.message}</p>
        ) : null}
      </div>

      <div className="contact-form__actions">
        {onCancel ? (
          <Button variant="ghost" onClick={onCancel}>
            Отмена
          </Button>
        ) : null}
        <Button type="submit" variant="primary" isLoading={form.formState.isSubmitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
