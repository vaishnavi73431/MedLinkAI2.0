import React, { useRef, useEffect, useState, useMemo } from 'react';
import { GameState, ZoneType, FurnitureItem } from '../types';
import { X, Trophy, Axe, Coins, Backpack, ChevronUp, ChevronDown } from 'lucide-react';
import { SHOP_ITEMS } from './ShopBoard';

interface PixelGardenProps {
    gameState: GameState;
    currentTime: Date;
    onRemoveTree: (index: number, cost: number) => boolean;
    onTrainClick: () => void;
    onCampingClick: () => void;
    onRestaurantClick: () => void;
    onHospitalClick: () => void;
    onGymClick: () => void;
    onSevaHubClick: () => void;
    onYogaClick: () => void;
    onSproutClick: () => void;
    onShopOpen: () => void;
    onPlaceItem: (item: FurnitureItem, x: number, y: number) => void;
    notifications: { id: string, text: string, type: 'coins' | 'level' | 'zone' | 'deduction' }[];
    isVisible: boolean;
}

const TREE_LOCATIONS = [
    { x: -700, y: -600 }, { x: -450, y: -650 }, { x: 450, y: -650 }, { x: 700, y: -600 },
    { x: -750, y: -300 }, { x: -800, y: 0 }, { x: -750, y: 300 },
    { x: 750, y: -300 }, { x: 800, y: 0 }, { x: 750, y: 300 },
    { x: -700, y: 600 }, { x: -300, y: 650 }, { x: 300, y: 650 }, { x: 700, y: 600 },
    { x: -2100, y: -300 },
    { x: -1400, y: 50 }
];

const TREE_COST = 50;

const COLORS = {
    houseWall: '#F5F5E6',
    houseRoof: '#2C2C3E',
    houseWindow: '#4A6B8C',
    houseWindowReflection: '#6C8EA4',
    fence: '#1A1A1A',
    pillar: '#E0E0D1',
    pathStone: '#A5A5A5',
    pathStoneEdge: '#888888',
    outline: '#000000',
    sleeper: '#5D4037',
    rail: '#78909C',
    pathDirt: '#D1A377',
    tentWhite: '#FFFFFF',
    tentRed: '#D32F2F',
    stone: '#546E7A',
    fire: '#FF5722',
    fireInner: '#FFC107',
    yogaWall: '#B2DFDB',
    yogaRoof: '#E5989B',
    yogaWindow: 'rgba(232, 245, 248, 0.7)',
    yogaFloor: '#D7CCC8',
    clayPot: '#D35400',
    leaf: '#4CAF50',
    restaurantWall: '#F9F1D8',
    restaurantSign: '#4FC3F7',
    restaurantSignText: '#FFFFFF',
    restaurantAwning1: '#E64A19',
    restaurantAwning2: '#FBE9E7',
    restaurantDoor: '#1976D2',
    restaurantCounter: '#D84315',
    restaurantStool: '#212121',
    hospitalWall: '#CFD8DC',
    hospitalRoof: '#1E88E5',
    hospitalCross: '#E53935',
    hospitalWindow: '#81D4FA',
    hospitalSideWall: '#546E7A',
    hospitalAccent: '#E53935'
};

