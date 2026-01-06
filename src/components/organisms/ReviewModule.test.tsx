import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { ReviewModule } from './ReviewModule';
import { generateDiffFile } from '@git-diff-view/file';

// Mocks
vi.mock('@git-diff-view/file', () => ({
    generateDiffFile: vi.fn(() => ({
        init: vi.fn(),
        buildSplitDiffLines: vi.fn(),
    })),
    DiffFile: vi.fn(),
}));

vi.mock('@git-diff-view/react', () => ({
    DiffView: () => <div data-testid="diff-view">DiffView Content</div>,
    DiffModeEnum: { Split: 'split' },
}));

vi.mock('../molecules/ReviewSidebar', () => ({
    ReviewSidebar: () => <div>Sidebar</div>
}));

// Mock browser utils
vi.mock('../../utils/browser', () => ({
    openUrl: vi.fn()
}));

// Mock octokit since it's passed as prop but used in useEffects
const mockOctokit = {
    rest: {
        repos: {
            getContent: vi.fn()
        }
    }
};

describe('ReviewModule', () => {
    const mockMr: any = {
        id: 1,
        title: 'Test MR',
        repository: 'owner/repo',
        head_sha: 'sha123',
        base_ref: 'main',
        files: [
            {
                filename: 'test.ts',
                patch: '@@ -1,1 +1,1 @@\n-old\n+new',
                status: 'modified'
            }
        ]
    };

    const defaultProps = {
        mr: mockMr,
        currentIndex: 0,
        setCurrentIndex: vi.fn(),
        fileListWidth: 300,
        isResizing: false,
        startResizing: vi.fn(),
        scrollRef: React.createRef() as React.RefObject<HTMLDivElement>,
        octokit: mockOctokit,
        diffColors: {
            addedBackground: '#000',
            addedGutterBackground: '#000',
            removedBackground: '#000',
            removedGutterBackground: '#000',
            wordAddedBackground: '#000',
            wordRemovedBackground: '#000',
        }
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders DiffView and calls generateDiffFile with correct content derived from patch', () => {
        render(<ReviewModule {...defaultProps} />);

        // Check if DiffView is rendered
        expect(screen.getByTestId('diff-view')).toBeDefined();

        // Check if generateDiffFile was called correctly
        // The patch '@@ -1,1 +1,1 @@\n-old\n+new' parses to: oldValue="old", newValue="new"
        expect(generateDiffFile).toHaveBeenCalledWith(
            'test.ts',
            'old',
            'test.ts',
            'new',
            'typescript',
            'typescript'
        );
    });

    it('handles empty patch (binary/rename) by not calling generateDiffFile or rendering placeholder path', () => {
        const binaryMr: any = {
            ...mockMr,
            files: [{ filename: 'binary.dat', patch: undefined, status: 'modified' }]
        };

        render(<ReviewModule {...defaultProps} mr={binaryMr} />);

        // Should show "No content changes" or similar, NOT DiffView (unless we handle it via diff view which we don't for empty)
        // Actually our code checks `isEmpty`. 
        // If isEmpty is true, it renders "No content changes..." div.

        expect(screen.queryByTestId('diff-view')).toBeNull();
        expect(screen.getByText(/No content changes/i)).toBeDefined();
    });
});
