import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';

import {
    Box,
    Button,
    Typography,
    Paper,
    Chip,
    Divider,
    Stack,
} from '@mui/material';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

import apiClient from '../api';
import { Leaderboard } from './Leaderboard';

interface ExecutionResult {
    status: string;
    execution_time: number;
    results: any[];
}

export const Arena: React.FC = () => {
    const { challengeId } = useParams<{ challengeId: string }>();
    const navigate = useNavigate();

    const [challenge, setChallenge] = useState<any>(null);
    const [code, setCode] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [feedback, setFeedback] = useState<ExecutionResult | null>(null);

    const [failCount, setFailCount] = useState(0);
    const [revealedSolution, setRevealedSolution] = useState<string | null>(null);
    const [revealError, setRevealError] = useState<string | null>(null);
    const [startTime, setStartTime] = useState<number | null>(null);
    const [leaderboardKey, setLeaderboardKey] = useState<number>(0);

    useEffect(() => {
        const fetchChallenge = async () => {
            try {
                const res = await apiClient.get(`/challenges/${challengeId}/`);
                setChallenge(res.data);
                if (res.data.starter_code) setCode(res.data.starter_code);
            } catch {
                console.error('Failed to fetch challenge');
            }
        };
        if (challengeId) fetchChallenge();
    }, [challengeId]);

    useEffect(() => {
        if (!startTime) {
            setStartTime(Date.now());
        }
    }, [startTime]);

    const handleRunCode = async () => {
        const trimmedCode = code.trim();
        if (!trimmedCode || trimmedCode === 'def solution():' || trimmedCode === 'def solution():\n    pass') {
            alert("Please write your solution code before running!");
            return;
        }

        setIsSubmitting(true);
        setFeedback(null);

        let timeTakenInSeconds = 0;
        if (startTime) {
            timeTakenInSeconds = (Date.now() - startTime) / 1000;
        }
        try {
            const res = await apiClient.post(`/challenges/${challengeId}/submit/`, {
                code: code,
                client_time_taken: timeTakenInSeconds
            });

            setFeedback(res.data);

            if (res.data.status === 'FAIL' || res.data.status === 'ERROR') {
                setFailCount((prev) => prev + 1);
            } else {
                setFailCount(0);
                setLeaderboardKey((prev) => prev + 1);
            }
        } catch {
            alert('Execution server failed.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRevealSolution = async () => {
        try {
            const res = await apiClient.get(
                `/challenges/${challengeId}/reveal/`
            );
            setRevealedSolution(res.data.solution_code);
            setRevealError(null);
        } catch (error: any) {
            if (error.response?.status === 403) {
                setRevealError(`Need ${error.response.data.attempts_needed} more attempt(s)`);
            } else {
                setRevealError('Unable to fetch solution');
            }
        }
    };

    if (!challenge) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', bgcolor: '#020617' }}>
                <Typography sx={{ color: '#3b82f6', fontWeight: 600 }}>Initializing Arena...</Typography>
            </Box>
        );
    }

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: { xs: 'column', lg: 'row' },
                minHeight: '100vh',
                height: { xs: 'auto', lg: '100vh' },
                maxWidth: '100vw', // CRITICAL: Prevent horizontal overflow at root
                overflowX: 'hidden', // CRITICAL: Hide any accidental wide children
                background: 'linear-gradient(180deg, #0f172a 0%, #020617 100%)'
            }}
        >
            {/* LEFT PANEL: Problem, Controls, Feedback */}
            <Box
                sx={{
                    width: { xs: '100%', lg: '40%' },
                    maxWidth: '100%',
                    height: { xs: 'auto', lg: '100vh' },
                    p: { xs: 1.5, sm: 3, lg: 4 }, // Tightened mobile padding
                    overflowY: { xs: 'visible', lg: 'auto' }, 
                    overflowX: 'hidden',
                    borderRight: { xs: 'none', lg: '1px solid rgba(255,255,255,0.08)' },
                    borderBottom: { xs: '1px solid rgba(255,255,255,0.08)', lg: 'none' },
                    // Custom scrollbar for desktop
                    '&::-webkit-scrollbar': { width: '6px' },
                    '&::-webkit-scrollbar-track': { background: 'transparent' },
                    '&::-webkit-scrollbar-thumb': { background: 'rgba(255,255,255,0.1)', borderRadius: '10px' },
                    '&::-webkit-scrollbar-thumb:hover': { background: 'rgba(255,255,255,0.2)' },
                }}
            >
                <Button
                    startIcon={<ArrowBackIcon />}
                    onClick={() => navigate('/dashboard')}
                    sx={{ mb: { xs: 2, lg: 3 }, textTransform: 'none', color: '#94a3b8', '&:hover': { color: '#f8fafc', bgcolor: 'rgba(255,255,255,0.05)' } }}
                >
                    Back to Dashboard
                </Button>

                <Stack spacing={2.5}>
                    {/* Header */}
                    <Box sx={{ width: '100%' }}>
                        <Typography 
                            variant="h4" 
                            sx={{ 
                                fontWeight: 800, 
                                color: '#f8fafc', 
                                mb: 1, 
                                letterSpacing: -0.5, 
                                fontSize: { xs: '1.5rem', md: '2.125rem' },
                                wordBreak: 'break-word' // Ensures long titles wrap instead of expanding box
                            }}
                        >
                            {challenge.title}
                        </Typography>
                        <Chip
                            label={challenge.difficulty}
                            size="small"
                            sx={{ 
                                fontWeight: 700, 
                                borderRadius: 1.5, 
                                backgroundColor: 'rgba(59, 130, 246, 0.15)', 
                                color: '#60a5fa', 
                                border: '1px solid rgba(59, 130, 246, 0.3)' 
                            }}
                        />
                    </Box>

                    {/* Description */}
                    <Paper
                        elevation={0}
                        sx={{
                            p: { xs: 2, md: 3 },
                            backgroundColor: 'rgba(2, 6, 23, 0.4)',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            borderRadius: 3,
                            color: '#cbd5e1',
                            lineHeight: 1.7,
                            fontSize: '0.95rem',
                            wordBreak: 'break-word'
                        }}
                    >
                        {challenge.description}
                    </Paper>

                    {/* Run Button */}
                    <Button
                        variant="contained"
                        size="large"
                        startIcon={<PlayArrowIcon />}
                        onClick={handleRunCode}
                        disabled={isSubmitting}
                        sx={{
                            py: { xs: 1.5, md: 1.8 },
                            borderRadius: 3,
                            fontWeight: 800,
                            fontSize: '1.05rem',
                            textTransform: 'none',
                            background: 'linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)',
                            boxShadow: '0 8px 20px -4px rgba(37, 99, 235, 0.4)',
                            '&:hover': {
                                boxShadow: '0 12px 24px -4px rgba(37, 99, 235, 0.5)',
                                transform: 'translateY(-1px)'
                            },
                            '&.Mui-disabled': {
                                background: 'rgba(59, 130, 246, 0.3)',
                                color: '#94a3b8'
                            }
                        }}
                    >
                        {isSubmitting ? 'Executing Sequence...' : 'Run Code'}
                    </Button>

                    {/* Reveal Hint Section */}
                    {failCount >= 3 && !revealedSolution && (
                        <Box sx={{ 
                            p: 2, 
                            borderRadius: 3, 
                            border: '1px solid rgba(245, 158, 11, 0.3)', 
                            bgcolor: 'rgba(245, 158, 11, 0.05)' 
                        }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                                <LightbulbIcon sx={{ color: '#fbbf24', fontSize: '1.2rem' }} />
                                <Typography sx={{ color: '#fcd34d', fontWeight: 600, fontSize: '0.95rem' }}>Stuck? Try revealing the solution.</Typography>
                            </Box>
                            <Button
                                fullWidth
                                variant="outlined"
                                onClick={handleRevealSolution}
                                sx={{ 
                                    color: '#fbbf24', 
                                    borderColor: 'rgba(245, 158, 11, 0.5)', 
                                    textTransform: 'none',
                                    fontWeight: 600,
                                    py: 1,
                                    '&:hover': { bgcolor: 'rgba(245, 158, 11, 0.1)', borderColor: '#fbbf24' }
                                }}
                            >
                                Reveal Official Solution
                            </Button>
                            {revealError && (
                                <Typography sx={{ color: '#ef4444', mt: 1, fontSize: '0.85rem', textAlign: 'center' }}>
                                    {revealError}
                                </Typography>
                            )}
                        </Box>
                    )}

                    {/* Constrained Official Solution Section */}
                    {revealedSolution && (
                        <Box sx={{ 
                            p: { xs: 2, md: 2.5 }, 
                            borderRadius: 3, 
                            border: '1px solid rgba(59, 130, 246, 0.3)', 
                            bgcolor: 'rgba(15, 23, 42, 0.6)',
                            width: '100%',
                            boxSizing: 'border-box'
                        }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                                <Typography sx={{ fontWeight: 700, color: '#60a5fa', display: 'flex', alignItems: 'center', gap: 1, fontSize: '0.95rem' }}>
                                    <LightbulbIcon fontSize="small" /> Official Solution
                                </Typography>
                                <Button
                                    size="small"
                                    variant="outlined"
                                    startIcon={<ContentCopyIcon fontSize="small" />}
                                    onClick={() => setCode(revealedSolution)}
                                    sx={{ 
                                        color: '#94a3b8', 
                                        borderColor: 'rgba(255,255,255,0.2)', 
                                        textTransform: 'none',
                                        py: 0.2,
                                        '&:hover': { color: '#f8fafc', borderColor: '#f8fafc', bgcolor: 'rgba(255,255,255,0.05)' }
                                    }}
                                >
                                    Copy
                                </Button>
                            </Box>
                            
                            <Box
                                component="pre"
                                sx={{
                                    background: '#020617',
                                    color: '#e2e8f0',
                                    p: 1.5,
                                    borderRadius: 2,
                                    border: '1px solid rgba(255,255,255,0.05)',
                                    overflowX: 'auto',
                                    overflowY: 'auto',
                                    maxHeight: '200px',
                                    whiteSpace: 'pre-wrap', 
                                    wordBreak: 'break-word',
                                    fontSize: 13,
                                    fontFamily: 'monospace',
                                    m: 0,
                                    // Custom scrollbars for the code block
                                    '&::-webkit-scrollbar': { width: '6px', height: '6px' },
                                    '&::-webkit-scrollbar-thumb': { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '4px' },
                                    '&::-webkit-scrollbar-thumb:hover': { backgroundColor: 'rgba(255,255,255,0.2)' },
                                }}
                            >
                                {revealedSolution}
                            </Box>
                        </Box>
                    )}

                    {/* Feedback Section */}
                    {feedback && (
                        <Paper
                            elevation={0}
                            sx={{
                                p: { xs: 2, md: 3 },
                                borderRadius: 3,
                                bgcolor: 'rgba(15, 23, 42, 0.8)',
                                border: feedback.status === 'PASS' ? '1px solid rgba(34, 197, 94, 0.4)' : '1px solid rgba(239, 68, 68, 0.4)',
                                boxShadow: feedback.status === 'PASS' ? '0 0 20px rgba(34, 197, 94, 0.1)' : '0 0 20px rgba(239, 68, 68, 0.1)'
                            }}
                        >
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography
                                    sx={{ 
                                        fontWeight: 800, 
                                        fontSize: '1.2rem',
                                        color: feedback.status === 'PASS' ? '#4ade80' : '#f87171' 
                                    }}
                                >
                                    {feedback.status}
                                </Typography>
                                <Typography variant="body2" sx={{ color: '#94a3b8', fontWeight: 600 }}>
                                    Time: <span style={{ color: '#f8fafc' }}>{feedback.execution_time}s</span>
                                </Typography>
                            </Box>

                            <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)', mb: 2 }} />

                            <Stack spacing={1.5}>
                                {feedback.results.map((t, i) => (
                                    <Box key={i} sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, maxWidth: '100%', overflowX: 'hidden' }}>
                                        <Typography variant="body2" sx={{ color: '#cbd5e1', fontWeight: 600 }}>
                                            {t.passed ? '✅' : '❌'} Test {i + 1}
                                        </Typography>
                                        <Typography
                                            variant="caption"
                                            sx={{
                                                fontFamily: 'monospace',
                                                bgcolor: 'rgba(0, 0, 0, 0.3)', 
                                                color: t.passed ? '#94a3b8' : '#fca5a5',
                                                p: 1.5,
                                                borderRadius: 2,
                                                border: '1px solid rgba(255,255,255,0.05)',
                                                whiteSpace: 'pre-wrap',
                                                wordBreak: 'break-all',
                                                overflowX: 'auto'
                                            }}
                                        >
                                            {t.stdout || 'No output'}
                                        </Typography>
                                    </Box>
                                ))}
                            </Stack>
                        </Paper>
                    )}

                    <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)', display: { xs: 'none', lg: 'block' } }} />

                    {/* Leaderboard - WRAPPED FOR STRICT WIDTH CONTROL */}
                    <Box sx={{ pb: { xs: 2, lg: 0 }, width: '100%', overflowX: 'hidden' }}>
                        <Leaderboard key={leaderboardKey} challengeId={challengeId as string} />
                    </Box>
                </Stack>
            </Box>

            {/* RIGHT PANEL: Code Editor */}
            <Box 
                sx={{ 
                    width: { xs: '100%', lg: '60%' }, 
                    maxWidth: '100%',
                    height: { xs: '500px', md: '600px', lg: '100vh' }, 
                    p: { xs: 1.5, md: 3, lg: 4 }, // Edge-to-edge on mobile
                    pt: { xs: 0, lg: 4 }, 
                    pb: { xs: 3, lg: 4 },
                    display: 'flex', 
                    alignItems: 'stretch', 
                    justifyContent: 'center' 
                }} 
            >
                <Paper 
                    elevation={0} 
                    sx={{ 
                        flex: 1, 
                        width: '100%',
                        maxWidth: '100%',
                        borderRadius: { xs: 2, sm: 3 }, // Slightly sharper corners on mobile to save space
                        overflow: 'hidden', 
                        border: '1px solid rgba(255,255,255,0.1)', 
                        backgroundColor: '#020617', 
                        display: 'flex', 
                        flexDirection: 'column',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                    }} 
                >
                    <Box 
                        sx={{ 
                            px: 2, 
                            py: 1.5, 
                            borderBottom: '1px solid rgba(255,255,255,0.08)', 
                            backgroundColor: 'rgba(15, 23, 42, 0.6)',
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center' 
                        }} 
                    >
                        <Typography sx={{ color: '#cbd5e1', fontSize: '0.85rem', fontWeight: 600, fontFamily: 'monospace' }}>
                            main.py
                        </Typography>
                        <Typography sx={{ color: '#3b82f6', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>
                            Python
                        </Typography>
                    </Box>
                    <Box sx={{ flex: 1, position: 'relative', width: '100%', overflow: 'hidden' }}>
                        <Editor 
                            height="100%" 
                            width="100%"
                            defaultLanguage="python" 
                            theme="vs-dark" 
                            value={code} 
                            onChange={(value) => setCode(value || '')} 
                            options={{ 
                                minimap: { enabled: false }, 
                                fontSize: 13, // Slightly smaller text on mobile
                                padding: { top: 16, bottom: 16 }, 
                                scrollBeyondLastLine: false, 
                                wordWrap: 'on',
                                cursorBlinking: 'smooth',
                                smoothScrolling: true
                            }} 
                        />
                    </Box>
                </Paper>
            </Box>
        </Box>
    );
};