const PixelGarden: React.FC<PixelGardenProps> = ({ gameState, currentTime, onRemoveTree, onTrainClick, onCampingClick, onRestaurantClick, onHospitalClick, onGymClick, onSevaHubClick, onYogaClick, onSproutClick, onShopOpen, onPlaceItem, notifications, isVisible }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [ticker, setTicker] = useState(0);

    const [camera, setCamera] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [showWelcome, setShowWelcome] = useState(true);

    const [isDragging, setIsDragging] = useState(false);
    const [lastPos, setLastPos] = useState({ x: 0, y: 0 });
    const dragStartRef = useRef({ x: 0, y: 0 });

    const userHitBox = useRef<{ x: number, y: number, w: number, h: number } | null>(null);
    const sproutHitBox = useRef<{ x: number, y: number, w: number, h: number } | null>(null);
    const treeHitBoxes = useRef<{ id: number, x: number, y: number, w: number, h: number }[]>([]);
    const trainHitBox = useRef<{ x: number, y: number, w: number, h: number } | null>(null);
    const campingHitBox = useRef<{ x: number, y: number, w: number, h: number } | null>(null);
    const restaurantHitBox = useRef<{ x: number, y: number, w: number, h: number } | null>(null);
    const hospitalHitBox = useRef<{ x: number, y: number, w: number, h: number } | null>(null);
    const gymHitBox = useRef<{ x: number, y: number, w: number, h: number } | null>(null);
    const sevaHubHitBox = useRef<{ x: number, y: number, w: number, h: number } | null>(null);
    const yogaHitBox = useRef<{ x: number, y: number, w: number, h: number } | null>(null);
    const shopHitBox = useRef<{ x: number, y: number, w: number, h: number } | null>(null);

    const [showUserInfo, setShowUserInfo] = useState(false);
    const [choppingState, setChoppingState] = useState<{ index: number, frame: number } | null>(null);

    const [pinchStartDist, setPinchStartDist] = useState<number | null>(null);
    const [pinchStartZoom, setPinchStartZoom] = useState(1);

    const [isInventoryOpen, setIsInventoryOpen] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setShowWelcome(false);
        }, 10000);
        return () => clearTimeout(timer);
    }, []);

    const hour = currentTime.getHours();
    const isNight = hour >= 18 || hour < 6;

    const stars = useMemo(() => {
        const arr = [];
        for (let i = 0; i < 100; i++) {
            arr.push({
                x: (Math.random() - 0.5) * 4000,
                y: -1500 + Math.random() * 1200,
                size: Math.random() * 2 + 1,
                phase: Math.random() * Math.PI * 2,
                speed: 0.05 + Math.random() * 0.1
            });
        }
        return arr;
    }, []);

    const handleStart = (clientX: number, clientY: number) => {
        setIsDragging(true);
        setLastPos({ x: clientX, y: clientY });
        dragStartRef.current = { x: clientX, y: clientY };
    };

    const handleMove = (clientX: number, clientY: number) => {
        if (!isDragging) return;
        const dx = clientX - lastPos.x;
        const dy = clientY - lastPos.y;
        setCamera(prev => ({ x: prev.x + dx, y: prev.y + dy }));
        setLastPos({ x: clientX, y: clientY });
    };

    const triggerChop = (targetIndex: number) => {
        if (choppingState !== null) return;

        if (gameState.score < TREE_COST) {
            onRemoveTree(targetIndex, TREE_COST);
            return;
        }

        setChoppingState({ index: targetIndex, frame: 0 });

        let currentFrame = 0;
        const animInterval = setInterval(() => {
            currentFrame += 1;
            if (currentFrame >= 35) {
                clearInterval(animInterval);
                onRemoveTree(targetIndex, TREE_COST);
                setChoppingState(null);
            } else {
                setChoppingState({ index: targetIndex, frame: currentFrame });
            }
        }, 25);
    };

    const handleClick = (clientX: number, clientY: number) => {
        if (canvasRef.current) {
            const rect = canvasRef.current.getBoundingClientRect();
            const x = clientX - rect.left;
            const y = clientY - rect.top;

            const box = userHitBox.current;
            if (box && x >= box.x && x <= box.x + box.w && y >= box.y && y <= box.y + box.h) {
                setShowUserInfo(true);
                return;
            }

            const sBox = sproutHitBox.current;
            if (sBox && x >= sBox.x && x <= sBox.x + sBox.w && y >= sBox.y && y <= sBox.y + sBox.h) {
                onSproutClick();
                return;
            }

            const tbBox = trainHitBox.current;
            if (tbBox && x >= tbBox.x && x <= tbBox.x + tbBox.w && y >= tbBox.y && y <= tbBox.y + tbBox.h) {
                onTrainClick();
                return;
            }

            const cpBox = campingHitBox.current;
            if (cpBox && x >= cpBox.x && x <= cpBox.x + cpBox.w && y >= cpBox.y && y <= cpBox.y + box.h) {
                onCampingClick();
                return;
            }

            const resBox = restaurantHitBox.current;
            if (resBox && x >= resBox.x && x <= resBox.x + resBox.w && y >= resBox.y && y <= resBox.y + box.h) {
                onRestaurantClick();
                return;
            }

            const hospBox = hospitalHitBox.current;
            if (hospBox && x >= hospBox.x && x <= hospBox.x + hospBox.w && y >= hospBox.y && y <= hospBox.y + hospBox.h) {
                onHospitalClick();
                return;
            }

            const gBox = gymHitBox.current;
            if (gBox && x >= gBox.x && x <= gBox.x + gBox.w && y >= gBox.y && y <= gBox.y + gBox.h) {
                onGymClick();
                return;
            }

            const shBox = sevaHubHitBox.current;
            if (shBox && x >= shBox.x && x <= shBox.x + shBox.w && y >= shBox.y && y <= shBox.y + shBox.h) {
                onSevaHubClick();
                return;
            }

            const yBox = yogaHitBox.current;
            if (yBox && x >= yBox.x && x <= yBox.x + yBox.w && y >= yBox.y && y <= yBox.y + yBox.h) {
                onYogaClick();
                return;
            }

            const sShopBox = shopHitBox.current;
            if (sShopBox && x >= sShopBox.x && x <= sShopBox.x + sShopBox.w && y >= sShopBox.y && y <= sShopBox.y + sShopBox.h) {
                onShopOpen();
                return;
            }

            for (const tb of treeHitBoxes.current) {
                if (x >= tb.x && x <= tb.x + tb.w && y >= tb.y && y <= tb.y + tb.h) {
                    if (!gameState.removedTrees.includes(tb.id)) {
                        triggerChop(tb.id);
                        setShowUserInfo(false);
                        return;
                    }
                }
            }

            setShowUserInfo(false);
        }
    };

    const handleEnd = (e?: React.MouseEvent | React.TouchEvent) => {
        setIsDragging(false);
        setPinchStartDist(null);

        if (e) {
            let cx, cy;
            if ('changedTouches' in e) {
                cx = e.changedTouches[0].clientX;
                cy = e.changedTouches[0].clientY;
            } else {
                cx = (e as React.MouseEvent).clientX;
                cy = (e as React.MouseEvent).clientY;
            }

            const dist = Math.hypot(cx - dragStartRef.current.x, cy - dragStartRef.current.y);
            if (dist < 10) {
                handleClick(cx, cy);
            }
        }
    };

    const handleWheel = (e: React.WheelEvent) => {
        const step = 0.1;
        const delta = e.deltaY < 0 ? step : -step;
        setZoom(z => Math.min(Math.max(z + delta, 0.5), 3));
    };

    const onTouchStart = (e: React.TouchEvent) => {
        if (e.touches.length === 2) {
            const d = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
            setPinchStartDist(d);
            setPinchStartZoom(zoom);
            setIsDragging(false);
        } else if (e.touches.length === 1) {
            handleStart(e.touches[0].clientX, e.touches[0].clientY);
        }
    };

    const onTouchMove = (e: React.TouchEvent) => {
        if (e.touches.length === 2 && pinchStartDist !== null) {
            const d = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
            const ratio = d / pinchStartDist;
            setZoom(Math.min(Math.max(pinchStartZoom * ratio, 0.5), 3));
        } else if (e.touches.length === 1) {
            handleMove(e.touches[0].clientX, e.touches[0].clientY);
        }
    };

    useEffect(() => {
        if (!isVisible) return;
        let frameId: number;
        const loop = () => {
            setTicker(t => t + 1);
            frameId = requestAnimationFrame(loop);
        };
        loop();
        return () => cancelAnimationFrame(frameId);
    }, [isVisible]);

    const handleDragStartItem = (e: React.DragEvent, item: FurnitureItem) => {
        e.dataTransfer.setData('text/plain', item);
        e.dataTransfer.effectAllowed = 'copyMove';
    };

    const handleDragOverItem = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
    };

    const handleDropItem = (e: React.DragEvent) => {
        e.preventDefault();
        const item = e.dataTransfer.getData('text/plain') as FurnitureItem;
        if (!item) return;

        if (canvasRef.current) {
            const rect = canvasRef.current.getBoundingClientRect();
            const w = rect.width;
            const h = rect.height;
            const scale = (Math.min(w, h) / 800) * zoom;
            const cx = w / 2 + camera.x;
            const cy = h / 2 + camera.y;

            const clientX = e.clientX - rect.left;
            const clientY = e.clientY - rect.top;

            const worldX = (clientX - cx) / scale;
            const worldY = (clientY - cy) / scale;

            onPlaceItem(item, worldX, worldY);
        }
    };

    const drawRoundedRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, r);
        ctx.fill();
        ctx.stroke();
    };

    useEffect(() => {
        if (!isVisible) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);

        const w = rect.width;
        const h = rect.height;

        const scale = (Math.min(w, h) / 800) * zoom;
        const cx = w / 2 + camera.x;
        const cy = h / 2 + camera.y;

        const skyColor = isNight ? '#0D1B2A' : '#B2EBF2';
        const grassColor = isNight ? '#1B2E15' : '#7CB342';
        const mountainColor = isNight ? '#1A1A2E' : '#78909C';
        const mountainLightColor = isNight ? '#252545' : '#90A4AE';
        const snowColor = isNight ? '#4A4E69' : '#FFFFFF';

        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = 3 * scale;
        ctx.strokeStyle = COLORS.outline;

        treeHitBoxes.current = [];

        ctx.fillStyle = skyColor;
        ctx.fillRect(0, 0, w, h);

        const horizonY = cy - 700 * scale;

        if (!isNight) {
            const sunX = cx - 400 * scale;
            const sunY = horizonY - 400 * scale;
            ctx.save();
            ctx.shadowBlur = 50 * scale;
            ctx.shadowColor = '#FFD54F';
            ctx.fillStyle = '#FFEB3B';
            ctx.beginPath();
            ctx.arc(sunX, sunY, 60 * scale, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        } else {
            ctx.fillStyle = '#FFFFFF';
            stars.forEach(star => {
                const opacity = 0.5 + Math.sin(ticker * star.speed + star.phase) * 0.5;
                ctx.globalAlpha = opacity;
                ctx.fillRect(cx + star.x * scale, cy + star.y * scale, star.size * scale, star.size * scale);
            });
            ctx.globalAlpha = 1.0;
        }

        const drawMountains = (ox: number, oy: number) => {
            const mountainBaseY = oy - 700 * scale;
            ctx.save();
            const drawPeak = (px: number, py: number, mw: number, mh: number) => {
                ctx.fillStyle = mountainColor;
                ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px - mw / 2, mountainBaseY); ctx.lineTo(px, mountainBaseY); ctx.fill();
                ctx.fillStyle = mountainLightColor;
                ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + mw / 2, mountainBaseY); ctx.lineTo(px, mountainBaseY); ctx.fill();
                const snowH = mh * 0.25; const snowW = mw * 0.25;
                ctx.fillStyle = snowColor;
                ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px - snowW / 2, py + snowH); ctx.lineTo(px + snowW / 2, py + snowH); ctx.fill();
            };
            drawPeak(ox - 800 * scale, mountainBaseY - 250 * scale, 700 * scale, 250 * scale);
            drawPeak(ox - 300 * scale, mountainBaseY - 450 * scale, 1000 * scale, 450 * scale);
            drawPeak(ox + 400 * scale, mountainBaseY - 320 * scale, 850 * scale, 320 * scale);
            drawPeak(ox + 900 * scale, mountainBaseY - 380 * scale, 950 * scale, 380 * scale);
            ctx.restore();
        };
        drawMountains(cx, cy);

        const drawTrack = (ox: number, oy: number) => {
            const ty = oy - 700 * scale; const trackWidth = 5000 * scale;
            ctx.fillStyle = isNight ? '#252525' : '#D1D1D1';
            ctx.fillRect(ox - trackWidth / 2, ty - 10 * scale, trackWidth, 20 * scale);
            ctx.fillStyle = COLORS.sleeper;
            for (let sx = ox - trackWidth / 2; sx < ox + trackWidth / 2; sx += 40 * scale) {
                ctx.fillRect(sx, ty - 8 * scale, 20 * scale, 16 * scale);
            }
            ctx.strokeStyle = COLORS.rail; ctx.lineWidth = 4 * scale;
            ctx.beginPath(); ctx.moveTo(ox - trackWidth / 2, ty - 5 * scale); ctx.lineTo(ox + trackWidth / 2, ty - 5 * scale);
            ctx.moveTo(ox - trackWidth / 2, ty + 5 * scale); ctx.lineTo(ox + trackWidth / 2, ty + 5 * scale); ctx.stroke();
        };
        drawTrack(cx, cy);

        const drawTrain = (ox: number, oy: number) => {
            const ty = oy - 700 * scale; const cycleDuration = 60000; const stopDuration = 20000; const transitionDuration = 8000;
            const now = Date.now(); const phase = now % cycleDuration;
            let trainX = -2000 * scale; let isVisibleTrain = false;
            if (phase < transitionDuration) { isVisibleTrain = true; const progress = phase / transitionDuration; trainX = -2000 * scale + progress * 2000 * scale; }
            else if (phase < transitionDuration + stopDuration) { isVisibleTrain = true; trainX = 0; }
            else if (phase < transitionDuration * 2 + stopDuration) { isVisibleTrain = true; const progress = (phase - (transitionDuration + stopDuration)) / transitionDuration; trainX = progress * 2000 * scale; }
            if (isVisibleTrain) {
                const tx = ox + trainX; const carW = 160 * scale; const carH = 50 * scale; const carGap = 10 * scale;
                const drawCar = (x: number, color: string, isEngine: boolean = false) => {
                    ctx.fillStyle = color; ctx.strokeStyle = COLORS.outline; ctx.lineWidth = 2 * scale;
                    ctx.fillRect(x - carW, ty - carH, carW, carH); ctx.strokeRect(x - carW, ty - carH, carW, carH);
                    if (isEngine) {
                        const smokeX = x - carW + 20 * scale; const smokeY = ty - carH - 10 * scale;
                        for (let i = 0; i < 3; i++) {
                            const puffTicker = (ticker + i * 20) % 60; const puffScale = puffTicker / 60; const puffAlpha = 1 - puffScale;
                            const puffSize = (10 + puffScale * 20) * scale; const puffYOff = -puffTicker * 2 * scale;
                            const puffXOff = Math.sin(ticker / 10 + i) * 10 * scale;
                            ctx.fillStyle = `rgba(180, 180, 180, ${puffAlpha * 0.7})`; ctx.beginPath(); ctx.arc(smokeX + puffXOff, smokeY + puffYOff, puffSize, 0, Math.PI * 2); ctx.fill();
                        }
                        ctx.fillStyle = '#333'; ctx.fillRect(x - carW + 10 * scale, ty - carH - 15 * scale, 40 * scale, 15 * scale);
                        ctx.strokeRect(x - carW + 10 * scale, ty - carH - 15 * scale, 40 * scale, 15 * scale);
                        ctx.fillStyle = '#FFEB3B'; ctx.beginPath(); ctx.arc(x, ty - carH / 2, 5 * scale, 0, Math.PI * 2); ctx.fill();
                    } else {
                        ctx.strokeStyle = 'rgba(0,0,0,0.2)';
                        ctx.beginPath();
                        ctx.moveTo(x - carW + 20 * scale, ty - carH + 10 * scale);
                        ctx.lineTo(x - 20 * scale, ty - carH + 10 * scale);
                        ctx.moveTo(x - carW + 20 * scale, ty - 10 * scale);
                        ctx.lineTo(x - 20 * scale, ty - 10 * scale);
                        ctx.stroke();
                    }
                    ctx.fillStyle = '#212121'; ctx.beginPath(); ctx.arc(x - 30 * scale, ty + 5 * scale, 10 * scale, 0, Math.PI * 2); ctx.arc(x - carW + 30 * scale, ty + 5 * scale, 10 * scale, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
                };
                drawCar(tx + (carW + carGap) * 2, '#D32F2F', true); drawCar(tx + (carW + carGap) * 1, '#1976D2'); drawCar(tx, '#388E3C'); drawCar(tx - (carW + carGap), '#FBC02D'); drawCar(tx - (carW + carGap) * 2, '#7B1FA2');

                trainHitBox.current = {
                    x: tx - (carW + carGap) * 2 - carW,
                    y: ty - carH - 20 * scale,
                    w: (carW + carGap) * 5,
                    h: carH + 40 * scale
                };
            } else {
                trainHitBox.current = null;
            }
        };
        drawTrain(cx, cy);

        ctx.fillStyle = grassColor; ctx.fillRect(0, horizonY, w, h - horizonY + 5000 * scale);

        const drawStonePath = (ox: number, oy: number) => {
            const pathW = 160 * scale; const pathH = 1000 * scale; ctx.save();
            for (let py = oy + 280 * scale; py < oy + pathH; py += 30 * scale) {
                for (let px = ox - pathW / 2; px < ox + pathW / 2; px += 40 * scale) {
                    const offX = (Math.sin(py + px) * 5) * scale;
                    const offY = (Math.cos(py + px) * 5) * scale;
                    ctx.fillStyle = COLORS.pathStone; ctx.strokeStyle = COLORS.pathStoneEdge; ctx.lineWidth = 1 * scale;
                    ctx.fillRect(px + offX, py + offY, 35 * scale, 25 * scale); ctx.strokeRect(px + offX, py + offY, 35 * scale, 25 * scale);
                }
            }
            ctx.restore();
        };
        drawStonePath(cx, cy);

        const drawHedges = (ox: number, oy: number) => {
            const backY = oy + 40 * scale;
            const leftX = ox - 560 * scale;
            const rightX = ox + 560 * scale;

            ctx.save();
            ctx.strokeStyle = COLORS.outline;
            ctx.lineWidth = 2.5 * scale;
            for (let hx = leftX; hx <= rightX; hx += 32 * scale) {
                const hHeight = (35 + Math.sin(hx * 0.05) * 12) * scale;
                const hWidth = (42 + Math.cos(hx * 0.05) * 8) * scale;

                ctx.fillStyle = isNight ? '#0D210D' : '#43A047';

                ctx.beginPath();
                ctx.ellipse(hx, backY + 5 * scale, hWidth / 2, hHeight / 2, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();

                ctx.fillStyle = isNight ? '#1B3D1B' : '#81C784';
                ctx.beginPath();
                ctx.ellipse(hx - 5 * scale, backY - 2 * scale, hWidth / 4, hHeight / 4, 0, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        };
        drawHedges(cx, cy);

        const drawHouse = (ox: number, oy: number) => {
            const houseW = 600 * scale; const houseH = 220 * scale; const left = ox - houseW / 2; const topY = oy + 50 * scale; const groundY = topY + houseH;
            ctx.strokeStyle = COLORS.outline;
            ctx.fillStyle = COLORS.houseWall; ctx.fillRect(left, topY, houseW, houseH); ctx.strokeRect(left, topY, houseW, houseH);
            const entranceW = 180 * scale; ctx.fillStyle = '#E5E5D6'; ctx.fillRect(ox - entranceW / 2, topY, entranceW, houseH); ctx.strokeRect(ox - entranceW / 2, topY, entranceW, houseH);
            const winW = 160 * scale; const winH = 140 * scale; const winY = topY + 40 * scale;
            const drawWin = (wx: number) => {
                ctx.fillStyle = COLORS.houseWindow; ctx.fillRect(wx, winY, winW, winH); ctx.strokeRect(wx, winY, winW, winH);
                ctx.fillStyle = COLORS.houseWindowReflection; ctx.beginPath(); ctx.moveTo(wx + 10 * scale, winY + 10 * scale); ctx.lineTo(wx + winW - 50 * scale, winY + 10 * scale); ctx.lineTo(wx + 10 * scale, winY + winH - 50 * scale); ctx.closePath(); ctx.fill(); ctx.stroke();
                ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 4 * scale; ctx.strokeRect(wx, winY, winW, winH);
                ctx.strokeStyle = COLORS.outline; ctx.lineWidth = 3 * scale;
                ctx.beginPath(); ctx.moveTo(wx + winW / 2, winY); ctx.lineTo(wx + winW / 2, winY + winH); ctx.moveTo(wx, winY + winH / 2); ctx.lineTo(wx + winW, winY + winH / 2); ctx.stroke();
            };
            drawWin(left + 30 * scale); drawWin(left + houseW - 30 * scale - winW);
            const doorW = 70 * scale; const doorH = 110 * scale; ctx.fillStyle = '#3E2723'; ctx.fillRect(ox - doorW / 2, groundY - doorH - 5 * scale, doorW, doorH); ctx.strokeRect(ox - doorW / 2, groundY - doorH - 5 * scale, doorW, doorH);
            ctx.fillStyle = '#FFD54F'; ctx.beginPath(); ctx.arc(ox + 20 * scale, groundY - doorH / 2, 3 * scale, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = COLORS.houseRoof; ctx.beginPath(); const roofOver = 40 * scale; ctx.moveTo(left - roofOver, topY); ctx.lineTo(left + houseW / 2, topY - 120 * scale); ctx.lineTo(left + houseW + roofOver, topY); ctx.closePath(); ctx.fill(); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(ox - entranceW / 2 - 20 * scale, topY); ctx.lineTo(ox, topY - 40 * scale); ctx.lineTo(ox + entranceW / 2 + 20 * scale, topY); ctx.closePath(); ctx.fill(); ctx.stroke();
        };
        drawHouse(cx, cy);

        const drawHospital = (ox: number, oy: number) => {
            const buildingW = 460 * scale;
            const mainH = 380 * scale;
            const bx = ox - buildingW / 2;
            const by = oy - mainH;

            ctx.lineWidth = 3 * scale;
            ctx.strokeStyle = COLORS.outline;

            const drawHorizontalPath = (px: number, py: number, startXRel: number, endXRel: number) => {
                const stoneW = 40 * scale;
                const stoneH = 30 * scale;
                for (let r = 0; r < 3; r++) {
                    const rowY = py + r * (stoneH + 2 * scale);
                    for (let x = px + startXRel; x < px + endXRel; x += stoneW + 4 * scale) {
                        ctx.fillStyle = COLORS.pathStone;
                        ctx.strokeStyle = COLORS.pathStoneEdge;
                        ctx.lineWidth = 1 * scale;
                        ctx.fillRect(x, rowY, stoneW, stoneH);
                        ctx.strokeRect(x, rowY, stoneW, stoneH);
                    }
                }
            };
            drawHorizontalPath(ox, oy + 40 * scale, -740 * scale, 900 * scale);

            ctx.lineWidth = 3 * scale;
            ctx.strokeStyle = COLORS.outline;
            ctx.fillStyle = '#CFD8DC';
            ctx.fillRect(bx, oy - 120 * scale, buildingW, 120 * scale);
            ctx.strokeRect(bx, oy - 120 * scale, buildingW, 120 * scale);

            const midW = buildingW * 0.95;
            const mx_start = ox - midW / 2;
            ctx.fillStyle = '#B0BEC5';
            ctx.fillRect(mx_start, oy - 230 * scale, midW, 110 * scale);
            ctx.strokeRect(mx_start, oy - 230 * scale, midW, 110 * scale);

            const topW = buildingW * 0.85;
            const tx_start = ox - topW / 2;
            ctx.fillStyle = '#B0BEC5';
            ctx.fillRect(tx_start, oy - 310 * scale, topW, 80 * scale);
            ctx.strokeRect(tx_start, oy - 310 * scale, topW, 80 * scale);

            const pedW = topW * 0.6;
            const px_start = ox - pedW / 2;
            ctx.fillStyle = '#B0BEC5';
            ctx.fillRect(px_start, by, pedW, 70 * scale);
            ctx.strokeRect(px_start, by, pedW, 70 * scale);

            ctx.fillStyle = '#1E88E5';
            ctx.fillRect(px_start - 10 * scale, by, pedW + 20 * scale, 10 * scale);
            ctx.strokeRect(px_start - 10 * scale, by, pedW + 20 * scale, 10 * scale);
            ctx.fillRect(tx_start - 10 * scale, oy - 310 * scale, topW + 20 * scale, 10 * scale);
            ctx.strokeRect(tx_start - 10 * scale, oy - 310 * scale, topW + 20 * scale, 10 * scale);
            ctx.fillRect(mx_start - 10 * scale, oy - 230 * scale, midW + 20 * scale, 10 * scale);
            ctx.strokeRect(mx_start - 10 * scale, oy - 230 * scale, midW + 20 * scale, 10 * scale);
            ctx.fillRect(bx - 10 * scale, oy - 120 * scale, buildingW + 20 * scale, 12 * scale);
            ctx.strokeRect(bx - 10 * scale, oy - 120 * scale, buildingW + 20 * scale, 12 * scale);

            const crossSize = 90 * scale;
            const crossThick = 28 * scale;
            const cy_cross = by + 20 * scale;
            ctx.fillStyle = '#E53935';
            ctx.fillRect(ox - crossThick / 2, cy_cross - crossSize / 2, crossThick, crossSize);
            ctx.fillRect(ox - crossSize / 2, cy_cross - crossThick / 2, crossSize, crossThick);
            ctx.strokeRect(ox - crossThick / 2, cy_cross - crossSize / 2, crossThick, crossSize);
            ctx.strokeRect(ox - crossSize / 2, cy_cross - crossThick / 2, crossSize, crossThick);

            const signW = topW * 0.8;
            const signH = 60 * scale;
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(ox - signW / 2, oy - 300 * scale, signW, signH);
            ctx.strokeRect(ox - signW / 2, oy - 300 * scale, signW, signH);
            ctx.fillStyle = '#E53935';
            ctx.font = `bold ${34 * scale}px VT323`;
            ctx.textAlign = 'center';
            ctx.fillText("HOSPITAL", ox, oy - 258 * scale);

            const winW = 50 * scale;
            const winH = 60 * scale;
            for (let i = 0; i < 5; i++) {
                const wx = mx_start + 40 * scale + i * 80 * scale;
                const wy = oy - 200 * scale;
                ctx.fillStyle = '#81D4FA';
                ctx.fillRect(wx, wy, winW, winH);
                ctx.strokeRect(wx, wy, winW, winH);
            }

            const canW = 180 * scale;
            const canH = 45 * scale;
            const cy_can = oy - 90 * scale;
            ctx.fillStyle = '#1565C0';
            ctx.fillRect(bx + 20 * scale, cy_can, canW, canH);
            ctx.strokeRect(bx + 20 * scale, cy_can, canW, canH);
            ctx.fillStyle = '#546E7A';
            ctx.fillRect(bx + 40 * scale, cy_can + canH, 20 * scale, 90 * scale);
            ctx.strokeRect(bx + 40 * scale, cy_can + canH, 20 * scale, 90 * scale);
            ctx.fillRect(bx + 140 * scale, cy_can + canH, 20 * scale, 90 * scale);
            ctx.strokeRect(bx + 140 * scale, cy_can + canH, 20 * scale, 90 * scale);
            const dx = bx + 80 * scale;
            const dy = oy - 80 * scale;
            ctx.fillStyle = '#B3E5FC';
            ctx.fillRect(dx, dy, 60 * scale, 80 * scale);
            ctx.strokeRect(dx, dy, 60 * scale, 80 * scale);
            ctx.beginPath(); ctx.moveTo(dx + 30 * scale, dy); ctx.lineTo(dx + 30 * scale, oy); ctx.stroke();

            const planW = 180 * scale;
            const planH = 35 * scale;
            const planX = bx + buildingW - planW - 20 * scale;
            const planY = oy - planH;
            ctx.fillStyle = '#8D6E63';
            ctx.fillRect(planX, planY, planW, planH);
            ctx.strokeRect(planX, planY, planW, planH);
            ctx.fillStyle = '#4CAF50';
            for (let i = 0; i < 8; i++) {
                const vx = planX + 12 * scale + i * 22 * scale;
                const vh = (20) * scale;
                ctx.beginPath();
                ctx.ellipse(vx, planY - vh / 2, 8 * scale, vh, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
            }

            const sWinW = 140 * scale;
            const sWinH = 100 * scale;
            ctx.fillStyle = '#81D4FA';
            ctx.fillRect(bx + buildingW - sWinW - 30 * scale, oy - 180 * scale, sWinW, sWinH);
            ctx.strokeRect(bx + buildingW - sWinW - 30 * scale, oy - 180 * scale, sWinW, sWinH);

            const drawConifer = (tx: number, ty: number) => {
                ctx.strokeStyle = COLORS.outline;
                ctx.fillStyle = '#4E342E';
                ctx.fillRect(tx - 12 * scale, ty - 40 * scale, 24 * scale, 40 * scale);
                ctx.strokeRect(tx - 12 * scale, ty - 40 * scale, 24 * scale, 40 * scale);
                const foliageCol = isNight ? '#0B2E13' : '#2E7D32';
                ctx.fillStyle = foliageCol;
                ctx.beginPath(); ctx.moveTo(tx - 70 * scale, ty + 10 * scale - 40 * scale); ctx.lineTo(tx, ty - 60 * scale - 40 * scale); ctx.lineTo(tx + 70 * scale, ty + 10 * scale - 40 * scale); ctx.closePath(); ctx.fill(); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(tx - 55 * scale, ty - 30 * scale - 40 * scale); ctx.lineTo(tx, ty - 100 * scale - 40 * scale); ctx.lineTo(tx + 55 * scale, ty - 30 * scale - 40 * scale); ctx.closePath(); ctx.fill(); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(tx - 40 * scale, ty - 70 * scale - 40 * scale); ctx.lineTo(tx, ty - 140 * scale - 40 * scale); ctx.lineTo(tx + 40 * scale, ty - 70 * scale - 40 * scale); ctx.closePath(); ctx.fill(); ctx.stroke();
            };
            drawConifer(bx + buildingW + 150 * scale, oy);
            drawConifer(bx + buildingW + 350 * scale, oy);

            hospitalHitBox.current = {
                x: bx - 100 * scale,
                y: by - 120 * scale,
                w: buildingW + 600 * scale,
                h: mainH + 200 * scale
            };
        }

        const drawSevaHub = (ox: number, oy: number) => {
            const buildingW = 320 * scale;
            const mainH = 180 * scale;
            const bx = ox - buildingW / 2;
            const by = oy - mainH;

            ctx.lineWidth = 3 * scale;
            ctx.strokeStyle = COLORS.outline;

            ctx.fillStyle = '#F5CBA7';
            ctx.fillRect(bx, by, buildingW, mainH);
            ctx.strokeRect(bx, by, buildingW, mainH);

            const dW = 80 * scale;
            const doorH = 130 * scale;
            const dx = ox - dW / 2;
            const dy = oy - doorH;
            ctx.fillStyle = '#8D6E63';
            ctx.beginPath();
            ctx.roundRect(dx, dy, dW, doorH, [40 * scale, 40 * scale, 0, 0]);
            ctx.fill();
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(dx + dW / 3, dy + 20 * scale); ctx.lineTo(dx + dW / 3, oy);
            ctx.moveTo(dx + 2 * dW / 3, dy + 20 * scale); ctx.lineTo(dx + 2 * dW / 3, oy);
            ctx.stroke();

            ctx.fillStyle = '#2C2C3E';
            ctx.fillRect(ox - 10 * scale, dy + 40 * scale, 20 * scale, 20 * scale);
            ctx.strokeRect(ox - 10 * scale, dy + 40 * scale, 20 * scale, 20 * scale);

            const drawSWindow = (wx: number) => {
                const wSize = 65 * scale;
                const wy = by + 50 * scale;
                ctx.fillStyle = '#5D4037';
                ctx.fillRect(wx, wy, wSize, wSize);
                ctx.strokeRect(wx, wy, wSize, wSize);
                ctx.fillStyle = '#2C2C3E';
                ctx.fillRect(wx + 8 * scale, wy + 8 * scale, wSize - 16 * scale, wSize - 16 * scale);
                ctx.strokeStyle = '#000000'; ctx.lineWidth = 1 * scale;
                ctx.beginPath();
                ctx.moveTo(wx + wSize / 2, wy + 8 * scale); ctx.lineTo(wx + wSize / 2, wy + wSize - 8 * scale);
                ctx.moveTo(wx + 8 * scale, wy + wSize / 2); ctx.lineTo(wx + wSize - 8 * scale, wy + wSize / 2);
                ctx.stroke();
                ctx.lineWidth = 3 * scale;
            };
            drawSWindow(bx + 20 * scale);
            drawSWindow(bx + buildingW - 20 * scale - 65 * scale);

            ctx.fillStyle = '#B33030';
            ctx.beginPath();
            const roofOver = 25 * scale;
            ctx.moveTo(bx - roofOver, by);
            ctx.lineTo(ox, by - 60 * scale);
            ctx.lineTo(bx + buildingW + roofOver, by);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#D32F2F';
            ctx.beginPath();
            ctx.moveTo(bx - 15 * scale, by - 5 * scale);
            ctx.lineTo(ox, by - 50 * scale);
            ctx.lineTo(bx + buildingW + 15 * scale, by - 5 * scale);
            ctx.closePath();
            ctx.fill();

            const drawFence = (fx: number) => {
                const fH = 60 * scale;
                const fW = 12 * scale;
                const fGap = 16 * scale;
                ctx.fillStyle = '#5D4037';
                for (let i = 0; i < 4; i++) {
                    const curX = fx - i * fGap;
                    ctx.fillRect(curX, oy - fH, fW, fH);
                    ctx.strokeRect(curX, oy - fH, fW, fH);
                    ctx.beginPath(); ctx.moveTo(curX, oy - fH); ctx.lineTo(curX + fW / 2, oy - fH - 8 * scale); ctx.lineTo(curX + fW, oy - fH); ctx.fill();
                }
                ctx.fillRect(fx - 4 * fGap, oy - 45 * scale, 4 * fGap, 10 * scale);
                ctx.strokeRect(fx - 4 * fGap, oy - 45 * scale, 4 * fGap, 10 * scale);
            };
            drawFence(bx - 10 * scale);

            sevaHubHitBox.current = {
                x: bx - 80 * scale,
                y: by - 70 * scale,
                w: buildingW + 160 * scale,
                h: mainH + 100 * scale
            };

            ctx.fillStyle = '#FFFFFF';
            ctx.font = `bold ${24 * scale}px VT323`;
            ctx.textAlign = 'center';
            ctx.shadowBlur = 4; ctx.shadowColor = '#000';
            ctx.fillText("SEVA HUB", ox, by - 75 * scale);
            ctx.shadowBlur = 0;
        };

        const drawFencing = (ox: number, oy: number) => {
            const frontY = oy + 320 * scale; const backY = oy + 40 * scale; const leftX = ox - 540 * scale; const rightX = ox + 540 * scale; const gap = 180 * scale;
            ctx.strokeStyle = COLORS.outline; ctx.lineWidth = 3 * scale;
            const drawSection = (x1: number, x2: number, y: number) => {
                ctx.beginPath(); ctx.moveTo(x1, y); ctx.lineTo(x2, y); ctx.moveTo(x1, y + 60 * scale); ctx.lineTo(x2, y + 60 * scale); ctx.stroke();
                for (let x = x1 + 10 * scale; x < x2; x += 15 * scale) {
                    ctx.beginPath(); ctx.moveTo(x, y - 10 * scale); ctx.lineTo(x, y + 80 * scale); ctx.stroke();
                    ctx.fillStyle = COLORS.outline; ctx.beginPath(); ctx.moveTo(x - 4 * scale, y - 8 * scale); ctx.lineTo(x, y - 18 * scale); ctx.lineTo(x + 4 * scale, y - 8 * scale); ctx.fill();
                }
            };
            drawSection(leftX, ox - gap / 2, frontY); drawSection(ox + gap / 2, rightX, frontY);
            const drawSideFence = (x: number) => { for (let sy = backY + 10 * scale; sy < frontY - 10 * scale; sy += 15 * scale) { ctx.beginPath(); ctx.moveTo(x, sy - 10 * scale); ctx.lineTo(x, sy + 10 * scale); ctx.stroke(); } };
            drawSideFence(leftX); drawSideFence(rightX);
            const drawPillar = (px: number, py: number) => {
                ctx.fillStyle = COLORS.pillar; ctx.fillRect(px - 30 * scale, py - 60 * scale, 60 * scale, 140 * scale); ctx.strokeRect(px - 30 * scale, py - 60 * scale, 60 * scale, 140 * scale);
                ctx.fillRect(px - 35 * scale, py - 65 * scale, 70 * scale, 10 * scale); ctx.strokeRect(px - 35 * scale, py - 65 * scale, 70 * scale, 10 * scale);
                ctx.fillStyle = '#333'; ctx.fillRect(px - 10 * scale, py - 100 * scale, 20 * scale, 35 * scale); ctx.strokeRect(px - 10 * scale, py - 100 * scale, 20 * scale, 35 * scale);
                const glow = (Math.sin(ticker / 10) + 1) / 2; ctx.fillStyle = isNight ? `rgba(255, 235, 59, ${0.5 + 0.5 * glow})` : '#FFEB3B'; ctx.fillRect(px - 6 * scale, py - 95 * scale, 12 * scale, 20 * scale);
            };
            drawPillar(ox - gap / 2 - 30 * scale, frontY); drawPillar(ox + gap / 2 + 30 * scale, frontY);
            const dw = gap / 2; const dh = 100 * scale; const gy_gate = frontY - 20 * scale;
            const drawGateHalf = (gx: number) => {
                ctx.fillStyle = 'rgba(0,0,0,0.1)'; ctx.fillRect(gx, gy_gate, dw, dh); ctx.strokeStyle = COLORS.outline; ctx.strokeRect(gx, gy_gate, dw, dh);
                ctx.beginPath(); ctx.arc(gx + dw / 2, gy_gate + dh / 2, 20 * scale, 0, Math.PI * 2); ctx.stroke();
                for (let i = 1; i < 4; i++) { ctx.beginPath(); ctx.moveTo(gx + (dw / 4) * i, gy_gate); ctx.lineTo(gx + (dw / 4) * i, gy_gate + dh); ctx.stroke(); }
            };
            drawGateHalf(ox - gap / 2); drawGateHalf(ox);
        };
        drawFencing(cx, cy);

        const drawYogaCenter = (zx: number, zy: number) => {
            const studioW = 380 * scale;
            const studioH = 200 * scale;
            const sx = zx - studioW / 2;
            const sy = zy - studioH / 2;
            ctx.strokeStyle = COLORS.outline;
            ctx.lineWidth = 3 * scale;
            ctx.fillStyle = COLORS.yogaWall;
            ctx.fillRect(sx, sy, studioW, studioH);
            ctx.strokeRect(sx, sy, studioW, studioH);
            const roofH = 35 * scale;
            const roofOver = 10 * scale;
            ctx.fillStyle = COLORS.yogaRoof;
            ctx.fillRect(sx - roofOver, sy - roofH, studioW + roofOver * 2, roofH);
            ctx.strokeRect(sx - roofOver, sy - roofH, studioW + roofOver * 2, roofH);
            const doorW = 60 * scale;
            const doorH = 110 * scale;
            const winPadding = 12 * scale;
            const winW = (studioW - doorW - winPadding * 4) / 2;
            const winH = studioH - winPadding * 2;
            const winY = sy + winPadding;
            ctx.fillStyle = COLORS.yogaFloor;
            ctx.fillRect(sx + 5 * scale, sy + studioH - 25 * scale, studioW - 10 * scale, 20 * scale);
            ctx.fillStyle = '#E91E63';
            ctx.fillRect(sx + doorW + winPadding * 2, sy + studioH - 18 * scale, 35 * scale, 6 * scale);
            ctx.fillStyle = '#00BCD4';
            ctx.fillRect(sx + doorW + winW + winPadding * 3, sy + studioH - 18 * scale, 35 * scale, 6 * scale);
            const dx = sx + winPadding;
            const dy = sy + studioH - doorH - 4 * scale;
            ctx.fillStyle = '#D7CCC8';
            ctx.fillRect(dx, dy, doorW, doorH);
            ctx.strokeRect(dx, dy, doorW, doorH);
            ctx.fillStyle = 'rgba(232, 245, 248, 0.4)';
            ctx.beginPath();
            ctx.arc(dx + doorW / 2, dy + 30 * scale, 14 * scale, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = '#8D6E63';
            ctx.fillRect(dx + doorW - 10 * scale, dy + doorH / 2, 4 * scale, 10 * scale);
            const drawWinYoga = (wx: number) => {
                ctx.fillStyle = COLORS.yogaWindow;
                ctx.fillRect(wx, winY, winW, winH);
                ctx.strokeRect(wx, winY, winW, winH);
                ctx.strokeStyle = 'rgba(255,255,255,0.4)';
                ctx.lineWidth = 3 * scale;
                ctx.beginPath();
                ctx.moveTo(wx + 8 * scale, winY + 8 * scale);
                ctx.lineTo(wx + 20 * scale, winY + 8 * scale);
                ctx.moveTo(wx + 8 * scale, winY + 20 * scale);
                ctx.lineTo(wx + 15 * scale, winY + 20 * scale);
                ctx.stroke();
                ctx.strokeStyle = COLORS.outline;
                ctx.lineWidth = 3 * scale;
            };
            drawWinYoga(dx + doorW + winPadding);
            drawWinYoga(dx + doorW + winPadding * 2 + winW);
            const potBottom = sy + studioH + 10 * scale;
            const potSpacing = (studioW - 40 * scale) / 4;
            for (let i = 0; i < 5; i++) {
                const px = sx + 20 * scale + i * potSpacing;
                const py = potBottom;
                const potW = 30 * scale;
                const potH = 26 * scale;
                ctx.fillStyle = COLORS.clayPot;
                ctx.beginPath();
                ctx.moveTo(px - potW / 2, py);
                ctx.lineTo(px + potW / 2, py);
                ctx.lineTo(px + potW / 3, py + potH);
                ctx.lineTo(px + potW / 3, py + potH);
                ctx.lineTo(px - potW / 3, py + potH);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
                ctx.fillStyle = COLORS.leaf;
                ctx.beginPath();
                ctx.ellipse(px, py - 10 * scale, 14 * scale, 7 * scale, 0, 0, Math.PI * 2);
                ctx.ellipse(px - 8 * scale, py - 6 * scale, 11 * scale, 6 * scale, 0, 0, Math.PI * 2);
                ctx.ellipse(px + 8 * scale, py - 6 * scale, 11 * scale, 6 * scale, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
            }

            yogaHitBox.current = {
                x: sx - 40 * scale,
                y: sy - 40 * scale,
                w: studioW + 80 * scale,
                h: studioH + 80 * scale
            };
        };

        const drawRestaurant = (zx: number, zy: number) => {
            const buildingW = 380 * scale;
            const buildingH = 200 * scale;
            const bx = zx - buildingW / 2;
            const by = zy - buildingH;

            ctx.strokeStyle = COLORS.outline;
            ctx.lineWidth = 3 * scale;

            ctx.fillStyle = '#FEF9E7';
            ctx.fillRect(bx, by, buildingW, buildingH);
            ctx.strokeRect(bx, by, buildingW, buildingH);

            ctx.fillStyle = '#E67E22';
            const rH = 40 * scale;
            ctx.beginPath();
            ctx.moveTo(bx + 40 * scale, by);
            ctx.lineTo(zx, by - rH);
            ctx.lineTo(bx + buildingW - 40 * scale, by);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            const drawChimney = (cx_ch: number) => {
                ctx.fillStyle = '#E74C3C';
                ctx.fillRect(cx_ch - 15 * scale, by - 40 * scale, 30 * scale, 40 * scale);
                ctx.strokeRect(cx_ch - 15 * scale, by - 40 * scale, 30 * scale, 40 * scale);
                ctx.fillStyle = '#2C3E50';
                ctx.fillRect(cx_ch - 18 * scale, by - 48 * scale, 36 * scale, 10 * scale);
                ctx.strokeRect(cx_ch - 18 * scale, by - 48 * scale, 36 * scale, 10 * scale);
            };
            drawChimney(bx + 50 * scale);
            drawChimney(bx + buildingW - 50 * scale);

            const winY_res = by + 15 * scale;
            const lWinW = 80 * scale;
            const lWinH = 45 * scale;
            ctx.fillStyle = '#A04000';
            ctx.fillRect(bx + 25 * scale, winY_res, lWinW, lWinH);
            ctx.strokeRect(bx + 25 * scale, winY_res, lWinW, lWinH);
            ctx.fillStyle = '#FAD7A0';
            ctx.fillRect(bx + 31 * scale, winY_res + 6 * scale, lWinW - 12 * scale, lWinH - 12 * scale);

            const rWinW = 180 * scale;
            const rWinH = 50 * scale;
            ctx.fillStyle = '#2C3E50';
            ctx.fillRect(bx + 130 * scale, winY_res, rWinW, rWinH);
            ctx.strokeRect(bx + 130 * scale, winY_res, rWinW, rWinH);
            ctx.fillStyle = '#85C1E9';
            ctx.fillRect(bx + 138 * scale, winY_res + 8 * scale, rWinW - 16 * scale, rWinH - 16 * scale);

            const awningY = by + 80 * scale;
            const awningH = 35 * scale;
            const nS = 10;
            const sW = buildingW / nS;
            for (let i = 0; i < nS; i++) {
                ctx.fillStyle = i % 2 === 0 ? '#E74C3C' : '#FFFFFF';
                ctx.fillRect(bx + i * sW, awningY, sW, awningH);
                ctx.strokeRect(bx + i * sW, awningY, sW, awningH);
                ctx.beginPath();
                ctx.arc(bx + i * sW + sW / 2, awningY + awningH, sW / 2, 0, Math.PI);
                ctx.fill(); ctx.stroke();
            }

            const shopY = by + 125 * scale;
            const shopH = 70 * scale;
            ctx.fillStyle = '#85C1E9';
            ctx.fillRect(bx + 20 * scale, shopY, 190 * scale, shopH);
            ctx.strokeRect(bx + 20 * scale, shopY, 190 * scale, shopH);

            const dW = 80 * scale;
            const doorH = 100 * scale;
            const dx_door = bx + buildingW - dW - 30 * scale;
            ctx.fillStyle = '#2980B9';
            ctx.fillRect(dx_door, zy - doorH, dW, doorH);
            ctx.strokeRect(dx_door, zy - doorH, dW, doorH);

            // Level Badge
            if (gameState.restaurantLevel && gameState.restaurantLevel > 0) {
                const badgeX = bx + buildingW / 2;
                const badgeY = by - 30 * scale;
                const outerRadius = 24 * scale;
                const innerRadius = 12 * scale;

                // Star shape background
                ctx.fillStyle = '#FFD700'; // Gold
                ctx.strokeStyle = '#F57F17';
                ctx.beginPath();
                const spikes = 5;
                let rot = Math.PI / 2 * 3;
                let x = badgeX;
                let y = badgeY;
                const step = Math.PI / spikes;

                ctx.moveTo(badgeX, badgeY - outerRadius);
                for (let i = 0; i < spikes; i++) {
                    x = badgeX + Math.cos(rot) * outerRadius;
                    y = badgeY + Math.sin(rot) * outerRadius;
                    ctx.lineTo(x, y);
                    rot += step;

                    x = badgeX + Math.cos(rot) * innerRadius;
                    y = badgeY + Math.sin(rot) * innerRadius;
                    ctx.lineTo(x, y);
                    rot += step;
                }
                ctx.lineTo(badgeX, badgeY - outerRadius);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();

                // Text
                ctx.fillStyle = '#000000';
                ctx.font = `bold ${20 * scale}px sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(gameState.restaurantLevel.toString(), badgeX, badgeY + 2 * scale);
            }

            const counterY = zy - 30 * scale;
            const counterW = 210 * scale;
            ctx.fillStyle = '#E74C3C';
            ctx.fillRect(bx + 15 * scale, counterY, counterW, 30 * scale);
            ctx.strokeRect(bx + 15 * scale, counterY, counterW, 30 * scale);

            restaurantHitBox.current = { x: bx - 50 * scale, y: by - 50 * scale, w: buildingW + 100 * scale, h: buildingH + 100 * scale };
        };

        const drawGym = (zx: number, zy: number) => {
            const buildingW = 380 * scale;
            const buildingH = 200 * scale;
            const bx = zx - buildingW / 2;
            const by = zy - buildingH;

            ctx.strokeStyle = COLORS.outline;
            ctx.lineWidth = 3 * scale;

            ctx.fillStyle = '#2C2C2E';
            ctx.fillRect(bx, by + buildingH * 0.6, buildingW, buildingH * 0.4);
            ctx.strokeRect(bx, by + buildingH * 0.6, buildingW, buildingH * 0.4);

            ctx.fillStyle = '#880E4F';
            ctx.fillRect(bx, by, buildingW, buildingH * 0.6);
            ctx.strokeRect(bx, by, buildingW, buildingH * 0.6);

            const centralW = 140 * scale;
            const centralH = buildingH * 0.9;
            const cx_sign = zx - centralW / 2;
            const cy_sign = zy - centralH;
            ctx.fillStyle = '#AD1457';
            ctx.fillRect(cx_sign, cy_sign, centralW, centralH);
            ctx.strokeRect(cx_sign, cy_sign, centralW, centralH);

            ctx.fillStyle = '#FFFFFF';
            ctx.font = `bold ${40 * scale}px VT323`;
            ctx.textAlign = 'center';
            ctx.fillText("GYM", zx, cy_sign + 60 * scale);

            const bbY_gym = cy_sign - 30 * scale;
            const barW_gym = 100 * scale;
            ctx.strokeStyle = '#424242';
            ctx.lineWidth = 6 * scale;
            ctx.beginPath(); ctx.moveTo(zx - barW_gym / 2, bbY_gym); ctx.lineTo(zx + barW_gym / 2, bbY_gym); ctx.stroke();
            const drawP = (px_p: number) => {
                ctx.fillStyle = '#212121';
                ctx.strokeStyle = COLORS.outline;
                ctx.fillRect(px_p - 15 * scale, bbY_gym - 20 * scale, 30 * scale, 40 * scale);
                ctx.strokeRect(px_p - 15 * scale, bbY_gym - 20 * scale, 30 * scale, 40 * scale);
            };
            drawP(zx - barW_gym / 2 + 10 * scale); drawP(zx + barW_gym / 2 - 10 * scale);

            gymHitBox.current = { x: bx - 20 * scale, y: by - 40 * scale, w: buildingW + 40 * scale, h: buildingH + 40 * scale };
        };

        const drawCampingArea = (zx: number, zy: number) => {
            const tentW = 240 * scale;
            const tentH = 180 * scale;
            const tx = zx - 180 * scale;
            const ty = zy + 160 * scale;
            ctx.strokeStyle = COLORS.outline;
            ctx.fillStyle = '#4A1C1C';
            ctx.beginPath(); ctx.moveTo(tx + tentW / 2, ty - tentH); ctx.lineTo(tx + tentW / 2 - 40 * scale, ty); ctx.lineTo(tx + tentW / 2 + 40 * scale, ty); ctx.closePath(); ctx.fill(); ctx.stroke();
            const nS_tent = 8; const sW_tent = tentW / nS_tent;
            for (let i = 0; i < nS_tent; i++) {
                if (i >= 3 && i <= 4) continue;
                ctx.fillStyle = i % 2 === 0 ? '#D32F2F' : '#FFFFFF';
                const xL = tx + i * sW_tent; const xR = tx + (i + 1) * sW_tent;
                ctx.beginPath(); ctx.moveTo(xL, ty); ctx.lineTo(xR, ty); ctx.lineTo(tx + tentW / 2, ty - tentH); ctx.closePath(); ctx.fill(); ctx.stroke();
            }
            const signX = zx + 140 * scale; const signY = zy + 160 * scale;
            ctx.fillStyle = '#3E2723'; ctx.fillRect(signX - 10 * scale, signY - 140 * scale, 20 * scale, 140 * scale); ctx.strokeRect(signX - 10 * scale, signY - 140 * scale, 20 * scale, 140 * scale);
            const drawPl = (px_pl: number, py_pl: number, pW_pl: number, pH_pl: number, tilt_pl: number) => {
                ctx.save(); ctx.translate(px_pl, py_pl); ctx.rotate(tilt_pl); ctx.fillStyle = '#D1A377'; ctx.strokeStyle = COLORS.outline; ctx.fillRect(-pW_pl / 2, -pH_pl / 2, pW_pl, pH_pl); ctx.strokeRect(-pW_pl / 2, -pH_pl / 2, pW_pl, pH_pl); ctx.restore();
            };
            drawPl(signX, signY - 130 * scale, 160 * scale, 35 * scale, 0.02);
            drawPl(signX - 10 * scale, signY - 90 * scale, 140 * scale, 35 * scale, -0.01);
            const fx = zx + 280 * scale; const fy = zy + 200 * scale;
            ctx.fillStyle = '#5D4037'; for (let i = 0; i < 6; i++) { ctx.save(); ctx.translate(fx, fy); ctx.rotate((i * Math.PI * 2) / 6); ctx.strokeStyle = COLORS.outline; ctx.fillRect(-25 * scale, -6 * scale, 50 * scale, 12 * scale); ctx.strokeRect(-25 * scale, -6 * scale, 50 * scale, 12 * scale); ctx.restore(); }
            const flick = Math.sin(ticker / 4) * 8 * scale; ctx.fillStyle = '#FF5722'; ctx.beginPath(); ctx.moveTo(fx - 30 * scale, fy - 5 * scale); ctx.quadraticCurveTo(fx, fy - 110 * scale - flick, fx + 30 * scale, fy - 5 * scale); ctx.fill();
            campingHitBox.current = { x: zx - 200 * scale, y: zy, w: 650 * scale, h: 350 * scale };
        };

        const drawShopStall = (sx: number, sy: number) => {
            const stallW = 120 * scale;
            const stallH = 100 * scale;
            const bx = sx - stallW / 2;

            ctx.strokeStyle = COLORS.outline;
            ctx.lineWidth = 3 * scale;

            ctx.fillStyle = '#8D6E63';
            ctx.fillRect(bx, sy, stallW, 40 * scale);
            ctx.strokeRect(bx, sy, stallW, 40 * scale);

            ctx.beginPath();
            ctx.strokeStyle = 'rgba(0,0,0,0.1)';
            for (let i = 1; i < 3; i++) {
                ctx.moveTo(bx + (stallW / 3) * i, sy + 2 * scale);
                ctx.lineTo(bx + (stallW / 3) * i, sy + 38 * scale);
            }
            ctx.stroke();

            ctx.fillStyle = '#FFD54F';
            ctx.font = `bold ${16 * scale}px VT323`;
            ctx.textAlign = 'center';
            ctx.fillText("SHOP", sx, sy + 25 * scale);
            ctx.strokeStyle = COLORS.outline;
            ctx.lineWidth = 0.5 * scale;
            ctx.strokeText("SHOP", sx, sy + 25 * scale);

            ctx.lineWidth = 3 * scale;
            ctx.strokeStyle = COLORS.outline;
            ctx.fillStyle = '#5D4037';
            ctx.fillRect(bx + 10 * scale, sy - 55 * scale, 6 * scale, 55 * scale);
            ctx.strokeRect(bx + 10 * scale, sy - 55 * scale, 6 * scale, 55 * scale);
            ctx.fillRect(bx + stallW - 16 * scale, sy - 55 * scale, 6 * scale, 55 * scale);
            ctx.strokeRect(bx + stallW - 16 * scale, sy - 55 * scale, 6 * scale, 55 * scale);

            const awningW = stallW + 24 * scale;
            const awningH = 35 * scale;
            const ax = sx - awningW / 2;
            const ay = sy - 70 * scale;
            const numStripes = 6;
            const stripeW = awningW / numStripes;
            for (let i = 0; i < numStripes; i++) {
                ctx.fillStyle = i % 2 === 0 ? '#D32F2F' : '#FFFFFF';
                ctx.fillRect(ax + i * stripeW, ay, stripeW, awningH);
                ctx.strokeRect(ax + i * stripeW, ay, stripeW, awningH);
                ctx.beginPath();
                ctx.arc(ax + i * stripeW + stripeW / 2, ay + awningH, stripeW / 2, 0, Math.PI);
                ctx.fill();
                ctx.stroke();
            }

            shopHitBox.current = { x: ax, y: ay, w: awningW, h: stallH + 40 * scale };
        };

        const drawCharacters = (ox: number, oy: number) => {
            const groundLevel = oy + 420 * scale;
            const cs = scale * 2.8;
            const breathe = Math.sin(ticker / 25) * 1.5 * cs;
            const armSway = Math.sin(ticker / 15) * 5 * cs;
            const headBob = Math.sin(ticker / 30) * 1 * cs;
            const ux = ox - 60 * scale; const uy = groundLevel - 40 * scale + breathe;
            userHitBox.current = { x: ux - 25 * cs, y: uy - 20 * cs, w: 50 * cs, h: 100 * cs };

            ctx.strokeStyle = COLORS.outline;
            ctx.lineWidth = 3 * scale;

            ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.beginPath(); ctx.ellipse(ux, groundLevel + 40 * scale, 22 * cs, 8 * cs, 0, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#3E2723'; const legY = uy + 30 * cs; ctx.fillRect(ux - 11 * cs, legY, 8 * cs, 12 * cs); ctx.strokeRect(ux - 11 * cs, legY, 8 * cs, 12 * cs); ctx.fillRect(ux + 3 * cs, legY, 8 * cs, 12 * cs); ctx.strokeRect(ux + 3 * cs, legY, 8 * cs, 12 * cs);

            ctx.strokeStyle = COLORS.outline;
            ctx.lineWidth = 10 * cs;
            ctx.beginPath(); ctx.moveTo(ux - 12 * cs, uy + 12 * cs); ctx.lineTo(ux - 24 * cs - armSway, uy + 22 * cs); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(ux + 12 * cs, uy + 12 * cs); ctx.lineTo(ux + 24 * cs + armSway, uy + 22 * cs); ctx.stroke();

            ctx.strokeStyle = COLORS.outline;
            ctx.lineWidth = 3 * scale;
            ctx.fillStyle = '#FFB74D'; drawRoundedRect(ctx, ux - 16 * cs, uy + 2 * cs, 32 * cs, 30 * cs, 10 * cs);
            const hY = uy - 22 * cs + headBob; ctx.fillStyle = '#FFE0B2'; drawRoundedRect(ctx, ux - 15 * cs, hY, 30 * cs, 28 * cs, 10 * cs);
            ctx.fillStyle = '#000000'; ctx.beginPath(); ctx.roundRect(ux - 16 * cs, hY - 4 * cs, 32 * cs, 14 * cs, 8 * cs); ctx.fill(); ctx.stroke();

            const isBlinking = (ticker % 180) < 15;

            const eyeY = hY + 18 * cs;
            if (isBlinking) {
                ctx.strokeStyle = '#000000';
                ctx.lineWidth = 1.5 * cs;
                ctx.beginPath(); ctx.moveTo(ux - 11 * cs, eyeY); ctx.lineTo(ux - 5 * cs, eyeY); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(ux + 5 * cs, eyeY); ctx.lineTo(ux + 11 * cs, eyeY); ctx.stroke();
            } else {
                ctx.fillStyle = '#000000';
                ctx.beginPath(); ctx.arc(ux - 8 * cs, eyeY, 1.8 * cs, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.arc(ux + 8 * cs, eyeY, 1.8 * cs, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#FFFFFF';
                ctx.beginPath(); ctx.arc(ux - 9 * cs, eyeY - 0.5 * cs, 0.8 * cs, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.arc(ux + 7 * cs, eyeY - 0.5 * cs, 0.8 * cs, 0, Math.PI * 2); ctx.fill();
            }

            const bx_char = ox + 100 * scale; const by_char = groundLevel - 20 * scale + Math.sin(ticker / 20) * 15 * scale;
            sproutHitBox.current = { x: bx_char - 40 * scale, y: by_char - 40 * scale, w: 80 * scale, h: 80 * scale };

            ctx.strokeStyle = '#388E3C';
            ctx.lineWidth = 3 * scale;
            const antennaTopY = by_char - 28 * scale;
            ctx.beginPath();
            ctx.moveTo(bx_char, antennaTopY);
            ctx.lineTo(bx_char, antennaTopY - 20 * scale);
            ctx.stroke();
            ctx.fillStyle = '#4CAF50';
            ctx.beginPath();
            ctx.ellipse(bx_char + 8 * scale, antennaTopY - 22 * scale, 10 * scale, 5 * scale, Math.PI / 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            ctx.lineWidth = 3 * scale;
            ctx.strokeStyle = COLORS.outline;
            ctx.fillStyle = '#ECEFF1'; drawRoundedRect(ctx, bx_char - 35 * scale, by_char - 28 * scale, 70 * scale, 56 * scale, 14 * scale);
            ctx.fillStyle = '#37474F'; drawRoundedRect(ctx, bx_char - 25 * scale, by_char - 20 * scale, 50 * scale, 40 * scale, 8 * scale);

            ctx.fillStyle = '#FFFFFF';
            if (isBlinking) {
                ctx.strokeStyle = '#FFFFFF';
                ctx.lineWidth = 2 * scale;
                ctx.beginPath(); ctx.moveTo(bx_char - 16 * scale, by_char); ctx.lineTo(bx_char - 8 * scale, by_char); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(bx_char + 8 * scale, by_char); ctx.lineTo(bx_char + 16 * scale, by_char); ctx.stroke();
            } else {
                ctx.beginPath(); ctx.arc(bx_char - 12 * scale, by_char, 3.5 * scale, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.arc(bx_char + 12 * scale, by_char, 3.5 * scale, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.arc(bx_char - 10 * scale, by_char - 1.5 * scale, 1.5 * scale, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.arc(bx_char + 14 * scale, by_char - 1.5 * scale, 1.5 * scale, 0, Math.PI * 2); ctx.fill();
            }
        };
        drawCharacters(cx, cy);

        const drawTrees = () => {
            ctx.strokeStyle = COLORS.outline;
            ctx.lineWidth = 3 * scale;
            TREE_LOCATIONS.forEach((t_loc, i_tree) => {
                const tx_tree = cx + t_loc.x * scale; const ty_tree = cy + t_loc.y * scale;
                if (!gameState.removedTrees.includes(i_tree)) {
                    treeHitBoxes.current.push({ id: i_tree, x: tx_tree - 70 * scale, y: ty_tree - 140 * scale, w: 140 * scale, h: 160 * scale });
                    const isChop = choppingState?.index === i_tree; let shkX = 0; if (isChop && choppingState!.frame >= 22) { shkX = (Math.random() - 0.5) * 12 * scale; }
                    ctx.fillStyle = '#4E342E'; ctx.fillRect(tx_tree - 12 * scale + shkX, ty_tree, 24 * scale, 40 * scale); ctx.strokeRect(tx_tree - 12 * scale + shkX, ty_tree, 24 * scale, 40 * scale);
                    const foliageC = isNight ? '#0B2E13' : '#2E7D32'; ctx.fillStyle = foliageC;
                    ctx.beginPath(); ctx.moveTo(tx_tree - 70 * scale + shkX, ty_tree + 10 * scale); ctx.lineTo(tx_tree + shkX, ty_tree - 60 * scale); ctx.lineTo(tx_tree + 70 * scale + shkX, ty_tree + 10 * scale); ctx.closePath(); ctx.fill(); ctx.stroke();
                    ctx.beginPath(); ctx.moveTo(tx_tree - 55 * scale + shkX, ty_tree - 30 * scale); ctx.lineTo(tx_tree + shkX, ty_tree - 100 * scale); ctx.lineTo(tx_tree + 55 * scale + shkX, ty_tree - 30 * scale); ctx.closePath(); ctx.fill(); ctx.stroke();
                    ctx.beginPath(); ctx.moveTo(tx_tree - 40 * scale + shkX, ty_tree - 70 * scale); ctx.lineTo(tx_tree + shkX, ty_tree - 140 * scale); ctx.lineTo(tx_tree + 40 * scale + shkX, ty_tree - 70 * scale); ctx.closePath(); ctx.fill(); ctx.stroke();
                }
            });
        };
        drawTrees();

        if (choppingState !== null) {
            const trP = TREE_LOCATIONS[choppingState.index];
            const tx_chp = cx + trP.x * scale; const ty_chp = cy + trP.y * scale; const f_chp = choppingState.frame;
            let a_chp = -Math.PI / 2; if (f_chp < 15) { a_chp = -Math.PI / 2 - (f_chp / 15) * (Math.PI / 3); } else if (f_chp < 22) { const p_chp = (f_chp - 15) / 7; const s_chp = -Math.PI / 2 - Math.PI / 3; const t_chp = Math.PI / 4; a_chp = s_chp + p_chp * (t_chp - s_chp); } else { a_chp = Math.PI / 4; }
            ctx.save(); ctx.translate(tx_chp - 40 * scale, ty_chp - 60 * scale); ctx.rotate(a_chp); ctx.strokeStyle = COLORS.outline; ctx.fillStyle = '#5D4037'; ctx.fillRect(0, -5 * scale, 70 * scale, 10 * scale); ctx.strokeRect(0, -5 * scale, 70 * scale, 10 * scale); ctx.fillStyle = '#90A4AE'; ctx.fillRect(60 * scale, -25 * scale, 50 * scale, 50 * scale); ctx.strokeRect(60 * scale, -25 * scale, 50 * scale, 50 * scale); ctx.restore();
        }

        const drawLushGarden = (ox: number, oy: number) => {
            const left_g = ox - 400 * scale; const topY_g = oy + 350 * scale;
            const flC = Math.min(60, Math.floor(gameState.score / 5));
            for (let i = 0; i < flC; i++) {
                const seed_g = i * 42.123; const hx_g = left_g + (Math.abs(Math.sin(seed_g)) * 800 * scale); const hy_g = topY_g + (Math.abs(Math.cos(seed_g * 0.7)) * 200 * scale);
                ctx.strokeStyle = '#388E3C'; ctx.lineWidth = 2 * scale; ctx.beginPath(); ctx.moveTo(hx_g, hy_g); ctx.lineTo(hx_g, hy_g - 10 * scale); ctx.stroke();
                const col_g = ['#FF4081', '#FFEB3B', '#7C4DFF', '#00BCD4', '#FF5722'];
                ctx.fillStyle = col_g[i % col_g.length]; ctx.beginPath(); ctx.arc(hx_g, hy_g - 12 * scale, 4 * scale, 0, Math.PI * 2); ctx.fill();
            }
        };
        drawLushGarden(cx, cy);

        const isUnlocked = (z_un: ZoneType) => gameState.unlockedZones.includes(z_un);
        if (isUnlocked('camping')) drawCampingArea(cx - 1400 * scale, cy - 400 * scale);
        if (isUnlocked('yoga')) drawYogaCenter(cx + 600 * scale, cy - 300 * scale);
        if (isUnlocked('salon')) drawRestaurant(cx, cy - 450 * scale);
        if (isUnlocked('gym')) drawGym(cx - 1000 * scale, cy + 650 * scale);
        if (gameState.level >= 5 || isUnlocked('sevahub')) drawSevaHub(cx + 800 * scale, cy + 450 * scale);
        if (isUnlocked('hospital')) {
            drawHospital(cx + 1300 * scale, cy + 50 * scale);
            ctx.fillStyle = isNight ? '#E0E0E0' : '#4A3B2A'; ctx.font = `bold ${22 * scale}px VT323`; ctx.textAlign = 'center'; ctx.fillText("Med Bay", cx + 1300 * scale, cy + 60 * scale);
        }

        const drawPlacedItems = (ox: number, oy: number) => {
            (gameState.placedItems || []).forEach(item => {
                const ix = ox + item.x * scale;
                const iy = oy + item.y * scale;

                ctx.save();
                ctx.translate(ix, iy);

                // Draw based on item type
                if (item.item === 'pine-tree') {
                    const tx = 0, ty = 0;
                    ctx.fillStyle = '#4E342E'; ctx.fillRect(tx - 12 * scale, ty, 24 * scale, 40 * scale); ctx.strokeRect(tx - 12 * scale, ty, 24 * scale, 40 * scale);
                    const foliageC = isNight ? '#0B2E13' : '#2E7D32'; ctx.fillStyle = foliageC;
                    ctx.beginPath(); ctx.moveTo(tx - 70 * scale, ty + 10 * scale); ctx.lineTo(tx, ty - 60 * scale); ctx.lineTo(tx + 70 * scale, ty + 10 * scale); ctx.closePath(); ctx.fill(); ctx.stroke();
                    ctx.beginPath(); ctx.moveTo(tx - 55 * scale, ty - 30 * scale); ctx.lineTo(tx, ty - 100 * scale); ctx.lineTo(tx + 55 * scale, ty - 30 * scale); ctx.closePath(); ctx.fill(); ctx.stroke();
                    ctx.beginPath(); ctx.moveTo(tx - 40 * scale, ty - 70 * scale); ctx.lineTo(tx, ty - 140 * scale); ctx.lineTo(tx + 40 * scale, ty - 70 * scale); ctx.closePath(); ctx.fill(); ctx.stroke();
                } else if (item.item === 'bench') {
                    ctx.fillStyle = '#8D6E63';
                    ctx.strokeStyle = COLORS.outline;
                    ctx.fillRect(-60 * scale, -20 * scale, 120 * scale, 20 * scale); ctx.strokeRect(-60 * scale, -20 * scale, 120 * scale, 20 * scale);
                    ctx.fillRect(-50 * scale, 0, 10 * scale, 20 * scale); ctx.strokeRect(-50 * scale, 0, 10 * scale, 20 * scale);
                    ctx.fillRect(40 * scale, 0, 10 * scale, 20 * scale); ctx.strokeRect(40 * scale, 0, 10 * scale, 20 * scale);
                } else if (item.item === 'bench-back') {
                    ctx.fillStyle = '#5D4037';
                    ctx.fillRect(-60 * scale, -40 * scale, 120 * scale, 40 * scale); ctx.strokeRect(-60 * scale, -40 * scale, 120 * scale, 40 * scale);
                    ctx.fillStyle = '#8D6E63';
                    ctx.fillRect(-60 * scale, -20 * scale, 120 * scale, 20 * scale); ctx.strokeRect(-60 * scale, -20 * scale, 120 * scale, 20 * scale);
                    ctx.fillRect(-50 * scale, 0, 10 * scale, 20 * scale); ctx.strokeRect(-50 * scale, 0, 10 * scale, 20 * scale);
                    ctx.fillRect(40 * scale, 0, 10 * scale, 20 * scale); ctx.strokeRect(40 * scale, 0, 10 * scale, 20 * scale);
                } else if (item.item === 'chair') {
                    ctx.fillStyle = '#8D6E63';
                    ctx.fillRect(-20 * scale, -20 * scale, 40 * scale, 20 * scale); ctx.strokeRect(-20 * scale, -20 * scale, 40 * scale, 20 * scale);
                    ctx.fillRect(-20 * scale, -40 * scale, 5 * scale, 20 * scale); ctx.strokeRect(-20 * scale, -40 * scale, 5 * scale, 20 * scale);
                    ctx.fillRect(15 * scale, -40 * scale, 5 * scale, 20 * scale); ctx.strokeRect(15 * scale, -40 * scale, 5 * scale, 20 * scale);
                    ctx.fillRect(-20 * scale, -40 * scale, 40 * scale, 5 * scale); ctx.strokeRect(-20 * scale, -40 * scale, 40 * scale, 5 * scale);
                    ctx.fillRect(-18 * scale, 0, 5 * scale, 20 * scale); ctx.strokeRect(-18 * scale, 0, 5 * scale, 20 * scale);
                    ctx.fillRect(13 * scale, 0, 5 * scale, 20 * scale); ctx.strokeRect(13 * scale, 0, 5 * scale, 20 * scale);
                } else if (item.item === 'flower-pot') {
                    ctx.fillStyle = '#D84315';
                    ctx.beginPath(); ctx.moveTo(-15 * scale, 20 * scale); ctx.lineTo(15 * scale, 20 * scale); ctx.lineTo(20 * scale, -10 * scale); ctx.lineTo(-20 * scale, -10 * scale); ctx.closePath(); ctx.fill(); ctx.stroke();
                    ctx.fillStyle = '#4CAF50';
                    ctx.beginPath(); ctx.arc(0, -15 * scale, 15 * scale, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
                    ctx.fillStyle = '#E91E63';
                    ctx.beginPath(); ctx.arc(-5 * scale, -20 * scale, 5 * scale, 0, Math.PI * 2); ctx.fill();
                    ctx.beginPath(); ctx.arc(8 * scale, -12 * scale, 4 * scale, 0, Math.PI * 2); ctx.fill();
                }

                ctx.restore();
            });
        };
        drawPlacedItems(cx, cy);

        drawShopStall(cx - 480 * scale, cy - 250 * scale);

    }, [gameState.score, gameState.level, gameState.inventory, gameState.placedItems, gameState.unlockedZones, gameState.removedTrees, ticker, camera, zoom, showUserInfo, isNight, stars, choppingState, isVisible, onCampingClick, onTrainClick, onRestaurantClick, onHospitalClick, onGymClick, onSevaHubClick, onYogaClick]);

    return (
        <div
            className="w-full h-full relative overflow-hidden cursor-move active:cursor-grabbing transition-colors duration-1000"
            style={{ backgroundColor: isNight ? '#0D1B2A' : '#B2EBF2' }}
            onMouseDown={(e) => handleStart(e.clientX, e.clientY)}
            onMouseMove={(e) => handleMove(e.clientX, e.clientY)}
            onMouseUp={(e) => handleEnd(e)}
            onMouseLeave={() => handleEnd()}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={(e) => handleEnd(e)}
            onWheel={handleWheel}
            onDragOver={handleDragOverItem}
            onDrop={handleDropItem}
        >
            <canvas ref={canvasRef} className="w-full h-full block" />

            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center gap-4 overflow-hidden">
                {notifications.map((note) => (
                    <div
                        key={note.id}
                        className={`text-4xl font-black font-['VT323'] tracking-wider animate-float-fade drop-shadow-[0_4px_0_rgba(0,0,0,0.5)] ${note.type === 'coins' ? 'text-yellow-400' :
                            note.type === 'level' ? 'text-cyan-300' :
                                note.type === 'deduction' ? 'text-red-500' :
                                    'text-fuchsia-400'
                            }`}
                    >
                        {note.text}
                    </div>
                ))}
            </div>

            <div className="absolute top-4 right-4 z-50 pointer-events-none flex flex-col items-end gap-3 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
                <div className="flex items-center gap-3">
                    <div className="bg-yellow-400 p-1.5 rounded-full border-2 border-yellow-600 shadow-inner animate-[pulse_2s_infinite]">
                        <Coins className="text-yellow-800" size={24} strokeWidth={3} />
                    </div>
                    <div className="flex flex-col items-start">
                        <span className="text-3xl font-black font-[Nunito] text-yellow-400 select-none">
                            {gameState.score} <span className="text-xl uppercase tracking-tighter ml-1 text-white">coins</span>
                        </span>
                    </div>
                </div>

                {/* Inventory Icon */}
                <div className="flex items-center gap-2 mr-1">
                    <div className="flex flex-col items-end">
                        <span className="text-sm font-black font-[Nunito] text-stone-300 select-none uppercase tracking-wider">
                            Inventory
                        </span>
                    </div>
                    <div
                        onClick={() => setIsInventoryOpen(!isInventoryOpen)}
                        className="bg-stone-700 p-1.5 rounded-full border-2 border-stone-500 shadow-inner group cursor-pointer pointer-events-auto hover:scale-105 transition-transform active:scale-95"
                    >
                        <Backpack className="text-stone-300 group-hover:text-white transition-colors" size={20} strokeWidth={2.5} />
                    </div>
                </div>
            </div>

            {showUserInfo && (
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30">
                    <div className="bg-stone-800 border-4 border-stone-600 rounded-xl p-6 shadow-2xl flex flex-col items-center animate-[bounce_0.2s_ease-out]">
                        <div className="absolute -top-3 -right-3"><button onClick={() => setShowUserInfo(false)} className="bg-red-500 text-white rounded-full p-1 border-2 border-red-800 hover:scale-110 transition-transform"><X size={16} /></button></div>
                        <div className="w-20 h-20 bg-[#FFCC80] border-4 border-stone-700 rounded-lg mb-3 flex items-center justify-center shadow-inner"><div className="flex gap-2"><div className="w-2 h-6 bg-black/20 rounded-full"></div><div className="w-2 h-6 bg-black/20 rounded-full"></div></div></div>
                        <h3 className="text-yellow-400 font-bold text-2xl uppercase tracking-widest drop-shadow-md">Homesteader</h3>
                        <div className="flex items-center gap-2 mt-2 bg-stone-900 px-4 py-2 rounded-lg border-2 border-stone-700"><Trophy className="text-emerald-400" size={20} /><span className="text-stone-400 text-sm font-bold uppercase mr-1">Level</span><span className="text-emerald-400 font-bold font-mono text-2xl">{gameState.level}</span></div>
                        <div className="mt-3 text-stone-500 text-sm font-mono">Total Score: {gameState.score}</div>
                    </div>
                </div>
            )}
            {showWelcome && (
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-32 z-20 max-w-[280px] w-full px-4">
                    <div className="bg-white border-4 border-[#3E2723] rounded-xl p-4 shadow-xl relative animate-[bounce_3s_infinite]">
                        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[12px] border-t-[#3E2723]"></div>
                        <div className="flex justify-between items-start mb-2"><div className="flex items-center gap-2"><div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div><span className="text-[#5D4037] font-bold uppercase text-xs tracking-wider">Sprout Bot</span></div><button onClick={(e) => { e.stopPropagation(); setShowWelcome(false); }} className="text-stone-400 hover:text-[#5D4037] -mt-2 -mr-2 p-1"><X size={16} /></button></div>
                        <p className="text-[#3E2723] text-sm leading-relaxed">Welcome to your new homestead! Drag the screen to explore the map.</p>
                    </div>
                </div>
            )}

            {/* Inventory Bar */}
            <div className={`absolute bottom-0 left-0 right-0 z-40 transition-transform duration-300 ${isInventoryOpen ? 'translate-y-0' : 'translate-y-full'}`}>
                <div className="bg-[#5D4037] border-t-8 border-[#3E2723] p-4 pb-8 flex flex-col gap-2 shadow-2xl">
                    <div className="absolute -top-12 left-1/2 -translate-x-1/2">
                        <button
                            onClick={() => setIsInventoryOpen(!isInventoryOpen)}
                            className="bg-[#5D4037] text-[#FFECB3] px-6 py-2 rounded-t-xl border-t-4 border-x-4 border-[#3E2723] font-black font-[VT323] text-xl tracking-widest flex items-center gap-2 hover:bg-[#6D4C41] transition-colors"
                        >
                            {isInventoryOpen ? <ChevronDown size={20} /> : <div className="flex items-center gap-2"><Backpack size={18} /> INVENTORY</div>}
                        </button>
                    </div>

                    <div className="flex gap-4 overflow-x-auto pb-2 px-2 no-scrollbar">
                        {gameState.inventory.length === 0 ? (
                            <div className="w-full text-center text-[#A1887F] font-mono italic py-4">Your backpack is empty. Vist the Shop!</div>
                        ) : (
                            gameState.inventory.map((item, idx) => {
                                const shopItem = SHOP_ITEMS.find(i => i.id === item);
                                return (
                                    <div
                                        key={`${item}-${idx}`}
                                        draggable
                                        onDragStart={(e) => handleDragStartItem(e, item)}
                                        className="min-w-[80px] h-[100px] bg-[#8D6E63] rounded-lg border-4 border-[#3E2723] flex flex-col items-center justify-center cursor-grab active:cursor-grabbing hover:bg-[#A1887F] transition-colors relative group"
                                    >
                                        <div className="text-4xl filter drop-shadow-md transition-transform group-hover:scale-110">
                                            {shopItem ? shopItem.emoji : '📦'}
                                        </div>
                                        <div className="absolute bottom-1 w-full text-center text-[10px] font-bold text-[#FFECB3] uppercase truncate px-1">
                                            {shopItem ? shopItem.name : item}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>

            <style>{`
          @keyframes float-fade {
            0% { transform: translateY(20px); opacity: 0; }
            15% { transform: translateY(0); opacity: 1; }
            80% { transform: translateY(-40px); opacity: 1; }
            100% { transform: translateY(-60px); opacity: 0; }
          }
          .animate-float-fade {
            animation: float-fade 2.5s ease-out forwards;
          }
          .no-scrollbar::-webkit-scrollbar {
              display: none;
          }
          .no-scrollbar {
              -ms-overflow-style: none;
              scrollbar-width: none;
          }
        `}</style>
        </div>
    );
};

export default PixelGarden;