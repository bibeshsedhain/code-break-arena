import React, { useEffect, useState } from 'react';
import { 
    Box, 
    Typography, 
    Stack, 
    CircularProgress, 
    Paper,
    Divider 
} from '@mui/material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import apiClient from '../api';

interface LeaderboardEntry {
    username: string;
    best_time: number;
    attempts: number;
}

interface LeaderboardProps {
    challengeId: string;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ challengeId }) => {
    const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                const response = await apiClient.get(`/challenges/${challengeId}/leaderboard/`);
                setEntries(response.data);
            } catch (error) {
                console.error("Failed to fetch leaderboard", error);
            } finally {
                setLoading(false);
            }
        };

        if (challengeId) {
            fetchLeaderboard();
        }
    }, [challengeId]);

    const getTrophyColor = (index: number) => {
        if (index === 0) return '#fbbf24'; // Gold
        if (index === 1) return '#94a3b8'; // Silver
        if (index === 2) return '#b45309'; // Bronze
        return 'transparent';
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress size={24} sx={{ color: '#3b82f6' }} />
            </Box>
        );
    }

    return (
        <Box sx={{ mt: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
                <EmojiEventsIcon sx={{ color: '#fbbf24' }} />
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#f8fafc' }}>
                    Top Hackers
                </Typography>
            </Box>

            {entries.length === 0 ? (
                <Paper 
                    elevation={0} 
                    sx={{ p: 3, textAlign: 'center', bgcolor: 'rgba(15, 23, 42, 0.4)', border: '1px dashed #1e293b', borderRadius: 2 }}
                >
                    <Typography variant="body2" sx={{ color: '#64748b' }}>
                        No one has solved this yet. Be the first!
                    </Typography>
                </Paper>
            ) : (
                <Stack spacing={1}>
                    {entries.map((entry, index) => (
                        <Paper
                            key={index}
                            elevation={0}
                            sx={{
                                p: 1.5,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                bgcolor: index === 0 ? 'rgba(251, 191, 36, 0.05)' : '#020617',
                                border: '1px solid',
                                borderColor: index === 0 ? 'rgba(251, 191, 36, 0.2)' : '#1e293b',
                                borderRadius: 2,
                            }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <Typography 
                                    variant="caption" 
                                    sx={{ 
                                        fontWeight: 800, 
                                        color: getTrophyColor(index),
                                        minWidth: '20px',
                                        textAlign: 'center'
                                    }}
                                >
                                    {index < 3 ? <EmojiEventsIcon fontSize="small" /> : `#${index + 1}`}
                                </Typography>
                                <Typography variant="body2" sx={{ fontWeight: index === 0 ? 700 : 500, color: '#e2e8f0' }}>
                                    {entry.username.split('@')[0]} {/* Clean up emails to just show prefix */}
                                </Typography>
                            </Box>

                            <Box sx={{ textAlign: 'right' }}>
                                <Typography variant="body2" sx={{ fontWeight: 700, color: '#34d399' }}>
                                    {entry.best_time}s
                                </Typography>
                                <Typography variant="caption" sx={{ color: '#64748b' }}>
                                    {entry.attempts} {entry.attempts === 1 ? 'attempt' : 'attempts'}
                                </Typography>
                            </Box>
                        </Paper>
                    ))}
                </Stack>
            )}
        </Box>
    );
};