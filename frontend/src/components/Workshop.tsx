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
    { value: 'EZ', label: 'Easy' },
    { value: 'MD', label: 'Medium' },
    { value: 'HD', label: 'Hard' },
];

export const Workshop: React.FC = () => {
    const navigate = useNavigate();
    const { challengeId } = useParams<{ challengeId: string }>();

    const [isPublishing, setIsPublishing] = useState(false);
    const [isLoading, setIsLoading] = useState(!!challengeId);

    // Form State
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
        <Box sx={{ minHeight: '100vh', background: '#f8fafc', py: 6 }}>
            <Container maxWidth="md">
                {/* Header Navigation */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                    <Button 
                        startIcon={<ArrowBackIcon />} 
                        onClick={() => navigate(challengeId ? '/profile' : '/dashboard')}
                        sx={{ textTransform: 'none', color: 'text.secondary' }}
                    >
                        Cancel
                    </Button>
                    <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: -0.5 }}>
                        {challengeId ? 'Edit Challenge' : 'Maker Workshop'}
                    </Typography>
                </Box>

                <form onSubmit={handleSubmit}>
                    <Stack spacing={4}>
                        {/* Section 1: Basic Info */}
                        <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid #e2e8f0' }} elevation={0}>
                            <Stack spacing={3}>
                                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                                    <TextField
                                        required
                                        fullWidth
                                        label="Challenge Title"
                                        placeholder="e.g. Reverse a String"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                    />
                                    <TextField
                                        select
                                        label="Difficulty"
                                        value={difficulty}
                                        onChange={(e) => setDifficulty(e.target.value)}
                                        sx={{ minWidth: 150 }}
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
                                    rows={3}
                                    label="Description & Instructions"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                />
                            </Stack>
                        </Paper>

                        {/* Section 2: Logic Design */}
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, px: 1 }}>
                            Logic Design
                        </Typography>
                        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                            <Card sx={{ flex: 1, borderRadius: 3, border: '1px solid #e2e8f0', overflow: 'hidden' }} elevation={0}>
                                <Box sx={{ px: 2, py: 1, background: '#f1f5f9', borderBottom: '1px solid #e2e8f0' }}>
                                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b' }}>STARTER CODE</Typography>
                                </Box>
                                <Box sx={{ height: 300 }}>
                                    <Editor height="100%" defaultLanguage="python" theme="vs-dark" value={starterCode} onChange={(v) => setStarterCode(v || '')} options={{ minimap: { enabled: false }, fontSize: 14 }} />
                                </Box>
                            </Card>

                            <Card sx={{ flex: 1, borderRadius: 3, border: '1px solid #e2e8f0', overflow: 'hidden' }} elevation={0}>
                                <Box sx={{ px: 2, py: 1, background: '#f1f5f9', borderBottom: '1px solid #e2e8f0' }}>
                                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b' }}>OFFICIAL SOLUTION (HIDDEN)</Typography>
                                </Box>
                                <Box sx={{ height: 300 }}>
                                    <Editor height="100%" defaultLanguage="python" theme="vs-dark" value={solutionCode} onChange={(v) => setSolutionCode(v || '')} options={{ minimap: { enabled: false }, fontSize: 14 }} />
                                </Box>
                            </Card>
                        </Stack>

                        {/* Section 3: Test Cases */}
                        <Paper sx={{ p: 3, borderRadius: 3, border: '1px solid #e2e8f0' }} elevation={0}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                                <Typography variant="h6" sx={{ fontWeight: 700 }}>Test Cases</Typography>
                                <Button 
                                    size="small" 
                                    startIcon={<AddIcon />} 
                                    onClick={handleAddTestCase} 
                                    sx={{ textTransform: 'none' }}
                                >
                                    Add Case
                                </Button>
                            </Box>
                            <Stack spacing={2}>
                                {testCases.map((tc, index) => (
                                    <Box key={index} sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', p: 2, background: '#f8fafc', borderRadius: 2 }}>
                                        <Typography sx={{ fontWeight: 700, mt: 1, color: 'text.secondary' }}>#{index + 1}</Typography>
                                        <Stack spacing={2} sx={{ flexGrow: 1 }}>
                                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                                                <TextField
                                                    required
                                                    fullWidth
                                                    size="small"
                                                    label="Input Data"
                                                    value={tc.input_data}
                                                    onChange={(e) => handleTestCaseChange(index, 'input_data', e.target.value)}
                                                    InputProps={{ sx: { fontFamily: 'monospace', fontSize: 13 } }}
                                                />
                                                <TextField
                                                    required
                                                    fullWidth
                                                    size="small"
                                                    label="Expected Output"
                                                    value={tc.expected_output}
                                                    onChange={(e) => handleTestCaseChange(index, 'expected_output', e.target.value)}
                                                    InputProps={{ sx: { fontFamily: 'monospace', fontSize: 13 } }}
                                                />
                                            </Stack>
                                            <FormControlLabel
                                                control={<Checkbox size="small" checked={tc.hidden_flag} onChange={(e) => handleTestCaseChange(index, 'hidden_flag', e.target.checked)} />}
                                                label={<Typography variant="caption">Hidden Case (Doesn't show stdout to Takers)</Typography>}
                                            />
                                        </Stack>
                                        <IconButton color="error" onClick={() => handleRemoveTestCase(index)} sx={{ mt: 0.5 }}>
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    </Box>
                                ))}
                            </Stack>
                        </Paper>

                        <Button
                            type="submit"
                            disabled={isPublishing}
                            variant="contained"
                            size="large"
                            startIcon={challengeId ? <SaveIcon /> : <RocketLaunchIcon />}
                            sx={{
                                py: 2,
                                borderRadius: 3,
                                fontWeight: 700,
                                textTransform: 'none',
                                fontSize: '1.1rem',
                                boxShadow: '0 10px 15px -3px rgba(59, 130, 246, 0.3)'
                            }}
                        >
                            {isPublishing ? 'Processing...' : (challengeId ? 'Update Challenge' : 'Publish to Dashboard')}
                        </Button>
                    </Stack>
                </form>
            </Container>
        </Box>
    );
};