window.onload = function () {
	const CONFIG = {
		bodyRadius: 50,
		totalTentacles: 14,
		swirlyStart: 4,
		swirlyEnd: 9,
		segments: 18,
		stringyMin: 200,
		stringyMax: 340,
		swirlyMin: 120,
		swirlyMax: 220,
	};

	const canvas = document.getElementById('water-canvas');
	const ctx = canvas.getContext('2d');

	function resizeCanvas() {
		const dpr = Math.max(1, window.devicePixelRatio || 1);
		canvas.width = Math.floor(window.innerWidth * dpr);
		canvas.height = Math.floor(window.innerHeight * dpr);
		ctx.setTransform(1, 0, 0, 1, 0, 0);
		ctx.scale(dpr, dpr);
	}
	resizeCanvas();
	window.addEventListener('resize', resizeCanvas);

	let jellyfishX = window.innerWidth / 2;
	let jellyfishY = window.innerHeight / 2;
	let jellyfishAngle = 0;
	let jellyfishTargetX = jellyfishX;
	let jellyfishTargetY = jellyfishY;
	let lastPointerType = window.matchMedia('(pointer: coarse)').matches ? 'touch' : 'mouse';

	function updateJellyfishPointer(x, y) {
		jellyfishTargetX = x;
		jellyfishTargetY = y;
	}
	window.addEventListener('pointermove', (e) => {
		lastPointerType = e.pointerType || lastPointerType;
		updateJellyfishPointer(e.clientX, e.clientY);
	}, { passive: true });
	window.addEventListener('pointerdown', (e) => {
		lastPointerType = e.pointerType || lastPointerType;
		updateJellyfishPointer(e.clientX, e.clientY);
	}, { passive: true });

	let gradientShift = 0;
	let gradientLightCycle = Math.PI * 1.5;

	const bubbleCount = 220;
	const bubbles = [];
	function randomBetween(a, b) { return a + Math.random() * (b - a); }
	function randomBubbleRadius() {
		const r = Math.random();
		if (r < 0.65) return randomBetween(3, 8);
		if (r < 0.9)  return randomBetween(8, 14);
		return randomBetween(14, 18);
	}
	for (let i = 0; i < bubbleCount; i++) {
		bubbles.push({
			x: randomBetween(0, window.innerWidth),
			y: randomBetween(0, window.innerHeight),
			r: randomBubbleRadius(),
			speed: randomBetween(1.5, 4),
			alpha: randomBetween(0.1, 0.22),
			vx: 0,
			vy: 0,
		});
	}

	function drawGradient() {
		gradientShift += 0.002;
		gradientLightCycle += 0.0012;
		const minTop = 7, maxTop = 18;
		const minMid = 4, maxMid = 12;
		const minBot = 2, maxBot = 7;
		const lightnessBase = minTop + (maxTop - minTop) * (0.5 + 0.5 * Math.sin(gradientLightCycle));
		const midLightness = minMid + (maxMid - minMid) * (0.5 + 0.5 * Math.sin(gradientLightCycle + 1.2));
		const bottomLightness = minBot + (maxBot - minBot) * (0.5 + 0.5 * Math.sin(gradientLightCycle + 2.4));
		const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
		grad.addColorStop(0, `hsl(220, 100%, ${lightnessBase + 5 * Math.sin(gradientShift)}%)`);
		grad.addColorStop(0.5, `hsl(220, 100%, ${midLightness + 3 * Math.cos(gradientShift)}%)`);
		grad.addColorStop(1, `hsl(210, 100%, ${bottomLightness + 2 * Math.sin(gradientShift + 1)}%)`);
		ctx.fillStyle = grad;
		ctx.fillRect(0, 0, canvas.width, canvas.height);
	}

	function drawBubbles() {
		for (let b of bubbles) {
			ctx.save();
			ctx.globalAlpha = b.alpha;
			ctx.beginPath();
			ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
			ctx.fillStyle = 'rgba(19, 26, 130, 0.5)';
			ctx.fill();
			ctx.lineWidth = 1;
			ctx.strokeStyle = 'rgba(255, 255, 255, 0.95)';
			ctx.stroke();
			const hx = b.x - b.r * 0.4;
			const hy = b.y - b.r * 0.4;
			const hr = b.r * 0.28;
			const g1 = ctx.createRadialGradient(hx, hy, hr * 0.1, hx, hy, hr);
			g1.addColorStop(0, 'rgba(255,255,255,0.85)');
			g1.addColorStop(1, 'rgba(255,255,255,0)');
			ctx.beginPath();
			ctx.arc(hx, hy, hr, 0, Math.PI * 2);
			ctx.fillStyle = g1;
			ctx.fill();
			const sx = b.x + b.r * 0.25;
			const sy = b.y + b.r * 0.25;
			const sr = b.r * 0.13;
			const g2 = ctx.createRadialGradient(sx, sy, sr * 0.1, sx, sy, sr);
			g2.addColorStop(0, 'rgba(255,255,255,0.25)');
			g2.addColorStop(1, 'rgba(255,255,255,0)');
			ctx.beginPath();
			ctx.arc(sx, sy, sr, 0, Math.PI * 2);
			ctx.fillStyle = g2;
			ctx.fill();
			ctx.restore();
		}
	}

	function updateBubbles() {
		for (let b of bubbles) {
			const dx = b.x - jellyfishX;
			const dy = b.y - jellyfishY;
			const dist = Math.hypot(dx, dy);
			const repelRadius = 80;
			if (dist < repelRadius) {
				const force = ((repelRadius - dist) / repelRadius) * 7.5;
				const ang = Math.atan2(dy, dx);
				b.vx += Math.cos(ang) * force;
				b.vy += Math.sin(ang) * force;
			}
			b.vy = b.vy * 0.88 - b.speed * 0.13;
			b.x += b.vx;
			b.y += b.vy;
			b.vx *= 0.88;
			b.vy *= 0.88;
			if (b.y + b.r < 0) {
				b.x = randomBetween(0, window.innerWidth);
				b.y = window.innerHeight + b.r + randomBetween(0, window.innerHeight * 0.5);
				b.r = randomBubbleRadius();
				b.speed = randomBetween(1.5, 4);
				b.alpha = randomBetween(0.1, 0.22);
				b.vx = 0;
				b.vy = 0;
			}
		}
	}

	function drawJellyfishPlaceholder(vx, vy) {
		const now = performance.now();
		const hue1 = (now / 50) % 360;
		const hue2 = (hue1 + 30) % 360;
		const jellyColor1 = `hsl(${hue1}, 80%, 75%)`;
		const jellyStroke = `hsl(${hue1}, 80%, 45%)`;

		const angle = -jellyfishAngle, cosA = Math.cos(angle), sinA = Math.sin(angle);
		const localVX = vx * cosA - vy * sinA;
		const localVY = vx * sinA + vy * cosA;
		const toPX = jellyfishTargetX - jellyfishX;
		const toPY = jellyfishTargetY - jellyfishY;
		const localPX = toPX * cosA - toPY * sinA;
		const localPY = toPX * sinA + toPY * cosA;

		ctx.save();
		ctx.translate(jellyfishX, jellyfishY);
		ctx.rotate(jellyfishAngle);

		const { bodyRadius, totalTentacles, swirlyStart, swirlyEnd, segments, stringyMin, stringyMax, swirlyMin, swirlyMax } = CONFIG;

		for (let i = 0; i < totalTentacles; i++) {
			if (i >= swirlyStart && i <= swirlyEnd) {
				const overlapCount = 2;
				for (let o = 0; o < overlapCount; o++) {
					const arcAngle = Math.PI * (i + 1 + (o - 0.5) * 0.25) / (totalTentacles + 1);
					const baseX = bodyRadius * Math.cos(arcAngle - Math.PI);
					const baseY = bodyRadius * Math.sin(arcAngle - Math.PI);
					const centerIdx = (swirlyStart + swirlyEnd) / 2;
					const len = stringyMax - (Math.abs(i - centerIdx) / ((swirlyEnd - swirlyStart) / 2)) * (stringyMax - stringyMin);
					ctx.beginPath();
					ctx.moveTo(baseX, baseY);
					let px = baseX, py = baseY;
					for (let j = 1; j <= segments; j++) {
						const t = j / segments;
						const ease = 1 - Math.pow(1 - t, 3);
						const wave1 = Math.sin(now * 0.003 + i * 0.7 + t * 2 * Math.PI) * 14 * Math.pow(t, 2.1);
						const wave2 = Math.sin(now * 0.0016 + i * 0.35 + t * 4 * Math.PI) * 6 * Math.pow(t, 3);
						const drag = (-localVX * 4 - localVY * 1.2) * ease;
						const reach = localPX * 0.08 * Math.pow(t, 2.3);
						const sway = wave1 + wave2 + drag + reach;
						const stretch = Math.max(0, localPY) * 0.06 * Math.pow(t, 1.7);
						px = baseX + sway;
						py = baseY + t * len + stretch;
						ctx.lineTo(px, py);
					}
					ctx.save();
					ctx.strokeStyle = jellyStroke;
					ctx.globalAlpha = 0.35;
					ctx.lineWidth = 1.2;
					ctx.stroke();
					ctx.restore();
				}
			}

			const arcAngle = Math.PI * (i + 1) / (totalTentacles + 1);
			const baseX = bodyRadius * Math.cos(arcAngle - Math.PI);
			const baseY = bodyRadius * Math.sin(arcAngle - Math.PI);
			let tentacleLen, isSwirly;
			if (i >= swirlyStart && i <= swirlyEnd) {
				isSwirly = true;
				tentacleLen = swirlyMax - (Math.abs(i - (swirlyStart + swirlyEnd) / 2) / ((swirlyEnd - swirlyStart) / 2)) * (swirlyMax - swirlyMin);
			} else {
				isSwirly = false;
				const stringyCenter = (totalTentacles - (swirlyEnd - swirlyStart + 1) - 1) / 2;
				const stringyIndex = i < swirlyStart ? i : i - (swirlyEnd - swirlyStart + 1);
				const stringyDist = Math.abs(stringyIndex - stringyCenter);
				tentacleLen = stringyMax - (stringyDist / stringyCenter) * (stringyMax - stringyMin);
			}

			ctx.beginPath();
			ctx.moveTo(baseX, baseY);
			let px = baseX, py = baseY;
			for (let j = 1; j <= segments; j++) {
				const t = j / segments;
				const ease = 1 - Math.pow(1 - t, 3);
				const wave1 = Math.sin(now * 0.0028 + i + t * 2 * Math.PI) * 18 * Math.pow(t, 2.2);
				const wave2 = Math.sin(now * 0.0013 + i * 0.33 + t * 4 * Math.PI) * 7 * Math.pow(t, 3);
				const drag = (-localVX * 4.5 - localVY * 1.3) * ease;
				const reach = localPX * 0.1 * Math.pow(t, 2.4);
				const sway = wave1 + wave2 + drag + reach;
				const stretch = Math.max(0, localPY) * 0.065 * Math.pow(t, 1.8);
				px = baseX + sway;
				py = baseY + t * tentacleLen + stretch;
				ctx.lineTo(px, py);
			}

			const grad = ctx.createLinearGradient(baseX, baseY, px, py);
			grad.addColorStop(0, jellyColor1);
			grad.addColorStop(0.15, jellyStroke);
			grad.addColorStop(1, jellyStroke);
			ctx.save();
			ctx.strokeStyle = grad;
			ctx.globalAlpha = 0.7;
			ctx.stroke();
			ctx.restore();
			ctx.save();
			ctx.globalAlpha = isSwirly ? 0.5 : 0.35;
			ctx.lineWidth = isSwirly ? 3.5 : 1.2;
			ctx.strokeStyle = jellyStroke;
			ctx.stroke();
			ctx.globalAlpha = 1.0;
			ctx.restore();
		}

		ctx.save();
		ctx.beginPath();
		ctx.ellipse(0, 0, CONFIG.bodyRadius, 70, 0, Math.PI, 0, false);
		ctx.lineTo(CONFIG.bodyRadius, 0);
		ctx.lineTo(-CONFIG.bodyRadius, 0);
		ctx.closePath();
		const headGradient = ctx.createLinearGradient(0, -70, 0, 0);
		headGradient.addColorStop(0, `hsla(${hue1}, 80%, 75%, 0.99)`);
		headGradient.addColorStop(0.7, `hsla(${hue2}, 80%, 75%, 0.7)`);
		headGradient.addColorStop(1, `hsla(${hue2}, 80%, 75%, 0.18)`);
		ctx.fillStyle = headGradient;
		ctx.fill();
		ctx.beginPath();
		ctx.ellipse(0, 0, CONFIG.bodyRadius, 70, 0, Math.PI, 0, false);
		ctx.strokeStyle = `hsl(${hue1}, 80%, 45%)`;
		ctx.lineWidth = 3;
		ctx.stroke();
		ctx.restore();
		ctx.restore();
	}

	function animate() {
		const lerp = (a, b, t) => a + (b - a) * t;
		const prevX = jellyfishX;
		const prevY = jellyfishY;
		const followSpeed = { mouse: 0.2, pen: 0.18, touch: 0.1 };
		const rotateSpeed = { mouse: 0.25, pen: 0.22, touch: 0.18 };
		const activeFollow = followSpeed[lastPointerType] ?? (window.matchMedia('(pointer: coarse)').matches ? 0.1 : 0.2);
		const activeRotate = rotateSpeed[lastPointerType] ?? (window.matchMedia('(pointer: coarse)').matches ? 0.18 : 0.25);
		jellyfishX = lerp(jellyfishX, jellyfishTargetX, activeFollow);
		jellyfishY = lerp(jellyfishY, jellyfishTargetY, activeFollow);
		const dx = jellyfishX - prevX;
		const dy = jellyfishY - prevY;
		if (dx !== 0 || dy !== 0) {
			const targetAngle = Math.atan2(dy, dx) + Math.PI / 2;
			function lerpAngle(a, b, t) {
				let diff = b - a;
				while (diff > Math.PI) diff -= 2 * Math.PI;
				while (diff < -Math.PI) diff += 2 * Math.PI;
				return a + diff * t;
			}
			jellyfishAngle = lerpAngle(jellyfishAngle, targetAngle, activeRotate);
		}

		drawGradient();
		updateBubbles();
		drawBubbles();
		drawJellyfishPlaceholder(dx, dy);
		requestAnimationFrame(animate);
	}

	animate();
};