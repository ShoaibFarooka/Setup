import { useState } from 'react';
import form from '@/styles/authForm.module.css';
import AuthContainer from '@/components/layout/AuthContainer/AuthContainer';
import useForgotPassword from '@/hooks/useForgotPassword';
import { Alert, Button, FormField, Input, TextLink } from '@/components/ui';
import { forgotPasswordSchema } from '@/validations/authValidations';
import { validateForm } from '@/utils/validationUtils';

// Asks for a reset link. The answer never says whether the email has an account (neither does the server),
// so the form cannot be used to find out who is registered.
const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [errors, setErrors] = useState({});
    const forgotPassword = useForgotPassword();

    const handleSubmit = async (event) => {
        event.preventDefault();
        const newErrors = await validateForm(forgotPasswordSchema, { email });
        setErrors(newErrors);
        if (Object.keys(newErrors).length === 0) {
            forgotPassword.mutate({ email: email.trim() });
        }
    };

    return (
        <AuthContainer headline="Forgot your password?" subHeadline="It happens. We will email you a link to choose a new one.">
            <form className={form.form} onSubmit={handleSubmit} noValidate>
                <h1 className={form.title}>Reset your password</h1>
                <p className={form.description}>Enter the email address of your account</p>

                {forgotPassword.isSuccess ? (
                    <Alert tone="success" title="Check your email" className={form.alert}>
                        If an account exists for {email.trim()}, we have sent a link to reset the password. Nothing arrived? Check the spam folder, or try again in a few minutes.
                    </Alert>
                ) : (
                    <>
                        <div className={form.fields}>
                            <FormField label="Email" error={errors.email}>
                                <Input
                                    name="email"
                                    type="email"
                                    autoFocus
                                    autoComplete="email"
                                    placeholder="name@example.com"
                                    size="lg"
                                    value={email}
                                    onChange={(event) => setEmail(event.target.value)}
                                />
                            </FormField>
                        </div>
                        <Button type="submit" size="lg" fullWidth loading={forgotPassword.isPending} className={form.submit}>
                            Send reset link
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

export default ForgotPassword;
