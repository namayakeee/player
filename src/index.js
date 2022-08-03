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

function Player({ src })
{
    const videoRef = useRef(null);
    const playerRef = useRef(null);

    const [play, setPlay] = useState(false);
    const [isShareOpened, setIsShareOpened] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isControlOpened, setIsControlOpened] = useState(true);
    // const [controlCounter, setControlCounter] = useState(null);
    const controlCounter = useRef(null);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        if (!videoRef) return;

        if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
            videoRef.current.src = src;
        } else if (Hls.isSupported()) {
            const hls = new Hls();
            hls.loadSource(src);
            hls.attachMedia(videoRef.current);
        }

        videoRef.current.addEventListener('play', () => {            
            setPlay(true);
        });

        videoRef.current.addEventListener('pause', () => {
            setPlay(false);
        });

        videoRef.current.addEventListener('timeupdate', (event) => {
            setProgress(Math.round(videoRef.current.currentTime / videoRef.current.duration * 1000) / 10);
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

    return (
        <div className='w-full h-96 relative bg-black' ref={playerRef}>
            {isShareOpened && 
                <div className='absolute top-0 left-0 w-full h-full flex flex-row justify-center items-center z-20' 
                    onClick={() => setIsShareOpened(false)}>
                    <div className='absolute top-0 left-0 w-full h-full flex flex-row items-center justify-center bg-black bg-opacity-50 backdrop-blur z-30'>
                        <div className='p-4 bg-white shadow w-80 relative'>
                            <div className="w-full flex flex-row items-center justify-between">
                                <div>分享</div>
                                <button onClick={event => {event.stopPropagation(); setIsShareOpened(false)}}>
                                    <i className="fa-solid fa-xmark"></i>
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
                                        <i className="fa-brands fa-twitter text-white text-xl"></i>
                                    </button>
                                    <span className='text-xs'>Link</span>
                                </div>
                            </div>
                            <div className='mt-8 flex flex-row gap-4'>
                                <input className='w-full p-2 border rounded bg-gray-200 border-gray-300 text-sm text-gray-800' readOnly={true}
                                    value={window.location.href}/>
                                <button className='py-2 px-4 min-w-fit text-blue-600 hover:bg-blue-200 rounded transition-all outline-none' 
                                    onClick={event => {event.stopPropagation(); copyLink()}}>複製</button>
                            </div>
                        </div>
                    </div>   
                </div>
            }
            <div className='absolute top-0 left-0 w-full h-full z-10'
                onClick={() => videoRef.current.paused ? videoRef.current.play() : videoRef.current.pause()}
                onMouseMove={() => {showControl()}}
                onMouseOver={() => {showControl()}} 
                onMouseOut={() => {hideControl()}}>
                { (!play || isControlOpened) && <>
                    <div className='absolute top-0 left-0 w-full h-16 p-4 flex flex-row items-center justify-between'>
                        <div className='flex flex-col'></div>
                        <div>
                            <button className='w-8 h-8' onClick={event => {event.stopPropagation(); setIsShareOpened(true);}}>
                                <i className="fa-regular fa-share-nodes text-white text-xl"></i>
                            </button>
                        </div>
                    </div>
                    <div className='absolute bottom-0 left-0 w-full p-4 flex flex-col gap-4'>
                        <div>
                            <div className='text-white font-bold'>Video Title</div>
                            <div className='text-white text-sm'>Video description</div>
                        </div>
                        <div className='relative'>
                            <div className='w-full top-0 left-0 absolute h-0.5 bg-gray-100 bg-opacity-50'></div>
                            <div className='top-0 left-0 absolute h-0.5 bg-red-500 transition-all' style={{width: `${progress}%`}}></div>
                        </div>
                        <div className='flex flex-row items-center justify-between gap-4 w-full'>
                            <div className='flex flex-row gap-4'>
                                <>
                                    {play && 
                                        <button className='outline-none' 
                                            onClick={event => {event.stopPropagation(); videoRef.current.pause()}}>
                                            <i className="fa-regular fa-pause text-white text-xl"></i>
                                        </button>
                                    }
                                    {!play && 
                                        <button className='outline-none' onClick={event => {event.stopPropagation(); videoRef.current.play();}}>
                                            <i className="fa-regular fa-play text-white text-xl"></i>
                                        </button>
                                    }
                                </>
                            </div>
                            <div className='flex flex-row gap-4'>
                                <button className='outline-none' onClick={event => event.stopPropagation()}>
                                    <i className="fa-brands fa-chromecast text-white text-xl"></i>
                                </button>
                                <button className='outline-none' onClick={event => event.stopPropagation()}>
                                    <i className="fa-regular fa-gear text-white text-xl"></i>
                                </button>
                                <>
                                    { !isFullscreen && <button className='outline-none' onClick={event => {event.stopPropagation(); playerRef.current.requestFullscreen();}}>
                                        <i className="fa-regular fa-expand text-white text-xl"></i>
                                    </button> }
                                    { isFullscreen && <button className='outline-none' onClick={event => {event.stopPropagation(); document.exitFullscreen()}}>
                                        <i className="fa-regular fa-compress text-white text-xl"></i>
                                    </button> }
                                </>
                            </div>
                        </div>
                    </div>
                </> }
            </div>
            {/* <div className='absolute top-0 left-0 w-full h-full'
                onClick={() => {videoRef.current.paused ? videoRef.current.play() : videoRef.current.pause(); console.log(123)}}
            >                
            </div> */}
            <div className='absolute top-0 left-0 w-full h-full flex flex-row justify-center items-center'>
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
            <Player src={root.getAttribute('src')}></Player>
        );
    })
  })
  