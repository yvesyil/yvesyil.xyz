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
        }
    }

    const [text, setText] = useState('');
    const [isReading, setIsReading] = useState(false);
    const [currentWord, setCurrentWord] = useState('');
    const [wordIndex, setWordIndex] = useState(0);
    const [words, setWords] = useState<string[]>([]);

    useEffect(() => {
        if (isReading && words.length > 0) {
            const interval = setInterval(() => {
                if (wordIndex < words.length) {
                    setCurrentWord(words[wordIndex]);
                    setWordIndex(wordIndex + 1);
                } else {
                    setIsReading(false);
                    setWordIndex(0);
                    setCurrentWord('');
                }
            }, 200); // Adjust speed as needed (200ms = 300 words per minute)

            return () => clearInterval(interval);
        }
    }, [isReading, wordIndex, words]);

    const startReading = (e: React.MouseEvent<HTMLButtonElement>) => {
        if (text.trim() === '') return;
        setWords(text.split(/\s+/));
        setWordIndex(0);
        setIsReading(true);
    };

    return (
        <div style={style.reader}>
            {isReading ? (
                <div style={style.readerOutput}>
                    <div style={style.readerOutputText}>
                        {
                            currentWord.split('').map((char, index) => (
                                index < currentWord.length / 2 ? (
                                    <span style={{color: '#ddd', fontWeight: 'bold'}} key={index}>{char}</span>
                                ) : (
                                    <span style={{color: '#bbb'}} key={index}>{char}</span>
                                )
                            ))
                        }
                    </div>
                </div>
            ) : (
                <>
                    <div style={style.readerInput}>
                        <input 
                            style={style.input} 
                            type="text" 
                            value={text} 
                            onChange={(e) => setText(e.target.value)} 
                            placeholder="enter text" 
                        />
                    </div>
                    <button style={style.readerButton} onClick={startReading}>read</button>
                </>
            )}
        </div>
    );
}

