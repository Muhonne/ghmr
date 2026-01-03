/**
 * Validates GitHub personal access token format
 * Supports both classic and fine-grained tokens
 */
export const validateGitHubToken = (token: string): { valid: boolean; error?: string } => {
    if (!token || token.trim() === '') {
        return { valid: false, error: 'Token cannot be empty' };
    }

    const trimmedToken = token.trim();

    // Classic tokens: ghp_[A-Za-z0-9]{36}
    const classicPattern = /^ghp_[A-Za-z0-9]{36}$/;

    // Fine-grained tokens: github_pat_[A-Za-z0-9]{22}_[A-Za-z0-9]{59}
    const fineGrainedPattern = /^github_pat_[A-Za-z0-9]{22}_[A-Za-z0-9]{59}$/;

    // OAuth tokens: gho_[A-Za-z0-9]{36}
    const oauthPattern = /^gho_[A-Za-z0-9]{36}$/;

    // User-to-server tokens: ghu_[A-Za-z0-9]{36}
    const userToServerPattern = /^ghu_[A-Za-z0-9]{36}$/;

    // Server-to-server tokens: ghs_[A-Za-z0-9]{36}
    const serverToServerPattern = /^ghs_[A-Za-z0-9]{36}$/;

    // Refresh tokens: ghr_[A-Za-z0-9]{36}
    const refreshPattern = /^ghr_[A-Za-z0-9]{36}$/;

    if (classicPattern.test(trimmedToken)) {
        return { valid: true };
    }

    if (fineGrainedPattern.test(trimmedToken)) {
        return { valid: true };
    }

    if (oauthPattern.test(trimmedToken)) {
        return { valid: true };
    }

    if (userToServerPattern.test(trimmedToken)) {
        return { valid: true };
    }

    if (serverToServerPattern.test(trimmedToken)) {
        return { valid: true };
    }

    if (refreshPattern.test(trimmedToken)) {
        return { valid: true };
    }

    return {
        valid: false,
        error: 'Invalid token format. Expected a valid GitHub token (ghp_*, github_pat_*, gho_*, etc.)'
    };
};

/**
 * Sanitizes token for safe logging (shows only first/last 4 chars)
 */
export const sanitizeTokenForLogging = (token: string): string => {
    if (!token || token.length < 12) return '***';
    return `${token.substring(0, 4)}...${token.substring(token.length - 4)}`;
};
