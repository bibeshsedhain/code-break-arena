import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import { Dashboard } from '../Dashboard';
import apiClient from '../../api';

// Mock our custom API client and Firebase
vi.mock('../../api');
vi.mock('../../firebase', () => ({ auth: { signOut: vi.fn() } }));

describe('Dashboard Component', () => {
    it('shows the empty state when no challenges exist from the API', async () => {
        // Fake the Django API returning an empty array
        (apiClient.get as any).mockResolvedValue({ data: [] });

        render(<BrowserRouter><Dashboard /></BrowserRouter>);

        // Wait for the loading state to finish and check the UI
        await waitFor(() => {
            // Updated to match your exact UI text!
            expect(screen.getByText('No targets available')).toBeInTheDocument();
            expect(screen.getByText('Create your first challenge')).toBeInTheDocument();
        });
    });
});