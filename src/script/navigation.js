import { debounce } from './utils.js';
import { navigate } from 'astro:transitions/client';

// Page navigation order
const pageOrder = ['/', '/whoami/', '/projects/', '/writings/', '/contact/'];

let currentIndex = 0;
let isNavigating = false;
let listenersAttached = false;

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

// Handle wheel events for scroll navigation
const handleWheel = debounce(async (event) => {
	if (isNavigating || !shouldEnableNavigation()) return;
	
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
	
	try {
		await navigate(targetPage);
	} catch (error) {
		console.error('Navigation error:', error);
	}
	
	// Reset navigation flag after transition
	setTimeout(() => {
		isNavigating = false;
	}, 500);
}, 150);

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

const handleTouchEnd = debounce(async (event) => {
	if (isNavigating || !shouldEnableNavigation()) return;
	
	const touch = event.changedTouches[0];
	touchEndY = touch.screenY;
	touchEndX = touch.screenX;
	
	const deltaY = touchStartY - touchEndY;
	const deltaX = Math.abs(touchStartX - touchEndX);
	const touchDuration = Date.now() - touchStartTime;
	
	// Only handle vertical swipes that are:
	// 1. Primarily vertical (deltaX < deltaY)
	// 2. Have sufficient distance (> 50px)
	// 3. Are quick enough (< 500ms) to be intentional
	// 4. Are not too quick (> 50ms) to avoid accidental triggers
	if (Math.abs(deltaY) < 50 || 
		deltaX > Math.abs(deltaY) || 
		touchDuration > 500 || 
		touchDuration < 50) {
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
	
	try {
		await navigate(targetPage);
	} catch (error) {
		console.error('Navigation error:', error);
	}
	
	setTimeout(() => {
		isNavigating = false;
	}, 500);
}, 150);

// Handle keyboard navigation
const handleKeyDown = async (event) => {
	if (isNavigating || !shouldEnableNavigation()) return;
	
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
	
	try {
		await navigate(targetPage);
	} catch (error) {
		console.error('Navigation error:', error);
	}
	
	setTimeout(() => {
		isNavigating = false;
	}, 500);
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
	// Small delay to ensure DOM is ready
	setTimeout(() => {
		initializeNavigation();
	}, 50);
});

// Clean up before page transitions
document.addEventListener('astro:before-swap', () => {
	removeListeners();
}); 