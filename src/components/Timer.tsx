import { Component } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import moment from 'moment';

function Timer() {
    const [time, setTime] = useState(moment());  
    const saturday = moment('2024-10-19');

    useEffect(() => {
        const interval = setInterval(() => {
            setTime(moment());
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const days = saturday.diff(time, 'days');
    const hours = saturday.diff(time, 'hours') % 24;
    const minutes = saturday.diff(time, 'minutes') % 60;
    const seconds = saturday.diff(time, 'seconds') % 60;

    return (
        <div>
            {days} {days == 1 ? 'day' : 'days'} {hours} {hours == 1 ? 'hour' : 'hours'} {minutes} {minutes == 1 ? 'minute' : 'minutes'} {seconds} {seconds == 1 ? 'second' : 'seconds'}
        </div>
    );
}

export default Timer;