import React, { useState } from 'react';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signInAnonymously,
    GoogleAuthProvider, // NEW
    signInWithPopup     // NEW
} from 'firebase/auth';
import { auth } from '../firebase';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Button,
    Container,
    Typography,
    TextField,
    Paper,
    Stack,
    Alert,
    Divider,
} from '@mui/material';
import TerminalIcon from '@mui/icons-material/Terminal';
import LoginIcon from '@mui/icons-material/Login';
import PersonAddIcon from '@mui/icons-material/PersonAdd';

export const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isRegistering, setIsRegistering] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    const handleAuthentication = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            if (isRegistering) {
                await createUserWithEmailAndPassword(auth, email, password);
            } else {
                await signInWithEmailAndPassword(auth, email, password);
            }
            navigate('/dashboard');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // NEW: Google Auth Logic
    const handleGoogleLogin = async () => {
        setError(null);
        setLoading(true);
        const provider = new GoogleAuthProvider();
        
        try {
            await signInWithPopup(auth, provider);
            navigate('/dashboard');
        } catch (err: any) {
            // Only show an error if they didn't just close the popup manually
            if (err.code !== 'auth/popup-closed-by-user') {
                setError("Google sign-in failed. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleGuestLogin = async () => {
        try {
            await signInAnonymously(auth);
            navigate('/dashboard');
        } catch {
            setError("Guest access is currently unavailable.");
        }
    };

    // ✅ Shared input styles (clean + reusable)
    const inputStyles = {
        '& .MuiOutlinedInput-root': {
            color: '#f8fafc',
            borderRadius: '12px',
            backgroundColor: 'rgba(2, 6, 23, 0.4)',

            '& fieldset': {
                borderColor: 'rgba(255,255,255,0.1)',
            },
            '&:hover fieldset': {
                borderColor: 'rgba(255,255,255,0.2)',
            },
            '&.Mui-focused fieldset': {
                borderColor: '#3b82f6',
            },

            // ✅ Placeholder fix
            '& input::placeholder': {
                color: '#94a3b8',
                opacity: 1,
            },

            // ✅ Autofill fix (Chrome)
            '& input:-webkit-autofill': {
                WebkitBoxShadow: '0 0 0 100px rgba(2, 6, 23, 0.4) inset',
                WebkitTextFillColor: '#f8fafc',
            },

            // ✨ Optional glow on focus
            '&.Mui-focused': {
                boxShadow: '0 0 0 2px rgba(59,130,246,0.15)',
            },
        },

        '& .MuiInputLabel-root': {
            color: '#64748b',
        },
        '& .MuiInputLabel-root.Mui-focused': {
            color: '#3b82f6',
        },
    };

    return (
        <Box
            sx={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'radial-gradient(circle at center, #1e293b 0%, #020617 100%)',
                p: 2
            }}
        >
            <Container maxWidth="sm" sx={{ display: 'flex', justifyContent: 'center' }}>
                <Paper
                    elevation={0}
                    sx={{
                        p: { xs: 4, sm: 6 },
                        width: '100%',
                        maxWidth: '440px',
                        borderRadius: 6,
                        bgcolor: 'rgba(15, 23, 42, 0.8)',
                        backdropFilter: 'blur(16px)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        textAlign: 'center',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                    }}
                >
                    {/* Header */}
                    <Box sx={{ mb: 4 }}>
                        <TerminalIcon sx={{ fontSize: 40, color: '#3b82f6', mb: 1.5 }} />
                        <Typography
                            variant="h4"
                            sx={{
                                fontWeight: 800,
                                color: '#f8fafc',
                                letterSpacing: -1,
                                mb: 0.5
                            }}
                        >
                            Code-Break
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#94a3b8', fontWeight: 500 }}>
                            {isRegistering
                                ? 'Join the community of makers'
                                : 'Welcome back, developer'}
                        </Typography>
                    </Box>

                    {/* Error */}
                    {error && (
                        <Alert
                            severity="error"
                            sx={{
                                mb: 3,
                                borderRadius: 2,
                                bgcolor: 'rgba(239, 68, 68, 0.1)',
                                color: '#fca5a5'
                            }}
                        >
                            {error}
                        </Alert>
                    )}

                    {/* Form */}
                    <form onSubmit={handleAuthentication}>
                        <Stack spacing={2.5}>
                            <TextField
                                fullWidth
                                label="Email Address"
                                placeholder="Enter your email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                sx={inputStyles}
                            />

                            <TextField
                                fullWidth
                                label="Password"
                                placeholder="Enter your password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                sx={inputStyles}
                            />

                            <Button
                                type="submit"
                                variant="contained"
                                fullWidth
                                disabled={loading}
                                startIcon={isRegistering ? <PersonAddIcon /> : <LoginIcon />}
                                sx={{
                                    py: 1.8,
                                    borderRadius: 3,
                                    fontWeight: 700,
                                    textTransform: 'none',
                                    fontSize: '1rem',
                                    background: 'linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)',
                                    boxShadow: '0 8px 20px -4px rgba(37, 99, 235, 0.4)',
                                    '&:hover': {
                                        boxShadow: '0 12px 24px -4px rgba(37, 99, 235, 0.5)',
                                        transform: 'translateY(-1px)'
                                    },
                                    transition: 'all 0.2s'
                                }}
                            >
                                {loading
                                    ? 'Checking logs...'
                                    : (isRegistering ? 'Initialize Account' : 'Authenticate')}
                            </Button>
                        </Stack>
                    </form>

                    {/* Toggle */}
                    <Box sx={{ mt: 3 }}>
                        <Button
                            onClick={() => setIsRegistering(!isRegistering)}
                            sx={{
                                color: '#3b82f6',
                                textTransform: 'none',
                                fontWeight: 600,
                                fontSize: '0.9rem'
                            }}
                        >
                            {isRegistering
                                ? 'Already have an account? Sign In'
                                : 'Need an account? Register Here'}
                        </Button>
                    </Box>

                    {/* Divider */}
                    <Divider sx={{ my: 4, borderColor: 'rgba(255,255,255,0.06)' }}>
                        <Typography
                            variant="caption"
                            sx={{ color: '#475569', fontWeight: 700, px: 1 }}
                        >
                            SYSTEM ACCESS
                        </Typography>
                    </Divider>

                    {/* NEW: Google Auth Button */}
                    <Button
                        fullWidth
                        variant="outlined"
                        onClick={handleGoogleLogin}
                        disabled={loading}
                        sx={{ 
                            mb: 2,
                            py: 1.5,
                            color: '#f8fafc', 
                            borderColor: 'rgba(255,255,255,0.2)', 
                            textTransform: 'none',
                            fontWeight: 600,
                            borderRadius: 3,
                            backgroundColor: 'rgba(255,255,255,0.05)',
                            '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)', borderColor: '#f8fafc' },
                            display: 'flex',
                            gap: 1.5
                        }}
                    >
                        <svg width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
                            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                        </svg>
                        Continue with Google
                    </Button>

                    {/* Guest */}
                    <Button
                        fullWidth
                        variant="text"
                        onClick={handleGuestLogin}
                        sx={{
                            py: 1.2,
                            color: '#94a3b8',
                            borderRadius: 3,
                            textTransform: 'none',
                            fontWeight: 500,
                            border: '1px solid rgba(255,255,255,0.05)',
                            '&:hover': {
                                backgroundColor: 'rgba(255,255,255,0.03)',
                                color: '#f8fafc'
                            }
                        }}
                    >
                        Continue as Guest
                    </Button>
                </Paper>
            </Container>
        </Box>
    );
};