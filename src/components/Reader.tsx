import { Component, useState, useEffect, useMemo } from 'react';

const useIsMobile = () => {
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return isMobile;
};

export default function Reader() {
    const isMobile = useIsMobile();
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);
    
    const style = useMemo(() => ({
        input: {
            outline: 'none',
            border: 'none',
            background: 'transparent',
            width: '100%',
            height: 'auto',
            maxHeight: isMobile ? '70vh' : '40vh',
            fontSize: isMobile ? '2rem' : '1rem',
            fontFamily: '"Yana", serif',
            textAlign: 'center' as const,
            color: '#ccc',
            resize: 'none' as const,
        },
        reader: {
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            flexDirection: 'column' as const,
            width: '70vw',
            height: '70vh',
            position: 'relative' as const,
        },
        readerInput: {
            border: 'none',
            outline: 'none',
            background: 'transparent',
            width: '100%',
            height: isMobile ? '50rem' : '16rem',
            maxHeight: isMobile ? '80vh' : '50vh',
            position: 'relative' as const,
            bottom: isMobile ? '5vh' : '10vh',
            display: 'flex',
            flexDirection: 'column' as const,
            alignItems: 'center',
            justifyContent: 'center',
        },
        readerButton: {
            border: 'none',
            outline: 'none',
            background: 'transparent',
            color: 'var(--site-light)',
            fontSize: windowWidth > 2560 ? '1.5rem' :
                     windowWidth > 1920 ? '2rem' :
                     isMobile ? '4rem' : '3rem',
            fontFamily: '"Yana", serif',
            cursor: 'pointer',
            margin: '1rem 1rem 0 1rem',
        },
        readerOutput: {
            display: 'flex',
            alignItems: 'center',
            width: '100%',
            height: '100%',
        },
        readerOutputText: {
            color: '#fff',
            fontSize: windowWidth > 2560 ? '2rem' : 
                     windowWidth > 1920 ? '3rem' : '5rem',
            fontFamily: '"Yana", serif',
            position: 'relative' as const,
            left: isMobile ? '0' : '12vw',
        },
        stats: {
            position: 'absolute' as const,
            top: '2rem',
            right: '2rem',
            fontSize: isMobile ? '2rem' : '1rem',
            color: '#888'
        },
    }), [isMobile, windowWidth]);

    const [text, setText] = useState('');
    const [isReading, setIsReading] = useState(false);
    const [wordIndex, setWordIndex] = useState(0);
    const [words, setWords] = useState<string[]>([]);
    const currentWord = words[wordIndex] || '';
    const [wpm, setWpm] = useState(300);
    const [isPaused, setIsPaused] = useState(false);
    const [intervalTime, setIntervalTime] = useState(60000 / wpm);
    const [textareaHeight, setTextareaHeight] = useState('auto');

    useEffect(() => {
        if (isReading && words.length > 0 && !isPaused) {
            const interval = setInterval(() => {
                if (wordIndex < words.length) {
                    setWordIndex(wordIndex + 1);
                } else {
                    setIsReading(false);
                    setWordIndex(0);
                }
            }, intervalTime);

            return () => clearInterval(interval);
        }
    }, [isReading, wordIndex, words, wpm, isPaused]);

    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            if (e.code === 'Space') {
                togglePause();
            } else if (e.code === 'ArrowLeft') {
                setWordIndex(Math.max(0, wordIndex - 1));
            } else if (e.code === 'ArrowRight') {
                setWordIndex(Math.min(words.length - 1, wordIndex + 1));
            } else if (e.code === 'ArrowUp') {
                setWpm(Math.min(1000, wpm + 50));
                setIntervalTime(60000 / wpm);
            } else if (e.code === 'ArrowDown') {
                setWpm(Math.max(100, wpm - 50));
                setIntervalTime(60000 / wpm);
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [wordIndex, words.length]);

    useEffect(() => {
        const handleResize = () => {
            setWindowWidth(window.innerWidth);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const startReading = (e: React.MouseEvent<HTMLButtonElement>) => {
        if (text.trim() === '') return;
        setWords(text.trim().split(/\s+/));
        setWordIndex(0);
        setIsReading(true);
    };

    const togglePause = () => {
        setIsPaused(!isPaused);
    };

    const resetReading = () => {
        setIsReading(false);
        setIsPaused(false);
        setWordIndex(0);
    };

    const Progress = () => {
        const progress = (wordIndex / words.length) * 100;
        return (
            <div style={{
                width: '100%',
                height: '2px',
                background: '#333',
                position: 'relative' as const,
                bottom: 0,
            }}>
                <div style={{
                    width: `${progress}%`,
                    height: '100%',
                    background: 'var(--site-light)',
                    transition: 'width 0.2s ease-in-out'
                }} />
            </div>
        );
    };

    const DisplayWord = ({ word }: { word: string }) => {
        const findORP = (word: string) => {
            const length = word.length;
            if (length <= 1) return 0;
            if (length <= 5) return 1;
            if (length <= 9) return 2;
            if (length <= 13) return 3;
            return 4;
        };

        const orpIndex = findORP(word);
        
        return (
            <div style={{position: 'relative', display: 'inline-block'}}>
                <span style={{color: '#888'}}>{word.slice(0, orpIndex)}</span>
                <span style={{color: '#fff'}}>{word.slice(orpIndex, orpIndex + 1)}</span>
                <span style={{color: '#888'}}>{word.slice(orpIndex + 1)}</span>
            </div>
        );
    };

    const Stats = () => (
        <div style={style.stats}>
            <div>{wordIndex + 1}/{words.length} words</div>
            <div>{wpm} wpm</div>
        </div>
    );

    return (
        <div style={style.reader}>
            {isReading ? (
                <>
                    <Stats />
                    <div style={style.readerOutput}>
                        <div style={style.readerOutputText}>
                            <DisplayWord word={currentWord} />
                        </div>
                    </div>
                    <Progress />
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button onClick={togglePause} style={style.readerButton}>
                            {isPaused ? 'resume' : 'pause'}
                        </button>
                        <button onClick={resetReading} style={style.readerButton}>
                            reset
                        </button>
                    </div>
                </>
            ) : (
                <>
                    <div style={style.readerInput}>
                        <textarea 
                            style={{
                                ...style.input,
                                height: textareaHeight
                            }} 
                            value={text} 
                            onChange={(e) => {
                                e.currentTarget.style.height = 'auto';
                                const newHeight = `${e.currentTarget.scrollHeight}px`;
                                e.currentTarget.style.height = newHeight;
                                setTextareaHeight(newHeight);
                                setText(e.target.value);
                            }}
                            placeholder="paste text here" 
                        />
                        <button style={{...style.readerButton}} onClick={startReading}>read</button>
                    </div>
                </>
            )}
        </div>
    );
}

