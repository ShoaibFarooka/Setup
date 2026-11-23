import { useState } from 'react';
import styles from './EditProfileForm.module.css';
import useUpdateMe from '@/hooks/useUpdateMe';
import { Button, FormField, Input } from '@/components/ui';
import { profileSchema } from '@/validations/userValidations';
import { validateForm } from '@/utils/validationUtils';

// The whole pattern for a form that changes data: local state → validate in the browser (Yup schema) →
// a mutation hook (service → server) → the cache updates every view of the data. onDone closes the dialog.
const EditProfileForm = ({ user, onDone }) => {
    const [values, setValues] = useState({ name: user.name, email: user.email });
    const [errors, setErrors] = useState({});
    const updateMe = useUpdateMe();

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
            <FormField label="Name" error={errors.name}>
                <Input name="name" autoComplete="name" value={values.name} onChange={handleChange} />
            </FormField>
            <FormField label="Email" error={errors.email}>
                <Input name="email" type="email" autoComplete="email" value={values.email} onChange={handleChange} />
            </FormField>
            <div className={styles.actions}>
                <Button variant="ghost" onClick={onDone}>Cancel</Button>
                <Button type="submit" loading={updateMe.isPending}>Save changes</Button>
            </div>
        </form>
    );
};

export default EditProfileForm;
