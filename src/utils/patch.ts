/**
 * Parses a Git patch string into old and new values for diff viewing.
 */
export const parsePatch = (patch?: string) => {
    if (!patch) return { oldValue: '', newValue: '', isEmpty: true };

    const lines = patch.split('\n');
    const oldLines: string[] = [];
    const newLines: string[] = [];

    lines.forEach((line) => {
        if (line.startsWith('@@')) {
            if (oldLines.length > 0) {
                oldLines.push(' ');
                newLines.push(' ');
            }
        } else if (line.startsWith('-')) {
            oldLines.push(line.substring(1));
        } else if (line.startsWith('+')) {
            newLines.push(line.substring(1));
        } else if (line.startsWith(' ') || line === '') {
            const content = line.startsWith(' ') ? line.substring(1) : line;
            oldLines.push(content);
            newLines.push(content);
        }
    });

    return {
        oldValue: oldLines.join('\n'),
        newValue: newLines.join('\n'),
        isEmpty: false
    };
};
