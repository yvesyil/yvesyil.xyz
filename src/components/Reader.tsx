import { Component, useState, useEffect } from 'react';

export default function Reader() {
    const style = {
        input: {
            outline: 'none',
            border: 'none',
            background: 'transparent',
            color: '#fff',
            width: '100%',
            fontSize: '3rem',
            fontFamily: '"EB Garamond 12", serif',
            textAlign: 'center' as const,
        },
        reader: {
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            flexDirection: 'column' as const,
            width: '70vw',
            height: '70vh',
            position: 'relative' as const,
            overflow: 'hidden',
        },
        readerInput: {
            border: 'none',
            outline: 'none',
            background: 'transparent',
            width: '100%',
            position: 'relative' as const,
            bottom: '10vh',
        },
        readerButton: {
            border: 'none',
            outline: 'none',
            background: 'transparent',
            color: '#fff',
            fontSize: '3rem',
            fontFamily: '"EB Garamond 12", serif',
            cursor: 'pointer',
            margin: '0 1rem',
        },
        readerOutput: {
            display: 'flex',
            alignItems: 'center',
            width: '100%',
            height: '100%',
        },
        readerOutputText: {
            color: '#fff',
            fontSize: '5rem',
            fontFamily: '"EB Garamond 12", serif',
            position: 'relative' as const,
            left: '12vw',
        },
    }

    const [text, setText] = useState('');
    const [isReading, setIsReading] = useState(false);
    const [wordIndex, setWordIndex] = useState(0);
    const [words, setWords] = useState<string[]>([]);
    const currentWord = words[wordIndex] || '';
    const [wpm, setWpm] = useState(300);
    const [isPaused, setIsPaused] = useState(false);
    const [intervalTime, setIntervalTime] = useState(60000 / wpm);

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

    const startReading = (e: React.MouseEvent<HTMLButtonElement>) => {
        if (text.trim() === '') return;
        setWords(text.split(/\s+/));
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
                    background: '#fff',
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
        <div style={{
            position: 'absolute',
            top: '2rem',
            right: '2rem',
            fontSize: '1rem',
            color: '#888'
        }}>
            <div>{wordIndex}/{words.length} words</div>
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
                        <input 
                            style={style.input} 
                            type="text" 
                            value={text} 
                            onChange={(e) => setText(e.target.value)} 
                            placeholder="paste text here" 
                        />
                    </div>
                    <button style={style.readerButton} onClick={startReading}>read</button>
                </>
            )}
        </div>
    );
}

