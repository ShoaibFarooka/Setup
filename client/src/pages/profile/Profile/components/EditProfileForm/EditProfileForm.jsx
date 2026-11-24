import { useState } from 'react';
import styles from './EditProfileForm.module.css';
import useUpdateMe from '@/hooks/useUpdateMe';
import { Button, FormField, Input } from '@/components/ui';
import useLanguage from '@/hooks/useLanguage';
import { profileSchema } from '@/validations/userValidations';
import { validateForm } from '@/utils/validationUtils';

// The whole pattern for a form that changes data: local state → validate in the browser (Yup schema) →
// a mutation hook (service → server) → the cache updates every view of the data. onDone closes the dialog.
const EditProfileForm = ({ user, onDone }) => {
    const [values, setValues] = useState({ name: user.name, email: user.email });
    const [errors, setErrors] = useState({});
    const updateMe = useUpdateMe();
    const { t } = useLanguage();

    const handleChange = (event) => {
        const { name, value } = event.target;
        setValues({ ...values, [name]: value });
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        const newErrors = await validateForm(profileSchema, values);
        setErrors(newErrors);
        if (Object.keys(newErrors).length === 0) {
            // A server error (e.g. the email belongs to another account) shows a message and keeps the form open
            updateMe.mutate(values, { onSuccess: onDone });
        }
    };

    return (
        <form className={styles.form} onSubmit={handleSubmit} noValidate>
            <FormField label={t('profile.name')} error={errors.name && t(errors.name)}>
                <Input name="name" autoComplete="name" value={values.name} onChange={handleChange} />
            </FormField>
            <FormField label={t('profile.email')} error={errors.email && t(errors.email)}>
                <Input name="email" type="email" autoComplete="email" value={values.email} onChange={handleChange} />
            </FormField>
            <div className={styles.actions}>
                <Button variant="ghost" onClick={onDone}>{t('profile.cancel')}</Button>
                <Button type="submit" loading={updateMe.isPending}>{t('profile.save')}</Button>
            </div>
        </form>
    );
};

export default EditProfileForm;
