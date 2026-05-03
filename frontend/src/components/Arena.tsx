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
    Alert
} from '@mui/material';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import LightbulbIcon from '@mui/icons-material/Lightbulb';

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
    
    // NEW: Add a key to force the Leaderboard to refresh
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

const handleRunCode = async () => {
        // NEW: FRONTEND GUARD to stop empty code from passing
        const trimmedCode = code.trim();
        if (!trimmedCode || trimmedCode === 'def solution():' || trimmedCode === 'def solution():\n    pass') {
            alert("Please write your solution code before running!");
            return;
        }

        setIsSubmitting(true);
        setFeedback(null);

        try {
            const res = await apiClient.post(
                `/challenges/${challengeId}/submit/`,
                { code }
            );

            setFeedback(res.data);

            if (res.data.status === 'FAIL' || res.data.status === 'ERROR') {
                setFailCount((prev) => prev + 1);
            } else {
                setFailCount(0);
                setLeaderboardKey((prev) => prev + 1); // Triggers the leaderboard refresh
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
            console.log("Revealed solution:", res.data.solution_code);
            setRevealedSolution(res.data.solution_code);
            setRevealError(null);
        } catch (error: any) {
            if (error.response?.status === 403) {
                setRevealError(
                    `Need ${error.response.data.attempts_needed} more attempt(s)`
                );
            } else {
                setRevealError('Unable to fetch solution');
            }
        }
    };

    if (!challenge) {
        return (
            <Box sx={{ p: 4 }}>
                <Typography>Loading Arena...</Typography>
            </Box>
        );
    }

    return (
        <Box
            sx={{
                display: 'flex',
                height: '100vh',
                background:
                    'linear-gradient(180deg, #0f172a 0%, #020617 100%)'
            }}
        >
            {/* LEFT PANEL */}
            <Box
                sx={{
                    width: '38%',
                    p: 3,
                    overflowY: 'auto',
                    borderRight: '1px solid #1e293b'
                }}
            >
                <Button
                    startIcon={<ArrowBackIcon />}
                    onClick={() => navigate('/dashboard')}
                    sx={{ mb: 3, textTransform: 'none' }}
                >
                    Back to Dashboard
                </Button>

                <Stack spacing={2}>
                    <Typography variant="h5" sx={{ fontWeight: 700 }}>
                        {challenge.title}
                    </Typography>

                    <Chip
                        label={challenge.difficulty}
                        size="small"
                        sx={{ width: 'fit-content' }}
                    />

                    <Paper
                        sx={{
                            p: 2,
                            backgroundColor: '#020617',
                            border: '1px solid #1e293b',
                            color: '#cbd5f5',
                            lineHeight: 1.6
                        }}
                    >
                        {challenge.description}
                    </Paper>

                    <Button
                        variant="contained"
                        size="large"
                        startIcon={<PlayArrowIcon />}
                        onClick={handleRunCode}
                        disabled={isSubmitting}
                        sx={{
                            py: 1.5,
                            fontWeight: 600,
                            textTransform: 'none'
                        }}
                    >
                        {isSubmitting ? 'Running...' : 'Run Code'}
                    </Button>

                    {/* Reveal Section */}
                    {failCount >= 3 && !revealedSolution && (
                        <Alert severity="warning" icon={<LightbulbIcon />}>
                            Stuck? Try revealing the solution.
                            <Button
                                fullWidth
                                sx={{ mt: 2 }}
                                variant="outlined"
                                onClick={handleRevealSolution}
                            >
                                Reveal Solution
                            </Button>
                            {revealError && (
                                <Typography color="error" sx={{ mt: 1 }}>
                                    {revealError}
                                </Typography>
                            )}
                        </Alert>
                    )}

                    {revealedSolution && (
                        <Paper sx={{ p: 2 }}>
                            <Typography sx={{ fontWeight: 600, mb: 1 }}>
                                Official Solution
                            </Typography>
                            <Box
                                component="pre"
                                sx={{
                                    background: '#020617',
                                    color: '#e2e8f0',
                                    p: 2,
                                    borderRadius: 2,
                                    overflowX: 'auto',
                                    fontSize: 13
                                }}
                            >
                                {revealedSolution}
                            </Box>

                            <Button
                                fullWidth
                                sx={{ mt: 2 }}
                                variant="outlined"
                                onClick={() => setCode(revealedSolution)}
                            >
                                Copy to Editor
                            </Button>
                        </Paper>
                    )}

                    {/* Feedback */}
                    {feedback && (
                        <Paper
                            sx={{
                                p: 2,
                                border:
                                    feedback.status === 'PASS'
                                        ? '1px solid #22c55e'
                                        : '1px solid #ef4444'
                            }}
                        >
                            <Typography
                                color={
                                    feedback.status === 'PASS'
                                        ? 'success.main'
                                        : 'error.main'
                                }
                                sx={{ fontWeight: 700 }}
                            >
                                {feedback.status}
                            </Typography>

                            <Typography variant="body2" sx={{ mb: 1 }}>
                                Time: {feedback.execution_time}s
                            </Typography>

                            <Divider sx={{ my: 1 }} />

                            <Stack spacing={1}>
                                {feedback.results.map((t, i) => (
                                    <Box key={i}>
                                        <Typography variant="body2">
                                            Test {i + 1}:{' '}
                                            {t.passed ? '✅' : '❌'}
                                        </Typography>
                                        <Typography
                                            variant="caption"
                                            sx={{
                                                fontFamily: 'monospace'
                                            }}
                                        >
                                            {t.stdout || 'No output'}
                                        </Typography>
                                    </Box>
                                ))}
                            </Stack>
                        </Paper>
                    )}

                    <Divider sx={{ my: 2 }} />

                    {/* NEW: Pass the key to force re-renders */}
                    <Leaderboard key={leaderboardKey} challengeId={challengeId as string} />
                </Stack>
            </Box>

            {/* RIGHT PANEL */}
            <Box sx={{ width: '62%', p: 2, display: 'flex', alignItems: 'stretch', justifyContent: 'center' }} >
                <Paper elevation={0} sx={{ flex: 1, borderRadius: 3, overflow: 'hidden', border: '1px solid #1e293b', backgroundColor: '#020617', display: 'flex', flexDirection: 'column' }} >
                    <Box sx={{ px: 2, py: 1, borderBottom: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} >
                        <Typography variant="body2" sx={{ color: '#94a3b8' }}> main.py </Typography>
                        <Typography variant="caption" sx={{ color: '#64748b' }}> Python </Typography>
                    </Box>
                    <Box sx={{ flex: 1 }}>
                        <Editor height="100%" defaultLanguage="python" theme="vs-dark" value={code} onChange={(value) => setCode(value || '')} options={{ minimap: { enabled: false }, fontSize: 15, padding: { top: 16 }, scrollBeyondLastLine: false, wordWrap: 'on' }} />
                    </Box>
                </Paper>
            </Box>
        </Box>
    );
};