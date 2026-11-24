import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import form from '@/styles/authForm.module.css';
import AuthContainer from '@/components/layout/AuthContainer/AuthContainer';
import useResetPassword from '@/hooks/useResetPassword';
import useLanguage from '@/hooks/useLanguage';
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
    const { t } = useLanguage();

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
                    toast.success(t('auth.reset.changed'));
                    navigate('/login', { replace: true });
                },
            });
        }
    };

    const requestNewLink = <TextLink to="/forgot-password">{t('auth.reset.requestNewLink')}</TextLink>;

    return (
        <AuthContainer headline={t('auth.reset.headline')} subHeadline={t('auth.reset.headlineText')}>
            <form className={form.form} onSubmit={handleSubmit} noValidate>
                <h1 className={form.title}>{t('auth.reset.title')}</h1>
                <p className={form.description}>{t('auth.reset.description')}</p>

                {!token ? (
                    <Alert tone="danger" title={t('auth.reset.incompleteTitle')} className={form.alert}>
                        <p>{t('auth.reset.incompleteText')}</p>
                        <p>{requestNewLink}</p>
                    </Alert>
                ) : (
                    <>
                        {resetPassword.isError && (
                            <Alert tone="danger" title={t('auth.reset.failedTitle')} className={form.alert}>
                                <p>{getErrorMessage(resetPassword.error)}</p>
                                <p>{requestNewLink}</p>
                            </Alert>
                        )}
                        <div className={form.fields}>
                            <FormField label={t('auth.reset.newPassword')} hint={t('auth.reset.newPasswordHint')} error={errors.password && t(errors.password)}>
                                <PasswordInput
                                    name="password"
                                    autoFocus
                                    autoComplete="new-password"
                                    size="lg"
                                    value={values.password}
                                    onChange={handleChange}
                                />
                            </FormField>
                            <FormField label={t('auth.reset.repeatPassword')} error={errors.confirmPassword && t(errors.confirmPassword)}>
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
                            {t('auth.reset.submit')}
                        </Button>
                    </>
                )}

                <p className={form.footer}>
                    <TextLink to="/login">{t('auth.backToLogin')}</TextLink>
                </p>
            </form>
        </AuthContainer>
    );
};

export default ResetPassword;
