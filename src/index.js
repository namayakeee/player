/*
 * Welcome to your app's main JavaScript file!
 *
 * We recommend including the built version of this JavaScript file
 * (and its CSS file) in your base layout (base.html.twig).
 */

// any CSS you import will output into a single css file (app.css in this case)
import './styles/index.scss';

import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom/client';
import Hls from 'hls.js';
import axios from 'axios';
const { default: srtParser2 } = require("srt-parser-2")

function Player({ src, title, description, subtitle })
{
    const videoRef = useRef(null);
    const playerRef = useRef(null);

    const [play, setPlay] = useState(false);
    const [isShareOpened, setIsShareOpened] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isControlOpened, setIsControlOpened] = useState(true);
    const [isEndscreenOpened, setIsEndscreenOpened] = useState(false);
    const [isFloatPlayerOpened, setIsFloatPlayerOpened] = useState(false);
    const [isPictureInPictureEnabled, setIsPictureInPictureEnabled] = useState(false);
    const [isSubtitleEnabled, setIsSubtitleEnabled] = useState(true);
    const [currentSubtitle, setCurrentSubtitle] = useState(null);
    const [hasSubtitle, setHasSubtitle] = useState(false);
    // const [controlCounter, setControlCounter] = useState(null);
    const controlCounter = useRef(null);
    const [progress, setProgress] = useState(0);
    const [volume, setVolume] = useState(50);
    const [volumeBeforeMute, setVolumeBeforeMute] = useState(50);

    const progressBarRef = useRef(null);
    const volumeBarRef = useRef(null);
    const subtitlesRef = useRef([]);

    useEffect(() => {
        if (!videoRef) return;

        if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
            videoRef.current.src = src;
        } else if (Hls.isSupported()) {
            const hls = new Hls();
            hls.loadSource(src);
            hls.attachMedia(videoRef.current);
        }

        videoRef.current.volume = (volume % 100) / 100;

        videoRef.current.addEventListener('play', () => {      
            setIsEndscreenOpened(false);      
            setPlay(true);
        });

        videoRef.current.addEventListener('pause', () => {
            setPlay(false);
        });

        videoRef.current.addEventListener('timeupdate', event => {
            const videoCurrentTime = videoRef.current.currentTime;
            setProgress(Math.round(videoCurrentTime / videoRef.current.duration * 1000) / 10);
            setCurrentSubtitle(subtitlesRef.current.find(subtitle => subtitle.start <= videoCurrentTime && subtitle.end > videoCurrentTime) || null);
        });

        videoRef.current.addEventListener('ended', () => {
            setIsEndscreenOpened(true);
        })
        videoRef.current.addEventListener('volumechange', event => {
            setVolume(Math.round(videoRef.current.volume * 100));
            if (Math.round(videoRef.current.volume * 100) > 0)
                setVolumeBeforeMute(Math.round(videoRef.current.volume * 100));
        });
        videoRef.current.addEventListener('enterpictureinpicture', event => {
            setIsPictureInPictureEnabled(true);
        });
        videoRef.current.addEventListener('leavepictureinpicture', event => {
            setIsPictureInPictureEnabled(false);
        });

        playerRef.current.addEventListener('fullscreenchange', () => {
            setIsFullscreen(
                document.fullscreenElement === playerRef.current 
                || document.webkitFullscreenElement === playerRef.current 
                || document.mozFullScreenElement === playerRef.current);
        });
        document.addEventListener('keydown', event => {
            if (event.code === 'ArrowRight') {
                videoRef.current.pause();
                videoRef.current.currentTime = Math.min(videoRef.current.currentTime + 5, videoRef.current.duration);
                videoRef.current.play();
            }
            if (event.code === 'ArrowLeft') {
                videoRef.current.pause();
                videoRef.current.currentTime = Math.max(videoRef.current.currentTime - 5, 0);
                videoRef.current.play();
            }
            if (event.code === 'ArrowUp') {
                videoRef.current.volume = Math.min(videoRef.current.volume + 0.1, 1);
            }
            if (event.code === 'ArrowDown') {
                videoRef.current.volume = Math.max(videoRef.current.volume - 0.1, 0);
            }
            if (event.code === 'Space') {
                if (videoRef.current.paused) videoRef.current.play();
                else videoRef.current.pause();
            }
        });

        // document.addEventListener('scroll', event => {
        //     var player = playerRef.current.getBoundingClientRect();
        //     const isPlayerOutside = (player.x + player.width) < 0 
        //         || (player.y + player.height) < 0
        //         || (player.x > window.innerWidth || player.y > window.innerHeight);
        //     if (isPlayerOutside) {
        //         if (document.pictureInPictureEnabled) {
        //             videoRef.current.requestPictureInPicture();
        //         } else {

        //         }
        //     } else {
        //         setIsFloatPlayerOpened(isPlayerOutside);
        //     }
        // })

        if (subtitle) {
            axios.get(subtitle).then(response => {
                const results = (new srtParser2()).fromSrt(response.data);
                const parsedSubtitles = results.reduce((carry, item) => {
                    const { endTime, startTime } = item;
                    const [startHour, startMinute, startSecond] = startTime.split(':');
                    const [endHour, endMinute, endSecond] = endTime.split(':');
                    
                    const start = parseInt(startHour) * 1440 + parseInt(startMinute) * 60 + (parseInt(startSecond.replace(/,/g, '')) / 1000);
                    const end = parseInt(endHour) * 1440 + parseInt(endMinute) * 60 + (parseInt(endSecond.replace(/,/g, '')) / 1000);

                    if (!isNaN(start) && !isNaN(end)) {
                        carry.push({
                            start,
                            end,
                            text: item.text
                        })
                    }
                    return carry;
                }, []);
                subtitlesRef.current = parsedSubtitles;
                setHasSubtitle(true);
            });   
        }

    }, []);

    function showControl() {
        setIsControlOpened(true);
        hideControl();
    }

    function hideControl() 
    {
        clearTimeout(controlCounter.current);
        controlCounter.current = setTimeout(() => {
            setIsControlOpened(false);
        }, 3000);
    }

    function shareWithFacebook() {
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${window.location.href}`, '_blank').focus();
    }

    function shareWithTwitter() {
        window.open(`http://twitter.com/share?url=${window.location.href}`, '_blank').focus();
    }

    function copyLink() {
        navigator.clipboard.writeText(window.location.href);
    }

    function onProgressBarClick(event) {
        event.stopPropagation();
        const rect = progressBarRef.current.getBoundingClientRect();
        const progress = Math.max(Math.min(Math.round((event.clientX - rect.x) / rect.width * 100), 100), 0);
        videoRef.current.pause();
        videoRef.current.currentTime = videoRef.current.duration * progress / 100;
        videoRef.current.play();
    }

    function onVolumeBarClick(event) {
        event.stopPropagation();
        const rect = volumeBarRef.current.getBoundingClientRect();
        const progress = Math.max(Math.min(Math.round((event.clientX - rect.x) / rect.width * 100), 100), 0);
        videoRef.current.volume = progress / 100;
    }

    function onVolumeHandleMouseMove(event) {
        const volumeBar = volumeBarRef.current.getBoundingClientRect();
        const handle = event.target.getBoundingClientRect();        
        // const handleCenterX = handle.left + ((handle.right - handle.left) / 2);
        const progress = (event.clientX - volumeBar.x) / volumeBar.width * 100;
        videoRef.current.volume = progress / 100;
    }

    function onVolumeHandleMouseDown(event) {
        event.stopPropagation();
        volumeBarRef.current.addEventListener('mousemove', onVolumeHandleMouseMove);
        document.addEventListener('mouseup', () => {
            volumeBarRef.current.removeEventListener('mousemove', onVolumeHandleMouseMove);
        }, {once: true})
    }

    return (
        <div className='w-full h-96 relative bg-black' ref={playerRef}>
            <>
                {isShareOpened && 
                    <div className='absolute top-0 left-0 w-full h-full flex flex-row justify-center items-center z-20' 
                        onClick={() => setIsShareOpened(false)}>
                        <div className='absolute top-0 left-0 w-full h-full flex flex-row items-center justify-center bg-black bg-opacity-50 backdrop-blur z-30'>
                            <div className='p-4 bg-white shadow w-80 relative'>
                                <div className="w-full flex flex-row items-center justify-between">
                                    <div>分享</div>
                                    <button onClick={event => {event.stopPropagation(); setIsShareOpened(false)}}>
                                        <i className="fa-regular fa-xmark"></i>
                                    </button>
                                </div>
                                <div className="flex flex-row mt-8 gap-4">
                                    <div className="flex flex-col items-center gap-2" 
                                        onClick={event => {event.stopPropagation(); shareWithFacebook()}}>
                                        <button className='rounded-full w-16 h-16 bg-[#1877f2]'>
                                            <i className="fa-brands fa-facebook text-white text-xl"></i>
                                        </button>
                                        <span className='text-xs'>Facebook</span>
                                    </div>
                                    <div className="flex flex-col items-center gap-2" 
                                        onClick={event => {event.stopPropagation(); shareWithTwitter()}}>
                                        <button className='rounded-full w-16 h-16 bg-[#1da1f2]'>
                                            <i className="fa-brands fa-twitter text-white text-xl"></i>
                                        </button>
                                        <span className='text-xs'>Twitter</span>
                                    </div>
                                    <div className="flex flex-col items-center gap-2" 
                                        onClick={event => {event.stopPropagation(); copyLink()}}>
                                        <button className='rounded-full w-16 h-16 bg-slate-500'>
                                            <i className="fa-regular fa-link-horizontal text-white text-xl"></i>
                                        </button>
                                        <span className='text-xs'>Link</span>
                                    </div>
                                </div>
                                <div className='mt-8 flex flex-row gap-4'>
                                    <input className='w-full p-2 border rounded bg-gray-200 border-gray-300 text-sm text-gray-800' readOnly={true}
                                        onClick={event => event.stopPropagation()}
                                        value={window.location.href}/>
                                    <button className='py-2 px-4 min-w-fit text-blue-600 hover:bg-blue-200 rounded transition-all outline-none' 
                                        onClick={event => {event.stopPropagation(); copyLink()}}>複製</button>
                                </div>
                            </div>
                        </div>   
                    </div>
                }
            </>
            <div className='absolute top-0 left-0 w-full h-full z-10'
                onClick={() => {
                    if (isControlOpened) videoRef.current.paused ? videoRef.current.play() : videoRef.current.pause()
                }}
                onMouseMove={() => {showControl()}}
                onMouseOver={() => {showControl()}} 
                onMouseOut={() => {hideControl()}}>
                { (!play || isControlOpened) && 
                    <>
                        <div className='absolute top-0 left-0 w-full h-16 p-4 flex flex-row items-center justify-between z-10 bg-gradient-to-b from-black to-transparent'>
                            <div className='flex flex-col'>
                                {title && <div className='text-white font-bold'>{ title }</div>}
                                {description && <div className='text-white text-sm'>{ description }</div>}
                            </div>
                            <div>
                                {/* <button className='w-8 h-8' onClick={event => {event.stopPropagation(); setIsShareOpened(true);}}>
                                    <i className="fa-regular fa-share-nodes text-white text-xl"></i>
                                </button> */}
                            </div>
                        </div>
                    </> 
                }
                { currentSubtitle && isSubtitleEnabled && 
                    <div className={`absolute ${isControlOpened ? 'bottom-20' : 'bottom-4'} w-full left-0 transition-all flex flex-row items-center justify-center`}>
                        <div className='text-white p-2 bg-black bg-opacity-50'>{currentSubtitle.text}</div>
                    </div> 
                }
                { (!play || isControlOpened) && 
                    <>
                        <div className='absolute bottom-0 left-0 w-full p-4 flex flex-col gap-4 z-10 bg-gradient-to-t from-black to-transparent'>
                            {/* <div>
                                {title && <div className='text-white font-bold'>{ title }</div>}
                                {description && <div className='text-white text-sm'>{ description }</div>}
                            </div> */}
                            
                            <div className='relative cursor-pointer h-1' ref={progressBarRef} onClick={onProgressBarClick}>
                                <div className='w-full top-0 left-0 absolute h-full bg-gray-100 bg-opacity-50'></div>
                                <div className='top-0 left-0 absolute h-full bg-red-500' style={{width: `${progress}%`}}></div>
                            </div>
                            <div className='flex flex-row items-center justify-between gap-4 w-full'>
                                <div className='flex flex-row gap-4'>
                                    <>
                                        {play && 
                                            <button className='w-8 outline-none' 
                                                onClick={event => {event.stopPropagation(); videoRef.current.pause()}}>
                                                <i className="fa-regular fa-pause text-white text-xl"></i>
                                            </button>
                                        }
                                        {!play && 
                                            <button className='w-8 outline-none' onClick={event => {event.stopPropagation(); videoRef.current.play();}}>
                                                <i className="fa-regular fa-play text-white text-xl"></i>
                                            </button>
                                        }
                                    </>
                                    <>
                                        <div className='flex flex-row items-center gap-2 cursor-pointer'>
                                            <button className='w-8 outline-none' 
                                                onClick={event => {
                                                    event.stopPropagation(); 
                                                    videoRef.current.volume = videoRef.current.volume === 0 ? volumeBeforeMute / 100 : 0
                                                }}>
                                                {volume === 0 && <i className="fa-regular fa-volume-slash text-white text-xl"></i>}
                                                {volume <= 30 && volume > 0 && <i className="fa-regular fa-volume-low text-white text-xl"></i>}
                                                {volume <= 70 && volume > 30 && <i className="fa-regular fa-volume text-white text-xl"></i>}
                                                {volume > 70 && <i className="fa-regular fa-volume-high text-white text-xl"></i>}
                                            </button>
                                            <div className='relative w-24 h-4 ml-2' ref={volumeBarRef} onClick={onVolumeBarClick}>
                                                <div className='w-full top-1.5 left-0 absolute h-1 bg-gray-100 bg-opacity-50'></div>
                                                <div className='top-1.5 left-0 absolute h-1 bg-red-500 transition-all' style={{width: `${volume}%`}}></div>
                                                <div className="absolute w-4 h-4 top-0 -ml-2 bg-white shadow rounded-full z-10" style={{left: `${volume}%`}}
                                                    onMouseDown={onVolumeHandleMouseDown}
                                                ></div>
                                            </div>
                                        </div>
                                    </>
                                </div>
                                <div className='flex flex-row gap-4'>
                                    <>
                                        {!isPictureInPictureEnabled && <button className='w-8 outline-none' onClick={event => {
                                            event.stopPropagation();
                                            videoRef.current.requestPictureInPicture();
                                        }}>    
                                            <i className="fa-regular fa-square-down-right text-white text-xl"></i>
                                        </button> }
                                        {isPictureInPictureEnabled && <button className='w-8 outline-none' onClick={event => {
                                            event.stopPropagation();
                                            document.exitPictureInPicture();
                                        }}> 
                                            <i className="fa-regular fa-square-up-left text-white text-xl"></i>   
                                        </button> }
                                    </>
                                    {hasSubtitle && 
                                        <>
                                            {!isSubtitleEnabled && <button className='w-8 outline-none' onClick={event => {
                                                event.stopPropagation();
                                                setIsSubtitleEnabled(true);
                                            }}>
                                                <i className="fa-regular fa-closed-captioning text-white text-xl"></i>
                                            </button> }
                                            {isSubtitleEnabled && <button className='w-8 outline-none' onClick={event => {
                                                event.stopPropagation();
                                                setIsSubtitleEnabled(false);
                                            }}>
                                                <i className="fa-regular fa-closed-captioning-slash text-white text-xl"></i>
                                            </button>}
                                        </>
                                    }
                                    <button className='w-8 outline-none' onClick={event => event.stopPropagation()}>
                                        <i className="fa-regular fa-gear text-white text-xl"></i>
                                    </button>
                                    <button className='w-8 outline-none' onClick={event => {event.stopPropagation(); setIsShareOpened(true);}}>
                                        <i className="fa-regular fa-share-nodes text-white text-xl"></i>
                                    </button>
                                    <>
                                        { !isFullscreen && <button className='w-8 outline-none' onClick={event => {event.stopPropagation(); playerRef.current.requestFullscreen();}}>
                                            <i className="fa-regular fa-expand text-white text-xl"></i>
                                        </button> }
                                        { isFullscreen && <button className='w-8 outline-none' onClick={event => {event.stopPropagation(); document.exitFullscreen()}}>
                                            <i className="fa-regular fa-compress text-white text-xl"></i>
                                        </button> }
                                    </>
                                </div>
                            </div>
                        </div>
                        {isEndscreenOpened && 
                            <div className='absolute top-0 left-0 w-full h-full flex flex-row items-center justify-center bg-black bg-opacity-50 backdrop-blur'
                                onClick={() => setIsShareOpened(false)}>
                                    <button onClick={event => {
                                        event.stopPropagation();
                                        videoRef.current.pause();
                                        videoRef.current.currentTime = 0;
                                        videoRef.current.play();
                                    }}>
                                        <i className="fa-regular fa-rotate-right text-white text-xl"></i>
                                    </button>
                            </div>
                        }
                    </> 
                }
            </div>
            <div className={`${isFloatPlayerOpened ? 'fixed bottom-4 right-4 w-64 h-36 bg-black' : 'absolute top-0 left-0 w-full h-full flex flex-row justify-center items-center'}`}>
                <video onClick={() => videoRef.current.pause()} 
                    className='w-full h-full max-w-full max-h-full' ref={videoRef}></video>
            </div>
        </div>
    );
}

window.addEventListener('load', () => {
    const roots = document.getElementsByClassName('namayakeee-player');
    [...roots].forEach(root => {
        ReactDOM.createRoot(root).render(
            <Player 
                src={root.getAttribute('src')} 
                subtitle={root.getAttribute('subtitle')}
                poster={root.getAttribute('poster')} 
                title={root.getAttribute('video-title')} 
                description={root.getAttribute('video-description')}></Player>
        );
    })
  })
  