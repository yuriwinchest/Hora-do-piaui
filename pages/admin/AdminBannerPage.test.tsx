import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { axe } from 'jest-axe';
import AdminBannerPage from './AdminBannerPage';

// Mock Supabase
vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => {
      const chain = {
        select: vi.fn(() => chain),
        single: vi.fn().mockResolvedValue({
          data: {
            id: '1',
            title: 'Test Banner',
            video_url: 'https://youtube.com/test',
            alignment: 'left',
            is_active: true,
          },
          error: null,
        }),
        update: vi.fn().mockResolvedValue({ error: null }),
        insert: vi.fn().mockResolvedValue({ error: null }),
        eq: vi.fn(() => chain)
      };
      return chain;
    }),
  },
}));

describe('AdminBannerPage ARIA attributes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders active toggle checkbox with correct checked state', async () => {
    render(<AdminBannerPage />);

    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.queryByText('Banner Dinâmico')).toBeInTheDocument();
    });

    const toggleCheckbox = screen.getByRole('checkbox', { name: /Exibir Banner no Site/i });
    expect(toggleCheckbox).toBeInTheDocument();

    expect(toggleCheckbox).toBeChecked();

    fireEvent.click(toggleCheckbox);
    expect(toggleCheckbox).not.toBeChecked();

    fireEvent.click(toggleCheckbox);
    expect(toggleCheckbox).toBeChecked();
  });

  it('renders alignment radios with correct checked state', async () => {
    render(<AdminBannerPage />);

    await waitFor(() => {
      expect(screen.queryByText('Banner Dinâmico')).toBeInTheDocument();
    });

    const rightRadio = screen.getByRole('radio', { name: /Vídeo à Direita/i });
    const leftRadio = screen.getByRole('radio', { name: /Vídeo à Esquerda/i });

    expect(leftRadio).toBeChecked();
    expect(rightRadio).not.toBeChecked();

    fireEvent.click(rightRadio);
    expect(leftRadio).not.toBeChecked();
    expect(rightRadio).toBeChecked();
  });

  it('does not have obvious accessibility violations', async () => {
    const { container } = render(<AdminBannerPage />);

    await waitFor(() => {
      expect(screen.queryByText('Banner Dinâmico')).toBeInTheDocument();
    });

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
