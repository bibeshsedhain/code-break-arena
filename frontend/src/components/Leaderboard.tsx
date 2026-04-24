import React, { useEffect, useState } from 'react';
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
    const [leaders, setLeaders] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                const response = await apiClient.get(`/challenges/${challengeId}/leaderboard/`);
                setLeaders(response.data);
            } catch (error) {
                console.error("Failed to fetch leaderboard data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchLeaderboard();
    }, [challengeId]);

    if (loading) return <p style={{ fontSize: '14px', color: 'gray' }}>Loading Top Coders...</p>;

    if (leaders.length === 0) return <p style={{ fontSize: '14px', color: 'gray' }}>No successful attempts yet. Be the first!</p>;

    return (
        <div style={{ marginTop: '15px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '5px', border: '1px solid #dee2e6' }}>
            <h4 style={{ margin: '0 0 10px 0' }}>🏆 Optimization Leaderboard</h4>
            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                    <tr style={{ borderBottom: '2px solid #ccc' }}>
                        <th style={{ paddingBottom: '5px' }}>Rank</th>
                        <th style={{ paddingBottom: '5px' }}>Coder</th>
                        <th style={{ paddingBottom: '5px' }}>Time (s)</th>
                        <th style={{ paddingBottom: '5px' }}>Attempts</th>
                    </tr>
                </thead>
                <tbody>
                    {leaders.map((leader, index) => (
                        <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
                            <td style={{ padding: '8px 0', fontWeight: 'bold' }}>#{index + 1}</td>
                            <td style={{ padding: '8px 0' }}>{leader.username.split('@')[0]}</td> {/* Strips email domain for privacy */}
                            <td style={{ padding: '8px 0', color: '#28a745', fontWeight: 'bold' }}>{leader.best_time}</td>
                            <td style={{ padding: '8px 0' }}>{leader.attempts}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};