import { debounce } from './utils.js';
import { navigate } from 'astro:transitions/client';

// Page navigation order
const pageOrder = ['/', '/whoami/', '/projects/', '/writings/', '/contact/'];

let currentIndex = 0;
let isNavigating = false;
let listenersAttached = false;
let lastNavigationTime = 0;
const NAVIGATION_COOLDOWN = 250; // Reduced cooldown for faster response

// Function to check if current page should have scroll navigation
function shouldEnableNavigation() {
	// Check if the Content component is present on the page
	const contentElement = document.querySelector('.content-navigation-enabled');
	return contentElement !== null;
}

// Function to update current index based on current path
function updateCurrentIndex() {
	const currentPath = window.location.pathname;
	const index = pageOrder.indexOf(currentPath);
	currentIndex = index !== -1 ? index : 0;
}

// Handle wheel events for scroll navigation - minimal debounce for maximum responsiveness
const handleWheel = debounce(async (event) => {
	if (isNavigating || !shouldEnableNavigation()) return;
	
	// Add cooldown to prevent rapid navigation
	const now = Date.now();
	if (now - lastNavigationTime < NAVIGATION_COOLDOWN) return;
	
	event.preventDefault();
	
	let targetIndex;
	if (event.deltaY > 0) {
		// Scroll down - go to next page
		targetIndex = (currentIndex + 1) % pageOrder.length;
	} else {
		// Scroll up - go to previous page  
		targetIndex = (currentIndex - 1 + pageOrder.length) % pageOrder.length;
	}
	
	const targetPage = pageOrder[targetIndex];
	
	isNavigating = true;
	lastNavigationTime = now;
	
	try {
		await navigate(targetPage);
	} catch (error) {
		console.error('Navigation error:', error);
	}
	
	// Minimal timeout for faster responsiveness
	setTimeout(() => {
		isNavigating = false;
	}, 150); // Further reduced timeout
}, 30); // Minimal debounce delay for near-instant response

// Handle touch events for mobile
let touchStartY = 0;
let touchEndY = 0;
let touchStartX = 0;
let touchEndX = 0;
let touchStartTime = 0;

const handleTouchStart = (event) => {
	if (!shouldEnableNavigation()) return;
	
	const touch = event.changedTouches[0];
	touchStartY = touch.screenY;
	touchStartX = touch.screenX;
	touchStartTime = Date.now();
};

// Touch events with navigation cooldown
const handleTouchEnd = debounce(async (event) => {
	if (isNavigating || !shouldEnableNavigation()) return;
	
	// Add cooldown to prevent rapid navigation
	const now = Date.now();
	if (now - lastNavigationTime < NAVIGATION_COOLDOWN) return;
	
	const touch = event.changedTouches[0];
	touchEndY = touch.screenY;
	touchEndX = touch.screenX;
	
	const deltaY = touchStartY - touchEndY;
	const deltaX = Math.abs(touchStartX - touchEndX);
	const touchDuration = Date.now() - touchStartTime;
	
	// Relaxed constraints for better responsiveness
	if (Math.abs(deltaY) < 30 || 
		deltaX > Math.abs(deltaY) || 
		touchDuration > 500 || 
		touchDuration < 30) { // Reduced minimum time
		return;
	}
	
	// Prevent default behavior for our custom navigation
	event.preventDefault();
	
	let targetIndex;
	if (deltaY > 0) {
		// Swipe up - go to next page
		targetIndex = (currentIndex + 1) % pageOrder.length;
	} else {
		// Swipe down - go to previous page
		targetIndex = (currentIndex - 1 + pageOrder.length) % pageOrder.length;
	}
	
	const targetPage = pageOrder[targetIndex];
	
	isNavigating = true;
	lastNavigationTime = now;
	
	try {
		await navigate(targetPage);
	} catch (error) {
		console.error('Navigation error:', error);
	}
	
	setTimeout(() => {
		isNavigating = false;
	}, 150);
}, 25); // Faster touch debounce

// Handle keyboard navigation
const handleKeyDown = async (event) => {
	if (isNavigating || !shouldEnableNavigation()) return;
	
	// Add cooldown to prevent rapid navigation
	const now = Date.now();
	if (now - lastNavigationTime < NAVIGATION_COOLDOWN) return;
	
	let targetIndex;
	switch(event.key) {
		case 'ArrowDown':
		case ' ':
			event.preventDefault();
			targetIndex = (currentIndex + 1) % pageOrder.length;
			break;
		case 'ArrowUp':
			event.preventDefault();
			targetIndex = (currentIndex - 1 + pageOrder.length) % pageOrder.length;
			break;
		default:
			return;
	}
	
	const targetPage = pageOrder[targetIndex];
	
	isNavigating = true;
	lastNavigationTime = now;
	
	try {
		await navigate(targetPage);
	} catch (error) {
		console.error('Navigation error:', error);
	}
	
	setTimeout(() => {
		isNavigating = false;
	}, 150);
};

// Function to attach event listeners
function attachListeners() {
	if (listenersAttached) return;
	
	document.addEventListener('wheel', handleWheel, { passive: false });
	document.addEventListener('touchstart', handleTouchStart, { passive: true });
	document.addEventListener('touchend', handleTouchEnd, { passive: false });
	document.addEventListener('keydown', handleKeyDown);
	
	listenersAttached = true;
}

// Function to remove event listeners
function removeListeners() {
	if (!listenersAttached) return;
	
	document.removeEventListener('wheel', handleWheel);
	document.removeEventListener('touchstart', handleTouchStart);
	document.removeEventListener('touchend', handleTouchEnd);
	document.removeEventListener('keydown', handleKeyDown);
	
	listenersAttached = false;
}

// Function to initialize navigation
function initializeNavigation() {
	updateCurrentIndex();
	
	// Only attach listeners if navigation should be enabled
	if (shouldEnableNavigation()) {
		attachListeners();
	} else {
		// Remove listeners if navigation should be disabled
		removeListeners();
	}
}

// Initialize on first load
initializeNavigation();

// Re-initialize after each page transition
document.addEventListener('astro:page-load', () => {
	// Reset navigation state on page load
	isNavigating = false;
	lastNavigationTime = 0;
	
	// Immediate initialization
	setTimeout(() => {
		initializeNavigation();
	}, 10); // Minimal delay
});

// Clean up before page transitions
document.addEventListener('astro:before-swap', () => {
	removeListeners();
}); 