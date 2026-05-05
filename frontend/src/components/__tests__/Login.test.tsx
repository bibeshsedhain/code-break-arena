import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import { Login } from '../Login';

// Mock Firebase so it doesn't crash trying to connect to the real internet
vi.mock('../../firebase', () => ({
    auth: {}
}));

vi.mock('firebase/auth', () => ({
    signInWithEmailAndPassword: vi.fn(),
    createUserWithEmailAndPassword: vi.fn(),
    signInAnonymously: vi.fn(),
    GoogleAuthProvider: vi.fn(),
    signInWithPopup: vi.fn()
}));

describe('Login Component', () => {
    it('renders the initial sign-in view correctly', () => {
        render(<BrowserRouter><Login /></BrowserRouter>);
        
        expect(screen.getByText('Code-Break')).toBeInTheDocument();
        expect(screen.getByText('Welcome back, developer')).toBeInTheDocument();
        expect(screen.getByText('Continue with Google')).toBeInTheDocument();
    });

    it('toggles to the registration view when clicked', () => {
        render(<BrowserRouter><Login /></BrowserRouter>);
        
        const toggleBtn = screen.getByText('Need an account? Register Here');
        fireEvent.click(toggleBtn);
        
        expect(screen.getByText('Join the community of makers')).toBeInTheDocument();
        expect(screen.getByText('Already have an account? Sign In')).toBeInTheDocument();
    });
});