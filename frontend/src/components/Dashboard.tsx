import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    AppBar,
    Toolbar,
    Typography,
    Button,
    Container,
    Card,
    CardContent,
    CardActions,
    Box,
    Chip,
    CircularProgress,
    Divider,
    IconButton,
    Stack
} from '@mui/material';

import AddIcon from '@mui/icons-material/Add';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LogoutIcon from '@mui/icons-material/Logout';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';

import apiClient from '../api';
import { auth } from '../firebase';

interface Challenge {
    challenge_id: string;
    title: string;
    difficulty: string;
    description: string;
}

export const Dashboard: React.FC = () => {
    const [challenges, setChallenges] = useState<Challenge[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchChallenges = async () => {
            try {
                const response = await apiClient.get('/challenges/');
                setChallenges(response.data);
            } catch (error) {
                console.error('Failed to fetch challenges:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchChallenges();
    }, []);

    const handleLogout = async () => {
        await auth.signOut();
        navigate('/login');
    };

    if (loading) {
        return (
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    minHeight: "100vh",
                    '@supports (min-height: 100dvh)': {
                        minHeight: '100dvh'
                    },
                    background: '#020617',
                    backgroundImage: 'radial-gradient(circle at top center, #1e293b 0%, #020617 100%)',
                }}
            >
                <CircularProgress sx={{ color: '#3b82f6' }} />
            </Box>
        );
    }

    return (
        <Box
            sx={{
                flexGrow: 1,
                minHeight: '100vh',
                '@supports (min-height: 100dvh)': {
                    minHeight: '100dvh'
                },
                background: '#020617',
                backgroundImage: 'radial-gradient(circle at top center, #1e293b 0%, #020617 120%)',
            }}
        >
            {/* Navbar */}
            <AppBar
                position="sticky"
                elevation={0}
                sx={{
                    backdropFilter: 'blur(20px)',
                    backgroundColor: 'rgba(15, 23, 42, 0.65)',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.04)'
                }}
            >
                <Container maxWidth="lg">
                    <Toolbar
                        disableGutters
                        sx={{ 
                            justifyContent: 'space-between', 
                            py: { xs: 1, sm: 1.5 },
                            px: { xs: 2, sm: 0 } 
                        }}
                    >
                        <Typography
                            variant="h6"
                            sx={{ 
                                fontWeight: 700, 
                                letterSpacing: 0.2,
                                color: '#f1f5f9',
                                fontSize: { xs: '1.15rem', sm: '1.25rem' }
                            }}
                        >
                            Challenge Hub
                        </Typography>

                        {/* TypeScript FIX: Moved alignItems into sx */}
                        <Stack direction="row" spacing={{ xs: 1, sm: 1.5 }} sx={{ alignItems: 'center' }}>
                            <Button
                                variant="contained"
                                startIcon={<AddIcon sx={{ fontSize: '1.1rem !important' }} />}
                                onClick={() => navigate('/workshop')}
                                sx={{
                                    textTransform: 'none',
                                    borderRadius: 2.5,
                                    px: { xs: 2, sm: 2.5 },
                                    py: { xs: 0.6, sm: 0.8 },
                                    fontWeight: 600,
                                    fontSize: '0.9rem',
                                    background: '#3b82f6',
                                    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.25)',
                                    '&:hover': {
                                        background: '#2563eb',
                                        boxShadow: '0 6px 16px rgba(59, 130, 246, 0.4)',
                                    }
                                }}
                            >
                                Create
                            </Button>

                            <IconButton
                                size="small"
                                onClick={() => navigate('/profile')}
                                sx={{ 
                                    color: '#94a3b8', 
                                    p: 1,
                                    '&:hover': { color: '#f1f5f9', backgroundColor: 'rgba(255,255,255,0.08)' } 
                                }}
                            >
                                <AccountCircleIcon fontSize="small" />
                            </IconButton>

                            <IconButton
                                size="small"
                                onClick={handleLogout}
                                sx={{ 
                                    color: '#ef4444', 
                                    p: 1,
                                    '&:hover': { color: '#f87171', backgroundColor: 'rgba(239, 68, 68, 0.12)' } 
                                }}
                            >
                                <LogoutIcon fontSize="small" />
                            </IconButton>
                        </Stack>
                    </Toolbar>
                </Container>
            </AppBar>

            {/* Content */}
            <Container maxWidth="md" sx={{ py: { xs: 5, sm: 8 }, px: { xs: 2.5, sm: 3 } }}>
                {/* Header */}
                <Box sx={{ mb: { xs: 4, sm: 6 } }}>
                    <Typography
                        variant="h3"
                        sx={{ 
                            fontWeight: 800, 
                            mb: 1, 
                            color: '#f8fafc',
                            letterSpacing: -0.5,
                            fontSize: { xs: '1.85rem', sm: '2.75rem' }
                        }}
                    >
                        Active Challenges
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#94a3b8', fontSize: { xs: '0.95rem', sm: '1.05rem' } }}>
                        Select a target to begin your session.
                    </Typography>
                </Box>

                {/* Challenge List */}
                <Stack spacing={3}>
                    {challenges.map((challenge) => (
                        <Card
                            key={challenge.challenge_id}
                            elevation={0}
                            sx={{
                                borderRadius: { xs: 4, sm: 5 },
                                background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0.6) 100%)',
                                backdropFilter: 'blur(12px)',
                                border: '1px solid rgba(255, 255, 255, 0.06)',
                                boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.05)',
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                    transform: 'translateY(-3px)',
                                    boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.5), inset 0 1px 0 0 rgba(255, 255, 255, 0.1)',
                                    borderColor: 'rgba(59, 130, 246, 0.3)'
                                }
                            }}
                        >
                            <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
                                <Box
                                    sx={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "flex-start",
                                        mb: 2,
                                        gap: 2
                                    }}
                                >
                                    <Typography
                                        variant="h6"
                                        sx={{ 
                                            fontWeight: 700,
                                            color: '#f1f5f9',
                                            lineHeight: 1.3
                                        }}
                                    >
                                        {challenge.title}
                                    </Typography>

                                    <Chip
                                        label={challenge.difficulty}
                                        size="small"
                                        sx={{
                                            fontWeight: 600,
                                            borderRadius: 2,
                                            backgroundColor: 'rgba(59, 130, 246, 0.15)',
                                            color: '#60a5fa',
                                            border: '1px solid rgba(59, 130, 246, 0.2)',
                                        }}
                                    />
                                </Box>

                                <Typography
                                    variant="body2"
                                    sx={{
                                        color: '#94a3b8',
                                        lineHeight: 1.6,
                                        fontSize: '0.95rem'
                                    }}
                                >
                                    {challenge.description}
                                </Typography>
                            </CardContent>

                            <Divider sx={{ borderColor: 'rgba(255,255,255,0.04)' }} />

                            <CardActions sx={{ p: { xs: 2.5, sm: 3 } }}>
                                <Button
                                    fullWidth
                                    variant="contained"
                                    size="large"
                                    endIcon={<PlayArrowIcon />}
                                    onClick={() => navigate(`/arena/${challenge.challenge_id}`)}
                                    sx={{
                                        py: { xs: 1.4, sm: 1.6 },
                                        borderRadius: 3,
                                        textTransform: 'none',
                                        fontWeight: 600,
                                        fontSize: '0.95rem',
                                        background: '#3b82f6',
                                        boxShadow: 'none',
                                        '&:hover': {
                                            background: '#2563eb',
                                            boxShadow: '0 8px 20px -4px rgba(37, 99, 235, 0.4)',
                                        },
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    Enter Arena
                                </Button>
                            </CardActions>
                        </Card>
                    ))}

                    {/* Empty State */}
                    {challenges.length === 0 && (
                        <Box
                            sx={{
                                textAlign: 'center',
                                py: { xs: 7, sm: 10 },
                                px: { xs: 3, sm: 4 },
                                background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.3) 0%, rgba(15, 23, 42, 0.4) 100%)',
                                backdropFilter: 'blur(10px)',
                                border: '1px solid rgba(255, 255, 255, 0.04)',
                                borderRadius: { xs: 4, sm: 5 },
                                boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.02)',
                            }}
                        >
                            <Typography
                                variant="h6"
                                sx={{ color: '#e2e8f0', fontWeight: 600, mb: 1 }}
                            >
                                No targets available
                            </Typography>
                            
                            <Typography variant="body2" sx={{ color: '#64748b', mb: 4, lineHeight: 1.6 }}>
                                The arena is currently empty.<br/>Initialize a new sequence to begin.
                            </Typography>

                            <Button
                                variant="outlined"
                                onClick={() => navigate('/workshop')}
                                startIcon={<AddIcon sx={{ fontSize: '1.2rem !important' }}/>}
                                sx={{
                                    py: 1.4,
                                    px: 3.5,
                                    borderRadius: 3,
                                    textTransform: 'none',
                                    fontWeight: 600,
                                    fontSize: '0.95rem',
                                    color: '#f1f5f9',
                                    borderColor: 'rgba(255,255,255,0.12)',
                                    backgroundColor: 'rgba(255,255,255,0.03)',
                                    '&:hover': {
                                        backgroundColor: 'rgba(255,255,255,0.08)',
                                        borderColor: 'rgba(255,255,255,0.2)'
                                    }
                                }}
                            >
                                Create your first challenge
                            </Button>
                        </Box>
                    )}
                </Stack>
            </Container>
        </Box>
    );
};