import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { Octokit } from 'octokit'
import { AnimatePresence } from 'framer-motion'
import { MergeRequest, View, User, CIStatus, CheckRun, Workflow } from './types'
import { MainLayout } from './components/templates/MainLayout'
import { MrList } from './components/organisms/MrList'
import { MrDetail } from './components/organisms/MrDetail'
import { ReviewModule } from './components/organisms/ReviewModule'
import { Settings } from './components/organisms/Settings'
import { isFileViewed } from './utils/reReview'
import { secureStorage } from './utils/secureStorage'

export default function App() {
    const [token, setToken] = useState<string>('')
    const [fontSize, setFontSize] = useState<number>(14)
    const [pollInterval, setPollInterval] = useState<number>(5000)
    const [fileListWidth, setFileListWidth] = useState<number>(300)
    const [isResizing, setIsResizing] = useState(false)
    const [user, setUser] = useState<User | null>(null)
    const [mrs, setMrs] = useState<MergeRequest[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [selectedMrId, setSelectedMrId] = useState<number | null>(null)
    const [view, setView] = useState<View>('settings')
    const [currentFileIndex, setCurrentFileIndex] = useState(0)
    const [currentMrIndex, setCurrentMrIndex] = useState(0)
    const [isSidebarMinified, setIsSidebarMinified] = useState(true)
    const [isTriggering, setIsTriggering] = useState(false)
    const [availableWorkflows, setAvailableWorkflows] = useState<Workflow[]>([])
    const reviewScrollRef = useRef<HTMLDivElement | null>(null)
    const sidebarWidthRef = useRef(0)


    useEffect(() => {
        const loadAppConfig = async () => {
            try {
                const localToken = await secureStorage.getToken()
                if (localToken) setToken(localToken)
                const localFontSize = await secureStorage.getFontSize()
                setFontSize(localFontSize)
                const localPollInterval = await secureStorage.getPollInterval()
                setPollInterval(localPollInterval)
                const localWidth = await secureStorage.getFileListWidth()
                setFileListWidth(localWidth)
            } catch (error) {
                console.error('Failed to load config:', error)
            }
        }
        loadAppConfig()
    }, [])

    useEffect(() => {
        document.documentElement.style.setProperty('--app-font-size', `${fontSize}px`)
    }, [fontSize])

    useEffect(() => {
        document.documentElement.style.setProperty('--file-list-width', `${fileListWidth}px`)
    }, [fileListWidth])

    const octokit = useMemo(() => {
        if (!token) return null
        return new Octokit({
            auth: token,
            baseUrl: 'https://api.github.com', // Explicit HTTPS
            request: {
                timeout: 5000
            }
        })
    }, [token])


    const fetchMrs = useCallback(async () => {
        if (!octokit) return
        setLoading(true)
        setError(null)
        try {
            const { data: authenticatedUser } = await octokit.rest.users.getAuthenticated()
            setUser({ login: authenticatedUser.login, avatar_url: authenticatedUser.avatar_url })

            const { data: pulls } = await octokit.rest.search.issuesAndPullRequests({
                q: `is:pr is:open author:${authenticatedUser.login}`
            })

            const results = await Promise.all(pulls.items.map(async (pull: any): Promise<MergeRequest | null> => {
                try {
                    const [owner, repo] = pull.repository_url.split('/').slice(-2)
                    const { data: prDetails } = await octokit.rest.pulls.get({
                        owner,
                        repo,
                        pull_number: pull.number
                    })

                    const { data: files } = await octokit.rest.pulls.listFiles({
                        owner,
                        repo,
                        pull_number: pull.number
                    })


                    const savedViewedForMr = await secureStorage.getViewedFiles(pull.id)

                    return {
                        id: pull.id,
                        number: pull.number,
                        title: pull.title,
                        author: pull.user.login,
                        created_at: pull.created_at,
                        repository: `${owner}/${repo}`,
                        base_ref: prDetails.base.ref,
                        head_ref: prDetails.head.ref,
                        head_sha: prDetails.head.sha,
                        status: 'open',
                        files: (files || []).map((f: any) => ({
                            filename: f.filename,
                            status: f.status as any,
                            additions: f.additions,
                            deletions: f.deletions,
                            patch: f.patch,
                            sha: f.sha,
                            viewed: isFileViewed(savedViewedForMr[f.filename], f.sha)
                        }))
                    }
                } catch (e) {
                    console.error(`Failed to map MR #${pull?.number}:`, e);
                    return null;
                }
            }))

            const mappedMrs = results.filter((mr: MergeRequest | null): mr is MergeRequest => mr !== null)
            setMrs(mappedMrs)
        } catch (error: any) {
            // Sanitized error logging
            console.error("API Error:", error.status || "Unknown")

            if (error.status === 401) {
                setError("Authentication failed. Please verify your token.")
                setView('settings')
            } else if (error.status === 403) {
                setError("Access denied. Check token permissions.")
            } else if (error.status === 404) {
                setError("Resource not found.")
            } else {
                setError("Unable to fetch data. Please try again.")
            }
        } finally {
            setLoading(false)
        }
    }, [octokit])

    const handleTriggerWorkflow = useCallback(async (mr: MergeRequest, workflowId: number) => {
        if (!octokit) return;
        setIsTriggering(true);
        const [owner, repo] = mr.repository.split('/');

        try {
            await octokit.rest.actions.createWorkflowDispatch({
                owner,
                repo,
                workflow_id: workflowId,
                ref: mr.head_ref
            });

        } catch (e: any) {
            console.error('Failed to trigger workflow:', e);
            alert(`Failed to trigger workflow: ${e.message}`);
        } finally {
            setIsTriggering(false);
        }
    }, [octokit, fetchMrs]);

    useEffect(() => {
        if (token) fetchMrs()
    }, [token, fetchMrs])

    const handleSaveConfig = async (newToken?: string, newFontSize?: number, newWidth?: number, newPollInterval?: number) => {
        try {
            if (newToken !== undefined) {
                setToken(newToken)
                await secureStorage.setToken(newToken)
            }
            if (newFontSize !== undefined) {
                setFontSize(newFontSize)
                await secureStorage.setFontSize(newFontSize)
            }
            if (newWidth !== undefined) {
                setFileListWidth(newWidth)
                await secureStorage.setFileListWidth(newWidth)
            }
            if (newPollInterval !== undefined) {
                setPollInterval(newPollInterval)
                await secureStorage.setPollInterval(newPollInterval)
            }

            if (newToken !== undefined) setView('list')
        } catch (error) {
            console.error('Failed to save config')
            setError('Failed to save configuration')
        }
    }

    const startResizing = useCallback((e: React.MouseEvent) => {
        const sidebarElement = document.querySelector('.sidebar')
        sidebarWidthRef.current = sidebarElement?.getBoundingClientRect().width || 0
        setIsResizing(true)
        document.body.classList.add('resizing')
        e.preventDefault()
    }, [])

    const stopResizing = useCallback(() => {
        setIsResizing(false)
        document.body.classList.remove('resizing')
        // Read the actual width from the CSS variable to sync back to state
        const currentWidth = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--file-list-width'))
        if (!isNaN(currentWidth)) {
            setFileListWidth(currentWidth)
            handleSaveConfig(undefined, undefined, currentWidth)
        }
    }, [])

    const resize = useCallback((e: MouseEvent) => {
        if (isResizing) {
            const newWidth = e.clientX - sidebarWidthRef.current
            if (newWidth > 150 && newWidth < 600) {
                document.documentElement.style.setProperty('--file-list-width', `${newWidth}px`)
            }
        }
    }, [isResizing])

    useEffect(() => {
        if (isResizing) {
            document.body.style.userSelect = 'none'
            window.addEventListener('mousemove', resize)
            window.addEventListener('mouseup', stopResizing)
        } else {
            document.body.style.userSelect = ''
            window.removeEventListener('mousemove', resize)
            window.removeEventListener('mouseup', stopResizing)
        }
        return () => {
            document.body.style.userSelect = ''
            window.removeEventListener('mousemove', resize)
            window.removeEventListener('mouseup', stopResizing)
        }
    }, [isResizing, resize, stopResizing])

    const selectedMr = useMemo(() =>
        mrs.find(m => m.id === selectedMrId),
        [mrs, selectedMrId]
    )

    const handleUpdateMr = useCallback((updatedMr: MergeRequest) => {
        setMrs(prev => prev.map(m => m.id === updatedMr.id ? updatedMr : m));
    }, []);


    const handleSelectMr = useCallback(async (id: number) => {
        setSelectedMrId(id)
        setView('detail')
        setAvailableWorkflows([])
        setCurrentFileIndex(0)
    }, [])

    const toggleFileViewed = async (mrId: number, filename: string) => {
        setMrs(prev => prev.map(m => {
            if (m.id !== mrId) return m
            return {
                ...m,
                files: m.files.map(f => f.filename === filename ? { ...f, viewed: !f.viewed } : f)
            }
        }))

        const currentMr = mrs.find(m => m.id === mrId)
        if (currentMr) {
            const viewedMap: Record<string, string> = {}
            currentMr.files.forEach(f => {
                const isTarget = f.filename === filename;
                const willBeViewed = isTarget ? !f.viewed : f.viewed;

                if (willBeViewed) {
                    viewedMap[f.filename] = f.sha;
                }
            })

            await secureStorage.setViewedFiles(mrId, viewedMap)
        }
    }

    const startReview = useCallback(() => {
        if (selectedMr) {
            const firstUnviewed = selectedMr.files.findIndex(f => !f.viewed);
            setCurrentFileIndex(firstUnviewed !== -1 ? firstUnviewed : 0);
            setView('review');
        }
    }, [selectedMr])

    useEffect(() => {
        if (view === 'review') {
            reviewScrollRef.current?.scrollTo({ top: 0 });
        }
    }, [currentFileIndex, view])

    // Debounce helper
    const debounce = <T extends (...args: any[]) => any>(
        func: T,
        wait: number
    ): ((...args: Parameters<T>) => void) => {
        let timeout: ReturnType<typeof setTimeout> | null = null
        return (...args: Parameters<T>) => {
            if (timeout) clearTimeout(timeout)
            timeout = setTimeout(() => func(...args), wait)
        }
    }

    const debouncedFetchMrs = useMemo(
        () => debounce(fetchMrs, 2000),
        [fetchMrs]
    )

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Global shortcut: Cmd/Ctrl + Plus to increase font size
            if ((e.metaKey || e.ctrlKey) && (e.key === '=' || e.key === '+')) {
                e.preventDefault();
                const newSize = Math.min(24, fontSize + 1);
                setFontSize(newSize);
                secureStorage.setFontSize(newSize);
                return;
            }

            // Global shortcut: Cmd/Ctrl + Minus to decrease font size
            if ((e.metaKey || e.ctrlKey) && e.key === '-') {
                e.preventDefault();
                const newSize = Math.max(10, fontSize - 1);
                setFontSize(newSize);
                secureStorage.setFontSize(newSize);
                return;
            }

            // Global shortcut: Cmd+R to refresh (only in list view) - now debounced
            if (view === 'list' && (e.metaKey || e.ctrlKey) && e.key === 'r') {
                e.preventDefault();
                debouncedFetchMrs();
                return;
            }

            if (view === 'list') {
                if (e.key === 'ArrowDown' || e.key === 'j') {
                    e.preventDefault();
                    setCurrentMrIndex(p => Math.min(mrs.length - 1, p + 1));
                }
                if (e.key === 'ArrowUp' || e.key === 'k') {
                    e.preventDefault();
                    setCurrentMrIndex(p => Math.max(0, p - 1));
                }
                if (e.key === 'Enter') {
                    e.preventDefault();
                    const targetMr = mrs[currentMrIndex];
                    if (targetMr) handleSelectMr(targetMr.id);
                }
            }

            // Global Escape to mimic Back button
            if (e.key === 'Escape' && view !== 'list') {
                e.preventDefault();
                setView(view === 'review' ? 'detail' : 'list');
                return;
            }



            if (view === 'detail' && selectedMr) {
                const files = selectedMr.files;
                if (e.key === 'ArrowDown' || e.key === 'j') {
                    e.preventDefault();
                    setCurrentFileIndex(p => Math.min(files.length - 1, p + 1));
                }
                if (e.key === 'ArrowUp' || e.key === 'k') {
                    e.preventDefault();
                    setCurrentFileIndex(p => Math.max(0, p - 1));
                }
                if (e.key === 'Enter') {
                    e.preventDefault();
                    setView('review');
                }
            }

            if (view === 'review' && selectedMr) {
                const files = selectedMr.files

                if (e.key === 'ArrowRight' || e.key === 'j') {
                    e.preventDefault();
                    setCurrentFileIndex(p => Math.min(files.length - 1, p + 1));
                }
                if (e.key === 'ArrowLeft' || e.key === 'k') {
                    e.preventDefault();
                    setCurrentFileIndex(p => Math.max(0, p - 1));
                }
                if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    const scrollElement = reviewScrollRef.current;
                    if (scrollElement) {
                        const start = scrollElement.scrollTop;
                        const target = start + 100;
                        const duration = 200;
                        const startTime = performance.now();

                        const animateScroll = (currentTime: number) => {
                            const elapsed = currentTime - startTime;
                            const progress = Math.min(elapsed / duration, 1);
                            const easeProgress = progress * (2 - progress); // ease out
                            scrollElement.scrollTop = start + (target - start) * easeProgress;

                            if (progress < 1) {
                                requestAnimationFrame(animateScroll);
                            }
                        };
                        requestAnimationFrame(animateScroll);
                    }
                }
                if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    const scrollElement = reviewScrollRef.current;
                    if (scrollElement) {
                        const start = scrollElement.scrollTop;
                        const target = Math.max(0, start - 100);
                        const duration = 200;
                        const startTime = performance.now();

                        const animateScroll = (currentTime: number) => {
                            const elapsed = currentTime - startTime;
                            const progress = Math.min(elapsed / duration, 1);
                            const easeProgress = progress * (2 - progress); // ease out
                            scrollElement.scrollTop = start + (target - start) * easeProgress;

                            if (progress < 1) {
                                requestAnimationFrame(animateScroll);
                            }
                        };
                        requestAnimationFrame(animateScroll);
                    }
                }

                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    const file = files[currentFileIndex]
                    if (file) {
                        if (!file.viewed) toggleFileViewed(selectedMr.id, file.filename)
                        if (currentFileIndex < files.length - 1) setCurrentFileIndex(p => p + 1)
                    }
                }
                if (e.key === 'Backspace') {
                    e.preventDefault();
                    const file = files[currentFileIndex]
                    if (file.viewed) toggleFileViewed(selectedMr.id, file.filename)
                    if (currentFileIndex > 0) {
                        setCurrentFileIndex(p => p - 1)
                    }
                }

            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [view, selectedMr, currentFileIndex, toggleFileViewed, debouncedFetchMrs, fontSize, mrs, currentMrIndex])

    return (
        <MainLayout
            view={view}
            setView={setView}
            isSidebarMinified={isSidebarMinified}
            setIsSidebarMinified={setIsSidebarMinified}
            user={user}
            selectedMr={selectedMr || null}
            error={error}
            token={token}
            loading={loading}
            fetchMrs={fetchMrs}
            onStartReview={startReview}
        >
            <AnimatePresence mode="wait">
                {view === 'list' && (
                    <MrList
                        mrs={mrs}
                        loading={loading}
                        token={token}
                        onSelectMr={handleSelectMr}
                        onRefresh={fetchMrs}
                        onReviewMr={(mr) => {
                            setSelectedMrId(mr.id);
                            const firstUnviewed = mr.files.findIndex(f => !f.viewed);
                            setCurrentFileIndex(firstUnviewed !== -1 ? firstUnviewed : 0);
                            setView('review');
                        }}
                        setView={setView}
                        selectedIndex={currentMrIndex}
                    />
                )}
                {view === 'detail' && selectedMr && (
                    <MrDetail
                        mr={selectedMr}
                        onStartReview={startReview}
                        onToggleFileViewed={toggleFileViewed}
                        onFileClick={(index) => {
                            setCurrentFileIndex(index);
                            setView('review');
                        }}
                        onTriggerWorkflow={handleTriggerWorkflow}
                        isTriggering={isTriggering}
                        workflows={availableWorkflows}
                        octokit={octokit}
                        onUpdateMr={handleUpdateMr}
                        onUpdateWorkflows={setAvailableWorkflows}
                        pollInterval={pollInterval}
                        selectedIndex={currentFileIndex}
                    />
                )}
                {view === 'review' && selectedMr && (
                    <ReviewModule
                        mr={selectedMr}
                        currentIndex={currentFileIndex}
                        setCurrentIndex={setCurrentFileIndex}
                        fileListWidth={fileListWidth}
                        isResizing={isResizing}
                        startResizing={startResizing}
                        scrollRef={reviewScrollRef}
                        octokit={octokit}
                    />
                )}
                {view === 'settings' && (
                    <Settings
                        token={token}
                        setToken={setToken}
                        fontSize={fontSize}
                        setFontSize={setFontSize}
                        pollInterval={pollInterval}
                        setPollInterval={setPollInterval}
                        onSave={handleSaveConfig}
                    />
                )}
            </AnimatePresence>
        </MainLayout>
    )
}
