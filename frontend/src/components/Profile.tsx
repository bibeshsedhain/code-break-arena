import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api';

interface SolvingStat {
    challenge_title: string;
    attempts: number;
    completed: boolean;
    best_time: number | null;
}

interface CreatedChallenge {
    challenge_id: string;
    title: string;
    difficulty: string;
}

interface ProfileData {
    stats: SolvingStat[];
    created_challenges: CreatedChallenge[];
}

export const Profile: React.FC = () => {
    const [profileData, setProfileData] = useState<ProfileData | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchProfileData();
    }, []);

    const fetchProfileData = async () => {
        try {
            const response = await apiClient.get('/challenges/my_profile/');
            setProfileData(response.data);
        } catch (error) {
            console.error("Failed to fetch profile data", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteChallenge = async (challengeId: string) => {
        const confirmDelete = window.confirm("Are you sure you want to permanently delete this challenge?");
        if (!confirmDelete) return;

        try {
            await apiClient.delete(`/challenges/${challengeId}/`);
            // Refresh the data to remove the deleted challenge from the list
            fetchProfileData();
        } catch (error: any) {
            console.error("Failed to delete:", error);
            if (error.response?.status === 403) {
                alert("You do not have permission to delete this challenge.");
            } else {
                alert("Error deleting challenge.");
            }
        }
    };

    if (loading) return <div style={{ padding: '20px' }}>Loading your stats...</div>;
    if (!profileData) return <div style={{ padding: '20px' }}>Failed to load profile.</div>;

    return (
        <div style={{ maxWidth: '900px', margin: '40px auto', fontFamily: 'sans-serif' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #eee', paddingBottom: '20px' }}>
                <h2 style={{ margin: 0 }}>👤 My Profile</h2>
                <button onClick={() => navigate('/dashboard')} style={{ padding: '8px 16px', cursor: 'pointer' }}>Back to Dashboard</button>
            </div>

            <div style={{ display: 'flex', gap: '30px', marginTop: '30px' }}>
                
                {/* Left Column: Taker Stats */}
                <div style={{ flex: 1 }}>
                    <h3>My Solving Stats</h3>
                    {profileData.stats.length === 0 ? (
                        <p style={{ color: 'gray' }}>You haven't attempted any challenges yet!</p>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid #ccc', textAlign: 'left' }}>
                                    <th style={{ padding: '8px' }}>Challenge</th>
                                    <th style={{ padding: '8px' }}>Status</th>
                                    <th style={{ padding: '8px' }}>Attempts</th>
                                    <th style={{ padding: '8px' }}>Best Time</th>
                                </tr>
                            </thead>
                            <tbody>
                                {profileData.stats.map((stat, idx) => (
                                    <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                                        <td style={{ padding: '10px 8px' }}>{stat.challenge_title}</td>
                                        <td style={{ padding: '10px 8px', color: stat.completed ? 'green' : 'red' }}>
                                            {stat.completed ? '✅ Passed' : '❌ Failed'}
                                        </td>
                                        <td style={{ padding: '10px 8px' }}>{stat.attempts}</td>
                                        <td style={{ padding: '10px 8px' }}>{stat.best_time ? `${stat.best_time.toFixed(3)}s` : 'N/A'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Right Column: Maker Portfolio */}
                <div style={{ flex: 1, backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '8px' }}>
                    <h3 style={{ marginTop: 0 }}>My Created Challenges</h3>
                    {profileData.created_challenges.length === 0 ? (
                        <p style={{ color: 'gray' }}>You haven't created any challenges yet.</p>
                    ) : (
                        <ul style={{ listStyleType: 'none', padding: 0 }}>
                            {profileData.created_challenges.map((challenge) => (
                                <li key={challenge.challenge_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: '15px', marginBottom: '10px', borderRadius: '5px', border: '1px solid #ddd' }}>
                                    <div>
                                        <strong>{challenge.title}</strong>
                                        <span style={{ marginLeft: '10px', fontSize: '12px', color: 'gray' }}>({challenge.difficulty})</span>
                                    </div>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        {/* Edit button placeholder for future expansion */}
                                        <button 
                                            onClick={() => alert("Edit routing goes here!")}
                                            style={{ padding: '5px 10px', backgroundColor: '#ffc107', border: 'none', borderRadius: '3px', cursor: 'pointer' }}
                                        >
                                            Edit
                                        </button>
                                        <button 
                                            onClick={() => handleDeleteChallenge(challenge.challenge_id)}
                                            style={{ padding: '5px 10px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

            </div>
        </div>
    );
};