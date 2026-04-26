import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
                console.error("Failed to fetch challenges:", error);
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

    if (loading) return <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>Loading the Arena Lobby...</div>;

    return (
        <div style={{ maxWidth: '800px', margin: '40px auto', fontFamily: 'sans-serif' }}>
            {/* Header Section with Navigation */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #eee', paddingBottom: '20px' }}>
                <h2 style={{ margin: 0 }}>Challenge Dashboard</h2>

                <div style={{ display: 'flex', gap: '15px' }}>
                    <button
                        onClick={() => navigate('/workshop')}
                        style={{ padding: '8px 16px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                        + Create Challenge
                    </button>
                    <button
                        onClick={() => navigate('/profile')}
                        style={{ padding: '8px 16px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    >
                        👤 Profile
                    </button>
                    <button
                        onClick={handleLogout}
                        style={{ padding: '8px 16px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    >
                        Logout
                    </button>
                </div>
            </div>

            {/* Challenge List Section */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '20px' }}>
                {challenges.map((challenge) => (
                    <div key={challenge.challenge_id} style={{ border: '1px solid #ccc', padding: '20px', borderRadius: '8px', backgroundColor: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                        <h3 style={{ marginTop: 0 }}>
                            {challenge.title} <span style={{ fontSize: '0.8em', color: '#6c757d', fontWeight: 'normal' }}>({challenge.difficulty})</span>
                        </h3>
                        <p style={{ color: '#333', lineHeight: '1.5' }}>{challenge.description}</p>

                        <button
                            onClick={() => navigate(`/arena/${challenge.challenge_id}`)}
                            style={{ marginTop: '20px', padding: '12px 24px', fontSize: '16px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', width: '100%' }}
                        >
                            Enter Arena
                        </button>
                    </div>
                ))}

                {challenges.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '40px', backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px dashed #ccc' }}>
                        <p style={{ color: '#6c757d' }}>No challenges available yet. Jump into the Workshop to make one!</p>
                    </div>
                )}
            </div>
        </div>
    );
};