import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import {
    Box,
    Button,
    Container,
    Typography,
    TextField,
    MenuItem,
    Paper,
    Stack,
    IconButton,
    Checkbox,
    FormControlLabel,
    CircularProgress,
    Card,
} from '@mui/material';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import SaveIcon from '@mui/icons-material/Save';

import apiClient from '../api';

const difficulties = [
    { value: 'EZ', label: '🟢 Easy' },
    { value: 'MD', label: '🟡 Medium' },
    { value: 'HD', label: '🔴 Hard' },
];

export const Workshop: React.FC = () => {
    const navigate = useNavigate();
    const { challengeId } = useParams<{ challengeId: string }>();

    const [isPublishing, setIsPublishing] = useState(false);
    const [isLoading, setIsLoading] = useState(!!challengeId);

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [difficulty, setDifficulty] = useState('MD');
    const [starterCode, setStarterCode] = useState('def solution():\n    pass');
    const [solutionCode, setSolutionCode] = useState('def solution():\n    return True');
    const [testCases, setTestCases] = useState<any[]>([
        { input_data: 'print(solution())', expected_output: 'True', hidden_flag: false }
    ]);

    useEffect(() => {
        const fetchExistingChallenge = async () => {
            try {
                const response = await apiClient.get(`/challenges/${challengeId}/`);
                const data = response.data;
                setTitle(data.title);
                setDescription(data.description);
                setDifficulty(data.difficulty);
                setStarterCode(data.starter_code);
                setSolutionCode(data.solution_code);
                if (data.test_cases?.length > 0) setTestCases(data.test_cases);
            } catch (error) {
                console.error("Failed to load challenge data:", error);
                navigate('/profile');
            } finally {
                setIsLoading(false);
            }
        };

        if (challengeId) fetchExistingChallenge();
    }, [challengeId, navigate]);

    const handleAddTestCase = () => {
        setTestCases([...testCases, { input_data: '', expected_output: '', hidden_flag: true }]);
    };

    const handleRemoveTestCase = (index: number) => {
        setTestCases(testCases.filter((_, i) => i !== index));
    };

    const handleTestCaseChange = (index: number, field: string, value: any) => {
        const newTestCases = [...testCases];
        newTestCases[index] = { ...newTestCases[index], [field]: value };
        setTestCases(newTestCases);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsPublishing(true);

        const payload = { title, description, difficulty, starter_code: starterCode, solution_code: solutionCode, test_cases: testCases };

        try {
            if (challengeId) {
                await apiClient.put(`/challenges/${challengeId}/`, payload);
                navigate('/profile');
            } else {
                await apiClient.post('/challenges/', payload);
                navigate('/dashboard');
            }
        } catch (error) {
            console.error("Failed to publish:", error);
        } finally {
            setIsPublishing(false);
        }
    };

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ minHeight: '100vh', background: '#f1f5f9', py: 6 }}>
            <Container maxWidth="md">
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Button 
                        startIcon={<ArrowBackIcon />} 
                        onClick={() => navigate(challengeId ? '/profile' : '/dashboard')}
                        sx={{ textTransform: 'none', color: '#64748b', fontWeight: 600 }}
                    >
                        Discard
                    </Button>
                    <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="h5" sx={{ fontWeight: 800, color: '#1e293b' }}>
                            {challengeId ? 'Edit Challenge' : 'Maker Workshop'}
                        </Typography>
                    </Box>
                </Box>

                <form onSubmit={handleSubmit}>
                    <Stack spacing={3}>
                        <Paper sx={{ p: 4, borderRadius: 4, border: '1px solid #e2e8f0' }} elevation={0}>
                            <Typography variant="overline" sx={{ color: '#3b82f6', fontWeight: 800 }}>Phase 1: Metadata</Typography>
                            <Stack spacing={3} sx={{ mt: 2 }}>
                                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                                    <TextField
                                        required
                                        fullWidth
                                        label="Challenge Title"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                    />
                                    <TextField
                                        select
                                        label="Difficulty"
                                        value={difficulty}
                                        onChange={(e) => setDifficulty(e.target.value)}
                                        sx={{ minWidth: 160 }}
                                    >
                                        {difficulties.map((option) => (
                                            <MenuItem key={option.value} value={option.value}>
                                                {option.label}
                                            </MenuItem>
                                        ))}
                                    </TextField>
                                </Stack>
                                <TextField
                                    required
                                    fullWidth
                                    multiline
                                    rows={4}
                                    label="Problem Description"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                />
                            </Stack>
                        </Paper>

                        <Box>
                            <Typography variant="overline" sx={{ color: '#3b82f6', fontWeight: 800, ml: 1 }}>Phase 2: Logic Design</Typography>
                            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mt: 1 }}>
                                <Card sx={{ flex: 1, borderRadius: 4, border: '1px solid #1e293b', overflow: 'hidden', bgcolor: '#0f172a' }}>
                                    <Box sx={{ px: 2, py: 1, background: '#1e293b' }}>
                                        <Typography sx={{ fontSize: 11, fontWeight: 800, color: '#94a3b8' }}>STARTER_CODE.PY</Typography>
                                    </Box>
                                    <Box sx={{ height: 280 }}>
                                        <Editor height="100%" defaultLanguage="python" theme="vs-dark" value={starterCode} onChange={(v) => setStarterCode(v || '')} options={{ minimap: { enabled: false }, fontSize: 14 }} />
                                    </Box>
                                </Card>
                                <Card sx={{ flex: 1, borderRadius: 4, border: '1px solid #1e293b', overflow: 'hidden', bgcolor: '#0f172a' }}>
                                    <Box sx={{ px: 2, py: 1, background: '#1e293b' }}>
                                        <Typography sx={{ fontSize: 11, fontWeight: 800, color: '#34d399' }}>HIDDEN_SOLUTION.PY</Typography>
                                    </Box>
                                    <Box sx={{ height: 280 }}>
                                        <Editor height="100%" defaultLanguage="python" theme="vs-dark" value={solutionCode} onChange={(v) => setSolutionCode(v || '')} options={{ minimap: { enabled: false }, fontSize: 14 }} />
                                    </Box>
                                </Card>
                            </Stack>
                        </Box>

                        <Paper sx={{ p: 4, borderRadius: 4, border: '1px solid #e2e8f0' }} elevation={0}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                                <Typography variant="h6" sx={{ fontWeight: 800 }}>Test Suite</Typography>
                                <Button variant="outlined" size="small" startIcon={<AddIcon />} onClick={handleAddTestCase}>
                                    New Case
                                </Button>
                            </Box>
                            <Stack spacing={2}>
                                {testCases.map((tc, index) => (
                                    <Box key={index} sx={{ p: 3, background: '#f8fafc', borderRadius: 3, border: '1px solid #cbd5e1' }}>
                                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                                            <TextField
                                                required
                                                fullWidth
                                                label={`Input #${index + 1}`}
                                                value={tc.input_data}
                                                onChange={(e) => handleTestCaseChange(index, 'input_data', e.target.value)}
                                                slotProps={{ input: { style: { fontFamily: 'monospace', fontSize: 13, backgroundColor: 'white' } } }}
                                            />
                                            <TextField
                                                required
                                                fullWidth
                                                label="Expected Output"
                                                value={tc.expected_output}
                                                onChange={(e) => handleTestCaseChange(index, 'expected_output', e.target.value)}
                                                slotProps={{ input: { style: { fontFamily: 'monospace', fontSize: 13, backgroundColor: 'white' } } }}
                                            />
                                            <IconButton color="error" onClick={() => handleRemoveTestCase(index)} sx={{ alignSelf: 'center' }}>
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        </Stack>
                                        <FormControlLabel
                                            sx={{ mt: 1, ml: 0 }}
                                            control={<Checkbox size="small" checked={tc.hidden_flag} onChange={(e) => handleTestCaseChange(index, 'hidden_flag', e.target.checked)} />}
                                            label={<Typography variant="caption">Hidden case</Typography>}
                                        />
                                    </Box>
                                ))}
                            </Stack>
                        </Paper>

                        <Button
                            type="submit"
                            disabled={isPublishing}
                            variant="contained"
                            fullWidth
                            startIcon={challengeId ? <SaveIcon /> : <RocketLaunchIcon />}
                            sx={{
                                py: 2,
                                borderRadius: 4,
                                fontWeight: 800,
                                fontSize: '1.1rem',
                                background: 'linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)'
                            }}
                        >
                            {isPublishing ? 'Saving...' : (challengeId ? 'Update Challenge' : 'Launch Challenge')}
                        </Button>
                    </Stack>
                </form>
            </Container>
        </Box>
    );
};