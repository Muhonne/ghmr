import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { Octokit } from 'octokit'
import { AnimatePresence } from 'framer-motion'
import { MergeRequest, View, User } from './types'
import { MainLayout } from './components/templates/MainLayout'
import { MrList } from './components/organisms/MrList'
import { MrDetail } from './components/organisms/MrDetail'
import { ReviewModule } from './components/organisms/ReviewModule'
import { Settings } from './components/organisms/Settings'
import { isFileViewed } from './utils/reReview'

export default function App() {
    const [token, setToken] = useState<string>('')
    const [fontSize, setFontSize] = useState<number>(14)
    const [fileListWidth, setFileListWidth] = useState<number>(300)
    const [isResizing, setIsResizing] = useState(false)
    const [user, setUser] = useState<User | null>(null)
    const [mrs, setMrs] = useState<MergeRequest[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [selectedMrId, setSelectedMrId] = useState<number | null>(null)
    const [view, setView] = useState<View>('settings')
    const [currentFileIndex, setCurrentFileIndex] = useState(0)
    const [isSidebarMinified, setIsSidebarMinified] = useState(true)
    const reviewScrollRef = useRef<HTMLDivElement>(null)
    const sidebarWidthRef = useRef(0)

    // Electron integration
    useEffect(() => {
        const loadAppConfig = async () => {
            if (window.electron) {
                try {
                    const config = await window.electron.loadConfig()
                    if (config.token) {
                        setToken(config.token)
                        if (view === 'settings') setView('list')
                    }
                    if (config.fontSize) {
                        setFontSize(config.fontSize)
                    }
                    if (config.fileListWidth) {
                        setFileListWidth(config.fileListWidth)
                    }
                } catch (e) {
                    console.error('Failed to load config from Electron:', e)
                }
            } else {
                const localToken = localStorage.getItem('gh_token')
                if (localToken) setToken(localToken)
                const localFontSize = localStorage.getItem('app_font_size')
                if (localFontSize) setFontSize(parseInt(localFontSize))
                const localWidth = localStorage.getItem('file_list_width')
                if (localWidth) setFileListWidth(parseInt(localWidth))
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

    const octokit = useMemo(() => token ? new Octokit({ auth: token }) : null, [token])

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
                    const { data: files } = await octokit.rest.pulls.listFiles({
                        owner,
                        repo,
                        pull_number: pull.number
                    })

                    let savedViewedForMr: Record<string, string> = {};
                    if (window.electron) {
                        try {
                            savedViewedForMr = await window.electron.loadReviews(pull.id);
                        } catch (e) {
                            console.error(`Failed to load reviews for MR ${pull.id}:`, e);
                        }
                    } else {
                        const localViewed = localStorage.getItem(`viewed_${pull.id}`);
                        if (localViewed) savedViewedForMr = JSON.parse(localViewed);
                    }

                    return {
                        id: pull.id,
                        number: pull.number,
                        title: pull.title,
                        author: pull.user.login,
                        created_at: pull.created_at,
                        repository: `${owner}/${repo}`,
                        base_ref: pull.base?.ref || 'main',
                        head_ref: pull.head?.ref || 'branch',
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

            const mappedMrs = results.filter((mr): mr is MergeRequest => mr !== null)
            setMrs(mappedMrs)
        } catch (error: any) {
            console.error("Failed to fetch MRs:", error)
            if (error.status === 401) {
                setError("Invalid GitHub token. Please check your credentials.")
                setView('settings')
            } else {
                setError("Failed to fetch merge requests. Please try again.")
            }
        } finally {
            setLoading(false)
        }
    }, [octokit])

    useEffect(() => {
        if (token) fetchMrs()
    }, [token, fetchMrs])

    const handleSaveConfig = async (newToken?: string, newFontSize?: number, newWidth?: number) => {
        if (newToken !== undefined) setToken(newToken)
        if (newFontSize !== undefined) setFontSize(newFontSize)
        if (newWidth !== undefined) setFileListWidth(newWidth)

        const configToSave = {
            token: newToken !== undefined ? newToken : token,
            fontSize: newFontSize !== undefined ? newFontSize : fontSize,
            fileListWidth: newWidth !== undefined ? newWidth : fileListWidth
        }

        if (window.electron) {
            try {
                await window.electron.saveConfig(configToSave)
            } catch (e) {
                console.error('Failed to save config to Electron:', e)
                if (newToken !== undefined) localStorage.setItem('gh_token', newToken)
                if (newFontSize !== undefined) localStorage.setItem('app_font_size', String(newFontSize))
                if (newWidth !== undefined) localStorage.setItem('file_list_width', String(newWidth))
            }
        } else {
            if (newToken !== undefined) localStorage.setItem('gh_token', newToken)
            if (newFontSize !== undefined) localStorage.setItem('app_font_size', String(newFontSize))
            if (newWidth !== undefined) localStorage.setItem('file_list_width', String(newWidth))
        }

        if (newToken !== undefined) setView('list')
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
    }, [handleSaveConfig])

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

    const handleSelectMr = (id: number) => {
        setSelectedMrId(id)
        setView('detail')
    }

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

            if (window.electron) await window.electron.saveReview(mrId, viewedMap)
            else localStorage.setItem(`viewed_${mrId}`, JSON.stringify(viewedMap))
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

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
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
                    reviewScrollRef.current?.scrollBy({ top: 100, behavior: 'smooth' });
                }
                if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    reviewScrollRef.current?.scrollBy({ top: -100, behavior: 'smooth' });
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
                    if (currentFileIndex === 0 && file.viewed) toggleFileViewed(selectedMr.id, file.filename)
                    else if (currentFileIndex > 0) {
                        const prev = files[currentFileIndex - 1]
                        if (prev.viewed) toggleFileViewed(selectedMr.id, prev.filename)
                        setCurrentFileIndex(p => p - 1)
                    }
                }
                if (e.key === 'Escape') setView('detail')
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [view, selectedMr, currentFileIndex, toggleFileViewed])

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
                    />
                )}
                {view === 'settings' && (
                    <Settings
                        token={token}
                        setToken={setToken}
                        fontSize={fontSize}
                        setFontSize={setFontSize}
                        onSave={handleSaveConfig}
                    />
                )}
            </AnimatePresence>
        </MainLayout>
    )
}
