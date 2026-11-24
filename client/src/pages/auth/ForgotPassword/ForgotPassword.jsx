import { useState } from 'react';
import form from '@/styles/authForm.module.css';
import AuthContainer from '@/components/layout/AuthContainer/AuthContainer';
import useForgotPassword from '@/hooks/useForgotPassword';
import useLanguage from '@/hooks/useLanguage';
import { Alert, Button, FormField, Input, TextLink } from '@/components/ui';
import { forgotPasswordSchema } from '@/validations/authValidations';
import { validateForm } from '@/utils/validationUtils';

// Asks for a reset link. The answer never says whether the email has an account (neither does the server),
// so the form cannot be used to find out who is registered.
const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [errors, setErrors] = useState({});
    const forgotPassword = useForgotPassword();
    const { t } = useLanguage();

    const handleSubmit = async (event) => {
        event.preventDefault();
        const newErrors = await validateForm(forgotPasswordSchema, { email });
        setErrors(newErrors);
        if (Object.keys(newErrors).length === 0) {
            forgotPassword.mutate({ email: email.trim() });
        }
    };

    return (
        <AuthContainer headline={t('auth.forgot.headline')} subHeadline={t('auth.forgot.headlineText')}>
            <form className={form.form} onSubmit={handleSubmit} noValidate>
                <h1 className={form.title}>{t('auth.forgot.title')}</h1>
                <p className={form.description}>{t('auth.forgot.description')}</p>

                {forgotPassword.isSuccess ? (
                    <Alert tone="success" title={t('auth.forgot.sentTitle')} className={form.alert}>
                        {t('auth.forgot.sentText', { email: email.trim() })}
                    </Alert>
                ) : (
                    <>
                        <div className={form.fields}>
                            <FormField label={t('auth.forgot.email')} error={errors.email && t(errors.email)}>
                                <Input
                                    name="email"
                                    type="email"
                                    autoFocus
                                    autoComplete="email"
                                    placeholder={t('auth.forgot.emailPlaceholder')}
                                    size="lg"
                                    value={email}
                                    onChange={(event) => setEmail(event.target.value)}
                                />
                            </FormField>
                        </div>
                        <Button type="submit" size="lg" fullWidth loading={forgotPassword.isPending} className={form.submit}>
                            {t('auth.forgot.submit')}
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

export default ForgotPassword;
