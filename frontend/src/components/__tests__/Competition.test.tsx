import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Competition from '../Competition';

// Mock the API functions
jest.mock('../../services/api', () => ({
  getCompetitions: jest.fn(),
  createCompetition: jest.fn(),
  updateCompetition: jest.fn(),
  deleteCompetition: jest.fn(),
}));

import { getCompetitions, createCompetition, updateCompetition, deleteCompetition } from '../../services/api';

const mockGetCompetitions = getCompetitions as jest.MockedFunction<typeof getCompetitions>;
const mockCreateCompetition = createCompetition as jest.MockedFunction<typeof createCompetition>;
const mockUpdateCompetition = updateCompetition as jest.MockedFunction<typeof updateCompetition>;
const mockDeleteCompetition = deleteCompetition as jest.MockedFunction<typeof deleteCompetition>;

describe('Competition Component', () => {
  const mockCompetitions = [
    {
      id: 'comp-1',
      business_profile_id: 'profile-1',
      name: 'Acme Widget Co',
      url: 'https://acmewidget.com',
      description: 'Leading supplier of modular widgets',
      usp: 'Largest selection of widget customizations',
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z'
    },
    {
      id: 'comp-2',
      business_profile_id: 'profile-1',
      name: 'Tech Solutions Inc',
      url: 'https://techsolutions.com',
      description: 'Advanced technology solutions',
      usp: 'Cutting-edge innovation',
      created_at: '2025-01-02T00:00:00Z',
      updated_at: '2025-01-02T00:00:00Z'
    }
  ];

  const mockProps = {
    businessProfileId: 'profile-1',
    authToken: 'test-token'
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock successful API responses
    mockGetCompetitions.mockResolvedValue({
      success: true,
      data: mockCompetitions
    });

    mockCreateCompetition.mockResolvedValue({
      success: true,
      data: { id: 'comp-3', message: 'Competition created successfully' }
    });

    mockUpdateCompetition.mockResolvedValue({
      success: true,
      data: { message: 'Competition updated successfully' }
    });

    mockDeleteCompetition.mockResolvedValue({
      success: true,
      data: { message: 'Competition deleted successfully' }
    });
  });

  it('renders loading state initially', () => {
    render(<Competition {...mockProps} />);
    expect(screen.getByText('Konkurencja')).toBeInTheDocument();
  });

  it('displays competitions list after loading', async () => {
    render(<Competition {...mockProps} />);

    await waitFor(() => {
      expect(mockGetCompetitions).toHaveBeenCalledWith('test-token');
    });

    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.queryByText('Brak konkurentów')).not.toBeInTheDocument();
    }, { timeout: 3000 });

    await waitFor(() => {
      expect(screen.getByText('Acme Widget Co')).toBeInTheDocument();
    });
  });

  it('displays competition details correctly', async () => {
    render(<Competition {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText('Acme Widget Co')).toBeInTheDocument();
    });

    // Check if URL and description are displayed
    expect(screen.getByText('https://acmewidget.com')).toBeInTheDocument();
    expect(screen.getByText('Leading supplier of modular widgets')).toBeInTheDocument();
    expect(screen.getByText('Largest selection of widget customizations')).toBeInTheDocument();
  });

  it('opens create competition form', async () => {
    render(<Competition {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText('Acme Widget Co')).toBeInTheDocument();
    });

    const addButton = screen.getByText('Dodaj Konkurenta');
    fireEvent.click(addButton);

    expect(screen.getByText('Utwórz Konkurenta')).toBeInTheDocument();
    expect(screen.getByLabelText('Nazwa Konkurenta')).toBeInTheDocument();
    expect(screen.getByLabelText('Strona Internetowa')).toBeInTheDocument();
    expect(screen.getByLabelText('Opis')).toBeInTheDocument();
    expect(screen.getByLabelText('Unikalna Wartość (USP)')).toBeInTheDocument();
  });

  it('creates new competition successfully', async () => {
    render(<Competition {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText('Acme Widget Co')).toBeInTheDocument();
    });

    // Open create form
    const addButton = screen.getByText('Add Competition');
    fireEvent.click(addButton);

    // Fill form
    fireEvent.change(screen.getByLabelText('Nazwa Konkurenta'), {
      target: { value: 'New Competition Co' }
    });
    fireEvent.change(screen.getByLabelText('Strona Internetowa'), {
      target: { value: 'https://newcompetition.com' }
    });
    fireEvent.change(screen.getByLabelText('Opis'), {
      target: { value: 'A new competitor' }
    });
    fireEvent.change(screen.getByLabelText('Unikalna Wartość (USP)'), {
      target: { value: 'Best prices' }
    });

    // Submit form
    const submitButton = screen.getByText('Utwórz Konkurenta');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockCreateCompetition).toHaveBeenCalledWith('profile-1', {
        name: 'New Competition Co',
        url: 'https://newcompetition.com',
        description: 'A new competitor',
        usp: 'Best prices'
      }, 'test-token');
    });

    // Check if success message is shown
    await waitFor(() => {
      expect(screen.getByText('Competition created successfully!')).toBeInTheDocument();
    });
  });

  it('handles create competition API error', async () => {
    mockCreateCompetition.mockResolvedValue({
      success: false,
      error: 'Failed to create competition'
    });

    render(<Competition {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText('Acme Widget Co')).toBeInTheDocument();
    });

    // Open create form and submit
    const addButton = screen.getByText('Dodaj Konkurenta');
    fireEvent.click(addButton);

    fireEvent.change(screen.getByLabelText('Nazwa Konkurenta'), {
      target: { value: 'Error Competition' }
    });

    const submitButton = screen.getByText('Utwórz Konkurenta');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Error Competition')).toBeInTheDocument();
    });
  });

  it('opens edit competition form', async () => {
    render(<Competition {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText('Acme Widget Co')).toBeInTheDocument();
    });

    // Find and click edit button for first competition
    const editButtons = screen.getAllByText('Edytuj');
    fireEvent.click(editButtons[0]);

    expect(screen.getByText('Edytuj Konkurenta')).toBeInTheDocument();

    // Check if form is pre-filled
    const nameInput = screen.getByLabelText('Nazwa Konkurenta') as HTMLInputElement;
    expect(nameInput.value).toBe('Acme Widget Co');
  });

  it('updates competition successfully', async () => {
    render(<Competition {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText('Acme Widget Co')).toBeInTheDocument();
    });

    // Open edit form
    const editButtons = screen.getAllByText('Edytuj');
    fireEvent.click(editButtons[0]);

    // Modify form
    fireEvent.change(screen.getByLabelText('Nazwa Konkurenta'), {
      target: { value: 'Updated Competition Co' }
    });

    // Submit form
    const submitButton = screen.getByText('Zaktualizuj Konkurenta');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockUpdateCompetition).toHaveBeenCalledWith('comp-1', {
        name: 'Updated Competition Co',
        url: 'https://acmewidget.com',
        description: 'Leading supplier of modular widgets',
        usp: 'Largest selection of widget customizations'
      }, 'test-token');
    });
  });

  it('deletes competition successfully', async () => {
    // Mock window.confirm to return true
    window.confirm = jest.fn(() => true);

    render(<Competition {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText('Acme Widget Co')).toBeInTheDocument();
    });

    // Find and click delete button
    const deleteButtons = screen.getAllByText('Usuń');
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(mockDeleteCompetition).toHaveBeenCalledWith('comp-1', 'test-token');
    });

    // Check if competition was removed from UI
    await waitFor(() => {
      expect(screen.queryByText('Acme Widget Co')).not.toBeInTheDocument();
    });
  });

  it('cancels delete operation when user declines', async () => {
    // Mock window.confirm to return false
    window.confirm = jest.fn(() => false);

    render(<Competition {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText('Acme Widget Co')).toBeInTheDocument();
    });

    // Try to delete
    const deleteButtons = screen.getAllByText('Usuń');
    fireEvent.click(deleteButtons[0]);

    // Should not call delete API
    expect(mockDeleteCompetition).not.toHaveBeenCalled();

    // Competition should still be visible
    expect(screen.getByText('Acme Widget Co')).toBeInTheDocument();
  });

  it('handles API loading states', async () => {
    render(<Competition {...mockProps} />);

    // Should show loading initially (skeleton should be present)
    expect(screen.getByText('Konkurencja')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Acme Widget Co')).toBeInTheDocument();
    });

    // Should not show loading skeleton anymore
    // The skeleton elements should be replaced by actual content
    expect(screen.getAllByText('Acme Widget Co')).toHaveLength(2); // One in header, one in card
  });

  it('handles API errors gracefully', async () => {
    mockGetCompetitions.mockResolvedValue({
      success: false,
      error: 'Failed to load competitions'
    });

    render(<Competition {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText('Konkurencja')).toBeInTheDocument();
    });

    // Should not show competitions list
    expect(screen.queryByText('Acme Widget Co')).not.toBeInTheDocument();
  });

  it('shows empty state when no competitions exist', async () => {
    mockGetCompetitions.mockResolvedValue({
      success: true,
      data: []
    });

    render(<Competition {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText('Brak konkurentów')).toBeInTheDocument();
      expect(screen.getByText('Dodaj swojego pierwszego konkurenta, aby rozpocząć analizę rynku')).toBeInTheDocument();
    });
  });

  it('validates form inputs', async () => {
    render(<Competition {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText('Acme Widget Co')).toBeInTheDocument();
    });

    // Open create form
    const addButton = screen.getByText('Dodaj Konkurenta');
    fireEvent.click(addButton);

    // Try to submit without name
    const submitButton = screen.getByText('Utwórz Konkurenta');
    fireEvent.click(submitButton);

    // Should show validation error
    expect(screen.getByText('Nazwa konkurenta jest wymagana')).toBeInTheDocument();

    // Fill name and try again
    fireEvent.change(screen.getByLabelText('Nazwa Konkurenta'), {
      target: { value: 'Valid Competition' }
    });

    fireEvent.click(submitButton);

    // Should not show validation error
    expect(screen.queryByText('Nazwa konkurenta jest wymagana')).not.toBeInTheDocument();
  });

  it('closes forms when cancel is clicked', async () => {
    render(<Competition {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText('Acme Widget Co')).toBeInTheDocument();
    });

    // Open create form
    const addButton = screen.getByText('Dodaj Konkurenta');
    fireEvent.click(addButton);

    expect(screen.getByText('Utwórz Konkurenta')).toBeInTheDocument();

    // Click cancel
    const cancelButton = screen.getByText('Anuluj');
    fireEvent.click(cancelButton);

    // Form should be closed
    expect(screen.queryByText('Utwórz Konkurenta')).not.toBeInTheDocument();
  });
});
