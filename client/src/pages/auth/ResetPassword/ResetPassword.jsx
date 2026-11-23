import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import form from '@/styles/authForm.module.css';
import AuthContainer from '@/components/layout/AuthContainer/AuthContainer';
import useResetPassword from '@/hooks/useResetPassword';
import { Alert, Button, FormField, PasswordInput, TextLink, toast } from '@/components/ui';
import { resetPasswordSchema } from '@/validations/authValidations';
import { validateForm } from '@/utils/validationUtils';
import { getErrorMessage } from '@/utils/errorUtils';

// Opened from the emailed link: /reset-password?token=... Open to everyone (logged in or not), so the link
// works in any browser. After the change every session ends and the user logs in with the new password.
const ResetPassword = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token') ?? '';
    const navigate = useNavigate();
    const [values, setValues] = useState({ password: '', confirmPassword: '' });
    const [errors, setErrors] = useState({});
    const resetPassword = useResetPassword();

    const handleChange = (event) => {
        const { name, value } = event.target;
        setValues({ ...values, [name]: value });
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        const newErrors = await validateForm(resetPasswordSchema, values);
        setErrors(newErrors);
        if (Object.keys(newErrors).length === 0) {
            resetPassword.mutate({ token, password: values.password }, {
                onSuccess: () => {
                    toast.success('Password changed. Log in with the new password.');
                    navigate('/login', { replace: true });
                },
            });
        }
    };

    const requestNewLink = <TextLink to="/forgot-password">Request a new link</TextLink>;

    return (
        <AuthContainer headline="Choose a new password" subHeadline="Pick one you do not use anywhere else.">
            <form className={form.form} onSubmit={handleSubmit} noValidate>
                <h1 className={form.title}>Set a new password</h1>
                <p className={form.description}>Type it twice to be sure it is right</p>

                {!token ? (
                    <Alert tone="danger" title="This link is incomplete" className={form.alert}>
                        Open the link from the email again, or {requestNewLink}.
                    </Alert>
                ) : (
                    <>
                        {resetPassword.isError && (
                            <Alert tone="danger" title="The password was not changed" className={form.alert}>
                                <p>{getErrorMessage(resetPassword.error)}</p>
                                <p>{requestNewLink}</p>
                            </Alert>
                        )}
                        <div className={form.fields}>
                            <FormField label="New password" hint="At least 8 characters, with a letter and a number" error={errors.password}>
                                <PasswordInput
                                    name="password"
                                    autoFocus
                                    autoComplete="new-password"
                                    size="lg"
                                    value={values.password}
                                    onChange={handleChange}
                                />
                            </FormField>
                            <FormField label="Repeat new password" error={errors.confirmPassword}>
                                <PasswordInput
                                    name="confirmPassword"
                                    autoComplete="new-password"
                                    size="lg"
                                    value={values.confirmPassword}
                                    onChange={handleChange}
                                />
                            </FormField>
                        </div>
                        <Button type="submit" size="lg" fullWidth loading={resetPassword.isPending} className={form.submit}>
                            Change password
                        </Button>
                    </>
                )}

                <p className={form.footer}>
                    <TextLink to="/login">Back to log in</TextLink>
                </p>
            </form>
        </AuthContainer>
    );
};

export default ResetPassword;
